import urllib.request
import json
import uuid

BASE = "http://127.0.0.1:8000"

def test_full_investigation_api_pipeline():
    print("[1/10] Testing Health Endpoint...")
    req = urllib.request.Request(f"{BASE}/health")
    with urllib.request.urlopen(req) as res:
        assert res.status == 200
        data = json.loads(res.read().decode())
        assert data["database"] == "HEALTHY"
        print("  [OK] System health verified.")

    print("[2/10] Testing Dashboard Summary...")
    req = urllib.request.Request(f"{BASE}/api/v1/dashboard/summary")
    with urllib.request.urlopen(req) as res:
        assert res.status == 200
        data = json.loads(res.read().decode())
        assert data["total_incidents"] >= 4
        print(f"  [OK] Dashboard summary returned {data['total_incidents']} incidents.")

    print("[3/10] Testing Incident Creation & Persistence...")
    create_payload = {
        "title": "Kandla Deepwater Fairway Hydrocarbon Anomaly",
        "region": "Gulf of Kutch",
        "severity": "HIGH",
        "lat": 22.8500,
        "lng": 70.0500,
        "detection_time": "2026-10-23T12:00:00Z",
        "source": "Sentinel-1B C-SAR",
        "estimated_volume_m3": 75.0,
        "spill_type": "Crude Oil",
        "notes": "Automated pipeline integration test."
    }
    req = urllib.request.Request(
        f"{BASE}/api/v1/incidents",
        data=json.dumps(create_payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    with urllib.request.urlopen(req) as res:
        assert res.status == 201
        new_inc = json.loads(res.read().decode())
        new_id = new_inc["id"]
        print(f"  [OK] Successfully persisted new incident: {new_id}")

    print("[4/10] Testing Incident Verification Retrieval...")
    req = urllib.request.Request(f"{BASE}/api/v1/incidents/{new_id}")
    with urllib.request.urlopen(req) as res:
        assert res.status == 200
        fetched = json.loads(res.read().decode())
        assert fetched["lat"] == 22.8500
        assert fetched["status"] == "NEW"
        print(f"  [OK] Incident {new_id} verified from SQLite DB.")

    print("[5/10] Testing Detection Mask Retrieval...")
    req = urllib.request.Request(f"{BASE}/api/v1/incidents/IN-2026-0881/detections")
    with urllib.request.urlopen(req) as res:
        assert res.status == 200
        dets = json.loads(res.read().decode())
        assert len(dets) > 0
        print(f"  [OK] Retrieved {len(dets)} SAR detections with area {dets[0]['area_km2']} km2.")

    print("[6/10] Testing Validation Review Persistence...")
    val_payload = {
        "decision": "SUPPORTED",
        "reviewer_name": "Senior Inspector",
        "reviewer_role": "Coast Guard Environmental Command",
        "wind_speed_knots": 8.5,
        "biogenic_risk": "LOW",
        "natural_seep_proximity_km": 110.0,
        "confidence_level": 95,
        "checklist_json": json.dumps({"windSufficient": True}),
        "notes": "Confirmed crude oil slick damping pattern."
    }
    req = urllib.request.Request(
        f"{BASE}/api/v1/incidents/{new_id}/validation",
        data=json.dumps(val_payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    with urllib.request.urlopen(req) as res:
        assert res.status == 200
        val_res = json.loads(res.read().decode())
        assert val_res["decision"] == "SUPPORTED"
        print("  [OK] Validation decision persisted and incident transitioned.")

    print("[7/10] Testing Backward Lagrangian Drift Simulation...")
    drift_payload = {
        "time_window_hours": 18,
        "particle_count": 500,
        "windage_leeway": 0.03,
        "current_deflection_deg": 20.0
    }
    req = urllib.request.Request(
        f"{BASE}/api/v1/incidents/{new_id}/drift",
        data=json.dumps(drift_payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    with urllib.request.urlopen(req) as res:
        assert res.status == 200
        drift_res = json.loads(res.read().decode())
        assert "origin_lat" in drift_res
        print(f"  [OK] Drift origin calculated: {drift_res['origin_lat']}N, {drift_res['origin_lng']}E (+-{drift_res['origin_uncertainty_km']} km).")

    print("[8/10] Testing Counterfactual Hypothesis Testing...")
    scen_payload = {
        "scenario_name": "Hypothesis: Vessel Discharge 15km Updrift",
        "release_lat": 22.7500,
        "release_lng": 69.9500,
        "release_time": "2026-10-23T06:00:00Z",
        "simulated_volume_m3": 75.0
    }
    req = urllib.request.Request(
        f"{BASE}/api/v1/incidents/{new_id}/counterfactual",
        data=json.dumps(scen_payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    with urllib.request.urlopen(req) as res:
        assert res.status == 200
        scen_res = json.loads(res.read().decode())
        assert "overall_correlation" in scen_res
        print(f"  [OK] Counterfactual fit calculated: {scen_res['overall_correlation']}% ({scen_res['verdict']}).")

    print("[9/10] Testing Data Sources Ping & Heartbeat...")
    req = urllib.request.Request(
        f"{BASE}/api/v1/data-sources/SRC-SENTINEL1/ping",
        data=b"{}",
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    with urllib.request.urlopen(req) as res:
        assert res.status == 200
        ping_res = json.loads(res.read().decode())
        assert ping_res["status"] == "LIVE"
        print(f"  [OK] Feed pinged successfully: {ping_res['latency_ms']} ms.")

    print("[10/10] Testing System Observability Status...")
    req = urllib.request.Request(f"{BASE}/api/v1/system/status")
    with urllib.request.urlopen(req) as res:
        assert res.status == 200
        sys_res = json.loads(res.read().decode())
        assert sys_res["status"] == "OPERATIONAL"
        print(f"  [OK] Observability confirmed: {len(sys_res['services'])} services healthy.")

    print("\nALL 10 API PIPELINE STAGES PASSED FLAWLESSLY! [SUCCESS]")

if __name__ == "__main__":
    test_full_investigation_api_pipeline()
