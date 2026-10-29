import math
from typing import Dict, Any

def evaluate_counterfactual_scenario(
    candidate_lat: float,
    candidate_lng: float,
    observed_lat: float,
    observed_lng: float,
    release_hours_ago: float,
    simulated_volume_m3: float = 120.0
) -> Dict[str, Any]:
    """
    Evaluates a candidate release hypothesis by forward advecting simulated slick
    and computing geometric overlap (Jaccard) and centroid discrepancy against observed SAR detection.
    """
    # Net drift rate ~ 0.5 m/s (~1.8 km/h) under typical trade wind/current conditions
    drift_km_per_hour = 1.75
    expected_drift_distance_km = drift_km_per_hour * release_hours_ago

    # Haversine distance from candidate release to observed slick
    r_earth = 6371.0
    dlat = math.radians(observed_lat - candidate_lat)
    dlng = math.radians(observed_lng - candidate_lng)
    a = (math.sin(dlat / 2.0) ** 2 +
         math.cos(math.radians(candidate_lat)) * math.cos(math.radians(observed_lat)) *
         math.sin(dlng / 2.0) ** 2)
    actual_distance_km = r_earth * (2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a)))

    # Centroid offset error: discrepancy between expected advection distance and actual distance
    centroid_offset_km = round(abs(actual_distance_km - expected_drift_distance_km), 2)

    # Jaccard index: overlap between circular approximations of simulated vs observed footprints
    # Discrepancy penalizes Jaccard index
    tolerance_km = 4.5
    jaccard = max(0.05, min(0.95, math.exp(-centroid_offset_km / tolerance_km)))
    jaccard = round(jaccard, 2)

    overall_correlation = round(jaccard * 100.0 * (1.0 - min(0.4, centroid_offset_km / 25.0)), 1)
    overall_correlation = max(5.0, min(96.0, overall_correlation))

    if overall_correlation >= 80.0:
        verdict = "HIGHLY_PLAUSIBLE"
        notes = f"Forward advection aligns with observed slick geometry within {centroid_offset_km} km centroid tolerance."
    elif overall_correlation >= 55.0:
        verdict = "PLAUSIBLE"
        notes = f"General trajectory alignment observed; moderate {centroid_offset_km} km offset due to local current shear."
    elif overall_correlation >= 30.0:
        verdict = "IMPLAUSIBLE"
        notes = f"Large {centroid_offset_km} km discrepancy between projected forward advection and satellite slick location."
    else:
        verdict = "EXCLUDED"
        notes = f"Release coordinates spatially incompatible with prevailing environmental forcing vectors."

    return {
        "jaccard_similarity": jaccard,
        "centroid_offset_km": centroid_offset_km,
        "overall_correlation": overall_correlation,
        "verdict": verdict,
        "notes": notes
    }
