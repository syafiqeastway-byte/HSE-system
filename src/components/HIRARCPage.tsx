import React, { useEffect, useState } from 'react';
import { HIRARCRecord } from '../types';
import { fetchDynamicHIRARC } from '../utils/gasBridge';
import { formatToPreviewUrl } from '../utils/formatDriveUrl';

interface HIRARCPageProps {
  onBackToHome: () => void;
}

export const HIRARCPage: React.FC<HIRARCPageProps> = ({
  onBackToHome
}) => {
  const [records, setRecords] = useState<HIRARCRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    fetchDynamicHIRARC()
      .then((data) => {
        if (isMounted) {
          setRecords(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Error fetching HIRARC records:', err);
        if (isMounted) setLoading(false);
      });
    return () => { isMounted = false; };
  }, []);

  const filteredRecords = records.filter(
    (r) =>
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.id.toString().includes(searchQuery.toLowerCase())
  );

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
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-amber-500">assignment_turned_in</span>
              <span>HIRARC</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Hazard Identification, Risk Assessment and Risk Control
            </p>
          </div>
        </div>
        
        {/* Search Bar */}
        <div className="relative w-full sm:w-72">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="SEARCH RECORDS..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Records Table */}
      {loading ? (
        <div className="p-12 text-center flex flex-col items-center justify-center glass-card">
          <span className="material-symbols-outlined text-4xl text-amber-500 animate-spin">sync</span>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-slate-300 dark:border-zinc-700 text-left text-xs sm:text-sm whitespace-nowrap">
              <thead className="bg-slate-100 dark:bg-zinc-800/80 text-slate-800 dark:text-zinc-100 border-b border-slate-300 dark:border-zinc-700">
                <tr>
                  <th className="py-3 px-4 font-extrabold uppercase tracking-wider border border-slate-300 dark:border-zinc-700">No</th>
                  <th className="py-3 px-4 font-extrabold uppercase tracking-wider border border-slate-300 dark:border-zinc-700">Title</th>
                  <th className="py-3 px-4 font-extrabold uppercase tracking-wider border border-slate-300 dark:border-zinc-700">Date</th>
                  <th className="py-3 px-4 font-extrabold uppercase tracking-wider border border-slate-300 dark:border-zinc-700">Rev Date</th>
                  <th className="py-3 px-4 font-extrabold uppercase tracking-wider border border-slate-300 dark:border-zinc-700 text-center">Document</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300 dark:divide-zinc-700">
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-xs text-slate-400 border border-slate-300 dark:border-zinc-700">
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
                        className={`transition-colors cursor-pointer ${
                          isSelected 
                            ? 'bg-slate-200/80 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold shadow-inner' 
                            : 'hover:bg-slate-100 dark:hover:bg-slate-800/80 active:bg-slate-200 dark:active:bg-slate-700/60'
                        }`}
                      >
                        <td className="py-3 px-4 font-medium text-slate-900 dark:text-slate-200 border border-slate-300 dark:border-zinc-700">
                          {r.id}
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-300 border border-slate-300 dark:border-zinc-700">
                          {r.title}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-400 text-xs sm:text-sm border border-slate-300 dark:border-zinc-700">
                          {r.date}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-400 text-xs sm:text-sm border border-slate-300 dark:border-zinc-700">
                          {r.revDate}
                        </td>
                        <td className="py-3 px-4 text-center border border-slate-300 dark:border-zinc-700">
                          {r.documentUrl ? (
                            <a 
                              href={formatToPreviewUrl(r.documentUrl)}
                              target="_blank" 
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center justify-center gap-1 px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-md text-[11px] font-bold transition-colors shadow-sm shadow-amber-500/20"
                            >
                              <span className="material-symbols-outlined text-[13px]">open_in_new</span>
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
