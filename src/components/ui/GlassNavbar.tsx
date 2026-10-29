import { useState } from 'react';
import { Anchor, Volume2, VolumeX, Compass, Radio, Globe, MessageSquare } from 'lucide-react';
import { oceanAudio } from '../../utils/audio';
import { LANGUAGES, type LanguageCode } from '../../constants/translations';
import { ThemeToggle, type Theme } from './ThemeToggle';

interface GlassNavbarProps {
  currentLang: LanguageCode;
  onSelectLang: (lang: LanguageCode) => void;
  onOpenTracker: () => void;
  onOpenQuote: () => void;
  onNavigateSection?: (sectionId: string) => void;
  theme?: Theme;
  onToggleTheme?: () => void;
}

export const GlassNavbar: React.FC<GlassNavbarProps> = ({
  currentLang,
  onSelectLang,
  onOpenTracker,
  onOpenQuote,
  onNavigateSection,
  theme = 'dark',
  onToggleTheme,
}) => {
  const [isMuted, setIsMuted] = useState(true);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);

  const handleToggleSound = () => {
    const playing = oceanAudio.toggle();
    setIsMuted(!playing);
  };

  const handleHorn = () => {
    oceanAudio.playFogHorn();
  };

  return (
    <header className="fixed top-5 left-0 w-full z-40 px-4 sm:px-8 flex justify-center pointer-events-none">
      {/* Floating Pill Container */}
      <div
        id="navbar-pill"
        className="pointer-events-auto flex items-center justify-between gap-4 sm:gap-8 px-4 sm:px-6 py-2.5 rounded-full transition-all duration-300 max-w-6xl w-full"
        style={{
          background: 'rgba(255, 255, 255, 0.08)',
          backdropFilter: 'blur(18px) saturate(140%)',
          WebkitBackdropFilter: 'blur(18px) saturate(140%)',
          border: '1px solid rgba(255, 255, 255, 0.18)',
          boxShadow: '0 20px 40px -15px rgba(5, 10, 30, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.25)',
        }}
      >
        {/* Brand Wordmark & Anchor Icon with Saffron Ring */}
        <a
          href="#"
          className="flex items-center gap-2.5 group cursor-pointer shrink-0"
          onClick={(e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#FF9933] to-[#FFC15A] p-0.5 shadow-md shadow-[#FF9933]/25 group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-[#050A1E] rounded-full flex items-center justify-center">
              <Anchor className="w-4 h-4 text-[#FF9933]" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="font-heading font-extrabold text-sm sm:text-base tracking-wider text-white group-hover:text-[#FFB766] transition-colors leading-none">
              OCEAN<span className="text-[#FF9933]">GUARD</span>
            </span>
            <span className="text-[8px] font-mono-code text-slate-400 tracking-widest uppercase">
              BHARAT MARITIME
            </span>
          </div>
        </a>

        {/* Navigation Links */}
        <nav className="hidden lg:flex items-center gap-6 text-xs font-medium text-slate-200">
          <button
            onClick={() => onNavigateSection?.('routes')}
            className="hover:text-[#FF9933] transition-colors cursor-pointer"
          >
            Coastal Routes
          </button>
          <button
            onClick={() => onNavigateSection?.('services')}
            className="hover:text-[#FF9933] transition-colors cursor-pointer"
          >
            Services
          </button>
          <button
            onClick={() => onNavigateSection?.('people')}
            className="hover:text-[#FF9933] transition-colors cursor-pointer"
          >
            Our People
          </button>
          <button
            onClick={() => onNavigateSection?.('fleet')}
            className="hover:text-[#FF9933] transition-colors cursor-pointer"
          >
            Fleet
          </button>
          <button
            onClick={onOpenTracker}
            className="hover:text-[#FF9933] transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Radio className="w-3.5 h-3.5 text-[#FF9933] animate-pulse" />
            <span>Tracking</span>
          </button>
          <button
            onClick={() => onNavigateSection?.('testimonials')}
            className="hover:text-[#FF9933] transition-colors cursor-pointer"
          >
            Stories
          </button>
        </nav>

        {/* Action Controls, Theme Toggle & Language Switcher */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Day / Night Theme Toggle */}
          {onToggleTheme && (
            <ThemeToggle theme={theme} onToggle={onToggleTheme} />
          )}

          {/* Multilingual Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setLangDropdownOpen((prev) => !prev)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer text-xs font-mono-code border border-white/10"
              title="Change Language / भाषा बदलें"
            >
              <Globe className="w-3.5 h-3.5 text-[#FF9933]" />
              <span className="uppercase">{currentLang}</span>
            </button>

            {langDropdownOpen && (
              <div
                className="absolute right-0 mt-2 w-36 rounded-2xl p-1.5 border border-white/15 shadow-2xl z-50 text-xs font-mono-code space-y-0.5"
                style={{
                  background: 'rgba(5, 10, 30, 0.95)',
                  backdropFilter: 'blur(20px)',
                }}
              >
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      onSelectLang(lang.code);
                      setLangDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 rounded-xl transition-colors cursor-pointer flex items-center justify-between ${
                      currentLang === lang.code
                        ? 'bg-[#FF9933] text-white font-bold'
                        : 'text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    <span>{lang.nativeName}</span>
                    <span className="text-[10px] opacity-75">{lang.code.toUpperCase()}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* WhatsApp Direct Connect */}
          <a
            href="https://wa.me/919820012345?text=Namaste!%20I%20would%20like%20to%20inquire%20about%20container%20slots."
            target="_blank"
            rel="noopener noreferrer"
            title="Chat with Operations Team on WhatsApp"
            className="p-2 rounded-full hover:bg-emerald-500/20 text-emerald-400 transition-colors"
          >
            <MessageSquare className="w-4 h-4 fill-emerald-400" />
          </a>

          {/* Sea Audio Synthesizer */}
          <button
            onClick={handleToggleSound}
            title={isMuted ? 'Turn on Sea Audio' : 'Mute Sea Audio'}
            className="p-2 rounded-full hover:bg-white/10 text-slate-300 hover:text-white transition-all cursor-pointer"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-[#FF9933]" />}
          </button>

          {/* Ship Horn */}
          <button
            onClick={handleHorn}
            title="Sound Ship Foghorn"
            className="hidden sm:flex items-center gap-1 p-2 rounded-full hover:bg-white/10 text-slate-300 hover:text-[#FFC15A] transition-all cursor-pointer"
          >
            <Compass className="w-4 h-4 text-[#FFC15A]" />
          </button>

          {/* Glowing Saffron Quote Button */}
          <button
            onClick={onOpenQuote}
            className="px-4 sm:px-5 py-2 rounded-full text-xs font-semibold tracking-wide text-white transition-all cursor-pointer hover:scale-105 active:scale-95"
            style={{
              background: 'linear-gradient(135deg, #FF9933 0%, #E67E22 100%)',
              boxShadow: '0 4px 18px -2px rgba(255, 153, 51, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.35)',
            }}
          >
            Get my quote
          </button>
        </div>
      </div>
    </header>
  );
};
