import React, { useState, useRef, useEffect } from 'react';
import { MOCK_HIRARCS } from '../data/mockData';
import { HIRARCItem, DocumentViewContext } from '../types';

interface HIRARCDropdownProps {
  onSelectHIRARC: (doc: DocumentViewContext) => void;
}

export const HIRARCDropdown: React.FC<HIRARCDropdownProps> = ({ onSelectHIRARC }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
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

  const filteredHIRARCs = MOCK_HIRARCS.filter(
    (item) =>
      item.activityName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (item: HIRARCItem) => {
    onSelectHIRARC({
      title: `${item.code} - ${item.activityName}`,
      subtitle: `Location: ${item.location} | Initial Risk: ${item.initialRisk} → Residual Risk: ${item.residualRisk}`,
      url: item.documentUrl,
      type: 'sheet'
    });
    setIsOpen(false);
  };

  const getRiskBadgeClass = (risk: string) => {
    switch (risk) {
      case 'Extreme':
        return 'bg-red-100 text-red-700 dark:bg-red-950/80 dark:text-red-300 border-red-300 dark:border-red-800';
      case 'High':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300 border-amber-300 dark:border-amber-800';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/80 dark:text-yellow-300 border-yellow-300 dark:border-yellow-800';
      default:
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800';
    }
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100 font-semibold text-xs sm:text-sm flex items-center justify-between hover:border-amber-500 dark:hover:border-amber-400 transition-all shadow-sm group min-h-[44px]"
      >
        <div className="flex items-center gap-2.5 truncate">
          <span className="material-symbols-outlined text-amber-500 text-xl">warning</span>
          <span className="truncate">HIRARC Risk Evaluation Matrices (25 Items)</span>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 text-[11px] font-bold">
            25 Items
          </span>
          <span className="material-symbols-outlined text-slate-400 group-hover:text-amber-500 transition-transform duration-200">
            {isOpen ? 'expand_less' : 'expand_more'}
          </span>
        </div>
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-2 z-40 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          
          <div className="p-3 border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950/80">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
                search
              </span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search 25 HIRARCs by activity or location..."
                className="w-full pl-9 pr-9 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs sm:text-sm text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                autoFocus
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded-full"
                  title="Clear search"
                >
                  <span className="material-symbols-outlined text-base">close</span>
                </button>
              )}
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-zinc-800/80">
            {filteredHIRARCs.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500 dark:text-zinc-400">
                No HIRARC evaluation found matching "{searchTerm}"
              </div>
            ) : (
              filteredHIRARCs.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  className="w-full text-left p-3 hover:bg-amber-50/50 dark:hover:bg-zinc-800/80 transition-colors flex items-start justify-between gap-3 group"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 text-[9px] sm:text-[10px] font-mono font-bold">
                        {item.code}
                      </span>
                      <span className="text-xs font-bold text-slate-800 dark:text-zinc-100 group-hover:text-amber-600 dark:group-hover:text-amber-400">
                        {item.activityName}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5 line-clamp-1">
                      Location: {item.location} • Control: {item.controlMeasures}
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className={`text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-md border ${getRiskBadgeClass(item.initialRisk)}`}>
                      {item.initialRisk}
                    </span>
                    <span className="text-[9px] text-slate-400">
                      → Residual: {item.residualRisk}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>

        </div>
      )}
    </div>
  );
};
