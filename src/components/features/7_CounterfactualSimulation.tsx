import React, { useState, useEffect } from 'react';
import type { Incident, CounterfactualScenario, VesselCandidate, FeatureTab } from '../../types/seatrace';
import { fetchCounterfactualScenarios, runCounterfactualScenario } from '../../api/seatraceClient';
import { SeaTraceMap } from '../map/SeaTraceMap';

interface CounterfactualSimulationProps {
  activeIncident: Incident | null;
  candidateVessel?: VesselCandidate | null;
  onNavigateTab: (tab: FeatureTab) => void;
}

export const CounterfactualSimulation: React.FC<CounterfactualSimulationProps> = ({
  activeIncident,
  candidateVessel,
  onNavigateTab
}) => {
  const [scenarios, setScenarios] = useState<CounterfactualScenario[]>([]);

  // Form State
  const [scenarioName, setScenarioName] = useState('Scenario A: Candidate Release at CPA');
  const [releaseLat, setReleaseLat] = useState('19.3400');
  const [releaseLng, setReleaseLng] = useState('71.2100');
  const [simVolume, setSimVolume] = useState('120.0');
  const [isSimulating, setIsSimulating] = useState(false);
  const [activeScenario, setActiveScenario] = useState<CounterfactualScenario | null>(null);
  const [simViewMode, setSimViewMode] = useState<'map' | 'vector'>('map');

  useEffect(() => {
    if (!activeIncident) return;
    fetchCounterfactualScenarios(activeIncident.id).then((scens) => {
      setScenarios(scens);
      if (scens.length > 0) setActiveScenario(scens[0]);
    });

    if (candidateVessel) {
      setScenarioName(`Scenario: Hypothesized Release from ${candidateVessel.vessel_name}`);
      // Offset slightly to simulate candidate position
      setReleaseLat((activeIncident.lat - 0.04).toFixed(4));
      setReleaseLng((activeIncident.lng - 0.05).toFixed(4));
    }
  }, [activeIncident, candidateVessel]);

  const handleRunSimulation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeIncident) return;

    try {
      setIsSimulating(true);
      const res = await runCounterfactualScenario(activeIncident.id, {
        scenario_name: scenarioName,
        vessel_id: candidateVessel?.id,
        release_lat: parseFloat(releaseLat) || activeIncident.lat,
        release_lng: parseFloat(releaseLng) || activeIncident.lng,
        release_time: new Date().toISOString(),
        simulated_volume_m3: parseFloat(simVolume) || 120.0
      });

      setScenarios([res, ...scenarios]);
      setActiveScenario(res);
    } catch (err: any) {
      alert(err.message || 'Counterfactual simulation failed');
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0A1020]/90 backdrop-blur-md p-6 rounded-2xl border border-white/10 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono text-cyan-400 font-semibold tracking-wider uppercase">
              Feature 7 — Hypothesis Testing
            </span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Counterfactual Forward Advection &amp; Plausibility Verification
          </h2>
          <p className="text-slate-400 text-xs mt-1">
            Test hypothetical discharges from candidate positions to determine if forward ocean drift reproduces the observed satellite slick.
          </p>
        </div>

        <div className="bg-[#0D1527] px-4 py-2 rounded-xl border border-white/10 font-mono text-xs text-right">
          <div className="text-slate-400 text-[10px]">Active Incident</div>
          <div className="text-cyan-300 font-bold">{activeIncident?.id || 'None'}</div>
        </div>
      </div>

      {/* Grid: Scenario Form & Dual Footprint Visualizer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Scenario Input Configuration (1 Col) */}
        <div className="space-y-4">
          <form onSubmit={handleRunSimulation} className="bg-[#0A1020]/90 backdrop-blur-md p-5 rounded-2xl border border-white/10 shadow-xl space-y-4 font-mono text-xs">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider pb-2 border-b border-white/5 flex items-center gap-2">
              <span>🧪</span> Scenario Parameters
            </h3>

            <div>
              <label className="text-slate-400 block mb-1">Scenario Label:</label>
              <input
                type="text"
                required
                value={scenarioName}
                onChange={(e) => setScenarioName(e.target.value)}
                className="w-full bg-[#0D1527] border border-white/10 rounded-lg p-2 text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-400 block mb-1">Hypothetical Lat (°N):</label>
                <input
                  type="text"
                  required
                  value={releaseLat}
                  onChange={(e) => setReleaseLat(e.target.value)}
                  className="w-full bg-[#0D1527] border border-white/10 rounded-lg p-2 text-white"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Hypothetical Lng (°E):</label>
                <input
                  type="text"
                  required
                  value={releaseLng}
                  onChange={(e) => setReleaseLng(e.target.value)}
                  className="w-full bg-[#0D1527] border border-white/10 rounded-lg p-2 text-white"
                />
              </div>
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Discharge Volume (m³):</label>
              <input
                type="number"
                value={simVolume}
                onChange={(e) => setSimVolume(e.target.value)}
                className="w-full bg-[#0D1527] border border-white/10 rounded-lg p-2 text-white"
              />
            </div>

            <button
              type="submit"
              disabled={isSimulating}
              className="w-full py-2.5 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 text-white font-bold rounded-xl shadow-lg transition flex items-center justify-center gap-2"
            >
              {isSimulating ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Advecting Hypothesis Forward...
                </>
              ) : (
                'Run Counterfactual Verification'
              )}
            </button>
          </form>

          {/* Past Tested Scenarios List */}
          <div className="bg-[#0A1020]/90 backdrop-blur-md p-5 rounded-2xl border border-white/10 shadow-xl space-y-3 font-mono text-xs">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider pb-2 border-b border-white/5">
              📁 Tested Scenarios ({scenarios.length})
            </h3>

            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
              {scenarios.map((sc) => {
                const isSelected = activeScenario?.id === sc.id;
                const isPlausible = sc.verdict === 'PLAUSIBLE_SOURCE';

                return (
                  <div
                    key={sc.id}
                    onClick={() => setActiveScenario(sc)}
                    className={`p-3 rounded-xl border cursor-pointer transition ${
                      isSelected ? 'bg-cyan-950/40 border-cyan-500/50' : 'bg-[#0D1527] border-white/5'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white truncate max-w-[160px]">{sc.scenario_name}</span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          isPlausible
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-red-500/20 text-red-400 border border-red-500/30'
                        }`}
                      >
                        {sc.overall_correlation}%
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">Offset: {sc.centroid_offset_km.toFixed(1)} km</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Dual Footprint Overlay Visualization & Correlation Metrics (2 Cols) */}
        <div className="lg:col-span-2 space-y-4 font-mono text-xs">
          {/* Header Controls for Canvas */}
          <div className="flex items-center justify-between bg-[#0A1020] p-2.5 rounded-xl border border-white/10">
            <span className="font-bold text-white flex items-center gap-2">
              <span className="text-purple-400">🧪</span> HYPOTHETICAL DISCHARGE VS OBSERVED SLICK
            </span>
            <div className="flex items-center gap-1 bg-black/40 p-1 rounded-lg">
              <button
                type="button"
                onClick={() => setSimViewMode('map')}
                className={`px-3 py-1 rounded text-xs font-bold transition flex items-center gap-1.5 ${
                  simViewMode === 'map' ? 'bg-cyan-500 text-black shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>🛰️</span> Google Maps Live
              </button>
              <button
                type="button"
                onClick={() => setSimViewMode('vector')}
                className={`px-3 py-1 rounded text-xs font-bold transition flex items-center gap-1.5 ${
                  simViewMode === 'vector' ? 'bg-cyan-500 text-black shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>📐</span> Vector Geometry
              </button>
            </div>
          </div>

          {/* Visual Footprint Canvas: Google Maps vs Vector */}
          {simViewMode === 'map' ? (
            <div className="w-full">
              <SeaTraceMap
                incident={activeIncident}
                hypotheticalDrift={{
                  releaseLat: parseFloat(releaseLat) || ((activeIncident?.lat || 19.4) - 0.04),
                  releaseLng: parseFloat(releaseLng) || ((activeIncident?.lng || 71.3) - 0.05),
                  scenarioName: scenarioName
                }}
                height="420px"
                defaultMapType="google_hybrid"
                enableLiveTracking={true}
              />
            </div>
          ) : (
            <div className="bg-[#0A1020] rounded-2xl border border-white/10 overflow-hidden shadow-2xl relative h-[420px] flex items-center justify-center">
            {/* Dark Ocean Chart Canvas */}
            <div className="absolute inset-0 bg-[#060D1A] opacity-90">
              <div className="w-full h-full opacity-20 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:24px_24px]"></div>
            </div>

            {/* Overlap Geometry Graphics */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 700 400">
              <defs>
                {/* Observed Slick Pattern */}
                <pattern id="observedPattern" width="10" height="10" patternUnits="userSpaceOnUse">
                  <path d="M 0 10 L 10 0 M 0 0 L 10 10" stroke="#FF7A2F" strokeWidth="1" opacity="0.4" />
                </pattern>
                {/* Simulated Scenario Pattern */}
                <pattern id="simPattern" width="10" height="10" patternUnits="userSpaceOnUse">
                  <circle cx="5" cy="5" r="2" fill="#06B6D4" opacity="0.5" />
                </pattern>
              </defs>

              {/* Observed Satellite Slick Footprint */}
              <polygon
                points="280,180 380,150 490,190 460,260 320,240"
                fill="url(#observedPattern)"
                stroke="#FF7A2F"
                strokeWidth="2.5"
              />
              <text x="290" y="170" fill="#FF7A2F" fontSize="12" fontWeight="bold">
                Observed Satellite Slick (T-0)
              </text>

              {/* Simulated Forward Advection Footprint */}
              {activeScenario && (
                <>
                  <polygon
                    points="310,190 400,165 480,200 440,270 340,250"
                    fill="url(#simPattern)"
                    stroke="#06B6D4"
                    strokeWidth="2.5"
                    strokeDasharray="5,5"
                  />
                  <text x="350" y="295" fill="#06B6D4" fontSize="12" fontWeight="bold">
                    Hypothesized Plume (Forward Advection)
                  </text>

                  {/* Centroid Distance Vector */}
                  <line x1="380" y1="200" x2="395" y2="215" stroke="#F59E0B" strokeWidth="2" strokeDasharray="3,3" />
                  <circle cx="380" cy="200" r="4" fill="#FF7A2F" />
                  <circle cx="395" cy="215" r="4" fill="#06B6D4" />
                  <text x="405" y="215" fill="#F59E0B" fontSize="11">
                    Δ Centroid: {activeScenario.centroid_offset_km.toFixed(1)} km
                  </text>
                </>
              )}
            </svg>

            {/* Top Legend */}
            <div className="absolute top-4 right-4 bg-black/70 backdrop-blur-sm p-3 rounded-xl border border-white/10 space-y-1.5 text-[11px]">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-orange-500/40 border border-orange-500"></span>
                <span className="text-slate-300">Ground-Truth SAR Slick</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-cyan-500/40 border border-cyan-400"></span>
                <span className="text-slate-300">Simulated Forward Footprint</span>
              </div>
            </div>
          </div>
        )}

          {/* Quantitative Comparison Matrix */}
          {activeScenario && (
            <div className="bg-[#0A1020]/90 backdrop-blur-md p-5 rounded-2xl border border-cyan-500/30 shadow-xl space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-white/5">
                <span className="text-slate-300 font-bold uppercase">Quantitative Fit Metrics:</span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold ${
                    activeScenario.verdict === 'PLAUSIBLE_SOURCE'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-red-500/20 text-red-400 border border-red-500/30'
                  }`}
                >
                  VERDICT: {activeScenario.verdict}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="bg-[#0D1527] p-3 rounded-xl border border-white/5">
                  <div className="text-[10px] text-slate-400 uppercase">Jaccard Similarity</div>
                  <div className="text-xl font-bold text-cyan-400 mt-1">{(activeScenario.jaccard_similarity * 100).toFixed(1)}%</div>
                  <div className="text-[10px] text-slate-500">Spatial overlap index</div>
                </div>

                <div className="bg-[#0D1527] p-3 rounded-xl border border-white/5">
                  <div className="text-[10px] text-slate-400 uppercase">Centroid Offset</div>
                  <div className="text-xl font-bold text-orange-400 mt-1">{activeScenario.centroid_offset_km.toFixed(1)} km</div>
                  <div className="text-[10px] text-slate-500">Center-to-center distance</div>
                </div>

                <div className="bg-[#0D1527] p-3 rounded-xl border border-white/5">
                  <div className="text-[10px] text-slate-400 uppercase">Overall Correlation</div>
                  <div className="text-xl font-bold text-emerald-400 mt-1">{activeScenario.overall_correlation}%</div>
                  <div className="text-[10px] text-slate-500">Ensemble confidence</div>
                </div>
              </div>

              <p className="text-slate-300 text-[11px] leading-relaxed bg-[#0D1527] p-3 rounded-xl border border-white/5">
                {activeScenario.notes}
              </p>

              <div className="pt-2">
                <button
                  onClick={() => onNavigateTab('evidence')}
                  className="w-full py-2 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 rounded-xl text-xs font-mono transition text-center"
                >
                  Preserve Hypothesis in Evidence Chain →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
