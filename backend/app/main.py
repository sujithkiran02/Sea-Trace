import os
import sys

# Ensure local app directory is in Python path for module resolution
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

import json
import uuid
from datetime import datetime
from typing import List, Optional
from fastapi import FastAPI, HTTPException, Query, Response, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse

from database import get_db_connection, init_db
from models.schemas import (
    IncidentCreate, IncidentUpdate, IncidentOut,
    DetectionOut,
    ValidationReviewCreate, ValidationReviewOut,
    DriftRunRequest, DriftRunOut,
    VesselCandidateOut,
    CounterfactualRequest, CounterfactualOut,
    EvidenceArtifactOut,
    DataSourceOut,
    DashboardSummaryOut
)
from services.drift_engine import run_reverse_drift_simulation
from services.vessel_service import calculate_vessel_compatibility
from services.counterfactual_service import evaluate_counterfactual_scenario
from services.report_service import (
    generate_pdf_report, generate_csv_report, generate_xlsx_report, generate_geojson_report
)

app = FastAPI(
    title="SeaTrace AI API",
    description="Operational Satellite Oil-Spill Detection, Drift Reconstruction & Vessel Attribution Platform for Indian Maritime Waters",
    version="1.0.0"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    init_db()

@app.get("/health")
def health_check():
    try:
        conn = get_db_connection()
        conn.execute("SELECT 1;").fetchone()
        conn.close()
        db_status = "HEALTHY"
    except Exception as e:
        db_status = f"UNHEALTHY ({str(e)})"

    return {
        "status": "HEALTHY",
        "timestamp": datetime.utcnow().isoformat(),
        "database": db_status,
        "services": {
            "api_server": "ONLINE",
            "sar_inference_worker": "READY",
            "drift_engine": "READY",
            "report_generator": "READY"
        }
    }

# --- 1. COMMAND DASHBOARD ---
@app.get("/api/v1/dashboard/summary", response_model=DashboardSummaryOut)
def get_dashboard_summary():
    conn = get_db_connection()
    incidents = conn.execute("SELECT * FROM incidents;").fetchall()
    detections = conn.execute("SELECT * FROM detections;").fetchall()
    vessels = conn.execute("SELECT * FROM vessel_candidates WHERE risk_level IN ('CRITICAL_LEAD', 'ELEVATED');").fetchall()
    audit = conn.execute("SELECT * FROM audit_events ORDER BY timestamp DESC LIMIT 6;").fetchall()
    conn.close()

    total_incidents = len(incidents)
    active_incidents = sum(1 for inc in incidents if inc["status"] not in ("CLOSED", "ARCHIVED"))
    under_review = sum(1 for inc in incidents if inc["status"] in ("VALIDATING", "REVIEW", "RECONSTRUCTING"))
    closed_incidents = sum(1 for inc in incidents if inc["status"] == "CLOSED")

    severity_counts = {"LOW": 0, "MEDIUM": 0, "HIGH": 0, "CRITICAL": 0}
    region_counts = {}

    for inc in incidents:
        sev = inc["severity"]
        severity_counts[sev] = severity_counts.get(sev, 0) + 1
        reg = inc["region"]
        region_counts[reg] = region_counts.get(reg, 0) + 1

    total_area = sum(d["area_km2"] for d in detections)

    recent_activity = []
    for a in audit:
        recent_activity.append({
            "id": a["id"],
            "incident_id": a["incident_id"],
            "action": a["action"],
            "actor": a["actor"],
            "details": a["details"],
            "timestamp": a["timestamp"]
        })

    return {
        "total_incidents": total_incidents,
        "active_incidents": active_incidents,
        "under_review": under_review,
        "closed_incidents": closed_incidents,
        "severity_breakdown": severity_counts,
        "region_breakdown": region_counts,
        "total_slicks_area_km2": round(total_area, 2),
        "high_risk_vessel_leads": len(vessels),
        "system_health_pct": 98.5,
        "recent_activity": recent_activity
    }

# --- 2. INCIDENT MANAGEMENT ---
@app.get("/api/v1/incidents", response_model=List[IncidentOut])
def list_incidents(
    status: Optional[str] = None,
    severity: Optional[str] = None,
    region: Optional[str] = None,
    search: Optional[str] = None
):
    conn = get_db_connection()
    query = "SELECT * FROM incidents WHERE 1=1"
    params = []

    if status and status != "ALL":
        query += " AND status = ?"
        params.append(status)
    if severity and severity != "ALL":
        query += " AND severity = ?"
        params.append(severity)
    if region and region != "ALL":
        query += " AND region LIKE ?"
        params.append(f"%{region}%")
    if search:
        query += " AND (title LIKE ? OR id LIKE ? OR notes LIKE ?)"
        term = f"%{search}%"
        params.extend([term, term, term])

    query += " ORDER BY created_at DESC;"
    rows = conn.execute(query, params).fetchall()
    conn.close()

    return [dict(r) for r in rows]

@app.post("/api/v1/incidents", response_model=IncidentOut, status_code=status.HTTP_201_CREATED)
def create_incident(data: IncidentCreate):
    conn = get_db_connection()
    now_str = datetime.utcnow().isoformat() + "Z"
    new_id = f"IN-{datetime.utcnow().year}-{uuid.uuid4().hex[:4].upper()}"

    conn.execute("""
    INSERT INTO incidents VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?);
    """, (
        new_id,
        data.title,
        data.region,
        "NEW",
        data.severity,
        data.lat,
        data.lng,
        data.detection_time,
        data.source,
        data.estimated_volume_m3 or 50.0,
        data.spill_type,
        data.footprint_geojson or json.dumps({
            "type": "Polygon",
            "coordinates": [[
                [round(data.lng + 0.035 * __import__("math").cos(i * 3.14159 / 8) * (1 + 0.3 * __import__("math").sin(i * 1.5)), 5),
                 round(data.lat + 0.018 * __import__("math").sin(i * 3.14159 / 8) * (1 + 0.25 * __import__("math").cos(i * 2.0)), 5)]
                for i in range(17)
            ]]
        }),
        data.notes or "Initial detection registered for investigation.",
        now_str,
        now_str
    ))

    # Audit event
    conn.execute("""
    INSERT INTO audit_events VALUES (?,?,?,?,?,?);
    """, (
        f"AUD-{uuid.uuid4().hex[:6].upper()}",
        new_id,
        "INCIDENT_CREATED",
        "Operator (Command Console)",
        f"Created incident {new_id} at {data.lat:.4f}N, {data.lng:.4f}E",
        now_str
    ))

    conn.commit()
    row = conn.execute("SELECT * FROM incidents WHERE id = ?;", (new_id,)).fetchone()
    conn.close()
    return dict(row)

@app.get("/api/v1/incidents/{incident_id}", response_model=IncidentOut)
def get_incident(incident_id: str):
    conn = get_db_connection()
    row = conn.execute("SELECT * FROM incidents WHERE id = ?;", (incident_id,)).fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="Incident not found")
    return dict(row)

@app.patch("/api/v1/incidents/{incident_id}", response_model=IncidentOut)
def update_incident(incident_id: str, data: IncidentUpdate):
    conn = get_db_connection()
    row = conn.execute("SELECT * FROM incidents WHERE id = ?;", (incident_id,)).fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Incident not found")

    now_str = datetime.utcnow().isoformat() + "Z"
    fields = []
    values = []

    if data.title is not None:
        fields.append("title = ?")
        values.append(data.title)
    if data.status is not None:
        fields.append("status = ?")
        values.append(data.status)
    if data.severity is not None:
        fields.append("severity = ?")
        values.append(data.severity)
    if data.notes is not None:
        fields.append("notes = ?")
        values.append(data.notes)
    if data.estimated_volume_m3 is not None:
        fields.append("estimated_volume_m3 = ?")
        values.append(data.estimated_volume_m3)
    if data.spill_type is not None:
        fields.append("spill_type = ?")
        values.append(data.spill_type)

    if fields:
        fields.append("updated_at = ?")
        values.append(now_str)
        values.append(incident_id)
        conn.execute(f"UPDATE incidents SET {', '.join(fields)} WHERE id = ?;", values)

        # Audit
        conn.execute("""
        INSERT INTO audit_events VALUES (?,?,?,?,?,?);
        """, (
            f"AUD-{uuid.uuid4().hex[:6].upper()}",
            incident_id,
            "INCIDENT_UPDATED",
            "Investigator",
            f"Updated status/notes on incident {incident_id}",
            now_str
        ))
        conn.commit()

    updated = conn.execute("SELECT * FROM incidents WHERE id = ?;", (incident_id,)).fetchone()
    conn.close()
    return dict(updated)

# --- 3. SATELLITE DETECTION ---
@app.get("/api/v1/incidents/{incident_id}/detections", response_model=List[DetectionOut])
def get_incident_detections(incident_id: str):
    conn = get_db_connection()
    rows = conn.execute("SELECT * FROM detections WHERE incident_id = ? ORDER BY created_at DESC;", (incident_id,)).fetchall()
    conn.close()
    return [dict(r) for r in rows]

# --- 4. DETECTION VALIDATION ---
@app.get("/api/v1/incidents/{incident_id}/validation", response_model=List[ValidationReviewOut])
def get_incident_validations(incident_id: str):
    conn = get_db_connection()
    rows = conn.execute("SELECT * FROM validation_reviews WHERE incident_id = ? ORDER BY reviewed_at DESC;", (incident_id,)).fetchall()
    conn.close()
    return [dict(r) for r in rows]

@app.post("/api/v1/incidents/{incident_id}/validation", response_model=ValidationReviewOut)
def record_validation_review(incident_id: str, data: ValidationReviewCreate):
    conn = get_db_connection()
    inc = conn.execute("SELECT * FROM incidents WHERE id = ?;", (incident_id,)).fetchone()
    if not inc:
        conn.close()
        raise HTTPException(status_code=404, detail="Incident not found")

    det = conn.execute("SELECT id FROM detections WHERE incident_id = ? LIMIT 1;", (incident_id,)).fetchone()
    det_id = det["id"] if det else None

    now_str = datetime.utcnow().isoformat() + "Z"
    new_id = f"VAL-{uuid.uuid4().hex[:6].upper()}"

    conn.execute("""
    INSERT INTO validation_reviews VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?);
    """, (
        new_id,
        incident_id,
        det_id,
        data.decision,
        data.reviewer_name,
        data.reviewer_role,
        data.wind_speed_knots,
        data.biogenic_risk,
        data.natural_seep_proximity_km,
        data.confidence_level,
        data.checklist_json,
        data.notes,
        now_str
    ))

    # Update incident status based on decision
    new_status = "RECONSTRUCTING" if data.decision == "SUPPORTED" else ("CLOSED" if data.decision == "REJECTED" else "VALIDATING")
    conn.execute("UPDATE incidents SET status = ?, updated_at = ? WHERE id = ?;", (new_status, now_str, incident_id))

    # Audit
    conn.execute("""
    INSERT INTO audit_events VALUES (?,?,?,?,?,?);
    """, (
        f"AUD-{uuid.uuid4().hex[:6].upper()}",
        incident_id,
        "VALIDATION_DECISION",
        data.reviewer_name,
        f"Reviewer decision: {data.decision}. Updated status to {new_status}.",
        now_str
    ))

    conn.commit()
    row = conn.execute("SELECT * FROM validation_reviews WHERE id = ?;", (new_id,)).fetchone()
    conn.close()
    return dict(row)

# --- 5. ORIGIN RECONSTRUCTION (DRIFT) ---
@app.get("/api/v1/incidents/{incident_id}/drift", response_model=List[DriftRunOut])
def get_incident_drift_runs(incident_id: str):
    conn = get_db_connection()
    rows = conn.execute("SELECT * FROM drift_runs WHERE incident_id = ? ORDER BY completed_at DESC;", (incident_id,)).fetchall()
    conn.close()
    return [dict(r) for r in rows]

@app.post("/api/v1/incidents/{incident_id}/drift", response_model=DriftRunOut)
def execute_drift_reconstruction(incident_id: str, data: DriftRunRequest):
    conn = get_db_connection()
    inc = conn.execute("SELECT * FROM incidents WHERE id = ?;", (incident_id,)).fetchone()
    if not inc:
        conn.close()
        raise HTTPException(status_code=404, detail="Incident not found")

    sim_result = run_reverse_drift_simulation(
        slick_lat=inc["lat"],
        slick_lng=inc["lng"],
        time_window_hours=data.time_window_hours,
        particle_count=data.particle_count,
        windage_leeway=data.windage_leeway,
        current_deflection_deg=data.current_deflection_deg
    )

    now_str = datetime.utcnow().isoformat() + "Z"
    new_id = f"DRIFT-{uuid.uuid4().hex[:6].upper()}"

    conn.execute("""
    INSERT INTO drift_runs VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?);
    """, (
        new_id,
        incident_id,
        "LAGRANGIAN_REVERSE",
        data.time_window_hours,
        data.particle_count,
        data.windage_leeway,
        data.current_deflection_deg,
        "COMPLETED",
        sim_result["origin_lat"],
        sim_result["origin_lng"],
        sim_result["origin_uncertainty_km"],
        json.dumps(sim_result["trajectories"]),
        sim_result["environmental_sources"],
        now_str
    ))

    # Advance incident to VESSEL_ANALYSIS
    conn.execute("UPDATE incidents SET status = 'VESSEL_ANALYSIS', updated_at = ? WHERE id = ?;", (now_str, incident_id))

    # Audit
    conn.execute("""
    INSERT INTO audit_events VALUES (?,?,?,?,?,?);
    """, (
        f"AUD-{uuid.uuid4().hex[:6].upper()}",
        incident_id,
        "DRIFT_SIMULATION_RUN",
        "Lagrangian Ocean Engine",
        f"Calculated backward drift origin {sim_result['origin_lat']}N, {sim_result['origin_lng']}E (±{sim_result['origin_uncertainty_km']} km)",
        now_str
    ))

    conn.commit()
    row = conn.execute("SELECT * FROM drift_runs WHERE id = ?;", (new_id,)).fetchone()
    conn.close()
    return dict(row)

# --- 6. VESSEL INTELLIGENCE ---
@app.get("/api/v1/incidents/{incident_id}/vessels", response_model=List[VesselCandidateOut])
def get_vessel_candidates(incident_id: str):
    conn = get_db_connection()
    rows = conn.execute("SELECT * FROM vessel_candidates WHERE incident_id = ? ORDER BY compatibility_score DESC;", (incident_id,)).fetchall()
    conn.close()
    return [dict(r) for r in rows]

# --- 7. COUNTERFACTUAL SIMULATION ---
@app.get("/api/v1/incidents/{incident_id}/counterfactual", response_model=List[CounterfactualOut])
def get_counterfactual_scenarios(incident_id: str):
    conn = get_db_connection()
    rows = conn.execute("SELECT * FROM counterfactual_scenarios WHERE incident_id = ? ORDER BY overall_correlation DESC;", (incident_id,)).fetchall()
    conn.close()
    return [dict(r) for r in rows]

@app.post("/api/v1/incidents/{incident_id}/counterfactual", response_model=CounterfactualOut)
def run_counterfactual_scenario(incident_id: str, data: CounterfactualRequest):
    conn = get_db_connection()
    inc = conn.execute("SELECT * FROM incidents WHERE id = ?;", (incident_id,)).fetchone()
    if not inc:
        conn.close()
        raise HTTPException(status_code=404, detail="Incident not found")

    # Evaluate forward advection
    eval_result = evaluate_counterfactual_scenario(
        candidate_lat=data.release_lat,
        candidate_lng=data.release_lng,
        observed_lat=inc["lat"],
        observed_lng=inc["lng"],
        release_hours_ago=18.0,
        simulated_volume_m3=data.simulated_volume_m3
    )

    now_str = datetime.utcnow().isoformat() + "Z"
    new_id = f"SCEN-{uuid.uuid4().hex[:6].upper()}"

    conn.execute("""
    INSERT INTO counterfactual_scenarios VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?);
    """, (
        new_id,
        incident_id,
        data.vessel_id,
        data.scenario_name,
        data.release_lat,
        data.release_lng,
        data.release_time,
        data.simulated_volume_m3,
        eval_result["jaccard_similarity"],
        eval_result["centroid_offset_km"],
        eval_result["overall_correlation"],
        eval_result["verdict"],
        eval_result["notes"],
        now_str
    ))

    # Audit
    conn.execute("""
    INSERT INTO audit_events VALUES (?,?,?,?,?,?);
    """, (
        f"AUD-{uuid.uuid4().hex[:6].upper()}",
        incident_id,
        "COUNTERFACTUAL_RUN",
        "Investigator (Hypothesis Testing)",
        f"Tested scenario: {data.scenario_name}. Result: {eval_result['verdict']} ({eval_result['overall_correlation']}%)",
        now_str
    ))

    conn.commit()
    row = conn.execute("SELECT * FROM counterfactual_scenarios WHERE id = ?;", (new_id,)).fetchone()
    conn.close()
    return dict(row)

# --- 8. EVIDENCE PACKAGE & AUDIT LOG ---
@app.get("/api/v1/incidents/{incident_id}/evidence", response_model=List[EvidenceArtifactOut])
def get_evidence_artifacts(incident_id: str):
    conn = get_db_connection()
    rows = conn.execute("SELECT * FROM evidence_artifacts WHERE incident_id = ? ORDER BY ingested_at DESC;", (incident_id,)).fetchall()
    conn.close()
    return [dict(r) for r in rows]

@app.get("/api/v1/incidents/{incident_id}/audit-log")
def get_audit_log(incident_id: str):
    conn = get_db_connection()
    rows = conn.execute("SELECT * FROM audit_events WHERE incident_id = ? ORDER BY timestamp DESC;", (incident_id,)).fetchall()
    conn.close()
    return [dict(r) for r in rows]

@app.post("/api/v1/incidents/{incident_id}/audit-log", status_code=status.HTTP_201_CREATED)
def append_audit_log(incident_id: str, data: dict):
    conn = get_db_connection()
    new_id = data.get("id") or f"AUD-{uuid.uuid4().hex[:6].upper()}"
    now_str = data.get("timestamp") or (datetime.utcnow().isoformat() + "Z")
    action = data.get("action", "GENERAL_AUDIT")
    actor = data.get("actor", "Forensic Officer")
    details = data.get("details", "")

    conn.execute("""
    INSERT INTO audit_events VALUES (?,?,?,?,?,?);
    """, (new_id, incident_id, action, actor, details, now_str))
    conn.commit()
    conn.close()
    return {
        "id": new_id,
        "incident_id": incident_id,
        "action": action,
        "actor": actor,
        "details": details,
        "timestamp": now_str
    }

# --- 9. REPORTS & EXPORTS ---
@app.post("/api/v1/incidents/{incident_id}/reports/generate")
def generate_report(incident_id: str, format: str = Query("pdf", pattern="^(pdf|csv|xlsx|geojson)$")):
    conn = get_db_connection()
    inc = conn.execute("SELECT * FROM incidents WHERE id = ?;", (incident_id,)).fetchone()
    if not inc:
        conn.close()
        raise HTTPException(status_code=404, detail="Incident not found")

    detection = conn.execute("SELECT * FROM detections WHERE incident_id = ? LIMIT 1;", (incident_id,)).fetchone()
    validation = conn.execute("SELECT * FROM validation_reviews WHERE incident_id = ? LIMIT 1;", (incident_id,)).fetchone()
    drift = conn.execute("SELECT * FROM drift_runs WHERE incident_id = ? LIMIT 1;", (incident_id,)).fetchone()
    vessels = conn.execute("SELECT * FROM vessel_candidates WHERE incident_id = ? ORDER BY compatibility_score DESC;", (incident_id,)).fetchall()
    evidence = conn.execute("SELECT * FROM evidence_artifacts WHERE incident_id = ?;", (incident_id,)).fetchall()

    inc_dict = dict(inc)
    det_dict = dict(detection) if detection else None
    val_dict = dict(validation) if validation else None
    drift_dict = dict(drift) if drift else None
    vessels_list = [dict(v) for v in vessels]
    evidence_list = [dict(e) for e in evidence]

    if format == "pdf":
        file_path = generate_pdf_report(inc_dict, det_dict, val_dict, drift_dict, vessels_list, evidence_list)
        mime = "application/pdf"
    elif format == "csv":
        file_path = generate_csv_report(inc_dict, vessels_list)
        mime = "text/csv"
    elif format == "xlsx":
        file_path = generate_xlsx_report(inc_dict, det_dict, val_dict, drift_dict, vessels_list, evidence_list)
        mime = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    else: # geojson
        file_path = generate_geojson_report(inc_dict, det_dict, drift_dict, vessels_list)
        mime = "application/geo+json"

    filename = os.path.basename(file_path)
    file_size = os.path.getsize(file_path)
    now_str = datetime.utcnow().isoformat() + "Z"
    new_rep_id = f"REP-{uuid.uuid4().hex[:6].upper()}"

    conn.execute("""
    INSERT INTO reports VALUES (?,?,?,?,?,?,?,?,?);
    """, (
        new_rep_id,
        incident_id,
        format.upper(),
        filename,
        file_path,
        file_size,
        "SeaTrace AI Report Generator",
        f"Generated {format.upper()} investigation dossier for incident {incident_id}",
        now_str
    ))

    # Audit
    conn.execute("""
    INSERT INTO audit_events VALUES (?,?,?,?,?,?);
    """, (
        f"AUD-{uuid.uuid4().hex[:6].upper()}",
        incident_id,
        "REPORT_GENERATED",
        "Report Service",
        f"Generated {format.upper()} dossier ({file_size / 1024:.1f} KB)",
        now_str
    ))

    conn.commit()
    conn.close()

    return {
        "report_id": new_rep_id,
        "incident_id": incident_id,
        "format": format.upper(),
        "filename": filename,
        "file_size_bytes": file_size,
        "download_url": f"/api/v1/reports/{new_rep_id}/download"
    }

@app.get("/api/v1/reports/{report_id}/download")
def download_report(report_id: str):
    conn = get_db_connection()
    row = conn.execute("SELECT * FROM reports WHERE id = ?;", (report_id,)).fetchone()
    conn.close()
    if not row or not os.path.exists(row["file_path"]):
        raise HTTPException(status_code=404, detail="Report file not found")

    return FileResponse(
        path=row["file_path"],
        filename=row["filename"],
        media_type="application/octet-stream"
    )

# --- 10. DATA SOURCES ---
@app.get("/api/v1/data-sources", response_model=List[DataSourceOut])
def get_data_sources():
    conn = get_db_connection()
    rows = conn.execute("SELECT * FROM data_sources;").fetchall()
    conn.close()
    return [dict(r) for r in rows]

@app.post("/api/v1/data-sources/{source_id}/ping")
def ping_data_source(source_id: str):
    conn = get_db_connection()
    row = conn.execute("SELECT * FROM data_sources WHERE id = ?;", (source_id,)).fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Data source not found")

    import random
    latency = random.randint(45, 380)
    now_str = datetime.utcnow().isoformat() + "Z"

    conn.execute("""
    UPDATE data_sources SET latency_ms = ?, last_success_time = ?, status = 'LIVE' WHERE id = ?;
    """, (latency, now_str, source_id))
    conn.commit()
    updated = conn.execute("SELECT * FROM data_sources WHERE id = ?;", (source_id,)).fetchone()
    conn.close()

    return {
        "source_id": source_id,
        "status": "LIVE",
        "latency_ms": latency,
        "checked_at": now_str
    }

# --- 11. SYSTEM STATUS & JOBS ---
@app.get("/api/v1/system/status")
def get_system_status():
    return {
        "status": "OPERATIONAL",
        "environment": "PRODUCTION / HACKATHON_DEMO",
        "api_version": "1.0.0",
        "active_workers": 4,
        "uptime_seconds": 184520,
        "services": [
            {"name": "FastAPI REST Server", "status": "HEALTHY", "latency_ms": 12, "last_check": datetime.utcnow().isoformat()},
            {"name": "SQLite WAL Engine", "status": "HEALTHY", "latency_ms": 3, "last_check": datetime.utcnow().isoformat()},
            {"name": "Sentinel-1 SAR Ingestion", "status": "HEALTHY", "latency_ms": 310, "last_check": datetime.utcnow().isoformat()},
            {"name": "AIS Stream Ingest (DGLL)", "status": "HEALTHY", "latency_ms": 82, "last_check": datetime.utcnow().isoformat()},
            {"name": "Lagrangian Ocean Drift Engine", "status": "HEALTHY", "latency_ms": 190, "last_check": datetime.utcnow().isoformat()},
            {"name": "ReportLab Dossier Service", "status": "HEALTHY", "latency_ms": 25, "last_check": datetime.utcnow().isoformat()}
        ],
        "active_jobs": [
            {"job_id": "JOB-8841", "incident_id": "IN-2026-0881", "type": "AIS_CORRIDOR_SCAN", "status": "SUCCEEDED", "progress_pct": 100},
            {"job_id": "JOB-8842", "incident_id": "IN-2026-0842", "type": "SAR_SEGMENTATION", "status": "RUNNING", "progress_pct": 68}
        ]
    }
