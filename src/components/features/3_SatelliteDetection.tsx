import React, { useState, useEffect } from 'react';
import type { Incident, DetectionResult, FeatureTab } from '../../types/seatrace';
import { fetchIncidentDetections } from '../../api/seatraceClient';
import { SeaTraceMap } from '../map/SeaTraceMap';
import { SatelliteHeatmapMap } from '../map/SatelliteHeatmapMap';

interface SatelliteDetectionProps {
  activeIncident: Incident | null;
  onNavigateTab: (tab: FeatureTab) => void;
}

export const SatelliteDetection: React.FC<SatelliteDetectionProps> = ({
  activeIncident,
  onNavigateTab
}) => {
  const [detections, setDetections] = useState<DetectionResult[]>([]);
  const [maskOpacity, setMaskOpacity] = useState(70);
  const [viewMode, setViewMode] = useState<'google' | 'heatmap' | 'overlay' | 'original' | 'mask'>('google');
  const [thresholdDb, setThresholdDb] = useState(-22.5);
  const [leeFilterSize, setLeeFilterSize] = useState('7x7');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!activeIncident) return;
    fetchIncidentDetections(activeIncident.id).then((dets) => {
      setDetections(dets);
    });
  }, [activeIncident]);

  const activeDetection = detections[0] || null;

  const handleRunReDetection = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      // Simulated parameter adjustment
      if (activeDetection) {
        setDetections([
          {
            ...activeDetection,
            area_km2: parseFloat((activeDetection.area_km2 * (1 + (thresholdDb + 22.5) * 0.04)).toFixed(2)),
            slick_confidence: Math.min(0.99, Math.max(0.75, activeDetection.slick_confidence + 0.02))
          }
        ]);
      }
    }, 1200);
  };

  return (
    <div className="space-y-6">
      {/* Title & Metadata Strip */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0A1020]/90 backdrop-blur-md p-6 rounded-2xl border border-white/10 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono text-cyan-400 font-semibold tracking-wider uppercase">
              Feature 3 — SAR Remote Sensing Pipeline
            </span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Synthetic Aperture Radar (SAR) Oil-Spill Segmentation
          </h2>
          <p className="text-slate-400 text-xs mt-1">
            C-Band SAR backscatter damping analysis via adaptive Lee speckle filtering and Otsu / U-Net segmentation.
          </p>
        </div>

        {/* Model Provenance Badge */}
        <div className="flex items-center gap-2 bg-[#0D1527] border border-cyan-500/30 px-3.5 py-2 rounded-xl text-xs font-mono">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
          <div>
            <div className="text-cyan-300 font-bold">ResNet-50 SAR-SlickNet v2.1</div>
            <div className="text-slate-400 text-[10px]">Trained on European Space Agency (ESA) Copernicus</div>
          </div>
        </div>
      </div>

      {/* Main Analysis Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Imagery & Segmentation Canvas */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-[#0A1020] rounded-2xl border border-white/10 overflow-hidden shadow-2xl relative">
            {/* View Mode Controls & Opacity Slider */}
            <div className="p-3 bg-[#0D1527]/90 backdrop-blur-md border-b border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
              <div className="flex items-center gap-1.5 bg-slate-100/90 dark:bg-black/50 p-1 rounded-xl border border-slate-200 dark:border-white/10 shadow-sm">
                <button
                  onClick={() => setViewMode('google')}
                  className={`px-3 py-1.5 rounded-lg text-xs transition flex items-center gap-1.5 cursor-pointer ${
                    viewMode === 'google'
                      ? 'bg-cyan-600 dark:bg-cyan-500 text-white dark:text-black font-bold shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-white/10'
                  }`}
                >
                  <span>🛰️</span> Google Satellite Live
                </button>
                <button
                  onClick={() => setViewMode('heatmap')}
                  className={`px-3 py-1.5 rounded-lg text-xs transition cursor-pointer flex items-center gap-1 ${
                    viewMode === 'heatmap'
                      ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white font-bold shadow-sm'
                      : 'text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-white/10'
                  }`}
                >
                  <span>🔥</span> Spill Heatmap
                </button>
                <button
                  onClick={() => setViewMode('overlay')}
                  className={`px-3 py-1.5 rounded-lg text-xs transition cursor-pointer ${
                    viewMode === 'overlay'
                      ? 'bg-cyan-600 dark:bg-cyan-500 text-white dark:text-black font-bold shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-white/10'
                  }`}
                >
                  Fused Overlay
                </button>
                <button
                  onClick={() => setViewMode('original')}
                  className={`px-3 py-1.5 rounded-lg text-xs transition cursor-pointer ${
                    viewMode === 'original'
                      ? 'bg-cyan-600 dark:bg-cyan-500 text-white dark:text-black font-bold shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-white/10'
                  }`}
                >
                  Raw SAR Backscatter
                </button>
                <button
                  onClick={() => setViewMode('mask')}
                  className={`px-3 py-1.5 rounded-lg text-xs transition cursor-pointer ${
                    viewMode === 'mask'
                      ? 'bg-cyan-600 dark:bg-cyan-500 text-white dark:text-black font-bold shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-white/10'
                  }`}
                >
                  Binary Mask
                </button>
              </div>

              {viewMode === 'overlay' && (
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 dark:text-slate-400 text-[11px]">Mask Opacity:</span>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={maskOpacity}
                    onChange={(e) => setMaskOpacity(parseInt(e.target.value))}
                    className="w-24 accent-orange-500"
                  />
                  <span className="text-orange-500 dark:text-orange-400 font-bold w-8">{maskOpacity}%</span>
                </div>
              )}
            </div>

            {/* Viewport Canvas: Satellite Heatmap, Live Google Satellite, or Synthetic SAR Raster */}
            {viewMode === 'heatmap' ? (
              <div className="w-full">
                <SatelliteHeatmapMap
                  incident={activeIncident}
                  height="460px"
                />
              </div>
            ) : viewMode === 'google' ? (
              <div className="w-full">
                <SeaTraceMap
                  incident={activeIncident}
                  height="460px"
                  defaultMapType="google_satellite"
                  enableLiveTracking={true}
                  mode="detection"
                />
              </div>
            ) : (
              <div className="relative w-full h-[460px] bg-[#070D1A] flex items-center justify-center overflow-hidden">
                {/* Synthetic SAR Ocean Speckle Noise Canvas */}
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundColor: viewMode === 'mask' ? '#020617' : '#0B1324',
                    backgroundImage: viewMode === 'mask' ? 'none' : `
                      radial-gradient(ellipse at 50% 50%, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.95) 70%, rgba(8, 14, 28, 1) 100%),
                      radial-gradient(circle at 20% 80%, rgba(56, 189, 248, 0.08) 0%, transparent 50%),
                      radial-gradient(circle at 80% 20%, rgba(51, 65, 85, 0.3) 0%, transparent 60%)
                    `
                  }}
                >
                  {/* High-frequency SAR Radar Speckle Texture */}
                  {viewMode !== 'mask' && (
                    <div className="w-full h-full opacity-60 bg-[radial-gradient(#94A3B8_1.2px,transparent_1.2px)] [background-size:12px_12px]" />
                  )}
                </div>

                {/* SAR Radar Grid Lines & Coordinates Scale */}
                {viewMode !== 'mask' && (
                  <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-30" viewBox="0 0 800 460">
                    <line x1="100" y1="0" x2="100" y2="460" stroke="#00E5FF" strokeWidth="0.8" strokeDasharray="4 6" />
                    <line x1="300" y1="0" x2="300" y2="460" stroke="#00E5FF" strokeWidth="0.8" strokeDasharray="4 6" />
                    <line x1="500" y1="0" x2="500" y2="460" stroke="#00E5FF" strokeWidth="0.8" strokeDasharray="4 6" />
                    <line x1="700" y1="0" x2="700" y2="460" stroke="#00E5FF" strokeWidth="0.8" strokeDasharray="4 6" />
                    <line x1="0" y1="120" x2="800" y2="120" stroke="#00E5FF" strokeWidth="0.8" strokeDasharray="4 6" />
                    <line x1="0" y1="260" x2="800" y2="260" stroke="#00E5FF" strokeWidth="0.8" strokeDasharray="4 6" />
                    <line x1="0" y1="380" x2="800" y2="380" stroke="#00E5FF" strokeWidth="0.8" strokeDasharray="4 6" />
                  </svg>
                )}

                {/* Damping Slick Visual Representation */}
                <svg
                  className="absolute inset-0 w-full h-full pointer-events-none transition-opacity duration-300"
                  style={{
                    opacity: viewMode === 'mask' ? 1 : viewMode === 'original' ? 0.95 : maskOpacity / 100
                  }}
                  viewBox="0 0 800 460"
                >
                  <defs>
                    {/* Grayscale Raw SAR Damping Gradient (Deep radar shadow absorption) */}
                    <radialGradient id="sarRawDamping" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#020408" stopOpacity="0.95" />
                      <stop offset="65%" stopColor="#060C18" stopOpacity="0.85" />
                      <stop offset="100%" stopColor="#0B1324" stopOpacity="0.3" />
                    </radialGradient>

                    {/* Fused / Colored Segmentation Mask Gradient */}
                    <linearGradient id="slickGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#FF7A2F" stopOpacity={viewMode === 'mask' ? '0.95' : '0.7'} />
                      <stop offset="100%" stopColor="#EF4444" stopOpacity={viewMode === 'mask' ? '0.95' : '0.5'} />
                    </linearGradient>

                    {/* Binary Mask High-Contrast Gradient */}
                    <linearGradient id="binaryMaskGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.95" />
                      <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.95" />
                    </linearGradient>

                    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="4" result="blur" />
                      <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                  </defs>

                  {/* Primary Slick Damping Anomaly */}
                  <path
                    d="M 280 210 Q 340 180 430 190 T 540 230 Q 580 270 510 300 T 360 290 Q 260 270 280 210 Z"
                    fill={
                      viewMode === 'original'
                        ? 'url(#sarRawDamping)'
                        : viewMode === 'mask'
                        ? 'url(#binaryMaskGrad)'
                        : 'url(#slickGrad)'
                    }
                    stroke={
                      viewMode === 'original'
                        ? '#38BDF8'
                        : viewMode === 'mask'
                        ? '#00F0FF'
                        : '#FF7A2F'
                    }
                    strokeWidth={viewMode === 'mask' ? '3' : viewMode === 'original' ? '1.5' : '2'}
                    strokeDasharray={viewMode === 'mask' ? 'none' : viewMode === 'original' ? '2 4' : '4 4'}
                    filter={viewMode === 'original' ? undefined : 'url(#glow)'}
                  />

                  {/* Satellite Dispersal Trail */}
                  <path
                    d="M 430 190 Q 480 150 560 140 T 630 160 Q 600 185 540 190 Z"
                    fill={
                      viewMode === 'original'
                        ? 'url(#sarRawDamping)'
                        : viewMode === 'mask'
                        ? 'url(#binaryMaskGrad)'
                        : 'url(#slickGrad)'
                    }
                    stroke={viewMode === 'original' ? '#38BDF8' : '#FF7A2F'}
                    strokeWidth={viewMode === 'original' ? '1' : '1.5'}
                    opacity={viewMode === 'original' ? 0.8 : 0.85}
                  />

                  {/* Core Damping Marker */}
                  <circle
                    cx="410"
                    cy="240"
                    r={viewMode === 'original' ? 5 : 6}
                    fill={viewMode === 'original' ? '#00E5FF' : '#EF4444'}
                  />
                  <text
                    x="424"
                    y="244"
                    fill="#FFFFFF"
                    fontSize="11"
                    fontFamily="JetBrains Mono"
                    fontWeight="bold"
                    style={{ textShadow: '0 2px 6px rgba(0,0,0,0.9)' }}
                  >
                    {viewMode === 'original'
                      ? 'Radar Damping Depr. (σ₀ = -24.8 dB, Δ = -6.2 dB)'
                      : 'Peak Damping Core (σ₀ = -24.8 dB)'}
                  </text>

                  {/* Vessel Radar Bright Targets (Corner Reflector Echoes) */}
                  {viewMode !== 'mask' && (
                    <g>
                      <circle cx="210" cy="140" r="3.5" fill="#FFFFFF" />
                      <circle cx="210" cy="140" r="7" stroke="#00E5FF" strokeWidth="1" fill="none" />
                      <text x="224" y="144" fill="#E2E8F0" fontSize="9" fontFamily="JetBrains Mono" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.9)' }}>
                        Ship Target #1 (+22 dB)
                      </text>

                      <circle cx="680" cy="320" r="3.5" fill="#FFFFFF" />
                      <circle cx="680" cy="320" r="7" stroke="#00E5FF" strokeWidth="1" fill="none" />
                      <text x="694" y="324" fill="#E2E8F0" fontSize="9" fontFamily="JetBrains Mono" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.9)' }}>
                        Ship Target #2 (+19 dB)
                      </text>
                    </g>
                  )}
                </svg>

                {/* Geographic & Radar Metadata HUD Grid */}
                <div className="absolute top-4 left-4 font-mono text-[11px] text-slate-200 bg-black/75 backdrop-blur-md p-2.5 rounded-xl border border-white/15 space-y-0.5 pointer-events-none shadow-lg">
                  <div>SENSOR: <span className="text-cyan-400 font-bold">Sentinel-1B C-Band (5.405 GHz)</span></div>
                  <div>MODE: <span className="text-cyan-400 font-bold">{viewMode === 'original' ? 'RAW RADAR BACKSCATTER (VV)' : viewMode === 'mask' ? 'U-NET BINARY CLASSIFIER' : 'FUSED POLARIMETRIC OVERLAY'}</span></div>
                  <div>SCENE ID: <span className="text-slate-300">S1B_IW_GRDH_1SDV_20261023T041520</span></div>
                  <div>SURFACE NRCS: <span className="text-emerald-400 font-bold">σ₀ Clutter -18.6 dB / Damped -24.8 dB</span></div>
                  <div>RES: <span className="text-emerald-400">10m Pixel Spacing</span></div>
                </div>

                {/* Bottom Area Calculation Banner */}
                <div className="absolute bottom-4 right-4 font-mono text-xs text-white bg-slate-900/90 backdrop-blur-md px-4 py-2 rounded-xl border border-orange-500/50 shadow-2xl">
                  <span className="text-orange-400 font-bold">SEGMENTED SLICK:</span>{' '}
                  <span style={{ color: '#FFFFFF' }} className="font-bold">
                    {activeDetection?.area_km2 || 14.82} km²
                  </span>
                  <span className="text-slate-300 ml-2">
                    | CONF: {(((activeDetection?.slick_confidence || 0.94) * 100)).toFixed(1)}%
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Quick Workflow Action */}
          <div className="flex items-center justify-between p-4 bg-[#0A1020] rounded-xl border border-white/5 font-mono text-xs">
            <span className="text-slate-400">Next Stage: Screen against biogenic look-alikes and low-wind fields.</span>
            <button
              onClick={() => onNavigateTab('validation')}
              className="px-4 py-2 bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-200 border border-cyan-400/30 rounded-lg transition"
            >
              Proceed to Validation Review →
            </button>
          </div>
        </div>

        {/* Right 1 Col: SAR Algorithm Parameters & Telemetry */}
        <div className="space-y-4">
          <div className="bg-[#0A1020]/90 backdrop-blur-md p-5 rounded-2xl border border-white/10 shadow-xl space-y-4">
            <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider pb-2 border-b border-white/5 flex items-center gap-2">
              <span>⚙️</span> Detection Parameters
            </h3>

            {/* Threshold Slider */}
            <div className="space-y-1.5 font-mono text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Backscatter Cutoff (σ₀):</span>
                <span className="text-cyan-300 font-bold">{thresholdDb} dB</span>
              </div>
              <input
                type="range"
                min="-30"
                max="-15"
                step="0.5"
                value={thresholdDb}
                onChange={(e) => setThresholdDb(parseFloat(e.target.value))}
                className="w-full accent-cyan-400"
              />
              <div className="text-[10px] text-slate-500">Separates specular oil damping from background ocean clutter</div>
            </div>

            {/* Filter Size */}
            <div className="space-y-1 font-mono text-xs">
              <label className="text-slate-400 block">Adaptive Lee Filter Kernel:</label>
              <select
                value={leeFilterSize}
                onChange={(e) => setLeeFilterSize(e.target.value)}
                className="w-full bg-[#0D1527] border border-white/10 rounded-lg p-2 text-white"
              >
                <option value="5x5">5x5 (High Detail, Medium Noise)</option>
                <option value="7x7">7x7 (Balanced Spatial Averaging - Standard)</option>
                <option value="9x9">9x9 (Aggressive Smoothing, Large Spills)</option>
              </select>
            </div>

            {/* Re-Run Processing Button */}
            <button
              onClick={handleRunReDetection}
              disabled={isProcessing}
              className="w-full py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-mono font-bold text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Recomputing SAR Mask...
                </>
              ) : (
                'Re-run Segmentation Pipeline'
              )}
            </button>
          </div>

          {/* Quantitative Metrics */}
          <div className="bg-[#0A1020]/90 backdrop-blur-md p-5 rounded-2xl border border-white/10 shadow-xl space-y-3 font-mono text-xs">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider pb-2 border-b border-white/5">
              📊 Detection Telemetry
            </h3>

            <div className="space-y-2 text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-400">Damped Area:</span>
                <span className="text-orange-400 font-bold">{activeDetection?.area_km2 || 14.82} km²</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Class Confidence:</span>
                <span className="text-emerald-400 font-bold">{((activeDetection?.slick_confidence || 0.94) * 100).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Dark Pixels Classified:</span>
                <span className="text-slate-200">{(activeDetection?.dark_pixel_count || 14820).toLocaleString()} px</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Orbit Pass:</span>
                <span className="text-slate-200">Descending Track 114</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Incidence Angle:</span>
                <span className="text-slate-200">38.4° (Mid-swath)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
