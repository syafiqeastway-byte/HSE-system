import React from 'react';
import { DocumentViewContext } from '../types';


import { IncidentChartsAndTables } from './IncidentChartsAndTables';

interface HomePageProps {
  onOpenDocument: (doc: DocumentViewContext) => void;
  onOpenCompetentPersonModal: () => void;
  onOpenInspectionModal: (type: 'Workplace' | 'First Aid Box' | 'Fire Extinguisher' | 'All') => void;
  onNavigateEmergencyPlan: () => void;
  onNavigateMinuteMeetings: () => void;
  onNavigateHIRARC: () => void;
  onNavigateSOP: () => void;
  onOpenAllIncidentsModal?: () => void;
  onNavigateSafetyViolation: () => void;
  isDarkMode: boolean;
  onOpenPWAInstall?: () => void;
  isPwaInstalled?: boolean;
  canInstallPwa?: boolean;
}

export const HomePage: React.FC<HomePageProps> = ({
  onOpenDocument,
  onOpenCompetentPersonModal,
  onOpenInspectionModal,
  onNavigateEmergencyPlan,
  onNavigateMinuteMeetings,
  onNavigateHIRARC,
  onNavigateSOP,
  onOpenAllIncidentsModal,
  onNavigateSafetyViolation,
  isDarkMode,
  onOpenPWAInstall,
  isPwaInstalled,
  canInstallPwa,
}) => {
  return (
    <div className="space-y-8">
      
      {/* SECTION 1: INCIDENT RECORDS & SAFETY PERFORMANCE */}
      <IncidentChartsAndTables
        isDarkMode={isDarkMode}
        onOpenAllIncidentsModal={onOpenAllIncidentsModal}
      />

      {/* SECTION 2 & 3 GRID: SAFETY DOCUMENTATION & COMMITTEE OVERSIGHT */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* SECTION 1: SAFETY DOCUMENTATION */}
        <div className="glass-card p-5 border-t-4 border-blue-600">
          <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-slate-200 dark:border-slate-700">
            <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 text-2xl">menu_book</span>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                SAFETY DOCUMENTATION
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            
            {/* 📜 Safety Policy */}
            <button
              onClick={() =>
                onOpenDocument({
                  title: 'EASTWAY ENGINEERING SAFETY & HEALTH POLICY',
                  subtitle: 'Official Document',
                  url: 'https://drive.google.com/file/d/1wmQE-dzUGGwhkJsM8rwKOIf01C7yD5tV/preview',
                  type: 'doc'
                })
              }
              className="p-4 rounded-2xl bg-white dark:bg-zinc-900/90 border border-slate-200 dark:border-zinc-800 hover:border-blue-500 dark:hover:border-blue-400 transition-all text-left flex items-start gap-3 shadow-sm group hover:-translate-y-0.5"
            >
              <div className="p-2.5 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-300 group-hover:scale-105 transition-transform">
                <span className="material-symbols-outlined text-2xl">policy</span>
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                  SAFETY POLICY
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                  Corporate HSE Policy
                </p>
              </div>
            </button>

            {/* 👤 Competent Person */}
            <button
              onClick={() =>
                onOpenDocument({
                  title: 'EASTWAY ENGINEERING COMPETENT PERSON CREDENTIALS',
                  subtitle: 'Official Document',
                  url: 'https://drive.google.com/file/d/1AnguTjW04YMFYKGcgCYAbuZrPDKVOHg6/preview',
                  type: 'doc'
                })
              }
              className="p-4 rounded-2xl bg-white dark:bg-zinc-900/90 border border-slate-200 dark:border-zinc-800 hover:border-blue-500 dark:hover:border-blue-400 transition-all text-left flex items-start gap-3 shadow-sm group hover:-translate-y-0.5"
            >
              <div className="p-2.5 rounded-xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-300 group-hover:scale-105 transition-transform">
                <span className="material-symbols-outlined text-2xl">badge</span>
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                  COMPETENT PERSON
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                  Official Credentials
                </p>
              </div>
            </button>

            {/* ⛑️ Emergency Response Plan */}
            <button
              onClick={() =>
                onOpenDocument({
                  title: 'EASTWAY ENGINEERING EMERGENCY RESPONSE PLAN',
                  subtitle: 'Official Document',
                  url: 'https://drive.google.com/file/d/1atnIb570BsXBjZpVe48QjDMVYmtHesgZ/view?usp=drive_link',
                  type: 'doc'
                })
              }
              className="p-4 rounded-2xl bg-white dark:bg-zinc-900/90 border border-slate-200 dark:border-zinc-800 hover:border-red-500 dark:hover:border-red-400 transition-all text-left flex items-start gap-3 shadow-sm group hover:-translate-y-0.5"
            >
              <div className="p-2.5 rounded-xl bg-red-100 dark:bg-red-950/80 text-red-600 dark:text-red-300 group-hover:scale-105 transition-transform">
                <span className="material-symbols-outlined text-2xl">e911_emergency</span>
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-zinc-100 group-hover:text-red-600 dark:group-hover:text-red-400">
                  EMERGENCY PLAN
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                  Emergency response & evacuation
                </p>
              </div>
            </button>

            {/* ⚖️ Legal Compliance */}
            <button
              onClick={() =>
                onOpenDocument({
                  title: 'LEGAL STATUTORY COMPLIANCE LOGS (OSHA 1994, FMA 1967, EQA 1974)',
                  subtitle: 'Official Document',
                  url: 'https://docs.google.com/document/d/19zhynxyiJifW9U99cAbEAw_WAmTKRYs8/preview',
                  type: 'doc'
                })
              }
              className="p-4 rounded-2xl bg-white dark:bg-zinc-900/90 border border-slate-200 dark:border-zinc-800 hover:border-amber-500 dark:hover:border-amber-400 transition-all text-left flex items-start gap-3 shadow-sm group hover:-translate-y-0.5"
            >
              <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-300 group-hover:scale-105 transition-transform">
                <span className="material-symbols-outlined text-2xl">gavel</span>
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-zinc-100 group-hover:text-amber-600 dark:group-hover:text-amber-400">
                  LEGAL COMPLIANCE
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                  OSHA 1994 & FMA statutory register logs
                </p>
              </div>
            </button>

          </div>
        </div>

        {/* SECTION 2: COMMITTEE & OVERSIGHT MANAGEMENT */}
        <div className="glass-card p-5 border-t-4 border-indigo-600">
          <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-slate-200 dark:border-slate-700">
            <span className="material-symbols-outlined text-indigo-600 dark:text-indigo-400 text-2xl">groups</span>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                COMMITTEE & OVERSIGHT MANAGEMENT
              </h2>
              
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            
            {/* 🧑🤝🧑 Safety Committee Org Chart */}
            <button
              onClick={() =>
                onOpenDocument({
                  title: 'EASTWAY ENGINEERING SAFETY COMMITTEE ORGANIZATIONAL CHART 2026',
                  subtitle: '',
                  url: 'https://docs.google.com/document/d/1DlrbuME45FA4z6g7-fVxUldxUD-qC67w/edit?usp=drive_link&ouid=106504427725302283723&rtpof=true&sd=true',
                  type: 'doc'
                })
              }
              className="p-4 rounded-2xl bg-white dark:bg-zinc-900/90 border border-slate-200 dark:border-zinc-800 hover:border-indigo-500 dark:hover:border-indigo-400 transition-all text-left flex items-start gap-3 shadow-sm group hover:-translate-y-0.5"
            >
              <div className="p-2.5 rounded-xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-300 group-hover:scale-105 transition-transform">
                <span className="material-symbols-outlined text-2xl">account_tree</span>
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-zinc-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                  SAFETY COMMITTEE ORG CHART
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                  Organizational structure & committee reps
                </p>
              </div>
            </button>

            {/* 📝 Meeting Minutes */}
            <button
              onClick={onNavigateMinuteMeetings}
              className="p-4 rounded-2xl bg-white dark:bg-zinc-900/90 border border-slate-200 dark:border-zinc-800 hover:border-indigo-500 dark:hover:border-indigo-400 transition-all text-left flex items-start gap-3 shadow-sm group hover:-translate-y-0.5"
            >
              <div className="p-2.5 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-300 group-hover:scale-105 transition-transform">
                <span className="material-symbols-outlined text-2xl">assignment</span>
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                  MEETING MINUTES
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                  Quarterly committee meeting records
                </p>
              </div>
            </button>

          </div>
        </div>

      </div>

      {/* SECTION 3: PROCEDURES, RISK ASSESSMENT & INSPECTIONS */}
      <div className="glass-card p-5 border-t-4 border-amber-500">
        <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-slate-200 dark:border-slate-700">
          <span className="material-symbols-outlined text-amber-500 text-2xl">assignment_turned_in</span>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              SAFETY PROCEDURES, RISK ASSESSMENT & INSPECTIONS
            </h2>
            
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-center">
          
          {/* SOP Dropdown */}
          <button
            onClick={onNavigateSOP}
            className="w-full px-4 py-3.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100 font-semibold text-xs sm:text-sm flex items-center justify-between hover:border-blue-500 dark:hover:border-blue-400 transition-all shadow-sm group min-h-[44px]"
          >
            <div className="flex items-center gap-2 truncate">
              <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 text-xl">description</span>
              <span className="truncate">SOP</span>
            </div>
            <span className="material-symbols-outlined text-slate-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-transform">
              arrow_forward
            </span>
          </button>

          {/* HIRARC Dropdown */}
          <button
            onClick={onNavigateHIRARC}
            className="w-full px-4 py-3.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100 font-semibold text-xs sm:text-sm flex items-center justify-between hover:border-amber-500 dark:hover:border-amber-400 transition-all shadow-sm group min-h-[44px]"
          >
            <div className="flex items-center gap-2 truncate">
              <span className="material-symbols-outlined text-amber-600 dark:text-amber-400 text-xl">assignment_turned_in</span>
              <span className="truncate">HIRARC</span>
            </div>
            <span className="material-symbols-outlined text-slate-400 group-hover:text-amber-500 group-hover:translate-x-1 transition-transform">
              arrow_forward
            </span>
          </button>

          {/* Inspection Records Button */}
          <button
            onClick={() => onOpenInspectionModal('All')}
            className="w-full px-4 py-3.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100 font-semibold text-xs sm:text-sm flex items-center justify-between hover:border-emerald-500 dark:hover:border-emerald-400 transition-all shadow-sm group min-h-[44px]"
          >
            <div className="flex items-center gap-2 truncate">
              <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400 text-xl">fact_check</span>
              <span className="truncate">INSPECTION RECORDS</span>
            </div>
            <span className="material-symbols-outlined text-slate-400 group-hover:text-emerald-500 group-hover:translate-x-1 transition-transform">
              arrow_forward
            </span>
          </button>

          {/* External Inspection Form Button */}
          <a
            href="https://script.google.com/macros/s/AKfycbxhrI7F4_Tbg2wPSky9i0cBK8xc2OQDMpUHlE2ZAxDLZxqvb5iBkO5a6P6UoJRo04CdaA/exec"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full px-4 py-3.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100 font-semibold text-xs sm:text-sm flex items-center justify-between hover:border-amber-500 dark:hover:border-amber-400 transition-all shadow-sm group min-h-[44px]"
          >
            <div className="flex items-center gap-2 truncate">
              <span className="material-symbols-outlined text-amber-600 dark:text-amber-400 text-xl">edit_note</span>
              <span className="truncate">INSPECTION FORM</span>
            </div>
            <span className="material-symbols-outlined text-slate-400 group-hover:text-amber-500 group-hover:translate-x-1 transition-transform">
              open_in_new
            </span>
          </a>

        </div>
      </div>

      {/* NEW SECTION: SAFETY VIOLATIONS & PERFORMANCE */}
      <div className="glass-card p-5 border-t-4 border-red-500">
        <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-slate-200 dark:border-slate-700">
          <span className="material-symbols-outlined text-red-500 text-2xl">gavel</span>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white uppercase">
              Safety Violations & Demerit Monitoring
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-center">
          
          {/* Safety Violation Scoring System Button */}
          <button
            onClick={onNavigateSafetyViolation}
            className="w-full px-4 py-3.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100 font-semibold text-xs sm:text-sm flex items-center justify-between hover:border-red-500 dark:hover:border-red-400 transition-all shadow-sm group min-h-[44px]"
          >
            <div className="flex items-center gap-2 truncate">
              <span className="material-symbols-outlined text-red-600 dark:text-red-400 text-xl">gavel</span>
              <span className="truncate uppercase font-bold text-xs sm:text-sm">SAFETY VIOLATION SCORING SYSTEM</span>
            </div>
            <span className="material-symbols-outlined text-slate-400 group-hover:text-red-500 group-hover:translate-x-1 transition-transform">
              arrow_forward
            </span>
          </button>

        </div>
      </div>

      {/* PWA INSTALLATION SECTION AT THE BOTTOM OF THE PAGE */}
      {onOpenPWAInstall && !isPwaInstalled && (
        <div className="flex justify-center items-center py-4 mt-2">
          <button
            onClick={onOpenPWAInstall}
            className="w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-lg shadow-blue-500/30 hover:scale-110 active:scale-95 transition-all cursor-pointer relative"
            title="Install App"
          >
            <span className="material-symbols-outlined text-3xl">download</span>
            {canInstallPwa && (
              <span className="absolute top-0.5 right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-white dark:border-slate-900 animate-ping"></span>
            )}
            {canInstallPwa && (
              <span className="absolute top-0.5 right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-white dark:border-slate-900"></span>
            )}
          </button>
        </div>
      )}

    </div>
  );
};
