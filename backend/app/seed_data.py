import json
import hashlib
from datetime import datetime
from database import get_db_connection, init_db

def seed():
    init_db()
    conn = get_db_connection()
    cursor = conn.cursor()

    # Clear existing data
    cursor.execute("DELETE FROM incidents;")
    cursor.execute("DELETE FROM detections;")
    cursor.execute("DELETE FROM validation_reviews;")
    cursor.execute("DELETE FROM drift_runs;")
    cursor.execute("DELETE FROM vessel_candidates;")
    cursor.execute("DELETE FROM counterfactual_scenarios;")
    cursor.execute("DELETE FROM evidence_artifacts;")
    cursor.execute("DELETE FROM reports;")
    cursor.execute("DELETE FROM data_sources;")
    cursor.execute("DELETE FROM audit_events;")

    # 1. Incidents
    incidents = [
        (
            "IN-2026-0881",
            "Mumbai High Offshore Tanker Sheen",
            "Arabian Sea (West Coast)",
            "RECONSTRUCTING",
            "CRITICAL",
            19.3421,
            71.8542,
            "2026-10-22T06:14:00Z",
            "Sentinel-1A SAR (IW Mode)",
            340.5,
            "Heavy Fuel Oil / Crude",
            json.dumps({
                "type": "Polygon",
                "coordinates": [[[71.83, 19.32], [71.88, 19.34], [71.87, 19.37], [71.81, 19.35], [71.83, 19.32]]]
            }),
            "Large elongated dark-patch detected 82 km NW of Mumbai High platform cluster. High damping ratio.",
            "2026-10-22T06:45:00Z",
            "2026-10-23T09:30:00Z"
        ),
        (
            "IN-2026-0842",
            "Kochi Approach Channel Bunkering Slick",
            "Malabar Coast (Kerala)",
            "VALIDATING",
            "HIGH",
            9.9215,
            76.1542,
            "2026-10-22T14:30:00Z",
            "Sentinel-1B SAR",
            115.0,
            "Intermediate Fuel Oil (IFO 380)",
            json.dumps({
                "type": "Polygon",
                "coordinates": [[[76.13, 9.90], [76.17, 9.92], [76.16, 9.94], [76.12, 9.93], [76.13, 9.90]]]
            }),
            "Detected near outer anchorage pilot station. Under review for potential biogenic look-alike screening.",
            "2026-10-22T15:10:00Z",
            "2026-10-23T11:15:00Z"
        ),
        (
            "IN-2026-0790",
            "Ennore Anchorage Thermal Plant Corridor Slick",
            "Coromandel Coast (Tamil Nadu)",
            "VESSEL_ANALYSIS",
            "HIGH",
            13.2541,
            80.3824,
            "2026-10-21T02:40:00Z",
            "Sentinel-1A SAR + Sentinel-2 MSI",
            210.0,
            "Bunker C / Bilge Sludge",
            json.dumps({
                "type": "Polygon",
                "coordinates": [[[80.36, 13.23], [80.41, 13.26], [80.39, 13.28], [80.35, 13.25], [80.36, 13.23]]]
            }),
            "Drift analysis indicates origin aligns with international container transit lane 18 hours prior.",
            "2026-10-21T03:30:00Z",
            "2026-10-23T12:00:00Z"
        ),
        (
            "IN-2026-0715",
            "Paradip Port Outer Roadstead Discharge",
            "Bay of Bengal (Odisha)",
            "CLOSED",
            "MEDIUM",
            20.2145,
            86.6852,
            "2026-10-18T10:20:00Z",
            "Sentinel-1A SAR",
            75.0,
            "Oily Bilge Water",
            json.dumps({
                "type": "Polygon",
                "coordinates": [[[86.66, 20.20], [86.71, 20.22], [86.69, 20.24], [86.65, 20.22], [86.66, 20.20]]]
            }),
            "Investigation concluded. Lead vessel identified, evidence package verified with DG Shipping.",
            "2026-10-18T11:00:00Z",
            "2026-10-20T16:00:00Z"
        ),
    ]
    cursor.executemany("INSERT INTO incidents VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?);", incidents)

    # 2. Detections
    detections = [
        (
            "DET-0881-A",
            "IN-2026-0881",
            "Sentinel-1A",
            "C-SAR (VV Polarization)",
            "2026-10-22T06:14:00Z",
            10.0,
            14.85,
            18.4,
            0.94,
            -11.8, # dB damping
            json.dumps({
                "type": "Feature",
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [[[71.83, 19.32], [71.88, 19.34], [71.87, 19.37], [71.81, 19.35], [71.83, 19.32]]]
                },
                "properties": {"mean_contrast_db": -12.4, "entropy": 0.42}
            }),
            "S1A_IW_GRDH_1SDV_20261022T061400_051280_062F1A",
            json.dumps({"filter": "Lee-Sigma 7x7", "threshold_db": -22.5, "min_cluster_pixels": 450}),
            "2026-10-22T06:30:00Z"
        ),
        (
            "DET-0842-A",
            "IN-2026-0842",
            "Sentinel-1B",
            "C-SAR (VH/VV Dual)",
            "2026-10-22T14:30:00Z",
            10.0,
            6.20,
            9.1,
            0.78,
            -7.5,
            json.dumps({
                "type": "Feature",
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [[[76.13, 9.90], [76.17, 9.92], [76.16, 9.94], [76.12, 9.93], [76.13, 9.90]]]
                }
            }),
            "S1B_IW_GRDH_1SDV_20261022T143000_038190_049B2C",
            json.dumps({"filter": "Refined Gamma 5x5", "threshold_db": -20.0}),
            "2026-10-22T14:50:00Z"
        )
    ]
    cursor.executemany("INSERT INTO detections VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?);", detections)

    # 3. Validation Reviews
    checklist_sample = json.dumps([
        {"id": "wind", "label": "Surface Wind Speed in 3-12 m/s Window", "passed": True, "evidence": "6.8 knots measured by ASCAT & GFS"},
        {"id": "edge", "label": "Sharp Contrast Edge Damping (> 6 dB)", "passed": True, "evidence": "Mean edge gradient -11.8 dB"},
        {"id": "biogenic", "label": "Low Biogenic Chlorophyll-a Risk", "passed": True, "evidence": "MODIS Aqua Chl-a < 0.18 mg/m3"},
        {"id": "seep", "label": "Excluded Known Geological Seep Zone", "passed": True, "evidence": "Nearest charted seep 142 km SW"},
        {"id": "lookalike", "label": "Internal Wave Shadow Excluded", "passed": True, "evidence": "No repeating solitary wave packet periodicity"}
    ])
    cursor.execute("""
    INSERT INTO validation_reviews VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?);
    """, (
        "VAL-0881-01",
        "IN-2026-0881",
        "DET-0881-A",
        "SUPPORTED",
        "Dr. Aris Thorne",
        "Lead Satellite Oceanographer",
        6.8,
        "LOW",
        142.5,
        "HIGH",
        checklist_sample,
        "Confirmed petroleum hydrocarbon characteristics. Damping and wind velocity strongly rule out natural surfactant look-alikes.",
        "2026-10-22T08:15:00Z"
    ))

    # 4. Drift Runs
    trajectories = []
    # 25 sample particles for Mumbai High reverse drift
    for i in range(25):
        jitter_x = (i % 5 - 2) * 0.008
        jitter_y = ((i // 5) - 2) * 0.008
        pts = [
            [71.85 + jitter_x, 19.34 + jitter_y, 0],
            [71.82 + jitter_x * 1.2, 19.30 + jitter_y * 1.1, -6],
            [71.78 + jitter_x * 1.4, 19.26 + jitter_y * 1.2, -12],
            [71.74 + jitter_x * 1.6, 19.22 + jitter_y * 1.3, -18],
            [71.70 + jitter_x * 1.8, 19.18 + jitter_y * 1.5, -24],
        ]
        trajectories.append({"particle_id": i, "points": pts})

    cursor.execute("""
    INSERT INTO drift_runs VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?);
    """, (
        "DRIFT-0881-01",
        "IN-2026-0881",
        "LAGRANGIAN_REVERSE",
        24,
        500,
        0.032,
        12.5,
        "COMPLETED",
        19.184,
        71.702,
        6.4,
        json.dumps(trajectories),
        "INCOIS Ocean Current (HYCOM 1/12 deg) + NOAA GFS 10m Wind",
        "2026-10-22T09:10:00Z"
    ))

    # 5. Vessel Candidates
    candidates = [
        (
            "VES-61C2-01",
            "IN-2026-61C2",
            "419000881",
            "MT OCEAN PRIDE",
            "Liberia",
            "9384812",
            "Crude Oil Tanker",
            13.8,
            230.0,
            1.4,
            0.4,
            -1.6,
            91.4,
            "CRITICAL_LEAD",
            json.dumps({
                "type": "LineString",
                "coordinates": [
                    [69.98, 22.78], [69.85, 22.72], [69.78, 22.68], [69.65, 22.62], [69.45, 22.56]
                ]
            }),
            json.dumps({
                "spatial_proximity_pct": 98.4,
                "temporal_alignment_pct": 94.2,
                "course_anomaly_pct": 88.0,
                "draught_delta_pct": 85.0
            })
        ),
        (
            "VES-61C2-02",
            "IN-2026-61C2",
            "419002344",
            "GAS GEMINI",
            "Panama",
            "9452011",
            "LPG / Chemical Tanker",
            15.1,
            235.0,
            4.8,
            -1.2,
            -0.3,
            74.2,
            "ELEVATED",
            json.dumps({
                "type": "LineString",
                "coordinates": [
                    [69.90, 22.80], [69.75, 22.72], [69.60, 22.65], [69.40, 22.55]
                ]
            }),
            json.dumps({
                "spatial_proximity_pct": 76.0,
                "temporal_alignment_pct": 81.5,
                "course_anomaly_pct": 65.0,
                "draught_delta_pct": 74.3
            })
        ),
        (
            "VES-61C2-03",
            "IN-2026-61C2",
            "419003566",
            "MAERSK DHOLERA",
            "Singapore",
            "9628400",
            "Container Ship",
            16.4,
            240.0,
            8.9,
            -2.1,
            0.0,
            58.5,
            "MODERATE",
            json.dumps({
                "type": "LineString",
                "coordinates": [
                    [69.82, 22.82], [69.68, 22.74], [69.52, 22.64], [69.30, 22.50]
                ]
            }),
            json.dumps({
                "spatial_proximity_pct": 55.0,
                "temporal_alignment_pct": 68.0,
                "course_anomaly_pct": 42.0,
                "draught_delta_pct": 69.0
            })
        ),
        (
            "VES-0881-01",
            "IN-2026-0881",
            "419001842",
            "MT NEELKANTH GLORY",
            "India",
            "9482190",
            "Crude Oil Tanker",
            12.8,
            242.0,
            1.8, # km to estimated release centroid
            0.5, # hours from release time
            -1.4, # draught change (discharging/deballasting)
            94.6,
            "CRITICAL_LEAD",
            json.dumps({
                "type": "LineString",
                "coordinates": [
                    [71.60, 19.10], [71.66, 19.15], [71.71, 19.19], [71.77, 19.24], [71.84, 19.30]
                ]
            }),
            json.dumps({
                "spatial_proximity_pct": 98.2,
                "temporal_alignment_pct": 95.0,
                "course_anomaly_pct": 88.4,
                "draught_delta_pct": 92.0
            })
        ),
        (
            "VES-0881-02",
            "IN-2026-0881",
            "352002781",
            "PACIFIC TRADER V",
            "Panama",
            "9318492",
            "Chemical/Product Tanker",
            14.2,
            250.0,
            5.6,
            -1.8,
            -0.2,
            72.4,
            "ELEVATED",
            json.dumps({
                "type": "LineString",
                "coordinates": [
                    [71.55, 19.05], [71.64, 19.12], [71.75, 19.21], [71.85, 19.29]
                ]
            }),
            json.dumps({
                "spatial_proximity_pct": 74.0,
                "temporal_alignment_pct": 82.0,
                "course_anomaly_pct": 60.0,
                "draught_delta_pct": 30.0
            })
        ),
        (
            "VES-0881-03",
            "IN-2026-0881",
            "636019441",
            "EVER PROSPER",
            "Liberia",
            "9708142",
            "Container Ship",
            18.5,
            238.0,
            14.2,
            -3.5,
            0.0,
            38.5,
            "LOW_COMPATIBILITY",
            json.dumps({
                "type": "LineString",
                "coordinates": [
                    [71.40, 18.95], [71.58, 19.08], [71.80, 19.22]
                ]
            }),
            json.dumps({
                "spatial_proximity_pct": 35.0,
                "temporal_alignment_pct": 45.0,
                "course_anomaly_pct": 20.0,
                "draught_delta_pct": 0.0
            })
        )
    ]
    cursor.executemany("INSERT INTO vessel_candidates VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?);", candidates)

    # 6. Counterfactual Scenarios
    scenarios = [
        (
            "SCEN-0881-01",
            "IN-2026-0881",
            "VES-0881-01",
            "Primary Lead Release (MT Neelkanth Glory @ 18:30Z)",
            19.182,
            71.705,
            "2026-10-21T18:30:00Z",
            280.0,
            0.86, # Jaccard similarity
            1.2, # km centroid offset
            92.8, # Overall correlation %
            "HIGHLY_PLAUSIBLE",
            "Forward advection matches observed SAR slick geometry and elongation orientation within 1.2 km centroid tolerance.",
            "2026-10-22T10:15:00Z"
        ),
        (
            "SCEN-0881-02",
            "IN-2026-0881",
            "VES-0881-02",
            "Alternate Lead Release (Pacific Trader V @ 16:45Z)",
            19.115,
            71.638,
            "2026-10-21T16:45:00Z",
            150.0,
            0.34,
            8.4,
            41.2,
            "IMPLAUSIBLE",
            "Forward advection drifts south-east of observed slick position due to 12 knot southerly current vector.",
            "2026-10-22T10:45:00Z"
        )
    ]
    cursor.executemany("INSERT INTO counterfactual_scenarios VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?);", scenarios)

    # 7. Evidence Artifacts
    artifacts = [
        (
            "EVID-0881-01",
            "IN-2026-0881",
            "RAW_SAR_SCENE",
            "Sentinel-1A IW L1 GRD Scene (Safe Format)",
            "storage/scenes/S1A_IW_GRDH_1SDV_20261022.SAFE",
            hashlib.sha256(b"S1A_IW_GRDH_1SDV_20261022").hexdigest(),
            1048576000,
            "ESA Copernicus Data Space Ecosystem",
            "2026-10-22T06:22:00Z",
            1,
            json.dumps({"polarization": "VV", "orbit": 51280, "sensor": "C-SAR"})
        ),
        (
            "EVID-0881-02",
            "IN-2026-0881",
            "DETECTION_MASK",
            "Binary Segmentation Slick Polygon (GeoJSON)",
            "storage/masks/mask_IN_2026_0881.geojson",
            hashlib.sha256(b"mask_IN_2026_0881_geojson_content").hexdigest(),
            45200,
            "SeaTrace AI Segmentation Engine v2.4",
            "2026-10-22T06:30:00Z",
            1,
            json.dumps({"algorithm": "Adaptive CFAR + U-Net ResNet50", "confidence": 0.94})
        ),
        (
            "EVID-0881-03",
            "IN-2026-0881",
            "AIS_CORRIDOR_EXTRACT",
            "Raw AIS Transponder Stream - Arabian Sea Box A4",
            "storage/ais/ais_mumbai_high_20261021_22.csv",
            hashlib.sha256(b"ais_mumbai_high_20261021_22_csv_records").hexdigest(),
            284000,
            "Directorate General of Lighthouses & Lightships (DGLL)",
            "2026-10-22T07:15:00Z",
            1,
            json.dumps({"total_vessel_pings": 1420, "unique_mmsi_count": 48})
        ),
        (
            "EVID-0881-04",
            "IN-2026-0881",
            "DRIFT_SIMULATION_LOG",
            "Lagrangian Particle Tracking Trajectory Ledger",
            "storage/drift/drift_0881_particles.json",
            hashlib.sha256(b"drift_0881_particles_json_log").hexdigest(),
            124500,
            "OpenDrift / SeaTrace OceanEngine v1.8",
            "2026-10-22T09:10:00Z",
            1,
            json.dumps({"particles": 500, "timestep_sec": 300, "forcing": "HYCOM+GFS"})
        )
    ]
    cursor.executemany("INSERT INTO evidence_artifacts VALUES (?,?,?,?,?,?,?,?,?,?,?);", artifacts)

    # 8. Data Sources
    sources = [
        (
            "SRC-SENTINEL1",
            "Copernicus Sentinel-1 SAR",
            "European Space Agency (ESA)",
            "SATELLITE_RADAR",
            "LIVE",
            "AUTOMATIC_POLL",
            340,
            "2026-10-23T06:14:00Z",
            None,
            "C-band Synthetic Aperture Radar. All-weather, day-and-night surface film imaging."
        ),
        (
            "SRC-AIS-DGLL",
            "National AIS Coastal Network",
            "DGLL / Indian Coast Guard",
            "VESSEL_TELEMETRY",
            "LIVE",
            "STREAMING",
            85,
            "2026-10-23T11:20:00Z",
            None,
            "Coast-wide VHF AIS receiver network covering 7,500 km Indian shoreline."
        ),
        (
            "SRC-INCOIS-CURRENT",
            "INCOIS Coastal Ocean Currents",
            "INCOIS Hyderabad (Ministry of Earth Sciences)",
            "OCEAN_CURRENTS",
            "AVAILABLE",
            "API_FEED",
            420,
            "2026-10-23T06:00:00Z",
            None,
            "High-resolution 1/12 deg hydrodynamic ocean surface velocity vectors."
        ),
        (
            "SRC-NOAA-GFS",
            "Global Forecast System (GFS) 10m Wind",
            "NOAA NCEP",
            "METEOROLOGY",
            "LIVE",
            "GRIB2_INGEST",
            210,
            "2026-10-23T06:00:00Z",
            None,
            "0.25-degree atmospheric 10m u/v wind field model updated 4x daily."
        ),
        (
            "SRC-GEBCO-BATHY",
            "GEBCO High-Res Bathymetry",
            "BODC / IHO",
            "GEOSPATIAL_BATHYMETRY",
            "AVAILABLE",
            "LOCAL_CACHE",
            15,
            "2026-10-20T00:00:00Z",
            None,
            "15 arc-second seabed depth grid for coastal shoal & shelf interaction modeling."
        )
    ]
    cursor.executemany("INSERT INTO data_sources VALUES (?,?,?,?,?,?,?,?,?,?);", sources)

    # 9. Audit Events
    audit_events = [
        ("AUD-01", "IN-2026-0881", "INCIDENT_CREATED", "Automated Sentinel-1 Daemon", "New SAR slick detected at 19.3421N, 71.8542E", "2026-10-22T06:45:00Z"),
        ("AUD-02", "IN-2026-0881", "VALIDATION_DECISION", "Dr. Aris Thorne", "Detection approved as SUPPORTED petroleum hydrocarbon", "2026-10-22T08:15:00Z"),
        ("AUD-03", "IN-2026-0881", "DRIFT_RUN_EXECUTED", "System OceanEngine", "24h reverse drift executed with 500 particles", "2026-10-22T09:10:00Z"),
        ("AUD-04", "IN-2026-0881", "VESSEL_CORRELATION", "System AIS Correlator", "MT Neelkanth Glory flagged as CRITICAL_LEAD (94.6% match)", "2026-10-22T09:35:00Z"),
        ("AUD-05", "IN-2026-0881", "COUNTERFACTUAL_RUN", "Investigator Priya Nair", "Scenario 1 verified with 86% spatial Jaccard overlap", "2026-10-22T10:15:00Z"),
    ]
    cursor.executemany("INSERT INTO audit_events VALUES (?,?,?,?,?,?);", audit_events)

    conn.commit()
    conn.close()
    print("Seeding completed successfully with 4 realistic Indian maritime incidents and full investigation trails.")

if __name__ == "__main__":
    seed()
