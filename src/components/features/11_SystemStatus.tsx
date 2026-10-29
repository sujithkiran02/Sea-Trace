import React, { useState, useEffect } from 'react';
import type { SystemStatusData, FeatureTab } from '../../types/seatrace';
import { fetchSystemStatus } from '../../api/seatraceClient';

interface SystemStatusProps {
  onNavigateTab: (tab: FeatureTab) => void;
}

export const SystemStatus: React.FC<SystemStatusProps> = ({ onNavigateTab }) => {
  const [data, setData] = useState<SystemStatusData | null>(null);
  const [refreshing, setRefreshing] = useState(false);

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

  const loadStatus = () => {
    setRefreshing(true);
    fetchSystemStatus().then((res) => {
      setData(res);
      setRefreshing(false);
    });
  };

  useEffect(() => {
    loadStatus();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
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
              Feature 11 — Operational Observability
            </span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
              isLightMode ? 'bg-emerald-100 text-emerald-800' : 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/30'
            }`}>
              ● {data?.status || 'OPERATIONAL'}
            </span>
          </div>
          <h2 className={`text-xl font-bold tracking-tight ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
            System Health, Microservice Readiness &amp; Job Telemetry
          </h2>
          <p className={`text-xs mt-1 ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
            End-to-end telemetry for API gateways, SQLite spatial indexes, SAR detection workers, and asynchronous job pipelines.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={loadStatus}
            disabled={refreshing}
            className={`px-3.5 py-2 rounded-xl border font-mono text-xs transition cursor-pointer flex items-center gap-2 ${
              isLightMode
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                : 'bg-white/5 hover:bg-white/10 text-slate-200 border-white/10'
            }`}
          >
            {refreshing ? (
              <>
                <span className="w-3 h-3 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></span>
                Polling...
              </>
            ) : (
              <>
                <span>🔄</span> Refresh Status
              </>
            )}
          </button>
          <button
            onClick={() => onNavigateTab('datasources')}
            className={`px-3.5 py-2 rounded-xl border font-mono text-xs transition cursor-pointer ${
              isLightMode
                ? 'bg-cyan-50 text-cyan-800 border-cyan-200 hover:bg-cyan-100'
                : 'bg-cyan-950/40 text-cyan-300 border-cyan-500/30 hover:bg-cyan-900/40'
            }`}
          >
            ← Data Sources
          </button>
        </div>
      </div>

      {/* Node Metrics Cards */}
      <div className={`p-4 rounded-2xl border transition-all shadow-sm grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono text-xs ${
        isLightMode ? 'bg-white border-slate-200' : 'bg-[#0A1020]/90 border-white/10'
      }`}>
        <div className="space-y-0.5">
          <div className={`text-[10px] uppercase ${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>Node Environment</div>
          <div className={`text-base font-bold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
            {data?.environment || 'STANDALONE_NODE'}
          </div>
        </div>
        <div className="space-y-0.5">
          <div className={`text-[10px] uppercase ${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>API Engine Version</div>
          <div className={`text-base font-bold ${isLightMode ? 'text-cyan-700' : 'text-cyan-400'}`}>
            v{data?.api_version || '2.4.0'}
          </div>
        </div>
        <div className="space-y-0.5">
          <div className={`text-[10px] uppercase ${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>Parallel Workers</div>
          <div className={`text-base font-bold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
            {data?.active_workers || 8} <span className="text-xs font-normal text-emerald-500">Threads</span>
          </div>
        </div>
        <div className="space-y-0.5">
          <div className={`text-[10px] uppercase ${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>Cluster Uptime</div>
          <div className={`text-base font-bold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
            {Math.floor((data?.uptime_seconds || 86400) / 3600)}h {Math.floor(((data?.uptime_seconds || 86400) % 3600) / 60)}m
          </div>
        </div>
      </div>

      {/* Services List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 font-mono text-xs">
        {data?.services?.map((svc) => (
          <div
            key={svc.name}
            className={`p-5 rounded-2xl border transition-all duration-200 shadow-sm space-y-2.5 ${
              isLightMode
                ? 'bg-white border-slate-200 hover:border-cyan-400 hover:shadow-md'
                : 'bg-[#0A1020]/90 border-white/10 hover:border-cyan-500/40 shadow-lg'
            }`}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/50 dark:border-white/5">
              <span className={`font-bold text-sm ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                {svc.name}
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                svc.status === 'HEALTHY'
                  ? isLightMode
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : isLightMode
                  ? 'bg-amber-100 text-amber-800 border-amber-300'
                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              }`}>
                ● {svc.status}
              </span>
            </div>

            <div className={`p-2.5 rounded-xl border space-y-1.5 text-[11px] ${
              isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-[#0D1527] border-white/5'
            }`}>
              <div className="flex justify-between items-center">
                <span className={isLightMode ? 'text-slate-500' : 'text-slate-400'}>Internal Latency:</span>
                <span className={`font-bold ${isLightMode ? 'text-cyan-700' : 'text-cyan-300'}`}>
                  {svc.latency_ms} ms
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className={isLightMode ? 'text-slate-500' : 'text-slate-400'}>Heartbeat:</span>
                <span className={isLightMode ? 'text-slate-600' : 'text-slate-400'}>
                  {new Date(svc.last_check).toLocaleTimeString()} IST
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Background Processing Queue */}
      <div className={`rounded-2xl border transition-all duration-200 shadow-sm overflow-hidden font-mono text-xs ${
        isLightMode ? 'bg-white border-slate-200' : 'bg-[#0A1020]/90 border-white/10 shadow-xl'
      }`}>
        <div className={`p-4 border-b flex items-center justify-between ${
          isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-[#0D1527] border-white/5'
        }`}>
          <span className={`font-bold uppercase flex items-center gap-2 ${
            isLightMode ? 'text-slate-900' : 'text-white'
          }`}>
            <span>⚡</span> Incident Pipeline Execution Queue ({data?.active_jobs?.length || 0})
          </span>
          <span className={`text-[11px] ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
            Async Daemon Pool: 8 Dedicated Workers
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className={`border-b text-[11px] ${
              isLightMode ? 'bg-slate-100 text-slate-600 border-slate-200' : 'bg-[#0D1527] text-slate-400 border-white/5'
            }`}>
              <tr>
                <th className="p-3">Job ID</th>
                <th className="p-3">Incident Target</th>
                <th className="p-3">Task Pipeline</th>
                <th className="p-3">Progress</th>
                <th className="p-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className={`divide-y text-xs ${
              isLightMode ? 'divide-slate-200 text-slate-700' : 'divide-white/5 text-slate-300'
            }`}>
              {data?.active_jobs?.map((job) => (
                <tr key={job.job_id} className={`transition ${
                  isLightMode ? 'hover:bg-slate-50' : 'hover:bg-white/5'
                }`}>
                  <td className={`p-3 font-bold ${isLightMode ? 'text-cyan-800' : 'text-cyan-400'}`}>
                    {job.job_id}
                  </td>
                  <td className={`p-3 font-semibold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                    {job.incident_id}
                  </td>
                  <td className="p-3">{job.type}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-28 h-2 rounded-full overflow-hidden ${
                        isLightMode ? 'bg-slate-200' : 'bg-slate-800'
                      }`}>
                        <div
                          className="h-full bg-cyan-500"
                          style={{ width: `${job.progress_pct}%` }}
                        />
                      </div>
                      <span className={`text-[10px] font-bold ${isLightMode ? 'text-cyan-800' : 'text-cyan-300'}`}>
                        {job.progress_pct}%
                      </span>
                    </div>
                  </td>
                  <td className="p-3 text-right">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        job.status === 'SUCCEEDED'
                          ? isLightMode
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : isLightMode
                          ? 'bg-cyan-100 text-cyan-800 border-cyan-300'
                          : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                      }`}
                    >
                      ● {job.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
