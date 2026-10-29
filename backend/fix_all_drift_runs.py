import sqlite3
import json
import os
import sys

sys.path.append(os.path.abspath('backend/app'))
from services.drift_engine import run_reverse_drift_simulation

conn = sqlite3.connect('backend/data/seatrace.db')
conn.row_factory = sqlite3.Row
cursor = conn.cursor()

# Update all existing drift runs for Kandla/Kutch incidents to ensure pure marine coordinates and trajectories
kandla_incidents = cursor.execute("SELECT id, lat, lng FROM incidents WHERE lat > 22.0 AND lat < 23.5 AND lng > 69.0 AND lng < 71.0;").fetchall()

for inc in kandla_incidents:
    print(f"Re-running drift simulation for incident {inc['id']} at ({inc['lat']}, {inc['lng']})...")
    res = run_reverse_drift_simulation(
        slick_lat=inc["lat"],
        slick_lng=inc["lng"],
        time_window_hours=24,
        particle_count=1000,
        windage_leeway=0.03,
        current_deflection_deg=20.0
    )
    
    print(f"  -> Origin: {res['origin_lat']:.4f} N, {res['origin_lng']:.4f} E, Particles: {len(res['trajectories'])}")
    
    # Check if drift run exists
    existing = cursor.execute("SELECT id FROM drift_runs WHERE incident_id = ?;", (inc["id"],)).fetchone()
    if existing:
        cursor.execute("""
            UPDATE drift_runs 
            SET origin_lat = ?, origin_lng = ?, origin_uncertainty_km = ?, trajectories_geojson = ?, environmental_sources = ?
            WHERE incident_id = ?;
        """, (res["origin_lat"], res["origin_lng"], res["origin_uncertainty_km"], json.dumps(res["trajectories"]), res["environmental_sources"], inc["id"]))
    else:
        cursor.execute("""
            INSERT INTO drift_runs VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?);
        """, (
            f"DRIFT-{inc['id'][-4:]}", inc["id"], "LAGRANGIAN_REVERSE", 24, 1000, 0.03, 20.0, "COMPLETED",
            res["origin_lat"], res["origin_lng"], res["origin_uncertainty_km"],
            json.dumps(res["trajectories"]), res["environmental_sources"], "2026-10-23T18:00:00Z"
        ))

conn.commit()
print("All Kandla/Kutch drift runs updated successfully in DB.")

# Verify all rows
rows = cursor.execute("SELECT id, incident_id, origin_lat, origin_lng, origin_uncertainty_km FROM drift_runs;").fetchall()
for r in rows:
    print(dict(r))

conn.close()
