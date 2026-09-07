import React, { useEffect, useState } from 'react';
import { SOPRecord } from '../types';
import { fetchDynamicSOP } from '../utils/gasBridge';
import { formatToPreviewUrl } from '../utils/formatDriveUrl';

interface SOPPageProps {
  onBackToHome: () => void;
}

export const SOPPage: React.FC<SOPPageProps> = ({
  onBackToHome
}) => {
  const [records, setRecords] = useState<SOPRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);

  const loadSOP = (isBackground: boolean = false) => {
    let isMounted = true;
    if (isBackground) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
    }

    fetchDynamicSOP()
      .then((data) => {
        if (isMounted && data && data.length > 0) {
          setRecords(data);
        }
      })
      .catch((err) => {
        console.error('Error fetching SOP records:', err);
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
          setIsRefreshing(false);
        }
      });
    return () => { isMounted = false; };
  };

  useEffect(() => {
    return loadSOP(false);
  }, []);

  const filteredRecords = records.filter((r) => {
    if (!r) return false;
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      String(r.title || '').toLowerCase().includes(q) ||
      String(r.id || '').toLowerCase().includes(q) ||
      String((r as any).code || '').toLowerCase().includes(q) ||
      String((r as any).category || '').toLowerCase().includes(q) ||
      String(r.date || '').toLowerCase().includes(q) ||
      String(r.revDate || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="glass-card p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToHome}
            className="p-2 rounded-xl bg-slate-100 dark:bg-zinc-900 text-slate-600 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-800 transition-colors border border-transparent dark:border-zinc-800"
          >
            <span className="material-symbols-outlined text-xl">arrow_back</span>
          </button>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-blue-600">description</span>
              <span>Standard Operating Procedures (SOP)</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Warehouse Activity Procedures
            </p>
          </div>
        </div>
        
        {/* Search Bar & Refresh */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-72">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="SEARCH RECORDS..."
              className="w-full pl-9 pr-9 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded-full"
                title="Clear search"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            )}
          </div>
          <button
            onClick={() => loadSOP(true)}
            disabled={isRefreshing}
            className="p-2 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-slate-300 transition-colors border border-slate-200 dark:border-zinc-700 flex-shrink-0"
            title="Refresh from Google Sheets"
          >
            <span className={`material-symbols-outlined text-xl ${isRefreshing ? 'animate-spin text-blue-500' : ''}`}>
              sync
            </span>
          </button>
        </div>
      </div>

      {/* Records Table */}
      {loading ? (
        <div className="p-12 text-center flex flex-col items-center justify-center glass-card">
          <span className="material-symbols-outlined text-4xl text-blue-500 animate-spin">sync</span>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-slate-300 dark:border-zinc-700 text-left text-xs sm:text-sm whitespace-nowrap">
              <thead className="bg-slate-100 dark:bg-zinc-800/80 text-slate-800 dark:text-zinc-100 border-b border-slate-300 dark:border-zinc-700">
                <tr className="h-8">
                  <th className="w-14 py-1 px-3 font-bold uppercase tracking-wider border border-slate-300 dark:border-zinc-700 text-center text-xs">No</th>
                  <th className="min-w-[260px] py-1 px-3 font-bold uppercase tracking-wider border border-slate-300 dark:border-zinc-700 text-xs">Title</th>
                  <th className="w-28 py-1 px-3 font-bold uppercase tracking-wider border border-slate-300 dark:border-zinc-700 text-center text-xs">Date</th>
                  <th className="w-28 py-1 px-3 font-bold uppercase tracking-wider border border-slate-300 dark:border-zinc-700 text-center text-xs">Rev Date</th>
                  <th className="w-28 py-1 px-3 font-bold uppercase tracking-wider border border-slate-300 dark:border-zinc-700 text-center text-xs">Document</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300 dark:divide-zinc-700 text-xs sm:text-sm">
                {filteredRecords.length === 0 ? (
                  <tr className="h-9">
                    <td colSpan={5} className="py-4 text-center text-xs text-slate-400 border border-slate-300 dark:border-zinc-700">
                      No records found matching "{searchQuery}"
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((r) => {
                    const isSelected = selectedRowId === String(r.id);
                    return (
                      <tr 
                        key={r.id} 
                        onClick={() => setSelectedRowId(isSelected ? null : String(r.id))}
                        className={`h-9 transition-colors cursor-pointer ${
                          isSelected 
                            ? 'bg-slate-200/80 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold shadow-inner' 
                            : 'hover:bg-slate-100 dark:hover:bg-slate-800/80 active:bg-slate-200 dark:active:bg-slate-700/60'
                        }`}
                      >
                        <td className="py-1 px-3 font-medium text-slate-900 dark:text-slate-200 border border-slate-300 dark:border-zinc-700 text-center leading-none">
                          {r.id.split('-')[0]}
                        </td>
                        <td className="py-1 px-3 font-medium text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-zinc-700 leading-none">
                          {r.title}
                        </td>
                        <td className="py-1 px-3 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-zinc-700 text-center leading-none">
                          {r.date}
                        </td>
                        <td className="py-1 px-3 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-zinc-700 text-center leading-none">
                          {r.revDate}
                        </td>
                        <td className="py-1 px-3 text-center border border-slate-300 dark:border-zinc-700 leading-none">
                          {r.documentUrl && r.documentUrl !== 'Buka File' ? (
                            <a 
                              href={formatToPreviewUrl(r.documentUrl)} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center justify-center px-2.5 py-0.5 text-[11px] font-semibold bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500/20 rounded transition-colors leading-tight"
                            >
                              Open Doc
                            </a>
                          ) : (
                            <span className="text-xs text-slate-400 italic">No Document</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
