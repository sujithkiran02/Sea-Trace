import { useState } from 'react';
import { Navigation, Clock, ShieldCheck, Zap } from 'lucide-react';



interface RouteData {
  id: string;
  name: string;
  origin: string;
  destination: string;
  transitDays: number;
  distanceNm: number;
  frequency: string;
  carbonReduction: string;
  pathD: string;
  originCoord: [number, number];
  destCoord: [number, number];
}

const CORRIDORS: RouteData[] = [
  {
    id: 'asia-europe',
    name: 'Asia-Europe Silk Express',
    origin: 'Singapore (SIN)',
    destination: 'Rotterdam (RTM)',
    transitDays: 18,
    distanceNm: 8250,
    frequency: 'Daily Sailings',
    carbonReduction: '-28% CO2e via LNG',
    pathD: 'M 720,290 Q 560,250 490,200 T 430,130',
    originCoord: [720, 290],
    destCoord: [430, 130],
  },
  {
    id: 'trans-pacific',
    name: 'Transpacific Fast Corridor',
    origin: 'Shanghai (SHA)',
    destination: 'Los Angeles (LAX)',
    transitDays: 11,
    distanceNm: 5800,
    frequency: '4x Weekly',
    carbonReduction: '-22% CO2e Optimized',
    pathD: 'M 770,220 Q 860,170 950,200',
    originCoord: [770, 220],
    destCoord: [950, 200],
  },
  {
    id: 'trans-atlantic',
    name: 'Transatlantic Bridge',
    origin: 'Rotterdam (RTM)',
    destination: 'New York (NYC)',
    transitDays: 8,
    distanceNm: 3400,
    frequency: '6x Weekly',
    carbonReduction: '-31% CO2e Bio-Methanol',
    pathD: 'M 430,130 Q 340,110 260,160',
    originCoord: [430, 130],
    destCoord: [260, 160],
  },
];

export const GlobalRoutesSection: React.FC = () => {
  const [activeRouteId, setActiveRouteId] = useState('asia-europe');
  const activeRoute = CORRIDORS.find((c) => c.id === activeRouteId) || CORRIDORS[0];

  return (
    <section id="routes" className="min-h-screen w-full py-28 px-6 sm:px-8 max-w-7xl mx-auto z-10 relative">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-12 gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-pill mb-4 border border-white/10 text-xs font-mono-code text-[#FF7A2F] uppercase">
            Global Network
          </div>
          <h2 className="font-heading font-extrabold text-3xl sm:text-5xl text-white tracking-tight mb-3">
            Arterial Shipping Corridors
          </h2>
          <p className="text-slate-300 text-base max-w-xl">
            Optimized great-circle routes updated hourly by dynamic oceanographic weather routing systems to bypass heavy swells.
          </p>
        </div>

        {/* Route Selector Tabs */}
        <div className="flex flex-wrap gap-2 glass-panel p-1.5 rounded-2xl border border-white/15">
          {CORRIDORS.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveRouteId(c.id)}
              className={`px-4 py-2 rounded-xl text-xs font-mono-code font-bold transition-all cursor-pointer ${
                activeRouteId === c.id
                  ? 'bg-gradient-to-r from-[#FF7A2F] to-[#FFC15A] text-white shadow-lg'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Main Interactive Map & Telemetry Dashboard */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-white/15 shadow-2xl overflow-hidden relative">
        {/* SVG Route Visualization */}
        <div className="relative w-full h-[340px] sm:h-[440px] bg-[#070D1A]/90 rounded-2xl border border-white/10 overflow-hidden mb-6 flex items-center justify-center">
          {/* Subtle World Map Outline Grid */}
          <svg
            viewBox="0 0 1000 500"
            className="w-full h-full object-cover opacity-80"
          >
            {/* Latitude / Longitude subtle guide lines */}
            <defs>
              <pattern id="grid" width="100" height="100" patternUnits="userSpaceOnUse">
                <path d="M 100 0 L 0 0 0 100" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
              </pattern>
              <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#FF7A2F" />
                <stop offset="50%" stopColor="#FFC15A" />
                <stop offset="100%" stopColor="#00E5FF" />
              </linearGradient>
            </defs>
            <rect width="1000" height="500" fill="url(#grid)" />

            {/* Simplified World Coastline Shapes for context */}
            <path
              d="M 150,120 Q 230,90 280,160 Q 230,220 220,320 Q 180,380 150,300 Z
                 M 400,90 Q 480,80 500,160 Q 430,200 400,180 Z
                 M 420,200 Q 510,210 520,340 Q 460,400 420,280 Z
                 M 600,100 Q 780,90 820,180 Q 780,300 700,320 Q 640,240 600,190 Z
                 M 780,330 Q 860,340 850,420 Q 770,440 760,360 Z"
              fill="rgba(255, 255, 255, 0.03)"
              stroke="rgba(255, 255, 255, 0.08)"
              strokeWidth="1.5"
            />

            {/* Inactive Corridors (Dim) */}
            {CORRIDORS.map(
              (c) =>
                c.id !== activeRouteId && (
                  <path
                    key={c.id}
                    d={c.pathD}
                    fill="none"
                    stroke="rgba(255, 255, 255, 0.15)"
                    strokeWidth="2"
                    strokeDasharray="4 6"
                  />
                )
            )}

            {/* Active Glowing Corridor Line */}
            <path
              d={activeRoute.pathD}
              fill="none"
              stroke="url(#routeGradient)"
              strokeWidth="3.5"
              strokeLinecap="round"
              className="animate-pulse"
              style={{
                strokeDasharray: '8 6',
                animationDuration: '3s',
              }}
            />

            {/* Origin Port Pin */}
            <g transform={`translate(${activeRoute.originCoord[0]}, ${activeRoute.originCoord[1]})`}>
              <circle r="12" fill="#FF7A2F" opacity="0.25" className="animate-ping" />
              <circle r="6" fill="#FF7A2F" stroke="#ffffff" strokeWidth="2" />
              <text x="12" y="4" fill="#ffffff" fontSize="12" fontFamily="'JetBrains Mono', monospace" fontWeight="600">
                {activeRoute.origin.split(' ')[0]}
              </text>
            </g>

            {/* Destination Port Pin */}
            <g transform={`translate(${activeRoute.destCoord[0]}, ${activeRoute.destCoord[1]})`}>
              <circle r="12" fill="#00E5FF" opacity="0.25" className="animate-ping" style={{ animationDuration: '2s' }} />
              <circle r="6" fill="#00E5FF" stroke="#ffffff" strokeWidth="2" />
              <text x="12" y="4" fill="#ffffff" fontSize="12" fontFamily="'JetBrains Mono', monospace" fontWeight="600">
                {activeRoute.destination.split(' ')[0]}
              </text>
            </g>
          </svg>

          {/* Floating live corridor overlay badge */}
          <div className="absolute top-4 left-4 glass-panel px-4 py-2 rounded-xl text-xs font-mono-code border border-white/10 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-white font-bold">{activeRoute.name}</span>
          </div>
        </div>

        {/* Live Route Telemetry Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="glass-panel-light p-4 rounded-xl border border-white/10">
            <div className="flex items-center gap-2 text-slate-400 text-xs font-mono-code mb-1">
              <Clock className="w-3.5 h-3.5 text-[#FF7A2F]" />
              <span>AVERAGE TRANSIT</span>
            </div>
            <p className="font-heading font-extrabold text-2xl text-white">
              {activeRoute.transitDays} <span className="text-sm font-normal text-slate-400">Days</span>
            </p>
          </div>

          <div className="glass-panel-light p-4 rounded-xl border border-white/10">
            <div className="flex items-center gap-2 text-slate-400 text-xs font-mono-code mb-1">
              <Navigation className="w-3.5 h-3.5 text-[#FFC15A]" />
              <span>NAUTICAL MILES</span>
            </div>
            <p className="font-heading font-extrabold text-2xl text-white">
              {activeRoute.distanceNm.toLocaleString()} <span className="text-sm font-normal text-slate-400">NM</span>
            </p>
          </div>

          <div className="glass-panel-light p-4 rounded-xl border border-white/10">
            <div className="flex items-center gap-2 text-slate-400 text-xs font-mono-code mb-1">
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              <span>FREQUENCY</span>
            </div>
            <p className="font-heading font-extrabold text-2xl text-white">
              {activeRoute.frequency}
            </p>
          </div>

          <div className="glass-panel-light p-4 rounded-xl border border-white/10">
            <div className="flex items-center gap-2 text-slate-400 text-xs font-mono-code mb-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>EMISSION IMPACT</span>
            </div>
            <p className="font-heading font-bold text-lg text-emerald-400">
              {activeRoute.carbonReduction}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
