import { X, Sliders, Camera, Sun, Waves, Eye, Volume2, RotateCcw } from 'lucide-react';
import type { SceneTweaks } from '../canvas/SceneCanvas';

import { SCENE_CONFIG } from '../../constants/sceneConfig';
import { oceanAudio } from '../../utils/audio';

interface SceneDirectorHUDProps {
  isOpen: boolean;
  onClose: () => void;
  tweaks: SceneTweaks;
  onUpdateTweaks: (newTweaks: Partial<SceneTweaks>) => void;
  onSelectShot: (shotIndex: number) => void;
  currentShotIndex: number;
}

export const SceneDirectorHUD: React.FC<SceneDirectorHUDProps> = ({
  isOpen,
  onClose,
  tweaks,
  onUpdateTweaks,
  onSelectShot,
  currentShotIndex,
}) => {
  if (!isOpen) return null;

  const cameraPresets = [
    { label: '3/4 Bow Establishing', idx: 0 },
    { label: 'Side Profile Cruising', idx: 1 },
    { label: 'Low Waterline Bow', idx: 2 },
    { label: 'High Aerial Drone', idx: 3 },
    { label: 'Sunset Stern Departure', idx: 4 },
  ];

  const handleResetDefaults = () => {
    onUpdateTweaks({
      waveHeight: SCENE_CONFIG.ocean.waveHeight,
      shipSpeed: SCENE_CONFIG.ship.speed,
      sunAltitude: SCENE_CONFIG.lighting.sunAltitude,
      bloomStrength: SCENE_CONFIG.lighting.bloomStrength,
      isOrbitMode: false,
    });
  };

  return (
    <div className="fixed top-24 right-6 sm:right-8 z-50 w-80 sm:w-96 glass-panel rounded-3xl border border-white/20 shadow-2xl overflow-hidden p-6 animate-fade-in text-slate-200">
      <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-[#FF7A2F]" />
          <span className="font-heading font-bold text-sm text-white tracking-wide">
            3D SCENE DIRECTOR
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleResetDefaults}
            title="Reset to Reference Defaults"
            className="p-1.5 rounded-lg glass-pill text-slate-400 hover:text-white transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg glass-pill text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="space-y-5 text-xs font-mono-code">
        {/* Camera Mode Toggle */}
        <div>
          <span className="text-[10px] uppercase text-slate-400 font-bold block mb-2">
            CAMERA CONTROLLER
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onUpdateTweaks({ isOrbitMode: false })}
              className={`p-2.5 rounded-xl border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                !tweaks.isOrbitMode
                  ? 'bg-[#FF7A2F] border-[#FF7A2F] text-white font-bold shadow-md'
                  : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Cinematic</span>
            </button>
            <button
              onClick={() => onUpdateTweaks({ isOrbitMode: true })}
              className={`p-2.5 rounded-xl border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                tweaks.isOrbitMode
                  ? 'bg-[#FF7A2F] border-[#FF7A2F] text-white font-bold shadow-md'
                  : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>360° Free Orbit</span>
            </button>
          </div>
          {tweaks.isOrbitMode && (
            <p className="text-[10px] text-cyan-400 mt-1.5">
              Click & drag to rotate vessel • Scroll wheel to zoom
            </p>
          )}
        </div>

        {/* Cinematic Presets */}
        {!tweaks.isOrbitMode && (
          <div>
            <span className="text-[10px] uppercase text-slate-400 font-bold block mb-2">
              CAMERA ANGLE PRESETS
            </span>
            <div className="grid grid-cols-1 gap-1.5 max-h-32 overflow-y-auto pr-1">
              {cameraPresets.map((shot) => (
                <button
                  key={shot.idx}
                  onClick={() => onSelectShot(shot.idx)}
                  className={`p-2 rounded-lg text-left transition-colors flex items-center justify-between cursor-pointer ${
                    currentShotIndex === shot.idx
                      ? 'bg-white/15 text-[#FFC15A] font-bold border border-[#FFC15A]/30'
                      : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-transparent'
                  }`}
                >
                  <span>{shot.label}</span>
                  <span className="text-[10px] text-slate-400">Shot {shot.idx + 1}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Ocean Wave Height Slider */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="flex items-center gap-1.5 text-slate-300">
              <Waves className="w-3.5 h-3.5 text-cyan-400" />
              <span>Wave Swell Amplitude</span>
            </span>
            <span className="text-white font-bold">{tweaks.waveHeight.toFixed(2)}m</span>
          </div>
          <input
            type="range"
            min="0.2"
            max="2.5"
            step="0.05"
            value={tweaks.waveHeight}
            onChange={(e) => onUpdateTweaks({ waveHeight: parseFloat(e.target.value) })}
            className="w-full accent-[#FF7A2F] cursor-pointer"
          />
        </div>

        {/* Sun Altitude (Time of Day) Slider */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="flex items-center gap-1.5 text-slate-300">
              <Sun className="w-3.5 h-3.5 text-[#FFC15A]" />
              <span>Sun Altitude (Time of Day)</span>
            </span>
            <span className="text-white font-bold">{tweaks.sunAltitude.toFixed(1)}°</span>
          </div>
          <input
            type="range"
            min="-1.5"
            max="18.0"
            step="0.5"
            value={tweaks.sunAltitude}
            onChange={(e) => onUpdateTweaks({ sunAltitude: parseFloat(e.target.value) })}
            className="w-full accent-[#FFC15A] cursor-pointer"
          />
          <div className="flex justify-between text-[9px] text-slate-400 mt-1">
            <span>Dusk Twilight</span>
            <span>Horizon Golden Hour</span>
            <span>Late Afternoon</span>
          </div>
        </div>

        {/* Bloom Glow Intensity */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-slate-300">Sunset Bloom Corona</span>
            <span className="text-white font-bold">{tweaks.bloomStrength.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min="0.2"
            max="2.0"
            step="0.1"
            value={tweaks.bloomStrength}
            onChange={(e) => onUpdateTweaks({ bloomStrength: parseFloat(e.target.value) })}
            className="w-full accent-[#FF7A2F] cursor-pointer"
          />
        </div>

        {/* Quick Audio Blast */}
        <div className="pt-2 border-t border-white/10">
          <button
            onClick={() => oceanAudio.playFogHorn()}
            className="w-full py-2.5 rounded-xl glass-pill hover:bg-white/15 text-xs text-[#FFC15A] font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>BLAST VESSEL FOGHORN</span>
          </button>
        </div>
      </div>
    </div>
  );
};
