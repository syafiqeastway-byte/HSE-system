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
    <header className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-4 sm:p-5 mb-6 shadow-xl transition-all">
      <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
        
        {/* Company Title & Brand Icon */}
        <div className="flex items-center gap-3.5 w-full lg:w-auto justify-between lg:justify-start">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center flex-shrink-0 overflow-hidden">
              <img
                src="https://lh3.googleusercontent.com/d/1Nwa1uSh2j7JVDKnnJBI-Ttamib2FToVp"
                alt="EASTWAY Logo"
                className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-extrabold tracking-tight text-slate-900 dark:text-white uppercase leading-tight">
                EASTWAY ENGINEERING MYSAFETY
              </h1>
              <p className="text-[10px] text-slate-500 dark:text-zinc-400 font-bold tracking-[0.15em] uppercase">
                HSE Integrated Management System
              </p>
            </div>
          </div>

          {/* Theme Toggle Button for Mobile */}
          <button
            onClick={toggleTheme}
            className="lg:hidden px-3 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-100/80 dark:bg-zinc-900 text-slate-700 dark:text-zinc-200 hover:bg-slate-200 dark:hover:bg-zinc-800 transition-colors flex items-center gap-2"
            title="Toggle Light/Dark Theme"
          >
            <span className={`material-symbols-outlined text-lg ${isDarkMode ? 'text-amber-400' : 'text-blue-600'}`}>
              {isDarkMode ? 'dark_mode' : 'light_mode'}
            </span>
            <div className="text-left leading-none">
              <div className="text-[10px] font-black uppercase text-slate-900 dark:text-white tracking-wide">
                {isDarkMode ? 'Dark Mode' : 'Light Mode'}
              </div>
            </div>
          </button>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto w-full lg:w-auto pb-1 lg:pb-0 scrollbar-none">
          <button
            onClick={() => setActivePage('homePage')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all whitespace-nowrap ${
              activePage === 'homePage'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-600 dark:text-zinc-300 hover:bg-slate-100/80 dark:hover:bg-zinc-800/80'
            }`}
          >
            <span className="material-symbols-outlined text-lg">dashboard</span>
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => setActivePage('analyticsPage')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all whitespace-nowrap ${
              activePage === 'analyticsPage'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-600 dark:text-zinc-300 hover:bg-slate-100/80 dark:hover:bg-zinc-800/80'
            }`}
          >
            <span className="material-symbols-outlined text-lg">analytics</span>
            <span>Analytics</span>
          </button>

          <button
            onClick={() => setActivePage('minuteMeetingPage')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all whitespace-nowrap ${
              activePage === 'minuteMeetingPage'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-600 dark:text-zinc-300 hover:bg-slate-100/80 dark:hover:bg-zinc-800/80'
            }`}
          >
            <span className="material-symbols-outlined text-lg">description</span>
            <span>Meeting Minutes</span>
          </button>

          <button
            onClick={() => setActivePage('emergencyPlanPage')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all whitespace-nowrap ${
              activePage === 'emergencyPlanPage'
                ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                : 'text-slate-600 dark:text-zinc-300 hover:bg-slate-100/80 dark:hover:bg-zinc-800/80'
            }`}
          >
            <span className="material-symbols-outlined text-lg">e911_emergency</span>
            <span>Emergency Plan</span>
          </button>
        </nav>

        {/* Action Controls Top Right Desktop */}
        <div className="hidden lg:flex items-center gap-2.5">
          {/* Refresh Data */}
          {onRefreshData && (
            <button
              onClick={onRefreshData}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors shadow-sm"
              title="Refresh Telemetry Data"
            >
              <span className="material-symbols-outlined text-xl">refresh</span>
            </button>
          )}

          {/* Light / Dark Mode Toggle Button with Small Text */}
          <button
            onClick={toggleTheme}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all shadow-sm flex items-center gap-2 group"
            title="Toggle Light/Dark Theme"
          >
            <span className={`material-symbols-outlined text-xl group-hover:scale-110 transition-transform ${isDarkMode ? 'text-amber-400' : 'text-blue-600'}`}>
              {isDarkMode ? 'dark_mode' : 'light_mode'}
            </span>
            <div className="text-left leading-none">
              <div className="text-[11px] font-black uppercase text-slate-900 dark:text-white tracking-wide">
                {isDarkMode ? 'Dark Mode' : 'Light Mode'}
              </div>
              <div className="text-[9px] font-medium text-slate-500 dark:text-zinc-400 mt-0.5">
                {isDarkMode ? 'Dark Theme' : 'Light Theme'}
              </div>
            </div>
          </button>
        </div>

      </div>
    </header>
  );
};
