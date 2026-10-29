import { ShieldCheck, MapPin, Quote } from 'lucide-react';

interface TeamMember {
  name: string;
  role: string;
  location: string;
  unLocode: string;
  quote: string;
  experience: string;
  avatarColor: string;
}

const TEAM: TeamMember[] = [
  {
    name: 'Capt. Rajeshwar Nair',
    role: 'Principal Maritime Casualty & Spill Investigator',
    location: 'MRCC Mumbai Command',
    unLocode: 'INBOM',
    quote:
      'When an intentional oily bilge discharge happens under darkness, reverse Lagrangian drift and AIS telemetry pinpoint the culprit vessel before the slick can reach vulnerable mangrove estuaries.',
    experience: '22 years Master Mariner & DG Shipping Lead',
    avatarColor: 'from-[#FF9933] to-[#FFB766]',
  },
  {
    name: 'Dr. Sunita Varma',
    role: 'Lead Geospatial & SAR Radar Scientist',
    location: 'National Remote Sensing Surveillance Hub',
    unLocode: 'INHYD',
    quote:
      'Using dual-polarization Sentinel-1 SAR and upcoming NISAR radar, we detect petroleum films down to sub-micron thicknesses regardless of dense monsoon cloud decks.',
    experience: 'Ex-ISRO Remote Sensing Specialist, 15 yrs',
    avatarColor: 'from-[#138808] to-[#2ecc71]',
  },
  {
    name: 'Cdr. Aniket Kulkarni',
    role: 'Lagrangian Hydrodynamics & Drift Modeling Lead',
    location: 'INCOIS Ocean Modeling Center',
    unLocode: 'INGOA',
    quote:
      'By coupling 4D ocean current vector fields with wind Stokes drift, we provide Coast Guard response vessels with accurate trajectory forecasts to deploy containment booms effectively.',
    experience: 'Naval Ocean Systems & Drift Physics, 17 yrs',
    avatarColor: 'from-[#00B4D8] to-[#0077B6]',
  },
];

export const PeopleSection: React.FC = () => {
  return (
    <section id="people" className="w-full py-24 px-6 sm:px-8 max-w-7xl mx-auto z-20 relative">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-14 gap-6">
        <div>
          <div
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-3 border text-xs font-mono-code text-[#FF9933] uppercase"
            style={{
              background: 'rgba(255, 153, 51, 0.1)',
              borderColor: 'rgba(255, 153, 51, 0.3)',
            }}
          >
            <span>Operational Command & Maritime Intelligence</span>
          </div>
          <h2 className="font-heading font-extrabold text-3xl sm:text-5xl text-white tracking-tight mb-3">
            The personnel safeguarding Bharat's waters.
          </h2>
          <p className="text-slate-300 text-base max-w-xl leading-relaxed">
            Satellite radar analysts, hydrodynamic modellers, and maritime legal investigators working round-the-clock across India's 7,500 km coastline.
          </p>
        </div>

        {/* Operational 24/7 Readiness Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-xs font-mono-code">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>24/7 LIVE WATCH STANDBY</span>
        </div>
      </div>

      {/* Team Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {TEAM.map((member, i) => (
          <div
            key={i}
            className="p-6 sm:p-7 rounded-3xl border flex flex-col justify-between transition-all duration-300 hover:-translate-y-1.5"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(20px)',
              borderColor: 'rgba(255, 255, 255, 0.12)',
              boxShadow:
                '0 20px 40px -15px rgba(5, 10, 30, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
            }}
          >
            <div>
              {/* Member Avatar and Location */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${member.avatarColor} p-0.5 shadow-lg`}
                  >
                    <div className="w-full h-full bg-[#050A1E] rounded-[14px] flex items-center justify-center font-heading font-bold text-base text-white">
                      {member.name.split(' ').map((n) => n[0]).join('')}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-base text-white">
                      {member.name}
                    </h3>
                    <p className="text-xs text-[#FF9933] font-mono-code">
                      {member.role}
                    </p>
                  </div>
                </div>
              </div>

              {/* Quote */}
              <div className="relative mb-6 pl-3 border-l-2 border-[#FF9933]/50">
                <Quote className="w-4 h-4 text-[#FF9933]/40 absolute -top-2 -left-2" />
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed italic">
                  "{member.quote}"
                </p>
              </div>
            </div>

            {/* Bottom: Location & Experience */}
            <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs font-mono-code text-slate-400">
              <div className="flex items-center gap-1.5 text-slate-300">
                <MapPin className="w-3.5 h-3.5 text-[#138808]" />
                <span>
                  {member.location} ({member.unLocode})
                </span>
              </div>
              <span className="text-[11px] text-slate-400">{member.experience}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
