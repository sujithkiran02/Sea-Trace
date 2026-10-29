import { useState, useEffect } from 'react';
import { Anchor, Volume2, VolumeX, Sliders, Compass, Radio } from 'lucide-react';
import { oceanAudio } from '../../utils/audio';
import { ThemeToggle, type Theme } from './ThemeToggle';

interface NavbarProps {
  onOpenTracker: () => void;
  onOpenQuote: () => void;
  onToggleDirector: () => void;
  isDirectorOpen: boolean;
  onSelectShot: (shotIndex: number) => void;
  theme?: Theme;
  onToggleTheme?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenTracker,
  onOpenQuote,
  onToggleDirector,
  isDirectorOpen,
  onSelectShot,
  theme = 'dark',
  onToggleTheme,
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMuted, setIsMuted] = useState(true);


  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleToggleSound = () => {
    const playing = oceanAudio.toggle();
    setIsMuted(!playing);
  };

  const handleHorn = () => {
    oceanAudio.playFogHorn();
  };

  return (
    <header
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 ${isScrolled
          ? 'py-3 bg-[#0A1020]/80 backdrop-blur-xl border-b border-white/10 shadow-2xl'
          : 'py-6 bg-gradient-to-b from-[#0A1020]/90 via-[#0A1020]/40 to-transparent'
        }`}
    >
      <div className="max-w-7xl mx-auto px-6 sm:px-8 flex items-center justify-between">
        {/* Brand Wordmark & Anchor Icon */}
        <a
          href="#"
          className="flex items-center gap-3.5 group cursor-pointer"
          onClick={(e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
            onSelectShot(0);
          }}
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#FF7A2F] to-[#FFC15A] p-0.5 shadow-lg shadow-[#FF7A2F]/20 group-hover:shadow-[#FF7A2F]/40 transition-all">
            <div className="w-full h-full bg-[#0A1020] rounded-[10px] flex items-center justify-center">
              <Anchor className="w-5 h-5 text-[#FF7A2F] group-hover:scale-110 transition-transform" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-heading font-extrabold tracking-wider text-xl text-white group-hover:text-[#FFC15A] transition-colors">
                OCEAN<span className="text-[#FF7A2F]">GUARD</span>
              </span>
              <span className="px-1.5 py-0.5 text-[9px] font-mono-code uppercase font-bold tracking-widest bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded">
                LIVE
              </span>
            </div>
            <p className="text-[10px] text-slate-400 tracking-widest font-mono-code uppercase hidden sm:block">
              Global Maritime Network
            </p>
          </div>
        </a>

        {/* Navigation Links */}
        <nav className="hidden lg:flex items-center gap-8 text-sm font-medium text-slate-200">
          <a
            href="#services"
            onClick={(e) => {
              e.preventDefault();
              onSelectShot(1);
              document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="hover:text-[#FFC15A] transition-colors cursor-pointer"
          >
            Services
          </a>
          <a
            href="#routes"
            onClick={(e) => {
              e.preventDefault();
              onSelectShot(2);
              document.getElementById('routes')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="hover:text-[#FFC15A] transition-colors cursor-pointer"
          >
            Routes
          </a>
          <a
            href="#fleet"
            onClick={(e) => {
              e.preventDefault();
              onSelectShot(3);
              document.getElementById('fleet')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="hover:text-[#FFC15A] transition-colors cursor-pointer"
          >
            Fleet
          </a>
          <button
            onClick={onOpenTracker}
            className="hover:text-[#FFC15A] transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Radio className="w-3.5 h-3.5 text-[#FF7A2F] animate-pulse" />
            Tracking
          </button>
          <a
            href="#sustainability"
            onClick={(e) => {
              e.preventDefault();
              onSelectShot(4);
              document.getElementById('footer')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="hover:text-[#FFC15A] transition-colors cursor-pointer"
          >
            Contact
          </a>
        </nav>

        {/* Quick Action Tools */}
        <div className="flex items-center gap-3">
          {/* Sound Synthesizer Toggle */}
          <button
            onClick={handleToggleSound}
            title={isMuted ? 'Enable Sea Atmosphere Audio' : 'Mute Sea Atmosphere Audio'}
            className="p-2.5 rounded-full glass-pill text-slate-300 hover:text-white hover:border-[#FF7A2F]/50 transition-all cursor-pointer"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-[#FF7A2F]" />}
          </button>

          {/* Ship Foghorn Button */}
          <button
            onClick={handleHorn}
            title="Sound Ship Foghorn"
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-full glass-pill text-xs font-mono-code text-slate-300 hover:text-[#FFC15A] hover:border-[#FFC15A]/40 transition-all cursor-pointer"
          >
            <Compass className="w-3.5 h-3.5 text-[#FFC15A]" />
            <span>HORN</span>
          </button>

          {/* Scene Director HUD Toggle */}
          <button
            onClick={onToggleDirector}
            title="Open 3D Scene Director HUD"
            className={`p-2.5 rounded-full transition-all cursor-pointer ${isDirectorOpen
                ? 'bg-[#FF7A2F] text-white shadow-lg shadow-[#FF7A2F]/30 ring-2 ring-[#FFC15A]'
                : 'glass-pill text-slate-300 hover:text-white hover:border-[#FF7A2F]/50'
              }`}
          >
            <Sliders className="w-4 h-4" />
          </button>

          {/* Theme Toggle (Day / Night) */}
          {onToggleTheme && (
            <ThemeToggle theme={theme} onToggle={onToggleTheme} />
          )}

          {/* Get a Quote Pill Button */}
          <button
            onClick={onOpenQuote}
            className="px-5 py-2.5 rounded-full bg-gradient-sunset-button text-white text-xs sm:text-sm font-semibold tracking-wide shadow-lg shadow-[#FF7A2F]/25 hover:shadow-[#FF7A2F]/40 transition-all cursor-pointer flex items-center gap-2"
          >
            <span>Get a Quote</span>
          </button>
        </div>
      </div>
    </header>
  );
};
