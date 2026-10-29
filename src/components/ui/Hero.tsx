import { useState, useEffect } from 'react';
import { ArrowRight, Compass, PhoneCall } from 'lucide-react';
import type { LanguageCode } from '../../constants/translations';
import { TRANSLATIONS } from '../../constants/translations';

interface HeroProps {
  currentLang: LanguageCode;
  onOpenTracker: () => void;
  onExploreRoutes: () => void;
}

export const Hero: React.FC<HeroProps> = ({ currentLang, onOpenTracker, onExploreRoutes }) => {
  const [greeting, setGreeting] = useState('');
  const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;

  // Compute live greeting based on Indian Standard Time (IST - UTC+5:30)
  useEffect(() => {
    const computeGreeting = () => {
      const now = new Date();
      const utcTime = now.getTime() + now.getTimezoneOffset() * 60000;
      const istDate = new Date(utcTime + 5.5 * 3600000);
      const hours = istDate.getHours();

      if (hours >= 5 && hours < 12) {
        setGreeting(t.greetingMorning);
      } else if (hours >= 12 && hours < 17) {
        setGreeting(t.greetingAfternoon);
      } else if (hours >= 17 && hours < 21) {
        setGreeting(t.greetingEvening);
      } else {
        setGreeting(t.greetingNight);
      }
    };

    computeGreeting();
    const interval = setInterval(computeGreeting, 60000);
    return () => clearInterval(interval);
  }, [t]);

  return (
    <div
      id="hero-content"
      className="max-w-2xl lg:max-w-3xl text-left pointer-events-auto relative"
    >

      {/* Dynamic IST Live Greeting & Saffron Badge */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        {/* Saffron-accented India Maritime Network Badge */}
        <div
          id="hero-badge"
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border shadow-sm"
          style={{
            background: 'rgba(255, 153, 51, 0.12)',
            backdropFilter: 'blur(16px)',
            borderColor: 'rgba(255, 153, 51, 0.35)',
          }}
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF9933] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FF9933]"></span>
          </span>
          <span className="text-[10px] font-mono-code font-bold tracking-widest text-[#FFB766] uppercase">
            {t.badge}
          </span>
        </div>

        {/* Live IST Greeting */}
        <div className="text-xs font-mono-code text-emerald-400 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>{greeting}</span>
        </div>
      </div>

      {/* Main Headline */}
      <h1
        id="hero-headline"
        className="font-heading font-extrabold text-4xl sm:text-6xl lg:text-7xl leading-[1.08] tracking-tight text-white mb-5"
        style={{
          textShadow: '0 4px 18px rgba(0, 0, 0, 0.85)',
        }}
      >
        <span className="hero-line block">{t.headlinePart1}</span>
        <span
          className="hero-line block"
          style={{
            background: 'linear-gradient(135deg, #FFF6E9 0%, #FFB766 50%, #FF9933 100%)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          {t.headlinePart2}
        </span>
      </h1>

      {/* Subtitle */}
      <p
        id="hero-subtitle"
        className="text-sm sm:text-base lg:text-lg text-slate-200 font-normal leading-relaxed max-w-xl mb-8"
        style={{
          textShadow: '0 2px 10px rgba(0, 0, 0, 0.8)',
        }}
      >
        {t.subtitle}
      </p>

      {/* CTAs */}
      <div id="hero-ctas" className="flex flex-wrap items-center gap-4">
        {/* Primary CTA (Saffron Orange #FF9933) */}
        <button
          onClick={onOpenTracker}
          className="px-6 py-3.5 rounded-full text-white text-xs sm:text-sm font-semibold tracking-wide transition-all duration-300 hover:scale-105 active:scale-95 flex items-center gap-2 cursor-pointer shadow-lg shadow-[#FF9933]/30"
          style={{
            background: 'linear-gradient(135deg, #FF9933 0%, #E67E22 100%)',
            boxShadow:
              '0 4px 20px -2px rgba(255, 153, 51, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.35)',
          }}
        >
          <span>{t.trackButton}</span>
          <ArrowRight className="w-4 h-4" />
        </button>

        {/* Secondary CTA (Glass Outline) */}
        <button
          onClick={onExploreRoutes}
          className="px-6 py-3.5 rounded-full text-white text-xs sm:text-sm font-semibold tracking-wide transition-all duration-300 hover:bg-white/15 active:scale-95 flex items-center gap-2 cursor-pointer"
          style={{
            background: 'rgba(255, 255, 255, 0.08)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.22)',
            boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.2)',
          }}
        >
          <Compass className="w-4 h-4 text-[#6FD3FF]" />
          <span>{t.routesButton}</span>
        </button>

        {/* Maritime Emergency Operations Hotline */}
        <a
          href="tel:+912224371932"
          className="text-xs font-mono-code text-slate-300 hover:text-[#FF9933] transition-colors flex items-center gap-1.5 ml-2"
        >
          <PhoneCall className="w-3.5 h-3.5 text-[#138808]" />
          <span>{t.talkToTeam} (+91 22 2437 1932)</span>
        </a>
      </div>
    </div>
  );
};
