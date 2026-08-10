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
import { DocumentViewPage } from './components/DocumentViewPage';
import { CompetentPersonModal } from './components/CompetentPersonModal';
import { InspectionModal } from './components/InspectionModal';
import { ExportGasModal } from './components/ExportGasModal';
import { SupabaseModal } from './components/SupabaseModal';
import { AllIncidentRecordModal } from './components/AllIncidentRecordModal';

export default function App() {
  const [showSplash, setShowSplash] = useState(false);
  const [activePage, setActivePage] = useState<PageType>('homePage');
  
  // Theme State
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      return savedTheme === 'dark';
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Document Viewer Context
  const [docViewContext, setDocViewContext] = useState<DocumentViewContext | null>(null);

  // Modals
  const [competentPersonModalOpen, setCompetentPersonModalOpen] = useState(false);
  const [inspectionModalOpen, setInspectionModalOpen] = useState(false);
  const [inspectionFilterType, setInspectionFilterType] = useState<'Workplace' | 'First Aid Box' | 'Fire Extinguisher' | 'All'>('All');
  const [exportGasModalOpen, setExportGasModalOpen] = useState(false);
  const [supabaseModalOpen, setSupabaseModalOpen] = useState(false);
  const [allIncidentsModalOpen, setAllIncidentsModalOpen] = useState(false);

  // Sync Theme with HTML element
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode((prev) => !prev);
  };

  // Open Document Viewer
  const handleOpenDocument = (doc: DocumentViewContext) => {
    setDocViewContext(doc);
    setActivePage('documentViewPage');
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Header Banner & Navigation */}
        <Header
          activePage={activePage}
          setActivePage={(page) => {
            setActivePage(page);
            if (page !== 'documentViewPage') setDocViewContext(null);
          }}
          isDarkMode={isDarkMode}
          toggleTheme={toggleTheme}
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
              onOpenAllIncidentsModal={() => setAllIncidentsModalOpen(true)}
              isDarkMode={isDarkMode}
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
                onOpenAllIncidentsModal={() => setAllIncidentsModalOpen(true)}
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

          {activePage === 'documentViewPage' && docViewContext && (
            <DocumentViewPage
              docContext={docViewContext}
              onBack={() => {
                setActivePage('homePage');
                setDocViewContext(null);
              }}
            />
          )}
        </main>

        {/* Footer */}
        <footer className="mt-8 py-6 border-t border-slate-200 dark:border-slate-800/80 text-center text-xs text-slate-500 dark:text-slate-400">
          <p className="font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            EASTWAY ENGINEERING MYSAFETY • HSE INTEGRATED MANAGEMENT SYSTEM
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

      <AllIncidentRecordModal
        isOpen={allIncidentsModalOpen}
        onClose={() => setAllIncidentsModalOpen(false)}
      />

    </div>
  );
}
