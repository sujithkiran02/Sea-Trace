import { Anchor, ArrowRight, ShieldCheck, Mail, Phone, MapPin } from 'lucide-react';

interface FooterProps {
  onOpenQuote: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenQuote }) => {

  return (
    <footer id="contact" className="w-full pt-20 pb-12 px-6 sm:px-8 max-w-7xl mx-auto z-20 relative">
      {/* Big Warm Human CTA Card */}
      <div
        className="rounded-3xl p-8 sm:p-14 border shadow-2xl mb-16 text-center max-w-4xl mx-auto"
        style={{
          background: 'linear-gradient(135deg, rgba(255, 153, 51, 0.14) 0%, rgba(5, 10, 30, 0.95) 60%, rgba(19, 136, 8, 0.12) 100%)',
          backdropFilter: 'blur(20px)',
          borderColor: 'rgba(255, 153, 51, 0.35)',
        }}
      >
        <div
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full mb-6 border text-xs font-mono-code text-[#FFB766] uppercase"
          style={{
            background: 'rgba(255, 153, 51, 0.12)',
            borderColor: 'rgba(255, 153, 51, 0.35)',
          }}
        >
          <span>24/7 Indian EEZ Environmental Defense</span>
        </div>

        <h3 className="font-heading font-extrabold text-3xl sm:text-5xl text-white mb-5 leading-tight">
          Report an offshore spill or track suspect vessels.{' '}
          <span className="text-[#FF9933] block sm:inline">We provide rapid evidence.</span>
        </h3>

        <p className="text-slate-300 text-base sm:text-lg max-w-2xl mx-auto mb-8 leading-relaxed">
          Immediate automated dispatch to Indian Coast Guard Maritime Rescue Coordination Centres (MRCC), INCOIS hydrodynamic modeling teams, and DG Shipping legal tribunals.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={onOpenQuote}
            className="w-full sm:w-auto px-8 py-4 rounded-full text-white font-semibold text-sm tracking-wide shadow-xl shadow-[#FF9933]/30 transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-105 active:scale-95"
            style={{
              background: 'linear-gradient(135deg, #FF9933 0%, #E67E22 100%)',
            }}
          >
            <span>Report Marine Spill</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <a
            href="tel:+912224371932"
            className="w-full sm:w-auto px-8 py-4 rounded-full text-white font-semibold text-sm tracking-wide transition-all cursor-pointer flex items-center justify-center gap-2 border border-white/20 hover:bg-white/10"
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              backdropFilter: 'blur(16px)',
            }}
          >
            <Phone className="w-4 h-4 text-emerald-400" />
            <span>MRCC Hotline: (+91 22 2437 1932)</span>
          </a>
        </div>
      </div>

      {/* Main Footer Links & Branding */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-white/10 text-sm">
        {/* Col 1: Brand Info */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#FF9933] to-[#FFC15A] p-0.5">
              <div className="w-full h-full bg-[#050A1E] rounded-[10px] flex items-center justify-center">
                <Anchor className="w-4 h-4 text-[#FF9933]" />
              </div>
            </div>
            <span className="font-heading font-extrabold text-lg text-white">
              SEATRACE<span className="text-[#FF9933]">AI</span>
            </span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Bharat's autonomous satellite oil-spill early warning and maritime vessel investigation platform. Protecting India's 7,500 km coastline with Sentinel-1 SAR and reverse hydrodynamic drift modeling.
          </p>
          <div className="flex items-center gap-2 text-xs font-mono-code text-emerald-400">
            <ShieldCheck className="w-4 h-4" />
            <span>DG Shipping & MRCC Interfaced</span>
          </div>
        </div>

        {/* Col 2: Surveillance Capabilities */}
        <div>
          <h4 className="font-mono-code text-xs font-bold text-white uppercase tracking-wider mb-4">
            Investigation Suite
          </h4>
          <ul className="space-y-2.5 text-xs text-slate-400">
            <li><a href="#services" className="hover:text-white transition-colors">Sentinel-1 SAR Slick Segmentation</a></li>
            <li><a href="#services" className="hover:text-white transition-colors">Reverse Lagrangian Drift Modeling</a></li>
            <li><a href="#services" className="hover:text-white transition-colors">AIS Vessel Spatio-Temporal Correlation</a></li>
            <li><a href="#services" className="hover:text-white transition-colors">Counterfactual Discharge Simulation</a></li>
            <li><a href="#services" className="hover:text-white transition-colors">Court-Admissible Evidence Packages</a></li>
          </ul>
        </div>

        {/* Col 3: Key Surveillance Sectors */}
        <div>
          <h4 className="font-mono-code text-xs font-bold text-white uppercase tracking-wider mb-4">
            Surveillance Sectors
          </h4>
          <ul className="space-y-2.5 text-xs text-slate-400 font-mono-code">
            <li><a href="#routes" className="hover:text-white transition-colors">Gulf of Kutch Tanker Fairway</a></li>
            <li><a href="#routes" className="hover:text-white transition-colors">Mumbai High Offshore Zone</a></li>
            <li><a href="#routes" className="hover:text-white transition-colors">Palk Strait & Gulf of Mannar</a></li>
            <li><a href="#routes" className="hover:text-white transition-colors">Chennai Deepwater Approach</a></li>
            <li><a href="#routes" className="hover:text-white transition-colors">Andaman Sea SLOC Corridor</a></li>
          </ul>
        </div>

        {/* Col 4: India Maritime Watch Desk */}
        <div>
          <h4 className="font-mono-code text-xs font-bold text-white uppercase tracking-wider mb-4">
            Operations Watch Desk
          </h4>
          <div className="space-y-3 text-xs text-slate-400">
            <div className="flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-[#FF9933] shrink-0 mt-0.5" />
              <span>Maritime Rescue Coordination Centre (MRCC), Worli Sea Face, Mumbai 400030</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Mail className="w-4 h-4 text-[#FF9933] shrink-0" />
              <span>operations@seatrace.ai</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Phone className="w-4 h-4 text-[#138808] shrink-0" />
              <span>+91 22 2437 1932 (24/7 MRCC Hotline)</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono-code text-emerald-400 pt-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>DG Shipping & MoES Interfaced</span>
            </div>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono-code text-slate-500">
        <div>
          © 2026 SEATRACE AI — MARITIME OIL SPILL DETECTION & VESSEL MANAGEMENT PLATFORM.
        </div>
        <div className="flex gap-6">
          <a href="#" className="hover:text-slate-300">MARPOL Annex I Protocol</a>
          <a href="#" className="hover:text-slate-300">Merchant Shipping Act 1958</a>
          <a href="#" className="hover:text-slate-300">EEZ Radar Protocol</a>
        </div>
      </div>
    </footer>
  );
};
