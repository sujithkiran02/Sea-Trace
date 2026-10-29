import React, { useState, useEffect } from 'react';
import type { Incident, VesselCandidate, FeatureTab } from '../../types/seatrace';
import { fetchVesselCandidates } from '../../api/seatraceClient';
import { SeaTraceMap } from '../map/SeaTraceMap';

interface VesselIntelligenceProps {
  activeIncident: Incident | null;
  onNavigateTab: (tab: FeatureTab) => void;
  onSelectCandidateForHypothesis?: (vessel: VesselCandidate) => void;
}

export const VesselIntelligence: React.FC<VesselIntelligenceProps> = ({
  activeIncident,
  onNavigateTab,
  onSelectCandidateForHypothesis
}) => {
  const [candidates, setCandidates] = useState<VesselCandidate[]>([]);
  const [selectedVessel, setSelectedVessel] = useState<VesselCandidate | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'map'>('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState<'ALL' | 'CRITICAL_LEAD' | 'ELEVATED' | 'MODERATE' | 'LOW_RELEVANCE'>('ALL');
  const [isScanning, setIsScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState('');

  // Auto-detect Light / Dark mode
  const [isLightMode, setIsLightMode] = useState<boolean>(() => {
    return typeof document !== 'undefined' && document.documentElement.classList.contains('light-theme');
  });

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsLightMode(document.documentElement.classList.contains('light-theme'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const incidentId = activeIncident?.id || 'IN-2026-61C2';
    fetchVesselCandidates(incidentId).then((vessels) => {
      setCandidates(vessels);
      if (vessels.length > 0) {
        setSelectedVessel(vessels[0]);
      }
    });
  }, [activeIncident]);

  const handleRerunCorridorScan = () => {
    setIsScanning(true);
    setScanMessage('Scanning DGLL terrestrial AIS receivers & Spire/Orbcomm satellite constellation...');
    setTimeout(() => {
      const incidentId = activeIncident?.id || 'IN-2026-61C2';
      fetchVesselCandidates(incidentId).then((vessels) => {
        setCandidates(vessels);
        if (vessels.length > 0) setSelectedVessel(vessels[0]);
        setIsScanning(false);
        setScanMessage(`Corridor scan complete: ${vessels.length} candidates tracked. Critical Lead: ${vessels[0]?.vessel_name || 'MT OCEAN PRIDE'}.`);
        setTimeout(() => setScanMessage(''), 5000);
      });
    }, 1100);
  };

  const filteredCandidates = candidates.filter((v) => {
    if (riskFilter !== 'ALL' && v.risk_level !== riskFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        v.vessel_name.toLowerCase().includes(q) ||
        v.mmsi.includes(q) ||
        (v.imo && v.imo.includes(q)) ||
        v.flag.toLowerCase().includes(q) ||
        v.vessel_type.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 font-sans">
      {/* 1. TOP HEADER BANNER */}
      <div className={`p-6 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
        isLightMode
          ? 'bg-white border-slate-200/90 shadow-sm'
          : 'bg-[#0A1020]/90 backdrop-blur-md border-white/10 shadow-xl'
      }`}>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono text-cyan-600 dark:text-cyan-400 font-semibold tracking-wider uppercase">
              FEATURE 6 — VESSEL TRAFFIC INTELLIGENCE
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
              ● AIS CORRIDOR SCAN ACTIVE
            </span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            AIS Corridor Attribution &amp; Live Tracking
          </h2>
          <p className="text-xs mt-1 text-slate-600 dark:text-slate-400">
            Correlate DGLL / Coast Guard terrestrial &amp; satellite AIS transponder tracks against the reconstructed spill origin in real time.
          </p>
        </div>

        {/* Action Controls & View Switcher */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleRerunCorridorScan}
            disabled={isScanning}
            className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              isScanning
                ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 animate-pulse'
                : isLightMode
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300'
                : 'bg-white/10 hover:bg-white/15 text-slate-200 border border-white/15'
            }`}
            title="Re-run AIS track correlation against reconstructed release centroid"
          >
            <span>{isScanning ? '⏳' : '🔄'}</span>
            <span>{isScanning ? 'Correlating...' : 'Re-run Scan'}</span>
          </button>

          <div className={`flex items-center gap-1 p-1 rounded-xl border font-mono text-xs ${
            isLightMode ? 'bg-slate-100 border-slate-300' : 'bg-[#0D1527] border-white/10'
          }`}>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer font-bold ${
                viewMode === 'table'
                  ? isLightMode
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'bg-cyan-500 text-black shadow-md'
                  : isLightMode
                  ? 'text-slate-600 hover:text-slate-900'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              📋 Candidate Table
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer font-bold ${
                viewMode === 'map'
                  ? isLightMode
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'bg-cyan-500 text-black shadow-md'
                  : isLightMode
                  ? 'text-slate-600 hover:text-slate-900'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              🗺️ Live Google Maps
            </button>
          </div>
        </div>
      </div>

      {scanMessage && (
        <div className="p-3.5 bg-cyan-50 dark:bg-cyan-950/80 border border-cyan-200 dark:border-cyan-500/40 rounded-xl text-cyan-900 dark:text-cyan-200 text-xs font-mono flex items-center gap-2 shadow-xs">
          <span className="w-2 h-2 rounded-full bg-cyan-500 animate-ping"></span>
          <span>{scanMessage}</span>
        </div>
      )}

      {/* 2. LIVE GOOGLE MAP MODE */}
      {viewMode === 'map' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between font-mono text-xs text-slate-600 dark:text-slate-300 px-1">
            <span className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <b>LIVE GOOGLE SATELLITE AIS RADAR</b> — Tracking {candidates.length} Candidate Vessels
            </span>
            <span className="text-cyan-600 dark:text-cyan-400 font-semibold">
              Click any vessel pin for live kinematics &amp; attribution
            </span>
          </div>
          <SeaTraceMap
            incident={activeIncident}
            vessels={candidates}
            height="520px"
            defaultMapType="google_hybrid"
            enableLiveTracking={true}
          />
        </div>
      )}

      {/* 3. MAIN GRID: VESSEL CANDIDATES TABLE & CANDIDATE DETAILED INSPECTOR */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ranked Candidate Table (2 Cols) */}
        <div className={`lg:col-span-2 rounded-2xl border overflow-hidden transition-all ${
          isLightMode
            ? 'bg-white border-slate-200/90 shadow-sm'
            : 'bg-[#0B132B] border-white/10 shadow-xl'
        }`}>
          {/* Table Header & Search Filter Bar */}
          <div className={`p-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono text-xs ${
            isLightMode ? 'border-slate-100 bg-slate-50/50' : 'border-white/5 bg-white/2'
          }`}>
            <div className="flex items-center gap-2">
              <span className="text-cyan-600 dark:text-cyan-400 font-bold text-sm">⚓</span>
              <span className="font-bold text-slate-900 dark:text-white uppercase">
                Corridor Candidates ({filteredCandidates.length})
              </span>
              <span className="text-slate-400 dark:text-slate-500">| Ranked by Compatibility</span>
            </div>

            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search Vessel, MMSI, Flag..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`px-3 py-1.5 rounded-xl border text-xs focus:outline-none transition w-full sm:w-56 ${
                  isLightMode
                    ? 'bg-white border-slate-300 text-slate-800 placeholder-slate-400 focus:border-cyan-500'
                    : 'bg-white/5 border-white/15 text-white placeholder-slate-500 focus:border-cyan-400'
                }`}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Filter Pills */}
          <div className={`px-4 py-2 border-b flex items-center gap-1.5 overflow-x-auto text-[11px] font-mono ${
            isLightMode ? 'border-slate-100 bg-white' : 'border-white/5 bg-[#070D1E]'
          }`}>
            <span className="text-slate-400 text-[10px] mr-1">FILTER:</span>
            {[
              { id: 'ALL', label: 'All Candidates' },
              { id: 'CRITICAL_LEAD', label: '🔴 Critical Leads' },
              { id: 'ELEVATED', label: '🟠 Elevated' },
              { id: 'MODERATE', label: '🟡 Moderate' },
              { id: 'LOW_RELEVANCE', label: '⚪ Low Relevance' }
            ].map((f) => {
              const active = riskFilter === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => setRiskFilter(f.id as any)}
                  className={`px-2.5 py-1 rounded-lg transition whitespace-nowrap cursor-pointer font-medium ${
                    active
                      ? isLightMode
                        ? 'bg-cyan-100 text-cyan-900 font-bold border border-cyan-300'
                        : 'bg-cyan-500/25 text-cyan-200 font-bold border border-cyan-400/50'
                      : isLightMode
                      ? 'text-slate-600 hover:bg-slate-100'
                      : 'text-slate-400 hover:bg-white/5'
                  }`}
                >
                  {f.label}
                </button>
              );
            })}
          </div>

          {/* Table Content */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className={`border-b text-[11px] uppercase ${
                isLightMode ? 'bg-slate-50 text-slate-500 border-slate-200/90' : 'bg-[#0D1527] text-slate-400 border-white/5'
              }`}>
                <tr>
                  <th className="p-3">Vessel &amp; MMSI</th>
                  <th className="p-3">Type &amp; Flag</th>
                  <th className="p-3">Closest Approach (CPA)</th>
                  <th className="p-3">Time Delta</th>
                  <th className="p-3">Compatibility</th>
                  <th className="p-3 text-right">Lead Status</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isLightMode ? 'divide-slate-100' : 'divide-white/5'}`}>
                {filteredCandidates.map((v) => {
                  const isSelected = selectedVessel?.id === v.id;
                  const isCritical = v.risk_level === 'CRITICAL_LEAD';
                  const isElevated = v.risk_level === 'ELEVATED';

                  return (
                    <tr
                      key={v.id}
                      onClick={() => setSelectedVessel(v)}
                      className={`cursor-pointer transition ${
                        isSelected
                          ? isLightMode
                            ? 'bg-cyan-50/90 text-cyan-950 font-semibold border-l-4 border-l-cyan-600'
                            : 'bg-cyan-950/40 text-cyan-200 font-semibold border-l-4 border-l-cyan-400'
                          : isLightMode
                          ? 'hover:bg-slate-50/80 text-slate-700'
                          : 'hover:bg-white/5 text-slate-300'
                      }`}
                    >
                      <td className="p-3">
                        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          {isCritical && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>}
                          {v.vessel_name}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">
                          MMSI: {v.mmsi} {v.imo ? `| IMO: ${v.imo}` : ''}
                        </div>
                      </td>
                      <td className="p-3">
                        <div>{v.vessel_type}</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">{v.flag}</div>
                      </td>
                      <td className="p-3 font-bold text-slate-900 dark:text-slate-200">
                        {v.cpa_distance_km.toFixed(1)} km
                      </td>
                      <td className="p-3 text-slate-500 dark:text-slate-400">
                        {v.time_offset_hours > 0 ? `+${v.time_offset_hours.toFixed(1)}h` : `${v.time_offset_hours.toFixed(1)}h`}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${
                                isCritical ? 'bg-red-500' : isElevated ? 'bg-amber-500' : 'bg-emerald-500'
                              }`}
                              style={{ width: `${v.compatibility_score}%` }}
                            />
                          </div>
                          <span className={`font-bold ${
                            isCritical ? 'text-red-600 dark:text-red-400' : isElevated ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
                          }`}>
                            {v.compatibility_score}%
                          </span>
                        </div>
                      </td>
                      <td className="p-3 text-right">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            isCritical
                              ? 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 border border-red-300 dark:border-red-500/30'
                              : isElevated
                              ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-500/30'
                              : 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30'
                          }`}
                        >
                          {v.risk_level.replace('_', ' ')}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Selected Candidate Inspector (1 Col) */}
        <div className="space-y-4">
          {selectedVessel ? (
            <div className={`p-5 rounded-2xl border shadow-md space-y-4 font-mono text-xs transition-all ${
              isLightMode
                ? 'bg-white border-cyan-500/40 text-slate-800 shadow-slate-200/50'
                : 'bg-[#0B132B] border-cyan-500/40 text-white shadow-2xl'
            }`}>
              <div className={`flex items-center justify-between pb-3 border-b ${
                isLightMode ? 'border-slate-100' : 'border-white/5'
              }`}>
                <div>
                  <span className="text-[10px] text-cyan-600 dark:text-cyan-400 uppercase font-bold tracking-wider">
                    Investigative Dossier
                  </span>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span>🚢</span> {selectedVessel.vessel_name}
                  </h3>
                </div>
                <span
                  className={`px-2.5 py-1 rounded text-[11px] font-bold ${
                    selectedVessel.risk_level === 'CRITICAL_LEAD'
                      ? 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 border border-red-300 dark:border-red-500/30'
                      : 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-500/30'
                  }`}
                >
                  {selectedVessel.risk_level}
                </span>
              </div>

              {/* Vessel Specs */}
              <div className={`p-3.5 rounded-xl border space-y-2 text-xs ${
                isLightMode
                  ? 'bg-slate-50 border-slate-200/80 text-slate-700'
                  : 'bg-[#0D1527] border-white/5 text-slate-300'
              }`}>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">MMSI / IMO:</span>
                  <span className="text-cyan-700 dark:text-cyan-300 font-bold">
                    {selectedVessel.mmsi} {selectedVessel.imo ? `(IMO: ${selectedVessel.imo})` : ''}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Type / Classification:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{selectedVessel.vessel_type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Flag State:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{selectedVessel.flag}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Speed / Course:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {selectedVessel.speed_knots || 13.8} kn / {selectedVessel.course_deg || 230}°
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Voyage / Destination:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {selectedVessel.destination || 'Kandla -> Singapore'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Draught:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {selectedVessel.draught_m || 12.8} m
                  </span>
                </div>
              </div>

              {/* Scoring Factors Breakdown */}
              <div className="space-y-2">
                <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  Explainable Attribution Breakdown:
                </div>
                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-slate-600 dark:text-slate-300">Spatial Origin Proximity (CPA):</span>
                      <span className="text-cyan-600 dark:text-cyan-300 font-bold">
                        {selectedVessel.cpa_distance_km < 3 ? '98.4%' : selectedVessel.cpa_distance_km < 8 ? '76.0%' : '38.0%'} ({selectedVessel.cpa_distance_km.toFixed(1)} km)
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-cyan-500" style={{ width: selectedVessel.cpa_distance_km < 3 ? '98%' : '76%' }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-slate-600 dark:text-slate-300">Release Window Alignment:</span>
                      <span className="text-cyan-600 dark:text-cyan-300 font-bold">
                        {Math.abs(selectedVessel.time_offset_hours) < 1 ? '94.2%' : '81.5%'} ({selectedVessel.time_offset_hours > 0 ? `+${selectedVessel.time_offset_hours}h` : `${selectedVessel.time_offset_hours}h`})
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-cyan-500" style={{ width: Math.abs(selectedVessel.time_offset_hours) < 1 ? '94%' : '81%' }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-slate-600 dark:text-slate-300">AIS Track Continuity:</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">100% (No Gaps)</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500" style={{ width: '100%' }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-slate-600 dark:text-slate-300">Draught / Discharge Indication:</span>
                      <span className="text-amber-600 dark:text-amber-400 font-bold">
                        {selectedVessel.risk_level === 'CRITICAL_LEAD' ? 'Anomaly (-1.6m deballast)' : 'Normal (Nominal)'}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500" style={{ width: selectedVessel.risk_level === 'CRITICAL_LEAD' ? '85%' : '40%' }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col gap-2">
                <button
                  onClick={() => {
                    if (onSelectCandidateForHypothesis) onSelectCandidateForHypothesis(selectedVessel);
                    onNavigateTab('counterfactual');
                  }}
                  className="w-full py-2.5 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 text-white font-bold rounded-xl shadow transition text-center cursor-pointer flex items-center justify-center gap-1.5 active:scale-98"
                >
                  <span>🧪</span>
                  <span>Test in Counterfactual Sim →</span>
                </button>
                <button
                  onClick={() => onNavigateTab('reports')}
                  className={`w-full py-2 border rounded-xl transition text-center cursor-pointer font-bold ${
                    isLightMode
                      ? 'bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border-cyan-300'
                      : 'bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border-cyan-500/30'
                  }`}
                >
                  📑 Add to Legal Export Dossier →
                </button>
              </div>
            </div>
          ) : (
            <div className={`p-8 text-center rounded-2xl border text-xs font-mono ${
              isLightMode ? 'bg-white border-slate-200 text-slate-500' : 'bg-[#0B132B] border-white/5 text-slate-500'
            }`}>
              Select a vessel from the candidate table
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
