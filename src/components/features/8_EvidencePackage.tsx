import React, { useState, useEffect, useMemo } from 'react';
import type { Incident, EvidenceArtifact, AuditEvent, FeatureTab } from '../../types/seatrace';
import { fetchEvidenceArtifacts, fetchAuditEvents, recordAuditEvent } from '../../api/seatraceClient';
import {
  verifyArtifactIntegrity,
  validateManifestJson,
  generateEvidenceManifest
} from '../../utils/cryptoVerification';
import { triggerBrowserDownload } from '../../utils/exportEngine';

interface EvidencePackageProps {
  activeIncident: Incident | null;
  onNavigateTab: (tab: FeatureTab) => void;
}

export const EvidencePackage: React.FC<EvidencePackageProps> = ({
  activeIncident,
  onNavigateTab
}) => {
  const [evidenceList, setEvidenceList] = useState<EvidenceArtifact[]>([]);
  const [auditLog, setAuditLog] = useState<AuditEvent[]>([]);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [isVerifyingAll, setIsVerifyingAll] = useState(false);
  const [selectedArtifact, setSelectedArtifact] = useState<EvidenceArtifact | null>(null);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [activeViewTab, setActiveViewTab] = useState<'artifacts' | 'relationships' | 'audit_log'>('artifacts');
  const [statusBanner, setStatusBanner] = useState<{ type: 'success' | 'warning' | 'error' | 'info'; message: string } | null>(null);

  // Search, Filters & Sorting
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'time' | 'size' | 'id'>('time');

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

  const effectiveIncident = activeIncident || ({
    id: 'IN-2026-61C2',
    title: 'Kandla Deepwater Fairway Hydrocarbon Discharge',
    region: 'Arabian Sea (West Coast)',
    status: 'ACTIVE',
    severity: 'CRITICAL',
    lat: 22.7840,
    lng: 69.7120,
    detection_time: '2026-10-23T06:14:00Z',
    source: 'Sentinel-1C SAR (IW Mode)',
    estimated_volume_m3: 480.0,
    spill_type: 'Heavy Fuel Oil / Crude',
    created_at: '2026-10-23T06:30:00Z',
    updated_at: '2026-10-23T07:15:00Z'
  } as Incident);

  // Load Evidence and Audit log
  useEffect(() => {
    fetchEvidenceArtifacts(effectiveIncident.id).then((ev) => {
      setEvidenceList(ev);
    });
    fetchAuditEvents(effectiveIncident.id).then((events) => {
      setAuditLog(events);
    });
  }, [effectiveIncident.id]);

  // Requirement 1: Calculate summary dynamically from real stored records
  const summary = useMemo(() => {
    const total = evidenceList.length;
    const verified = evidenceList.filter(e => e.verification_status === 'VERIFIED').length;
    const mismatches = evidenceList.filter(e => e.verification_status === 'INTEGRITY_MISMATCH').length;
    const unverified = evidenceList.filter(e => e.verification_status === 'UNVERIFIED').length;
    const failed = evidenceList.filter(e => e.verification_status === 'VERIFICATION_FAILED').length;
    const integrityScore = total > 0 ? Math.round((verified / total) * 100) : 0;

    return { total, verified, mismatches, unverified, failed, integrityScore };
  }, [evidenceList]);

  // Requirement 2: Real SHA-256 verification
  const handleVerify = async (art: EvidenceArtifact) => {
    setVerifyingId(art.id);
    const result = await verifyArtifactIntegrity(art);

    // Update artifact status in state
    setEvidenceList(prev => prev.map(item => {
      if (item.id === art.id) {
        const historyEntry = {
          timestamp: new Date().toISOString(),
          actor: 'Investigator Priya Nair (DGLL Forensic)',
          action: 'HASH_CHECK' as const,
          calculated_hash: result.calculated_hash,
          expected_hash: result.expected_hash,
          status: result.status,
          message: result.error_message
        };

        return {
          ...item,
          verification_status: result.status,
          calculated_hash: result.calculated_hash,
          verification_history: [historyEntry, ...(item.verification_history || [])]
        };
      }
      return item;
    }));

    if (selectedArtifact && selectedArtifact.id === art.id) {
      setSelectedArtifact(prev => prev ? {
        ...prev,
        verification_status: result.status,
        calculated_hash: result.calculated_hash
      } : null);
    }

    // Append to audit log
    const auditOutcome = result.is_match ? 'VERIFIED' : 'MISMATCH_DETECTED';
    const auditDetails = result.is_match
      ? `SHA-256 verified successfully against recorded digest (${result.calculated_hash.substring(0, 12)}...)`
      : `INTEGRITY MISMATCH DETECTED: Computed ${result.calculated_hash.substring(0, 12)}... does not match recorded digest`;

    const newAuditEvent = await recordAuditEvent(effectiveIncident.id, {
      action: result.is_match ? 'SHA256_VERIFICATION_PASS' : 'INTEGRITY_MISMATCH_ALERT',
      actor: 'Investigator Priya Nair (DGLL Forensic)',
      artifact_id: art.id,
      outcome: auditOutcome,
      details: auditDetails
    });

    setAuditLog(prev => [newAuditEvent, ...prev]);

    if (result.is_match) {
      setStatusBanner({
        type: 'success',
        message: `Artifact ${art.id} integrity authenticated: SHA-256 digest matches exact recorded bytes.`
      });
    } else {
      setStatusBanner({
        type: 'error',
        message: `CRITICAL INTEGRITY MISMATCH on ${art.id}: Calculated SHA-256 does not match recorded digest! Byte stream has been altered.`
      });
    }

    setVerifyingId(null);
  };

  // Batch Verify All Artifacts
  const handleVerifyAll = async () => {
    setIsVerifyingAll(true);
    setStatusBanner({ type: 'info', message: 'Running Web Crypto SHA-256 byte verification across all custody artifacts...' });

    let passCount = 0;
    let failCount = 0;

    for (const art of evidenceList) {
      const result = await verifyArtifactIntegrity(art);
      if (result.is_match) passCount++;
      else failCount++;

      setEvidenceList(prev => prev.map(item => {
        if (item.id === art.id) {
          return {
            ...item,
            verification_status: result.status,
            calculated_hash: result.calculated_hash
          };
        }
        return item;
      }));
      await new Promise(r => setTimeout(r, 80));
    }

    const auditEntry = await recordAuditEvent(effectiveIncident.id, {
      action: 'BATCH_VAULT_VERIFICATION',
      actor: 'Automated Integrity Daemon',
      outcome: failCount > 0 ? 'MISMATCH_DETECTED' : 'VERIFIED',
      details: `Batch SHA-256 check complete: ${passCount} authenticated, ${failCount} mismatches detected.`
    });

    setAuditLog(prev => [auditEntry, ...prev]);
    setIsVerifyingAll(false);

    if (failCount > 0) {
      setStatusBanner({
        type: 'warning',
        message: `Batch Verification Complete: ${passCount} verified, but ${failCount} integrity mismatches detected!`
      });
    } else {
      setStatusBanner({
        type: 'success',
        message: `All ${passCount} custody artifacts verified against trusted SHA-256 digests. Zero divergence.`
      });
    }
  };

  // Requirement 2 & 12: Simulate Tampering Toggle for Demonstration & Testing
  const handleToggleTamper = async (art: EvidenceArtifact) => {
    const isNowTampered = !art.is_tampered;

    setEvidenceList(prev => prev.map(item => {
      if (item.id === art.id) {
        return {
          ...item,
          is_tampered: isNowTampered,
          verification_status: 'UNVERIFIED',
          calculated_hash: undefined
        };
      }
      return item;
    }));

    if (selectedArtifact && selectedArtifact.id === art.id) {
      setSelectedArtifact(prev => prev ? {
        ...prev,
        is_tampered: isNowTampered,
        verification_status: 'UNVERIFIED',
        calculated_hash: undefined
      } : null);
    }

    const auditEvent = await recordAuditEvent(effectiveIncident.id, {
      action: isNowTampered ? 'SIMULATE_BYTE_TAMPERING' : 'RESTORE_ORIGINAL_BYTES',
      actor: 'Security Auditor (Integrity Testing)',
      artifact_id: art.id,
      outcome: 'INFO',
      details: isNowTampered
        ? `Injected simulated byte mutation into ${art.id} to test tamper-detection engine.`
        : `Restored authentic original byte stream for ${art.id}.`
    });

    setAuditLog(prev => [auditEvent, ...prev]);

    setStatusBanner({
      type: isNowTampered ? 'warning' : 'info',
      message: isNowTampered
        ? `Simulated tampering applied to ${art.id}. Click 'Verify SHA-256' to see the mismatch detection engine in action.`
        : `Authentic byte stream restored for ${art.id}.`
    });
  };

  // Copy Digest to Clipboard
  const handleCopyDigest = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2500);
  };

  // Requirement 4: Download Original File
  const handleDownloadFile = (art: EvidenceArtifact) => {
    const content = art.is_tampered && art.tampered_content
      ? art.tampered_content
      : art.raw_content || 'EMPTY';

    const blob = new Blob([content], { type: art.mime_type || 'text/plain' });
    triggerBrowserDownload(blob, art.filename || `${art.id}.dat`);

    recordAuditEvent(effectiveIncident.id, {
      action: 'ORIGINAL_FILE_DOWNLOADED',
      actor: 'Forensic Officer Priya Nair',
      artifact_id: art.id,
      outcome: 'SUCCESS',
      details: `Downloaded original evidence file: ${art.filename} (${art.file_size_bytes} bytes)`
    }).then(event => setAuditLog(prev => [event, ...prev]));
  };

  // Requirement 7: Improved JSON Evidence Manifest with Validation
  const handleDownloadManifest = () => {
    try {
      const manifestObj = generateEvidenceManifest(effectiveIncident, evidenceList, auditLog);
      const manifestString = JSON.stringify(manifestObj, null, 2);

      // Validate JSON schema and completeness before download
      const validation = validateManifestJson(manifestString);
      if (!validation.valid) {
        setStatusBanner({
          type: 'error',
          message: `Manifest validation failed: ${validation.errors.join(', ')}`
        });
        return;
      }

      const blob = new Blob([manifestString], { type: 'application/json' });
      triggerBrowserDownload(blob, `EVIDENCE_MANIFEST_${effectiveIncident.id}_${new Date().toISOString().substring(0, 10)}.json`);

      recordAuditEvent(effectiveIncident.id, {
        action: 'EVIDENCE_MANIFEST_GENERATED',
        actor: 'Forensic Officer Priya Nair',
        outcome: 'SUCCESS',
        details: `Exported validated JSON evidence manifest with ${evidenceList.length} artifacts and ${auditLog.length} audit trail records.`
      }).then(event => setAuditLog(prev => [event, ...prev]));

      setStatusBanner({
        type: 'success',
        message: `Validated Evidence Manifest JSON generated and downloaded to your device.`
      });
    } catch (err: any) {
      setStatusBanner({
        type: 'error',
        message: `Manifest generation failure: ${err?.message}`
      });
    }
  };

  // Filtered & Sorted Artifacts
  const filteredArtifacts = useMemo(() => {
    return evidenceList.filter((art) => {
      const term = searchTerm.toLowerCase();
      const matchesSearch =
        art.id.toLowerCase().includes(term) ||
        art.title.toLowerCase().includes(term) ||
        art.filename.toLowerCase().includes(term) ||
        art.sha256_hash.toLowerCase().includes(term) ||
        art.source_provenance.toLowerCase().includes(term) ||
        art.collector.toLowerCase().includes(term);

      if (!matchesSearch) return false;

      if (typeFilter !== 'ALL' && art.artifact_type !== typeFilter) return false;
      if (statusFilter !== 'ALL' && art.verification_status !== statusFilter) return false;

      return true;
    }).sort((a, b) => {
      if (sortBy === 'time') return new Date(b.ingested_at).getTime() - new Date(a.ingested_at).getTime();
      if (sortBy === 'size') return b.file_size_bytes - a.file_size_bytes;
      return a.id.localeCompare(b.id);
    });
  }, [evidenceList, searchTerm, typeFilter, statusFilter, sortBy]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className={`p-6 rounded-2xl border transition-all duration-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 ${
        isLightMode
          ? 'bg-white border-slate-200'
          : 'bg-[#0A1020]/90 border-white/10'
      }`}>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs font-mono font-semibold tracking-wider uppercase ${
              isLightMode ? 'text-cyan-700' : 'text-cyan-400'
            }`}>
              Feature 8 — Cryptographic Chain of Custody
            </span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
              isLightMode ? 'bg-emerald-100 text-emerald-800' : 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/30'
            }`}>
              ● SHA-256 VAULT ACTIVE
            </span>
          </div>
          <h2 className={`text-xl font-bold tracking-tight ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
            Evidence Provenance &amp; SHA-256 Audit Repository
          </h2>
          <p className={`text-xs mt-1 ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
            Tamper-evident verification of raw radar rasters, SNN detection masks, drift simulation solutions, and DGLL transponder kinematics.
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2.5 shrink-0">
          <button
            onClick={handleVerifyAll}
            disabled={isVerifyingAll}
            className={`px-3.5 py-2 rounded-xl font-mono text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              isLightMode
                ? 'bg-cyan-50 text-cyan-800 border border-cyan-300 hover:bg-cyan-100'
                : 'bg-cyan-950/50 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-900/50'
            }`}
          >
            {isVerifyingAll ? (
              <>
                <span className="w-3 h-3 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></span>
                Verifying Vault...
              </>
            ) : (
              <>
                <span>🛡️</span> Batch Verify All
              </>
            )}
          </button>

          <button
            onClick={handleDownloadManifest}
            className={`px-3.5 py-2 rounded-xl font-mono text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              isLightMode
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300'
                : 'bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10'
            }`}
            title="Download Validated JSON Manifest"
          >
            <span>📥</span> Evidence Manifest (JSON)
          </button>

          <button
            onClick={() => onNavigateTab('reports')}
            className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 text-white font-mono font-bold text-xs rounded-xl shadow-md transition cursor-pointer flex items-center gap-1.5"
          >
            <span>📑</span> Export Dossier →
          </button>
        </div>
      </div>

      {/* Requirement 1: Summary KPI Cards (Dynamically Calculated) */}
      <div className={`p-4 rounded-2xl border transition-all shadow-sm grid grid-cols-2 sm:grid-cols-5 gap-3 font-mono text-xs ${
        isLightMode ? 'bg-white border-slate-200' : 'bg-[#0A1020]/90 border-white/10'
      }`}>
        <div className="space-y-0.5">
          <div className={`text-[10px] uppercase font-semibold ${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>Total Artifacts</div>
          <div className={`text-xl font-bold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
            {summary.total}
          </div>
          <div className="text-[10px] text-slate-400">Stored custody records</div>
        </div>

        <div className="space-y-0.5">
          <div className={`text-[10px] uppercase font-semibold ${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>Verified Intact</div>
          <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <span>✓</span> {summary.verified}
          </div>
          <div className="text-[10px] text-slate-400">Matched byte digests</div>
        </div>

        <div className="space-y-0.5">
          <div className={`text-[10px] uppercase font-semibold ${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>Integrity Mismatches</div>
          <div className={`text-xl font-bold flex items-center gap-1 ${
            summary.mismatches > 0 ? 'text-red-600 dark:text-red-400 animate-pulse' : 'text-slate-500'
          }`}>
            <span>⚠️</span> {summary.mismatches}
          </div>
          <div className="text-[10px] text-slate-400">Digest divergence alerts</div>
        </div>

        <div className="space-y-0.5">
          <div className={`text-[10px] uppercase font-semibold ${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>Unverified</div>
          <div className={`text-xl font-bold ${isLightMode ? 'text-amber-700' : 'text-amber-400'}`}>
            ⏳ {summary.unverified}
          </div>
          <div className="text-[10px] text-slate-400">Pending byte verification</div>
        </div>

        <div className="space-y-0.5 col-span-2 sm:col-span-1">
          <div className={`text-[10px] uppercase font-semibold ${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>Vault Authenticity</div>
          <div className={`text-xl font-bold ${
            summary.mismatches > 0 ? 'text-red-600' : summary.verified === summary.total && summary.total > 0 ? 'text-emerald-600' : 'text-cyan-600 dark:text-cyan-400'
          }`}>
            {summary.integrityScore}%
          </div>
          <div className="text-[10px] text-slate-400">SHA-256 authenticated</div>
        </div>
      </div>

      {/* Notification Banner */}
      {statusBanner && (
        <div className={`p-4 rounded-xl border font-mono text-xs flex items-center justify-between gap-3 shadow-sm transition-all ${
          statusBanner.type === 'success'
            ? isLightMode ? 'bg-emerald-50 border-emerald-300 text-emerald-900' : 'bg-emerald-950/80 border-emerald-500/40 text-emerald-200'
            : statusBanner.type === 'error'
            ? isLightMode ? 'bg-red-50 border-red-300 text-red-900' : 'bg-red-950/80 border-red-500/40 text-red-200'
            : statusBanner.type === 'warning'
            ? isLightMode ? 'bg-amber-50 border-amber-300 text-amber-900' : 'bg-amber-950/80 border-amber-500/40 text-amber-200'
            : isLightMode ? 'bg-cyan-50 border-cyan-300 text-cyan-900' : 'bg-cyan-950/80 border-cyan-500/40 text-cyan-200'
        }`}>
          <div className="flex items-center gap-2">
            <span>{statusBanner.type === 'success' ? '✅' : statusBanner.type === 'error' ? '🚨' : statusBanner.type === 'warning' ? '⚠️' : 'ℹ️'}</span>
            <span>{statusBanner.message}</span>
          </div>
          <button onClick={() => setStatusBanner(null)} className="text-xs opacity-60 hover:opacity-100 cursor-pointer">✕</button>
        </div>
      )}

      {/* Sub-Navigation: Artifacts vs Relationship Graph vs Append-Only Audit Log */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-white/10 pb-2">
        <button
          onClick={() => setActiveViewTab('artifacts')}
          className={`px-3.5 py-1.5 rounded-xl font-mono text-xs font-bold transition cursor-pointer ${
            activeViewTab === 'artifacts'
              ? isLightMode ? 'bg-cyan-100 text-cyan-900 border border-cyan-300' : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
              : isLightMode ? 'text-slate-600 hover:bg-slate-100' : 'text-slate-400 hover:bg-white/5'
          }`}
        >
          📂 Custody Artifacts ({filteredArtifacts.length})
        </button>

        <button
          onClick={() => setActiveViewTab('relationships')}
          className={`px-3.5 py-1.5 rounded-xl font-mono text-xs font-bold transition cursor-pointer ${
            activeViewTab === 'relationships'
              ? isLightMode ? 'bg-cyan-100 text-cyan-900 border border-cyan-300' : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
              : isLightMode ? 'text-slate-600 hover:bg-slate-100' : 'text-slate-400 hover:bg-white/5'
          }`}
        >
          🔗 Evidence Relationships Graph
        </button>

        <button
          onClick={() => setActiveViewTab('audit_log')}
          className={`px-3.5 py-1.5 rounded-xl font-mono text-xs font-bold transition cursor-pointer ${
            activeViewTab === 'audit_log'
              ? isLightMode ? 'bg-cyan-100 text-cyan-900 border border-cyan-300' : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
              : isLightMode ? 'text-slate-600 hover:bg-slate-100' : 'text-slate-400 hover:bg-white/5'
          }`}
        >
          📜 Append-Only Audit Log ({auditLog.length})
        </button>
      </div>

      {/* TAB 1: ARTIFACTS TABLE VIEW */}
      {activeViewTab === 'artifacts' && (
        <div className="space-y-4">
          {/* Controls: Search, Type Filter, Status Filter, Sorting */}
          <div className={`p-4 rounded-2xl border transition-all shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 font-mono text-xs ${
            isLightMode ? 'bg-white border-slate-200' : 'bg-[#0A1020]/90 border-white/10'
          }`}>
            <div className="flex items-center flex-wrap gap-2">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className={`px-3 py-1.5 rounded-xl border focus:outline-none ${
                  isLightMode ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-[#0D1527] border-white/10 text-slate-200'
                }`}
              >
                <option value="ALL">All Types</option>
                <option value="RAW_SAR_SCENE">Raw SAR Scene</option>
                <option value="DETECTION_MASK">Detection Mask</option>
                <option value="VALIDATION_REVIEW">Validation Review</option>
                <option value="DRIFT_SIMULATION_LOG">Drift Simulation</option>
                <option value="AIS_CORRIDOR_EXTRACT">AIS Kinematics</option>
                <option value="LEGAL_DOSSIER">Legal Dossier</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={`px-3 py-1.5 rounded-xl border focus:outline-none ${
                  isLightMode ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-[#0D1527] border-white/10 text-slate-200'
                }`}
              >
                <option value="ALL">All Statuses</option>
                <option value="VERIFIED">Verified (✓)</option>
                <option value="INTEGRITY_MISMATCH">Integrity Mismatch (⚠️)</option>
                <option value="UNVERIFIED">Unverified (⏳)</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className={`px-3 py-1.5 rounded-xl border focus:outline-none ${
                  isLightMode ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-[#0D1527] border-white/10 text-slate-200'
                }`}
              >
                <option value="time">Sort by Ingestion Time</option>
                <option value="size">Sort by File Size</option>
                <option value="id">Sort by Artifact ID</option>
              </select>
            </div>

            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search artifact ID, title, filename, hash..."
                className={`w-full sm:w-72 px-3.5 py-1.5 rounded-xl border focus:outline-none focus:ring-1 focus:ring-cyan-500 ${
                  isLightMode ? 'bg-slate-50 border-slate-300 text-slate-800 placeholder-slate-400' : 'bg-[#0D1527] border-white/10 text-white placeholder-slate-500'
                }`}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Table */}
          <div className={`rounded-2xl border transition-all duration-200 shadow-sm overflow-hidden font-mono text-xs ${
            isLightMode ? 'bg-white border-slate-200' : 'bg-[#0A1020]/90 border-white/10'
          }`}>
            <div className={`p-4 border-b flex items-center justify-between ${
              isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-[#0D1527] border-white/5'
            }`}>
              <span className={`font-bold uppercase flex items-center gap-2 ${
                isLightMode ? 'text-slate-900' : 'text-white'
              }`}>
                <span>🔒</span> Chain of Custody Registry ({filteredArtifacts.length} Artifacts)
              </span>
              <span className={`text-[11px] ${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>
                Indian Maritime Investigation Act Statutory Vault
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className={`border-b text-[11px] ${
                  isLightMode ? 'bg-slate-100 text-slate-600 border-slate-200' : 'bg-[#0D1527] text-slate-400 border-white/5'
                }`}>
                  <tr>
                    <th className="p-3">Artifact ID &amp; File</th>
                    <th className="p-3">Type &amp; Provenance</th>
                    <th className="p-3">Recorded SHA-256 Digest</th>
                    <th className="p-3">Size</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Integrity Actions</th>
                  </tr>
                </thead>
                <tbody className={`divide-y text-xs ${
                  isLightMode ? 'divide-slate-200 text-slate-700' : 'divide-white/5 text-slate-300'
                }`}>
                  {filteredArtifacts.map((art) => {
                    const isChecking = verifyingId === art.id;
                    const isVerified = art.verification_status === 'VERIFIED';
                    const isMismatch = art.verification_status === 'INTEGRITY_MISMATCH';

                    return (
                      <tr
                        key={art.id}
                        className={`transition cursor-pointer ${
                          isLightMode ? 'hover:bg-slate-50' : 'hover:bg-white/5'
                        }`}
                        onClick={() => setSelectedArtifact(art)}
                      >
                        <td className="p-3">
                          <div className={`font-bold flex items-center gap-1.5 ${isLightMode ? 'text-cyan-800' : 'text-cyan-400'}`}>
                            <span>📄</span> {art.id}
                          </div>
                          <div className={`text-[11px] font-medium truncate max-w-[220px] ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                            {art.title}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono truncate max-w-[220px]">
                            {art.filename}
                          </div>
                        </td>

                        <td className="p-3">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border mb-1 ${
                            isLightMode ? 'bg-slate-100 text-slate-800 border-slate-200' : 'bg-white/5 text-slate-300 border-white/10'
                          }`}>
                            {art.artifact_type}
                          </span>
                          <div className={`text-[11px] truncate max-w-[200px] ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
                            {art.collector}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {art.source_provenance}
                          </div>
                        </td>

                        <td className="p-3">
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] font-mono text-cyan-600 dark:text-cyan-300 truncate max-w-[150px]" title={art.sha256_hash}>
                              {art.sha256_hash.substring(0, 16)}...
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopyDigest(art.sha256_hash);
                              }}
                              className="text-[10px] p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white"
                              title="Copy SHA-256 Digest"
                            >
                              {copiedHash === art.sha256_hash ? '✓' : '📋'}
                            </button>
                          </div>
                          {art.calculated_hash && (
                            <div className="text-[9px] text-slate-400">
                              Computed: {art.calculated_hash.substring(0, 12)}...
                            </div>
                          )}
                        </td>

                        <td className="p-3 whitespace-nowrap">
                          {(art.file_size_bytes / 1024).toFixed(1)} KB
                          <div className="text-[10px] text-slate-400">
                            {art.mime_type.split('/')[1]?.toUpperCase() || 'FILE'}
                          </div>
                        </td>

                        <td className="p-3">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                            isVerified
                              ? isLightMode ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
                              : isMismatch
                              ? isLightMode ? 'bg-red-100 text-red-800 border-red-300 animate-pulse' : 'bg-red-950/80 text-red-300 border-red-500/40 animate-pulse'
                              : isLightMode ? 'bg-slate-100 text-slate-700 border-slate-300' : 'bg-white/5 text-slate-400 border-white/10'
                          }`}>
                            {isVerified ? '✓ VERIFIED' : isMismatch ? '⚠️ MISMATCH' : '⏳ UNVERIFIED'}
                          </span>
                          {art.is_tampered && (
                            <div className="text-[9px] text-amber-600 font-bold mt-0.5">
                              [SIMULATED TAMPERING]
                            </div>
                          )}
                        </td>

                        <td className="p-3 text-right whitespace-nowrap space-x-1.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleVerify(art)}
                            disabled={isChecking}
                            className={`px-3 py-1 rounded-lg text-[10px] font-bold border transition cursor-pointer ${
                              isVerified
                                ? isLightMode ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : 'bg-emerald-950/40 text-emerald-300 border-emerald-500/30'
                                : isMismatch
                                ? isLightMode ? 'bg-red-50 text-red-700 border-red-300' : 'bg-red-950/40 text-red-300 border-red-500/30'
                                : isLightMode ? 'bg-cyan-50 text-cyan-800 border-cyan-300 hover:bg-cyan-100' : 'bg-cyan-600/20 text-cyan-300 border-cyan-500/30 hover:bg-cyan-600/40'
                            }`}
                          >
                            {isChecking ? 'Hashing...' : 'Verify SHA-256'}
                          </button>

                          <button
                            onClick={() => handleDownloadFile(art)}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition cursor-pointer ${
                              isLightMode ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300' : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10'
                            }`}
                            title="Download Original File"
                          >
                            📥
                          </button>

                          <button
                            onClick={() => handleToggleTamper(art)}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition cursor-pointer ${
                              art.is_tampered
                                ? isLightMode ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-amber-950/60 text-amber-300 border-amber-500/30'
                                : isLightMode ? 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-amber-50' : 'bg-white/5 text-slate-400 border-white/5 hover:bg-white/10'
                            }`}
                            title={art.is_tampered ? 'Restore Authentic File' : 'Inject Simulated Tampering'}
                          >
                            {art.is_tampered ? '↺ Restore' : '⚡ Tamper Test'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: EVIDENCE RELATIONSHIPS GRAPH (Requirement 6) */}
      {activeViewTab === 'relationships' && (
        <div className={`p-6 rounded-2xl border transition-all duration-200 shadow-sm font-mono text-xs space-y-6 ${
          isLightMode ? 'bg-white border-slate-200' : 'bg-[#0A1020]/90 border-white/10'
        }`}>
          <div>
            <h3 className={`text-sm font-bold uppercase tracking-wider flex items-center gap-2 ${
              isLightMode ? 'text-slate-900' : 'text-white'
            }`}>
              <span>🔗</span> End-to-End Forensic Investigation Chain of Custody
            </h3>
            <p className={`text-xs mt-1 ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
              Traceability graph connecting initial satellite backscatter acquisition through SNN segmentation, validation sign-off, Lagrangian origin drift, vessel attribution, and legal dossiers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {evidenceList.map((art, index) => {
              const isVerified = art.verification_status === 'VERIFIED';
              const isMismatch = art.verification_status === 'INTEGRITY_MISMATCH';

              return (
                <div
                  key={art.id}
                  onClick={() => setSelectedArtifact(art)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer relative ${
                    isLightMode
                      ? 'bg-slate-50 hover:bg-slate-100 border-slate-200 hover:border-cyan-400'
                      : 'bg-[#0D1527] hover:bg-[#121c35] border-white/5 hover:border-cyan-500/40'
                  }`}
                >
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200/50 dark:border-white/5">
                    <span className="text-[10px] font-bold text-cyan-600 dark:text-cyan-400">
                      Step 0{index + 1} • {art.id}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${
                      isVerified
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        : isMismatch
                        ? 'bg-red-100 text-red-800 border-red-300'
                        : 'bg-slate-200 text-slate-700 border-slate-300'
                    }`}>
                      {art.verification_status}
                    </span>
                  </div>

                  <h4 className={`font-bold text-xs mt-2.5 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                    {art.title}
                  </h4>

                  <div className={`text-[11px] mt-1 ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
                    {art.relationship_summary || 'Linked forensic artifact in chain of custody.'}
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-200/50 dark:border-white/5 flex items-center justify-between text-[10px] text-slate-400">
                    <span>{art.filename}</span>
                    <span>{(art.file_size_bytes / 1024).toFixed(1)} KB</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: APPEND-ONLY AUDIT LOG (Requirement 5) */}
      {activeViewTab === 'audit_log' && (
        <div className={`p-6 rounded-2xl border transition-all duration-200 shadow-sm font-mono text-xs space-y-4 ${
          isLightMode ? 'bg-white border-slate-200' : 'bg-[#0A1020]/90 border-white/10'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-white/10">
            <div>
              <h3 className={`text-sm font-bold uppercase tracking-wider flex items-center gap-2 ${
                isLightMode ? 'text-slate-900' : 'text-white'
              }`}>
                <span>📜</span> Cryptographic Append-Only Audit Ledger
              </h3>
              <p className={`text-xs mt-0.5 ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
                Write-once event ledger capturing evidence collections, verification runs, tamper alerts, and dossier exports.
              </p>
            </div>
            <div className={`text-[10px] px-3 py-1.5 rounded-xl border ${
              isLightMode ? 'bg-amber-50 text-amber-900 border-amber-200' : 'bg-amber-950/40 text-amber-300 border-amber-500/30'
            }`}>
              🔒 Strict Tamper-Resistance: Modification and Deletion Disabled
            </div>
          </div>

          <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
            {auditLog.map((event) => {
              const isAlert = event.outcome === 'MISMATCH_DETECTED';
              const isPass = event.outcome === 'VERIFIED';

              return (
                <div
                  key={event.id}
                  className={`p-3.5 rounded-xl border transition-all ${
                    isAlert
                      ? isLightMode ? 'bg-red-50/80 border-red-300' : 'bg-red-950/30 border-red-500/40'
                      : isPass
                      ? isLightMode ? 'bg-emerald-50/50 border-emerald-200' : 'bg-emerald-950/20 border-emerald-500/20'
                      : isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-[#0D1527] border-white/5'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                    <div className="flex items-center gap-2">
                      <span className={`font-bold ${isLightMode ? 'text-cyan-800' : 'text-cyan-400'}`}>
                        {event.id}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${
                        isAlert
                          ? 'bg-red-100 text-red-800 border-red-300'
                          : isPass
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : 'bg-slate-200 text-slate-800 border-slate-300'
                      }`}>
                        {event.action}
                      </span>
                      {event.artifact_id && (
                        <span className="text-[10px] text-slate-500 font-semibold">
                          [{event.artifact_id}]
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400">
                      {new Date(event.timestamp).toLocaleString()} IST
                    </span>
                  </div>

                  <div className={`text-xs mt-1 ${isLightMode ? 'text-slate-800' : 'text-slate-200'}`}>
                    {event.details}
                  </div>

                  <div className="text-[10px] text-slate-400 mt-1.5 flex items-center gap-1.5">
                    <span>Authenticated Officer:</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{event.actor}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Requirement 4: Artifact Details & File Preview Modal / Sliding Panel */}
      {selectedArtifact && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl border shadow-2xl p-6 font-mono text-xs space-y-5 ${
            isLightMode ? 'bg-white border-slate-300 text-slate-800' : 'bg-[#0A1020] border-white/20 text-slate-200'
          }`}>
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/10">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-cyan-600 dark:text-cyan-400 font-bold">{selectedArtifact.id}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-white/10 border border-slate-300 dark:border-white/10">
                    {selectedArtifact.artifact_type}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                    selectedArtifact.verification_status === 'VERIFIED'
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : selectedArtifact.verification_status === 'INTEGRITY_MISMATCH'
                      ? 'bg-red-100 text-red-800 border-red-300'
                      : 'bg-slate-100 text-slate-700 border-slate-300'
                  }`}>
                    {selectedArtifact.verification_status}
                  </span>
                </div>
                <h3 className={`text-base font-bold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                  {selectedArtifact.title}
                </h3>
              </div>

              <button
                onClick={() => setSelectedArtifact(null)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/10 flex items-center justify-center text-slate-500 hover:text-slate-800 dark:hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Digest Comparison Block */}
            <div className={`p-4 rounded-2xl border space-y-2.5 ${
              isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-[#0D1527] border-white/10'
            }`}>
              <div className="flex items-center justify-between">
                <span className="font-bold uppercase tracking-wider text-[11px] text-cyan-700 dark:text-cyan-400">
                  Cryptographic Integrity Verification
                </span>
                <button
                  onClick={() => handleCopyDigest(selectedArtifact.sha256_hash)}
                  className="text-[10px] px-2 py-1 bg-cyan-100 dark:bg-cyan-950/60 text-cyan-800 dark:text-cyan-300 rounded-md font-bold cursor-pointer"
                >
                  {copiedHash === selectedArtifact.sha256_hash ? '✓ Digest Copied' : '📋 Copy SHA-256'}
                </button>
              </div>

              <div className="space-y-1.5 text-[11px]">
                <div>
                  <span className="text-slate-500">Trusted Recorded Digest: </span>
                  <span className="font-mono text-cyan-600 dark:text-cyan-300 break-all select-all font-bold">
                    {selectedArtifact.sha256_hash}
                  </span>
                </div>

                {selectedArtifact.calculated_hash && (
                  <div>
                    <span className="text-slate-500">Calculated Byte Digest: </span>
                    <span className={`font-mono break-all select-all font-bold ${
                      selectedArtifact.calculated_hash === selectedArtifact.sha256_hash
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {selectedArtifact.calculated_hash}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Complete Metadata Inspection Table (Requirement 3) */}
            <div className={`p-4 rounded-2xl border space-y-2 ${
              isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-[#0D1527] border-white/10'
            }`}>
              <h4 className="font-bold text-[11px] uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Complete Evidence Provenance Metadata
              </h4>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div><span className="text-slate-500">Filename:</span> <b className="text-slate-800 dark:text-slate-200">{selectedArtifact.filename}</b></div>
                <div><span className="text-slate-500">MIME Type:</span> <b className="text-slate-800 dark:text-slate-200">{selectedArtifact.mime_type}</b></div>
                <div><span className="text-slate-500">File Size:</span> <b className="text-slate-800 dark:text-slate-200">{selectedArtifact.file_size_bytes} Bytes ({(selectedArtifact.file_size_bytes / 1024).toFixed(1)} KB)</b></div>
                <div><span className="text-slate-500">Collector / Officer:</span> <b className="text-slate-800 dark:text-slate-200">{selectedArtifact.collector}</b></div>
                <div><span className="text-slate-500">Source Provenance:</span> <b className="text-slate-800 dark:text-slate-200">{selectedArtifact.source_provenance}</b></div>
                <div><span className="text-slate-500">Ingestion Timestamp:</span> <b className="text-slate-800 dark:text-slate-200">{new Date(selectedArtifact.ingested_at).toLocaleString()} IST</b></div>
                {selectedArtifact.acquisition_time && (
                  <div><span className="text-slate-500">Acquisition Time:</span> <b className="text-slate-800 dark:text-slate-200">{new Date(selectedArtifact.acquisition_time).toLocaleString()} IST</b></div>
                )}
              </div>
            </div>

            {/* File Preview (Requirement 4) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-[11px] uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Original Byte Stream Preview ({selectedArtifact.filename})
                </h4>
                <button
                  onClick={() => handleDownloadFile(selectedArtifact)}
                  className="text-[11px] px-3 py-1 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-lg transition cursor-pointer"
                >
                  📥 Download Original File
                </button>
              </div>

              <div className={`p-3.5 rounded-2xl border max-h-56 overflow-y-auto font-mono text-[11px] leading-relaxed select-all ${
                isLightMode ? 'bg-slate-100 border-slate-300 text-slate-900' : 'bg-[#050B14] border-white/10 text-cyan-200/90'
              }`}>
                <pre className="whitespace-pre-wrap break-all">
                  {selectedArtifact.is_tampered && selectedArtifact.tampered_content
                    ? selectedArtifact.tampered_content
                    : selectedArtifact.raw_content || 'No text preview available for binary file.'}
                </pre>
              </div>
            </div>

            {/* Processing History (Requirement 3) */}
            {selectedArtifact.processing_history && selectedArtifact.processing_history.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-bold text-[11px] uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Processing &amp; Transformation History
                </h4>
                <div className="space-y-1">
                  {selectedArtifact.processing_history.map((step, i) => (
                    <div key={i} className="flex items-center gap-2 text-[11px]">
                      <span className="text-cyan-500 font-bold">Step {i + 1}:</span>
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="pt-3 border-t border-slate-200 dark:border-white/10 flex items-center justify-between flex-wrap gap-2">
              <button
                onClick={() => handleToggleTamper(selectedArtifact)}
                className={`px-3 py-2 rounded-xl font-bold text-xs border transition cursor-pointer ${
                  selectedArtifact.is_tampered
                    ? 'bg-amber-100 text-amber-900 border-amber-300'
                    : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-amber-50'
                }`}
              >
                {selectedArtifact.is_tampered ? '↺ Restore Authentic File' : '⚡ Simulate Tampering (Corrupt 1 Byte)'}
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleVerify(selectedArtifact)}
                  disabled={verifyingId === selectedArtifact.id}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl shadow transition cursor-pointer"
                >
                  {verifyingId === selectedArtifact.id ? 'Calculating Digest...' : 'Verify SHA-256 Digest'}
                </button>
                <button
                  onClick={() => setSelectedArtifact(null)}
                  className="px-4 py-2 bg-slate-200 dark:bg-white/10 text-slate-800 dark:text-white font-bold rounded-xl transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
