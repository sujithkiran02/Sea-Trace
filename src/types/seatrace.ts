export type IncidentStatus = 
  | 'NEW' 
  | 'ACTIVE'
  | 'DETECTED' 
  | 'VALIDATING' 
  | 'VALIDATED'
  | 'RECONSTRUCTING' 
  | 'VESSEL_ANALYSIS' 
  | 'REVIEW' 
  | 'CLOSED' 
  | 'ARCHIVED';

export type IncidentSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface Incident {
  id: string;
  title: string;
  region: string;
  status: IncidentStatus;
  severity: IncidentSeverity;
  lat: number;
  lng: number;
  detection_time: string;
  source: string;
  estimated_volume_m3?: number;
  spill_type?: string;
  footprint_geojson?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface DetectionResult {
  id: string;
  incident_id: string;
  scene_id: string;
  sensor: string;
  acquisition_time: string;
  polarization: string;
  area_km2: number;
  slick_confidence: number;
  dark_pixel_count: number;
  mask_url?: string;
  contour_geojson?: string;
  source_image_url?: string;
  created_at: string;
}

export type ValidationDecision = 'UNREVIEWED' | 'NEEDS_REVIEW' | 'SUPPORTED' | 'REJECTED' | 'INCONCLUSIVE';

export interface ValidationReview {
  id: string;
  incident_id: string;
  detection_id?: string;
  decision: ValidationDecision;
  reviewer_name: string;
  reviewer_role?: string;
  wind_speed_knots?: number;
  biogenic_risk?: string;
  natural_seep_proximity_km?: number;
  confidence_level?: number;
  checklist_json?: string;
  notes?: string;
  reviewed_at: string;
}

export interface DriftTrajectoryPoint {
  time_hours: number;
  lat: number;
  lng: number;
  particles: number;
}

export interface DriftRun {
  id: string;
  incident_id: string;
  model_type?: string;
  simulation_type?: string;
  time_window_hours: number;
  particle_count: number;
  particles_count?: number;
  backtrack_hours?: number;
  windage_leeway: number;
  current_deflection_deg?: number;
  status: string;
  origin_lat: number;
  origin_lng: number;
  origin_uncertainty_km: number;
  estimated_release_time?: string;
  trajectories_geojson?: string;
  trajectories_json?: string;
  environmental_sources: string;
  completed_at: string;
}

export type RiskLevel = 'CRITICAL_LEAD' | 'ELEVATED' | 'MODERATE' | 'LOW_RELEVANCE';

export interface VesselCandidate {
  id: string;
  incident_id: string;
  drift_run_id?: string;
  mmsi: string;
  vessel_name: string;
  vessel_type: string;
  flag: string;
  imo?: string;
  speed_knots?: number;
  course_deg?: number;
  draught_m?: number;
  destination?: string;
  cpa_distance_km: number;
  time_offset_hours: number;
  compatibility_score: number;
  risk_level: RiskLevel;
  ais_track_geojson?: string;
  scoring_factors_json?: string;
}

export interface CounterfactualScenario {
  id: string;
  incident_id: string;
  vessel_id?: string;
  scenario_name: string;
  release_lat: number;
  release_lng: number;
  release_time: string;
  simulated_volume_m3: number;
  jaccard_similarity: number;
  centroid_offset_km: number;
  overall_correlation: number;
  verdict: string;
  notes?: string;
  created_at: string;
}

export type VerificationStatus = 'UNVERIFIED' | 'VERIFIED' | 'INTEGRITY_MISMATCH' | 'VERIFICATION_FAILED';

export interface VerificationHistoryEntry {
  timestamp: string;
  actor: string;
  action: 'HASH_CHECK' | 'TAMPER_TEST' | 'RESTORE';
  calculated_hash: string;
  expected_hash: string;
  status: VerificationStatus;
  message?: string;
}

export interface EvidenceArtifact {
  id: string;
  incident_id: string;
  artifact_type: string;
  title: string;
  filename: string;
  mime_type: string;
  sha256_hash: string;
  calculated_hash?: string;
  verification_status: VerificationStatus;
  file_size_bytes: number;
  source_provenance: string;
  collector: string;
  acquisition_time?: string;
  ingested_at: string;
  processing_history?: string[];
  verification_history?: VerificationHistoryEntry[];
  upstream_ids?: string[];
  downstream_ids?: string[];
  relationship_summary?: string;
  raw_content?: string;
  tampered_content?: string;
  is_tampered?: boolean;
}

export interface DataSource {
  id: string;
  name: string;
  provider: string;
  data_type: string;
  status: 'LIVE' | 'AVAILABLE' | 'STALE' | 'DEGRADED' | 'UNCONFIGURED' | 'DEMO';
  latency_ms: number;
  last_success_time?: string;
  error_details?: string;
}

export interface AuditEvent {
  id: string;
  incident_id: string;
  action: string;
  actor: string;
  details: string;
  timestamp: string;
  artifact_id?: string;
  outcome?: 'SUCCESS' | 'MISMATCH_DETECTED' | 'FAILED' | 'VERIFIED' | 'EXPORTED' | 'INFO';
}

export interface DashboardSummary {
  total_incidents: number;
  active_incidents: number;
  under_review: number;
  closed_incidents: number;
  severity_breakdown: Record<string, number>;
  region_breakdown: Record<string, number>;
  total_slicks_area_km2: number;
  high_risk_vessel_leads: number;
  system_health_pct: number;
  recent_activity: AuditEvent[];
}

export interface SystemServiceStatus {
  name: string;
  status: 'HEALTHY' | 'DEGRADED' | 'UNAVAILABLE' | 'NOT_CONFIGURED';
  latency_ms: number;
  last_check: string;
}

export interface SystemStatusData {
  status: string;
  environment: string;
  api_version: string;
  active_workers: number;
  uptime_seconds: number;
  services: SystemServiceStatus[];
  active_jobs: {
    job_id: string;
    incident_id: string;
    type: string;
    status: string;
    progress_pct: number;
  }[];
}

export type FeatureTab = 
  | 'landing'
  | 'dashboard'
  | 'incidents'
  | 'detection'
  | 'validation'
  | 'reconstruction'
  | 'vessels'
  | 'counterfactual'
  | 'evidence'
  | 'reports'
  | 'datasources'
  | 'system';
