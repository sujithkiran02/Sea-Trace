import { useState } from 'react';
import { ArrowRight, Search, ChevronDown, Compass } from 'lucide-react';


interface HeroSectionProps {
  onOpenTracker: (trackingNumber?: string) => void;
  onExploreRoutes: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onOpenTracker,
  onExploreRoutes,
}) => {
  const [containerInput, setContainerInput] = useState('MSKU-982410-6');

  const handleSubmitTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (containerInput.trim()) {
      onOpenTracker(containerInput.trim());
    }
  };

  return (
    <section className="relative min-h-screen w-full flex flex-col justify-between pt-32 pb-16 px-6 sm:px-8 max-w-7xl mx-auto z-10 pointer-events-none">
      {/* Top Banner Tag & Headline */}
      <div className="max-w-3xl pointer-events-auto">
        {/* Radar Status Badge */}
        <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full glass-pill mb-6 border border-white/15 bg-[#0A1020]/40 backdrop-blur-md">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF7A2F] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#FF7A2F]"></span>
          </span>
          <span className="text-[11px] font-mono-code font-semibold tracking-widest text-[#FFC15A] uppercase">
            NEXT-GENERATION MARITIME CARRIER
          </span>
        </div>

        {/* Main Headline */}
        <h1 className="font-heading font-extrabold text-4xl sm:text-6xl lg:text-7xl leading-[1.08] tracking-tight text-white mb-6">
          Moving the world,{' '}
          <span className="text-gradient-sunset block sm:inline">
            one ocean at a time.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-base sm:text-xl text-slate-300 font-normal leading-relaxed max-w-2xl mb-8">
          Next-generation ultra-large container carrier fleet. Bridging key global hubs with precision satellite telemetry, dual-fuel LNG propulsion, and guaranteed on-time port arrivals.
        </p>

        {/* Hero Interactive Tracking Widget */}
        <form
          onSubmit={handleSubmitTrack}
          className="p-1.5 rounded-2xl glass-panel max-w-lg flex items-center gap-2 mb-8 shadow-2xl border border-white/20"
        >
          <div className="pl-3.5 text-slate-400">
            <Search className="w-5 h-5 text-[#FF7A2F]" />
          </div>
          <input
            type="text"
            value={containerInput}
            onChange={(e) => setContainerInput(e.target.value)}
            placeholder="Enter Container, B/L or Booking #"
            className="w-full bg-transparent text-sm sm:text-base text-white placeholder-slate-400 focus:outline-none font-mono-code"
          />
          <button
            type="submit"
            className="px-5 py-3 rounded-xl bg-gradient-sunset-button text-white text-xs sm:text-sm font-semibold tracking-wider uppercase transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap"
          >
            <span>Track</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Secondary Action Link */}
        <div className="flex items-center gap-6">
          <button
            onClick={onExploreRoutes}
            className="group flex items-center gap-2 text-sm font-semibold text-slate-200 hover:text-[#FFC15A] transition-colors cursor-pointer"
          >
            <span className="border-b border-[#FF7A2F]/40 group-hover:border-[#FFC15A] pb-0.5">
              Explore Global Shipping Corridors
            </span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-[#FF7A2F]" />
          </button>
        </div>
      </div>

      {/* Floating Telemetry & Mini Route Widget (Desktop Right Corner) */}
      <div className="hidden lg:block absolute right-8 top-36 w-80 pointer-events-auto">
        <div className="glass-panel rounded-2xl p-5 border border-white/15 space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-[#FF7A2F] animate-spin" style={{ animationDuration: '18s' }} />
              <span className="text-xs font-mono-code font-bold uppercase tracking-wider text-slate-200">
                PACIFIC HORIZON
              </span>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono-code font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              UNDERWAY
            </span>
          </div>

          {/* Mini Route Path */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono-code text-slate-400">
              <span className="text-white font-semibold">SIN (Singapore)</span>
              <span className="text-[#FFC15A] font-semibold">RTM (Rotterdam)</span>
            </div>
            {/* Animated Progress Line */}
            <div className="relative w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#FF7A2F] to-[#FFC15A] rounded-full"
                style={{ width: '68%' }}
              />
            </div>
            <div className="flex justify-between text-[10px] font-mono-code text-slate-400">
              <span>Departed: 14 Oct</span>
              <span className="text-emerald-400">ETA: In 4 Days</span>
            </div>
          </div>

          {/* Live Vessel Specs */}
          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/10 text-xs font-mono-code">
            <div>
              <span className="text-[10px] text-slate-400 block uppercase">Speed</span>
              <span className="text-slate-100 font-bold">19.4 kts</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block uppercase">Capacity</span>
              <span className="text-slate-100 font-bold">24,188 TEU</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block uppercase">Coordinates</span>
              <span className="text-slate-100 font-bold">12° 28' N, 54° E</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block uppercase">Swell</span>
              <span className="text-slate-100 font-bold">1.2m Rolling</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Scroll Indicator */}
      <div className="flex flex-col items-center justify-center pt-8 text-center pointer-events-auto">
        <button
          onClick={onExploreRoutes}
          className="flex flex-col items-center gap-1.5 text-slate-400 hover:text-[#FFC15A] transition-colors cursor-pointer group"
        >
          <span className="text-[11px] font-mono-code tracking-widest uppercase">
            SCROLL TO EXPLORE
          </span>
          <ChevronDown className="w-4 h-4 animate-bounce text-[#FF7A2F] group-hover:text-[#FFC15A]" />
        </button>
      </div>
    </section>
  );
};
