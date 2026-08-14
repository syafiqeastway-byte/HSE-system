import React from 'react';
import { PageType } from '../types';

interface HeaderProps {
  activePage: PageType;
  setActivePage: (page: PageType) => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
  onRefreshData?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activePage,
  setActivePage,
  isDarkMode,
  toggleTheme,
  onRefreshData,
}) => {
  return (
    <header className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-3.5 sm:p-4 lg:p-5 mb-6 shadow-xl transition-all">
      <div className="flex flex-col xl:flex-row items-center justify-between gap-4">
        
        {/* Company Title & Brand Icon */}
        <div className="flex items-center gap-3 w-full xl:w-auto justify-between xl:justify-start flex-shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 cursor-pointer" onClick={() => setActivePage('homePage')}>
            <div className="w-11 h-11 sm:w-14 sm:h-14 flex items-center justify-center flex-shrink-0 overflow-hidden">
              <img
                src="https://lh3.googleusercontent.com/d/1Nwa1uSh2j7JVDKnnJBI-Ttamib2FToVp"
                alt="EASTWAY Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h1 className="text-base sm:text-lg lg:text-xl font-extrabold tracking-tight text-slate-900 dark:text-white uppercase leading-tight whitespace-nowrap">
                EASTWAY ENGINEERING 
              </h1>
              <p className="text-[10px] sm:text-xs text-slate-500 dark:text-zinc-400 font-bold tracking-[0.12em] sm:tracking-[0.15em] uppercase">
                HSE Integrated Management System
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs & Actions */}
        <div className="flex items-center gap-2 w-full xl:w-auto justify-start xl:justify-end overflow-hidden">
          <nav className="flex items-center gap-1 sm:gap-1.5 md:gap-2 overflow-x-auto w-full xl:w-auto pb-1 xl:pb-0 scrollbar-none flex-nowrap">
            <button
              onClick={() => setActivePage('homePage')}
              className={`px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wider flex items-center gap-1.5 sm:gap-2 transition-all whitespace-nowrap flex-shrink-0 ${
                activePage === 'homePage'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-600 dark:text-zinc-300 hover:bg-slate-100/80 dark:hover:bg-zinc-800/80'
              }`}
            >
              <span className="material-symbols-outlined text-lg sm:text-xl">dashboard</span>
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => setActivePage('analyticsPage')}
              className={`px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wider flex items-center gap-1.5 sm:gap-2 transition-all whitespace-nowrap flex-shrink-0 ${
                activePage === 'analyticsPage'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-600 dark:text-zinc-300 hover:bg-slate-100/80 dark:hover:bg-zinc-800/80'
              }`}
            >
              <span className="material-symbols-outlined text-lg sm:text-xl">analytics</span>
              <span>Analytics</span>
            </button>

            <button
              onClick={() => setActivePage('minuteMeetingPage')}
              className={`px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wider flex items-center gap-1.5 sm:gap-2 transition-all whitespace-nowrap flex-shrink-0 ${
                activePage === 'minuteMeetingPage'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-600 dark:text-zinc-300 hover:bg-slate-100/80 dark:hover:bg-zinc-800/80'
              }`}
            >
              <span className="material-symbols-outlined text-lg sm:text-xl">description</span>
              <span>Meeting Minutes</span>
            </button>

            <button
              onClick={() => setActivePage('emergencyPlanPage')}
              className={`px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wider flex items-center gap-1.5 sm:gap-2 transition-all whitespace-nowrap flex-shrink-0 ${
                activePage === 'emergencyPlanPage'
                  ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                  : 'text-slate-600 dark:text-zinc-300 hover:bg-slate-100/80 dark:hover:bg-zinc-800/80'
              }`}
            >
              <span className="material-symbols-outlined text-lg sm:text-xl">e911_emergency</span>
              <span>Emergency Plan</span>
            </button>
          </nav>

          {/* Action Controls Desktop */}
          {onRefreshData && (
            <div className="hidden xl:flex items-center gap-2 flex-shrink-0 ml-1">
              <button
                onClick={onRefreshData}
                className="p-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors shadow-sm"
                title="Refresh Telemetry Data"
              >
                <span className="material-symbols-outlined text-xl">refresh</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
