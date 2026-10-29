import { useState } from 'react';
import { Anchor, Wind, Satellite } from 'lucide-react';

export const FleetSection: React.FC = () => {
  const [selectedAsset, setSelectedAsset] = useState('pcv');

  const assets = {
    pcv: {
      name: 'ICGS Samudra Prahari',
      class: 'Dedicated Pollution Control Vessel (PCV)',
      status: 'High-Readiness Standby',
      dimensions: '95.0m × 14.5m',
      capacity: '500-Ton Recovery Hold',
      reeferPlugs: 'Rigid Sweeping Arms',
      propulsion: 'Twin Marine Diesel 12,000 kW',
      speed: '21.0 kts Intercept Speed',
      hullSystem: 'Side-Looking Radar (SLAR) & FLIR',
      draft: '4.5m Offshore & Coastal',
      highlights: [
        'Equipped with ocean-going rigid sweeping arms and high-volume disc skimmers',
        'Onboard chemical dispersant spray system with 500-meter continuous swath',
        'Live SeaTrace AI vector uplink for high-speed intercept of suspect tankers',
      ],
    },
    radar: {
      name: 'Sentinel-1 C-Band SAR Constellation',
      class: 'Orbital Radar Surveillance Platform',
      status: 'Active Polar Orbit (693 km)',
      dimensions: '250 km Swath Width',
      capacity: 'All-Weather Day/Night',
      reeferPlugs: 'Dual-Pol (VV + VH)',
      propulsion: 'Hydrazine Orbital Thrusters',
      speed: '7.5 km/s Orbital Velocity',
      hullSystem: 'Active Phased Array Antenna',
      draft: '10m Spatial Resolution',
      highlights: [
        'Pierces dense monsoon clouds and darkness using synthetic aperture radar backscatter',
        'Direct telemetry pipeline with sub-15 minute neural slick segmentation',
        'Synchronized with upcoming ISRO-NASA NISAR L-band mission for deep penetration',
      ],
    },
    aircraft: {
      name: 'Dornier 228 Maritime Patrol Aircraft',
      class: 'Airborne Surveillance & Response Unit',
      status: 'Coast Guard Air Station Ready',
      dimensions: '16.5m Wingspan',
      capacity: '1,500 L Aerial Dispersant',
      reeferPlugs: 'Multispectral UV/IR Line Scanner',
      propulsion: 'Twin Garrett TPE331 Turboprops',
      speed: '200 kts Rapid Response',
      hullSystem: 'Forward Looking Infrared (FLIR)',
      draft: '1,300 NM Patrol Range',
      highlights: [
        'Real-time encrypted digital downlink of slick coordinates to Coast Guard MRCC',
        'High-altitude aerial dispersant application for rapid heavy-fuel slick breakdown',
        'Visual confirmation and optical photographic evidence of culprit vessel wake',
      ],
    },
  };

  const current = assets[selectedAsset as keyof typeof assets];

  return (
    <section id="fleet" className="min-h-screen w-full py-28 px-6 sm:px-8 max-w-7xl mx-auto z-10 relative">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-14 gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-pill mb-4 border border-white/10 text-xs font-mono-code text-[#FFC15A] uppercase">
            Surveillance & Response Assets
          </div>
          <h2 className="font-heading font-extrabold text-3xl sm:text-5xl text-white tracking-tight mb-4">
            Multi-tier early warning & response assets.
          </h2>
          <p className="text-slate-300 text-base sm:text-lg max-w-2xl leading-relaxed">
            From orbital synthetic aperture radar satellites to offshore Coast Guard pollution response vessels and tactical maritime patrol aircraft.
          </p>
        </div>

        {/* Asset Selection Tabs */}
        <div className="flex gap-2 p-1.5 rounded-2xl glass-panel border border-white/10 self-start lg:self-auto">
          <button
            onClick={() => setSelectedAsset('pcv')}
            className={`px-4 py-2 rounded-xl text-xs font-mono-code font-bold transition-all cursor-pointer ${
              selectedAsset === 'pcv'
                ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Pollution Control Vessel
          </button>
          <button
            onClick={() => setSelectedAsset('radar')}
            className={`px-4 py-2 rounded-xl text-xs font-mono-code font-bold transition-all cursor-pointer ${
              selectedAsset === 'radar'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            SAR Satellite Constellation
          </button>
          <button
            onClick={() => setSelectedAsset('aircraft')}
            className={`px-4 py-2 rounded-xl text-xs font-mono-code font-bold transition-all cursor-pointer ${
              selectedAsset === 'aircraft'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Airborne Patrol Aircraft
          </button>
        </div>
      </div>

      {/* Main Asset Showcase Card */}
      <div className="glass-panel rounded-3xl p-8 sm:p-12 border border-white/15 relative overflow-hidden shadow-2xl">
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Details */}
          <div className="lg:col-span-7 space-y-6">
            <div className="flex flex-wrap items-center gap-3">
              <span className="px-3 py-1 rounded-full text-xs font-mono-code font-bold bg-white/10 text-cyan-300 border border-white/15">
                {current.class}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-mono-code font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                {current.status}
              </span>
            </div>

            <h3 className="font-heading font-extrabold text-3xl sm:text-5xl text-white">
              {current.name}
            </h3>

            {/* Spec Matrix Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t border-white/10">
              <div className="space-y-1">
                <span className="text-[11px] font-mono-code text-slate-400 block uppercase">
                  Coverage / Span
                </span>
                <span className="text-sm sm:text-base font-bold text-white font-mono-code">
                  {current.dimensions}
                </span>
              </div>
              <div className="space-y-1">
                <span className="text-[11px] font-mono-code text-slate-400 block uppercase">
                  Containment Payload
                </span>
                <span className="text-sm sm:text-base font-bold text-[#FFC15A] font-mono-code">
                  {current.capacity}
                </span>
              </div>
              <div className="space-y-1">
                <span className="text-[11px] font-mono-code text-slate-400 block uppercase">
                  Sensors / Equipment
                </span>
                <span className="text-sm sm:text-base font-bold text-white font-mono-code">
                  {current.reeferPlugs}
                </span>
              </div>
              <div className="space-y-1">
                <span className="text-[11px] font-mono-code text-slate-400 block uppercase">
                  Speed / Revisit
                </span>
                <span className="text-sm sm:text-base font-bold text-emerald-400 font-mono-code">
                  {current.speed}
                </span>
              </div>
              <div className="space-y-1">
                <span className="text-[11px] font-mono-code text-slate-400 block uppercase">
                  Sensor System
                </span>
                <span className="text-sm sm:text-base font-bold text-cyan-300 font-mono-code">
                  {current.hullSystem}
                </span>
              </div>
              <div className="space-y-1">
                <span className="text-[11px] font-mono-code text-slate-400 block uppercase">
                  Resolution / Range
                </span>
                <span className="text-sm sm:text-base font-bold text-white font-mono-code">
                  {current.draft}
                </span>
              </div>
            </div>

            {/* Highlights List */}
            <div className="space-y-3 pt-4 border-t border-white/10">
              <span className="text-xs font-mono-code font-bold uppercase tracking-wider text-slate-400 block">
                Operational Capabilities
              </span>
              <ul className="space-y-2">
                {current.highlights.map((h, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#FF7A2F] mt-2 shrink-0" />
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right Visual Plate */}
          <div className="lg:col-span-5 flex flex-col justify-center items-center p-8 rounded-2xl bg-white/5 border border-white/10 text-center space-y-4">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-orange-500/20 to-cyan-500/20 border border-white/15 flex items-center justify-center">
              {selectedAsset === 'pcv' && <Anchor className="w-10 h-10 text-orange-400" />}
              {selectedAsset === 'radar' && <Satellite className="w-10 h-10 text-cyan-400 animate-pulse" />}
              {selectedAsset === 'aircraft' && <Wind className="w-10 h-10 text-emerald-400" />}
            </div>
            <div>
              <h4 className="font-heading font-bold text-lg text-white">
                Integrated Defense Network
              </h4>
              <p className="text-xs text-slate-300 max-w-xs mt-1">
                Real-time telemetry feeds automatically correlate SAR radar dark formations, backwards Lagrangian drift trajectories, and suspect vessel AIS transits.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
