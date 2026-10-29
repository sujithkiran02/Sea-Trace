import React, { useState, useEffect } from 'react';
import type { Incident, FeatureTab } from '../../types/seatrace';
import { Volume2, VolumeX, Sun, Moon } from 'lucide-react';
import { oceanAudio } from '../../utils/audio';

interface SeaTraceNavProps {
  currentTab: FeatureTab;
  onSelectTab: (tab: FeatureTab) => void;
  incidents: Incident[];
  activeIncident: Incident | null;
  onSelectIncident: (inc: Incident) => void;
  isBackendOnline: boolean;
  onQuickExport: () => void;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
}

// NO NUMBERING - Clean, modern and professional labels
const NAV_ITEMS: { id: FeatureTab; label: string; icon: string }[] = [
  { id: 'landing', label: 'Overview', icon: '🌊' },
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'incidents', label: 'Incidents', icon: '🚨' },
  { id: 'detection', label: 'SAR Detection', icon: '🛰️' },
  { id: 'validation', label: 'Validation', icon: '🔍' },
  { id: 'reconstruction', label: 'Origin Drift', icon: '🌀' },
  { id: 'vessels', label: 'Vessel Leads', icon: '🚢' },
  { id: 'counterfactual', label: 'Counterfactual', icon: '🧪' },
  { id: 'evidence', label: 'Evidence', icon: '🔒' },
  { id: 'reports', label: 'Reports', icon: '📑' },
  { id: 'datasources', label: 'Data Sources', icon: '📡' },
  { id: 'system', label: 'System Status', icon: '⚡' }
];

export const SeaTraceNav: React.FC<SeaTraceNavProps> = ({
  currentTab,
  onSelectTab,
  incidents,
  activeIncident,
  onSelectIncident,
  isBackendOnline,
  onQuickExport,
  theme = 'dark',
  onToggleTheme
}) => {
  const [timeStr, setTimeStr] = useState('');
  const [isAudioMuted, setIsAudioMuted] = useState(true);
  const isLight = theme === 'light';

  // Live IST Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString('en-IN', {
          timeZone: 'Asia/Kolkata',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false
        }) + ' IST'
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleSound = () => {
    const playing = oceanAudio.toggle();
    setIsAudioMuted(!playing);
  };

  return (
    <header className="fixed top-2.5 sm:top-3.5 left-0 w-full z-[3000] px-2 sm:px-6 pointer-events-none flex justify-center">
      {/* Floating Crystal Glassmorphic Command Bridge HUD */}
      <div
        id="seatrace-glass-navbar"
        className="pointer-events-auto max-w-[1620px] w-full rounded-2xl sm:rounded-3xl border transition-all duration-300 p-2 sm:p-2.5 flex flex-col gap-2"
        style={{
          background: isLight ? 'rgba(255, 255, 255, 0.92)' : 'rgba(6, 13, 29, 0.82)',
          backdropFilter: 'blur(32px) saturate(210%)',
          WebkitBackdropFilter: 'blur(32px) saturate(210%)',
          borderColor: isLight ? 'rgba(220, 228, 238, 0.95)' : 'rgba(255, 255, 255, 0.16)',
          boxShadow: isLight
            ? '0 15px 35px -10px rgba(15, 23, 42, 0.08), 0 0 25px -5px rgba(6, 182, 212, 0.15), inset 0 1px 1.5px rgba(255, 255, 255, 1)'
            : '0 25px 60px -15px rgba(0, 0, 0, 0.9), 0 0 40px -8px rgba(6, 182, 212, 0.15), inset 0 1px 1.5px rgba(255, 255, 255, 0.3)'
        }}
      >
        {/* Tier 1: System Identification, Active Focus Incident & Operational Controls */}
        <div className="flex items-center justify-between gap-3 px-2 sm:px-3 pt-0.5">
          {/* Brand Emblem & Sovereignty */}
          <div
            className="flex items-center gap-2.5 cursor-pointer shrink-0 group"
            onClick={() => onSelectTab('landing')}
            title="Return to Maritime Overview Landing Page"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#FF9933] via-white to-[#138808] p-[1.5px] shadow-[0_0_15px_rgba(255,153,51,0.4)] group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-[#070F22] rounded-full flex items-center justify-center font-bold text-cyan-400 text-xs">
                ST
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`font-extrabold tracking-wider text-sm font-sans flex items-center ${isLight ? 'text-slate-900' : 'text-white'}`}>
                SEATRACE<span className="text-[#FF9933]">.AI</span>
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold shadow-inner ${
                isLight ? 'bg-cyan-100 text-cyan-800 border border-cyan-300' : 'bg-cyan-950/70 text-cyan-300 border border-cyan-700/50'
              }`}>
                BHARAT EEZ
              </span>
            </div>
          </div>

          {/* Center: Active Incident Focus Selector in Glass Capsule */}
          <div className={`hidden md:flex items-center gap-2 transition border rounded-full px-3 py-1 shadow-inner max-w-xl ${
            isLight
              ? 'bg-slate-100/90 hover:bg-slate-200/80 border-slate-300/80 text-slate-800'
              : 'bg-white/5 hover:bg-white/10 border-white/12 text-slate-200'
          }`}>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
            <span className={`text-[10px] font-mono uppercase font-bold tracking-wider shrink-0 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Active Focus:
            </span>
            <select
              value={activeIncident?.id || ''}
              onChange={(e) => {
                const found = incidents.find((i) => i.id === e.target.value);
                if (found) onSelectIncident(found);
              }}
              className={`bg-transparent text-xs font-mono focus:outline-none cursor-pointer truncate max-w-[340px] font-semibold ${
                isLight ? 'text-cyan-800' : 'text-cyan-200'
              }`}
            >
              {incidents.map((inc) => (
                <option key={inc.id} value={inc.id} className={isLight ? 'bg-white text-slate-900 py-1' : 'bg-[#070E20] text-slate-200 py-1'}>
                  {inc.id} — {inc.title}
                </option>
              ))}
            </select>
          </div>

          {/* Right Utilities: Live Radar, Sound, Theme Toggle, Clock, Export */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            {/* Live Telemetry Beacon */}
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold border shadow-sm ${
                isBackendOnline
                  ? isLight
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-sm'
                    : 'bg-emerald-950/70 text-emerald-300 border-emerald-500/50 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                  : isLight
                  ? 'bg-amber-50 text-amber-800 border-amber-300'
                  : 'bg-amber-950/70 text-amber-300 border-amber-500/50'
              }`}
              title={isBackendOnline ? 'Real-time telemetry link operational' : 'Offline demo mode'}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isBackendOnline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              <span className="tracking-wider">{isBackendOnline ? 'LIVE RADAR' : 'STANDBY'}</span>
            </div>

            {/* Global Theme Toggle Button */}
            {onToggleTheme && (
              <button
                onClick={onToggleTheme}
                aria-label={isLight ? 'Switch to Dark Night Theme' : 'Switch to Daylight Light Theme'}
                title={isLight ? 'Switch to Dark Night Theme' : 'Switch to Daylight Light Theme'}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition cursor-pointer active:scale-95 text-xs font-mono font-bold ${
                  isLight
                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300/90 shadow-sm'
                    : 'bg-white/5 hover:bg-white/12 text-slate-200 border-white/12'
                }`}
              >
                {isLight ? (
                  <Sun className="w-3.5 h-3.5 text-amber-500 animate-spin" style={{ animationDuration: '24s' }} />
                ) : (
                  <Moon className="w-3.5 h-3.5 text-cyan-300" />
                )}
                <span className="hidden sm:inline">{isLight ? 'LIGHT' : 'DARK'}</span>
              </button>
            )}

            {/* Ambient Hydrophone Audio */}
            <button
              onClick={handleToggleSound}
              className={`p-1.5 rounded-full border transition active:scale-95 cursor-pointer ${
                isLight
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300/80'
                  : 'bg-white/5 hover:bg-white/12 text-slate-300 hover:text-white border-white/10'
              }`}
              title={isAudioMuted ? 'Activate Ocean Hydrophone Audio' : 'Mute Ocean Audio'}
            >
              {isAudioMuted ? (
                <VolumeX className="w-3.5 h-3.5 text-slate-400" />
              ) : (
                <Volume2 className="w-3.5 h-3.5 text-cyan-500 animate-pulse" />
              )}
            </button>

            {/* Atomic Clock */}
            <div className={`hidden lg:flex items-center px-2.5 py-1 rounded-full border font-mono text-[11px] ${
              isLight ? 'bg-slate-100 border-slate-300/80 text-slate-700 font-semibold' : 'bg-white/5 border-white/10 text-slate-200'
            }`}>
              <span className={isLight ? 'text-cyan-800 font-bold' : 'text-cyan-300 font-semibold'}>{timeStr}</span>
            </div>

            {/* Quick Intelligence Dossier Export */}
            <button
              onClick={onQuickExport}
              className="flex items-center gap-1.5 bg-gradient-to-r from-[#FF7A2F] to-[#FF9933] hover:from-[#FF8A3F] hover:to-[#FFA748] text-white font-sans font-bold text-xs px-3.5 py-1 rounded-full shadow-[0_0_20px_rgba(255,122,47,0.35)] transition-all active:scale-95 shrink-0 cursor-pointer"
              title="Download Formal Investigation Dossier"
            >
              <span>📑</span>
              <span className="hidden sm:inline">Export Dossier</span>
              <span className="sm:hidden">Export</span>
            </button>
          </div>
        </div>

        {/* Tier 2: Dedicated Navigation Glass Rail - 100% Unnumbered, Perfectly Centered */}
        <div className={`w-full border-t pt-1.5 flex items-center justify-start lg:justify-center overflow-x-auto scrollbar-none px-1 ${
          isLight ? 'border-slate-200/90' : 'border-white/8'
        }`}>
          <nav className="flex items-center gap-1 sm:gap-1.5 py-0.5">
            {NAV_ITEMS.map((item) => {
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`flex items-center gap-1.5 whitespace-nowrap px-3 py-1.5 rounded-xl text-xs font-sans transition-all duration-200 cursor-pointer ${
                    isActive
                      ? isLight
                        ? 'bg-cyan-50 text-cyan-900 border border-cyan-400 font-bold shadow-sm'
                        : 'bg-gradient-to-r from-cyan-500/25 via-blue-500/20 to-cyan-500/15 text-cyan-200 border border-cyan-400/60 shadow-[0_0_20px_rgba(6,182,212,0.35),inset_0_1px_1px_rgba(255,255,255,0.25)] font-bold'
                      : isLight
                      ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/90 border border-transparent font-medium'
                      : 'text-slate-300 hover:text-white hover:bg-white/10 border border-transparent font-medium'
                  }`}
                >
                  <span className="text-xs leading-none">{item.icon}</span>
                  <span className="tracking-wide">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
};
