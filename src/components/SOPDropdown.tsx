import React, { useState, useRef, useEffect } from 'react';
import { MOCK_SOPS } from '../data/mockData';
import { SOPItem, DocumentViewContext } from '../types';

interface SOPDropdownProps {
  onSelectSOP: (doc: DocumentViewContext) => void;
}

export const SOPDropdown: React.FC<SOPDropdownProps> = ({ onSelectSOP }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Click Outside Handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredSOPs = MOCK_SOPS.filter(
    (sop) =>
      sop.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sop.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sop.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (sop: SOPItem) => {
    onSelectSOP({
      title: `${sop.code} - ${sop.title}`,
      subtitle: `Category: ${sop.category} | Revision Date: ${sop.revisionDate}`,
      url: sop.documentUrl,
      type: 'doc'
    });
    setIsOpen(false);
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100 font-semibold text-xs sm:text-sm flex items-center justify-between hover:border-blue-500 dark:hover:border-blue-400 transition-all shadow-sm group min-h-[44px]"
      >
        <div className="flex items-center gap-2.5 truncate">
          <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 text-xl">description</span>
          <span className="truncate">Standard Operating Procedures (30 SOPs in English)</span>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-300 text-[11px] font-bold">
            30 Items
          </span>
          <span className="material-symbols-outlined text-slate-400 group-hover:text-blue-500 transition-transform duration-200">
            {isOpen ? 'expand_less' : 'expand_more'}
          </span>
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-2 z-40 rounded-2xl bg-slate-900 border border-cyan-500/30 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          
          {/* Real-time Search Header */}
          <div className="p-3 border-b border-cyan-500/20 bg-slate-950/80">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
                search
              </span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search 30 SOPs by title or code..."
                className="w-full pl-9 pr-9 py-2 rounded-xl bg-slate-800 border border-cyan-500/20 text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5 rounded-full"
                  title="Clear search"
                >
                  <span className="material-symbols-outlined text-base">close</span>
                </button>
              )}
            </div>
          </div>

          {/* SOP Items List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-cyan-500/10">
            {filteredSOPs.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400">
                No SOP found matching "{searchTerm}"
              </div>
            ) : (
              filteredSOPs.map((sop) => (
                <button
                  key={sop.id}
                  onClick={() => handleSelect(sop)}
                  className="w-full text-left p-3 hover:bg-cyan-950/40 transition-colors flex items-start justify-between gap-3 group"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/20 text-cyan-200 text-[9px] sm:text-[10px] font-mono font-bold">
                        {sop.code}
                      </span>
                      <span className="text-xs font-bold text-white group-hover:text-blue-400">
                        {sop.title}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                      {sop.description}
                    </p>
                  </div>
                  <span className="text-[9px] sm:text-[10px] font-semibold text-cyan-300 whitespace-nowrap self-center px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/20">
                    {sop.category}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
