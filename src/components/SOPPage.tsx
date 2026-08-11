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
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    fetchDynamicSOP()
      .then((data) => {
        if (isMounted) {
          setRecords(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Error fetching SOP records:', err);
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
              <span className="material-symbols-outlined text-blue-600">description</span>
              <span>Standard Operating Procedures (SOP)</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Warehouse Activity Procedures
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
          <span className="material-symbols-outlined text-4xl text-blue-500 animate-spin">sync</span>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-100/50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-4 px-6 font-semibold">No</th>
                  <th className="py-4 px-6 font-semibold">Title</th>
                  <th className="py-4 px-6 font-semibold">Date</th>
                  <th className="py-4 px-6 font-semibold">Rev Date</th>
                  <th className="py-4 px-6 font-semibold text-center">Document</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-xs text-slate-400">
                      No records found matching "{searchQuery}"
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-100 dark:hover:bg-slate-800/80 active:bg-slate-200 dark:active:bg-slate-700/60 transition-colors cursor-pointer">
                      <td className="py-4 px-6 font-medium text-slate-900 dark:text-slate-200">
                        {r.id.split('-')[0]}
                      </td>
                      <td className="py-4 px-6 font-semibold text-slate-800 dark:text-slate-300">
                        {r.title}
                      </td>
                      <td className="py-4 px-6 font-mono text-slate-600 dark:text-slate-400 text-xs">
                        {r.date}
                      </td>
                      <td className="py-4 px-6 font-mono text-slate-600 dark:text-slate-400 text-xs">
                        {r.revDate}
                      </td>
                      <td className="py-4 px-6 text-center">
                        {r.documentUrl && r.documentUrl !== 'Buka File' ? (
                          <a 
                            href={formatToPreviewUrl(r.documentUrl)}
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors shadow-sm shadow-blue-500/20"
                          >
                            <span className="material-symbols-outlined text-sm">open_in_new</span>
                            Open Doc
                          </a>
                        ) : (
                          <span className="text-xs text-slate-400 italic">No Document</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
