import React, { useState, useEffect } from 'react';
import { PageType, DocumentViewContext } from './types';
import { SplashScreen } from './components/SplashScreen';
import { Header } from './components/Header';
import { TelemetryHub } from './components/TelemetryHub';
import { HomePage } from './components/HomePage';
import { IncidentChartsAndTables } from './components/IncidentChartsAndTables';
import { MinuteMeetingPage } from './components/MinuteMeetingPage';
import { HIRARCPage } from './components/HIRARCPage';
import { SOPPage } from './components/SOPPage';
import { EmergencyPlanPage } from './components/EmergencyPlanPage';
import { CompetentPersonModal } from './components/CompetentPersonModal';
import { InspectionModal } from './components/InspectionModal';
import { ExportGasModal } from './components/ExportGasModal';
import { SupabaseModal } from './components/SupabaseModal';
import { AllIncidentsPage } from './components/AllIncidentsPage';
import { SafetyViolationPage } from './components/SafetyViolationPage';
import { PWAInstallModal } from './components/PWAInstallModal';

import { formatToPreviewUrl } from './utils/formatDriveUrl';

export default function App() {
  const [showSplash, setShowSplash] = useState(false);
  const [activePage, setActivePage] = useState<PageType>('homePage');
  
  // Theme State
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

  // Document Viewer Context
  const [docViewContext, setDocViewContext] = useState<DocumentViewContext | null>(null);

  // Modals
  const [competentPersonModalOpen, setCompetentPersonModalOpen] = useState(false);
  const [inspectionModalOpen, setInspectionModalOpen] = useState(false);
  const [inspectionFilterType, setInspectionFilterType] = useState<'Workplace' | 'First Aid Box' | 'Fire Extinguisher' | 'All'>('All');
  const [exportGasModalOpen, setExportGasModalOpen] = useState(false);
  const [supabaseModalOpen, setSupabaseModalOpen] = useState(false);

  // PWA State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isPwaInstalled, setIsPwaInstalled] = useState<boolean>(false);
  const [pwaModalOpen, setPwaModalOpen] = useState<boolean>(false);
  
  // Sync Theme with HTML element
  useEffect(() => {
    document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', 'light');
  }, []);

  // Listen for PWA BeforeInstallPrompt and AppInstalled events
  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true;
    setIsPwaInstalled(isStandalone);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsPwaInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const toggleTheme = () => {
    // Force strictly light mode
  };

  // Open Document Viewer
  const handleOpenDocument = (doc: DocumentViewContext) => {
    const previewUrl = formatToPreviewUrl(doc.url);
    window.open(previewUrl, '_blank', 'noopener,noreferrer');
  };

  // Open Inspection Modal
  const handleOpenInspectionModal = (type: 'Workplace' | 'First Aid Box' | 'Fire Extinguisher' | 'All') => {
    setInspectionFilterType(type);
    setInspectionModalOpen(true);
  };

  return (
    <div className="min-h-screen modern-bg-light dark:modern-bg-dark text-slate-900 dark:text-slate-100 transition-colors duration-300 relative selection:bg-blue-500/20">
      
      {/* 1. Animated Splash Screen */}
      {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}

      {/* Main Content Layout Container */}
      <div className="w-full max-w-[1536px] mx-auto px-3 sm:px-5 lg:px-8 py-5">
        
        {/* Header Banner & Navigation */}
        <Header
          activePage={activePage}
          setActivePage={(page) => {
            setActivePage(page);
          }}
          isDarkMode={isDarkMode}
          toggleTheme={toggleTheme}
          onOpenPWAInstall={() => setPwaModalOpen(true)}
          isPwaInstalled={isPwaInstalled}
          canInstallPwa={!!deferredPrompt}
        />

        {/* Top Telemetry Hub */}
        <TelemetryHub />

        {/* View Container Switcher */}
        <main>
          {activePage === 'homePage' && (
            <HomePage
              onOpenDocument={handleOpenDocument}
              onOpenCompetentPersonModal={() => setCompetentPersonModalOpen(true)}
              onOpenInspectionModal={handleOpenInspectionModal}
              onNavigateEmergencyPlan={() => setActivePage('emergencyPlanPage')}
              onNavigateMinuteMeetings={() => setActivePage('minuteMeetingPage')}
              onNavigateHIRARC={() => setActivePage('hirarcPage')}
              onNavigateSOP={() => setActivePage('sopPage')}
              onOpenAllIncidentsModal={() => setActivePage('allIncidentsPage')}
              onNavigateSafetyViolation={() => setActivePage('safetyViolationPage')}
              isDarkMode={isDarkMode}
              onOpenPWAInstall={() => setPwaModalOpen(true)}
              isPwaInstalled={isPwaInstalled}
              canInstallPwa={!!deferredPrompt}
            />
          )}

          {activePage === 'analyticsPage' && (
            <div className="space-y-6">
              <div className="glass-card p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setActivePage('homePage')}
                    className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-colors"
                  >
                    <span className="material-symbols-outlined text-xl">arrow_back</span>
                  </button>
                  <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                    INCIDENT ANALYTICS DEEP-DIVE
                  </h2>
                </div>
              </div>
              <IncidentChartsAndTables
                isDarkMode={isDarkMode}
                onOpenAllIncidentsModal={() => setActivePage('allIncidentsPage')}
              />
            </div>
          )}

          {activePage === 'minuteMeetingPage' && (
            <MinuteMeetingPage
              onOpenDocument={handleOpenDocument}
              onBackToHome={() => setActivePage('homePage')}
            />
          )}

          {activePage === 'hirarcPage' && (
            <HIRARCPage
              onBackToHome={() => setActivePage('homePage')}
            />
          )}

          {activePage === 'sopPage' && (
            <SOPPage
              onBackToHome={() => setActivePage('homePage')}
            />
          )}

          {activePage === 'emergencyPlanPage' && (
            <EmergencyPlanPage
              onOpenDocument={handleOpenDocument}
              onBackToHome={() => setActivePage('homePage')}
            />
          )}
        
          {activePage === 'allIncidentsPage' && (
            <AllIncidentsPage
              onBackToHome={() => setActivePage('homePage')}
              isDarkMode={isDarkMode}
            />
          )}

          {activePage === 'safetyViolationPage' && (
            <SafetyViolationPage
              onBackToHome={() => setActivePage('homePage')}
            />
          )}
</main>

        {/* Footer */}
        <footer className="mt-8 py-6 border-t border-slate-200 dark:border-slate-800/80 text-center text-xs text-slate-500 dark:text-slate-400">
          <p className="font-semibold text-slate-700 dark:text-slate-300">
            © 2026 Eastway Engineering Sdn. Bhd. All Rights Reserved.
          </p>
        </footer>

      </div>

      {/* Modals */}
      <CompetentPersonModal
        isOpen={competentPersonModalOpen}
        onClose={() => setCompetentPersonModalOpen(false)}
      />

      <InspectionModal
        isOpen={inspectionModalOpen}
        filterType={inspectionFilterType}
        onClose={() => setInspectionModalOpen(false)}
      />

      <ExportGasModal
        isOpen={exportGasModalOpen}
        onClose={() => setExportGasModalOpen(false)}
      />

      <SupabaseModal
        isOpen={supabaseModalOpen}
        onClose={() => setSupabaseModalOpen(false)}
      />

      <PWAInstallModal
        isOpen={pwaModalOpen}
        onClose={() => setPwaModalOpen(false)}
        deferredPrompt={deferredPrompt}
        onInstallSuccess={() => setIsPwaInstalled(true)}
      />

      

    </div>
  );
}
