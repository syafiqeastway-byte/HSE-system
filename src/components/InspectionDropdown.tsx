import React, { useState, useRef, useEffect } from 'react';
import { InspectionRecord } from '../types';
import { fetchInspectionData } from '../utils/gasBridge';

interface InspectionDropdownProps {
  onOpenInspectionModal: (type: 'Workplace' | 'First Aid Box' | 'Fire Extinguisher' | 'All') => void;
}

export const InspectionDropdown: React.FC<InspectionDropdownProps> = ({ onOpenInspectionModal }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (type: 'Workplace' | 'First Aid Box' | 'Fire Extinguisher' | 'All') => {
    onOpenInspectionModal(type);
    setIsOpen(false);
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100 font-semibold text-xs sm:text-sm flex items-center justify-between hover:border-emerald-500 dark:hover:border-emerald-400 transition-all shadow-sm group min-h-[44px]"
      >
        <div className="flex items-center gap-2.5 truncate">
          <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400 text-xl">fact_check</span>
          <span className="truncate">Inspection Records & Audits</span>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-300 text-[11px] font-bold">
            Audit Logs
          </span>
          <span className="material-symbols-outlined text-slate-400 group-hover:text-emerald-500 transition-transform duration-200">
            {isOpen ? 'expand_less' : 'expand_more'}
          </span>
        </div>
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-2 z-40 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 divide-y divide-slate-100 dark:divide-zinc-800">
          
          <button
            onClick={() => handleSelect('Workplace')}
            className="w-full text-left p-3.5 hover:bg-emerald-50/50 dark:hover:bg-zinc-800/80 transition-colors flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400">factory</span>
              <div>
                <div className="text-xs font-bold text-slate-800 dark:text-zinc-100 group-hover:text-emerald-600">
                  Workplace & Workshop Inspection Records
                </div>
                <div className="text-[11px] text-slate-500 dark:text-zinc-400">
                  Audit checklists for Workshop A, B, Fabrication Yard & Stores
                </div>
              </div>
            </div>
            <span className="material-symbols-outlined text-slate-400 text-lg">chevron_right</span>
          </button>

          <button
            onClick={() => handleSelect('First Aid Box')}
            className="w-full text-left p-3.5 hover:bg-emerald-50/50 dark:hover:bg-zinc-800/80 transition-colors flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-red-500">medical_services</span>
              <div>
                <div className="text-xs font-bold text-slate-800 dark:text-zinc-100 group-hover:text-emerald-600">
                  First Aid Box Inspection & Replenishment Logs
                </div>
                <div className="text-[11px] text-slate-500 dark:text-zinc-400">
                  Monthly audit of 12 first aid boxes & emergency supplies
                </div>
              </div>
            </div>
            <span className="material-symbols-outlined text-slate-400 text-lg">chevron_right</span>
          </button>

          <button
            onClick={() => handleSelect('Fire Extinguisher')}
            className="w-full text-left p-3.5 hover:bg-emerald-50/50 dark:hover:bg-zinc-800/80 transition-colors flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-amber-500">fire_extinguisher</span>
              <div>
                <div className="text-xs font-bold text-slate-800 dark:text-zinc-100 group-hover:text-emerald-600">
                  Fire Extinguisher & Hydrant Audit Records
                </div>
                <div className="text-[11px] text-slate-500 dark:text-zinc-400">
                  Pressure gauge status, hose tags, and BOMBA certification logs
                </div>
              </div>
            </div>
            <span className="material-symbols-outlined text-slate-400 text-lg">chevron_right</span>
          </button>

          <button
            onClick={() => handleSelect('All')}
            className="w-full text-left p-3 bg-slate-50 dark:bg-slate-900/40 hover:bg-slate-100 dark:hover:bg-slate-700/80 transition-colors flex items-center justify-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400"
          >
            <span className="material-symbols-outlined text-base">table_view</span>
            <span>View All Inspection Records Combined</span>
          </button>

        </div>
      )}
    </div>
  );
};
