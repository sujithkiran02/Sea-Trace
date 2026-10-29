import { Satellite, Waves, ShieldAlert, CheckCircle2, ArrowUpRight } from 'lucide-react';

interface ServicesSectionProps {
  onOpenQuote: () => void;
}

export const ServicesSection: React.FC<ServicesSectionProps> = ({ onOpenQuote }) => {
  const services = [
    {
      icon: Satellite,
      badge: 'Orbital SAR Radar',
      title: 'Automated Satellite Oil Slick Detection',
      desc: 'All-weather C-Band & L-Band SAR radar inference that pierces cloud cover, monsoon squalls, and darkness to segment petroleum slicks and estimate volume in m³.',
      features: ['Sentinel-1 & NISAR radar ingestion', 'Dual-pol dark patch neural filter', 'Instant slick contour & volume estimation'],
      accentColor: 'from-cyan-500/20 to-teal-500/5',
      borderColor: 'border-cyan-500/30',
      iconColor: 'text-cyan-400',
    },
    {
      icon: Waves,
      badge: 'Lagrangian Hydrodynamics',
      title: 'Reverse Ocean Drift & Spill Origin Backtracking',
      desc: 'Couples INCOIS 4D surface current vectors and NOAA GFS sea winds to simulate backward particle trajectories, establishing the exact historical spill discharge window.',
      features: ['4D ocean current vector integration', 'Wind-drift factor (3.2%) with Stokes drift', 'Dynamic uncertainty dispersion ellipses'],
      accentColor: 'from-[#FF7A2F]/20 to-[#FFC15A]/5',
      borderColor: 'border-[#FF7A2F]/30',
      iconColor: 'text-[#FF7A2F]',
    },
    {
      icon: ShieldAlert,
      badge: 'Vessel Management & Intelligence',
      title: 'AIS Vessel Attribution & Anomaly Correlation',
      desc: 'Tracks commercial tanker traffic against reconstructed spill origin points. Calculates closest point of approach (CPA), speed anomalies, and definitive blame probability.',
      features: ['Dark vessel AIS gap detection', 'Crude tanker manifest cross-verification', 'Legally admissible Admiralty Court packages'],
      accentColor: 'from-purple-500/20 to-pink-500/5',
      borderColor: 'border-purple-500/30',
      iconColor: 'text-purple-400',
    },
  ];

  return (
    <section id="services" className="min-h-screen w-full py-28 px-6 sm:px-8 max-w-7xl mx-auto z-10 relative">
      <div className="max-w-2xl mb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-pill mb-4 border border-white/10 text-xs font-mono-code text-[#FFC15A] uppercase">
          Surveillance & Investigation Capabilities
        </div>
        <h2 className="font-heading font-extrabold text-3xl sm:text-5xl text-white tracking-tight mb-4">
          Autonomous maritime vigilance at planetary scale.
        </h2>
        <p className="text-slate-300 text-base sm:text-lg leading-relaxed">
          From orbital radar imagery to hydrodynamic drift simulation and live AIS vessel telemetry correlation, SeaTrace AI provides end-to-end incident accountability.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {services.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className={`glass-panel rounded-3xl p-8 border ${item.borderColor} bg-gradient-to-br ${item.accentColor} flex flex-col justify-between hover:-translate-y-2 transition-all duration-300 group shadow-2xl`}
            >
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Icon className={`w-6 h-6 ${item.iconColor}`} />
                  </div>
                  <span className="text-[11px] font-mono-code font-bold uppercase tracking-wider text-slate-300 px-3 py-1 rounded-full bg-white/5 border border-white/10">
                    {item.badge}
                  </span>
                </div>

                <h3 className="font-heading font-bold text-xl sm:text-2xl text-white mb-3 group-hover:text-[#FFC15A] transition-colors">
                  {item.title}
                </h3>
                <p className="text-slate-300 text-sm leading-relaxed mb-6">
                  {item.desc}
                </p>

                <div className="space-y-2.5 mb-8">
                  {item.features.map((feat, fIdx) => (
                    <div key={fIdx} className="flex items-center gap-2 text-xs font-medium text-slate-200">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={onOpenQuote}
                className="w-full py-3 rounded-xl glass-pill hover:bg-white/20 text-xs font-mono-code font-bold text-white flex items-center justify-center gap-2 group/btn transition-all cursor-pointer"
              >
                <span>REPORT SIGHTING / DISPATCH</span>
                <ArrowUpRight className="w-4 h-4 text-[#FF7A2F] group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
};
