import React, { useState, useEffect } from 'react';
import type { Incident, FeatureTab } from '../../types/seatrace';
import { generateAndDownloadReport } from '../../api/seatraceClient';

interface ReportsExportsProps {
  activeIncident: Incident | null;
  onNavigateTab: (tab: FeatureTab) => void;
}

interface ExportHistoryItem {
  id: string;
  format: 'PDF' | 'XLSX' | 'CSV' | 'GEOJSON';
  filename: string;
  timestamp: string;
  fileSize: string;
}

export const ReportsExports: React.FC<ReportsExportsProps> = ({
  activeIncident,
  onNavigateTab
}) => {
  const [selectedFormat, setSelectedFormat] = useState<'pdf' | 'xlsx' | 'csv' | 'geojson'>('pdf');
  const [generating, setGenerating] = useState(false);
  const [generatingAll, setGeneratingAll] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'info' | 'error'; text: string; filename?: string } | null>(null);
  
  // Theme state
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

  const effectiveIncident = activeIncident || {
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
    notes: 'High-confidence dark slick corridor detected in Kandla deepwater navigation fairway.',
    created_at: '2026-10-23T06:30:00Z',
    updated_at: '2026-10-23T07:15:00Z'
  } as Incident;

  const [generatedHistory, setGeneratedHistory] = useState<ExportHistoryItem[]>([
    {
      id: 'REP-61C2-PDF',
      format: 'PDF',
      filename: `SEATRACE_DOSSIER_${effectiveIncident.id}_2026-10-24.pdf`,
      timestamp: '07:30 IST',
      fileSize: '412 KB'
    },
    {
      id: 'REP-61C2-XLS',
      format: 'XLSX',
      filename: `SEATRACE_FORENSIC_WORKBOOK_${effectiveIncident.id}_2026-10-24.xlsx`,
      timestamp: '07:31 IST',
      fileSize: '78 KB'
    }
  ]);

  const handleDownload = async (format: 'pdf' | 'xlsx' | 'csv' | 'geojson') => {
    try {
      setGenerating(true);
      setStatusMessage({
        type: 'info',
        text: `Compiling court-ready ${format.toUpperCase()} investigation dossier for ${effectiveIncident.id}...`
      });

      const result = await generateAndDownloadReport(effectiveIncident.id, format);

      const sizeMap: Record<string, string> = {
        pdf: '425 KB',
        xlsx: '84 KB',
        csv: '18 KB',
        geojson: '32 KB'
      };

      const newItem: ExportHistoryItem = {
        id: `REP-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        format: format.toUpperCase() as any,
        filename: result.filename,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' IST',
        fileSize: sizeMap[format] || '50 KB'
      };

      setGeneratedHistory(prev => [newItem, ...prev]);
      setStatusMessage({
        type: 'success',
        text: `Successfully generated and downloaded: ${result.filename}`,
        filename: result.filename
      });
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: `Export generation failed: ${err.message || 'Check browser permissions'}`
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleDownloadAllFormats = async () => {
    try {
      setGeneratingAll(true);
      setStatusMessage({
        type: 'info',
        text: 'Generating and bundling all 4 forensic exports (PDF, XLSX, CSV, GeoJSON)...'
      });

      const formats: ('pdf' | 'xlsx' | 'csv' | 'geojson')[] = ['pdf', 'xlsx', 'csv', 'geojson'];
      for (const fmt of formats) {
        await generateAndDownloadReport(effectiveIncident.id, fmt);
        // Small interval between browser downloads to prevent popup blocking
        await new Promise(res => setTimeout(res, 400));
      }

      setStatusMessage({
        type: 'success',
        text: `All 4 forensic formats for incident ${effectiveIncident.id} downloaded successfully to your device.`
      });
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: `Batch export encountered an issue: ${err.message}`
      });
    } finally {
      setGeneratingAll(false);
    }
  };

  const formatCards = [
    {
      id: 'pdf',
      name: 'PDF Legal Dossier',
      badge: 'STANDARD',
      badgeClass: isLightMode ? 'bg-red-100 text-red-700 border-red-300' : 'bg-red-500/20 text-red-300 border-red-500/30',
      icon: '📕',
      description: 'Court-ready executive briefing, satellite detection specs, validation decision log, backward drift origin, and ranked vessel leads.',
      highlights: ['DGLL & Indian Coast Guard Header', 'SNN Biophysical Screening Metrics', 'Lagrangian Trajectory Coordinates', 'Ranked AIS Candidate Table', 'Statutory SHA-256 Legal Certification']
    },
    {
      id: 'xlsx',
      name: 'Excel Workbook (XLSX)',
      badge: 'ANALYTICS',
      badgeClass: isLightMode ? 'bg-emerald-100 text-emerald-700 border-emerald-300' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      icon: '📊',
      description: 'Multi-tab structured workbook containing raw AIS kinematics, backward drift time steps, compatibility scores, and evidence checksums.',
      highlights: ['Tab 1: Incident Profile & Coordinates', 'Tab 2: Ranked Candidate AIS Transponder Records', 'Tab 3: Lagrangian Time-Step Coordinates', 'Tab 4: Cryptographic Evidence Checksums']
    },
    {
      id: 'csv',
      name: 'Comma-Separated (CSV)',
      badge: 'TABULAR',
      badgeClass: isLightMode ? 'bg-blue-100 text-blue-700 border-blue-300' : 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      icon: '📋',
      description: 'Clean tabular format for ingestion into maritime databases, port authorities, and GIS toolchains.',
      highlights: ['Standard RFC 4180 Format', 'One Row per Suspect Vessel Candidate', 'Full CPA Distance & Time Delta Columns', 'Direct Ingestion for DGLL Databases']
    },
    {
      id: 'geojson',
      name: 'Spatial GeoJSON',
      badge: 'GIS SPATIAL',
      badgeClass: isLightMode ? 'bg-purple-100 text-purple-700 border-purple-300' : 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      icon: '🗺️',
      description: 'Polygons and LineStrings for QGIS, ArcGIS, Google Earth, and Indian Coast Guard command displays.',
      highlights: ['SAR Detected Spill Footprint Polygon', 'Backward Drift Trajectory LineString', 'Reconstructed Release Origin Zone', 'AIS Candidate Kinematics LineStrings']
    }
  ] as const;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
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
              Feature 9 — Export Engine
            </span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
              isLightMode ? 'bg-emerald-100 text-emerald-800' : 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/30'
            }`}>
              ● DOWNLOAD ENGINE ACTIVE
            </span>
          </div>
          <h2 className={`text-xl font-bold tracking-tight ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
            Multi-Format Regulatory Dossiers &amp; Forensic Exports
          </h2>
          <p className={`text-xs mt-1 ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
            Instantly compile and download court-ready PDF dossiers, multi-tab Excel workbooks, GeoJSON GIS layers, and CSV tables directly to your device.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => onNavigateTab('vessels')}
            className={`px-3.5 py-2 rounded-xl border font-mono text-xs transition cursor-pointer ${
              isLightMode
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10'
            }`}
          >
            ← Vessel Leads
          </button>
          <div className={`px-4 py-2 rounded-xl border font-mono text-xs text-right ${
            isLightMode ? 'bg-cyan-50/80 border-cyan-200' : 'bg-[#0D1527] border-white/10'
          }`}>
            <div className={`text-[10px] uppercase font-semibold ${isLightMode ? 'text-cyan-800' : 'text-slate-400'}`}>Target Incident</div>
            <div className={`font-bold ${isLightMode ? 'text-cyan-900' : 'text-cyan-300'}`}>{effectiveIncident.id}</div>
          </div>
        </div>
      </div>

      {/* Status Notice Banner */}
      {statusMessage && (
        <div className={`p-4 rounded-xl border font-mono text-xs flex items-center justify-between gap-3 shadow-sm transition-all ${
          statusMessage.type === 'success'
            ? isLightMode
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
              : 'bg-emerald-950/80 border-emerald-500/40 text-emerald-200'
            : statusMessage.type === 'info'
            ? isLightMode
              ? 'bg-cyan-50 border-cyan-300 text-cyan-900'
              : 'bg-cyan-950/80 border-cyan-500/40 text-cyan-200'
            : isLightMode
            ? 'bg-red-50 border-red-300 text-red-900'
            : 'bg-red-950/80 border-red-500/40 text-red-200'
        }`}>
          <div className="flex items-center gap-2.5">
            <span className="text-base">
              {statusMessage.type === 'success' ? '✅' : statusMessage.type === 'info' ? '⏳' : '⚠️'}
            </span>
            <span>{statusMessage.text}</span>
          </div>
          {statusMessage.filename && (
            <span className="text-[11px] underline font-bold opacity-80">Saved to Downloads</span>
          )}
        </div>
      )}

      {/* Main Grid: Format Cards & Generator Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Format Selection & Generator */}
        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {formatCards.map((card) => {
              const isSelected = selectedFormat === card.id;
              return (
                <div
                  key={card.id}
                  onClick={() => setSelectedFormat(card.id as any)}
                  className={`p-5 rounded-2xl border cursor-pointer transition-all duration-200 shadow-sm relative ${
                    isSelected
                      ? isLightMode
                        ? 'bg-cyan-50/70 border-cyan-500 ring-2 ring-cyan-400/30 shadow-md'
                        : 'bg-cyan-950/40 border-cyan-400 ring-2 ring-cyan-500/20 shadow-xl'
                      : isLightMode
                      ? 'bg-white border-slate-200 hover:border-slate-300 hover:shadow'
                      : 'bg-[#0A1020]/90 border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">{card.icon}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono border font-bold ${card.badgeClass}`}>
                      {card.badge}
                    </span>
                  </div>

                  <h3 className={`text-sm font-bold mt-3 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                    {card.name}
                  </h3>
                  
                  <p className={`text-xs mt-1 leading-relaxed ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
                    {card.description}
                  </p>

                  <div className="mt-4 pt-3 border-t border-slate-200/50 flex items-center justify-between">
                    <span className={`text-[11px] font-mono font-semibold ${
                      isSelected
                        ? isLightMode ? 'text-cyan-800' : 'text-cyan-300'
                        : isLightMode ? 'text-slate-500' : 'text-slate-500'
                    }`}>
                      {isSelected ? '✓ Selected Format' : 'Click to Select'}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedFormat(card.id as any);
                        handleDownload(card.id as any);
                      }}
                      disabled={generating}
                      className={`px-3 py-1 text-xs font-mono font-bold rounded-lg transition active:scale-95 cursor-pointer ${
                        isLightMode
                          ? 'bg-slate-900 text-white hover:bg-slate-800'
                          : 'bg-white/10 text-white hover:bg-white/20'
                      }`}
                    >
                      Download →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action Trigger Card */}
          <div className={`p-6 rounded-2xl border transition-all duration-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-mono text-xs ${
            isLightMode ? 'bg-white border-slate-200' : 'bg-[#0A1020]/90 border-white/10'
          }`}>
            <div className="space-y-1">
              <div className={`font-bold text-sm flex items-center gap-2 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                <span>🚀</span> Ready to Compile &amp; Download: <span className="text-cyan-600 dark:text-cyan-400">{selectedFormat.toUpperCase()}</span>
              </div>
              <div className={`${isLightMode ? 'text-slate-600' : 'text-slate-400'} text-[11px]`}>
                Target Incident: <span className="font-bold text-cyan-700 dark:text-cyan-300">{effectiveIncident.id}</span> ({effectiveIncident.title})
              </div>
              <div className={`${isLightMode ? 'text-slate-500' : 'text-slate-500'} text-[10px]`}>
                Court-admissible DGLL &amp; Coast Guard maritime intelligence archive.
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <button
                onClick={handleDownloadAllFormats}
                disabled={generating || generatingAll}
                className={`px-4 py-3 rounded-xl font-bold font-mono text-xs border transition flex items-center justify-center gap-2 cursor-pointer ${
                  isLightMode
                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                    : 'bg-white/5 hover:bg-white/10 text-slate-200 border-white/10'
                }`}
                title="Download all 4 file formats sequentially"
              >
                {generatingAll ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-slate-600 border-t-transparent rounded-full animate-spin"></span>
                    Exporting All...
                  </>
                ) : (
                  <>
                    <span>📦</span> Download All Formats
                  </>
                )}
              </button>

              <button
                onClick={() => handleDownload(selectedFormat)}
                disabled={generating || generatingAll}
                className="px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 text-white font-bold rounded-xl shadow-lg transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
              >
                {generating ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Generating {selectedFormat.toUpperCase()}...
                  </>
                ) : (
                  <>
                    <span>📥</span> Download {selectedFormat.toUpperCase()} Dossier
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Selected Format Inspection Overview */}
          <div className={`p-5 rounded-2xl border transition-all ${
            isLightMode ? 'bg-slate-50/70 border-slate-200' : 'bg-[#0D1527]/70 border-white/5'
          }`}>
            <h4 className={`text-xs font-bold font-mono uppercase tracking-wider mb-2.5 flex items-center gap-2 ${
              isLightMode ? 'text-slate-800' : 'text-white'
            }`}>
              <span>🔍</span> Forensic Dossier Specification: {formatCards.find(c => c.id === selectedFormat)?.name}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
              {formatCards.find(c => c.id === selectedFormat)?.highlights.map((h, i) => (
                <div key={i} className={`flex items-center gap-2 font-mono text-[11px] ${
                  isLightMode ? 'text-slate-700' : 'text-slate-300'
                }`}>
                  <span className="text-cyan-500 font-bold">✓</span>
                  <span>{h}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Export History */}
        <div className="space-y-4 font-mono text-xs">
          <div className={`p-5 rounded-2xl border transition-all duration-200 shadow-sm space-y-3 ${
            isLightMode ? 'bg-white border-slate-200' : 'bg-[#0A1020]/90 border-white/10'
          }`}>
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/50 dark:border-white/5">
              <h3 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${
                isLightMode ? 'text-slate-900' : 'text-white'
              }`}>
                <span>🕒</span> Export History
              </h3>
              <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                isLightMode ? 'bg-slate-100 text-slate-700' : 'bg-white/5 text-slate-400'
              }`}>
                {generatedHistory.length} Dossiers
              </span>
            </div>

            {generatedHistory.length === 0 ? (
              <div className={`p-6 text-center text-[11px] ${isLightMode ? 'text-slate-500' : 'text-slate-500'}`}>
                No files exported in this session yet. Choose a format and click download above.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
                {generatedHistory.map((h) => {
                  const formatStyle = {
                    PDF: isLightMode ? 'bg-red-100 text-red-800 border-red-200' : 'bg-red-500/20 text-red-300 border-red-500/30',
                    XLSX: isLightMode ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
                    CSV: isLightMode ? 'bg-blue-100 text-blue-800 border-blue-200' : 'bg-blue-500/20 text-blue-300 border-blue-500/30',
                    GEOJSON: isLightMode ? 'bg-purple-100 text-purple-800 border-purple-200' : 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                  }[h.format] || 'bg-slate-100 text-slate-800 border-slate-200';

                  return (
                    <div
                      key={h.id}
                      className={`p-3 rounded-xl border transition-all ${
                        isLightMode
                          ? 'bg-slate-50/80 border-slate-200 hover:bg-slate-100/60'
                          : 'bg-[#0D1527] border-white/5 hover:border-white/10'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${formatStyle}`}>
                          {h.format}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] ${isLightMode ? 'text-slate-500' : 'text-slate-500'}`}>
                            {h.fileSize}
                          </span>
                          <span className={`text-[10px] ${isLightMode ? 'text-slate-500' : 'text-slate-500'}`}>
                            {h.timestamp}
                          </span>
                        </div>
                      </div>
                      <div className={`text-[11px] font-medium truncate mb-2 ${isLightMode ? 'text-slate-800' : 'text-slate-200'}`} title={h.filename}>
                        {h.filename}
                      </div>
                      <div className="flex justify-end">
                        <button
                          onClick={() => handleDownload(h.format.toLowerCase() as any)}
                          className={`text-[10px] font-bold px-2.5 py-1 rounded-md transition cursor-pointer flex items-center gap-1 ${
                            isLightMode
                              ? 'bg-cyan-100 text-cyan-800 hover:bg-cyan-200'
                              : 'bg-cyan-950/80 text-cyan-300 hover:bg-cyan-900 border border-cyan-500/30'
                          }`}
                        >
                          <span>↺</span> Download Again
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
