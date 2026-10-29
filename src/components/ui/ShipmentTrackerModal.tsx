import { useState } from 'react';
import { X, Search, ShieldAlert, Waves } from 'lucide-react';

interface ShipmentTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTracking?: string;
}

export const ShipmentTrackerModal: React.FC<ShipmentTrackerModalProps> = ({
  isOpen,
  onClose,
  initialTracking = 'IN-2026-61C2',
}) => {
  const [trackingNumber, setTrackingNumber] = useState(initialTracking);
  const [activeTab, setActiveTab] = useState<'timeline' | 'vessel' | 'drift'>('timeline');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-xl animate-fade-in">
      <div
        className="w-full max-w-3xl rounded-3xl border border-white/20 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        style={{
          background: 'rgba(5, 10, 30, 0.95)',
          backdropFilter: 'blur(24px)',
        }}
      >
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center border border-red-500/30">
              <ShieldAlert className="w-5 h-5 text-red-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-heading font-bold text-xl text-white">
                  AIS Vessel Telemetry & Spill Attribution
                </h3>
                <span className="px-2 py-0.5 rounded text-[9px] font-mono-code font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                  CRITICAL SUSPECT LEAD
                </span>
              </div>
              <p className="text-xs font-mono-code text-slate-400">
                QUERY: {trackingNumber.toUpperCase()} • CORRELATED VESSEL: MT OCEAN PRIDE (MMSI: 419000881)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-slate-300 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 sm:px-6 border-b border-white/10 bg-black/20 flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              placeholder="Search Incident ID (e.g. IN-2026-61C2) or Vessel MMSI (419000881)..."
              className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs sm:text-sm font-mono-code text-white focus:outline-none focus:border-[#FF9933]"
            />
          </div>
          <button className="px-5 py-2 rounded-xl text-white text-xs font-mono-code font-bold cursor-pointer transition-colors bg-[#FF9933] hover:bg-[#E67E22]">
            SCAN
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Status Overview Card */}
          <div
            className="p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              borderColor: 'rgba(255, 255, 255, 0.12)',
            }}
          >
            <div>
              <span className="text-[11px] font-mono-code uppercase tracking-wider text-red-400 font-bold block mb-1">
                ● 91.4% SPATIO-TEMPORAL ATTRIBUTION MATCH
              </span>
              <p className="font-heading font-extrabold text-2xl text-white">
                MT OCEAN PRIDE (Crude Tanker)
              </p>
              <p className="text-xs text-slate-300 mt-1">
                Discharge Location: Kandla Deepwater Fairway (Lat: 22° 41' N, Lon: 69° 42' E)
              </p>
            </div>
            <div className="text-left sm:text-right">
              <span className="text-[10px] font-mono-code uppercase text-slate-400 block">
                DETECTED SLICK VOLUME
              </span>
              <span className="font-heading font-extrabold text-xl text-orange-400">
                75.0 m³ HFO
              </span>
              <span className="text-[11px] text-cyan-300 block">
                CPA: 1.4 km • Offset: -1.2 hrs
              </span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-2 border-b border-white/10 pb-2">
            <button
              onClick={() => setActiveTab('timeline')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono-code font-bold transition-colors cursor-pointer ${
                activeTab === 'timeline' ? 'bg-white/15 text-[#FFB766]' : 'text-slate-400 hover:text-white'
              }`}
            >
              AIS Transit Timeline
            </button>
            <button
              onClick={() => setActiveTab('vessel')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono-code font-bold transition-colors cursor-pointer ${
                activeTab === 'vessel' ? 'bg-white/15 text-[#FFB766]' : 'text-slate-400 hover:text-white'
              }`}
            >
              Vessel Registry & Risk Profile
            </button>
            <button
              onClick={() => setActiveTab('drift')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono-code font-bold transition-colors cursor-pointer ${
                activeTab === 'drift' ? 'bg-white/15 text-[#FFB766]' : 'text-slate-400 hover:text-white'
              }`}
            >
              Lagrangian Drift Telemetry
            </button>
          </div>

          {/* Tab 1: AIS Timeline */}
          {activeTab === 'timeline' && (
            <div className="space-y-4 pt-2">
              <div className="relative pl-6 border-l-2 border-emerald-500 space-y-6">
                <div>
                  <span className="absolute -left-2 top-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-[#050A1E]" />
                  <span className="text-[10px] font-mono-code text-emerald-400 font-bold uppercase">
                    AIS TRANSMISSION VERIFIED
                  </span>
                  <h4 className="font-bold text-sm text-white">Transiting Gulf of Kutch Inbound Traffic Separation Scheme</h4>
                  <p className="text-xs text-slate-400">
                    Course: 082° • Speed: 14.8 kts • 23/10/2026, 02:15 IST
                  </p>
                </div>

                <div className="border-l-2 border-red-500 -ml-[26px] pl-[24px]">
                  <span className="absolute -left-2 top-0 w-3.5 h-3.5 rounded-full bg-red-500 border-2 border-[#050A1E] animate-ping" />
                  <span className="text-[10px] font-mono-code text-red-400 font-bold uppercase">
                    SUSPECT DISCHARGE WINDOW (ESTIMATED)
                  </span>
                  <h4 className="font-bold text-sm text-white">Sudden Speed Drop & Track Offset</h4>
                  <p className="text-xs text-slate-300">
                    Lat: 22° 41' N, Lon: 69° 42' E • Speed dropped from 14.8 kts to 8.2 kts • 23/10/2026, 03:45 IST
                  </p>
                </div>

                <div>
                  <span className="absolute -left-2 top-0 w-3.5 h-3.5 rounded-full bg-cyan-500 border-2 border-[#050A1E]" />
                  <span className="text-[10px] font-mono-code text-cyan-400 font-bold uppercase">
                    RADAR CORRELATION
                  </span>
                  <h4 className="font-bold text-sm text-white">Sentinel-1 SAR Overpass Detected Dark Formation</h4>
                  <p className="text-xs text-slate-400">
                    Slick centroid 1.4 km from vessel track at estimated release timestamp • 23/10/2026, 06:12 IST
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Vessel Profile */}
          {activeTab === 'vessel' && (
            <div className="grid grid-cols-2 gap-4 text-xs font-mono-code pt-2">
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
                <span className="text-slate-400 uppercase text-[10px] block">Vessel Identification</span>
                <div className="text-white font-bold text-sm">MT OCEAN PRIDE</div>
                <div className="text-slate-300">IMO: 9384712 • MMSI: 419000881</div>
                <div className="text-slate-300">Callsign: 9V2918 • Flag: Marshall Islands</div>
                <div className="text-slate-300">Vessel Type: Crude Oil Tanker (Aframax)</div>
              </div>
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
                <span className="text-slate-400 uppercase text-[10px] block">Environmental Compliance</span>
                <div className="text-amber-400 font-bold">Risk Level: HIGH PRIORITY LEAD</div>
                <div className="text-slate-300">IOPP Certificate: Valid until 2027</div>
                <div className="text-slate-300">Last PSC Inspection: 3 Deficiencies (Singapore, 2025)</div>
                <div className="text-slate-300">Cargo Onboard: 82,000 MT Basrah Light Crude</div>
              </div>
            </div>
          )}

          {/* Tab 3: Drift Telemetry */}
          {activeTab === 'drift' && (
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3 text-xs font-mono-code">
              <div className="flex items-center gap-2 text-cyan-300 font-bold">
                <Waves className="w-4 h-4" />
                <span>INCOIS 4D Hydrodynamic Model Ingestion</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <div className="p-2 rounded-lg bg-black/30">
                  <span className="text-[10px] text-slate-400 block">Surface Current</span>
                  <span className="text-white font-bold">0.62 m/s @ 074°</span>
                </div>
                <div className="p-2 rounded-lg bg-black/30">
                  <span className="text-[10px] text-slate-400 block">Wind Velocity</span>
                  <span className="text-white font-bold">14.2 kts @ 255°</span>
                </div>
                <div className="p-2 rounded-lg bg-black/30">
                  <span className="text-[10px] text-slate-400 block">Stokes Wave Drift</span>
                  <span className="text-white font-bold">0.08 m/s @ 068°</span>
                </div>
                <div className="p-2 rounded-lg bg-black/30">
                  <span className="text-[10px] text-slate-400 block">Reverse Drift Error</span>
                  <span className="text-emerald-400 font-bold">± 420 meters</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
