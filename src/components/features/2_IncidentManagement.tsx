import React, { useState } from 'react';
import type { Incident, IncidentStatus, IncidentSeverity, FeatureTab } from '../../types/seatrace';
import { createIncident, updateIncident } from '../../api/seatraceClient';
import { SeaTraceMap } from '../map/SeaTraceMap';

interface IncidentManagementProps {
  incidents: Incident[];
  activeIncident: Incident | null;
  onSelectIncident: (inc: Incident) => void;
  onRefreshIncidents: () => void;
  onNavigateTab: (tab: FeatureTab) => void;
}

const REGIONS = [
  'Arabian Sea (West Coast)',
  'Bay of Bengal (East Coast)',
  'Gulf of Kutch',
  'Gulf of Khambhat',
  'Lakshadweep Sea',
  'Andaman & Nicobar Waters',
  'Palk Strait & Gulf of Mannar'
];

const SEVERITIES: IncidentSeverity[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const STATUSES: IncidentStatus[] = [
  'NEW',
  'DETECTED',
  'VALIDATING',
  'RECONSTRUCTING',
  'VESSEL_ANALYSIS',
  'REVIEW',
  'CLOSED',
  'ARCHIVED'
];

export const getStatusBadgeStyle = (status: string): string => {
  switch (status) {
    case 'NEW':
      return 'bg-cyan-100 text-cyan-800 border-cyan-300 dark:bg-cyan-950/70 dark:text-cyan-300 dark:border-cyan-700/60';
    case 'DETECTED':
      return 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950/70 dark:text-purple-300 dark:border-purple-700/60';
    case 'VALIDATING':
      return 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/70 dark:text-amber-300 dark:border-amber-700/60';
    case 'RECONSTRUCTING':
      return 'bg-sky-100 text-sky-800 border-sky-300 dark:bg-sky-950/70 dark:text-sky-300 dark:border-sky-700/60';
    case 'VESSEL_ANALYSIS':
      return 'bg-teal-100 text-teal-800 border-teal-300 dark:bg-teal-950/70 dark:text-teal-300 dark:border-teal-700/60';
    case 'REVIEW':
      return 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-950/70 dark:text-orange-300 dark:border-orange-700/60';
    case 'CLOSED':
    case 'ARCHIVED':
      return 'bg-slate-200 text-slate-700 border-slate-300 dark:bg-slate-800/80 dark:text-slate-400 dark:border-slate-700';
    default:
      return 'bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
  }
};

export const IncidentManagement: React.FC<IncidentManagementProps> = ({
  incidents,
  activeIncident,
  onSelectIncident,
  onRefreshIncidents,
  onNavigateTab
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState<'table' | 'map'>('table');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New Incident Form State
  const [newTitle, setNewTitle] = useState('');
  const [newRegion, setNewRegion] = useState(REGIONS[0]);
  const [newSeverity, setNewSeverity] = useState<IncidentSeverity>('MEDIUM');
  const [newLat, setNewLat] = useState('18.9200');
  const [newLng, setNewLng] = useState('72.8300');
  const [newSource, setNewSource] = useState('Sentinel-1 SAR C-Band');
  const [newVolume, setNewVolume] = useState('50.0');
  const [newSpillType, setNewSpillType] = useState('Heavy Fuel Oil (HFO)');
  const [newNotes, setNewNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Filtering
  const filtered = incidents.filter((inc) => {
    if (statusFilter !== 'ALL' && inc.status !== statusFilter) return false;
    if (severityFilter !== 'ALL' && inc.severity !== severityFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        inc.title.toLowerCase().includes(q) ||
        inc.id.toLowerCase().includes(q) ||
        inc.region.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const latNum = parseFloat(newLat);
    const lngNum = parseFloat(newLng);

    if (isNaN(latNum) || latNum < 0 || latNum > 38) {
      setFormError('Latitude must be a valid number within Indian maritime boundaries (0°N to 38°N)');
      return;
    }
    if (isNaN(lngNum) || lngNum < 65 || lngNum > 100) {
      setFormError('Longitude must be a valid number within Indian maritime waters (65°E to 100°E)');
      return;
    }

    try {
      setSubmitting(true);
      const created = await createIncident({
        title: newTitle || `Slick Detection off ${newRegion}`,
        region: newRegion,
        severity: newSeverity,
        lat: latNum,
        lng: lngNum,
        detection_time: new Date().toISOString(),
        source: newSource,
        estimated_volume_m3: parseFloat(newVolume) || 50.0,
        spill_type: newSpillType,
        notes: newNotes
      });

      setShowCreateModal(false);
      onRefreshIncidents();
      onSelectIncident(created);
    } catch (err: any) {
      setFormError(err.message || 'Failed to persist incident');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (newStatus: IncidentStatus) => {
    if (!activeIncident) return;
    try {
      const updated = await updateIncident(activeIncident.id, { status: newStatus });
      onRefreshIncidents();
      onSelectIncident(updated);
    } catch (err) {
      alert('Failed to update incident status on server');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0A1020]/90 backdrop-blur-md p-6 rounded-2xl border border-white/10 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono text-cyan-400 font-semibold tracking-wider uppercase">
              Feature 2 — Incident Lifecycle
            </span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Maritime Spill Registry &amp; Incident Records
          </h2>
          <p className="text-slate-400 text-xs mt-1">
            Maintain strict chain of custody, spatial coordinates, volume estimations, and lifecycle transitions.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 text-white px-4 py-2 rounded-xl text-xs font-mono font-bold shadow-lg transition"
        >
          <span>+</span> Register New Incident
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0D1527] p-3.5 rounded-xl border border-white/5 font-mono text-xs">
        <div className="flex items-center gap-3 flex-1 min-w-[240px]">
          <span className="text-slate-400">🔍</span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by ID, region, title, or vessel notes..."
            className="w-full bg-transparent text-white placeholder-slate-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-400">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#0A1020] border border-white/10 rounded-lg px-2.5 py-1 text-slate-200 focus:outline-none"
          >
            <option value="ALL">ALL STATUSES</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-400">Severity:</span>
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-[#0A1020] border border-white/10 rounded-lg px-2.5 py-1 text-slate-200 focus:outline-none"
          >
            <option value="ALL">ALL SEVERITIES</option>
            {SEVERITIES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* View Mode Toggle: Table vs Live Google Map */}
        <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/10 ml-auto">
          <button
            onClick={() => setViewMode('table')}
            className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition flex items-center gap-1.5 ${
              viewMode === 'table'
                ? 'bg-cyan-500 text-black shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>📋</span> Table
          </button>
          <button
            onClick={() => setViewMode('map')}
            className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition flex items-center gap-1.5 ${
              viewMode === 'map'
                ? 'bg-cyan-500 text-black shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>🛰️</span> Live Google Map
          </button>
        </div>
      </div>

      {/* Grid: Incident Table & Detail Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Table List or Google Maps (2 Cols) */}
        {viewMode === 'map' ? (
          <div className="lg:col-span-2 space-y-3">
            <div className="flex items-center justify-between text-xs font-mono text-slate-300 bg-[#0A1020] p-3 rounded-xl border border-white/10 shadow-lg">
              <span className="font-bold text-white flex items-center gap-2">
                <span className="text-cyan-400">🛰️</span> PAN-INDIA GOOGLE SATELLITE SPILL SURVEILLANCE
              </span>
              <span className="text-slate-400">
                Click any incident pin to focus dossier • <b className="text-cyan-300">{filtered.length} spills</b> plotted
              </span>
            </div>
            <SeaTraceMap
              allIncidents={filtered}
              incident={activeIncident}
              onSelectIncident={onSelectIncident}
              height="580px"
              defaultMapType="google_hybrid"
              initialCenter={[18.5, 75.0]}
              initialZoom={5}
              enableLiveTracking={true}
            />
          </div>
        ) : (
          <div className="lg:col-span-2 bg-[#0A1020]/90 backdrop-blur-md rounded-2xl border border-white/10 overflow-hidden shadow-xl">
          <div className="p-4 border-b border-white/5 flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-white uppercase">
              Registry Records ({filtered.length})
            </span>
            <span className="text-[11px] font-mono text-slate-400">Click row to inspect</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#0D1527] text-slate-400 border-b border-white/5">
                <tr>
                  <th className="p-3">Incident ID</th>
                  <th className="p-3">Title &amp; Region</th>
                  <th className="p-3">Severity</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Detection Time</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                {filtered.map((inc) => {
                  const isSelected = activeIncident?.id === inc.id;
                  return (
                    <tr
                      key={inc.id}
                      onClick={() => onSelectIncident(inc)}
                      className={`cursor-pointer transition ${
                        isSelected ? 'bg-cyan-950/40 text-cyan-200 font-semibold' : 'hover:bg-white/5'
                      }`}
                    >
                      <td className="p-3 font-bold text-cyan-400">{inc.id}</td>
                      <td className="p-3 max-w-[200px]">
                        <div className="truncate text-white font-medium">{inc.title}</div>
                        <div className="text-[10px] text-slate-400 truncate">{inc.region}</div>
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            inc.severity === 'CRITICAL'
                              ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                              : inc.severity === 'HIGH'
                              ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                              : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                          }`}
                        >
                          {inc.severity}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border tracking-wider shadow-sm inline-flex items-center gap-1.5 ${getStatusBadgeStyle(inc.status)}`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
                          {inc.status}
                        </span>
                      </td>
                      <td className="p-3 text-[11px] text-slate-400">
                        {new Date(inc.detection_time).toLocaleDateString()}
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectIncident(inc);
                            onNavigateTab('reconstruction');
                          }}
                          className="px-2 py-1 rounded bg-cyan-600/20 hover:bg-cyan-600/40 text-cyan-300 text-[10px] border border-cyan-500/30"
                        >
                          Drift →
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        )}

        {/* Selected Incident Inspector (1 Col) */}
        <div className="space-y-4">
          {activeIncident ? (
            <div className="bg-[#0A1020]/90 backdrop-blur-md p-5 rounded-2xl border border-cyan-500/30 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/5">
                <div>
                  <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase">Active Dossier</span>
                  <h3 className="text-base font-bold text-white font-mono">{activeIncident.id}</h3>
                </div>
                <span
                  className={`px-2.5 py-1 rounded text-xs font-mono font-bold ${
                    activeIncident.severity === 'CRITICAL'
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                      : 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                  }`}
                >
                  {activeIncident.severity}
                </span>
              </div>

              <div>
                <div className="text-xs font-semibold text-white">{activeIncident.title}</div>
                <div className="text-xs text-slate-400 mt-1">{activeIncident.region}</div>
              </div>

              {/* Geo & Time Specs */}
              <div className="bg-[#0D1527] p-3 rounded-xl border border-white/5 space-y-2 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-400">Location:</span>
                  <span className="text-cyan-300 font-bold">{activeIncident.lat.toFixed(4)}°N, {activeIncident.lng.toFixed(4)}°E</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Sensor:</span>
                  <span className="text-slate-200">{activeIncident.source}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Est. Volume:</span>
                  <span className="text-orange-400 font-bold">{activeIncident.estimated_volume_m3 || 'Unknown'} m³</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Spill Type:</span>
                  <span className="text-slate-200">{activeIncident.spill_type || 'Unspecified Hydrocarbon'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Acquired:</span>
                  <span className="text-slate-300">{new Date(activeIncident.detection_time).toLocaleString()}</span>
                </div>
              </div>

              {/* Lifecycle Stage Controller */}
              <div className="space-y-2">
                <label className="text-[11px] font-mono text-slate-400 uppercase font-bold">Advance Lifecycle State:</label>
                <div className="grid grid-cols-2 gap-1.5 font-mono text-[11px]">
                  {STATUSES.slice(0, 6).map((st) => {
                    const isCurrent = activeIncident.status === st;
                    return (
                      <button
                        key={st}
                        onClick={() => handleStatusChange(st)}
                        className={`p-2 rounded-xl border text-center transition font-bold text-[10px] cursor-pointer ${
                          isCurrent
                            ? 'bg-cyan-50 text-cyan-900 border-cyan-400 shadow-sm dark:bg-cyan-500/25 dark:text-cyan-200 dark:border-cyan-400'
                            : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200 hover:text-slate-900 dark:bg-[#0D1527] dark:text-slate-400 dark:border-white/5 dark:hover:text-white dark:hover:bg-white/10'
                        }`}
                      >
                        {st}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <label className="text-[11px] font-mono text-slate-400 uppercase font-bold">Investigator Log:</label>
                <p className="text-xs text-slate-300 bg-[#0D1527] p-3 rounded-xl border border-white/5 font-mono leading-relaxed">
                  {activeIncident.notes || 'No investigator notes added.'}
                </p>
              </div>

              {/* Downstream Investigation Shortcuts */}
              <div className="pt-2 flex flex-col gap-2">
                <button
                  onClick={() => onNavigateTab('detection')}
                  className="w-full py-2 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 rounded-xl text-xs font-mono transition text-center"
                >
                  Inspect Satellite Mask →
                </button>
                <button
                  onClick={() => onNavigateTab('reconstruction')}
                  className="w-full py-2 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 rounded-xl text-xs font-mono transition text-center"
                >
                  Run Drift Simulation →
                </button>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-500 bg-[#0A1020]/90 rounded-2xl border border-white/5 text-xs font-mono">
              Select an incident from the registry to view details
            </div>
          )}
        </div>
      </div>

      {/* Create Incident Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#0A1020] border border-cyan-500/40 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-base font-bold text-white font-mono flex items-center gap-2">
                <span>🚨</span> Register New Maritime Spill Incident
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-red-950/80 border border-red-500/40 rounded-xl text-red-200 text-xs font-mono">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-3 text-xs font-mono">
              <div>
                <label className="text-slate-400 block mb-1">Incident Title / Briefing:</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Mumbai High Offshore Cluster Spill"
                  className="w-full bg-[#0D1527] border border-white/10 rounded-lg p-2.5 text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Region:</label>
                  <select
                    value={newRegion}
                    onChange={(e) => setNewRegion(e.target.value)}
                    className="w-full bg-[#0D1527] border border-white/10 rounded-lg p-2.5 text-white focus:outline-none"
                  >
                    {REGIONS.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Initial Severity:</label>
                  <select
                    value={newSeverity}
                    onChange={(e) => setNewSeverity(e.target.value as IncidentSeverity)}
                    className="w-full bg-[#0D1527] border border-white/10 rounded-lg p-2.5 text-white focus:outline-none"
                  >
                    {SEVERITIES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Latitude (°N):</label>
                  <input
                    type="text"
                    required
                    value={newLat}
                    onChange={(e) => setNewLat(e.target.value)}
                    placeholder="19.4182"
                    className="w-full bg-[#0D1527] border border-white/10 rounded-lg p-2.5 text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Longitude (°E):</label>
                  <input
                    type="text"
                    required
                    value={newLng}
                    onChange={(e) => setNewLng(e.target.value)}
                    placeholder="71.3412"
                    className="w-full bg-[#0D1527] border border-white/10 rounded-lg p-2.5 text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Spill Type:</label>
                  <input
                    type="text"
                    value={newSpillType}
                    onChange={(e) => setNewSpillType(e.target.value)}
                    placeholder="Heavy Fuel Oil (HFO)"
                    className="w-full bg-[#0D1527] border border-white/10 rounded-lg p-2.5 text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Est. Volume (m³):</label>
                  <input
                    type="number"
                    value={newVolume}
                    onChange={(e) => setNewVolume(e.target.value)}
                    placeholder="145.0"
                    className="w-full bg-[#0D1527] border border-white/10 rounded-lg p-2.5 text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Observation Sensor / Source:</label>
                <input
                  type="text"
                  value={newSource}
                  onChange={(e) => setNewSource(e.target.value)}
                  placeholder="Sentinel-1 SAR C-Band"
                  className="w-full bg-[#0D1527] border border-white/10 rounded-lg p-2.5 text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Investigator Notes / Source Details:</label>
                <textarea
                  rows={2}
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Dark anomaly identified on Sentinel-1 C-Band pass..."
                  className="w-full bg-[#0D1527] border border-white/10 rounded-lg p-2.5 text-white focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 text-white font-bold rounded-xl shadow transition"
                >
                  {submitting ? 'Creating...' : 'Save & Persist Incident'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
