import { useEffect, useState } from 'react';

import { Globe, Radio, Clock, Box } from 'lucide-react';

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
    icon: Globe,
    value: '180+',
    targetNum: 180,
    suffix: '+',
    label: 'Global Ports',
    sublabel: 'Direct weekly calls in 72 nations',
  },
  {
    icon: Radio,
    value: '24/7',
    targetNum: 24,
    suffix: '/7',
    label: 'Live Telemetry',
    sublabel: 'Real-time Starlink & GPS sensor mesh',
  },
  {
    icon: Clock,
    value: '99.2%',
    targetNum: 99.2,
    decimals: 1,
    suffix: '%',
    label: 'On-Time Schedule',
    sublabel: 'Industry leading reliability record',
  },
  {
    icon: Box,
    value: '12.4M',
    targetNum: 12.4,
    decimals: 1,
    suffix: 'M',
    label: 'TEU Transported',
    sublabel: 'Over 14,000 voyages completed',
  },
];

export const StatsBar: React.FC = () => {
  const [counts, setCounts] = useState<number[]>(STATS.map(() => 0));

  useEffect(() => {
    const duration = 2000;
    const startTime = performance.now();

    const animateCount = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const ease = 1 - Math.pow(1 - progress, 3);

      setCounts(STATS.map((stat) => stat.targetNum * ease));

      if (progress < 1) {
        requestAnimationFrame(animateCount);
      }
    };

    requestAnimationFrame(animateCount);
  }, []);

  return (
    <div className="w-full max-w-7xl mx-auto px-6 sm:px-8 -mt-6 mb-24 z-20 relative">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map((stat, idx) => {
          const Icon = stat.icon;
          const displayNum = stat.decimals
            ? counts[idx].toFixed(stat.decimals)
            : Math.floor(counts[idx]).toString();

          return (
            <div
              key={idx}
              className="glass-panel rounded-2xl p-6 border border-white/10 hover:border-[#FF7A2F]/40 transition-all duration-300 hover:-translate-y-1 group"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono-code uppercase tracking-wider text-slate-400">
                  {stat.label}
                </span>
                <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-[#FF7A2F]/20 transition-colors">
                  <Icon className="w-4 h-4 text-[#FF7A2F] group-hover:scale-110 transition-transform" />
                </div>
              </div>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="font-heading font-extrabold text-3xl sm:text-4xl text-white tracking-tight">
                  {displayNum}
                </span>
                <span className="font-heading font-bold text-2xl text-[#FF7A2F]">
                  {stat.suffix}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-normal leading-relaxed">
                {stat.sublabel}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
