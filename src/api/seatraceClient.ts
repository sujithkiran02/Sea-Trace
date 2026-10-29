import type {
  Incident,
  DetectionResult,
  ValidationReview,
  DriftRun,
  VesselCandidate,
  CounterfactualScenario,
  EvidenceArtifact,
  AuditEvent,
  DataSource,
  DashboardSummary,
  SystemStatusData
} from '../types/seatrace';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

let isBackendLive = false;

export async function checkBackendHealth(): Promise<{ online: boolean; status?: string }> {
  try {
    const res = await fetch(`${BASE_URL}/health`, { method: 'GET', signal: AbortSignal.timeout(2000) });
    if (res.ok) {
      isBackendLive = true;
      const data = await res.json();
      return { online: true, status: data.status };
    }
  } catch (err) {
    // Backend offline
  }
  isBackendLive = false;
  return { online: false };
}

export function getBackendStatus() {
  return isBackendLive;
}

// Fallback Mock Datasets if backend is temporarily disconnected
const FALLBACK_INCIDENTS: Incident[] = [
  {
    id: 'IN-2026-61C2',
    title: 'Kandla Deepwater Fairway Hydrocarbon Discharge',
    region: 'Gulf of Kutch (West Coast)',
    status: 'VALIDATED',
    severity: 'HIGH',
    lat: 22.5640,
    lng: 69.7820,
    detection_time: '2026-09-14T10:30:00Z',
    source: 'Sentinel-1B C-Band SAR',
    estimated_volume_m3: 75.0,
    spill_type: 'Heavy Fuel Oil (HFO)',
    notes: 'Petroleum slick detected along Kandla Deepwater Fairway. Reverse Lagrangian drift initiated for origin reconstruction.',
    created_at: '2026-09-14T10:45:00Z',
    updated_at: '2026-09-14T11:00:00Z'
  },
  {
    id: 'IN-2026-0881',
    title: 'Mumbai High Offshore Platform Slick Detection',
    region: 'Arabian Sea (West Coast)',
    status: 'VESSEL_ANALYSIS',
    severity: 'HIGH',
    lat: 19.4182,
    lng: 71.3412,
    detection_time: '2026-10-23T04:15:00Z',
    source: 'Sentinel-1B C-Band SAR',
    estimated_volume_m3: 145.0,
    spill_type: 'Heavy Fuel Oil (HFO)',
    notes: 'Dark linear formation detected 42 nm west of Mumbai High offshore cluster. Significant damping observed.',
    created_at: '2026-10-23T04:30:00Z',
    updated_at: '2026-10-23T05:00:00Z'
  },
  {
    id: 'IN-2026-0842',
    title: 'Kochi Port Approach Channel Bunker Sheen',
    region: 'Arabian Sea (South West Coast)',
    status: 'VALIDATING',
    severity: 'MEDIUM',
    lat: 9.9412,
    lng: 76.1284,
    detection_time: '2026-10-22T19:40:00Z',
    source: 'Sentinel-1A SAR',
    estimated_volume_m3: 35.0,
    spill_type: 'Marine Gas Oil (MGO)',
    notes: 'Sheen reported by harbor pilot along the main inbound container fairway.',
    created_at: '2026-10-22T20:00:00Z',
    updated_at: '2026-10-22T21:15:00Z'
  },
  {
    id: 'IN-2026-0790',
    title: 'Ennore Coromandel Coast Discolored Plume',
    region: 'Bay of Bengal (East Coast)',
    status: 'REVIEW',
    severity: 'LOW',
    lat: 13.2450,
    lng: 80.3520,
    detection_time: '2026-10-21T11:20:00Z',
    source: 'Sentinel-2 MSI Optical',
    estimated_volume_m3: 12.0,
    spill_type: 'Industrial Runoff / Fly Ash',
    notes: 'Thermal plume identified near thermal plant cooling water outlet.',
    created_at: '2026-10-21T12:00:00Z',
    updated_at: '2026-10-21T14:30:00Z'
  },
  {
    id: 'IN-2026-0715',
    title: 'Paradip Port Bulk Carrier Bilge Discharge',
    region: 'Bay of Bengal (East Coast)',
    status: 'CLOSED',
    severity: 'CRITICAL',
    lat: 20.2150,
    lng: 86.6980,
    detection_time: '2026-10-18T08:10:00Z',
    source: 'Sentinel-1 SAR + Coast Guard Dornier Patrol',
    estimated_volume_m3: 310.0,
    spill_type: 'Oily Bilge Water / Sludge',
    notes: 'Investigation concluded. Vessel detained under Indian Merchant Shipping Act 1958.',
    created_at: '2026-10-18T09:00:00Z',
    updated_at: '2026-10-20T16:00:00Z'
  }
];

export async function fetchDashboardSummary(): Promise<DashboardSummary> {
  try {
    const res = await fetch(`${BASE_URL}/api/v1/dashboard/summary`);
    if (res.ok) {
      isBackendLive = true;
      return await res.json();
    }
  } catch (e) {
    // use fallback
  }

  isBackendLive = false;
  return {
    total_incidents: 4,
    active_incidents: 3,
    under_review: 2,
    closed_incidents: 1,
    severity_breakdown: { LOW: 1, MEDIUM: 1, HIGH: 1, CRITICAL: 1 },
    region_breakdown: {
      'Arabian Sea (West Coast)': 2,
      'Bay of Bengal (East Coast)': 2
    },
    total_slicks_area_km2: 24.8,
    high_risk_vessel_leads: 2,
    system_health_pct: 98.5,
    recent_activity: [
      {
        id: 'AUD-01',
        incident_id: 'IN-2026-0881',
        action: 'DRIFT_SIMULATION_RUN',
        actor: 'Lagrangian Ocean Engine',
        details: 'Calculated backward drift origin 19.3400N, 71.2100E (±4.2 km)',
        timestamp: '2026-10-23T06:10:00Z'
      },
      {
        id: 'AUD-02',
        incident_id: 'IN-2026-0881',
        action: 'VESSEL_MATCHED',
        actor: 'AIS Corridor Correlator',
        details: 'Flagged MT BHARAT SAGAR (94.2% compatibility) as Critical Lead',
        timestamp: '2026-10-23T06:30:00Z'
      }
    ]
  };
}

export async function fetchIncidents(params?: {
  status?: string;
  severity?: string;
  region?: string;
  search?: string;
}): Promise<Incident[]> {
  try {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.severity) query.set('severity', params.severity);
    if (params?.region) query.set('region', params.region);
    if (params?.search) query.set('search', params.search);

    const res = await fetch(`${BASE_URL}/api/v1/incidents?${query.toString()}`);
    if (res.ok) {
      isBackendLive = true;
      return await res.json();
    }
  } catch (e) {}

  isBackendLive = false;
  let filtered = [...FALLBACK_INCIDENTS];
  if (params?.status && params.status !== 'ALL') {
    filtered = filtered.filter(i => i.status === params.status);
  }
  if (params?.severity && params.severity !== 'ALL') {
    filtered = filtered.filter(i => i.severity === params.severity);
  }
  if (params?.search) {
    const q = params.search.toLowerCase();
    filtered = filtered.filter(i => i.title.toLowerCase().includes(q) || i.id.toLowerCase().includes(q));
  }
  return filtered;
}

export async function createIncident(data: {
  title: string;
  region: string;
  severity: string;
  lat: number;
  lng: number;
  detection_time: string;
  source: string;
  estimated_volume_m3?: number;
  spill_type?: string;
  notes?: string;
}): Promise<Incident> {
  const res = await fetch(`${BASE_URL}/api/v1/incidents`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to create incident on server');
  return await res.json();
}

export async function updateIncident(
  incidentId: string,
  data: Partial<Incident>
): Promise<Incident> {
  const res = await fetch(`${BASE_URL}/api/v1/incidents/${incidentId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to update incident on server');
  return await res.json();
}

export async function fetchIncidentDetections(incidentId: string): Promise<DetectionResult[]> {
  try {
    const res = await fetch(`${BASE_URL}/api/v1/incidents/${incidentId}/detections`);
    if (res.ok) {
      isBackendLive = true;
      return await res.json();
    }
  } catch (e) {}

  return [
    {
      id: 'DET-DEMO',
      incident_id: incidentId,
      scene_id: 'S1A_IW_GRDH_1SDV_20261023T041520',
      sensor: 'Sentinel-1 C-SAR (VV+VH)',
      acquisition_time: '2026-10-23T04:15:20Z',
      polarization: 'VV',
      area_km2: 14.82,
      slick_confidence: 0.94,
      dark_pixel_count: 14820,
      mask_url: '/assets/sar_mask_demo.png',
      created_at: '2026-10-23T04:20:00Z'
    }
  ];
}

export async function fetchIncidentValidations(incidentId: string): Promise<ValidationReview[]> {
  try {
    const res = await fetch(`${BASE_URL}/api/v1/incidents/${incidentId}/validation`);
    if (res.ok) return await res.json();
  } catch (e) {}
  return [];
}

export async function recordValidationReview(
  incidentId: string,
  review: {
    decision: string;
    reviewer_name: string;
    reviewer_role?: string;
    wind_speed_knots?: number;
    biogenic_risk?: string;
    natural_seep_proximity_km?: number;
    confidence_level?: number;
    checklist_json?: string;
    notes?: string;
  }
): Promise<ValidationReview> {
  const res = await fetch(`${BASE_URL}/api/v1/incidents/${incidentId}/validation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(review)
  });
  if (!res.ok) throw new Error('Failed to save validation review');
  return await res.json();
}

export function generateClientDriftRun(
  incidentId: string,
  params: {
    time_window_hours: number;
    particle_count: number;
    windage_leeway: number;
    current_deflection_deg: number;
  }
): DriftRun {
  const isKandla = !incidentId || incidentId.includes('61C2') || incidentId.includes('KDL');
  
  // Detection point (slick center) in Gulf of Kutch fairway
  const slickLat = isKandla ? 22.5640 : 19.4182;
  const slickLng = isKandla ? 69.7820 : 71.3412;

  // Hydrodynamic displacement calculation
  const hours = params.time_window_hours || 24;
  const timeFactor = hours / 24.0;
  const leewayFactor = (params.windage_leeway || 0.03) / 0.03;
  const deflRad = ((params.current_deflection_deg ?? 20.0) * Math.PI) / 180.0;

  // Origin centroid (water channel fairway)
  const originLat = isKandla
    ? Number((22.6580 + (Math.sin(deflRad) * 0.03 - 0.015) * timeFactor).toFixed(4))
    : Number((slickLat + 0.12 * timeFactor).toFixed(4));
  const originLng = isKandla
    ? Number((69.3400 - 0.06 * (timeFactor - 1) * leewayFactor).toFixed(4))
    : Number((slickLng - 0.14 * timeFactor).toFixed(4));

  const uncertaintyKm = Number((1.8 + 0.4 * (hours / 24.0)).toFixed(1));

  // Generate 36 spectral ensemble particle trajectories curving along Gulf of Kutch fairway
  const trajectories = [];
  const numTrajectories = Math.min(params.particle_count || 1000, 36);
  const numSteps = 8;

  for (let pIdx = 0; pIdx < numTrajectories; pIdx++) {
    const spreadBias = (pIdx / (numTrajectories - 1) - 0.5) * 2.0;
    const latSpread = (spreadBias * uncertaintyKm * 0.45) / 111.0;
    const lngSpread = (spreadBias * uncertaintyKm * 0.70) / (111.0 * Math.cos((slickLat * Math.PI) / 180));

    const pts = [];
    for (let s = 0; s <= numSteps; s++) {
      const tRatio = s / numSteps;
      const stepHours = -hours * tRatio;

      // Hydrodynamic channel bezier curve: bends along fairway channel
      const curLat = slickLat + (originLat + latSpread - slickLat) * Math.pow(tRatio, 1.05) + Math.sin(tRatio * Math.PI) * 0.025 * (spreadBias * 0.5 + 0.5);
      const curLng = slickLng + (originLng + lngSpread - slickLng) * Math.pow(tRatio, 1.02);

      pts.push({
        lat: Number(curLat.toFixed(4)),
        lng: Number(curLng.toFixed(4)),
        time_hours: Number(stepHours.toFixed(1))
      });
    }

    trajectories.push({
      particle_id: pIdx + 1,
      points: pts
    });
  }

  return {
    id: `DRIFT-SIM-${Math.floor(1000 + Math.random() * 9000)}`,
    incident_id: incidentId,
    simulation_type: 'LAGRANGIAN_REVERSE',
    time_window_hours: hours,
    particle_count: params.particle_count || 1000,
    windage_leeway: params.windage_leeway || 0.03,
    current_deflection_deg: params.current_deflection_deg ?? 20.0,
    status: 'COMPLETED',
    origin_lat: originLat,
    origin_lng: originLng,
    origin_uncertainty_km: uncertaintyKm,
    trajectories_json: JSON.stringify(trajectories),
    environmental_sources: 'HYCOM + ECMWF ERA5 (10m Wind)',
    completed_at: new Date().toISOString()
  };
}

export async function fetchIncidentDriftRuns(incidentId: string): Promise<DriftRun[]> {
  try {
    const res = await fetch(`${BASE_URL}/api/v1/incidents/${incidentId}/drift`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch (e) {}

  // Fallback to high-resolution simulated drift run
  return [generateClientDriftRun(incidentId, {
    time_window_hours: 24,
    particle_count: 1000,
    windage_leeway: 0.03,
    current_deflection_deg: 20.0
  })];
}

export async function runDriftReconstruction(
  incidentId: string,
  params: {
    time_window_hours: number;
    particle_count: number;
    windage_leeway: number;
    current_deflection_deg: number;
  }
): Promise<DriftRun> {
  try {
    const res = await fetch(`${BASE_URL}/api/v1/incidents/${incidentId}/drift`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    if (res.ok) return await res.json();
  } catch (e) {}

  // Simulate realistic client-side Lagrangian reconstruction when backend is offline
  return generateClientDriftRun(incidentId, params);
}

export function generateClientVesselCandidates(incidentId: string): VesselCandidate[] {
  const isKandla = !incidentId || incidentId.includes('61C2') || incidentId.includes('KDL');
  
  if (isKandla) {
    return [
      {
        id: 'VES-61C2-01',
        incident_id: incidentId,
        mmsi: '419000881',
        imo: '9384812',
        vessel_name: 'MT OCEAN PRIDE',
        vessel_type: 'Crude Oil Tanker',
        flag: 'Liberia',
        speed_knots: 13.8,
        course_deg: 230,
        draught_m: 12.8,
        destination: 'Kandla (Deendayal) -> Singapore',
        cpa_distance_km: 1.4,
        time_offset_hours: 0.4,
        compatibility_score: 91.4,
        risk_level: 'CRITICAL_LEAD',
        ais_track_geojson: JSON.stringify({
          type: 'LineString',
          coordinates: [
            [69.98, 22.78],
            [69.85, 22.72],
            [69.78, 22.68],
            [69.65, 22.62],
            [69.45, 22.56]
          ]
        }),
        scoring_factors_json: JSON.stringify({
          spatial_proximity_pct: 98.4,
          temporal_alignment_pct: 94.2,
          course_anomaly_pct: 88.0,
          draught_delta_pct: 85.0
        })
      },
      {
        id: 'VES-61C2-02',
        incident_id: incidentId,
        mmsi: '419002344',
        imo: '9452011',
        vessel_name: 'GAS GEMINI',
        vessel_type: 'LPG / Chemical Tanker',
        flag: 'Panama',
        speed_knots: 15.1,
        course_deg: 235,
        draught_m: 10.4,
        destination: 'Mundra -> Ras Tanura',
        cpa_distance_km: 4.8,
        time_offset_hours: -1.2,
        compatibility_score: 74.2,
        risk_level: 'ELEVATED',
        ais_track_geojson: JSON.stringify({
          type: 'LineString',
          coordinates: [
            [69.90, 22.80],
            [69.75, 22.72],
            [69.60, 22.65],
            [69.40, 22.55]
          ]
        }),
        scoring_factors_json: JSON.stringify({
          spatial_proximity_pct: 76.0,
          temporal_alignment_pct: 81.5,
          course_anomaly_pct: 65.0,
          draught_delta_pct: 74.3
        })
      },
      {
        id: 'VES-61C2-03',
        incident_id: incidentId,
        mmsi: '419003566',
        imo: '9628400',
        vessel_name: 'MAERSK DHOLERA',
        vessel_type: 'Container Ship (Ultra Large)',
        flag: 'Singapore',
        speed_knots: 16.4,
        course_deg: 240,
        draught_m: 14.1,
        destination: 'Mundra -> Jebel Ali',
        cpa_distance_km: 8.9,
        time_offset_hours: -2.1,
        compatibility_score: 58.5,
        risk_level: 'MODERATE',
        ais_track_geojson: JSON.stringify({
          type: 'LineString',
          coordinates: [
            [69.82, 22.82],
            [69.68, 22.74],
            [69.52, 22.64],
            [69.30, 22.50]
          ]
        }),
        scoring_factors_json: JSON.stringify({
          spatial_proximity_pct: 55.0,
          temporal_alignment_pct: 68.0,
          course_anomaly_pct: 42.0,
          draught_delta_pct: 69.0
        })
      },
      {
        id: 'VES-61C2-04',
        incident_id: incidentId,
        mmsi: '419004899',
        imo: '9310456',
        vessel_name: 'BHARAT SAMUDRA',
        vessel_type: 'Product / Chemical Tanker',
        flag: 'India',
        speed_knots: 12.0,
        course_deg: 245,
        draught_m: 9.8,
        destination: 'IOCL Vadinar -> Kochi',
        cpa_distance_km: 11.2,
        time_offset_hours: 3.2,
        compatibility_score: 42.0,
        risk_level: 'LOW_RELEVANCE',
        ais_track_geojson: JSON.stringify({
          type: 'LineString',
          coordinates: [
            [69.75, 22.50],
            [69.58, 22.42],
            [69.38, 22.32]
          ]
        }),
        scoring_factors_json: JSON.stringify({
          spatial_proximity_pct: 38.0,
          temporal_alignment_pct: 42.0,
          course_anomaly_pct: 35.0,
          draught_delta_pct: 53.0
        })
      },
      {
        id: 'VES-61C2-05',
        incident_id: incidentId,
        mmsi: '419005123',
        imo: '9401234',
        vessel_name: 'SWARNA SINDHU',
        vessel_type: 'Bulk Carrier (Capesize)',
        flag: 'India',
        speed_knots: 14.5,
        course_deg: 240,
        draught_m: 11.5,
        destination: 'Kandla -> Paradip',
        cpa_distance_km: 15.6,
        time_offset_hours: -4.0,
        compatibility_score: 28.4,
        risk_level: 'LOW_RELEVANCE',
        ais_track_geojson: JSON.stringify({
          type: 'LineString',
          coordinates: [
            [69.70, 22.45],
            [69.45, 22.35],
            [69.20, 22.25]
          ]
        }),
        scoring_factors_json: JSON.stringify({
          spatial_proximity_pct: 25.0,
          temporal_alignment_pct: 30.0,
          course_anomaly_pct: 20.0,
          draught_delta_pct: 38.6
        })
      }
    ];
  } else {
    // Mumbai High / Arabian Sea candidates (IN-2026-0881)
    return [
      {
        id: 'VES-0881-01',
        incident_id: incidentId,
        mmsi: '419001842',
        imo: '9482190',
        vessel_name: 'MT NEELKANTH GLORY',
        vessel_type: 'Crude Oil Tanker',
        flag: 'India',
        speed_knots: 12.8,
        course_deg: 242,
        draught_m: 13.2,
        destination: 'Mumbai High -> JNPT, Mumbai',
        cpa_distance_km: 1.8,
        time_offset_hours: 0.5,
        compatibility_score: 94.6,
        risk_level: 'CRITICAL_LEAD',
        ais_track_geojson: JSON.stringify({
          type: 'LineString',
          coordinates: [
            [71.60, 19.10], [71.66, 19.15], [71.71, 19.19], [71.77, 19.24], [71.84, 19.30]
          ]
        }),
        scoring_factors_json: JSON.stringify({
          spatial_proximity_pct: 98.2,
          temporal_alignment_pct: 95.0,
          course_anomaly_pct: 88.4,
          draught_delta_pct: 92.0
        })
      },
      {
        id: 'VES-0881-02',
        incident_id: incidentId,
        mmsi: '352002781',
        imo: '9318492',
        vessel_name: 'PACIFIC TRADER V',
        vessel_type: 'Chemical/Product Tanker',
        flag: 'Panama',
        speed_knots: 14.2,
        course_deg: 250,
        draught_m: 9.6,
        destination: 'Hazira -> Fujairah',
        cpa_distance_km: 5.6,
        time_offset_hours: -1.8,
        compatibility_score: 72.4,
        risk_level: 'ELEVATED',
        ais_track_geojson: JSON.stringify({
          type: 'LineString',
          coordinates: [
            [71.55, 19.05], [71.64, 19.12], [71.75, 19.21], [71.85, 19.29]
          ]
        }),
        scoring_factors_json: JSON.stringify({
          spatial_proximity_pct: 74.0,
          temporal_alignment_pct: 82.0,
          course_anomaly_pct: 60.0,
          draught_delta_pct: 30.0
        })
      },
      {
        id: 'VES-0881-03',
        incident_id: incidentId,
        mmsi: '636019441',
        imo: '9708142',
        vessel_name: 'EVER PROSPER',
        vessel_type: 'Container Ship',
        flag: 'Liberia',
        speed_knots: 18.5,
        course_deg: 238,
        draught_m: 14.5,
        destination: 'Mundra -> Colombo',
        cpa_distance_km: 14.2,
        time_offset_hours: -3.5,
        compatibility_score: 38.5,
        risk_level: 'LOW_RELEVANCE',
        ais_track_geojson: JSON.stringify({
          type: 'LineString',
          coordinates: [
            [71.40, 18.95], [71.58, 19.08], [71.80, 19.22]
          ]
        }),
        scoring_factors_json: JSON.stringify({
          spatial_proximity_pct: 35.0,
          temporal_alignment_pct: 45.0,
          course_anomaly_pct: 20.0,
          draught_delta_pct: 0.0
        })
      }
    ];
  }
}

export async function fetchVesselCandidates(incidentId: string): Promise<VesselCandidate[]> {
  try {
    const res = await fetch(`${BASE_URL}/api/v1/incidents/${incidentId}/vessels`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch (e) {}

  return generateClientVesselCandidates(incidentId);
}

export function generateClientCounterfactualScenarios(incidentId: string): CounterfactualScenario[] {
  const isKandla = !incidentId || incidentId.includes('61C2') || incidentId.includes('KDL');
  if (isKandla) {
    return [
      {
        id: 'SCEN-61C2-01',
        incident_id: incidentId,
        vessel_id: 'VES-61C2-01',
        scenario_name: 'Primary Lead Release (MT OCEAN PRIDE @ Fairway Buoy)',
        release_lat: 22.564,
        release_lng: 69.782,
        release_time: '2026-09-14T08:15:00Z',
        simulated_volume_m3: 75.0,
        jaccard_similarity: 0.89,
        centroid_offset_km: 0.9,
        overall_correlation: 91.4,
        verdict: 'HIGHLY_PLAUSIBLE',
        notes: 'Forward advection closely matches observed Sentinel-1 SAR slick footprint with 0.9 km centroid offset along the flood current axis.',
        created_at: '2026-09-14T11:30:00Z'
      },
      {
        id: 'SCEN-61C2-02',
        incident_id: incidentId,
        vessel_id: 'VES-61C2-02',
        scenario_name: 'Alternate Vessel Release (GAS GEMINI @ 07:00Z)',
        release_lat: 22.62,
        release_lng: 69.72,
        release_time: '2026-09-14T07:00:00Z',
        simulated_volume_m3: 45.0,
        jaccard_similarity: 0.42,
        centroid_offset_km: 6.8,
        overall_correlation: 48.2,
        verdict: 'IMPLAUSIBLE',
        notes: 'Simulated slick dispersion drifts 6.8 km seaward of detected slick due to westward channel ebb tidal flow.',
        created_at: '2026-09-14T11:45:00Z'
      }
    ];
  }
  return [
    {
      id: 'SCEN-0881-01',
      incident_id: incidentId,
      vessel_id: 'VES-0881-01',
      scenario_name: 'Primary Lead Release (MT Neelkanth Glory @ 18:30Z)',
      release_lat: 19.182,
      release_lng: 71.705,
      release_time: '2026-10-21T18:30:00Z',
      simulated_volume_m3: 280.0,
      jaccard_similarity: 0.86,
      centroid_offset_km: 1.2,
      overall_correlation: 92.8,
      verdict: 'HIGHLY_PLAUSIBLE',
      notes: 'Forward advection matches observed SAR slick geometry and elongation orientation within 1.2 km centroid tolerance.',
      created_at: '2026-10-22T10:15:00Z'
    }
  ];
}

export async function fetchCounterfactualScenarios(incidentId: string): Promise<CounterfactualScenario[]> {
  try {
    const res = await fetch(`${BASE_URL}/api/v1/incidents/${incidentId}/counterfactual`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch (e) {}

  return generateClientCounterfactualScenarios(incidentId);
}

export async function runCounterfactualScenario(
  incidentId: string,
  scenario: {
    scenario_name: string;
    vessel_id?: string;
    release_lat: number;
    release_lng: number;
    release_time: string;
    simulated_volume_m3: number;
  }
): Promise<CounterfactualScenario> {
  try {
    const res = await fetch(`${BASE_URL}/api/v1/incidents/${incidentId}/counterfactual`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(scenario)
    });
    if (res.ok) return await res.json();
  } catch (e) {}

  // Realistic simulation fallback
  const offset = Number((0.8 + Math.random() * 2.5).toFixed(1));
  const jaccard = Number((0.75 + Math.random() * 0.18).toFixed(2));
  const correlation = Number((jaccard * 100).toFixed(1));

  return {
    id: `SCEN-SIM-${Math.floor(1000 + Math.random() * 9000)}`,
    incident_id: incidentId,
    vessel_id: scenario.vessel_id,
    scenario_name: scenario.scenario_name,
    release_lat: scenario.release_lat,
    release_lng: scenario.release_lng,
    release_time: scenario.release_time,
    simulated_volume_m3: scenario.simulated_volume_m3,
    jaccard_similarity: jaccard,
    centroid_offset_km: offset,
    overall_correlation: correlation,
    verdict: correlation >= 80 ? 'HIGHLY_PLAUSIBLE' : correlation >= 60 ? 'PLAUSIBLE' : 'IMPLAUSIBLE',
    notes: `Simulated forward advection dispersion evaluated against observed SAR footprint (${correlation}% correlation).`,
    created_at: new Date().toISOString()
  };
}

export function generateClientEvidenceArtifacts(incidentId: string): EvidenceArtifact[] {
  const isKandla = !incidentId || incidentId.includes('61C2') || incidentId.includes('KDL');
  const targetId = isKandla ? 'IN-2026-61C2' : incidentId;

  const rawSar = `<?xml version="1.0" encoding="UTF-8"?>
<sentinel1:acquisition id="S1C_IW_GRDH_1SDV_20261023T061422">
  <polarization>VV+VH</polarization>
  <orbit>42188</orbit>
  <subSwath>IW2</subSwath>
  <centerCoords lat="22.7840" lng="69.7120"/>
  <spatialResolution unit="m">10</spatialResolution>
  <backscatterCalibration mode="GRD">
    <meanDampingDb>-7.8</meanDampingDb>
  </backscatterCalibration>
</sentinel1:acquisition>`;

  const tamperedSar = `<?xml version="1.0" encoding="UTF-8"?>
<sentinel1:acquisition id="S1C_IW_GRDH_1SDV_20261023T061422">
  <polarization>VV+VH</polarization>
  <orbit>99999</orbit>
  <subSwath>IW2</subSwath>
  <centerCoords lat="22.7840" lng="69.7120"/>
  <spatialResolution unit="m">10</spatialResolution>
  <backscatterCalibration mode="GRD">
    <meanDampingDb>-7.8</meanDampingDb>
  </backscatterCalibration>
</sentinel1:acquisition>`;

  const rawGeoJson = JSON.stringify({
    type: 'FeatureCollection',
    features: [{
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [[[69.697, 22.776], [69.724, 22.780], [69.734, 22.796], [69.707, 22.800], [69.697, 22.776]]]
      },
      properties: {
        slick_area_km2: 4.82,
        confidence_pct: 94.6,
        sensor: 'Sentinel-1C SAR IW',
        classification: 'Confirmed Hydrocarbon Bunker Oil'
      }
    }]
  }, null, 2);

  const tamperedGeoJson = JSON.stringify({
    type: 'FeatureCollection',
    features: [{
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [[[69.697, 22.776], [69.724, 22.780], [69.734, 22.796], [69.707, 22.800], [69.697, 22.776]]]
      },
      properties: {
        slick_area_km2: 1.20,
        confidence_pct: 50.0,
        sensor: 'Sentinel-1C SAR IW',
        classification: 'Biogenic Lookalike Algae'
      }
    }]
  }, null, 2);

  const rawValDecision = JSON.stringify({
    validation_id: 'VAL-61C2-01',
    incident_id: targetId,
    decision: 'SUPPORTED',
    reviewer: 'Dr. Aris Thorne (Chief Marine Biophysicist, DGLL)',
    biogenic_risk: 'LOW (Chlorophyll-a 0.12 mg/m3)',
    natural_seep_proximity_km: 142.5,
    confidence_pct: 94.6,
    signed_at: '2026-10-23T07:15:00Z',
    statutory_basis: 'Indian Merchant Shipping Act 1958 Part XIA'
  }, null, 2);

  const tamperedValDecision = JSON.stringify({
    validation_id: 'VAL-61C2-01',
    incident_id: targetId,
    decision: 'REJECTED',
    reviewer: 'Unknown External Entity',
    biogenic_risk: 'HIGH',
    natural_seep_proximity_km: 0.5,
    confidence_pct: 20.0,
    signed_at: '2026-10-23T07:15:00Z',
    statutory_basis: 'Unverified'
  }, null, 2);

  const rawDriftLog = JSON.stringify({
    run_id: 'DRIFT-61C2-01',
    incident_id: targetId,
    solver: 'OpenDrift Lagrangian Ensemble v2.4',
    particles_tracked: 500,
    backtrack_window_hours: 18.0,
    hydrodynamic_forcing: 'INCOIS ROMS High-Resolution 1/12 deg',
    wind_forcing: 'ERA5 Marine 10m Wind (14.2 kn @ 035 deg)',
    reconstructed_origin: { lat: 22.8420, lng: 69.8150, uncertainty_radius_km: 1.2 },
    estimated_release_window_utc: '2026-10-22T18:45:00Z'
  }, null, 2);

  const tamperedDriftLog = JSON.stringify({
    run_id: 'DRIFT-61C2-01',
    incident_id: targetId,
    solver: 'Modified / Tampered Drift Solver',
    particles_tracked: 10,
    backtrack_window_hours: 5.0,
    hydrodynamic_forcing: 'None',
    wind_forcing: 'Calm',
    reconstructed_origin: { lat: 20.0000, lng: 70.0000, uncertainty_radius_km: 100.0 },
    estimated_release_window_utc: '2026-10-22T00:00:00Z'
  }, null, 2);

  const rawAisCsv = `MMSI,IMO,Vessel_Name,Type,Flag,Timestamp_UTC,Latitude,Longitude,Speed_Kn,Course_Deg,CPA_km,Compatibility_Pct
419000881,9384812,MT OCEAN PRIDE,Crude Oil Tanker,Liberia,2026-10-22T18:42:15Z,22.8432,69.8138,13.8,230,1.4,91.4
419002344,9452011,GAS GEMINI,LPG Tanker,Panama,2026-10-22T17:30:00Z,22.8120,69.8540,15.1,235,4.8,74.2
419003566,9628400,MAERSK DHOLERA,Container Ship,Singapore,2026-10-22T16:35:00Z,22.7650,69.9020,18.4,240,8.9,58.5`;

  const tamperedAisCsv = `MMSI,IMO,Vessel_Name,Type,Flag,Timestamp_UTC,Latitude,Longitude,Speed_Kn,Course_Deg,CPA_km,Compatibility_Pct
999999999,0000000,GHOST SHIP,Unknown,Unknown,2026-10-22T00:00:00Z,00.0000,00.0000,0.0,0,99.9,0.0`;

  const rawDossierSummary = `SEATRACE.AI MARITIME FORENSIC DOSSIER ARCHIVE
Incident: IN-2026-61C2 (Kandla Deepwater Fairway Hydrocarbon Discharge)
Jurisdiction: Directorate General of Lighthouses & Lightships / Indian Coast Guard
Primary Correlated Suspect: MT OCEAN PRIDE (MMSI: 419000881, Flag: Liberia)
Correlation Index: 91.4% (CPA: 1.4 km, Release Delta: +0.4h)
Evidence Digest: Tamper-Evident SHA-256 Cryptographic Chain of Custody Verified`;

  const tamperedDossierSummary = `SEATRACE.AI MARITIME FORENSIC DOSSIER ARCHIVE - TAMPERED
Corrupted text block - authenticity compromised.`;

  return [
    {
      id: `EVID-${targetId.replace('IN-', '')}-01`,
      incident_id: targetId,
      artifact_type: 'RAW_SAR_SCENE',
      title: 'Sentinel-1C IW Level-1 GRD SAR Acquisition Raster',
      filename: `S1C_IW_GRDH_1SDV_20261023T061422_${targetId.replace('IN-', '')}.xml`,
      mime_type: 'application/xml',
      sha256_hash: '1897c602da0d6b4d51a61970f3ab3c994a515e55494c8de949a27419b9363da3',
      verification_status: 'UNVERIFIED',
      file_size_bytes: new TextEncoder().encode(rawSar).length,
      source_provenance: 'ESA Copernicus Open Access Hub / DGLL Marine Gateway',
      collector: 'Automated ESA SAR Sentinel Ingest Daemon (v2.1)',
      acquisition_time: '2026-10-23T06:14:22Z',
      ingested_at: '2026-10-23T06:30:15Z',
      processing_history: [
        'Level-1 Ground Range Detected (GRD) radiometric calibration',
        'Lee Speckle Filtering (5x5 spatial kernel)',
        'Incidence angle normalization (38.4°)',
        'WGS 84 ellipsoid georeferencing'
      ],
      downstream_ids: [`EVID-${targetId.replace('IN-', '')}-02`],
      relationship_summary: 'Feeds raw backscatter radargram into SNN Neural Detection Mask',
      raw_content: rawSar,
      tampered_content: tamperedSar,
      is_tampered: false,
      verification_history: []
    },
    {
      id: `EVID-${targetId.replace('IN-', '')}-02`,
      incident_id: targetId,
      artifact_type: 'DETECTION_MASK',
      title: 'Deep Learning Dual-Pol Hydrocarbon Slick Contour Mask',
      filename: `KDL_${targetId.replace('IN-', '')}_DeepSNN_SlickContour.geojson`,
      mime_type: 'application/geo+json',
      sha256_hash: '3caddc9bf688e2306e326773f598e167ab39b99ff22d5721e1fa2255f031270d',
      verification_status: 'UNVERIFIED',
      file_size_bytes: new TextEncoder().encode(rawGeoJson).length,
      source_provenance: 'SeaTrace AI Spiking Neural Network (SNN) Radar Segmenter',
      collector: 'SeaTrace Neural Inference Worker #02',
      acquisition_time: '2026-10-23T06:18:40Z',
      ingested_at: '2026-10-23T06:35:10Z',
      processing_history: [
        'Adaptive Otsu dual-polarization segmentation (VV/VH)',
        'Biogenic false-positive filter (Chl-a thresholding)',
        'Topological polygon perimeter extraction'
      ],
      upstream_ids: [`EVID-${targetId.replace('IN-', '')}-01`],
      downstream_ids: [`EVID-${targetId.replace('IN-', '')}-03`],
      relationship_summary: 'Slick contour coordinates submitted to Scientific Validation Review',
      raw_content: rawGeoJson,
      tampered_content: tamperedGeoJson,
      is_tampered: false,
      verification_history: []
    },
    {
      id: `EVID-${targetId.replace('IN-', '')}-03`,
      incident_id: targetId,
      artifact_type: 'VALIDATION_REVIEW',
      title: 'Independent Senior Scientific Peer Validation Decision',
      filename: `${targetId}_ForensicValidation_Decision.json`,
      mime_type: 'application/json',
      sha256_hash: '2fa546d8fe17ed71ed74c215c4adca2a4d04208399ffc223a482e2ded822aa6f',
      verification_status: 'UNVERIFIED',
      file_size_bytes: new TextEncoder().encode(rawValDecision).length,
      source_provenance: 'Directorate General of Lighthouses & Lightships (DGLL)',
      collector: 'Dr. Aris Thorne (Chief Marine Biophysicist)',
      acquisition_time: '2026-10-23T07:15:00Z',
      ingested_at: '2026-10-23T07:20:00Z',
      processing_history: [
        'Optical NDVI & SST thermal cross-validation',
        'Wind speed sanity check (14.2 knots: optimal for oil slick persistence)',
        'Cryptographic reviewer sign-off under Merchant Shipping Act'
      ],
      upstream_ids: [`EVID-${targetId.replace('IN-', '')}-02`],
      downstream_ids: [`EVID-${targetId.replace('IN-', '')}-04`],
      relationship_summary: 'Validated slick centroid triggers backward Lagrangian drift simulation',
      raw_content: rawValDecision,
      tampered_content: tamperedValDecision,
      is_tampered: false,
      verification_history: []
    },
    {
      id: `EVID-${targetId.replace('IN-', '')}-04`,
      incident_id: targetId,
      artifact_type: 'DRIFT_SIMULATION_LOG',
      title: 'Reverse Lagrangian Backward Drift Particle Trajectory Ledger',
      filename: `Kandla_Lagrangian_Backtrack_500P_Ledger_${targetId.replace('IN-', '')}.json`,
      mime_type: 'application/json',
      sha256_hash: '2f1a48dc9dabd084742929a4d44f2aa0c23ec74790bf46acfd35bf798307de8a',
      verification_status: 'UNVERIFIED',
      file_size_bytes: new TextEncoder().encode(rawDriftLog).length,
      source_provenance: 'INCOIS ROMS High-Res Ocean Hydrodynamics & ERA5 Wind',
      collector: 'OpenDrift / SeaTrace OceanEngine v2.4',
      acquisition_time: '2026-10-23T07:35:00Z',
      ingested_at: '2026-10-23T07:42:00Z',
      processing_history: [
        '18h backward step-integration (RK4 solver, dt=300s)',
        'Eulerian current interpolation (0.84 m/s @ 245°)',
        'ERA5 wind leeway forcing (3.1% leeway coefficient)',
        'Uncertainty ellipse covariance estimation (±1.2 km)'
      ],
      upstream_ids: [`EVID-${targetId.replace('IN-', '')}-03`],
      downstream_ids: [`EVID-${targetId.replace('IN-', '')}-05`],
      relationship_summary: 'Reconstructed release origin coordinates bound the AIS corridor scan',
      raw_content: rawDriftLog,
      tampered_content: tamperedDriftLog,
      is_tampered: false,
      verification_history: []
    },
    {
      id: `EVID-${targetId.replace('IN-', '')}-05`,
      incident_id: targetId,
      artifact_type: 'AIS_CORRIDOR_EXTRACT',
      title: 'DGLL & Coast Guard High-Precision AIS Transponder Kinematics',
      filename: `DGLL_NAIS_Corridor_Extract_${targetId.replace('IN-', '')}.csv`,
      mime_type: 'text/csv',
      sha256_hash: 'bedfdb8861482fd32e801a78559d064a59550d56b1ba381827100d3321bd4a21',
      verification_status: 'UNVERIFIED',
      file_size_bytes: new TextEncoder().encode(rawAisCsv).length,
      source_provenance: 'DGLL National AIS Network (NAIS) & Spire Constellation',
      collector: 'Capt. Rajesh Varma (Indian Coast Guard C2)',
      acquisition_time: '2026-10-23T07:50:00Z',
      ingested_at: '2026-10-23T07:55:00Z',
      processing_history: [
        'NMEA-0183 raw sentence decoding',
        'Closest Point of Approach (CPA) spatial calculation (1.4 km)',
        'Temporal release offset matching (+0.4h)',
        'Vessel compatibility index computation (91.4%)'
      ],
      upstream_ids: [`EVID-${targetId.replace('IN-', '')}-04`],
      downstream_ids: [`EVID-${targetId.replace('IN-', '')}-06`],
      relationship_summary: 'Flagged suspect kinematics compiled into statutory legal dossier',
      raw_content: rawAisCsv,
      tampered_content: tamperedAisCsv,
      is_tampered: false,
      verification_history: []
    },
    {
      id: `EVID-${targetId.replace('IN-', '')}-06`,
      incident_id: targetId,
      artifact_type: 'LEGAL_DOSSIER',
      title: 'Statutory Maritime Legal Export Dossier & Formal Briefing',
      filename: `SEATRACE_DOSSIER_${targetId}_COURT_READY.txt`,
      mime_type: 'text/plain',
      sha256_hash: '7728fc717e595d2dfb0d327c73c578ff519bf9efe93cf31176791b9a126fecbd',
      verification_status: 'UNVERIFIED',
      file_size_bytes: new TextEncoder().encode(rawDossierSummary).length,
      source_provenance: 'SeaTrace AI Automated Forensic Export Engine',
      collector: 'Legal Liaison Directorate (DGLL / MoPSW)',
      acquisition_time: '2026-10-23T08:00:00Z',
      ingested_at: '2026-10-23T08:05:00Z',
      processing_history: [
        'Multi-agency evidence compilation',
        'Digital timestamping & SHA-256 seal generation',
        'Indian Merchant Shipping Act 1958 statutory packaging'
      ],
      upstream_ids: [`EVID-${targetId.replace('IN-', '')}-05`],
      relationship_summary: 'Comprehensive legal dossier packaged for judicial submission',
      raw_content: rawDossierSummary,
      tampered_content: tamperedDossierSummary,
      is_tampered: false,
      verification_history: []
    }
  ];
}

export async function fetchEvidenceArtifacts(incidentId: string): Promise<EvidenceArtifact[]> {
  try {
    const res = await fetch(`${BASE_URL}/api/v1/incidents/${incidentId}/evidence`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch (e) {}

  return generateClientEvidenceArtifacts(incidentId);
}

export const FALLBACK_AUDIT_LOG: AuditEvent[] = [
  {
    id: 'AUD-61C2-01',
    incident_id: 'IN-2026-61C2',
    action: 'EVIDENCE_INGESTION',
    actor: 'Automated ESA Sentinel-1 Daemon',
    details: 'Ingested raw SAR scene S1C_IW_GRDH_1SDV_20261023T061422 (10m C-Band)',
    timestamp: '2026-10-23T06:30:15Z',
    artifact_id: 'EVID-61C2-01',
    outcome: 'SUCCESS'
  },
  {
    id: 'AUD-61C2-02',
    incident_id: 'IN-2026-61C2',
    action: 'NEURAL_MASK_GENERATION',
    actor: 'SeaTrace SNN Segmentation Worker #02',
    details: 'Generated 4.82 km² hydrocarbon slick polygon contour with 94.6% SNN confidence',
    timestamp: '2026-10-23T06:35:10Z',
    artifact_id: 'EVID-61C2-02',
    outcome: 'SUCCESS'
  },
  {
    id: 'AUD-61C2-03',
    incident_id: 'IN-2026-61C2',
    action: 'PEER_VALIDATION_DECISION',
    actor: 'Dr. Aris Thorne (Chief Biophysicist, DGLL)',
    details: 'Approved detection as SUPPORTED petroleum slick. Biogenic false positive excluded.',
    timestamp: '2026-10-23T07:20:00Z',
    artifact_id: 'EVID-61C2-03',
    outcome: 'SUCCESS'
  },
  {
    id: 'AUD-61C2-04',
    incident_id: 'IN-2026-61C2',
    action: 'DRIFT_SOLUTION_RECONSTRUCTION',
    actor: 'OpenDrift OceanEngine Worker',
    details: 'Completed 18h backward drift reconstruction with 500 Lagrangian particle tracers',
    timestamp: '2026-10-23T07:42:00Z',
    artifact_id: 'EVID-61C2-04',
    outcome: 'SUCCESS'
  },
  {
    id: 'AUD-61C2-05',
    incident_id: 'IN-2026-61C2',
    action: 'AIS_CORRIDOR_ATTRIBUTION',
    actor: 'Capt. Rajesh Varma (Coast Guard C2)',
    details: 'Correlated DGLL AIS transponder tracks: Flagged MT OCEAN PRIDE as CRITICAL_LEAD (91.4% match)',
    timestamp: '2026-10-23T07:55:00Z',
    artifact_id: 'EVID-61C2-05',
    outcome: 'SUCCESS'
  }
];

export async function fetchAuditEvents(incidentId: string): Promise<AuditEvent[]> {
  try {
    const res = await fetch(`${BASE_URL}/api/v1/incidents/${incidentId}/audit-log`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch (e) {}

  return FALLBACK_AUDIT_LOG;
}

export async function recordAuditEvent(
  incidentId: string,
  event: Omit<AuditEvent, 'id' | 'timestamp' | 'incident_id'>
): Promise<AuditEvent> {
  const newEvent: AuditEvent = {
    ...event,
    id: `AUD-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
    incident_id: incidentId,
    timestamp: new Date().toISOString()
  };

  try {
    await fetch(`${BASE_URL}/api/v1/incidents/${incidentId}/audit-log`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newEvent)
    });
  } catch (e) {}

  return newEvent;
}

export async function generateAndDownloadReport(
  incidentId: string,
  format: 'pdf' | 'csv' | 'xlsx' | 'geojson'
): Promise<{ success: boolean; filename: string }> {
  try {
    const res = await fetch(`${BASE_URL}/api/v1/incidents/${incidentId}/reports/generate?format=${format}`, {
      method: 'POST'
    });
    if (res.ok) {
      const data = await res.json();
      const downloadUrl = `${BASE_URL}${data.download_url}`;
      const fileRes = await fetch(downloadUrl);
      if (fileRes.ok) {
        const blob = await fileRes.blob();
        const { triggerBrowserDownload } = await import('../utils/exportEngine');
        triggerBrowserDownload(blob, data.filename);
        return { success: true, filename: data.filename };
      }
    }
  } catch (e) {
    // Backend offline / failed: fallback to client-side report generator
  }

  // Client-side fallback report generation
  const incident = FALLBACK_INCIDENTS.find(i => i.id === incidentId) || FALLBACK_INCIDENTS[0];
  const candidates = generateClientVesselCandidates(incidentId);
  const drift = generateClientDriftRun(incidentId, { time_window_hours: 18, particle_count: 500, windage_leeway: 0.03, current_deflection_deg: 0 });
  const evidence = generateClientEvidenceArtifacts(incidentId);

  const {
    downloadClientPdf,
    downloadClientXlsx,
    downloadClientCsv,
    downloadClientGeoJson
  } = await import('../utils/exportEngine');

  let filename = '';
  if (format === 'pdf') {
    filename = downloadClientPdf(incident, candidates, drift, evidence);
  } else if (format === 'xlsx') {
    filename = downloadClientXlsx(incident, candidates, drift, evidence);
  } else if (format === 'csv') {
    filename = downloadClientCsv(incident, candidates);
  } else {
    filename = downloadClientGeoJson(incident, candidates, drift);
  }

  return { success: true, filename };
}

export const FALLBACK_DATA_SOURCES: DataSource[] = [
  {
    id: 'SRC-SENTINEL1',
    name: 'Copernicus Sentinel-1C SAR (IW Mode)',
    provider: 'European Space Agency (ESA) / Copernicus Hub',
    data_type: 'C-Band Synthetic Aperture Radar (VV+VH)',
    status: 'LIVE',
    latency_ms: 320,
    last_success_time: '2026-10-24T06:14:00Z',
    error_details: 'Operational nominal — 10m spatial resolution C-band backscatter'
  },
  {
    id: 'SRC-AIS-DGLL',
    name: 'DGLL National AIS Coastal Transponder Mesh',
    provider: 'Directorate General of Lighthouses and Lightships',
    data_type: 'Terrestrial VHF Marine Transceiver (161.975/162.025 MHz)',
    status: 'LIVE',
    latency_ms: 64,
    last_success_time: '2026-10-24T07:45:00Z',
    error_details: '87 coastal receivers streaming real-time NMEA-0183 kinematics'
  },
  {
    id: 'SRC-INCOIS-CURRENT',
    name: 'INCOIS High-Res Coastal Hydrodynamic Currents',
    provider: 'INCOIS Hyderabad (Ministry of Earth Sciences)',
    data_type: 'ROMS / HYCOM Surface Ocean Currents (u, v)',
    status: 'LIVE',
    latency_ms: 185,
    last_success_time: '2026-10-24T06:00:00Z',
    error_details: '1/12° resolution tidal-augmented coastal surface velocity vectors'
  },
  {
    id: 'SRC-NOAA-GFS',
    name: 'NOAA GFS / ERA5 Atmospheric Boundary Wind Vector',
    provider: 'NOAA NCEP & ECMWF Copernicus Climate Data',
    data_type: '10m Atmospheric Forcing (u10, v10, 0.25° GRIB2)',
    status: 'LIVE',
    latency_ms: 210,
    last_success_time: '2026-10-24T06:00:00Z',
    error_details: 'Global atmospheric circulation models updated 4x daily with 3.1% leeway windage'
  },
  {
    id: 'SRC-SPIRE-SATELLITE',
    name: 'Spire Global Maritime S-AIS Constellation',
    provider: 'Spire Global Low-Earth Orbit Constellation',
    data_type: 'Satellite-Received S-AIS Transponder Telemetry',
    status: 'LIVE',
    latency_ms: 140,
    last_success_time: '2026-10-24T07:30:00Z',
    error_details: 'Over-the-horizon orbital AIS tracking across Arabian Sea deepwater corridors'
  },
  {
    id: 'SRC-SENTINEL2-OPT',
    name: 'Copernicus Sentinel-2 MSI Multi-Spectral Optical',
    provider: 'European Space Agency (ESA) & INCOIS',
    data_type: 'Chlorophyll-a & Sea Surface Temperature (SST)',
    status: 'AVAILABLE',
    latency_ms: 410,
    last_success_time: '2026-10-24T05:20:00Z',
    error_details: 'Biogenic false-positive spectral exclusion screening (Chl-a < 0.20 mg/m³)'
  },
  {
    id: 'SRC-ICG-RADAR',
    name: 'Indian Coast Guard CSN Radar & Electro-Optics',
    provider: 'Indian Coast Guard Coastal Security Network',
    data_type: 'X-Band / S-Band Terrestrial Coastal Radar Feeds',
    status: 'LIVE',
    latency_ms: 92,
    last_success_time: '2026-10-24T07:15:00Z',
    error_details: 'Non-cooperative dark vessel detection without active transponder broadcast'
  },
  {
    id: 'SRC-GEBCO-BATHY',
    name: 'GEBCO High-Precision Coastal Bathymetry Grid',
    provider: 'BODC / International Hydrographic Organization (IHO)',
    data_type: '15 Arc-Second Gridded Seabed Elevation',
    status: 'AVAILABLE',
    latency_ms: 15,
    last_success_time: '2026-10-20T00:00:00Z',
    error_details: 'Seabed bathymetric depth boundaries constraining backward drift trajectories'
  }
];

export async function fetchDataSources(): Promise<DataSource[]> {
  try {
    const res = await fetch(`${BASE_URL}/api/v1/data-sources`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch (e) {}
  return FALLBACK_DATA_SOURCES;
}

export async function pingDataSource(sourceId: string): Promise<{ latency_ms: number; status: string }> {
  try {
    const res = await fetch(`${BASE_URL}/api/v1/data-sources/${sourceId}/ping`, { method: 'POST' });
    if (res.ok) return await res.json();
  } catch (e) {}
  
  // Offline simulated ping
  await new Promise(r => setTimeout(r, 200 + Math.random() * 300));
  const randomLatency = Math.floor(40 + Math.random() * 85);
  return { latency_ms: randomLatency, status: 'LIVE' };
}

export async function fetchSystemStatus(): Promise<SystemStatusData> {
  try {
    const res = await fetch(`${BASE_URL}/api/v1/system/status`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.services && data.services.length > 0) return data;
    }
  } catch (e) {}
  return {
    status: 'OPERATIONAL',
    environment: 'STANDALONE_INTELLIGENCE_NODE',
    api_version: '2.4.0',
    active_workers: 8,
    uptime_seconds: 86400,
    services: [
      { name: 'FastAPI REST Gateway', status: 'HEALTHY', latency_ms: 12, last_check: new Date().toISOString() },
      { name: 'SQLite Storage & Spatial Index', status: 'HEALTHY', latency_ms: 3, last_check: new Date().toISOString() },
      { name: 'Sentinel-1 SAR Screening Engine', status: 'HEALTHY', latency_ms: 28, last_check: new Date().toISOString() },
      { name: 'OpenDrift Lagrangian Drift Engine', status: 'HEALTHY', latency_ms: 45, last_check: new Date().toISOString() },
      { name: 'DGLL AIS Stream Processor', status: 'HEALTHY', latency_ms: 18, last_check: new Date().toISOString() },
      { name: 'Forensic PDF & XLSX Export Compiler', status: 'HEALTHY', latency_ms: 8, last_check: new Date().toISOString() }
    ],
    active_jobs: [
      {
        job_id: 'JOB-61C2-SAR',
        incident_id: 'IN-2026-61C2',
        type: 'Sentinel-1C SAR IW Dual-Pol Screening',
        status: 'SUCCEEDED',
        progress_pct: 100
      },
      {
        job_id: 'JOB-61C2-DRIFT',
        incident_id: 'IN-2026-61C2',
        type: '18h Backward Lagrangian Reconstruction',
        status: 'SUCCEEDED',
        progress_pct: 100
      },
      {
        job_id: 'JOB-61C2-AIS',
        incident_id: 'IN-2026-61C2',
        type: 'DGLL AIS Transponder Corridor Correlation',
        status: 'SUCCEEDED',
        progress_pct: 100
      },
      {
        job_id: 'JOB-61C2-EXP',
        incident_id: 'IN-2026-61C2',
        type: 'Multi-Format Forensic Dossier Export',
        status: 'SUCCEEDED',
        progress_pct: 100
      }
    ]
  };
}
