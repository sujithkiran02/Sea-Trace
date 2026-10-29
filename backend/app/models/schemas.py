from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

# Incident Schemas
class IncidentCreate(BaseModel):
    title: str
    region: str
    severity: str = "MEDIUM" # LOW, MEDIUM, HIGH, CRITICAL
    lat: float
    lng: float
    detection_time: str
    source: str = "Sentinel-1A SAR"
    estimated_volume_m3: Optional[float] = None
    spill_type: Optional[str] = "Crude Oil / Bunker C"
    notes: Optional[str] = None
    footprint_geojson: Optional[str] = None

class IncidentUpdate(BaseModel):
    title: Optional[str] = None
    status: Optional[str] = None
    severity: Optional[str] = None
    notes: Optional[str] = None
    estimated_volume_m3: Optional[float] = None
    spill_type: Optional[str] = None

class IncidentOut(BaseModel):
    id: str
    title: str
    region: str
    status: str
    severity: str
    lat: float
    lng: float
    detection_time: str
    source: str
    estimated_volume_m3: Optional[float]
    spill_type: Optional[str]
    footprint_geojson: Optional[str]
    notes: Optional[str]
    created_at: str
    updated_at: str

# Detection Schemas
class DetectionOut(BaseModel):
    id: str
    incident_id: str
    satellite_mission: str
    sensor: str
    acquisition_time: str
    resolution_m: Optional[float]
    area_km2: float
    perimeter_km: Optional[float]
    confidence_score: float
    damping_ratio: Optional[float]
    mask_geojson: Optional[str]
    scene_id: Optional[str]
    processing_parameters: Optional[str]
    created_at: str

# Validation Review Schemas
class ValidationReviewCreate(BaseModel):
    decision: str # SUPPORTED, REJECTED, INCONCLUSIVE
    reviewer_name: str
    reviewer_role: str = "Senior Oceanographer"
    wind_speed_knots: float = 6.4
    biogenic_risk: str = "LOW"
    natural_seep_proximity_km: float = 142.0
    confidence_level: Optional[Any] = "HIGH"
    checklist_json: str
    notes: Optional[str] = None

class ValidationReviewOut(BaseModel):
    id: str
    incident_id: str
    detection_id: Optional[str]
    decision: str
    reviewer_name: str
    reviewer_role: str
    wind_speed_knots: Optional[float]
    biogenic_risk: Optional[str]
    natural_seep_proximity_km: Optional[float]
    confidence_level: Optional[Any]
    checklist_json: str
    notes: Optional[str]
    reviewed_at: str

# Drift Run Schemas
class DriftRunRequest(BaseModel):
    time_window_hours: int = 24
    particle_count: int = 500
    windage_leeway: float = 0.03 # 3% wind leeway
    current_deflection_deg: float = 12.0

class DriftRunOut(BaseModel):
    id: str
    incident_id: str
    simulation_type: str
    time_window_hours: int
    particle_count: int
    windage_leeway: float
    current_deflection_deg: Optional[float]
    status: str
    origin_lat: Optional[float]
    origin_lng: Optional[float]
    origin_uncertainty_km: Optional[float]
    trajectories_geojson: Optional[str]
    environmental_sources: Optional[str]
    completed_at: Optional[str]

# Vessel Candidate Schemas
class VesselCandidateOut(BaseModel):
    id: str
    incident_id: str
    mmsi: str
    vessel_name: str
    flag: str
    imo: Optional[str]
    vessel_type: str
    speed_knots: Optional[float]
    course_deg: Optional[float]
    distance_to_origin_km: float
    time_offset_hours: float
    draught_change_m: Optional[float]
    compatibility_score: float
    risk_level: str
    track_geojson: Optional[str]
    factors_json: str

# Counterfactual Schemas
class CounterfactualRequest(BaseModel):
    vessel_id: Optional[str] = None
    scenario_name: str
    release_lat: float
    release_lng: float
    release_time: str
    simulated_volume_m3: float = 120.0
    notes: Optional[str] = None

class CounterfactualOut(BaseModel):
    id: str
    incident_id: str
    vessel_id: Optional[str]
    scenario_name: str
    release_lat: float
    release_lng: float
    release_time: str
    simulated_volume_m3: Optional[float]
    jaccard_similarity: float
    centroid_offset_km: float
    overall_correlation: float
    verdict: str
    notes: Optional[str]
    created_at: str

# Evidence Schemas
class EvidenceArtifactOut(BaseModel):
    id: str
    incident_id: str
    artifact_type: str
    title: str
    file_path: Optional[str]
    sha256_hash: str
    file_size_bytes: Optional[int]
    source_system: str
    ingested_at: str
    verified: bool
    metadata_json: Optional[str]

# Data Source Schemas
class DataSourceOut(BaseModel):
    id: str
    name: str
    provider: str
    category: str
    status: str
    mode: str
    latency_ms: Optional[int]
    last_success_time: Optional[str]
    error_message: Optional[str]
    details: Optional[str]

# Dashboard Summary Schema
class DashboardSummaryOut(BaseModel):
    total_incidents: int
    active_incidents: int
    under_review: int
    closed_incidents: int
    severity_breakdown: Dict[str, int]
    region_breakdown: Dict[str, int]
    total_slicks_area_km2: float
    high_risk_vessel_leads: int
    system_health_pct: float
    recent_activity: List[Dict[str, Any]]
