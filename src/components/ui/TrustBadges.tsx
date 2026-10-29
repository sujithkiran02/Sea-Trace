import { ShieldCheck, Satellite, Compass, Waves, FileText } from 'lucide-react';

export const TrustBadges: React.FC = () => {
  const badges = [
    {
      icon: ShieldCheck,
      title: 'MARPOL Annex I Standard',
      desc: 'Compliant with IMO 73/78 regulations for shipborne oily waste discharge & pollution prevention.',
    },
    {
      icon: Compass,
      title: 'Indian Coast Guard MRCC',
      desc: 'Real-time incident dispatch & automated SOS telemetry feed directly to Maritime Rescue Coordination Centres.',
    },
    {
      icon: Waves,
      title: 'INCOIS Hydrodynamics',
      desc: 'Integrated with Indian National Centre for Ocean Information Services 4D surface current models.',
    },
    {
      icon: Satellite,
      title: 'Sentinel-1 & NISAR SAR',
      desc: 'All-weather, cloud-penetrating synthetic aperture radar sweeps with autonomous neural segmentation.',
    },
    {
      icon: FileText,
      title: 'Admiralty Court Dossiers',
      desc: 'Cryptographically hashed evidentiary packages legally admissible under the Merchant Shipping Act 1958.',
    },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto px-6 sm:px-8 my-8 relative z-20">
      <div
        className="p-5 sm:p-6 rounded-3xl grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6"
        style={{
          background: 'rgba(255, 255, 255, 0.06)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.14)',
          boxShadow: '0 20px 40px -15px rgba(5, 10, 30, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
        }}
      >
        {badges.map((b, i) => {
          const Icon = b.icon;
          return (
            <div key={i} className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#FF9933]/15 flex items-center justify-center border border-[#FF9933]/25 shrink-0">
                  <Icon className="w-4 h-4 text-[#FF9933]" />
                </div>
                <h4 className="font-heading font-bold text-xs sm:text-sm text-white">
                  {b.title}
                </h4>
              </div>
              <p className="text-[11px] text-slate-300/80 leading-relaxed font-normal">
                {b.desc}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
