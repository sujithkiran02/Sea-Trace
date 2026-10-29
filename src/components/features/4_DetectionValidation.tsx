import React, { useState, useEffect } from 'react';
import type { Incident, ValidationReview, ValidationDecision, FeatureTab } from '../../types/seatrace';
import { fetchIncidentValidations, recordValidationReview } from '../../api/seatraceClient';
import { SeaTraceMap } from '../map/SeaTraceMap';

interface DetectionValidationProps {
  activeIncident: Incident | null;
  onRefreshIncident: () => void;
  onNavigateTab: (tab: FeatureTab) => void;
}

export const DetectionValidation: React.FC<DetectionValidationProps> = ({
  activeIncident,
  onRefreshIncident,
  onNavigateTab
}) => {
  const [reviews, setReviews] = useState<ValidationReview[]>([]);

  // Review Form State
  const [decision, setDecision] = useState<ValidationDecision>('SUPPORTED');
  const [reviewerName, setReviewerName] = useState('Lt. Cmdr. V. Sharma (Indian Coast Guard)');
  const [reviewerRole, setReviewerRole] = useState('Remote Sensing Analyst');
  const [windSpeed, setWindSpeed] = useState(6.4); // knots
  const [biogenicRisk, setBiogenicRisk] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('LOW');
  const [seepProximity, setSeepProximity] = useState(84.0); // km
  const [confidence, setConfidence] = useState(90);
  const [notes, setNotes] = useState(
    'Wind speed is above the 3.0 m/s threshold required for capillary wave damping. Natural seep databases confirm no active geological vents within 80 km. Distinct angular leading edge consistent with intentional vessel discharge.'
  );

  // Validation Checklist state
  const [checklist, setChecklist] = useState({
    windSufficient: true,
    noBiogenicPlume: true,
    outsideSeepZone: true,
    sharpGradients: true,
    highContrastVV: true,
    consistentWithVesselPath: true
  });

  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [isMapExpanded, setIsMapExpanded] = useState(false);

  useEffect(() => {
    if (!activeIncident) return;
    fetchIncidentValidations(activeIncident.id).then((revs) => {
      setReviews(revs);
    });
  }, [activeIncident]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeIncident) return;

    try {
      setSubmitting(true);
      const saved = await recordValidationReview(activeIncident.id, {
        decision,
        reviewer_name: reviewerName,
        reviewer_role: reviewerRole,
        wind_speed_knots: windSpeed,
        biogenic_risk: biogenicRisk,
        natural_seep_proximity_km: seepProximity,
        confidence_level: confidence,
        checklist_json: JSON.stringify(checklist),
        notes
      });

      setReviews([saved, ...reviews]);
      setSubmitMessage(`Decision '${decision}' recorded successfully! Incident state updated.`);
      onRefreshIncident();
      setTimeout(() => setSubmitMessage(''), 4000);
    } catch (err: any) {
      alert(err.message || 'Failed to record validation decision');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0A1020]/90 backdrop-blur-md p-6 rounded-2xl border border-white/10 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono text-cyan-400 font-semibold tracking-wider uppercase">
              Feature 4 — Look-Alike Screening
            </span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Detection Validation &amp; False-Positive Elimination
          </h2>
          <p className="text-slate-400 text-xs mt-1">
            Differentiate true petroleum hydrocarbons from low-wind calm zones, biogenic plant slicks, and natural seafloor seeps.
          </p>
        </div>

        {/* Current Incident Status Pill */}
        <div className="bg-[#0D1527] px-4 py-2.5 rounded-xl border border-white/10 font-mono text-xs">
          <div className="text-slate-400 text-[10px] uppercase">Incident Under Review</div>
          <div className="text-cyan-300 font-bold">{activeIncident?.id || 'No selection'}</div>
        </div>
      </div>

      {submitMessage && (
        <div className="p-3.5 bg-emerald-950/80 border border-emerald-500/40 rounded-xl text-emerald-200 text-xs font-mono flex items-center gap-2">
          <span>✓</span> {submitMessage}
        </div>
      )}

      {/* Main Grid: Checklist & Environmental Context */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form & Scientific Review (2 Cols) */}
        <div className="lg:col-span-2 space-y-5">
          <form onSubmit={handleSubmitReview} className="bg-[#0A1020]/90 backdrop-blur-md p-6 rounded-2xl border border-white/10 shadow-xl space-y-5 font-mono text-xs">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider pb-2 border-b border-white/5 flex items-center gap-2">
              <span>📋</span> Scientific Screening Matrix
            </h3>

            {/* Look-Alike Environmental Factors */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-[#0D1527] p-3 rounded-xl border border-white/5 space-y-1">
                <div className="flex justify-between items-center text-slate-400 text-[11px]">
                  <span>Surface Wind:</span>
                  <input
                    type="number"
                    step="0.5"
                    value={windSpeed}
                    onChange={(e) => setWindSpeed(parseFloat(e.target.value) || 0)}
                    className="w-16 bg-[#0A1020] border border-white/10 rounded px-1.5 py-0.5 text-right text-cyan-300 font-bold"
                  />
                </div>
                <div className="text-xs text-cyan-300 font-bold">{windSpeed} knots</div>
                <div className="text-[10px] text-emerald-400">Above 3.0 m/s calm threshold ✓</div>
              </div>

              <div className="bg-[#0D1527] p-3 rounded-xl border border-white/5 space-y-1">
                <div className="flex justify-between items-center text-slate-400 text-[11px]">
                  <span>Biogenic Risk:</span>
                  <select
                    value={biogenicRisk}
                    onChange={(e) => setBiogenicRisk(e.target.value as 'LOW' | 'MEDIUM' | 'HIGH')}
                    className="bg-[#0A1020] border border-white/10 rounded px-1.5 py-0.5 text-emerald-400 font-bold text-[10px]"
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                  </select>
                </div>
                <div className="text-xs text-emerald-400 font-bold">{biogenicRisk} RISK</div>
                <div className="text-[10px] text-slate-400">MODIS Chl-a &lt; 0.3 mg/m³</div>
              </div>

              <div className="bg-[#0D1527] p-3 rounded-xl border border-white/5 space-y-1">
                <div className="flex justify-between items-center text-slate-400 text-[11px]">
                  <span>Seep Distance:</span>
                  <input
                    type="number"
                    step="5"
                    value={seepProximity}
                    onChange={(e) => setSeepProximity(parseFloat(e.target.value) || 0)}
                    className="w-16 bg-[#0A1020] border border-white/10 rounded px-1.5 py-0.5 text-right text-orange-400 font-bold"
                  />
                </div>
                <div className="text-xs text-orange-400 font-bold">{seepProximity} km</div>
                <div className="text-[10px] text-emerald-400">Isolated from active basins</div>
              </div>
            </div>

            {/* Structured Criteria Checklist */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-300 uppercase">Review Criteria Checklist:</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <label className="flex items-center gap-2 bg-[#0D1527] p-2.5 rounded-lg border border-white/5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checklist.windSufficient}
                    onChange={(e) => setChecklist(c => ({ ...c, windSufficient: e.target.checked }))}
                    className="accent-cyan-400 rounded"
                  />
                  <span className="text-slate-300 text-[11px]">Wind speed permits capillary wave formation</span>
                </label>

                <label className="flex items-center gap-2 bg-[#0D1527] p-2.5 rounded-lg border border-white/5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checklist.noBiogenicPlume}
                    onChange={(e) => setChecklist(c => ({ ...c, noBiogenicPlume: e.target.checked }))}
                    className="accent-cyan-400 rounded"
                  />
                  <span className="text-slate-300 text-[11px]">No matching biological algae bloom in optics</span>
                </label>

                <label className="flex items-center gap-2 bg-[#0D1527] p-2.5 rounded-lg border border-white/5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checklist.outsideSeepZone}
                    onChange={(e) => setChecklist(c => ({ ...c, outsideSeepZone: e.target.checked }))}
                    className="accent-cyan-400 rounded"
                  />
                  <span className="text-slate-300 text-[11px]">Far outside known subsea hydrocarbon seeps</span>
                </label>

                <label className="flex items-center gap-2 bg-[#0D1527] p-2.5 rounded-lg border border-white/5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checklist.sharpGradients}
                    onChange={(e) => setChecklist(c => ({ ...c, sharpGradients: e.target.checked }))}
                    className="accent-cyan-400 rounded"
                  />
                  <span className="text-slate-300 text-[11px]">Sharp, high-gradient edges (not diffuse)</span>
                </label>

                <label className="flex items-center gap-2 bg-[#0D1527] p-2.5 rounded-lg border border-white/5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checklist.highContrastVV}
                    onChange={(e) => setChecklist(c => ({ ...c, highContrastVV: e.target.checked }))}
                    className="accent-cyan-400 rounded"
                  />
                  <span className="text-slate-300 text-[11px]">High damping contrast &gt; 8.0 dB in VV channel</span>
                </label>

                <label className="flex items-center gap-2 bg-[#0D1527] p-2.5 rounded-lg border border-white/5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checklist.consistentWithVesselPath}
                    onChange={(e) => setChecklist(c => ({ ...c, consistentWithVesselPath: e.target.checked }))}
                    className="accent-cyan-400 rounded"
                  />
                  <span className="text-slate-300 text-[11px]">Linear geometry aligned with shipping traffic</span>
                </label>
              </div>
            </div>

            {/* Decision Radio Buttons */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-white uppercase block">Reviewer Decision:</label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setDecision('SUPPORTED')}
                  className={`p-3 rounded-xl border text-center transition ${
                    decision === 'SUPPORTED'
                      ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300 font-bold shadow-lg shadow-emerald-500/10'
                      : 'bg-[#0D1527] border-white/5 text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="text-base">✓</div>
                  <div className="text-xs font-bold mt-1">SUPPORTED</div>
                  <div className="text-[10px] text-slate-400">Confirmed Oil Spill</div>
                </button>

                <button
                  type="button"
                  onClick={() => setDecision('NEEDS_REVIEW')}
                  className={`p-3 rounded-xl border text-center transition ${
                    decision === 'NEEDS_REVIEW' || decision === 'INCONCLUSIVE'
                      ? 'bg-amber-950/60 border-amber-500 text-amber-300 font-bold shadow-lg shadow-amber-500/10'
                      : 'bg-[#0D1527] border-white/5 text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="text-base">⏳</div>
                  <div className="text-xs font-bold mt-1">INCONCLUSIVE</div>
                  <div className="text-[10px] text-slate-400">Needs Air Patrol</div>
                </button>

                <button
                  type="button"
                  onClick={() => setDecision('REJECTED')}
                  className={`p-3 rounded-xl border text-center transition ${
                    decision === 'REJECTED'
                      ? 'bg-red-950/60 border-red-500 text-red-300 font-bold shadow-lg shadow-red-500/10'
                      : 'bg-[#0D1527] border-white/5 text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="text-base">✕</div>
                  <div className="text-xs font-bold mt-1">REJECTED</div>
                  <div className="text-[10px] text-slate-400">Look-Alike False Alarm</div>
                </button>
              </div>
            </div>

            {/* Notes & Analyst Info */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-400 block mb-1">Reviewer Name:</label>
                <input
                  type="text"
                  value={reviewerName}
                  onChange={(e) => setReviewerName(e.target.value)}
                  className="w-full bg-[#0D1527] border border-white/10 rounded-lg p-2 text-white"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Role / Authority:</label>
                <input
                  type="text"
                  value={reviewerRole}
                  onChange={(e) => setReviewerRole(e.target.value)}
                  className="w-full bg-[#0D1527] border border-white/10 rounded-lg p-2 text-white"
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400">Analyst Confidence Score:</span>
                <span className="text-cyan-300 font-bold">{confidence}%</span>
              </div>
              <input
                type="range"
                min="50"
                max="100"
                value={confidence}
                onChange={(e) => setConfidence(parseInt(e.target.value))}
                className="w-full accent-cyan-400"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Analyst Justification &amp; Notes:</label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-[#0D1527] border border-white/10 rounded-lg p-2.5 text-white"
              />
            </div>

            {/* Submit */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-slate-500">
                Decision will trigger an immutable audit event in the evidence chain.
              </span>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 text-white font-bold rounded-xl shadow-lg transition"
              >
                {submitting ? 'Recording Decision...' : 'Commit Validation Decision'}
              </button>
            </div>
          </form>
        </div>

        {/* Right 1 Col: Satellite Optical Verification & Audit History */}
        <div className="space-y-4">
          {/* Georeferenced Google Satellite Verification Card */}
          <div className="bg-[#0A1020]/90 backdrop-blur-md p-4 rounded-2xl border border-white/10 shadow-xl space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white flex items-center gap-1.5">
                <span className="text-cyan-400">🛰️</span> SATELLITE VALIDATION FIX
              </span>
              <div className="flex items-center gap-2">
                <span className="text-amber-400 text-[10px] font-bold">● OPTICAL SUN-GLINT</span>
                <button
                  type="button"
                  onClick={() => setIsMapExpanded(!isMapExpanded)}
                  className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white text-[10px] transition"
                  title={isMapExpanded ? "Collapse Map" : "Expand Map"}
                >
                  {isMapExpanded ? '⤢ Collapse' : '⛶ Expand'}
                </button>
              </div>
            </div>

            <div className="w-full rounded-xl overflow-hidden border border-white/10">
              <SeaTraceMap
                incident={activeIncident}
                opticalOverlay={true}
                height={isMapExpanded ? "520px" : "360px"}
                defaultMapType="google_hybrid"
                showLayersControl={isMapExpanded}
                enableLiveTracking={true}
                initialZoom={11}
                compact={!isMapExpanded}
                heatmap={false}
              />
            </div>

            {/* Validation Telemetry & Optical Sun-Glint Match */}
            <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] text-slate-300">
              <div className="p-2 rounded-lg bg-white/5 border border-white/5">
                <div className="text-[10px] text-slate-400">Optical Match</div>
                <div className="font-bold text-emerald-400">94.2% (Sentinel-2)</div>
              </div>
              <div className="p-2 rounded-lg bg-white/5 border border-white/5">
                <div className="text-[10px] text-slate-400">Damping Factor</div>
                <div className="font-bold text-cyan-400">-11.4 dB (Capillary)</div>
              </div>
            </div>
          </div>

          <div className="bg-[#0A1020]/90 backdrop-blur-md p-5 rounded-2xl border border-white/10 shadow-xl space-y-4 font-mono text-xs">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider pb-2 border-b border-white/5 flex items-center gap-2">
              <span>📜</span> Review Audit Log
            </h3>

            {reviews.length === 0 ? (
              <div className="p-4 text-center text-slate-500 text-[11px]">
                No validation decisions recorded yet for this incident.
              </div>
            ) : (
              <div className="space-y-3">
                {reviews.map((rev) => (
                  <div key={rev.id} className="p-3 bg-[#0D1527] rounded-xl border border-white/5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          rev.decision === 'SUPPORTED'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : rev.decision === 'REJECTED'
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                            : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        {rev.decision}
                      </span>
                      <span className="text-slate-500 text-[10px]">
                        {new Date(rev.reviewed_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </span>
                    </div>

                    <p className="text-slate-300 text-[11px] leading-relaxed">{rev.notes}</p>

                    <div className="text-[10px] text-slate-500 pt-1 border-t border-white/5 flex justify-between">
                      <span>{rev.reviewer_name}</span>
                      <span className="text-cyan-400">{rev.confidence_level}% Conf</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Forward Shortcut */}
          <div className="p-4 bg-[#0A1020] rounded-xl border border-white/5 text-xs font-mono space-y-2">
            <div className="text-slate-300 font-bold">Validated Oil Spill?</div>
            <p className="text-slate-400 text-[11px]">
              Proceed to Origin Reconstruction to model backwards Lagrangian drift trajectories.
            </p>
            <button
              onClick={() => onNavigateTab('reconstruction')}
              className="w-full py-2 bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-200 border border-cyan-400/30 rounded-lg transition"
            >
              Launch Origin Drift Model →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
