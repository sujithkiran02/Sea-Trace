import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import type { Incident, DriftRun, VesselCandidate } from '../../types/seatrace';
import type { IndianPort } from '../../constants/indianPorts';

export type GoogleMapType = 'google_hybrid' | 'google_satellite' | 'google_dark' | 'google_roads';

interface SeaTraceMapProps {
  incident?: Incident | null;
  driftRun?: DriftRun | null;
  vessels?: VesselCandidate[];
  allIncidents?: Incident[];
  onSelectIncident?: (inc: Incident) => void;
  ports?: IndianPort[];
  onSelectPort?: (port: IndianPort) => void;
  hypotheticalDrift?: {
    releaseLat: number;
    releaseLng: number;
    forwardTrajectories?: [number, number][][];
    scenarioName?: string;
  };
  opticalOverlay?: boolean;
  height?: string;
  showLayersControl?: boolean;
  defaultMapType?: GoogleMapType;
  enableLiveTracking?: boolean;
  initialCenter?: [number, number];
  initialZoom?: number;
  theme?: 'dark' | 'light';
  heatmap?: boolean;
  compact?: boolean;
  mode?: 'default' | 'drift' | 'detection';
  timeScrubber?: number;
}

// India 200 nautical miles Exclusive Economic Zone (EEZ) Baselines
const INDIA_EEZ_WEST: [number, number][] = [
  [23.7, 67.2],
  [22.4, 66.5],
  [20.8, 67.8],
  [19.2, 69.2],
  [17.5, 70.6],
  [15.2, 71.5],
  [12.8, 72.4],
  [10.2, 73.5],
  [8.2, 75.2],
  [6.8, 77.5],
  [6.0, 79.2],
  [7.2, 81.2]
];

const INDIA_EEZ_EAST: [number, number][] = [
  [9.8, 82.2],
  [12.2, 83.2],
  [14.5, 84.5],
  [16.8, 86.2],
  [19.2, 88.0],
  [20.8, 89.2],
  [21.6, 89.5]
];

const LAKSHADWEEP_EEZ: [number, number][] = [
  [12.2, 71.2],
  [12.5, 73.2],
  [11.5, 74.2],
  [9.5, 74.5],
  [8.2, 73.5],
  [8.5, 71.8],
  [10.2, 71.0],
  [12.2, 71.2]
];

const ANDAMAN_EEZ: [number, number][] = [
  [14.2, 91.8],
  [14.0, 94.2],
  [12.5, 94.8],
  [10.0, 94.5],
  [6.8, 94.8],
  [6.5, 93.2],
  [9.2, 92.0],
  [12.0, 91.5],
  [14.2, 91.8]
];

const STRATEGIC_PORTS_HUD = [
  { name: 'Kutch', lat: 23.01, lng: 69.8 },
  { name: 'Mumbai', lat: 18.95, lng: 72.85 },
  { name: 'Goa', lat: 15.4, lng: 73.8 },
  { name: 'Kochi', lat: 9.95, lng: 76.25 },
  { name: 'Thoothukudi', lat: 8.75, lng: 78.18 },
  { name: 'Chennai', lat: 13.08, lng: 80.3 },
  { name: 'Visakhapatnam', lat: 17.7, lng: 83.3 },
  { name: 'Paradip', lat: 20.25, lng: 86.68 },
  { name: 'Kolkata', lat: 22.55, lng: 88.35 }
];

export function generateRealisticSpillLayers(lat: number, lng: number) {
  const N = 36;
  const driftAngle = (220 * Math.PI) / 180; // Heading 220° SW along prevailing Arabian Sea currents

  // Multi-spectral Heatmap concentration tiers (matching Image 2: Cyan -> Green -> Yellow -> Orange -> Crimson Core)
  const tierScales = [
    { scale: 1.0, color: '#06B6D4', stroke: '#0891B2', fillOpacity: 0.35, name: 'Low (Bare Sheen)' },
    { scale: 0.78, color: '#10B981', stroke: '#059669', fillOpacity: 0.50, name: 'Moderate (0.1 - 1 µm)' },
    { scale: 0.58, color: '#FACC15', stroke: '#EAB308', fillOpacity: 0.65, name: 'Medium (1 - 50 µm)' },
    { scale: 0.40, color: '#F97316', stroke: '#EA580C', fillOpacity: 0.80, name: 'High (50 - 200 µm)' },
    { scale: 0.22, color: '#DC2626', stroke: '#B91C1C', fillOpacity: 0.95, name: 'Critical Core (> 200 µm)' }
  ];

  const majorSpan = 0.055;
  const minorSpan = 0.024;

  const heatTiers = tierScales.map((tier) => {
    const tierPoints: [number, number][] = [];
    const tierMajor = majorSpan * tier.scale;
    const tierMinor = minorSpan * tier.scale;
    const offsetFactor = (1 - tier.scale) * 0.014;
    const coreLat = lat - Math.cos(driftAngle) * offsetFactor;
    const coreLng = lng - Math.sin(driftAngle) * offsetFactor;

    for (let i = 0; i <= N; i++) {
      const theta = (i / N) * 2 * Math.PI;
      const align = Math.cos(theta - driftAngle);
      // Elongation + organic ocean wave perturbation
      const stretch = 1.0 + 1.25 * align;
      const ripple = 0.16 * Math.sin(3 * theta + 1.4) + 0.11 * Math.cos(5 * theta - 0.8);
      const r = (1 + ripple) * stretch;

      const pLat = coreLat + r * tierMajor * Math.sin(theta);
      const pLng = coreLng + r * tierMinor * Math.cos(theta);
      tierPoints.push([pLat, pLng]);
    }
    return { ...tier, points: tierPoints };
  });

  // Trailing Sheen Wake: Long plume trailing behind towards suspect vessel
  const sheenWake: [number, number][] = [
    [lat, lng],
    [lat - 0.025, lng - 0.018],
    [lat - 0.065, lng - 0.045],
    [lat - 0.110, lng - 0.075],
    [lat - 0.112, lng - 0.082],
    [lat - 0.062, lng - 0.040],
    [lat - 0.022, lng - 0.014],
    [lat, lng]
  ];

  return {
    outerSheen: heatTiers[0].points,
    midDispersion: heatTiers[2].points,
    heavyCore: heatTiers[4].points,
    heatTiers,
    sheenWake
  };
}

const GOOGLE_TILE_SERVERS: Record<GoogleMapType, { url: string; maxZoom: number; name: string; attribution: string }> = {
  google_hybrid: {
    url: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
    maxZoom: 20,
    name: 'Google Satellite Hybrid',
    attribution: 'Map data ©2026 Google Imagery'
  },
  google_satellite: {
    url: 'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
    maxZoom: 20,
    name: 'Google Pure Satellite',
    attribution: 'Imagery ©2026 CNES / Airbus, Maxar, Google'
  },
  google_dark: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
    maxZoom: 16,
    name: 'Night Radar (Esri Dark)',
    attribution: 'Tiles © Esri, Garmin, GEBCO, NOAA NGDC'
  },
  google_roads: {
    url: 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
    maxZoom: 20,
    name: 'Google Maritime Roads',
    attribution: 'Map data ©2026 Google'
  }
};

export const SeaTraceMap: React.FC<SeaTraceMapProps> = ({
  incident,
  driftRun,
  vessels = [],
  allIncidents = [],
  onSelectIncident,
  ports = [],
  onSelectPort,
  hypotheticalDrift,
  opticalOverlay = false,
  height = '540px',
  showLayersControl = true,
  defaultMapType = 'google_hybrid',
  enableLiveTracking = true,
  initialCenter,
  initialZoom,
  theme,
  heatmap = false,
  compact = false,
  mode = 'default',
  timeScrubber = 0
}) => {
  const heightNum = parseInt(height, 10) || 540;
  const isCompactMap = compact || heightNum < 380;

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const baseTileLayerRef = useRef<L.TileLayer | null>(null);
  const layersRef = useRef<{
    markerGroup: L.LayerGroup;
    footprintGroup: L.LayerGroup;
    driftGroup: L.LayerGroup;
    vesselGroup: L.LayerGroup;
    radarGroup: L.LayerGroup;
    eezGroup: L.LayerGroup;
    portGroup: L.LayerGroup;
    vectorGroup: L.LayerGroup;
    platformGroup: L.LayerGroup;
  } | null>(null);

  // Auto-detect or use theme prop
  const [isLightMode, setIsLightMode] = useState<boolean>(() => {
    if (theme) return theme === 'light';
    return typeof document !== 'undefined' && document.documentElement.classList.contains('light-theme');
  });

  useEffect(() => {
    if (theme) {
      setIsLightMode(theme === 'light');
    } else {
      const checkTheme = () => {
        setIsLightMode(document.documentElement.classList.contains('light-theme'));
      };
      checkTheme();
      const observer = new MutationObserver(checkTheme);
      observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-theme'] });
      return () => observer.disconnect();
    }
  }, [theme]);

  const [mapType, setMapType] = useState<GoogleMapType>(defaultMapType);

  // Switch basemap gracefully when theme changes
  useEffect(() => {
    if (isLightMode && mapType === 'google_dark') {
      setMapType('google_roads');
    } else if (!isLightMode && mapType === 'google_roads') {
      setMapType('google_dark');
    }
  }, [isLightMode]);

  const [activeLayers, setActiveLayers] = useState({
    slick: true,
    drift: true, // Backward Trajectories
    forwardTrajectories: true,
    currentVectors: true,
    windVectors: true,
    vessels: true,
    radarSweep: mode !== 'drift',
    heatmap: mode === 'drift' ? false : Boolean(heatmap),
    eez: mode === 'drift' ? false : true,
    ports: true,
    platforms: true
  });

  useEffect(() => {
    if (mode !== 'drift') {
      setActiveLayers((p) => ({ ...p, heatmap: Boolean(heatmap) }));
    }
  }, [heatmap, mode]);

  const [cursorCoords, setCursorCoords] = useState<{ lat: number; lng: number } | null>(null);

  // Real-time live simulation states
  const [isLiveActive, setIsLiveActive] = useState(enableLiveTracking);
  const [liveSeconds, setLiveSeconds] = useState(0);
  const [livePingsReceived, setLivePingsReceived] = useState(2418);
  const [radarAngle, setRadarAngle] = useState(0);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const mapCenter =
      initialCenter ||
      (mode === 'drift'
        ? [22.58, 69.55]
        : incident
        ? [incident.lat, incident.lng]
        : allIncidents.length > 0
        ? [allIncidents[0].lat, allIncidents[0].lng]
        : ports.length > 0
        ? [ports[0].latitude, ports[0].longitude]
        : [19.4182, 71.3412]);

    const zoomLevel = initialZoom || (mode === 'drift' ? 9 : (ports.length > 0 && !incident ? 5 : 8));

    const map = L.map(mapContainerRef.current, {
      center: mapCenter,
      zoom: zoomLevel,
      zoomControl: false,
      attributionControl: false
    });

    // Set initial Google Maps tile layer
    const tileConfig = GOOGLE_TILE_SERVERS[mapType];
    const baseLayer = L.tileLayer(tileConfig.url, {
      maxZoom: 20,
      maxNativeZoom: mapType === 'google_dark' ? 16 : tileConfig.maxZoom,
      subdomains: mapType === 'google_dark' ? [] : ['mt0', 'mt1', 'mt2', 'mt3']
    }).addTo(map);

    baseTileLayerRef.current = baseLayer;

    // Zoom control at bottom-right
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Coordinate tracker
    map.on('mousemove', (e: L.LeafletMouseEvent) => {
      setCursorCoords({
        lat: parseFloat(e.latlng.lat.toFixed(4)),
        lng: parseFloat(e.latlng.lng.toFixed(4))
      });
    });

    const markerGroup = L.layerGroup().addTo(map);
    const footprintGroup = L.layerGroup().addTo(map);
    const driftGroup = L.layerGroup().addTo(map);
    const vesselGroup = L.layerGroup().addTo(map);
    const radarGroup = L.layerGroup().addTo(map);
    const eezGroup = L.layerGroup().addTo(map);
    const portGroup = L.layerGroup().addTo(map);
    const vectorGroup = L.layerGroup().addTo(map);
    const platformGroup = L.layerGroup().addTo(map);

    layersRef.current = {
      markerGroup,
      footprintGroup,
      driftGroup,
      vesselGroup,
      radarGroup,
      eezGroup,
      portGroup,
      vectorGroup,
      platformGroup
    };
    mapInstanceRef.current = map;

    // Ensure Leaflet calculates dimensions correctly after mount
    const resizeTimer = setTimeout(() => {
      map.invalidateSize();
    }, 200);

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && mapContainerRef.current) {
      resizeObserver = new ResizeObserver(() => {
        map.invalidateSize();
      });
      resizeObserver.observe(mapContainerRef.current);
    }

    return () => {
      clearTimeout(resizeTimer);
      if (resizeObserver) resizeObserver.disconnect();
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Base Tile Layer when mapType changes (Google Satellite, Google Hybrid, Google Dark, etc.)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (baseTileLayerRef.current) {
      map.removeLayer(baseTileLayerRef.current);
    }

    const tileConfig = GOOGLE_TILE_SERVERS[mapType];
    const newBaseLayer = L.tileLayer(tileConfig.url, {
      maxZoom: 20,
      maxNativeZoom: mapType === 'google_dark' ? 16 : tileConfig.maxZoom,
      subdomains: mapType === 'google_dark' ? [] : ['mt0', 'mt1', 'mt2', 'mt3']
    }).addTo(map);

    // Keep base layer at bottom
    newBaseLayer.bringToBack();
    baseTileLayerRef.current = newBaseLayer;
  }, [mapType]);

  // Live Time Ticker: Advances vessel positions and radar sweep angle in real time
  useEffect(() => {
    if (!isLiveActive) return;

    const interval = setInterval(() => {
      setLiveSeconds((prev) => prev + 1);
      setLivePingsReceived((p) => p + Math.floor(Math.random() * 3) + 1);
      setRadarAngle((ang) => (ang + 12) % 360);
    }, 1000);

    return () => clearInterval(interval);
  }, [isLiveActive]);

  // Auto-pan / setView when incident changes or opticalOverlay is active
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (map) {
      if (mode === 'drift') {
        map.setView([22.58, 69.55], 9, { animate: true });
      } else if (incident) {
        const zoom = opticalOverlay ? (initialZoom || 11) : (initialZoom || (map.getZoom() < 8 ? 8 : map.getZoom()));
        map.setView([incident.lat, incident.lng], zoom, { animate: true });
      }
      setTimeout(() => {
        map.invalidateSize();
      }, 100);
    }
  }, [incident?.id, opticalOverlay, mode]);

  // Update map contents when incident, driftRun, vessels, allIncidents, ports, or live tick changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layers = layersRef.current;
    if (!map || !layers) return;

    // Clear previous elements
    layers.markerGroup.clearLayers();
    layers.footprintGroup.clearLayers();
    layers.driftGroup.clearLayers();
    layers.vesselGroup.clearLayers();
    layers.radarGroup.clearLayers();
    layers.eezGroup.clearLayers();
    layers.portGroup.clearLayers();
    layers.vectorGroup?.clearLayers();
    layers.platformGroup?.clearLayers();

    // 1. Primary Focus Incident Center Marker
    if (incident) {
      const incidentIcon = L.divIcon({
        className: 'custom-incident-pin',
        html: `
          <div style="position:relative; width:34px; height:34px; display:flex; align-items:center; justify-content:center;">
            <div style="position:absolute; width:100%; height:100%; border-radius:50%; background:rgba(239, 68, 68, 0.45); animation: ping 1.4s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="width:16px; height:16px; border-radius:50%; background:#EF4444; border:2.5px solid #FFFFFF; box-shadow:0 0 14px #EF4444;"></div>
          </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 17]
      });

      const incMarker = L.marker([incident.lat, incident.lng], { icon: incidentIcon }).addTo(layers.markerGroup);
      incMarker.bindPopup(`
        <div style="font-family: 'JetBrains Mono', monospace; font-size: 12px; color: #0F172A; padding: 4px; min-width: 200px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
            <strong style="color:#B91C1C; font-size:13px;">🚨 ${incident.id}</strong>
            <span style="background:#FEE2E2; color:#991B1B; padding:1px 6px; border-radius:4px; font-size:10px; font-weight:bold;">${incident.severity}</span>
          </div>
          <b>${incident.title}</b><br/>
          <span style="color:#475569;">Pos: <b>${incident.lat.toFixed(4)}°N, ${incident.lng.toFixed(4)}°E</b></span><br/>
          <span style="color:#475569;">Volume: <b>${incident.estimated_volume_m3 || 'Unknown'} m³</b></span><br/>
          <span style="color:#475569;">Status: <b style="color:#2563EB;">${incident.status}</b></span>
        </div>
      `);

      // 2. Realistic SAR Multi-Contour Slick Footprint OR Multi-Spectral Heatmap (NO TRIANGLE)
      if (activeLayers.slick) {
        const realisticLayers = generateRealisticSpillLayers(incident.lat, incident.lng);

        if (activeLayers.heatmap) {
          // Multi-spectral Concentration Heatmap (Image 2 style: Cyan -> Emerald -> Yellow -> Orange -> Crimson Core)
          realisticLayers.heatTiers.forEach((tier) => {
            L.polygon(tier.points, {
              color: tier.stroke,
              weight: 1.5,
              opacity: 0.9,
              fillColor: tier.color,
              fillOpacity: tier.fillOpacity
            }).addTo(layers.footprintGroup).bindPopup(`
              <div style="font-family:'JetBrains Mono', monospace; font-size:12px; color:#0F172A;">
                <b style="color:${tier.color}; font-size:13px;">🔥 SAR Detection Tier: ${tier.name}</b><br/>
                <span>Satellite: <b>Sentinel-1 SAR</b></span><br/>
                <span>Cloud Cover: <b>0% (Radar Penetrating)</b></span><br/>
                <span>Estimated Area: <b>${incident.estimated_volume_m3 ? (incident.estimated_volume_m3 / 5).toFixed(1) : '24.8'} km²</b></span><br/>
                <span>Backscatter Damping: <b>-11.8 dB</b></span>
              </div>
            `);
          });

          // Trailing Sheen Wake
          L.polygon(realisticLayers.sheenWake, {
            color: '#94A3B8',
            weight: 1,
            opacity: 0.6,
            fillColor: '#64748B',
            fillOpacity: 0.32,
            dashArray: '4, 4'
          }).addTo(layers.footprintGroup);
        } else {
          // Realistic Organic Multi-Contour Oil Slick Detection (Authentic SAR Detection - Never Triangle)
          // Layer A: Outer Sheen Dispersion Boundary (Organic wavy feathering)
          L.polygon(realisticLayers.outerSheen, {
            color: '#FF7A2F',
            weight: 2,
            opacity: 0.9,
            fillColor: '#FF7A2F',
            fillOpacity: 0.28,
            dashArray: '5, 4'
          }).addTo(layers.footprintGroup).bindPopup(`
            <div style="font-family:'JetBrains Mono', monospace; font-size:12px; color:#0F172A;">
              <b style="color:#FF7A2F; font-size:13px;">🌊 SAR Oil Slick Footprint</b><br/>
              <span>Estimated Area: <b>${incident.estimated_volume_m3 ? (incident.estimated_volume_m3 / 6).toFixed(1) : '18.4'} km²</b></span><br/>
              <span>Spill Type: <b>${incident.spill_type || 'Heavy Fuel Oil (HFO)'}</b></span><br/>
              <span>Sensor: <b>Sentinel-1 C-SAR</b></span><br/>
              <span>Status: <b style="color:#2563EB;">${incident.status}</b></span>
            </div>
          `);

          // Layer B: Intermediate Emulsion Zone
          L.polygon(realisticLayers.midDispersion, {
            color: '#EA580C',
            weight: 1.5,
            opacity: 0.85,
            fillColor: '#EA580C',
            fillOpacity: 0.48
          }).addTo(layers.footprintGroup);

          // Layer C: Heavy Crude Core (Obsidian/Crimson dense center)
          L.polygon(realisticLayers.heavyCore, {
            color: '#991B1B',
            weight: 2,
            opacity: 0.95,
            fillColor: '#7F1D1D',
            fillOpacity: 0.85
          }).addTo(layers.footprintGroup);

          // Layer D: Trailing Sheen Dispersion Plume
          L.polygon(realisticLayers.sheenWake, {
            color: '#F97316',
            weight: 1,
            opacity: 0.5,
            fillColor: '#FB923C',
            fillOpacity: 0.18,
            dashArray: '3, 4'
          }).addTo(layers.footprintGroup);
        }
      }

      // Optical Sun-Glint Verification Boundary
      if (opticalOverlay) {
        L.circle([incident.lat, incident.lng], {
          radius: 3500,
          color: '#F59E0B',
          weight: 2,
          fillColor: '#FBBF24',
          fillOpacity: 0.22,
          dashArray: '4, 4'
        }).addTo(layers.footprintGroup).bindPopup('<b>Sentinel-2 MSI Optical Spectral Match: 94.2%</b><br/>Sun-glint damping confirms heavy biogenic/petroleum film.');
      }

      // Rotating Radar Beam Line (Suppressed in Ocean Drift Mode)
      if (activeLayers.radarSweep && mode !== 'drift') {
        const sweepRad = (radarAngle * Math.PI) / 180;
        const sweepDistance = 0.12; // ~13 km radar beam
        const beamEndLat = incident.lat + Math.cos(sweepRad) * sweepDistance;
        const beamEndLng = incident.lng + Math.sin(sweepRad) * (sweepDistance * 1.05);

        L.polyline([[incident.lat, incident.lng], [beamEndLat, beamEndLng]], {
          color: '#06B6D4',
          weight: 1.5,
          opacity: 0.8
        }).addTo(layers.radarGroup);

        L.circle([incident.lat, incident.lng], {
          radius: 12000,
          color: '#06B6D4',
          weight: 1,
          fillColor: '#06B6D4',
          fillOpacity: 0.04,
          dashArray: '4, 8'
        }).addTo(layers.radarGroup);
      }
    }

    // 2. All Incidents Layer (for Pan-India Incident Management Surveillance)
    if (allIncidents.length > 0) {
      allIncidents.forEach((inc) => {
        if (incident && inc.id === incident.id) return; // already rendered
        const isCrit = inc.severity === 'CRITICAL';
        const isHigh = inc.severity === 'HIGH';
        const color = isCrit ? '#EF4444' : isHigh ? '#F97316' : '#F59E0B';

        const pinIcon = L.divIcon({
          className: 'all-incident-pin',
          html: `
            <div style="position:relative; width:26px; height:26px; display:flex; align-items:center; justify-content:center; cursor:pointer;">
              <div style="position:absolute; width:100%; height:100%; border-radius:50%; background:${color}44; animation:ping 2s infinite;"></div>
              <div style="width:12px; height:12px; border-radius:50%; background:${color}; border:2px solid #FFFFFF; box-shadow:0 0 10px ${color};"></div>
            </div>
          `,
          iconSize: [26, 26],
          iconAnchor: [13, 13]
        });

        const m = L.marker([inc.lat, inc.lng], { icon: pinIcon }).addTo(layers.markerGroup);
        m.bindPopup(`
          <div style="font-family:'JetBrains Mono', monospace; font-size:11px; color:#0F172A; min-width:200px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:3px;">
              <b style="color:${color}; font-size:12px;">🚨 ${inc.id}</b>
              <span style="background:${color}22; color:${color}; font-size:9px; font-weight:bold; padding:1px 5px; border-radius:3px;">${inc.severity}</span>
            </div>
            <b>${inc.title}</b><br/>
            <span>Region: ${inc.region}</span><br/>
            <span>Status: <b style="color:#2563EB;">${inc.status}</b></span><br/>
            <span>Coords: ${inc.lat.toFixed(4)}°N, ${inc.lng.toFixed(4)}°E</span>
          </div>
        `);
        if (onSelectIncident) {
          m.on('click', () => onSelectIncident(inc));
        }
      });
    }

    // 3. Indian Major Ports Layer (Strategic Ports matching Reference Image)
    const effectivePorts = (mode === 'drift' || ports.length === 0) ? [
      { name: 'Kandla', unLocode: 'Kandla', latitude: 23.00, longitude: 70.22, state: 'Gujarat', coast: 'west', description: 'Deendayal Port Authority - Deepwater Fairway' },
      { name: 'Mundra', unLocode: 'Mundra', latitude: 22.84, longitude: 69.72, state: 'Gujarat', coast: 'west', description: 'Adani Ports SEZ - Major crude terminal & fairway' },
      { name: 'Jamnagar', unLocode: 'Jamnagar', latitude: 22.47, longitude: 70.07, state: 'Gujarat', coast: 'west', description: 'Reliance / Sikka Marine Terminal' },
      { name: 'Dwarka', unLocode: 'Dwarka', latitude: 22.24, longitude: 68.96, state: 'Gujarat', coast: 'west', description: 'Mouth of Gulf of Kutch - Western Marine Fairway' },
      ...ports
    ] : ports;

    if (activeLayers.ports && layers.portGroup) {
      effectivePorts.forEach((port) => {
        const portIcon = L.divIcon({
          className: 'indian-port-pin',
          html: `
            <div style="display:flex; flex-direction:column; align-items:center; cursor:pointer;">
              <div style="margin-bottom:2px; font-family:sans-serif; font-size:10px; font-weight:700; color:#FFFFFF; text-shadow:0 1px 3px #000, 0 0 6px rgba(0,0,0,0.9); white-space:nowrap;">
                ${port.name}
              </div>
              <div style="width:24px; height:24px; border-radius:50%; background:#0284C7; border:2px solid #FFFFFF; display:flex; align-items:center; justify-content:center; box-shadow:0 0 8px rgba(2,132,199,0.9);">
                <span style="font-size:12px; color:#fff;">⚓</span>
              </div>
            </div>
          `,
          iconSize: [60, 42],
          iconAnchor: [30, 30]
        });

        const pMarker = L.marker([port.latitude, port.longitude], { icon: portIcon }).addTo(layers.portGroup);
        pMarker.bindPopup(`
          <div style="font-family:'JetBrains Mono', monospace; font-size:11px; color:#0F172A; min-width:210px;">
            <b style="color:#0284C7; font-size:13px;">⚓ ${port.name}</b><br/>
            <span>UN/LOCODE: <b>${port.unLocode}</b></span><br/>
            <span>State: <b>${port.state}</b> (${port.coast.toUpperCase()} Coast)</span><br/>
            <p style="margin-top:4px; font-size:10px; color:#475569;">${port.description}</p>
          </div>
        `);
        if (onSelectPort) {
          pMarker.on('click', () => onSelectPort(port as any));
        }
      });
    }

    // Oil Platforms Layer (Offshore Platforms in Gulf of Kutch & Fairways)
    if (activeLayers.platforms && layers.platformGroup) {
      const platforms = [
        { name: 'IOCL Vadinar SBM', lat: 22.45, lng: 69.72 },
        { name: 'BPCL Fairway Buoy', lat: 22.62, lng: 69.88 }
      ];
      platforms.forEach((pl) => {
        const plIcon = L.divIcon({
          className: 'oil-platform-pin',
          html: `
            <div style="display:flex; align-items:center; gap:3px; background:rgba(3,7,18,0.85); border:1px solid rgba(245,158,11,0.8); padding:2px 6px; border-radius:5px; font-size:9px; font-weight:bold; color:#FBBF24; box-shadow:0 2px 6px rgba(0,0,0,0.6); white-space:nowrap;">
              <span>🏭</span>
              <span>${pl.name}</span>
            </div>
          `,
          iconSize: [120, 22],
          iconAnchor: [60, 11]
        });
        L.marker([pl.lat, pl.lng], { icon: plIcon }).addTo(layers.platformGroup);
      });
    }

    // 4. Drift Reconstruction (Backward Plume & Origin Zone)
    if (activeLayers.drift && driftRun) {
      const originIcon = L.divIcon({
        className: 'origin-drift-pin',
        html: `
          <div style="position:relative; width:34px; height:34px; display:flex; align-items:center; justify-content:center;">
            <div style="position:absolute; width:100%; height:100%; border-radius:50%; background:rgba(6, 182, 212, 0.45); animation: ping 2s infinite;"></div>
            <div style="width:16px; height:16px; border-radius:50%; background:#06B6D4; border:2px solid #FFFFFF; box-shadow:0 0 12px #06B6D4; display:flex; align-items:center; justify-content:center;">
              <span style="font-size:9px; color:#fff;">⚓</span>
            </div>
            <div style="position:absolute; bottom:-16px; background:rgba(3,7,18,0.92); border:1px solid rgba(6,182,212,0.8); padding:1px 5px; border-radius:4px; font-size:9px; font-weight:bold; color:#38BDF8; white-space:nowrap; box-shadow:0 2px 6px rgba(0,0,0,0.6);">
              REVERSE ORIGIN
            </div>
          </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 17]
      });

      L.marker([driftRun.origin_lat, driftRun.origin_lng], { icon: originIcon })
        .addTo(layers.driftGroup)
        .bindPopup(`
          <div style="font-family: 'JetBrains Mono', monospace; font-size: 12px; color: #0F172A; min-width:230px;">
            <b style="color:#0891B2; font-size:13px;">🎯 ESTIMATED RELEASE CENTROID</b><br/>
            <span>Coords: <b>${driftRun.origin_lat.toFixed(4)}°N, ${driftRun.origin_lng.toFixed(4)}°E</b></span><br/>
            <span>Domain: <b style="color:#059669;">Deepwater Marine Fairway (Water)</b></span><br/>
            <span>Uncertainty: <b>±${driftRun.origin_uncertainty_km} km (95% CI)</b></span><br/>
            <span>Backtrack Time: <b>-${driftRun.time_window_hours} Hours</b></span><br/>
            <span style="font-size:10px; color:#64748B;">Forcing: INCOIS ROMS High-Res + ECMWF ERA5</span>
          </div>
        `);

      L.circle([driftRun.origin_lat, driftRun.origin_lng], {
        radius: (driftRun.origin_uncertainty_km || 2) * 1000,
        color: '#06B6D4',
        weight: 2,
        fillColor: '#06B6D4',
        fillOpacity: 0.18,
        dashArray: '6, 6'
      }).addTo(layers.driftGroup);

      // Trajectories parsing: handles both trajectories_json and trajectories_geojson
      try {
        const rawJson = driftRun.trajectories_json || (driftRun as any).trajectories_geojson;
        const trajectories = typeof rawJson === 'string' ? JSON.parse(rawJson) : rawJson;

        if (Array.isArray(trajectories) && trajectories.length > 0) {
          // Hydrodynamic spectral color palette (matching Reference Image)
          const SPECTRAL_COLORS = [
            '#EF4444', '#F97316', '#F59E0B', '#EAB308',
            '#84CC16', '#10B981', '#06B6D4', '#0284C7', '#2563EB', '#6366F1'
          ];

          // Draw ensemble particle streamlines
          trajectories.forEach((traj: any, pIdx: number) => {
            const pts = traj.points || traj.coordinates || traj;
            if (Array.isArray(pts)) {
              const latlngs: [number, number][] = pts
                .map((p: any) => {
                  if (Array.isArray(p)) {
                    // GeoJSON format [lng, lat, hours?]
                    return [p[1], p[0]] as [number, number];
                  }
                  return [p.lat, p.lng] as [number, number];
                })
                .filter((coord: [number, number]) => !isNaN(coord[0]) && !isNaN(coord[1]));

              if (latlngs.length >= 2) {
                const color = mode === 'drift' 
                  ? SPECTRAL_COLORS[pIdx % SPECTRAL_COLORS.length]
                  : (pIdx === 0 ? '#38BDF8' : '#06B6D4');
                const opacity = 0.55 + (pIdx % 5) * 0.08;

                L.polyline(latlngs, {
                  color: color,
                  weight: pIdx === 0 ? 2.8 : 2.0,
                  opacity: Math.min(0.9, opacity)
                }).addTo(layers.driftGroup);

                // If timeScrubber is active, place an indicator bead at the scrubbed time
                if (typeof timeScrubber === 'number' && timeScrubber !== 0) {
                  let closestPt = pts[0];
                  let minDiff = 9999;
                  pts.forEach((p: any) => {
                    const pHour = Array.isArray(p) ? (p[2] ?? 0) : (p.time_hours ?? 0);
                    const diff = Math.abs(pHour - timeScrubber);
                    if (diff < minDiff) {
                      minDiff = diff;
                      closestPt = p;
                    }
                  });
                  if (closestPt) {
                    const bLat = Array.isArray(closestPt) ? closestPt[1] : closestPt.lat;
                    const bLng = Array.isArray(closestPt) ? closestPt[0] : closestPt.lng;
                    if (!isNaN(bLat) && !isNaN(bLng)) {
                      L.circleMarker([bLat, bLng], {
                        radius: pIdx % 4 === 0 ? 4.5 : 2.8,
                        color: '#F59E0B',
                        fillColor: '#FBBF24',
                        fillOpacity: 0.9,
                        weight: 1.2
                      }).addTo(layers.driftGroup);
                    }
                  }
                }
              }
            }
          });
        } else if (incident) {
          L.polyline([[incident.lat, incident.lng], [driftRun.origin_lat, driftRun.origin_lng]], {
            color: '#06B6D4',
            weight: 2.5,
            opacity: 0.85,
            dashArray: '6, 6'
          }).addTo(layers.driftGroup);
        }
      } catch (e) {
        if (incident) {
          L.polyline([[incident.lat, incident.lng], [driftRun.origin_lat, driftRun.origin_lng]], {
            color: '#06B6D4',
            weight: 2.5,
            opacity: 0.85,
            dashArray: '6, 6'
          }).addTo(layers.driftGroup);
        }
      }

      // Forward Trajectories Plume (Reference Image overlay)
      if (activeLayers.forwardTrajectories && incident) {
        const forwardFan = [
          [[incident.lat, incident.lng], [incident.lat + 0.045, incident.lng + 0.040], [incident.lat + 0.08, incident.lng + 0.065]],
          [[incident.lat, incident.lng], [incident.lat + 0.035, incident.lng + 0.055], [incident.lat + 0.065, incident.lng + 0.095]],
          [[incident.lat, incident.lng], [incident.lat + 0.020, incident.lng + 0.050], [incident.lat + 0.045, incident.lng + 0.090]]
        ];
        forwardFan.forEach((pts: any) => {
          L.polyline(pts, {
            color: '#F97316',
            weight: 2.2,
            dashArray: '6, 5',
            opacity: 0.8
          }).addTo(layers.driftGroup);
        });
      }

      // Add Hydrodynamic Ocean Surface Current Vectors along fairway channel (Reference Image)
      if (activeLayers.currentVectors && layers.vectorGroup) {
        const currentVectors = [
          { lat: 22.82, lng: 70.01, speed: '1.2 kn', angle: 235 },
          { lat: 22.75, lng: 69.88, speed: '1.1 kn', angle: 230 },
          { lat: 22.68, lng: 69.75, speed: '1.1 kn', angle: 235 },
          { lat: 22.60, lng: 69.60, speed: '0.9 kn', angle: 240 },
          { lat: 22.50, lng: 69.40, speed: '0.8 kn', angle: 245 },
          { lat: 22.42, lng: 69.20, speed: '0.9 kn', angle: 240 }
        ];

        currentVectors.forEach((v) => {
          const arrowIcon = L.divIcon({
            className: 'ocean-current-vector',
            html: `
              <div style="display:flex; align-items:center; gap:3px; transform:rotate(${v.angle}deg); transform-origin:center;">
                <svg width="22" height="14" viewBox="0 0 24 14" fill="#10B981">
                  <path d="M0 7h18m-6-6l7 6-7 6" stroke="#10B981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
                </svg>
                <span style="font-family:'JetBrains Mono',monospace; font-size:9px; font-weight:bold; color:#34D399; text-shadow:0 1px 3px #000; transform:rotate(-${v.angle}deg); white-space:nowrap;">
                  ${v.speed}
                </span>
              </div>
            `,
            iconSize: [60, 24],
            iconAnchor: [15, 12]
          });
          L.marker([v.lat, v.lng], { icon: arrowIcon }).addTo(layers.vectorGroup);
        });
      }

      // Wind Vectors (ECMWF ERA5 10m Wind)
      if (activeLayers.windVectors && layers.vectorGroup) {
        const windVectors = [
          { lat: 22.88, lng: 69.50, speed: '14 kn', angle: 205 },
          { lat: 22.72, lng: 69.25, speed: '13 kn', angle: 210 },
          { lat: 22.55, lng: 69.05, speed: '15 kn', angle: 205 }
        ];
        windVectors.forEach((w) => {
          const windIcon = L.divIcon({
            className: 'ocean-wind-vector',
            html: `
              <div style="display:flex; align-items:center; gap:2px; transform:rotate(${w.angle}deg); transform-origin:center; opacity:0.85;">
                <svg width="20" height="12" viewBox="0 0 20 12">
                  <path d="M0 6h15m-5-5l6 5-6 5" stroke="#38BDF8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
                </svg>
                <span style="font-family:'JetBrains Mono',monospace; font-size:8px; font-weight:bold; color:#7DD3FC; transform:rotate(-${w.angle}deg);">
                  ${w.speed}
                </span>
              </div>
            `,
            iconSize: [50, 20],
            iconAnchor: [10, 10]
          });
          L.marker([w.lat, w.lng], { icon: windIcon }).addTo(layers.vectorGroup);
        });
      }
    }

    // 5. Hypothetical Discharge & Forward Trajectory (Counterfactual Hypothesis Verification)
    if (hypotheticalDrift) {
      const hypIcon = L.divIcon({
        className: 'hypothetical-release-pin',
        html: `
          <div style="position:relative; width:32px; height:32px; display:flex; align-items:center; justify-content:center;">
            <div style="position:absolute; width:100%; height:100%; border-radius:50%; background:rgba(168, 85, 247, 0.45); animation: ping 1.6s infinite;"></div>
            <div style="width:14px; height:14px; border-radius:50%; background:#A855F7; border:2px solid #FFFFFF; box-shadow:0 0 12px #A855F7;"></div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      L.marker([hypotheticalDrift.releaseLat, hypotheticalDrift.releaseLng], { icon: hypIcon })
        .addTo(layers.driftGroup)
        .bindPopup(`
          <div style="font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #0F172A;">
            <b style="color:#7C3AED;">🧪 HYPOTHESIZED RELEASE LOCATION</b><br/>
            <span>${hypotheticalDrift.scenarioName || 'Candidate Discharge CPA'}</span><br/>
            <span>Coords: ${hypotheticalDrift.releaseLat.toFixed(4)}°N, ${hypotheticalDrift.releaseLng.toFixed(4)}°E</span>
          </div>
        `);

      if (incident) {
        // Forward advection plume vector connecting candidate release to observed slick
        L.polyline(
          [
            [hypotheticalDrift.releaseLat, hypotheticalDrift.releaseLng],
            [(hypotheticalDrift.releaseLat + incident.lat) / 2 + 0.008, (hypotheticalDrift.releaseLng + incident.lng) / 2],
            [incident.lat, incident.lng]
          ],
          {
            color: '#A855F7',
            weight: 3,
            opacity: 0.9,
            dashArray: '6, 6'
          }
        ).addTo(layers.driftGroup);
      }
    }

    // 6. Live AIS Vessel Candidates with Real-time Moving Coordinates
    if (activeLayers.vessels) {
      if (mode === 'drift') {
        const fairwayAIS = [
          { name: 'MT KANDLA PIONEER', lat: 22.78, lng: 69.98, heading: 235, speed: '14.2 kn' },
          { name: 'MT OCEAN PRIDE', lat: 22.72, lng: 69.85, heading: 230, speed: '13.8 kn' },
          { name: 'GAS GEMINI', lat: 22.67, lng: 69.68, heading: 235, speed: '15.1 kn' },
          { name: 'MAERSK DHOLERA', lat: 22.58, lng: 69.45, heading: 240, speed: '16.4 kn' },
          { name: 'BHARAT SAMUDRA', lat: 22.48, lng: 69.30, heading: 245, speed: '12.0 kn' },
          { name: 'SWARNA SINDHU', lat: 22.38, lng: 69.15, heading: 240, speed: '14.5 kn' },
          { name: 'PACIFIC RUBY', lat: 22.75, lng: 69.48, heading: 55, speed: '13.2 kn' },
          { name: 'GULF EXPLORER', lat: 22.42, lng: 69.42, heading: 60, speed: '11.8 kn' }
        ];

        fairwayAIS.forEach((v) => {
          const boatIcon = L.divIcon({
            className: 'ais-fairway-vessel',
            html: `
              <div style="transform:rotate(${v.heading}deg); transform-origin:center; filter:drop-shadow(0 0 5px rgba(34,197,94,0.9)); cursor:pointer;" title="${v.name} (${v.speed})">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="#22C55E">
                  <polygon points="12,2 22,22 12,17 2,22" />
                </svg>
              </div>
            `,
            iconSize: [20, 20],
            iconAnchor: [10, 10]
          });
          L.marker([v.lat, v.lng], { icon: boatIcon }).addTo(layers.vesselGroup).bindPopup(`
            <div style="font-family:'JetBrains Mono',monospace; font-size:11px; color:#0F172A;">
              <b style="color:#16A34A;">🚢 ${v.name}</b><br/>
              <span>Live Speed: <b>${v.speed}</b> | Heading: <b>${v.heading}°</b></span><br/>
              <span style="color:#64748B;">AIS Fairway Telemetry (Gulf of Kutch)</span>
            </div>
          `);
        });
      } else if (vessels.length > 0) {
        const centerLat = incident?.lat || (allIncidents.length > 0 ? allIncidents[0].lat : 19.4182);
        const centerLng = incident?.lng || (allIncidents.length > 0 ? allIncidents[0].lng : 71.3412);

      vessels.forEach((vessel, idx) => {
        const isCritical = vessel.risk_level === 'CRITICAL_LEAD';
        const isElevated = vessel.risk_level === 'ELEVATED';
        const color = isCritical ? '#EF4444' : isElevated ? '#F59E0B' : '#10B981';

        // Calculate live-time animated offset based on course & speed
        const speedKnots = vessel.speed_knots || (12 + idx * 2.5);
        const courseDeg = vessel.course_deg || (220 + idx * 30);
        const courseRad = (courseDeg * Math.PI) / 180;

        // Base lat/lng offset
        const baseLatOffset = isCritical ? -0.018 : (idx + 1) * 0.025;
        const baseLngOffset = isCritical ? -0.024 : (idx + 1) * 0.035;

        // Dynamic real-time micro-advancement (moves smoothly forward in real time)
        const timeFactor = (liveSeconds % 120) * 0.00015;
        const liveLat = centerLat + baseLatOffset + Math.cos(courseRad) * timeFactor;
        const liveLng = centerLng + baseLngOffset + Math.sin(courseRad) * timeFactor;

        // Real-time animated vessel pin with heading arrow
        const vesselIcon = L.divIcon({
          className: 'live-vessel-pin',
          html: `
            <div style="position:relative; display:flex; flex-direction:column; align-items:center;">
              <div style="position:absolute; top:-4px; width:28px; height:28px; border-radius:50%; background:${color}33; animation:ping 2s cubic-bezier(0,0,0.2,1) infinite;"></div>
              
              <div style="background:${color}; width:28px; height:28px; border-radius:6px; display:flex; align-items:center; justify-content:center; border:2px solid #FFFFFF; box-shadow:0 0 12px ${color}; transform:rotate(${courseDeg}deg); transition: transform 0.5s;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="#FFFFFF">
                  <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/>
                </svg>
              </div>

              <div style="margin-top:2px; background:rgba(10,18,36,0.92); border:1px solid rgba(255,255,255,0.2); padding:1px 5px; border-radius:4px; font-size:9px; font-weight:bold; color:#FFFFFF; white-space:nowrap; box-shadow:0 2px 4px rgba(0,0,0,0.4);">
                ${vessel.vessel_name.split(' ')[0]} • ${(speedKnots + Math.sin(liveSeconds * 0.5) * 0.3).toFixed(1)}kn
              </div>
            </div>
          `,
          iconSize: [40, 50],
          iconAnchor: [20, 20]
        });

        // Add Vessel Marker
        L.marker([liveLat, liveLng], { icon: vesselIcon })
          .addTo(layers.vesselGroup)
          .bindPopup(`
            <div style="font-family: 'JetBrains Mono', monospace; font-size: 12px; color: #0F172A; min-width:220px;">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                <b style="color:${color}; font-size:13px;">🚢 ${vessel.vessel_name}</b>
                <span style="background:${color}22; color:${color}; padding:2px 6px; border-radius:4px; font-size:10px; font-weight:bold;">${vessel.risk_level}</span>
              </div>
              <span>MMSI: <b>${vessel.mmsi}</b> | IMO: ${vessel.imo || '9482103'}</span><br/>
              <span>Type: <b>${vessel.vessel_type}</b> | Flag: <b>${vessel.flag}</b></span><br/>
              <span>Live Speed: <b>${(speedKnots + Math.sin(liveSeconds * 0.5) * 0.3).toFixed(1)} knots</b> | Heading: <b>${courseDeg}°</b></span><br/>
              <span>Live Position: <b>${liveLat.toFixed(4)}°N, ${liveLng.toFixed(4)}°E</b></span><br/>
              <span>CPA to Slick Origin: <b style="color:${color};">${vessel.cpa_distance_km.toFixed(1)} km</b></span><br/>
              <span>Attribution Compatibility: <b style="color:${color}; font-size:13px;">${vessel.compatibility_score}%</b></span>
            </div>
          `);

        // Draw Live Breadcrumb Trajectory Path behind ship
        const breadcrumbs = [
          [liveLat - Math.cos(courseRad) * 0.05, liveLng - Math.sin(courseRad) * 0.05],
          [liveLat - Math.cos(courseRad) * 0.025, liveLng - Math.sin(courseRad) * 0.025],
          [liveLat, liveLng]
        ] as [number, number][];

        L.polyline(breadcrumbs, {
          color: color,
          weight: isCritical ? 3 : 2,
          opacity: 0.85,
          dashArray: '3, 4'
        }).addTo(layers.vesselGroup);
      });
    }
  }

    // 7. India's 200 nm Maritime Exclusive Economic Zone (EEZ)
    if (activeLayers.eez && layers.eezGroup) {
      const eezOpts: L.PolylineOptions = {
        color: '#06B6D4',
        weight: 2,
        opacity: 0.95,
        dashArray: '8, 8'
      };
      L.polyline(INDIA_EEZ_WEST, eezOpts).addTo(layers.eezGroup);
      L.polyline(INDIA_EEZ_EAST, eezOpts).addTo(layers.eezGroup);
      L.polygon(LAKSHADWEEP_EEZ, { ...eezOpts, fill: false }).addTo(layers.eezGroup);
      L.polygon(ANDAMAN_EEZ, { ...eezOpts, fill: false }).addTo(layers.eezGroup);

      // EEZ Text label in water for Gulf of Kutch
      if (mode === 'drift') {
        const eezLabel = L.divIcon({
          className: 'eez-text-label',
          html: `<div style="font-family:'Inter',sans-serif; font-size:10px; font-weight:bold; color:rgba(255,255,255,0.8); text-shadow:0 1px 3px #000; transform:rotate(-25deg); white-space:nowrap;">India EEZ</div>`,
          iconSize: [80, 20],
          iconAnchor: [40, 10]
        });
        L.marker([22.38, 69.10], { icon: eezLabel }).addTo(layers.eezGroup);
      }
    }

    // 8. Strategic Ports (Gulf of Kutch Ports in Drift Mode matching Reference Image)
    if (activeLayers.ports && layers.portGroup) {
      if (mode === 'drift') {
        const kutchPorts = [
          { name: 'Kandla', lat: 23.01, lng: 70.22, code: 'INIXY' },
          { name: 'Mundra', lat: 22.82, lng: 69.70, code: 'INMUN' },
          { name: 'Jamnagar', lat: 22.47, lng: 70.07, code: 'INJGA' },
          { name: 'Dwarka', lat: 22.24, lng: 68.96, code: 'INDWA' }
        ];

        kutchPorts.forEach((p) => {
          const pIcon = L.divIcon({
            className: 'kutch-port-pin',
            html: `
              <div style="display:flex; flex-direction:column; align-items:center; cursor:pointer;">
                <div style="width:22px; height:22px; border-radius:50%; background:#0284C7; border:2px solid #FFFFFF; display:flex; align-items:center; justify-content:center; box-shadow:0 0 10px rgba(2,132,199,0.9);">
                  <span style="font-size:10px; color:#FFFFFF;">⚓</span>
                </div>
                <div style="margin-top:2px; font-family:'Inter',sans-serif; font-size:11px; font-weight:bold; color:#FFFFFF; text-shadow:0 1px 4px rgba(0,0,0,0.95), 0 0 2px #000; white-space:nowrap;">
                  ${p.name}
                </div>
              </div>
            `,
            iconSize: [70, 40],
            iconAnchor: [35, 11]
          });

          L.marker([p.lat, p.lng], { icon: pIcon })
            .addTo(layers.portGroup)
            .bindPopup(`
              <div style="font-family:'JetBrains Mono',monospace; font-size:11px; color:#0F172A;">
                <b style="color:#0284C7; font-size:12px;">⚓ ${p.name} Port</b><br/>
                <span>UN/LOCODE: <b>${p.code}</b></span><br/>
                <span>Coords: <b>${p.lat.toFixed(2)}°N, ${p.lng.toFixed(2)}°E</b></span>
              </div>
            `);
        });

        // Water body label: 'Gulf of Kutch'
        const gulfLabel = L.divIcon({
          className: 'gulf-water-label',
          html: `<div style="font-family:'Inter',sans-serif; font-size:16px; font-style:italic; font-weight:600; color:rgba(255,255,255,0.7); text-shadow:0 1px 4px rgba(0,0,0,0.85); pointer-events:none; white-space:nowrap;">Gulf of Kutch</div>`,
          iconSize: [140, 30],
          iconAnchor: [70, 15]
        });
        L.marker([22.56, 69.58], { icon: gulfLabel }).addTo(layers.portGroup);
      } else if (ports.length === 0) {
        STRATEGIC_PORTS_HUD.forEach((port) => {
          const portIcon = L.divIcon({
            className: 'hud-strategic-port-pin',
            html: `
              <div style="display:flex; align-items:center; gap:5px; cursor:pointer;">
                <div style="width:7px; height:7px; border-radius:50%; background:#FFFFFF; box-shadow:0 0 6px rgba(255,255,255,0.9), 0 0 2px #000;"></div>
                <span style="font-family:'Inter', sans-serif; font-size:11px; font-weight:600; color:#FFFFFF; text-shadow:0 1px 4px rgba(0,0,0,0.9), 0 0 2px #000; white-space:nowrap;">
                  ${port.name}
                </span>
              </div>
            `,
            iconSize: [110, 20],
            iconAnchor: [3, 10]
          });
          L.marker([port.lat, port.lng], { icon: portIcon })
            .addTo(layers.portGroup)
            .bindPopup(`
              <div style="font-family:'JetBrains Mono', monospace; font-size:12px; color:#0F172A;">
                <b style="color:#0284C7; font-size:13px;">⚓ ${port.name} Port</b><br/>
                <span>Coords: ${port.lat.toFixed(2)}°N, ${port.lng.toFixed(2)}°E</span><br/>
                <span style="color:#10B981; font-weight:bold;">● Major Strategic Indian Port</span>
              </div>
            `);
        });
      }
    }

    // 8b. Offshore Oil Platforms (Reference Image)
    if (activeLayers.platforms && layers.platformGroup && mode === 'drift') {
      const platforms = [
        { name: 'IOCL Vadinar SBM', lat: 22.52, lng: 69.72 },
        { name: 'BPCL Fairway Buoy', lat: 22.68, lng: 69.85 }
      ];

      platforms.forEach((pl) => {
        const plIcon = L.divIcon({
          className: 'drift-platform-pin',
          html: `
            <div style="display:flex; align-items:center; gap:4px; cursor:pointer;">
              <div style="width:11px; height:11px; background:#F59E0B; border:1.5px solid #FFFFFF; transform:rotate(45deg); box-shadow:0 0 8px #F59E0B;"></div>
              <span style="font-family:'Inter',sans-serif; font-size:10px; font-weight:bold; color:#FEF08A; text-shadow:0 1px 3px #000; white-space:nowrap;">
                ${pl.name}
              </span>
            </div>
          `,
          iconSize: [120, 20],
          iconAnchor: [6, 10]
        });

        L.marker([pl.lat, pl.lng], { icon: plIcon })
          .addTo(layers.platformGroup)
          .bindPopup(`<b>Offshore Terminal: ${pl.name}</b><br/>Crude Offloading Fairway Station`);
      });
    }

    // 8c. Live Fairway AIS Vessels in Drift Mode (Reference Image lime-green vessels)
    if (activeLayers.vessels && mode === 'drift') {
      const fairwayAIS = [
        { name: 'MT NEELKANTH GLORY', lat: 22.76, lng: 69.45, course: 65, speed: '12.8 kn' },
        { name: 'PACIFIC RUBY', lat: 22.68, lng: 69.60, course: 245, speed: '11.4 kn' },
        { name: 'GULF EXPLORER', lat: 22.58, lng: 69.78, course: 70, speed: '13.2 kn' },
        { name: 'AL FAHAD', lat: 22.48, lng: 69.30, course: 240, speed: '14.5 kn' },
        { name: 'SEAVIEW-8', lat: 22.62, lng: 69.90, course: 120, speed: '8.5 kn' },
        { name: 'KANDLA MARU', lat: 22.82, lng: 70.08, course: 55, speed: '10.2 kn' }
      ];

      fairwayAIS.forEach((v) => {
        const vIcon = L.divIcon({
          className: 'drift-fairway-vessel',
          html: `
            <div style="transform:rotate(${v.course}deg); display:flex; align-items:center; justify-content:center;">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="#22C55E">
                <path d="M12 2L5 20l7-3 7 3L12 2z" stroke="#FFFFFF" stroke-width="1.5" stroke-linejoin="round"/>
              </svg>
            </div>
          `,
          iconSize: [22, 22],
          iconAnchor: [11, 11]
        });

        L.marker([v.lat, v.lng], { icon: vIcon })
          .addTo(layers.vesselGroup)
          .bindPopup(`<b>${v.name}</b><br/>Speed: ${v.speed} | Course: ${v.course}°`);
      });
    }

    // 9. Suspect Candidate Vessel & AIS Track in Heatmap Mode
    if (activeLayers.heatmap && incident) {
      const candLat = incident.lat - 1.85;
      const candLng = incident.lng - 2.50;

      L.polyline([[incident.lat, incident.lng], [incident.lat - 0.7, incident.lng - 1.1], [candLat, candLng]], {
        color: '#EF4444',
        weight: 2.5,
        opacity: 0.95,
        dashArray: '7, 6'
      }).addTo(layers.vesselGroup);

      const candIcon = L.divIcon({
        className: 'candidate-tanker-pin',
        html: `
          <div style="position:relative; display:flex; flex-direction:column; align-items:center; cursor:pointer;">
            <div style="position:absolute; width:28px; height:28px; border-radius:50%; background:rgba(239,68,68,0.45); animation:ping 1.8s infinite;"></div>
            <div style="width:24px; height:24px; border-radius:6px; background:#EF4444; border:2px solid #FFFFFF; display:flex; align-items:center; justify-content:center; box-shadow:0 0 10px #EF4444; transform:rotate(-45deg);">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="#FFFFFF">
                <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/>
              </svg>
            </div>
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });

      L.marker([candLat, candLng], { icon: candIcon })
        .addTo(layers.vesselGroup)
        .bindPopup(`
          <div style="font-family:'JetBrains Mono', monospace; font-size:12px; color:#0F172A; min-width:200px;">
            <b style="color:#DC2626; font-size:13px;">🚢 Vessel (Candidate)</b><br/>
            <span>MMSI: <b>419XXXXXX</b></span><br/>
            <span>Type: <b>Oil Tanker</b></span><br/>
            <span>Speed: <b>12.4 kn</b></span><br/>
            <span>Time: <b>12 Jan 2024, 02:16 UTC</b></span>
          </div>
        `);
    }
  }, [incident, driftRun, vessels, allIncidents, ports, hypotheticalDrift, opticalOverlay, activeLayers, liveSeconds, timeScrubber, mode]);

  // Handle Map Recenter
  const handleRecenter = () => {
    const map = mapInstanceRef.current;
    if (!map) return;
    if (mode === 'drift') {
      map.setView([22.58, 69.55], 9, { animate: true });
    } else if (incident) {
      map.panTo([incident.lat, incident.lng], { animate: true });
    }
  };

  return (
    <div className={`relative w-full rounded-2xl overflow-hidden border transition-all ${
      isLightMode ? 'border-[#DCE4EE] shadow-md bg-[#F8FAFC]' : 'border-white/15 shadow-2xl bg-[#030712]'
    }`}>
      {/* Top Google Maps & Live Stream HUD Bar */}
      <div className={`absolute top-2.5 left-2.5 z-[1000] flex flex-wrap items-center gap-1.5 font-mono ${isCompactMap ? 'text-[10px]' : 'text-xs'}`}>
        {/* Google Maps Base Layer Switcher */}
        <div className={`flex items-center gap-1 backdrop-blur-xl p-1 rounded-xl border shadow-xl ${
          isCompactMap ? 'text-[10px]' : 'text-[11px]'
        } ${
          isLightMode ? 'bg-white/95 text-slate-800 border-slate-300/90' : 'bg-[#0A1224]/85 text-slate-300 border-white/15'
        }`}>
          <button
            onClick={() => setMapType('google_hybrid')}
            className={`px-2 py-0.5 rounded-lg transition-all ${
              mapType === 'google_hybrid'
                ? isLightMode ? 'bg-cyan-600 text-white font-bold shadow-sm' : 'bg-cyan-500 text-black font-bold shadow-md'
                : isLightMode ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100' : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            {isCompactMap ? 'Hybrid' : '🛰️ Google Hybrid'}
          </button>
          <button
            onClick={() => setMapType('google_satellite')}
            className={`px-2 py-0.5 rounded-lg transition-all ${
              mapType === 'google_satellite'
                ? isLightMode ? 'bg-cyan-600 text-white font-bold shadow-sm' : 'bg-cyan-500 text-black font-bold shadow-md'
                : isLightMode ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100' : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            {isCompactMap ? 'Satellite' : 'Pure Satellite'}
          </button>
          <button
            onClick={() => setMapType('google_dark')}
            className={`px-2 py-0.5 rounded-lg transition-all ${
              mapType === 'google_dark'
                ? isLightMode ? 'bg-cyan-600 text-white font-bold shadow-sm' : 'bg-cyan-500 text-black font-bold shadow-md'
                : isLightMode ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100' : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            {isCompactMap ? 'Night' : 'Night Radar'}
          </button>
          {!isCompactMap && (
            <>
              <button
                onClick={() => setMapType('google_roads')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  mapType === 'google_roads'
                    ? isLightMode ? 'bg-cyan-600 text-white font-bold shadow-sm' : 'bg-cyan-500 text-black font-bold shadow-md'
                    : isLightMode ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100' : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
              >
                Nautical Charts
              </button>
              <button
                onClick={() => {
                  setActiveLayers((p) => {
                    const nextState = !p.heatmap;
                    if (nextState && mapType !== 'google_satellite') {
                      setMapType('google_satellite');
                    }
                    return { ...p, heatmap: nextState };
                  });
                }}
                className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 font-bold ${
                  activeLayers.heatmap
                    ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-md'
                    : isLightMode ? 'text-amber-800 hover:bg-amber-100' : 'text-amber-300 hover:bg-white/10'
                }`}
                title="Toggle SAR Concentration Heatmap Layer (Image 2)"
              >
                🔥 Heatmap
              </button>
            </>
          )}
        </div>

        {/* Live AIS Feed Pill */}
        {!isCompactMap && (
          <button
            type="button"
            onClick={() => setIsLiveActive((p) => !p)}
            title="Toggle live AIS simulation feed"
            className={`flex items-center gap-2 backdrop-blur-xl px-3 py-1.5 rounded-xl border text-[11px] shadow-lg font-sans transition-all cursor-pointer ${
              isLiveActive
                ? isLightMode
                  ? 'bg-white/95 text-emerald-700 border-emerald-300/80 hover:bg-emerald-50'
                  : 'bg-[#0A1224]/85 text-emerald-300 border-emerald-500/30 hover:bg-[#0D1B33]'
                : isLightMode
                  ? 'bg-white/95 text-slate-500 border-slate-300 hover:bg-slate-50'
                  : 'bg-[#0A1224]/85 text-slate-400 border-slate-700 hover:bg-[#0D1B33]'
            }`}>
            <span className={`w-2 h-2 rounded-full ${isLiveActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
            <span className="font-bold">LIVE AIS FEED:</span>
            <span className={isLightMode ? 'text-slate-700 font-semibold' : 'text-slate-200'}>8 Vessels</span>
            <span className={isLightMode ? 'text-slate-400' : 'text-slate-500'}>|</span>
            <span className={isLightMode ? 'text-slate-600' : 'text-slate-300'}>{livePingsReceived.toLocaleString()} pings</span>
            <span className="text-[10px] text-slate-400">⌵</span>
          </button>
        )}
      </div>

      {/* Map Canvas */}
      <div ref={mapContainerRef} style={{ width: '100%', height }} className="z-0" />

      {/* Right Layer Controls */}
      {showLayersControl && (
        <div className={`absolute top-3 right-3 z-[1000] flex flex-col gap-1.5 backdrop-blur-xl p-3 rounded-xl border shadow-xl text-xs font-sans ${
          isLightMode ? 'bg-white/95 text-slate-800 border-slate-300/90' : 'bg-[#0A1224]/85 text-slate-200 border-white/15'
        }`}>
          <div className="text-[11px] font-bold uppercase tracking-wider mb-0.5 flex items-center justify-between">
            <span className={`flex items-center gap-1.5 ${isLightMode ? 'text-slate-700' : 'text-slate-400'}`}>
              <span className="w-2 h-2 rounded-full bg-cyan-500"></span> OVERLAYS
            </span>
            <button
              onClick={handleRecenter}
              className={`text-[10px] font-bold ${isLightMode ? 'text-cyan-700 hover:text-cyan-900' : 'text-cyan-300 hover:text-cyan-100'}`}
              title="Recenter Map on Incident"
            >
              ⌖ Center
            </button>
          </div>

          {mode === 'drift' ? (
            <>
              {/* 1. Slick Footprint */}
              <label className={`flex items-center gap-2 cursor-pointer transition ${isLightMode ? 'text-slate-700 hover:text-slate-900' : 'hover:text-white'}`}>
                <input
                  type="checkbox"
                  checked={activeLayers.slick}
                  onChange={(e) => setActiveLayers((p) => ({ ...p, slick: e.target.checked }))}
                  className="rounded accent-red-500"
                />
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444]"></span> Slick Footprint
                </span>
              </label>

              {/* 2. Backward Trajectories */}
              <label className={`flex items-center gap-2 cursor-pointer transition ${isLightMode ? 'text-slate-700 hover:text-slate-900' : 'hover:text-white'}`}>
                <input
                  type="checkbox"
                  checked={activeLayers.drift}
                  onChange={(e) => setActiveLayers((p) => ({ ...p, drift: e.target.checked }))}
                  className="rounded accent-blue-500"
                />
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#0284C7]"></span> Backward Trajectories
                </span>
              </label>

              {/* 3. Forward Trajectories */}
              <label className={`flex items-center gap-2 cursor-pointer transition ${isLightMode ? 'text-slate-700 hover:text-slate-900' : 'hover:text-white'}`}>
                <input
                  type="checkbox"
                  checked={activeLayers.forwardTrajectories}
                  onChange={(e) => setActiveLayers((p) => ({ ...p, forwardTrajectories: e.target.checked }))}
                  className="rounded accent-orange-500"
                />
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#F97316]"></span> Forward Trajectories
                </span>
              </label>

              {/* 4. Current Vectors */}
              <label className={`flex items-center gap-2 cursor-pointer transition ${isLightMode ? 'text-slate-700 hover:text-slate-900' : 'hover:text-white'}`}>
                <input
                  type="checkbox"
                  checked={activeLayers.currentVectors}
                  onChange={(e) => setActiveLayers((p) => ({ ...p, currentVectors: e.target.checked }))}
                  className="rounded accent-emerald-500"
                />
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]"></span> Current Vectors
                </span>
              </label>

              {/* 5. Wind Vectors */}
              <label className={`flex items-center gap-2 cursor-pointer transition ${isLightMode ? 'text-slate-700 hover:text-slate-900' : 'hover:text-white'}`}>
                <input
                  type="checkbox"
                  checked={activeLayers.windVectors}
                  onChange={(e) => setActiveLayers((p) => ({ ...p, windVectors: e.target.checked }))}
                  className="rounded accent-cyan-500"
                />
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#06B6D4]"></span> Wind Vectors
                </span>
              </label>

              {/* 6. Live AIS Vessels */}
              <label className={`flex items-center gap-2 cursor-pointer transition ${isLightMode ? 'text-slate-700 hover:text-slate-900' : 'hover:text-white'}`}>
                <input
                  type="checkbox"
                  checked={activeLayers.vessels}
                  onChange={(e) => setActiveLayers((p) => ({ ...p, vessels: e.target.checked }))}
                  className="rounded accent-green-500"
                />
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#22C55E]"></span> Live AIS Vessels
                </span>
              </label>

              {/* 7. SAR Heatmap */}
              <label className={`flex items-center gap-2 cursor-pointer transition ${isLightMode ? 'text-slate-700 hover:text-slate-900' : 'hover:text-white'}`}>
                <input
                  type="checkbox"
                  checked={activeLayers.heatmap}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    if (checked && mapType !== 'google_satellite') {
                      setMapType('google_satellite');
                    }
                    setActiveLayers((p) => ({ ...p, heatmap: checked }));
                  }}
                  className="rounded accent-purple-500"
                />
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#8B5CF6]"></span> SAR Heatmap
                </span>
              </label>

              {/* 8. Maritime Zone (EEZ) */}
              <label className={`flex items-center gap-2 cursor-pointer transition ${isLightMode ? 'text-slate-700 hover:text-slate-900' : 'hover:text-white'}`}>
                <input
                  type="checkbox"
                  checked={activeLayers.eez}
                  onChange={(e) => setActiveLayers((p) => ({ ...p, eez: e.target.checked }))}
                  className="rounded accent-cyan-500"
                />
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#06B6D4]"></span> Maritime Zone (EEZ)
                </span>
              </label>

              {/* 9. Strategic Ports */}
              <label className={`flex items-center gap-2 cursor-pointer transition ${isLightMode ? 'text-slate-700 hover:text-slate-900' : 'hover:text-white'}`}>
                <input
                  type="checkbox"
                  checked={activeLayers.ports}
                  onChange={(e) => setActiveLayers((p) => ({ ...p, ports: e.target.checked }))}
                  className="rounded accent-sky-400"
                />
                <span className="flex items-center gap-1.5">
                  <span className="text-[11px]">⚓</span> Strategic Ports
                </span>
              </label>

              {/* 10. Oil Platforms */}
              <label className={`flex items-center gap-2 cursor-pointer transition ${isLightMode ? 'text-slate-700 hover:text-slate-900' : 'hover:text-white'}`}>
                <input
                  type="checkbox"
                  checked={activeLayers.platforms}
                  onChange={(e) => setActiveLayers((p) => ({ ...p, platforms: e.target.checked }))}
                  className="rounded accent-amber-500"
                />
                <span className="flex items-center gap-1.5">
                  <span className="text-[11px]">🏭</span> Oil Platforms
                </span>
              </label>
            </>
          ) : (
            <>
              <label className={`flex items-center gap-2 cursor-pointer transition ${isLightMode ? 'text-slate-700 hover:text-slate-900' : 'hover:text-white'}`}>
                <input
                  type="checkbox"
                  checked={activeLayers.slick}
                  onChange={(e) => setActiveLayers((p) => ({ ...p, slick: e.target.checked }))}
                  className="rounded accent-orange-500"
                />
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span> Slick Footprint
                </span>
              </label>
              <label className={`flex items-center gap-2 cursor-pointer transition ${isLightMode ? 'text-slate-700 hover:text-slate-900' : 'hover:text-white'}`}>
                <input
                  type="checkbox"
                  checked={activeLayers.drift}
                  onChange={(e) => setActiveLayers((p) => ({ ...p, drift: e.target.checked }))}
                  className="rounded accent-cyan-500"
                />
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-500"></span> Drift Trajectory
                </span>
              </label>
              <label className={`flex items-center gap-2 cursor-pointer transition ${isLightMode ? 'text-slate-700 hover:text-slate-900' : 'hover:text-white'}`}>
                <input
                  type="checkbox"
                  checked={activeLayers.vessels}
                  onChange={(e) => setActiveLayers((p) => ({ ...p, vessels: e.target.checked }))}
                  className="rounded accent-red-500"
                />
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span> Live AIS Vessels
                </span>
              </label>
              <label className={`flex items-center gap-2 cursor-pointer transition ${isLightMode ? 'text-slate-700 hover:text-slate-900' : 'hover:text-white'}`}>
                <input
                  type="checkbox"
                  checked={activeLayers.radarSweep}
                  onChange={(e) => setActiveLayers((p) => ({ ...p, radarSweep: e.target.checked }))}
                  className="rounded accent-cyan-400"
                />
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-500"></span> Radar Beam (20 RPM)
                </span>
              </label>
              <label className={`flex items-center gap-2 cursor-pointer transition ${isLightMode ? 'text-slate-700 hover:text-slate-900' : 'hover:text-white'}`}>
                <input
                  type="checkbox"
                  checked={activeLayers.heatmap}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    if (checked && mapType !== 'google_satellite') {
                      setMapType('google_satellite');
                    }
                    setActiveLayers((p) => ({ ...p, heatmap: checked }));
                  }}
                  className="rounded accent-red-500"
                />
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-yellow-400 to-red-500"></span> SAR Heatmap
                </span>
              </label>
              <label className={`flex items-center gap-2 cursor-pointer transition ${isLightMode ? 'text-slate-700 hover:text-slate-900' : 'hover:text-white'}`}>
                <input
                  type="checkbox"
                  checked={activeLayers.eez}
                  onChange={(e) => setActiveLayers((p) => ({ ...p, eez: e.target.checked }))}
                  className="rounded accent-cyan-500"
                />
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span> Maritime Zone (EEZ)
                </span>
              </label>
              <label className={`flex items-center gap-2 cursor-pointer transition ${isLightMode ? 'text-slate-700 hover:text-slate-900' : 'hover:text-white'}`}>
                <input
                  type="checkbox"
                  checked={activeLayers.ports}
                  onChange={(e) => setActiveLayers((p) => ({ ...p, ports: e.target.checked }))}
                  className="rounded accent-sky-400"
                />
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-400"></span> Strategic Ports
                </span>
              </label>
            </>
          )}
        </div>
      )}

      {/* North Arrow & Scale Bar in Drift Mode (Reference Image bottom-left) */}
      {mode === 'drift' && !isCompactMap && (
        <div className="absolute bottom-8 left-5 z-[999] flex items-end gap-3 pointer-events-none select-none">
          <div className="flex flex-col items-center drop-shadow-lg">
            <svg width="24" height="28" viewBox="0 0 24 28">
              <path d="M12 2L5 16h14L12 2z" fill="#FFFFFF"/>
              <path d="M12 2v14h7L12 2z" fill="#CBD5E1"/>
              <path d="M12 16L5 24h14L12 16z" fill="#475569" opacity="0.4"/>
            </svg>
            <span className="font-bold text-white text-[11px] -mt-1 font-mono">N</span>
          </div>
          <div className="flex flex-col font-mono text-[10px] text-white drop-shadow-md pb-1">
            <div className="flex justify-between w-20 mb-0.5">
              <span>0</span>
              <span>20 km</span>
            </div>
            <div className="w-20 h-1.5 border-b-2 border-l-2 border-r-2 border-white relative bg-white/20">
              <div className="absolute top-0 left-1/2 h-1.5 border-l border-white"></div>
            </div>
          </div>
        </div>
      )}

      {/* Floating HUD Cards for Heatmap Mode (matching Image 2) - only on non-compact maps and non-drift mode */}
      {activeLayers.heatmap && !isCompactMap && mode !== 'drift' && (
        <>
          {/* Top-Left Satellite View HUD */}
          <div className="absolute top-16 left-3 z-[999] bg-[#0A1224]/90 backdrop-blur-md text-white p-3 rounded-xl border border-white/15 shadow-xl max-w-xs font-mono select-none">
            <div className="text-[9px] tracking-widest text-slate-400 font-bold uppercase">SATELLITE VIEW</div>
            <div className="text-xs font-bold text-white mt-0.5">Detected Oil Spill</div>
            <div className="mt-2 space-y-1 text-[11px] text-slate-300">
              <div className="flex items-center gap-1.5">
                <span className="text-cyan-400">🛰️</span>
                <span>Sentinel-1 SAR • 12 Jan 2024, 06:14 UTC</span>
              </div>
              <div className="flex items-center gap-1.5 border-t border-white/10 pt-1 text-[10px] text-slate-400">
                <span>☁️</span>
                <span>Cloud Cover: <b className="text-white">0%</b></span>
              </div>
            </div>
          </div>

          {/* Top-Right Legend HUD */}
          <div className="absolute top-16 right-3 z-[999] bg-[#0A1224]/90 backdrop-blur-md text-white p-3 rounded-xl border border-white/15 shadow-xl max-w-[220px] font-sans select-none hidden sm:block">
            <div className="text-[11px] font-bold text-white mb-1.5">Oil Spill (SAR Detection)</div>
            <div className="mb-2">
              <div className="flex justify-between text-[9px] font-mono text-slate-300 mb-0.5">
                <span>Low</span>
                <span>High</span>
              </div>
              <div
                className="w-full h-2.5 rounded shadow-inner"
                style={{
                  background: 'linear-gradient(to right, #06B6D4 0%, #10B981 25%, #FACC15 50%, #F97316 75%, #DC2626 100%)'
                }}
              />
            </div>
            <div className="space-y-1.5 text-[10px] text-slate-300">
              <div className="flex items-center gap-2">
                <div className="w-3.5 h-2.5 rounded-sm bg-[#64748B]"></div>
                <span>Detected Oil Slick (SAR)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-0.5 border-b-2 border-dashed border-[#EF4444]"></div>
                <span>Vessel Track (AIS)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 rounded-sm bg-[#EF4444] border border-white flex items-center justify-center text-[8px]">🚢</div>
                <span>Vessel (Candidate)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-0.5 border-b-2 border-dashed border-[#06B6D4]"></div>
                <span>India's Maritime Zone (200 nm)</span>
              </div>
            </div>
          </div>

          {/* Bottom Scale Bar */}
          <div className="absolute bottom-12 left-3 z-[999] flex flex-col font-mono text-[9px] text-white select-none pointer-events-none drop-shadow-md">
            <div className="flex justify-between w-36 mb-0.5 text-[9px]">
              <span>0</span>
              <span>250</span>
              <span>500</span>
              <span>750</span>
              <span>1k km</span>
            </div>
            <div className="w-36 h-1 border-b-2 border-l-2 border-r-2 border-white relative">
              <div className="absolute top-0 left-1/4 h-1 border-l border-white"></div>
              <div className="absolute top-0 left-2/4 h-1 border-l border-white"></div>
              <div className="absolute top-0 left-3/4 h-1 border-l border-white"></div>
            </div>
          </div>
        </>
      )}

      {/* Drift Mode Nautical Compass & 20 km Scale Bar (Reference Image matching) */}
      {mode === 'drift' && (
        <>
          <div className="absolute bottom-5 left-5 z-[999] flex items-end gap-3 select-none pointer-events-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.85)] font-sans text-white">
            {/* North Arrow */}
            <div className="flex flex-col items-center">
              <svg width="22" height="28" viewBox="0 0 24 32" fill="none">
                <path d="M12 2L4 26L12 20L20 26L12 2Z" fill="#FFFFFF" stroke="#0F172A" strokeWidth="1.5" />
                <path d="M12 2L4 26L12 20Z" fill="#CBD5E1" />
              </svg>
              <span className="text-[11px] font-bold tracking-widest text-white -mt-0.5">N</span>
            </div>

            {/* 20 km Scale Bar */}
            <div className="flex flex-col gap-1 pb-1">
              <span className="text-[11px] font-bold text-white font-mono">20 km</span>
              <div className="w-24 h-1.5 border-b-2 border-l-2 border-r-2 border-white relative bg-white/20 backdrop-blur-sm"></div>
            </div>
          </div>

          {/* Water Body Label: Gulf of Kutch */}
          <div className="absolute bottom-12 left-1/3 z-[999] pointer-events-none select-none text-white/90 text-sm italic font-serif tracking-widest drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)] hidden sm:block">
            Gulf of Kutch
          </div>

          {/* India EEZ text marker along dashed border */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[999] pointer-events-none select-none text-white/80 text-[10px] font-mono tracking-wider drop-shadow-[0_1px_4px_rgba(0,0,0,0.85)] hidden sm:block">
            India EEZ
          </div>
        </>
      )}

      {/* Bottom Coordinates & Google Maps Attribution Badge - only on non-compact maps and non-drift mode */}
      {!isCompactMap && mode !== 'drift' && (
        <div className={`absolute bottom-3 left-3 z-[1000] flex items-center gap-3 backdrop-blur-xl px-3 py-1.5 rounded-xl border text-[11px] font-mono shadow-lg ${
        isLightMode
          ? 'bg-white/95 text-slate-700 border-slate-300/90'
          : 'bg-[#0A1224]/85 text-slate-300 border-white/15'
      }`}>
        <span className="flex items-center gap-1">
          <span className={isLightMode ? 'text-cyan-700 font-bold' : 'text-cyan-400 font-bold'}>POS:</span>
          {cursorCoords
            ? `${cursorCoords.lat}°N, ${cursorCoords.lng}°E`
            : `${incident?.lat.toFixed(4) || '19.4182'}°N, ${incident?.lng.toFixed(4) || '71.3412'}°E`}
        </span>
        <span className={isLightMode ? 'text-slate-300' : 'text-slate-600'}>|</span>
        <span className={`flex items-center gap-1 font-semibold ${isLightMode ? 'text-emerald-700' : 'text-emerald-400'}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> {GOOGLE_TILE_SERVERS[mapType].name}
        </span>
        <span className={isLightMode ? 'text-slate-300' : 'text-slate-600'}>|</span>
        <span className={isLightMode ? 'text-slate-500' : 'text-slate-400'}>WGS84 DATUM</span>
      </div>
      )}
    </div>
  );
};
