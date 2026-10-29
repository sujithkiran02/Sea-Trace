import math
from typing import List, Dict, Any

def calculate_vessel_compatibility(
    distance_to_origin_km: float,
    time_offset_hours: float,
    vessel_type: str,
    speed_knots: float,
    draught_change_m: float = 0.0
) -> Dict[str, Any]:
    """
    Explainable multi-factor vessel attribution scoring:
    Calculates normalized compatibility index [0-100%] based on spatial proximity,
    temporal coincidence, speed profile, and vessel type hazard factors.
    """
    # 1. Spatial score: Gaussian falloff centered at origin (sigma = 5 km)
    sigma_km = 5.0
    spatial_score = math.exp(-0.5 * (distance_to_origin_km / sigma_km) ** 2) * 100.0

    # 2. Temporal score: Gaussian falloff around release timestamp (sigma = 3 hours)
    sigma_t = 3.0
    temporal_score = math.exp(-0.5 * (time_offset_hours / sigma_t) ** 2) * 100.0

    # 3. Speed / Maneuvering factor:
    # Tankers discharging often slow down to 8-12 knots or execute course alterations
    if 6.0 <= speed_knots <= 13.0:
        speed_score = 90.0
    elif speed_knots < 6.0:
        speed_score = 75.0
    else:
        speed_score = max(20.0, 100.0 - (speed_knots - 13.0) * 8.0)

    # 4. Vessel Hazard / Draught factor:
    is_tanker = "tanker" in vessel_type.lower()
    is_cargo = "cargo" in vessel_type.lower() or "container" in vessel_type.lower()

    hazard_base = 95.0 if is_tanker else (70.0 if is_cargo else 40.0)
    # Significant negative draft change indicates cargo or ballast water discharge
    if draught_change_m < -0.5:
        draught_bonus = min(20.0, abs(draught_change_m) * 15.0)
    else:
        draught_bonus = 0.0

    hazard_score = min(100.0, hazard_base + draught_bonus)

    # Composite weighted compatibility index:
    # Spatial: 40%, Temporal: 30%, Speed profile: 15%, Hazard/Draft: 15%
    total_score = (
        spatial_score * 0.40 +
        temporal_score * 0.30 +
        speed_score * 0.15 +
        hazard_score * 0.15
    )
    total_score = round(min(99.4, max(5.0, total_score)), 1)

    # Determine risk category
    if total_score >= 85.0:
        risk_level = "CRITICAL_LEAD"
    elif total_score >= 70.0:
        risk_level = "ELEVATED"
    elif total_score >= 45.0:
        risk_level = "MODERATE"
    else:
        risk_level = "LOW_COMPATIBILITY"

    return {
        "compatibility_score": total_score,
        "risk_level": risk_level,
        "factors": {
            "spatial_proximity_pct": round(spatial_score, 1),
            "temporal_alignment_pct": round(temporal_score, 1),
            "speed_profile_pct": round(speed_score, 1),
            "hazard_profile_pct": round(hazard_score, 1)
        }
    }
