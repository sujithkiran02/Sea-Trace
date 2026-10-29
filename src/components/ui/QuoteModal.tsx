import { useState } from 'react';
import { X, ShieldAlert, CheckCircle2, Waves, Radio } from 'lucide-react';
import confetti from 'canvas-confetti';
import { INDIAN_PORTS } from '../../constants/indianPorts';

interface QuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QuoteModal: React.FC<QuoteModalProps> = ({ isOpen, onClose }) => {
  const [sector, setSector] = useState('INKDL'); // Kandla
  const [slickArea, setSlickArea] = useState('12.5');
  const [oilType, setOilType] = useState('hfo');
  const [suspectVessel, setSuspectVessel] = useState('MT OCEAN PRIDE (MMSI: 419000881)');
  const [submitted, setSubmitted] = useState(false);
  const [incidentId, setIncidentId] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const generatedId = `IN-2026-${Math.floor(1000 + Math.random() * 9000).toString(16).toUpperCase()}`;
    setIncidentId(generatedId);
    setSubmitted(true);

    confetti({
      particleCount: 60,
      spread: 60,
      origin: { y: 0.6 },
      colors: ['#FF9933', '#EF4444', '#06B6D4'],
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-xl animate-fade-in">
      <div
        className="w-full max-w-xl rounded-3xl border border-white/20 shadow-2xl overflow-hidden flex flex-col"
        style={{
          background: 'rgba(5, 10, 30, 0.95)',
          backdropFilter: 'blur(24px)',
        }}
      >
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-xl text-white">
                Report Marine Oil Spill Incident
              </h3>
              <p className="text-xs font-mono-code text-slate-400">
                Direct Dispatch to Coast Guard MRCC & SeaTrace AI Radar Telemetry
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        {submitted ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="font-heading font-extrabold text-2xl text-white">
              Incident Registered: {incidentId}
            </h4>
            <p className="text-slate-300 text-sm max-w-md mx-auto leading-relaxed">
              Automated Sentinel-1 SAR acquisition request triggered. Real-time reverse Lagrangian drift simulation initiated and suspect vessel correlated against AIS telemetry.
            </p>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-xs font-mono-code text-cyan-300 text-left space-y-1">
              <div>• Priority: URGENT (Tier 2 Coastal Containment)</div>
              <div>• Notification: Dispatched to MRCC Mumbai & Port State Control</div>
              <div>• Reconstructed Origin Window: Processing with INCOIS 4D currents</div>
            </div>
            <button
              onClick={() => {
                setSubmitted(false);
                onClose();
              }}
              className="px-6 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-mono text-xs font-bold transition cursor-pointer"
            >
              Close & Monitor Incident Console
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono-code text-slate-300 uppercase mb-1.5">
                  Maritime Sector / Fairway
                </label>
                <select
                  value={sector}
                  onChange={(e) => setSector(e.target.value)}
                  className="w-full p-3 rounded-xl bg-white/5 border border-white/15 text-white font-mono-code text-xs sm:text-sm focus:outline-none focus:border-[#FF9933]"
                >
                  {INDIAN_PORTS.map((p) => (
                    <option key={p.unLocode} value={p.unLocode} className="bg-[#050A1E]">
                      {p.name} ({p.unLocode})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono-code text-slate-300 uppercase mb-1.5">
                  Slick Area (km²)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={slickArea}
                  onChange={(e) => setSlickArea(e.target.value)}
                  className="w-full p-3 rounded-xl bg-white/5 border border-white/15 text-white font-mono-code text-xs sm:text-sm focus:outline-none focus:border-[#FF9933]"
                  placeholder="e.g. 12.5"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono-code text-slate-300 uppercase mb-1.5">
                  Hydrocarbon / Slick Type
                </label>
                <select
                  value={oilType}
                  onChange={(e) => setOilType(e.target.value)}
                  className="w-full p-3 rounded-xl bg-white/5 border border-white/15 text-white font-mono-code text-xs sm:text-sm focus:outline-none focus:border-[#FF9933]"
                >
                  <option value="hfo" className="bg-[#050A1E]">Heavy Fuel Oil (HFO / Bunker C)</option>
                  <option value="crude" className="bg-[#050A1E]">Crude Oil (Heavy / Light Arabian)</option>
                  <option value="diesel" className="bg-[#050A1E]">Marine Gasoil (MGO / Diesel)</option>
                  <option value="bilge" className="bg-[#050A1E]">Oily Bilge Water Discharge</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono-code text-slate-300 uppercase mb-1.5">
                  Suspect Vessel MMSI / Name (Optional)
                </label>
                <input
                  type="text"
                  value={suspectVessel}
                  onChange={(e) => setSuspectVessel(e.target.value)}
                  className="w-full p-3 rounded-xl bg-white/5 border border-white/15 text-white font-mono-code text-xs sm:text-sm focus:outline-none focus:border-[#FF9933]"
                  placeholder="e.g. MT OCEAN PRIDE / 419000881"
                />
              </div>
            </div>

            {/* Live Operational Notice */}
            <div className="p-3.5 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-start gap-2.5 text-xs text-orange-200">
              <Radio className="w-4 h-4 text-orange-400 shrink-0 mt-0.5 animate-pulse" />
              <span>
                Report triggers rapid AIS back-correlation against historical vessel transits within a 25 NM radius.
              </span>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl text-white font-mono-code font-bold text-sm uppercase tracking-wider transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow-lg shadow-[#FF9933]/30 flex items-center justify-center gap-2"
              style={{
                background: 'linear-gradient(135deg, #FF9933 0%, #E67E22 100%)',
              }}
            >
              <Waves className="w-4 h-4" />
              <span>Submit Spill Incident & Launch Telemetry</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
