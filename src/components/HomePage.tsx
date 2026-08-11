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
  isDarkMode: boolean;
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
  isDarkMode,
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
                  subtitle: 'Official Google Drive Document',
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
                  Corporate HSE Policy Google Drive document
                </p>
              </div>
            </button>

            {/* 👤 Competent Person */}
            <button
              onClick={() =>
                onOpenDocument({
                  title: 'EASTWAY ENGINEERING COMPETENT PERSON CREDENTIALS',
                  subtitle: 'Official Google Drive Document',
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
                  DOSH SHO, AGESP & Scaffolder Google Drive doc
                </p>
              </div>
            </button>

            {/* ⛑️ Emergency Response Plan */}
            <button
              onClick={() =>
                onOpenDocument({
                  title: 'EASTWAY ENGINEERING EMERGENCY RESPONSE PLAN',
                  subtitle: 'Official Google Drive Document',
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
                  Emergency response & evacuation Google Drive doc
                </p>
              </div>
            </button>

            {/* ⚖️ Legal Compliance */}
            <button
              onClick={() =>
                onOpenDocument({
                  title: 'LEGAL STATUTORY COMPLIANCE LOGS (OSHA 1994, FMA 1967, EQA 1974)',
                  subtitle: 'Official Google Docs Document',
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
                  subtitle: 'Chairman: Tan Eng Kiat | Secretary: Ir. Ahmad Razali (SHO)',
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
            href="https://script.google.com/macros/s/AKfycby-Bg4p7Z_1jUowq7PY7rKcaOR5Kx3uXxddB31jjflSBrCj6sJ6j4TwVTxEWLYmuVHX4w/exec"
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

    </div>
  );
};
