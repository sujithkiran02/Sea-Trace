import { useEffect, useState } from 'react';

import { Anchor } from 'lucide-react';

interface LoaderProps {
  onComplete: () => void;
}

export const Loader: React.FC<LoaderProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('INITIALIZING 3D MARITIME ENGINE...');
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        const next = prev + Math.floor(Math.random() * 8) + 4;
        if (next >= 100) {
          clearInterval(interval);
          setStatusText('READY TO EMBARK');
          setTimeout(() => {
            setIsFadingOut(true);
            setTimeout(onComplete, 800);
          }, 300);
          return 100;
        }

        if (next > 75) {
          setStatusText('SYNCHRONIZING SATELLITE TELEMETRY...');
        } else if (next > 45) {
          setStatusText('SIMULATING GERSTNER WAVE HYDRODYNAMICS...');
        } else if (next > 20) {
          setStatusText('BUILDING PROCEDURAL CONTAINER VESSEL...');
        }

        return next;
      });
    }, 45);

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#070D1A] transition-opacity duration-700 pointer-events-none ${
        isFadingOut ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {/* Center Loader Box */}
      <div className="flex flex-col items-center max-w-sm px-6 text-center">
        {/* Animated Brand Icon */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#FF7A2F] to-[#FFC15A] p-0.5 mb-8 shadow-2xl shadow-[#FF7A2F]/30 animate-pulse">
          <div className="w-full h-full bg-[#070D1A] rounded-[14px] flex items-center justify-center">
            <Anchor className="w-8 h-8 text-[#FF7A2F]" />
          </div>
        </div>

        {/* Brand Name */}
        <h2 className="font-heading font-extrabold text-2xl text-white tracking-wider mb-2">
          OCEAN<span className="text-[#FF7A2F]">FREIGHT</span>
        </h2>

        {/* Progress Bar */}
        <div className="w-64 h-1.5 bg-white/10 rounded-full overflow-hidden my-6 relative">
          <div
            className="h-full bg-gradient-to-r from-[#FF7A2F] via-[#FFC15A] to-cyan-400 rounded-full transition-all duration-100 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Percentage Counter */}
        <div className="font-mono-code font-bold text-3xl text-white mb-2">
          {progress}<span className="text-[#FF7A2F] text-lg">%</span>
        </div>

        {/* Dynamic Status Text */}
        <p className="text-[11px] font-mono-code text-slate-400 tracking-widest uppercase">
          {statusText}
        </p>
      </div>
    </div>
  );
};
