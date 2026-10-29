import React from 'react';
import { Sun, Moon } from 'lucide-react';

export type Theme = 'dark' | 'light';

interface ThemeToggleProps {
  theme: Theme;
  onToggle: () => void;
  variant?: 'navbar' | 'floating';
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  theme,
  onToggle,
  variant = 'navbar',
}) => {
  const isLight = theme === 'light';

  if (variant === 'floating') {
    return (
      <button
        onClick={onToggle}
        aria-label={isLight ? 'Switch to Dark Night Theme' : 'Switch to Daylight Theme'}
        title={isLight ? 'Switch to Dark Night Theme' : 'Switch to Daylight Theme'}
        className={`fixed bottom-6 right-6 z-50 p-3.5 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer flex items-center justify-center ${
          isLight
            ? 'bg-white/90 text-slate-800 border border-slate-300/80 shadow-slate-400/30'
            : 'bg-[#0A1020]/90 text-amber-300 border border-white/20 shadow-black/60'
        } backdrop-blur-xl`}
      >
        <div className="relative w-5 h-5 flex items-center justify-center">
          <Sun
            className={`w-5 h-5 text-amber-500 absolute transition-all duration-500 ${
              isLight ? 'rotate-0 opacity-100 scale-100' : 'rotate-90 opacity-0 scale-50'
            }`}
          />
          <Moon
            className={`w-5 h-5 text-[#6FD3FF] absolute transition-all duration-500 ${
              isLight ? '-rotate-90 opacity-0 scale-50' : 'rotate-0 opacity-100 scale-100'
            }`}
          />
        </div>
      </button>
    );
  }

  return (
    <button
      onClick={onToggle}
      aria-label={isLight ? 'Switch to Deep Ocean Dark Theme' : 'Switch to Daylight Light Theme'}
      title={isLight ? 'Switch to Deep Ocean Dark Theme' : 'Switch to Daylight Light Theme'}
      className={`relative flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-300 cursor-pointer group text-xs font-mono-code font-semibold ${
        isLight
          ? 'bg-slate-100/90 text-slate-800 hover:bg-slate-200/90 border border-slate-300/90 shadow-sm'
          : 'bg-white/10 text-slate-200 hover:bg-white/15 border border-white/15'
      }`}
    >
      <div className="relative w-4 h-4 flex items-center justify-center">
        <Sun
          className={`w-4 h-4 text-amber-500 absolute transition-all duration-500 ${
            isLight ? 'rotate-0 opacity-100 scale-100' : 'rotate-90 opacity-0 scale-50'
          }`}
        />
        <Moon
          className={`w-4 h-4 text-[#FFB766] absolute transition-all duration-500 ${
            isLight ? '-rotate-90 opacity-0 scale-50' : 'rotate-0 opacity-100 scale-100'
          }`}
        />
      </div>
      <span className="hidden md:inline transition-colors tracking-wide">
        {isLight ? 'DAY' : 'NIGHT'}
      </span>
    </button>
  );
};
