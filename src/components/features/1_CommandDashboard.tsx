import React, { useEffect, useState } from 'react';
import type { Incident, DashboardSummary, FeatureTab } from '../../types/seatrace';
import { fetchDashboardSummary } from '../../api/seatraceClient';
import { SeaTraceMap } from '../map/SeaTraceMap';
import { SatelliteHeatmapMap } from '../map/SatelliteHeatmapMap';
import { getStatusBadgeStyle } from './2_IncidentManagement';

interface CommandDashboardProps {
  incidents: Incident[];
  activeIncident: Incident | null;
  onSelectIncident: (inc: Incident) => void;
  onNavigateTab: (tab: FeatureTab) => void;
}

export const CommandDashboard: React.FC<CommandDashboardProps> = ({
  incidents,
  activeIncident,
  onSelectIncident,
  onNavigateTab
}) => {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [mapMode, setMapMode] = useState<'surveillance' | 'heatmap' | 'dual'>('surveillance');

  useEffect(() => {
    let mounted = true;
    fetchDashboardSummary().then((data) => {
      if (mounted) {
        setSummary(data);
      }
    });
    return () => { mounted = false; };
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Welcome & Operational Status */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-[#0B1528] via-[#0E1E38] to-[#0A1020] p-6 rounded-2xl border border-cyan-500/20 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-xs font-mono text-cyan-400 font-semibold tracking-wider uppercase">
              Operational Command Console
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Indian Maritime Oil-Spill Early Warning & Attribution
          </h1>
          <p className="text-slate-400 text-sm mt-1 max-w-3xl">
            Real-time multi-sensor radar surveillance across the Arabian Sea, Bay of Bengal, and Indian Ocean approaches. Correlating synthetic aperture radar slicks with AIS vessel paths and reverse Lagrangian drift simulations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigateTab('incidents')}
            className="px-4 py-2 bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-200 border border-cyan-500/40 rounded-xl text-xs font-mono transition"
          >
            + Register Incident
          </button>
          <button
            onClick={() => onNavigateTab('reports')}
            className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 text-white rounded-xl text-xs font-semibold shadow transition"
          >
            Generate Fleet Briefing
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-[#0A1020]/80 backdrop-blur-md p-4 rounded-xl border border-white/10 shadow-lg">
          <div className="text-[11px] font-mono text-slate-400 uppercase">Total Incidents</div>
          <div className="text-2xl font-bold text-white mt-1 font-mono">{summary?.total_incidents ?? incidents.length}</div>
          <div className="text-[10px] text-cyan-400 mt-1 font-mono">Recorded in EEZ</div>
        </div>

        <div className="bg-[#0A1020]/80 backdrop-blur-md p-4 rounded-xl border border-red-500/20 shadow-lg">
          <div className="text-[11px] font-mono text-red-300 uppercase">Active Spills</div>
          <div className="text-2xl font-bold text-red-400 mt-1 font-mono">{summary?.active_incidents ?? 3}</div>
          <div className="text-[10px] text-red-300 mt-1 font-mono">Under response</div>
        </div>

        <div className="bg-[#0A1020]/80 backdrop-blur-md p-4 rounded-xl border border-amber-500/20 shadow-lg">
          <div className="text-[11px] font-mono text-amber-300 uppercase">In Screening</div>
          <div className="text-2xl font-bold text-amber-400 mt-1 font-mono">{summary?.under_review ?? 2}</div>
          <div className="text-[10px] text-amber-300 mt-1 font-mono">Validation & Drift</div>
        </div>

        <div className="bg-[#0A1020]/80 backdrop-blur-md p-4 rounded-xl border border-cyan-500/20 shadow-lg">
          <div className="text-[11px] font-mono text-cyan-300 uppercase">Slick Footprint</div>
          <div className="text-2xl font-bold text-cyan-400 mt-1 font-mono">
            {summary?.total_slicks_area_km2 ?? 24.8} <span className="text-xs font-normal text-slate-400">km²</span>
          </div>
          <div className="text-[10px] text-cyan-300 mt-1 font-mono">SAR detected area</div>
        </div>

        <div className="bg-[#0A1020]/80 backdrop-blur-md p-4 rounded-xl border border-orange-500/20 shadow-lg">
          <div className="text-[11px] font-mono text-orange-300 uppercase">Vessel Leads</div>
          <div className="text-2xl font-bold text-orange-400 mt-1 font-mono">{summary?.high_risk_vessel_leads ?? 2}</div>
          <div className="text-[10px] text-orange-300 mt-1 font-mono">Score &gt; 80%</div>
        </div>

        <div className="bg-[#0A1020]/80 backdrop-blur-md p-4 rounded-xl border border-emerald-500/20 shadow-lg">
          <div className="text-[11px] font-mono text-emerald-300 uppercase">System Integrity</div>
          <div className="text-2xl font-bold text-emerald-400 mt-1 font-mono">{summary?.system_health_pct ?? 98.5}%</div>
          <div className="text-[10px] text-emerald-300 mt-1 font-mono">Sensors online</div>
        </div>
      </div>

      {/* Main Grid: GIS Map & Recent Incidents Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Interactive Map */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white flex items-center gap-2 font-mono">
                <span className="text-cyan-400">🌐</span> MARITIME SURVEILLANCE OVERVIEW
              </h2>
              <span className="text-xs font-mono text-slate-400">
                Active Focus: <span className="text-cyan-300 font-bold">{activeIncident?.id || 'None'}</span>
              </span>
            </div>

            {/* Map Mode Switcher: Tactical vs Heatmap (Image 2) vs Dual */}
            <div className="flex items-center gap-1 bg-[#0A1224]/85 p-1 rounded-xl border border-white/10 text-xs font-mono self-start sm:self-auto">
              <button
                onClick={() => setMapMode('surveillance')}
                className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 ${
                  mapMode === 'surveillance'
                    ? 'bg-cyan-500 text-black font-bold shadow-md'
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <span>🛰️</span> Tactical AIS Map
              </button>
              <button
                onClick={() => setMapMode('heatmap')}
                className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 ${
                  mapMode === 'heatmap'
                    ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white font-bold shadow-md'
                    : 'text-amber-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <span>🔥</span> Satellite SAR Heatmap
              </button>
              <button
                onClick={() => setMapMode('dual')}
                className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
                  mapMode === 'dual'
                    ? 'bg-purple-600 text-white font-bold shadow-md'
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
                title="View Both Maps Simultaneously"
              >
                <span>🔲</span> Dual
              </button>
            </div>
          </div>

          {/* Map Display based on Mode */}
          {mapMode === 'surveillance' && (
            <SeaTraceMap
              incident={activeIncident}
              height="520px"
            />
          )}

          {mapMode === 'heatmap' && (
            <SatelliteHeatmapMap
              incident={activeIncident}
              height="580px"
            />
          )}

          {mapMode === 'dual' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <div className="text-[11px] font-mono text-cyan-400 font-bold mb-1 flex items-center gap-1">
                  <span>🛰️</span> Tactical AIS & Radar Surveillance
                </div>
                <SeaTraceMap
                  incident={activeIncident}
                  height="460px"
                  showLayersControl={false}
                />
              </div>
              <div>
                <div className="text-[11px] font-mono text-amber-400 font-bold mb-1 flex items-center gap-1">
                  <span>🔥</span> National SAR Spill Heatmap (Image 2)
                </div>
                <SatelliteHeatmapMap
                  incident={activeIncident}
                  height="460px"
                />
              </div>
            </div>
          )}

          {/* Quick Investigation Feature Shortcuts */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
            <button
              onClick={() => onNavigateTab('detection')}
              className="p-3 bg-[#0D1527] hover:bg-[#14203B] rounded-xl border border-white/5 hover:border-cyan-500/30 transition text-left group"
            >
              <div className="text-base group-hover:scale-110 transition-transform">🛰️</div>
              <div className="text-xs font-bold text-white mt-1">SAR Detection</div>
              <div className="text-[10px] text-slate-400 font-mono">Masks & polarimetry</div>
            </button>

            <button
              onClick={() => onNavigateTab('validation')}
              className="p-3 bg-[#0D1527] hover:bg-[#14203B] rounded-xl border border-white/5 hover:border-cyan-500/30 transition text-left group"
            >
              <div className="text-base group-hover:scale-110 transition-transform">🔍</div>
              <div className="text-xs font-bold text-white mt-1">Look-Alike Screen</div>
              <div className="text-[10px] text-slate-400 font-mono">Biogenic & low-wind</div>
            </button>

            <button
              onClick={() => onNavigateTab('reconstruction')}
              className="p-3 bg-[#0D1527] hover:bg-[#14203B] rounded-xl border border-white/5 hover:border-cyan-500/30 transition text-left group"
            >
              <div className="text-base group-hover:scale-110 transition-transform">🌊</div>
              <div className="text-xs font-bold text-white mt-1">Origin Drift</div>
              <div className="text-[10px] text-slate-400 font-mono">Reverse trajectory</div>
            </button>

            <button
              onClick={() => onNavigateTab('vessels')}
              className="p-3 bg-[#0D1527] hover:bg-[#14203B] rounded-xl border border-white/5 hover:border-cyan-500/30 transition text-left group"
            >
              <div className="text-base group-hover:scale-110 transition-transform">⚓</div>
              <div className="text-xs font-bold text-white mt-1">Vessel Leads</div>
              <div className="text-[10px] text-slate-400 font-mono">AIS corridor ranking</div>
            </button>
          </div>
        </div>

        {/* Right 1 Col: Active Incidents List & Audit Activity */}
        <div className="space-y-6">
          {/* Active Incidents Selector List */}
          <div className="bg-[#0A1020]/90 backdrop-blur-md p-4 rounded-2xl border border-white/10 shadow-xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-white/5">
              <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <span>🚨</span> Incidents Roster ({incidents.length})
              </h3>
              <button
                onClick={() => onNavigateTab('incidents')}
                className="text-[11px] text-cyan-400 hover:text-cyan-300 font-mono transition"
              >
                View All →
              </button>
            </div>

            <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
              {incidents.map((inc) => {
                const isSelected = activeIncident?.id === inc.id;
                return (
                  <div
                    key={inc.id}
                    onClick={() => onSelectIncident(inc)}
                    className={`p-3 rounded-xl border cursor-pointer transition ${
                      isSelected
                        ? 'bg-cyan-950/40 border-cyan-500/50 shadow-md'
                        : 'bg-[#0D1527]/70 hover:bg-[#14203B] border-white/5'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="font-bold text-cyan-300">{inc.id}</span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          inc.severity === 'CRITICAL'
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                            : inc.severity === 'HIGH'
                            ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                            : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        }`}
                      >
                        {inc.severity}
                      </span>
                    </div>
                    <div className="text-xs text-white font-medium mt-1 truncate">{inc.title}</div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 font-mono">
                      <span>{inc.region}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border tracking-wider shadow-sm inline-flex items-center gap-1 ${getStatusBadgeStyle(inc.status)}`}>
                        <span className="w-1 h-1 rounded-full bg-current opacity-80" />
                        {inc.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Audit Events Activity Feed */}
          <div className="bg-[#0A1020]/90 backdrop-blur-md p-4 rounded-2xl border border-white/10 shadow-xl space-y-3">
            <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-white/5">
              <span>📜</span> Live System Audit Trail
            </h3>

            <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
              {summary?.recent_activity?.map((act) => (
                <div key={act.id} className="text-xs font-mono p-2.5 rounded-lg bg-[#0D1527] border border-white/5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-cyan-400 font-bold">{act.action}</span>
                    <span className="text-slate-500">{new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p className="text-slate-300 text-[11px] mt-1">{act.details}</p>
                  <div className="text-[10px] text-slate-500 mt-1 flex items-center justify-between">
                    <span>By: {act.actor}</span>
                    <span className="text-orange-400/80">{act.incident_id}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
