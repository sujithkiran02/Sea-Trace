import { ShieldAlert } from 'lucide-react';

export const ShipStatusCard: React.FC = () => {
  return (
    <div
      id="ship-status-card"
      className="p-4 sm:p-5 rounded-2xl w-full sm:w-88 pointer-events-auto transition-all"
      style={{
        background: 'rgba(255, 255, 255, 0.08)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.16)',
        boxShadow: '0 20px 40px -15px rgba(5, 10, 30, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.25)',
      }}
    >
      {/* Header with Vessel Lead Status */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-red-400 animate-pulse" />
          <div>
            <span className="text-xs font-mono-code font-bold uppercase tracking-wider text-white block">
              MT OCEAN PRIDE
            </span>
            <span className="text-[9px] font-mono-code text-cyan-300">
              MMSI: 419000881 • CRUDE TANKER
            </span>
          </div>
        </div>
        <div className="text-right">
          <span className="px-2 py-0.5 rounded text-[9px] font-mono-code font-bold bg-red-500/20 text-red-400 border border-red-500/30 block mb-0.5">
            CRITICAL LEAD
          </span>
          <span className="text-[9px] font-mono-code text-emerald-400 font-semibold">
            91.4% MATCH
          </span>
        </div>
      </div>

      {/* Spill Trajectory Correlation & Match Score */}
      <div className="space-y-2 mb-3">
        <div className="flex justify-between text-[11px] font-mono-code text-slate-300">
          <span className="text-white font-semibold">Kandla Deepwater Fairway</span>
          <span className="text-orange-400 font-semibold">CPA: 1.4 km</span>
        </div>

        {/* Thin Animated Gradient Attribution Score Bar */}
        <div className="relative w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div
            className="absolute top-0 left-0 h-full rounded-full animate-pulse"
            style={{
              width: '91.4%',
              background: 'linear-gradient(90deg, #EF4444 0%, #F59E0B 60%, #06B6D4 100%)',
            }}
          />
        </div>

        <div className="flex justify-between text-[10px] font-mono-code text-slate-400">
          <span>Incident: IN-2026-61C2</span>
          <span className="text-cyan-300 font-semibold">Time Offset: -1.2h</span>
        </div>
      </div>

      {/* Live Vessel Telemetry */}
      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10 text-xs font-mono-code">
        <div>
          <span className="text-[10px] text-slate-400 block uppercase">Tracking Speed</span>
          <span className="text-slate-100 font-bold">14.2 kts • 320°</span>
        </div>
        <div>
          <span className="text-[10px] text-slate-400 block uppercase">Slick Volume</span>
          <span className="text-orange-400 font-bold">75.0 m³ HFO</span>
        </div>
      </div>
    </div>
  );
};
