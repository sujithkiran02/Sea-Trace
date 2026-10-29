import { useEffect, useState } from 'react';
import { ShieldCheck, Satellite, Clock, Target } from 'lucide-react';

interface StatItem {
  icon: React.ElementType;
  value: string;
  targetNum: number;
  suffix: string;
  decimals?: number;
  label: string;
  sublabel: string;
}

const STATS: StatItem[] = [
  {
    icon: ShieldCheck,
    value: '7,500 km',
    targetNum: 7500,
    suffix: ' km',
    label: 'Coastline Monitored',
    sublabel: 'Continuous Sentinel-1 SAR & NISAR radar coverage',
  },
  {
    icon: Satellite,
    value: '2.37M km²',
    targetNum: 2.37,
    decimals: 2,
    suffix: 'M km²',
    label: 'Indian EEZ Under Watch',
    sublabel: 'Arabian Sea, Bay of Bengal & Andaman approaches',
  },
  {
    icon: Clock,
    value: '< 15 min',
    targetNum: 15,
    suffix: ' min',
    label: 'Spill Detection Latency',
    sublabel: 'Autonomous neural network SAR segmentation',
  },
  {
    icon: Target,
    value: '94.8%',
    targetNum: 94.8,
    decimals: 1,
    suffix: '%',
    label: 'Attribution Confidence',
    sublabel: 'Reverse Lagrangian drift correlated with AIS paths',
  },
];

export const StatCards: React.FC = () => {
  const [counts, setCounts] = useState<number[]>(STATS.map(() => 0));

  useEffect(() => {
    const duration = 2200;
    const startTime = performance.now();

    const animateCount = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);

      setCounts(STATS.map((stat) => stat.targetNum * ease));

      if (progress < 1) {
        requestAnimationFrame(animateCount);
      }
    };

    requestAnimationFrame(animateCount);
  }, []);

  return (
    <div id="stat-cards-container" className="flex flex-col gap-2 w-full pointer-events-auto">
      {/* Sample Data Disclaimer Flag */}
      <div className="flex items-center gap-1.5 text-[10px] font-mono-code text-amber-300 bg-amber-500/10 border border-amber-500/25 px-2.5 py-1 rounded-lg w-fit">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
        <span>CLEARLY MARKED SAMPLE DATA (Replace with your actual operations metrics)</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 w-full">
        {STATS.map((stat, idx) => {
          const Icon = stat.icon;
          const displayNum = stat.decimals
            ? counts[idx].toFixed(stat.decimals)
            : Math.floor(counts[idx]).toString();

          return (
            <div
              key={idx}
              className="stat-card p-4 sm:p-5 rounded-2xl transition-all duration-300 hover:-translate-y-1 group"
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.16)',
                boxShadow:
                  '0 20px 40px -15px rgba(5, 10, 30, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.25)',
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-mono-code uppercase tracking-wider text-slate-300/80 font-semibold">
                  {stat.label}
                </span>
                <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center group-hover:bg-[#FF9933]/20 transition-colors">
                  <Icon className="w-3.5 h-3.5 text-[#6FD3FF] group-hover:text-[#FF9933] transition-colors" />
                </div>
              </div>

              <div className="flex items-baseline gap-0.5 mb-1">
                <span className="font-heading font-extrabold text-2xl sm:text-3xl text-white tracking-tight">
                  {displayNum}
                </span>
                <span className="font-heading font-bold text-xl text-[#FF9933]">
                  {stat.suffix}
                </span>
              </div>

              <p className="text-[11px] text-slate-300/75 leading-tight hidden sm:block">
                {stat.sublabel}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
