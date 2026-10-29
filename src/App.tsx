import { useState, useEffect } from 'react';
import gsap from 'gsap';
import { BackgroundPlate } from './components/plate/BackgroundPlate';
import { Hero } from './components/ui/Hero';
import { StatCards } from './components/ui/StatCards';
import { TrackingWidget } from './components/ui/TrackingWidget';
import { ShipStatusCard } from './components/ui/ShipStatusCard';
import { TrustBadges } from './components/ui/TrustBadges';
import { IndiaRoutesSection } from './components/ui/IndiaRoutesSection';
import { PeopleSection } from './components/ui/PeopleSection';
import { TestimonialsSection } from './components/ui/TestimonialsSection';
import { ServicesSection } from './components/ui/ServicesSection';
import { FleetSection } from './components/ui/FleetSection';
import { Footer } from './components/ui/Footer';
import { ShipmentTrackerModal } from './components/ui/ShipmentTrackerModal';
import { QuoteModal } from './components/ui/QuoteModal';
import type { LanguageCode } from './constants/translations';
import { ThemeToggle, type Theme } from './components/ui/ThemeToggle';

// SeaTrace AI 11 Features & Components
import type { Incident, FeatureTab, VesselCandidate } from './types/seatrace';
import { fetchIncidents, checkBackendHealth } from './api/seatraceClient';
import { SeaTraceNav } from './components/layout/SeaTraceNav';
import { CommandDashboard } from './components/features/1_CommandDashboard';
import { IncidentManagement } from './components/features/2_IncidentManagement';
import { SatelliteDetection } from './components/features/3_SatelliteDetection';
import { DetectionValidation } from './components/features/4_DetectionValidation';
import { OriginReconstruction } from './components/features/5_OriginReconstruction';
import { VesselIntelligence } from './components/features/6_VesselIntelligence';
import { CounterfactualSimulation } from './components/features/7_CounterfactualSimulation';
import { EvidencePackage } from './components/features/8_EvidencePackage';
import { ReportsExports } from './components/features/9_ReportsExports';
import { DataSources } from './components/features/10_DataSources';
import { SystemStatus } from './components/features/11_SystemStatus';

export function App() {
  // Navigation & Feature State - Always starts at Overview (landing)
  const [currentTab, setCurrentTab] = useState<FeatureTab>('landing');
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [activeIncident, setActiveIncident] = useState<Incident | null>(null);
  const [candidateForHypothesis, setCandidateForHypothesis] = useState<VesselCandidate | null>(null);
  const [isBackendOnline, setIsBackendOnline] = useState(false);

  // Landing Page Preferences & Modals
  const [currentLang] = useState<LanguageCode>('en');
  const [isReducedMotion, setIsReducedMotion] = useState(false);
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('maritime_theme');
    return (saved === 'light' || saved === 'dark') ? saved : 'dark';
  });

  const [isTrackerOpen, setIsTrackerOpen] = useState(false);
  const [trackerContainerNumber, setTrackerContainerNumber] = useState('BHTU-482910-4');
  const [isQuoteOpen, setIsQuoteOpen] = useState(false);

  // Initialize SeaTrace API & Incidents
  const refreshIncidentsList = async () => {
    const health = await checkBackendHealth();
    setIsBackendOnline(health.online);

    const list = await fetchIncidents();
    setIncidents(list);
    if (list.length > 0 && !activeIncident) {
      setActiveIncident(list[0]);
    } else if (activeIncident) {
      const refreshedActive = list.find(i => i.id === activeIncident.id);
      if (refreshedActive) setActiveIncident(refreshedActive);
    }
  };

  useEffect(() => {
    refreshIncidentsList();
    const interval = setInterval(() => {
      checkBackendHealth().then(h => setIsBackendOnline(h.online));
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // Detect accessibility preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setIsReducedMotion(mediaQuery.matches);
    const listener = (e: MediaQueryListEvent) => setIsReducedMotion(e.matches);
    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, []);

  // Theme synchronization
  useEffect(() => {
    localStorage.setItem('maritime_theme', theme);
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.add('light-theme');
      root.classList.remove('dark-theme');
      root.setAttribute('data-theme', 'light');
    } else {
      root.classList.add('dark-theme');
      root.classList.remove('light-theme');
      root.setAttribute('data-theme', 'dark');
    }
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // GSAP Entrance Choreography for landing page
  useEffect(() => {
    if (currentTab !== 'landing') return;

    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    tl.fromTo(
      '#bg-plate-container',
      { opacity: 0 },
      { opacity: 1, duration: 1.2 }
    )
      .fromTo(
        '#seatrace-glass-navbar',
        { y: -70, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8 },
        '-=0.6'
      )
      .fromTo(
        '.hero-line',
        { y: 45, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, stagger: 0.14 },
        '-=0.4'
      )
      .fromTo(
        '#hero-badge, #hero-subtitle, #hero-ctas',
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.7, stagger: 0.1 },
        '-=0.5'
      )
      .fromTo(
        '#tracking-widget',
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.7 },
        '-=0.5'
      )
      .fromTo(
        '.stat-card, #ship-status-card',
        { y: 40, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, stagger: 0.08 },
        '-=0.5'
      );
  }, [currentTab]);

  const handleOpenTracker = (id?: string) => {
    if (id) setTrackerContainerNumber(id);
    setIsTrackerOpen(true);
  };

  const handleScrollToSection = (sectionId: string) => {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className={`relative min-h-screen w-full transition-colors duration-300 overflow-x-hidden selection:bg-[#FF7A2F] selection:text-white ${
      theme === 'light' ? 'light-theme bg-[#F3F6FA] text-[#152238]' : 'dark-theme bg-[#030712] text-slate-100'
    }`}>
      {/* Master Top Navigation for all 11 SeaTrace features + Landing view */}
      <SeaTraceNav
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        incidents={incidents}
        activeIncident={activeIncident}
        onSelectIncident={setActiveIncident}
        isBackendOnline={isBackendOnline}
        onQuickExport={() => setCurrentTab('reports')}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />

      {/* VIEW ROUTER */}
      {currentTab === 'landing' ? (
        /* Preserved 3D Photographic Cinematic Landing Page */
        <div
          className={`relative min-h-screen w-full transition-colors duration-500 overflow-x-hidden ${
            theme === 'light' ? 'light-theme text-slate-800' : 'dark-theme bg-[#050A1E] text-slate-100'
          }`}
        >
          {/* Static 4K Photographic Plate with Realistic Motion */}
          <div id="bg-plate-container" className="fixed inset-0 w-full h-full pointer-events-none z-0">
            <BackgroundPlate isReducedMotion={isReducedMotion} theme={theme} />
          </div>

          {/* Hero Section */}
          <div className="relative min-h-screen w-full flex flex-col justify-between pt-28 sm:pt-36 pb-8 px-6 sm:px-10 max-w-7xl mx-auto z-20 pointer-events-none">
            <div className="flex flex-col gap-6">
              {/* Investigation Suite Launch Banner */}
              <div className="pointer-events-auto inline-flex items-center gap-3 bg-[#0A1020]/90 backdrop-blur-md px-4 py-2 rounded-2xl border border-cyan-500/40 shadow-xl max-w-xl">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-ping"></span>
                <span className="text-xs font-mono text-cyan-300">
                  SeaTrace AI Active: <b>{incidents.length} maritime incidents</b> monitored in Indian Waters.
                </span>
                <button
                  onClick={() => setCurrentTab('dashboard')}
                  className="ml-auto px-3 py-1 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 text-white font-mono font-bold text-xs rounded-lg shadow transition"
                >
                  Open Command Suite →
                </button>
              </div>

              <Hero
                currentLang={currentLang}
                onOpenTracker={() => setCurrentTab('dashboard')}
                onExploreRoutes={() => handleScrollToSection('routes')}
              />

              <div className="pt-2">
                <TrackingWidget onTrack={(query) => {
                  if (query.toUpperCase().startsWith('IN-') || query.includes('2026')) {
                    setCurrentTab('incidents');
                  } else {
                    handleOpenTracker(query);
                  }
                }} />
              </div>
            </div>

            {/* Bottom Bar: Stat Cards & Suspect Vessel Lead Status */}
            <div className="w-full pt-10 flex flex-col lg:flex-row items-end justify-between gap-6">
              <div className="w-full lg:max-w-3xl">
                <StatCards />
              </div>
              <div className="w-full sm:w-auto">
                <ShipStatusCard />
              </div>
            </div>
          </div>

          {/* India Trust Badges Strip */}
          <TrustBadges />

          {/* Glassmorphic Scroll Sections */}
          <main className="relative z-20 flex flex-col bg-gradient-to-b from-transparent via-[#050A1E]/88 to-[#050A1E]/96 backdrop-blur-sm mt-8 border-t border-white/10">
            <IndiaRoutesSection />
            <ServicesSection onOpenQuote={() => setIsQuoteOpen(true)} />
            <PeopleSection />
            <TestimonialsSection />
            <FleetSection />
            <Footer onOpenQuote={() => setIsQuoteOpen(true)} />
          </main>

          {/* Cargo Telemetry Tracker Modal */}
          <ShipmentTrackerModal
            isOpen={isTrackerOpen}
            onClose={() => setIsTrackerOpen(false)}
            initialTracking={trackerContainerNumber}
          />

          {/* Instant Quote Modal */}
          <QuoteModal
            isOpen={isQuoteOpen}
            onClose={() => setIsQuoteOpen(false)}
          />

          {/* Floating Theme Switcher */}
          <ThemeToggle theme={theme} onToggle={handleToggleTheme} variant="floating" />
        </div>
      ) : (
        /* SEATRACE AI OPERATIONAL WORKSPACE (11 Investigation Features) */
        <main className="relative z-10 max-w-[1720px] mx-auto px-4 sm:px-6 pt-32 sm:pt-36 pb-12 min-h-[calc(100vh-100px)]">
          {currentTab === 'dashboard' && (
            <CommandDashboard
              incidents={incidents}
              activeIncident={activeIncident}
              onSelectIncident={setActiveIncident}
              onNavigateTab={setCurrentTab}
            />
          )}

          {currentTab === 'incidents' && (
            <IncidentManagement
              incidents={incidents}
              activeIncident={activeIncident}
              onSelectIncident={setActiveIncident}
              onRefreshIncidents={refreshIncidentsList}
              onNavigateTab={setCurrentTab}
            />
          )}

          {currentTab === 'detection' && (
            <SatelliteDetection
              activeIncident={activeIncident}
              onNavigateTab={setCurrentTab}
            />
          )}

          {currentTab === 'validation' && (
            <DetectionValidation
              activeIncident={activeIncident}
              onRefreshIncident={refreshIncidentsList}
              onNavigateTab={setCurrentTab}
            />
          )}

          {currentTab === 'reconstruction' && (
            <OriginReconstruction
              activeIncident={activeIncident}
              onRefreshIncident={refreshIncidentsList}
              onNavigateTab={setCurrentTab}
            />
          )}

          {currentTab === 'vessels' && (
            <VesselIntelligence
              activeIncident={activeIncident}
              onNavigateTab={setCurrentTab}
              onSelectCandidateForHypothesis={(vessel) => {
                setCandidateForHypothesis(vessel);
                setCurrentTab('counterfactual');
              }}
            />
          )}

          {currentTab === 'counterfactual' && (
            <CounterfactualSimulation
              activeIncident={activeIncident}
              candidateVessel={candidateForHypothesis}
              onNavigateTab={setCurrentTab}
            />
          )}

          {currentTab === 'evidence' && (
            <EvidencePackage
              activeIncident={activeIncident}
              onNavigateTab={setCurrentTab}
            />
          )}

          {currentTab === 'reports' && (
            <ReportsExports
              activeIncident={activeIncident}
              onNavigateTab={setCurrentTab}
            />
          )}

          {currentTab === 'datasources' && (
            <DataSources
              onNavigateTab={setCurrentTab}
            />
          )}

          {currentTab === 'system' && (
            <SystemStatus
              onNavigateTab={setCurrentTab}
            />
          )}
        </main>
      )}
    </div>
  );
}

export default App;
