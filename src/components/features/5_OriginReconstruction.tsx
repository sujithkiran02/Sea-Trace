import React, { useState, useEffect } from 'react';
import type { Incident, DriftRun, FeatureTab } from '../../types/seatrace';
import { fetchIncidentDriftRuns, runDriftReconstruction } from '../../api/seatraceClient';
import { SeaTraceMap } from '../map/SeaTraceMap';
import { DriftEnsembleSnapshot } from './DriftEnsembleSnapshot';

interface OriginReconstructionProps {
  activeIncident: Incident | null;
  onRefreshIncident: () => void;
  onNavigateTab: (tab: FeatureTab) => void;
}

export const OriginReconstruction: React.FC<OriginReconstructionProps> = ({
  activeIncident,
  onRefreshIncident,
  onNavigateTab
}) => {
  const [driftRuns, setDriftRuns] = useState<DriftRun[]>([]);

  // Simulation parameters (Reference Image defaults)
  const [timeWindowHours, setTimeWindowHours] = useState(24);
  const [particleCount, setParticleCount] = useState(1000);
  const [windageLeeway, setWindageLeeway] = useState(0.03); // 3.0%
  const [deflectionDeg, setDeflectionDeg] = useState(20.0); // 20° Right
  const [envDataSource, setEnvDataSource] = useState('HYCOM + ECMWF ERA5 (10m Wind)');
  
  // Timeline playback & scrubbing state
  const [timeScrubber, setTimeScrubber] = useState(-18); // Default -18h matching reference image
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simMessage, setSimMessage] = useState('');

  useEffect(() => {
    if (!activeIncident) return;
    fetchIncidentDriftRuns(activeIncident.id).then((runs) => {
      setDriftRuns(runs);
    });
  }, [activeIncident]);

  const activeDriftRun = driftRuns[0] || null;

  // Animation timeline loop: advances backwards in time or forward smoothly
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setTimeScrubber((prev) => {
        if (prev >= 0) return -24;
        return prev + 1;
      });
    }, 750);
    return () => clearInterval(interval);
  }, [isPlaying]);

  const handleLaunchSimulation = async () => {
    if (!activeIncident) return;

    try {
      setIsSimulating(true);
      setSimMessage('');

      const result = await runDriftReconstruction(activeIncident.id, {
        time_window_hours: timeWindowHours,
        particle_count: particleCount,
        windage_leeway: windageLeeway,
        current_deflection_deg: deflectionDeg
      });

      setDriftRuns([result, ...driftRuns]);
      setSimMessage(`Reconstruction completed! Origin estimated at ${result.origin_lat.toFixed(4)}°N, ${result.origin_lng.toFixed(4)}°E (±${result.origin_uncertainty_km} km)`);
      onRefreshIncident();
    } catch (err: any) {
      alert(err.message || 'Simulation error');
    } finally {
      setIsSimulating(false);
    }
  };

  // Calculate formatted IST timestamp for scrubber display
  const getScrubbedDate = (hoursOffset: number) => {
    const base = new Date('2026-09-14T10:30:00+05:30');
    const target = new Date(base.getTime() + hoursOffset * 3600 * 1000);
    const yr = target.getFullYear();
    const mo = String(target.getMonth() + 1).padStart(2, '0');
    const da = String(target.getDate()).padStart(2, '0');
    const hr = String(target.getHours()).padStart(2, '0');
    const mi = String(target.getMinutes()).padStart(2, '0');
    return `${yr}-${mo}-${da} ${hr}:${mi} IST`;
  };

  return (
    <div className="space-y-5 font-sans text-slate-800 dark:text-slate-100">
      {/* 1. TOP HEADER BANNER (Matching Reference Image) */}
      <div className="bg-white dark:bg-[#0B132B] border border-slate-200/90 dark:border-white/10 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-bold text-cyan-600 dark:text-cyan-400 tracking-wider uppercase">
              FEATURE 5 — REVERSE OCEAN MODELING
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Lagrangian Backward Drift &amp; Spill Origin Reconstruction
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-3xl leading-relaxed">
            Backtrack historical slick movements using HYCOM/INCOIS ocean current vectors and ECMWF ERA5 10m wind fields to estimate probable release zone and time window.
          </p>
        </div>

        {/* Right Active Incident Pill */}
        <div className="bg-slate-50 dark:bg-[#070D1E] border border-slate-200/80 dark:border-cyan-500/30 rounded-xl px-4 py-2.5 flex items-center gap-3 shrink-0 shadow-xs">
          <div className="w-8 h-8 rounded-full bg-cyan-100 dark:bg-cyan-950 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
            <span className="text-sm">📍</span>
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">
              Active Incident
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-900 dark:text-cyan-300">
                {activeIncident?.id || 'IN-2026-61C2'}
              </span>
              <span className="bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-700/50">
                VALIDATED
              </span>
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[190px]">
              {activeIncident?.title || 'Kandla Deepwater Fairway'}
            </div>
          </div>
        </div>
      </div>

      {simMessage && (
        <div className="p-3.5 bg-cyan-50 dark:bg-cyan-950/80 border border-cyan-200 dark:border-cyan-500/40 rounded-xl text-cyan-900 dark:text-cyan-200 text-xs font-mono flex items-center gap-2">
          <span>⚓</span> {simMessage}
        </div>
      )}

      {/* 2. MAIN MIDDLE GRID: MAP (2 Cols) + LAGRANGIAN DRIFT SETTINGS (1 Col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left 2 Cols: Main GIS Satellite Map */}
        <div className="lg:col-span-2">
          <SeaTraceMap
            incident={activeIncident}
            driftRun={activeDriftRun}
            height="520px"
            mode="drift"
            timeScrubber={timeScrubber}
            defaultMapType="google_hybrid"
          />
        </div>

        {/* Right 1 Col: LAGRANGIAN DRIFT SETTINGS (Matching Reference Image) */}
        <div className="bg-white dark:bg-[#0B132B] border border-slate-200/90 dark:border-white/10 rounded-2xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2 pb-2.5 border-b border-slate-100 dark:border-white/10">
              <span className="text-cyan-600 dark:text-cyan-400 text-sm">⚙</span> LAGRANGIAN DRIFT SETTINGS
            </h2>

            {/* Backtrack Window */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-600 dark:text-slate-400 font-medium">Backtrack Window:</span>
                <span className="text-cyan-600 dark:text-cyan-400 font-bold text-sm">{timeWindowHours} Hours</span>
              </div>
              <input
                type="range"
                min="6"
                max="72"
                step="6"
                value={timeWindowHours}
                onChange={(e) => setTimeWindowHours(parseInt(e.target.value))}
                className="w-full accent-cyan-600 dark:accent-cyan-400 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                <span>6 h</span>
                <span>24 h</span>
                <span>72 h</span>
              </div>
            </div>

            {/* Particle Ensemble */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-600 dark:text-slate-400 font-medium">Particle Ensemble:</span>
                <span className="text-cyan-600 dark:text-cyan-400 font-bold">{particleCount} Particles</span>
              </div>
              <select
                value={particleCount}
                onChange={(e) => setParticleCount(parseInt(e.target.value))}
                className="w-full bg-slate-50 dark:bg-[#070D1E] border border-slate-200 dark:border-white/15 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
              >
                <option value="1000">1000 (Standard Forensic Mode)</option>
                <option value="500">500 (Fast Reconnaissance)</option>
                <option value="2500">2500 (High-Precision Ensemble)</option>
              </select>
            </div>

            {/* Windage Leeway */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-600 dark:text-slate-400 font-medium">Windage Leeway:</span>
                <span className="text-red-500 dark:text-red-400 font-bold">{(windageLeeway * 100).toFixed(1)}%</span>
              </div>
              <input
                type="range"
                min="0.005"
                max="0.05"
                step="0.005"
                value={windageLeeway}
                onChange={(e) => setWindageLeeway(parseFloat(e.target.value))}
                className="w-full accent-cyan-600 dark:accent-cyan-400 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                <span>0.5%</span>
                <span>2.5%</span>
                <span>5%</span>
              </div>
            </div>

            {/* Coriolis Deflection */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-600 dark:text-slate-400 font-medium">Coriolis Deflection:</span>
                <span className="text-cyan-600 dark:text-cyan-400 font-bold">{deflectionDeg}° Right</span>
              </div>
              <input
                type="range"
                min="0"
                max="40"
                step="5"
                value={deflectionDeg}
                onChange={(e) => setDeflectionDeg(parseFloat(e.target.value))}
                className="w-full accent-cyan-600 dark:accent-cyan-400 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                <span>0°</span>
                <span>20°</span>
                <span>40°</span>
              </div>
            </div>

            {/* Environmental Data Source */}
            <div className="space-y-1.5">
              <label className="text-xs text-slate-600 dark:text-slate-400 font-medium block">
                Environmental Data Source:
              </label>
              <select
                value={envDataSource}
                onChange={(e) => setEnvDataSource(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#070D1E] border border-slate-200 dark:border-white/15 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
              >
                <option value="HYCOM + ECMWF ERA5 (10m Wind)">HYCOM + ECMWF ERA5 (10m Wind)</option>
                <option value="INCOIS ROMS High-Res 1/12° + NCMRWF">INCOIS ROMS High-Res 1/12° + NCMRWF</option>
                <option value="Copernicus Marine Service (CMEMS) Global">Copernicus Marine Service (CMEMS) Global</option>
                <option value="NOAA GFS + Blended Sea Winds">NOAA GFS + Blended Sea Winds</option>
              </select>
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={handleLaunchSimulation}
            disabled={isSimulating}
            className="w-full py-3 bg-[#0284C7] hover:bg-[#0369A1] text-white font-bold rounded-xl shadow-md transition flex items-center justify-center gap-2 text-sm cursor-pointer disabled:opacity-50"
          >
            {isSimulating ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <span>Reconstructing Lagrangian Plume...</span>
              </>
            ) : (
              <>
                <span className="text-xs">▶</span>
                <span>Run Backward Drift Reconstruction</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 3. BOTTOM ROW: 3 EQUAL-HEIGHT CARDS (1:1 with Reference Image) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Trajectory Time Scrubber */}
        <div className="bg-white dark:bg-[#0B132B] border border-slate-200/90 dark:border-white/10 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span className="text-cyan-600 dark:text-cyan-400">⏱</span> Trajectory Time Scrubber
              </div>
              <div className="text-right">
                <div className="text-[10px] text-slate-400 font-mono">Detection Time</div>
                <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 font-mono">2026-09-14 10:30 IST</div>
              </div>
            </div>

            <div className="space-y-3 py-2">
              <div className="text-center font-bold text-cyan-600 dark:text-cyan-400 text-sm font-mono">
                {timeScrubber === 0 ? 'T-0 (Detection)' : `T${timeScrubber} hours`}
              </div>
              <input
                type="range"
                min="-24"
                max="0"
                step="1"
                value={timeScrubber}
                onChange={(e) => setTimeScrubber(parseInt(e.target.value))}
                className="w-full accent-cyan-600 dark:accent-cyan-400 cursor-pointer h-2 bg-slate-200 dark:bg-slate-700 rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                <span>-24h</span>
                <span>-18h</span>
                <span>-12h</span>
                <span>-6h</span>
                <span>0h</span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
            {/* Playback Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setTimeScrubber((prev) => Math.max(-24, prev - 3))}
                className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 text-slate-700 dark:text-white text-xs flex items-center justify-center transition cursor-pointer"
                title="Step -3h"
              >
                ⏮
              </button>
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className={`w-7 h-7 rounded-lg text-xs flex items-center justify-center transition cursor-pointer font-bold ${
                  isPlaying
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'bg-cyan-600 text-white shadow-sm hover:bg-cyan-700'
                }`}
                title={isPlaying ? 'Pause Playback' : 'Play Timeline Animation'}
              >
                {isPlaying ? '⏸' : '▶'}
              </button>
              <button
                onClick={() => setTimeScrubber((prev) => Math.min(0, prev + 3))}
                className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 text-slate-700 dark:text-white text-xs flex items-center justify-center transition cursor-pointer"
                title="Step +3h"
              >
                ⏭
              </button>
            </div>

            {/* Calculated Date Stamp Badge */}
            <div className="px-3 py-1 rounded-lg bg-slate-50 dark:bg-[#070D1E] border border-slate-200/80 dark:border-white/10 text-[11px] font-mono text-slate-700 dark:text-slate-300 flex items-center gap-1.5 shadow-2xs">
              <span>📅</span>
              <span>{getScrubbedDate(timeScrubber)}</span>
            </div>
          </div>
        </div>

        {/* Card 2: Drift Ensemble Animation (Snapshot) */}
        <div className="bg-white dark:bg-[#0B132B] border border-slate-200/90 dark:border-white/10 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span className="text-cyan-600 dark:text-cyan-400">🌊</span> Drift Ensemble Animation (Snapshot)
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                <span>Particle Density</span>
                <div className="flex items-center gap-1">
                  <span>High</span>
                  <div
                    className="w-12 h-2 rounded shadow-2xs"
                    style={{
                      background: 'linear-gradient(to right, #EF4444, #FACC15, #10B981, #06B6D4, #2563EB)'
                    }}
                  />
                  <span>Low</span>
                </div>
              </div>
            </div>

            {/* Canvas probability cloud snapshot */}
            <DriftEnsembleSnapshot
              driftRun={activeDriftRun}
              timeScrubber={timeScrubber}
            />
          </div>

          <div className="pt-2.5 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-mono">
            <span className="w-5 h-2.5 rounded-full border border-dashed border-red-500 inline-block"></span>
            <span>Estimated Origin Zone (95% CI)</span>
          </div>
        </div>

        {/* Card 3: Reconstructed Release Zone */}
        <div className="bg-white dark:bg-[#0B132B] border border-slate-200/90 dark:border-white/10 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100 dark:border-white/10">
              <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span className="text-cyan-600 dark:text-cyan-400">⚙</span> Reconstructed Release Zone
              </div>
              <span className="bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-300/60 dark:border-emerald-700/50">
                SOLVED
              </span>
            </div>

            {/* Parameters Table matching Reference Image */}
            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <span>📍</span> Origin Centre:
                </span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {activeDriftRun ? `${activeDriftRun.origin_lat.toFixed(4)}°N, ${activeDriftRun.origin_lng.toFixed(4)}°E` : '23.1188°N, 69.8908°E'}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400 pl-5">
                  Spatial Uncertainty:
                </span>
                <span className="font-bold text-red-500 dark:text-red-400">
                  ±{activeDriftRun?.origin_uncertainty_km || 2} km (95% CI)
                </span>
              </div>

              <div className="flex justify-between items-start">
                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <span>⏱</span> Release Window:
                </span>
                <div className="text-right">
                  <div className="font-bold text-slate-900 dark:text-white">
                    ~{activeDriftRun?.time_window_hours || 18} hours prior to detection
                  </div>
                  <div className="text-[10px] text-slate-400 dark:text-slate-500">
                    2026-09-13 16:00 - 2026-09-13 20:00 IST
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <span>📑</span> Model Confidence:
                </span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  82%
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <span>⚙</span> Model Engine:
                </span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  OpenDrift v1.9.0
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <span>🌊</span> Environmental Forcing:
                </span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  HYCOM + ECMWF ERA5
                </span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-white/5">
            <button
              onClick={() => onNavigateTab('vessels')}
              className="w-full py-2 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold rounded-xl shadow-xs transition text-xs cursor-pointer"
            >
              Search Vessels in Origin Box →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
