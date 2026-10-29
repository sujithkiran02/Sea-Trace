import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import type { Incident } from '../../types/seatrace';

interface SatelliteHeatmapMapProps {
  incident?: Incident | null;
  onSelectIncident?: (inc: Incident) => void;
  height?: string;
  theme?: 'dark' | 'light';
  className?: string;
}

// 200 nm Maritime Exclusive Economic Zone (EEZ) Coordinates
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

const STRATEGIC_PORTS = [
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

const GEOGRAPHY_LABELS = [
  { name: 'INDIA', lat: 21.8, lng: 78.5, className: 'geo-label-india' },
  { name: 'PAKISTAN', lat: 28.0, lng: 68.2, className: 'geo-label-country' },
  { name: 'NEPAL', lat: 28.6, lng: 84.2, className: 'geo-label-country' },
  { name: 'CHINA', lat: 32.0, lng: 88.5, className: 'geo-label-country' },
  { name: 'BANGLADESH', lat: 24.0, lng: 90.2, className: 'geo-label-country' },
  { name: 'MYANMAR\n(THAILAND)', lat: 20.8, lng: 95.8, className: 'geo-label-country' },
  { name: 'SRI LANKA', lat: 7.8, lng: 80.8, className: 'geo-label-country' },
  { name: 'ARABIAN SEA', lat: 16.2, lng: 64.2, className: 'geo-label-sea' },
  { name: 'BAY OF\nBENGAL', lat: 14.8, lng: 88.8, className: 'geo-label-sea' },
  { name: 'INDIAN OCEAN', lat: 4.2, lng: 76.2, className: 'geo-label-ocean' },
  { name: 'Lakshadweep\nIslands', lat: 10.5, lng: 72.8, className: 'geo-label-island' },
  { name: 'Andaman &\nNicobar Islands', lat: 11.5, lng: 93.2, className: 'geo-label-island' }
];

export const SatelliteHeatmapMap: React.FC<SatelliteHeatmapMapProps> = ({
  incident,
  onSelectIncident,
  height = '620px',
  theme,
  className = ''
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const [selectedVessel, setSelectedVessel] = useState(true);

  // Auto-detect theme
  const [isLightMode, setIsLightMode] = useState<boolean>(() => {
    if (theme) return theme === 'light';
    return typeof document !== 'undefined' && document.documentElement.classList.contains('light-theme');
  });

  useEffect(() => {
    if (theme) {
      setIsLightMode(theme === 'light');
    }
  }, [theme]);

  // Center on Arabian Sea / Indian Subcontinent
  const spillLat = incident?.lat || 19.45;
  const spillLng = incident?.lng || 71.35;

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    // Centered to view full India maritime zone as in the reference image
    const map = L.map(containerRef.current, {
      center: [17.5, 78.5],
      zoom: 5,
      zoomControl: false,
      attributionControl: false,
      minZoom: 4,
      maxZoom: 16
    });

    // High resolution Google Pure Satellite Tile Server
    L.tileLayer('https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
      maxZoom: 18,
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
    }).addTo(map);

    // Zoom controls at bottom-right
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    const layerGroup = L.layerGroup().addTo(map);

    // 1. Draw India's 200 nm Maritime Zone (EEZ)
    const eezOptions: L.PolylineOptions = {
      color: '#06B6D4',
      weight: 2,
      opacity: 0.95,
      dashArray: '8, 8',
      lineCap: 'round'
    };

    L.polyline(INDIA_EEZ_WEST, eezOptions).addTo(layerGroup);
    L.polyline(INDIA_EEZ_EAST, eezOptions).addTo(layerGroup);
    L.polygon(LAKSHADWEEP_EEZ, { ...eezOptions, fill: false }).addTo(layerGroup);
    L.polygon(ANDAMAN_EEZ, { ...eezOptions, fill: false }).addTo(layerGroup);

    // 2. Draw Strategic Ports
    STRATEGIC_PORTS.forEach((port) => {
      const portIcon = L.divIcon({
        className: 'satellite-port-marker',
        html: `
          <div style="display:flex; align-items:center; gap:5px; pointer-events:auto; cursor:pointer;">
            <div style="width:7px; height:7px; border-radius:50%; background:#FFFFFF; box-shadow:0 0 6px rgba(255,255,255,0.9), 0 0 2px #000;"></div>
            <span style="font-family:'Inter', sans-serif; font-size:11px; font-weight:600; color:#FFFFFF; text-shadow:0 1px 4px rgba(0,0,0,0.9), 0 0 2px #000; white-space:nowrap;">
              ${port.name}
            </span>
          </div>
        `,
        iconSize: [120, 20],
        iconAnchor: [3, 10]
      });

      L.marker([port.lat, port.lng], { icon: portIcon })
        .addTo(layerGroup)
        .bindPopup(`
          <div style="font-family:'JetBrains Mono', monospace; font-size:12px; color:#0F172A;">
            <b style="color:#0284C7; font-size:13px;">⚓ ${port.name} Port</b><br/>
            <span>Coords: ${port.lat.toFixed(2)}°N, ${port.lng.toFixed(2)}°E</span><br/>
            <span style="color:#10B981; font-weight:bold;">● Indian Major Port (Sagarmala Corridor)</span>
          </div>
        `);
    });

    // 3. Draw Geographic Country & Ocean Labels
    GEOGRAPHY_LABELS.forEach((geo) => {
      const isIndia = geo.className.includes('india');
      const isSea = geo.className.includes('sea') || geo.className.includes('ocean');
      const isIsland = geo.className.includes('island');

      const geoIcon = L.divIcon({
        className: 'satellite-geo-label',
        html: `
          <div style="
            text-align: center;
            white-space: pre-line;
            pointer-events: none;
            user-select: none;
            font-family: ${isSea ? "'Cinzel', 'Trajan Pro', Georgia, serif" : "'Inter', sans-serif"};
            font-weight: ${isIndia ? '800' : isSea ? '600' : '700'};
            font-size: ${isIndia ? '22px' : isSea ? '14px' : isIsland ? '11px' : '10px'};
            letter-spacing: ${isIndia ? '3px' : isSea ? '3px' : '1.5px'};
            font-style: ${isSea ? 'italic' : 'normal'};
            color: ${isSea ? '#67E8F9' : '#FFFFFF'};
            opacity: ${isSea ? '0.85' : '0.92'};
            text-shadow: 0 2px 8px rgba(0,0,0,0.95), 0 0 3px rgba(0,0,0,0.9);
          ">
            ${geo.name}
          </div>
        `,
        iconSize: [160, 40],
        iconAnchor: [80, 20]
      });

      L.marker([geo.lat, geo.lng], { icon: geoIcon, interactive: false }).addTo(layerGroup);
    });

    // 4. Generate Multi-Spectral SAR Spill Heatmap (Cyan -> Emerald -> Yellow -> Orange -> Crimson Core)
    const N = 40;
    const driftAngle = (220 * Math.PI) / 180; // 220° SW Arabian Sea drift

    const heatTiers = [
      { scale: 1.0, color: '#06B6D4', stroke: '#0891B2', fillOpacity: 0.38, name: 'Low' },
      { scale: 0.78, color: '#10B981', stroke: '#059669', fillOpacity: 0.52, name: 'Moderate' },
      { scale: 0.58, color: '#FACC15', stroke: '#EAB308', fillOpacity: 0.68, name: 'Medium' },
      { scale: 0.40, color: '#F97316', stroke: '#EA580C', fillOpacity: 0.84, name: 'High' },
      { scale: 0.22, color: '#DC2626', stroke: '#991B1B', fillOpacity: 0.96, name: 'Maximum' }
    ];

    const majorSpan = 0.85; // Wide visible footprint across Arabian Sea view
    const minorSpan = 0.38;

    heatTiers.forEach((tier) => {
      const tierPoints: [number, number][] = [];
      const tierMajor = majorSpan * tier.scale;
      const tierMinor = minorSpan * tier.scale;
      const offsetFactor = (1 - tier.scale) * 0.22;
      const coreLat = spillLat - Math.cos(driftAngle) * offsetFactor;
      const coreLng = spillLng - Math.sin(driftAngle) * offsetFactor;

      for (let i = 0; i <= N; i++) {
        const theta = (i / N) * 2 * Math.PI;
        const align = Math.cos(theta - driftAngle);
        const stretch = 1.0 + 1.25 * align;
        const ripple = 0.14 * Math.sin(3 * theta + 1.2) + 0.10 * Math.cos(5 * theta - 0.7);
        const r = (1 + ripple) * stretch;

        const pLat = coreLat + r * tierMajor * Math.sin(theta);
        const pLng = coreLng + r * tierMinor * Math.cos(theta);
        tierPoints.push([pLat, pLng]);
      }

      const poly = L.polygon(tierPoints, {
        color: tier.stroke,
        weight: 1.2,
        opacity: 0.9,
        fillColor: tier.color,
        fillOpacity: tier.fillOpacity
      })
        .addTo(layerGroup)
        .bindPopup(`
          <div style="font-family:'JetBrains Mono', monospace; font-size:12px; color:#0F172A; min-width:210px;">
            <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
              <b style="color:${tier.color}; font-size:13px;">🔥 SAR Detection Tier: ${tier.name}</b>
            </div>
            <span>Satellite: <b>Sentinel-1 C-SAR</b></span><br/>
            <span>Timestamp: <b>12 Jan 2024, 06:14 UTC</b></span><br/>
            <span>Cloud Cover: <b>0% (SAR Radar Penetrating)</b></span><br/>
            <span>Estimated Area: <b>28.4 km²</b></span><br/>
            <span>Max Oil Thickness: <b>&gt; 200 µm (Heavy Crude Core)</b></span>
          </div>
        `);

      if (incident && onSelectIncident) {
        poly.on('click', () => onSelectIncident(incident));
      }
    });

    // 5. Silvery/Grey Trailing Sheen Wake extending towards candidate vessel
    const sheenWakePoints: [number, number][] = [
      [spillLat, spillLng],
      [spillLat - 0.45, spillLng - 0.35],
      [spillLat - 1.10, spillLng - 0.85],
      [spillLat - 1.85, spillLng - 1.45],
      [spillLat - 1.95, spillLng - 1.60],
      [spillLat - 1.05, spillLng - 0.75],
      [spillLat - 0.35, spillLng - 0.20],
      [spillLat, spillLng]
    ];

    L.polygon(sheenWakePoints, {
      color: '#94A3B8',
      weight: 1,
      opacity: 0.6,
      fillColor: '#64748B',
      fillOpacity: 0.32,
      dashArray: '4, 4'
    }).addTo(layerGroup);

    // 6. Suspect Candidate Vessel & AIS Track (Red Dashed Line)
    const vesselLat = 17.55;
    const vesselLng = 68.85;

    // Red dashed vessel track (AIS)
    const aisTrack: [number, number][] = [
      [spillLat, spillLng],
      [18.9, 70.3],
      [18.2, 69.5],
      [vesselLat, vesselLng],
      [16.8, 68.2],
      [15.8, 67.5]
    ];

    L.polyline(aisTrack, {
      color: '#EF4444',
      weight: 2.5,
      opacity: 0.95,
      dashArray: '7, 6'
    }).addTo(layerGroup);

    // Candidate Vessel Icon
    const vesselMarkerIcon = L.divIcon({
      className: 'candidate-vessel-marker',
      html: `
        <div style="position:relative; display:flex; flex-direction:column; align-items:center; cursor:pointer;">
          <div style="position:absolute; width:30px; height:30px; border-radius:50%; background:rgba(239,68,68,0.4); animation:ping 1.8s infinite;"></div>
          <div style="width:26px; height:26px; border-radius:6px; background:#EF4444; border:2px solid #FFFFFF; display:flex; align-items:center; justify-content:center; box-shadow:0 0 10px #EF4444; transform:rotate(-45deg);">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#FFFFFF">
              <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/>
            </svg>
          </div>
        </div>
      `,
      iconSize: [30, 30],
      iconAnchor: [15, 15]
    });

    const vMarker = L.marker([vesselLat, vesselLng], { icon: vesselMarkerIcon }).addTo(layerGroup);
    vMarker.on('click', () => setSelectedVessel((prev) => !prev));

    // Other Shipping Lane Vessels (South of Sri Lanka / Indian Ocean / Bay of Bengal)
    const otherVessels: [number, number][] = [
      [5.8, 80.5],
      [6.5, 88.2],
      [8.2, 92.5]
    ];

    otherVessels.forEach((pos) => {
      const shipIcon = L.divIcon({
        className: 'patrol-vessel-marker',
        html: `
          <div style="width:16px; height:16px; border-radius:4px; background:#EF4444; border:1.5px solid #FFFFFF; display:flex; align-items:center; justify-content:center; box-shadow:0 0 6px #EF4444; transform:rotate(90deg);">
            <svg width="9" height="9" viewBox="0 0 24 24" fill="#FFFFFF">
              <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/>
            </svg>
          </div>
        `,
        iconSize: [16, 16],
        iconAnchor: [8, 8]
      });

      L.marker(pos, { icon: shipIcon }).addTo(layerGroup);
    });

    mapRef.current = map;

    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      clearTimeout(timer);
      map.remove();
      mapRef.current = null;
    };
  }, [spillLat, spillLng, incident, onSelectIncident]);

  return (
    <div
      className={`relative w-full rounded-2xl overflow-hidden border transition-all ${
        isLightMode
          ? 'border-[#DCE4EE] shadow-lg bg-[#0F172A]'
          : 'border-white/15 shadow-2xl bg-[#030712]'
      } ${className}`}
    >
      {/* 1. Top-Left HUD Card: SATELLITE VIEW Detected Oil Spill */}
      <div className="absolute top-4 left-4 z-[1000] bg-[#0A1224]/90 backdrop-blur-md text-white p-3.5 rounded-xl border border-white/15 shadow-2xl max-w-xs font-mono select-none">
        <div className="text-[10px] tracking-widest text-slate-400 font-bold uppercase">SATELLITE VIEW</div>
        <div className="text-sm font-bold text-white mt-0.5">Detected Oil Spill</div>
        <div className="mt-2.5 space-y-1.5 text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <span className="text-cyan-400 text-sm">🛰️</span>
            <div>
              <div className="font-semibold text-white">Sentinel-1 SAR</div>
              <div className="text-[10px] text-slate-400">12 Jan 2024, 06:14 UTC</div>
            </div>
          </div>
          <div className="flex items-center gap-2 pt-1 border-t border-white/10">
            <span className="text-slate-400 text-sm">☁️</span>
            <div className="text-[11px] text-slate-300">
              Cloud Cover: <b className="text-white">0%</b>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Top-Right HUD Card: Oil Spill (SAR Detection) Gradient & Legend */}
      <div className="absolute top-4 right-4 z-[1000] bg-[#0A1224]/90 backdrop-blur-md text-white p-4 rounded-xl border border-white/15 shadow-2xl max-w-sm font-sans select-none">
        <div className="text-xs font-bold text-white mb-2">Oil Spill (SAR Detection)</div>

        {/* Multi-spectral Color Ramp */}
        <div className="mb-3">
          <div className="flex justify-between text-[10px] font-mono text-slate-300 mb-1">
            <span>Low</span>
            <span>High</span>
          </div>
          <div
            className="w-full h-3 rounded-md shadow-inner border border-white/20"
            style={{
              background: 'linear-gradient(to right, #06B6D4 0%, #10B981 25%, #FACC15 50%, #F97316 75%, #DC2626 100%)'
            }}
          />
        </div>

        {/* Legend Items */}
        <div className="space-y-2 text-xs text-slate-300">
          <div className="flex items-center gap-2.5">
            <div className="w-4 h-3 rounded-sm bg-[#64748B] border border-slate-400"></div>
            <span>Detected Oil Slick (SAR)</span>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="w-5 h-0.5 border-b-2 border-dashed border-[#EF4444]"></div>
            <span>Vessel Track (AIS)</span>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="w-4 h-4 rounded-sm bg-[#EF4444] border border-white flex items-center justify-center">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="#FFFFFF">
                <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z" />
              </svg>
            </div>
            <span>Vessel (Candidate)</span>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="w-5 h-0.5 border-b-2 border-dashed border-[#06B6D4]"></div>
            <span className="text-[11px] leading-tight">
              India's Maritime Zone<br />
              <span className="text-[10px] text-slate-400">(Up to 370 km / 200 nm)</span>
            </span>
          </div>
        </div>
      </div>

      {/* 3. Suspect Vessel Candidate Callout Box (Positioned near vessel in Arabian Sea) */}
      {selectedVessel && (
        <div className="absolute top-[52%] left-[10%] sm:left-[13%] z-[1000] bg-[#0A1224]/92 backdrop-blur-md text-white p-3 rounded-xl border border-white/20 shadow-2xl font-mono text-xs select-none max-w-[210px]">
          <div className="flex items-center justify-between mb-1.5 pb-1 border-b border-white/10">
            <b className="text-white font-bold flex items-center gap-1.5 text-[11px]">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
              Vessel (Candidate)
            </b>
            <button
              onClick={() => setSelectedVessel(false)}
              className="text-slate-400 hover:text-white text-xs leading-none"
            >
              ✕
            </button>
          </div>
          <div className="space-y-0.5 text-[11px] text-slate-300">
            <div>MMSI: <b className="text-white">419XXXXXX</b></div>
            <div>Type: <b className="text-white">Oil Tanker</b></div>
            <div>Speed: <b className="text-amber-400">12.4 kn</b></div>
            <div>Time: <span className="text-slate-400">12 Jan 2024, 02:16 UTC</span></div>
          </div>
        </div>
      )}

      {/* 4. Bottom-Left Scale Bar */}
      <div className="absolute bottom-4 left-4 z-[1000] flex flex-col font-mono text-[10px] text-white select-none pointer-events-none drop-shadow-md">
        <div className="flex justify-between w-48 mb-0.5 text-[10px]">
          <span>0</span>
          <span>250</span>
          <span>500</span>
          <span>750</span>
          <span>1,000 km</span>
        </div>
        <div className="w-48 h-1.5 border-b-2 border-l-2 border-r-2 border-white relative">
          <div className="absolute top-0 left-1/4 h-1.5 border-l border-white"></div>
          <div className="absolute top-0 left-2/4 h-1.5 border-l border-white"></div>
          <div className="absolute top-0 left-3/4 h-1.5 border-l border-white"></div>
        </div>
      </div>

      {/* Map Canvas */}
      <div ref={containerRef} style={{ width: '100%', height }} className="z-0" />
    </div>
  );
};
