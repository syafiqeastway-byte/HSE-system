import React from 'react';
import { DocumentViewContext } from '../types';

interface HomePageProps {
  onOpenDocument: (doc: DocumentViewContext) => void;
  onOpenCompetentPersonModal: () => void;
  onOpenInspectionModal?: (type: 'Workplace' | 'First Aid Box' | 'Fire Extinguisher' | 'All') => void;
  onNavigateInspection: () => void;
  onNavigateFirstAidKit: () => void;
  onNavigateEmergencyPlan: () => void;
  onNavigateMinuteMeetings: () => void;
  onNavigateHIRARC: () => void;
  onNavigateSOP: () => void;
  onOpenAllIncidentsModal?: () => void;
  onNavigateSafetyViolation: () => void;
  onNavigateSafetyEquipment: () => void;
  onOpenIncidentReportModal?: () => void;
  isDarkMode: boolean;
  onOpenPWAInstall?: () => void;
  isPwaInstalled?: boolean;
  canInstallPwa?: boolean;
}

export const HomePage: React.FC<HomePageProps> = ({
  onOpenDocument,
  onOpenCompetentPersonModal,
  onOpenInspectionModal,
  onNavigateInspection,
  onNavigateFirstAidKit,
  onNavigateEmergencyPlan,
  onNavigateMinuteMeetings,
  onNavigateHIRARC,
  onNavigateSOP,
  onOpenAllIncidentsModal,
  onNavigateSafetyViolation,
  onNavigateSafetyEquipment,
  onOpenIncidentReportModal,
  isDarkMode,
  onOpenPWAInstall,
  isPwaInstalled,
  canInstallPwa,
}) => {
  return (
    <div className="space-y-6">
      
      {/* SECTION 2 & 3 GRID: SAFETY DOCUMENTATION & COMMITTEE OVERSIGHT */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* SECTION 1: SAFETY DOCUMENTATION */}
        <div className="glass-card p-4 sm:p-5 border-t-4 border-blue-500 rounded-2xl bg-slate-950/70 backdrop-blur-xl shadow-xl">
          <div className="flex items-center gap-2.5 mb-3.5 pb-2.5 border-b border-cyan-500/20">
            <div className="p-2 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <span className="material-symbols-outlined text-xl">menu_book</span>
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-extrabold tracking-wide text-white uppercase">
                SAFETY DOCUMENTATION
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            
            {/* 🛡️ Safety Policy */}
            <button
              onClick={() =>
                onOpenDocument({
                  title: 'EASTWAY ENGINEERING SAFETY & HEALTH POLICY',
                  subtitle: 'Official Document',
                  url: 'https://drive.google.com/file/d/1wmQE-dzUGGwhkJsM8rwKOIf01C7yD5tV/preview',
                  type: 'doc'
                })
              }
              className="p-3 rounded-xl bg-slate-900/80 border border-cyan-500/20 hover:border-cyan-400 hover:bg-cyan-950/40 transition-all text-left flex items-center gap-2.5 shadow-sm group hover:-translate-y-0.5"
            >
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 group-hover:scale-105 transition-transform border border-blue-500/20 flex-shrink-0">
                <span className="material-symbols-outlined text-lg">policy</span>
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-xs font-bold text-white group-hover:text-cyan-300 truncate">
                  SAFETY POLICY
                </h3>
                <p className="text-[10px] text-slate-400 truncate mt-0.5">
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
              className="p-3 rounded-xl bg-slate-900/80 border border-cyan-500/20 hover:border-cyan-400 hover:bg-cyan-950/40 transition-all text-left flex items-center gap-2.5 shadow-sm group hover:-translate-y-0.5"
            >
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 group-hover:scale-105 transition-transform border border-indigo-500/20 flex-shrink-0">
                <span className="material-symbols-outlined text-lg">badge</span>
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-xs font-bold text-white group-hover:text-cyan-300 truncate">
                  COMPETENT PERSON
                </h3>
                <p className="text-[10px] text-slate-400 truncate mt-0.5">
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
              className="p-3 rounded-xl bg-slate-900/80 border border-cyan-500/20 hover:border-cyan-400 hover:bg-cyan-950/40 transition-all text-left flex items-center gap-2.5 shadow-sm group hover:-translate-y-0.5"
            >
              <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400 group-hover:scale-105 transition-transform border border-rose-500/20 flex-shrink-0">
                <span className="material-symbols-outlined text-lg">e911_emergency</span>
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-xs font-bold text-white group-hover:text-cyan-300 truncate">
                  EMERGENCY PLAN
                </h3>
                <p className="text-[10px] text-slate-400 truncate mt-0.5">
                  Emergency response
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
              className="p-3 rounded-xl bg-slate-900/80 border border-cyan-500/20 hover:border-cyan-400 hover:bg-cyan-950/40 transition-all text-left flex items-center gap-2.5 shadow-sm group hover:-translate-y-0.5"
            >
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 group-hover:scale-105 transition-transform border border-amber-500/20 flex-shrink-0">
                <span className="material-symbols-outlined text-lg">gavel</span>
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-xs font-bold text-white group-hover:text-cyan-300 truncate">
                  LEGAL COMPLIANCE
                </h3>
                <p className="text-[10px] text-slate-400 truncate mt-0.5">
                  OSHA 1994 & FMA logs
                </p>
              </div>
            </button>

          </div>
        </div>

        {/* SECTION 2: COMMITTEE & OVERSIGHT MANAGEMENT */}
        <div className="glass-card p-4 sm:p-5 border-t-4 border-indigo-500 rounded-2xl bg-slate-950/70 backdrop-blur-xl shadow-xl">
          <div className="flex items-center gap-2.5 mb-3.5 pb-2.5 border-b border-cyan-500/20">
            <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <span className="material-symbols-outlined text-xl">groups</span>
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-extrabold tracking-wide text-white uppercase">
                COMMITTEE & OVERSIGHT MANAGEMENT
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            
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
              className="p-3 rounded-xl bg-slate-900/80 border border-cyan-500/20 hover:border-cyan-400 hover:bg-cyan-950/40 transition-all text-left flex items-center gap-2.5 shadow-sm group hover:-translate-y-0.5"
            >
              <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400 group-hover:scale-105 transition-transform border border-teal-500/20 flex-shrink-0">
                <span className="material-symbols-outlined text-lg">account_tree</span>
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-xs font-bold text-white group-hover:text-cyan-300 truncate">
                  ORG CHART
                </h3>
                <p className="text-[10px] text-slate-400 truncate mt-0.5">
                  Committee structure
                </p>
              </div>
            </button>

            {/* 📝 Meeting Minutes */}
            <button
              onClick={onNavigateMinuteMeetings}
              className="p-3 rounded-xl bg-slate-900/80 border border-cyan-500/20 hover:border-cyan-400 hover:bg-cyan-950/40 transition-all text-left flex items-center gap-2.5 shadow-sm group hover:-translate-y-0.5"
            >
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 group-hover:scale-105 transition-transform border border-blue-500/20 flex-shrink-0">
                <span className="material-symbols-outlined text-lg">assignment</span>
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-xs font-bold text-white group-hover:text-cyan-300 truncate">
                  MEETING MINUTES
                </h3>
                <p className="text-[10px] text-slate-400 truncate mt-0.5">
                  Quarterly meeting records
                </p>
              </div>
            </button>

          </div>
        </div>

      </div>

      {/* SECTION 3: PROCEDURES, RISK ASSESSMENT & INSPECTIONS */}
      <div className="glass-card p-4 sm:p-5 border-t-4 border-amber-500 rounded-2xl bg-slate-950/70 backdrop-blur-xl shadow-xl">
        <div className="flex items-center gap-2.5 mb-3.5 pb-2.5 border-b border-cyan-500/20">
          <div className="p-2 rounded-xl bg-amber-600/20 text-amber-400 border border-amber-500/30">
            <span className="material-symbols-outlined text-xl">assignment_turned_in</span>
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-extrabold tracking-wide text-white uppercase">
              SAFETY PROCEDURES, RISK ASSESSMENT & INSPECTIONS
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 items-center">
          
          {/* SOP Dropdown */}
          <button
            onClick={onNavigateSOP}
            className="w-full px-3 py-2.5 rounded-xl border border-cyan-500/20 bg-slate-900/80 text-slate-100 font-semibold text-xs flex items-center justify-between hover:border-cyan-400 hover:bg-cyan-950/40 transition-all shadow-sm group min-h-[40px]"
          >
            <div className="flex items-center gap-2 truncate">
              <span className="material-symbols-outlined text-cyan-400 text-base">description</span>
              <span className="truncate">SOP</span>
            </div>
            <span className="material-symbols-outlined text-slate-400 text-sm group-hover:text-white group-hover:translate-x-0.5 transition-transform">
              arrow_forward
            </span>
          </button>

          {/* HIRARC Dropdown */}
          <button
            onClick={onNavigateHIRARC}
            className="w-full px-3 py-2.5 rounded-xl border border-cyan-500/20 bg-slate-900/80 text-slate-100 font-semibold text-xs flex items-center justify-between hover:border-cyan-400 hover:bg-cyan-950/40 transition-all shadow-sm group min-h-[40px]"
          >
            <div className="flex items-center gap-2 truncate">
              <span className="material-symbols-outlined text-indigo-400 text-base">assignment_turned_in</span>
              <span className="truncate">HIRARC</span>
            </div>
            <span className="material-symbols-outlined text-slate-400 text-sm group-hover:text-white group-hover:translate-x-0.5 transition-transform">
              arrow_forward
            </span>
          </button>

          {/* Inspection Records Button */}
          <button
            onClick={onNavigateInspection}
            className="w-full px-3 py-2.5 rounded-xl border border-cyan-500/20 bg-slate-900/80 text-slate-100 font-semibold text-xs flex items-center justify-between hover:border-cyan-400 hover:bg-cyan-950/40 transition-all shadow-sm group min-h-[40px]"
          >
            <div className="flex items-center gap-2 truncate">
              <span className="material-symbols-outlined text-amber-400 text-base">fact_check</span>
              <span className="truncate">WORKPLACE INSPECTION</span>
            </div>
            <span className="material-symbols-outlined text-slate-400 text-sm group-hover:text-white group-hover:translate-x-0.5 transition-transform">
              arrow_forward
            </span>
          </button>

          {/* External Inspection Form Button */}
          <a
            href="https://script.google.com/macros/s/AKfycbxhrI7F4_Tbg2wPSky9i0cBK8xc2OQDMpUHlE2ZAxDLZxqvb5iBkO5a6P6UoJRo04CdaA/exec"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full px-3 py-2.5 rounded-xl border border-cyan-500/20 bg-slate-900/80 text-slate-100 font-semibold text-xs flex items-center justify-between hover:border-cyan-400 hover:bg-cyan-950/40 transition-all shadow-sm group min-h-[40px]"
          >
            <div className="flex items-center gap-2 truncate">
              <span className="material-symbols-outlined text-emerald-400 text-base">edit_note</span>
              <span className="truncate">INSPECTION FORM</span>
            </div>
            <span className="material-symbols-outlined text-slate-400 text-sm group-hover:text-white group-hover:translate-x-0.5 transition-transform">
              open_in_new
            </span>
          </a>

          {/* New AI Incident Report Form Button */}
          {onOpenIncidentReportModal && (
            <button
              onClick={onOpenIncidentReportModal}
              className="w-full px-3 py-2.5 rounded-xl border border-rose-500/40 bg-gradient-to-r from-rose-950/90 via-amber-950/80 to-slate-900 text-white font-bold text-xs flex items-center justify-between hover:border-rose-400 hover:from-rose-900/90 transition-all shadow-md group min-h-[40px] cursor-pointer"
            >
              <div className="flex items-center gap-2 truncate">
                <span className="material-symbols-outlined text-rose-400 text-base animate-pulse">report_problem</span>
                <span className="truncate">INCIDENT REPORT FORM (AI)</span>
              </div>
              <span className="material-symbols-outlined text-amber-400 text-sm group-hover:scale-110 transition-transform">
                auto_awesome
              </span>
            </button>
          )}

        </div>
      </div>

      {/* NEW SECTION: SAFETY EQUIPMENT */}
      <div className="glass-card p-4 sm:p-5 border-t-4 border-rose-500 rounded-2xl bg-slate-950/70 backdrop-blur-xl shadow-xl">
        <div className="flex items-center gap-2.5 mb-3.5 pb-2.5 border-b border-cyan-500/20">
          <div className="p-2 rounded-xl bg-rose-600/20 text-rose-400 border border-rose-500/30">
            <span className="material-symbols-outlined text-xl">local_fire_department</span>
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-extrabold tracking-wide text-white uppercase">
              Safety Equipment
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 items-center">
          
          {/* Fire Extinguisher Button */}
          <button
            onClick={onNavigateSafetyEquipment}
            className="w-full px-3 py-2.5 rounded-xl border border-cyan-500/20 bg-slate-900/80 text-slate-100 font-semibold text-xs flex items-center justify-between hover:border-cyan-400 hover:bg-cyan-950/40 transition-all shadow-sm group min-h-[40px]"
          >
            <div className="flex items-center gap-2 truncate">
              <span className="material-symbols-outlined text-rose-400 text-base">local_fire_department</span>
              <span className="truncate uppercase font-bold text-xs">FIRE EXTINGUISHER</span>
            </div>
            <span className="material-symbols-outlined text-slate-400 text-sm group-hover:text-white group-hover:translate-x-0.5 transition-transform">
              arrow_forward
            </span>
          </button>

          {/* First Aid Kit Button */}
          <button
            onClick={onNavigateFirstAidKit}
            className="w-full px-3 py-2.5 rounded-xl border border-cyan-500/20 bg-slate-900/80 text-slate-100 font-semibold text-xs flex items-center justify-between hover:border-cyan-400 hover:bg-cyan-950/40 transition-all shadow-sm group min-h-[40px]"
          >
            <div className="flex items-center gap-2 truncate">
              <span className="material-symbols-outlined text-rose-400 text-base">medical_services</span>
              <span className="truncate font-bold text-xs">FIRST AID</span>
            </div>
            <span className="material-symbols-outlined text-slate-400 text-sm group-hover:text-white group-hover:translate-x-0.5 transition-transform">
              arrow_forward
            </span>
          </button>


        </div>
      </div>

      {/* NEW SECTION: SAFETY VIOLATIONS & PERFORMANCE */}
      <div className="glass-card p-4 sm:p-5 border-t-4 border-red-500 rounded-2xl bg-slate-950/70 backdrop-blur-xl shadow-xl">
        <div className="flex items-center gap-2.5 mb-3.5 pb-2.5 border-b border-cyan-500/20">
          <div className="p-2 rounded-xl bg-red-600/20 text-red-400 border border-red-500/30">
            <span className="material-symbols-outlined text-xl">gavel</span>
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-extrabold tracking-wide text-white uppercase">
              Safety Violations & Demerit Monitoring
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 items-center">
          
          {/* Safety Violation Scoring System Button */}
          <button
            onClick={onNavigateSafetyViolation}
            className="w-full px-3 py-2.5 rounded-xl border border-cyan-500/20 bg-slate-900/80 text-slate-100 font-semibold text-xs flex items-center justify-between hover:border-cyan-400 hover:bg-cyan-950/40 transition-all shadow-sm group min-h-[40px]"
          >
            <div className="flex items-center gap-2 truncate">
              <span className="material-symbols-outlined text-red-400 text-base">gavel</span>
              <span className="truncate uppercase font-bold text-xs">SAFETY VIOLATION SCORING SYSTEM</span>
            </div>
            <span className="material-symbols-outlined text-slate-400 text-sm group-hover:text-white group-hover:translate-x-0.5 transition-transform">
              arrow_forward
            </span>
          </button>

        </div>
      </div>

      {/* PWA INSTALLATION SECTION AT THE BOTTOM OF THE PAGE */}
      {onOpenPWAInstall && !isPwaInstalled && (
        <div className="flex justify-center items-center py-2 mt-1">
          <button
            onClick={onOpenPWAInstall}
            className="w-12 h-12 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-lg shadow-blue-500/30 hover:scale-110 active:scale-95 transition-all cursor-pointer relative"
            title="Install App"
          >
            <span className="material-symbols-outlined text-2xl">download</span>
            {canInstallPwa && (
              <span className="absolute top-0.5 right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-slate-900 animate-ping"></span>
            )}
            {canInstallPwa && (
              <span className="absolute top-0.5 right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-slate-900"></span>
            )}
          </button>
        </div>
      )}

    </div>
  );
};
