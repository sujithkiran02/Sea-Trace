import sqlite3
import json
import os
from typing import List, Dict, Any, Optional

DB_DIR = os.path.join(os.path.dirname(__file__), "..", "data")
DB_PATH = os.path.join(DB_DIR, "seatrace.db")

def get_db_connection() -> sqlite3.Connection:
    os.makedirs(DB_DIR, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    conn.execute("PRAGMA journal_mode = WAL;")
    return conn

def init_db():
    os.makedirs(DB_DIR, exist_ok=True)
    conn = get_db_connection()
    cursor = conn.cursor()

    # 1. Incidents Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS incidents (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        region TEXT NOT NULL,
        status TEXT NOT NULL,
        severity TEXT NOT NULL,
        lat REAL NOT NULL,
        lng REAL NOT NULL,
        detection_time TEXT NOT NULL,
        source TEXT NOT NULL,
        estimated_volume_m3 REAL,
        spill_type TEXT,
        footprint_geojson TEXT,
        notes TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
    );
    """)

    # 2. Detections Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS detections (
        id TEXT PRIMARY KEY,
        incident_id TEXT NOT NULL,
        satellite_mission TEXT NOT NULL,
        sensor TEXT NOT NULL,
        acquisition_time TEXT NOT NULL,
        resolution_m REAL,
        area_km2 REAL NOT NULL,
        perimeter_km REAL,
        confidence_score REAL NOT NULL,
        damping_ratio REAL,
        mask_geojson TEXT,
        scene_id TEXT,
        processing_parameters TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (incident_id) REFERENCES incidents (id) ON DELETE CASCADE
    );
    """)

    # 3. Validation Reviews Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS validation_reviews (
        id TEXT PRIMARY KEY,
        incident_id TEXT NOT NULL,
        detection_id TEXT,
        decision TEXT NOT NULL,
        reviewer_name TEXT NOT NULL,
        reviewer_role TEXT NOT NULL,
        wind_speed_knots REAL,
        biogenic_risk TEXT,
        natural_seep_proximity_km REAL,
        confidence_level TEXT NOT NULL,
        checklist_json TEXT NOT NULL,
        notes TEXT,
        reviewed_at TEXT NOT NULL,
        FOREIGN KEY (incident_id) REFERENCES incidents (id) ON DELETE CASCADE
    );
    """)

    # 4. Drift Runs Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS drift_runs (
        id TEXT PRIMARY KEY,
        incident_id TEXT NOT NULL,
        simulation_type TEXT NOT NULL,
        time_window_hours INTEGER NOT NULL,
        particle_count INTEGER NOT NULL,
        windage_leeway REAL NOT NULL,
        current_deflection_deg REAL,
        status TEXT NOT NULL,
        origin_lat REAL,
        origin_lng REAL,
        origin_uncertainty_km REAL,
        trajectories_geojson TEXT,
        environmental_sources TEXT,
        completed_at TEXT,
        FOREIGN KEY (incident_id) REFERENCES incidents (id) ON DELETE CASCADE
    );
    """)

    # 5. Vessel Candidates Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS vessel_candidates (
        id TEXT PRIMARY KEY,
        incident_id TEXT NOT NULL,
        mmsi TEXT NOT NULL,
        vessel_name TEXT NOT NULL,
        flag TEXT NOT NULL,
        imo TEXT,
        vessel_type TEXT NOT NULL,
        speed_knots REAL,
        course_deg REAL,
        distance_to_origin_km REAL NOT NULL,
        time_offset_hours REAL NOT NULL,
        draught_change_m REAL,
        compatibility_score REAL NOT NULL,
        risk_level TEXT NOT NULL,
        track_geojson TEXT,
        factors_json TEXT NOT NULL,
        FOREIGN KEY (incident_id) REFERENCES incidents (id) ON DELETE CASCADE
    );
    """)

    # 6. Counterfactual Scenarios Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS counterfactual_scenarios (
        id TEXT PRIMARY KEY,
        incident_id TEXT NOT NULL,
        vessel_id TEXT,
        scenario_name TEXT NOT NULL,
        release_lat REAL NOT NULL,
        release_lng REAL NOT NULL,
        release_time TEXT NOT NULL,
        simulated_volume_m3 REAL,
        jaccard_similarity REAL NOT NULL,
        centroid_offset_km REAL NOT NULL,
        overall_correlation REAL NOT NULL,
        verdict TEXT NOT NULL,
        notes TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (incident_id) REFERENCES incidents (id) ON DELETE CASCADE
    );
    """)

    # 7. Evidence Artifacts Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS evidence_artifacts (
        id TEXT PRIMARY KEY,
        incident_id TEXT NOT NULL,
        artifact_type TEXT NOT NULL,
        title TEXT NOT NULL,
        file_path TEXT,
        sha256_hash TEXT NOT NULL,
        file_size_bytes INTEGER,
        source_system TEXT NOT NULL,
        ingested_at TEXT NOT NULL,
        verified INTEGER DEFAULT 1,
        metadata_json TEXT,
        FOREIGN KEY (incident_id) REFERENCES incidents (id) ON DELETE CASCADE
    );
    """)

    # 8. Reports Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS reports (
        id TEXT PRIMARY KEY,
        incident_id TEXT NOT NULL,
        format TEXT NOT NULL,
        filename TEXT NOT NULL,
        file_path TEXT NOT NULL,
        file_size_bytes INTEGER,
        generated_by TEXT NOT NULL,
        summary TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (incident_id) REFERENCES incidents (id) ON DELETE CASCADE
    );
    """)

    # 9. Data Sources Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS data_sources (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        provider TEXT NOT NULL,
        category TEXT NOT NULL,
        status TEXT NOT NULL,
        mode TEXT NOT NULL,
        latency_ms INTEGER,
        last_success_time TEXT,
        error_message TEXT,
        details TEXT
    );
    """)

    # 10. Audit Events Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS audit_events (
        id TEXT PRIMARY KEY,
        incident_id TEXT,
        action TEXT NOT NULL,
        actor TEXT NOT NULL,
        details TEXT NOT NULL,
        timestamp TEXT NOT NULL
    );
    """)

    conn.commit()
    conn.close()

if __name__ == "__main__":
    init_db()
    print("Database initialized successfully at", DB_PATH)
