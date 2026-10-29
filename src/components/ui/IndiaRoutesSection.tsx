import { useState } from 'react';
import { INDIAN_PORTS, type IndianPort } from '../../constants/indianPorts';

import {
  OFFICIAL_SURVEY_OF_INDIA_PATH,
  ISLANDS_PATH,
  MARITIME_ROUTES,
} from '../../constants/indiaMapData';
import { Navigation, ShieldCheck } from 'lucide-react';
import { SeaTraceMap } from '../map/SeaTraceMap';

export const IndiaRoutesSection: React.FC = () => {
  const [activeRouteId, setActiveRouteId] = useState('peninsular-trunk');
  const [selectedPort, setSelectedPort] = useState<IndianPort | null>(INDIAN_PORTS[9]); // Chennai default
  const [mapMode, setMapMode] = useState<'google' | 'svg'>('google');

  const activeRoute = MARITIME_ROUTES.find((r) => r.id === activeRouteId) || MARITIME_ROUTES[0];

  return (
    <section id="routes" className="w-full py-28 px-6 sm:px-8 max-w-7xl mx-auto z-20 relative">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-12 gap-6">
        <div>
          <div
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-3 border text-xs font-mono-code text-[#FF9933] uppercase"
            style={{
              background: 'rgba(255, 153, 51, 0.1)',
              borderColor: 'rgba(255, 153, 51, 0.3)',
            }}
          >
            <span>EEZ Surveillance Sectors & Tanker Corridors</span>
          </div>
          <h2 className="font-heading font-extrabold text-3xl sm:text-5xl text-white tracking-tight mb-3">
            Active Radar Coverage Across 7,500 km Coastline
          </h2>
          <p className="text-slate-300 text-base max-w-xl leading-relaxed">
            Real-time Sentinel-1 SAR orbital sweeps and live AIS vessel traffic management across India's critical maritime corridors: Gulf of Kutch tanker fairway, Mumbai High offshore sector, and Bay of Bengal transit lanes.
          </p>
        </div>

        {/* Survey of India Official Compliance Badge */}
        <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-xs font-mono-code text-emerald-300 shadow-lg">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <div>
            <span className="font-bold block">OFFICIAL SURVEY OF INDIA BOUNDARY</span>
            <span className="text-[10px] text-emerald-400/80">
              Includes full territories of Jammu & Kashmir, Ladakh, and Arunachal Pradesh
            </span>
          </div>
        </div>
      </div>

      {/* Route Switcher Tabs & Google Maps Mode Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex flex-wrap gap-2 p-1.5 rounded-2xl border border-white/10 bg-white/5">
          {MARITIME_ROUTES.map((route) => (
            <button
              key={route.id}
              onClick={() => setActiveRouteId(route.id)}
              className={`px-4 py-2 rounded-xl text-xs font-mono-code font-bold transition-all cursor-pointer ${
                activeRouteId === route.id
                  ? 'bg-gradient-to-r from-[#FF9933] to-[#FFB766] text-white shadow-lg shadow-[#FF9933]/30'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              {route.name}
            </button>
          ))}
        </div>

        {/* Google Maps vs Vector Toggle */}
        <div className="flex items-center gap-1.5 bg-[#0A1224]/90 backdrop-blur-xl p-1.5 rounded-2xl border border-cyan-500/30 font-mono text-xs shadow-xl self-start sm:self-auto">
          <button
            onClick={() => setMapMode('google')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
              mapMode === 'google'
                ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/20'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <span>🛰️</span> Google Maps Live
          </button>
          <button
            onClick={() => setMapMode('svg')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
              mapMode === 'svg'
                ? 'bg-gradient-to-r from-[#FF9933] to-[#FFB766] text-white shadow-lg'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <span>🇮🇳</span> Sovereign Vector
          </button>
        </div>
      </div>

      {/* Main Map & Interactive Port Inspector Card */}
      <div
        className="rounded-3xl p-6 sm:p-8 border overflow-hidden relative shadow-2xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center"
        style={{
          background: 'rgba(5, 10, 30, 0.75)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderColor: 'rgba(255, 255, 255, 0.15)',
        }}
      >
        {/* Left Column: Official Survey of India SVG Map or Live Google Maps */}
        <div className="lg:col-span-8 relative w-full h-[520px] sm:h-[620px] rounded-2xl overflow-hidden bg-[#040816] border border-white/10 flex items-center justify-center p-2">
          {mapMode === 'google' ? (
            <div className="w-full h-full">
              <SeaTraceMap
                incident={{
                  id: 'IN-COASTAL-EXIM',
                  title: 'Peninsular India Major Ports Corridor Surveillance',
                  region: 'Arabian Sea & Bay of Bengal',
                  status: 'VESSEL_ANALYSIS',
                  severity: 'LOW',
                  lat: 16.5,
                  lng: 78.5,
                  detection_time: new Date().toISOString(),
                  source: 'Google Satellite & Coastal AIS Radar',
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                }}
                height="600px"
                defaultMapType="google_hybrid"
                initialCenter={[16.5, 78.5]}
                initialZoom={5}
                enableLiveTracking={true}
                ports={INDIAN_PORTS}
                onSelectPort={setSelectedPort}
                vessels={[
                  {
                    id: 'VES-BHARAT-1',
                    incident_id: 'IN-COASTAL-EXIM',
                    mmsi: '419001420',
                    vessel_name: 'MV BHARAT TARANG',
                    vessel_type: 'Container Ship (ULCV)',
                    flag: 'India 🇮🇳',
                    cpa_distance_km: 1.4,
                    time_offset_hours: 0,
                    compatibility_score: 95,
                    risk_level: 'MODERATE',
                    speed_knots: 19.4,
                    course_deg: 165
                  },
                  {
                    id: 'VES-SAGAR-2',
                    incident_id: 'IN-COASTAL-EXIM',
                    mmsi: '419000881',
                    vessel_name: 'MT OCEAN PRIDE',
                    vessel_type: 'Crude Oil Tanker',
                    flag: 'India 🇮🇳',
                    cpa_distance_km: 4.2,
                    time_offset_hours: -1.2,
                    compatibility_score: 88,
                    risk_level: 'ELEVATED',
                    speed_knots: 14.2,
                    course_deg: 320
                  },
                  {
                    id: 'VES-KAVERI-3',
                    incident_id: 'IN-COASTAL-EXIM',
                    mmsi: '419002340',
                    vessel_name: 'MV CHENNAI EXPRESS',
                    vessel_type: 'Feeder Container Ship',
                    flag: 'India 🇮🇳',
                    cpa_distance_km: 8.5,
                    time_offset_hours: 2.1,
                    compatibility_score: 72,
                    risk_level: 'MODERATE',
                    speed_knots: 16.8,
                    course_deg: 45
                  }
                ]}
              />
            </div>
          ) : (
            <>
              {/* SVG Map Container */}
              <svg
                viewBox="0 0 800 920"
                className="w-full h-full object-contain"
                aria-label="Official Survey of India Map with Maritime Routes and Ports"
              >
            <defs>
              <linearGradient id="indiaLandGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0B162C" />
                <stop offset="50%" stopColor="#0D1E3A" />
                <stop offset="100%" stopColor="#10264A" />
              </linearGradient>

              <linearGradient id="activeRouteArc" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FF9933" />
                <stop offset="50%" stopColor="#FFC15A" />
                <stop offset="100%" stopColor="#6FD3FF" />
              </linearGradient>

              {/* Coastal Water Contour */}
              <filter id="waterGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Ocean Grid Background */}
            <pattern id="seaGrid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(111, 211, 255, 0.03)" strokeWidth="1" />
            </pattern>
            <rect width="800" height="920" fill="url(#seaGrid)" />

            {/* Official Sovereign Indian Landmass */}
            <path
              d={OFFICIAL_SURVEY_OF_INDIA_PATH}
              fill="url(#indiaLandGradient)"
              stroke="#FF9933"
              strokeWidth="2.2"
              strokeLinejoin="round"
              strokeLinecap="round"
              opacity="0.95"
            />

            {/* Lakshadweep and Andaman & Nicobar Islands */}
            <path
              d={ISLANDS_PATH}
              fill="#FF9933"
              opacity="0.8"
            />

            {/* Inactive Route Arcs (Subtle Dashed Lines) */}
            {MARITIME_ROUTES.map(
              (r) =>
                r.id !== activeRouteId && (
                  <path
                    key={r.id}
                    d={r.svgPath}
                    fill="none"
                    stroke="rgba(255, 255, 255, 0.18)"
                    strokeWidth="2"
                    strokeDasharray="4 6"
                  />
                )
            )}

            {/* Active Glowing Animated Maritime Arc */}
            <path
              d={activeRoute.svgPath}
              fill="none"
              stroke="url(#activeRouteArc)"
              strokeWidth="4"
              strokeLinecap="round"
              filter="url(#waterGlow)"
              style={{
                strokeDasharray: '8 6',
                animation: 'pulseArc 2.5s linear infinite',
              }}
            />

            {/* Indian Ports Pins */}
            {INDIAN_PORTS.map((port) => {
              const isSelected = selectedPort?.id === port.id;
              const isPortInActiveRoute = activeRoute.portsIncluded.some((pName) =>
                port.name.toLowerCase().includes(pName.toLowerCase())
              );

              return (
                <g
                  key={port.id}
                  transform={`translate(${port.svgCoord[0]}, ${port.svgCoord[1]})`}
                  className="cursor-pointer group"
                  onClick={() => setSelectedPort(port)}
                >
                  {/* Ping Animation on Selected Port */}
                  {isSelected && (
                    <circle r="14" fill="#FF9933" opacity="0.3" className="animate-ping" />
                  )}

                  {/* Port Node */}
                  <circle
                    r={isSelected ? '6.5' : isPortInActiveRoute ? '5.5' : '4'}
                    fill={isSelected ? '#FF9933' : isPortInActiveRoute ? '#FFC15A' : '#6FD3FF'}
                    stroke="#050A1E"
                    strokeWidth="1.8"
                    className="transition-all group-hover:scale-125"
                  />

                  {/* UN/LOCODE Label */}
                  <text
                    x="8"
                    y="3"
                    fill={isSelected ? '#FF9933' : '#F5EFE6'}
                    fontSize="9.5"
                    fontFamily="'JetBrains Mono', monospace"
                    fontWeight={isSelected ? '700' : '500'}
                    className="select-none pointer-events-none drop-shadow-md"
                  >
                    {port.unLocode}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Floating Watermark & Territory Legend */}
          <div className="absolute top-4 left-4 p-3 rounded-xl bg-[#050A1E]/80 backdrop-blur-md border border-white/10 text-[10px] font-mono-code text-slate-300 space-y-1">
            <div className="flex items-center gap-1.5 text-white font-bold">
              <span className="w-2 h-2 rounded-full bg-[#FF9933]" />
              <span>Official Indian Sovereign Waters</span>
            </div>
            <p className="text-slate-400">12 Major Ports • 7,500 km Coastline</p>
          </div>
          </>
          )}
        </div>

        {/* Right Column: Selected Port Detail & Route Specs Card */}
        <div className="lg:col-span-4 flex flex-col justify-between h-full space-y-6">
          {/* Port Card */}
          {selectedPort && (
            <div
              className="p-6 rounded-2xl border"
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                borderColor: 'rgba(255, 153, 51, 0.35)',
              }}
            >
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
                <span className="px-2.5 py-0.5 rounded text-[10px] font-mono-code font-bold bg-[#FF9933]/20 text-[#FF9933] border border-[#FF9933]/30">
                  {selectedPort.unLocode}
                </span>
                <span className="text-[11px] font-mono-code text-slate-400">
                  {selectedPort.coast.toUpperCase()} COAST
                </span>
              </div>

              <h3 className="font-heading font-extrabold text-2xl text-white mb-1">
                {selectedPort.name}
              </h3>
              <p className="text-xs font-mono-code text-[#FFC15A] mb-3">
                {selectedPort.state}, India
              </p>

              <p className="text-xs text-slate-300 leading-relaxed mb-4">
                {selectedPort.description}
              </p>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono-code pt-3 border-t border-white/10">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Classification</span>
                  <span className="text-white font-bold">
                    {selectedPort.isMajor ? 'Major Central Port' : 'Commercial Gateway'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Coordinates</span>
                  <span className="text-white font-bold">
                    {selectedPort.latitude.toFixed(2)}°N, {selectedPort.longitude.toFixed(2)}°E
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Active Route Telemetry */}
          <div
            className="p-6 rounded-2xl border space-y-4"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              borderColor: 'rgba(255, 255, 255, 0.12)',
            }}
          >
            <div className="flex items-center gap-2 text-[#FF9933] text-xs font-mono-code font-bold uppercase">
              <Navigation className="w-3.5 h-3.5" />
              <span>SELECTED CORRIDOR</span>
            </div>

            <h4 className="font-heading font-bold text-lg text-white">
              {activeRoute.name}
            </h4>

            <div className="space-y-2 text-xs font-mono-code">
              <div className="flex justify-between pb-1.5 border-b border-white/10">
                <span className="text-slate-400">Transit Duration</span>
                <span className="text-white font-bold">{activeRoute.transitDays} Days</span>
              </div>
              <div className="flex justify-between pb-1.5 border-b border-white/10">
                <span className="text-slate-400">Frequency</span>
                <span className="text-emerald-400 font-bold">{activeRoute.frequency}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Ports Covered</span>
                <span className="text-[#FFC15A] font-bold">
                  {activeRoute.portsIncluded.length} Hubs
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
