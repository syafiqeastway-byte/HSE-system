import React, { useEffect, useState } from 'react';
import { fetchSafetyViolationScoring, fetchSafetyViolationSummaryTable } from '../utils/gasBridge';

interface SafetyViolationPageProps {
  onBackToHome: () => void;
}

export const SafetyViolationPage: React.FC<SafetyViolationPageProps> = ({
  onBackToHome
}) => {
  const [tableData, setTableData] = useState<string[][]>([]);
  const [summaryTableData, setSummaryTableData] = useState<string[][]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRowIndex, setSelectedRowIndex] = useState<number | null>(null);
  const [selectedSummaryRowIndex, setSelectedSummaryRowIndex] = useState<number | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    
    Promise.all([
      fetchSafetyViolationScoring(),
      fetchSafetyViolationSummaryTable()
    ])
      .then(([scoringData, summaryData]) => {
        if (isMounted) {
          setTableData(scoringData);
          setSummaryTableData(summaryData);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Error fetching safety violation scoring data:', err);
        if (isMounted) setLoading(false);
      });

    return () => { isMounted = false; };
  }, []);

  // First table (A3:N33)
  const headers = tableData.length > 0 ? tableData[0] : [];
  const rows = tableData.length > 1 ? tableData.slice(1) : [];

  // Second table (P3:T37)
  const summaryHeaders = summaryTableData.length > 0 ? summaryTableData[0] : [];
  const summaryRows = summaryTableData.length > 1 ? summaryTableData.slice(1) : [];

  // Filter rows based on search query
  const filteredRows = rows.filter((row) =>
    row.some((cell) => cell.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredSummaryRows = summaryRows.filter((row) =>
    row.some((cell) => cell.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="glass-card p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-t-4 border-red-500">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToHome}
            className="p-2 rounded-xl bg-slate-100 dark:bg-zinc-900 text-slate-600 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-800 transition-colors border border-transparent dark:border-zinc-800"
            title="Back to Dashboard"
          >
            <span className="material-symbols-outlined text-xl">arrow_back</span>
          </button>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-red-500">gavel</span>
              <span>SAFETY VIOLATION SCORING SYSTEM</span>
            </h2>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
          {/* Search Bar */}
          <div className="relative min-w-[240px]">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search violations..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Primary Table Section (A3:N33) */}
      {loading ? (
        <div className="p-12 text-center flex flex-col items-center justify-center glass-card">
          <span className="material-symbols-outlined text-4xl text-red-500 animate-spin mb-2">sync</span>
          <p className="text-xs text-slate-500">Loading safety records from spreadsheet...</p>
        </div>
      ) : (
        <>
          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-zinc-700">
              {/* The table includes full column and row borders (grid lines) */}
              <table className="w-full border-collapse border border-slate-300 dark:border-zinc-700 text-left text-xs sm:text-sm whitespace-nowrap">
                <thead className="bg-slate-100 dark:bg-zinc-800/80 text-slate-800 dark:text-zinc-100 border-b border-slate-300 dark:border-zinc-700">
                  <tr>
                    {headers.map((hdr, idx) => (
                      <th
                        key={idx}
                        className="py-3 px-4 font-extrabold uppercase tracking-wider text-center border border-slate-300 dark:border-zinc-700"
                      >
                        {hdr || `Col ${idx + 1}`}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300 dark:divide-zinc-700">
                  {filteredRows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={Math.max(headers.length, 1)}
                        className="py-12 text-center text-xs text-slate-400 italic border border-slate-300 dark:border-zinc-700"
                      >
                        No safety violation records found matching "{searchQuery}"
                      </td>
                    </tr>
                  ) : (
                    filteredRows.map((row, rIdx) => {
                      const isSelected = selectedRowIndex === rIdx;
                      return (
                        <tr
                          key={rIdx}
                          onClick={() => setSelectedRowIndex(isSelected ? null : rIdx)}
                          className={`transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-red-50/80 dark:bg-red-950/30 text-slate-900 dark:text-white font-semibold shadow-inner'
                              : 'hover:bg-slate-50 dark:hover:bg-zinc-800/50 text-slate-700 dark:text-zinc-300'
                          }`}
                        >
                          {row.map((cell, cIdx) => {
                            // Center align No, Date, Demerit, Status, and Offence columns for better visual aesthetics
                            const isCenterCol = [0, 1, 7, 8, 9, 10, 13].includes(cIdx);
                            
                            // Custom style tags for status
                            const isStatusCol = cIdx === 13;
                            const isDemeritCol = cIdx === 10;
                            
                            return (
                              <td
                                key={cIdx}
                                className={`py-2.5 px-4 border border-slate-300 dark:border-zinc-700 ${
                                  isCenterCol ? 'text-center' : 'text-left'
                                }`}
                              >
                                {isStatusCol ? (
                                  (() => {
                                    const cellStr = (cell || '').trim();
                                    const isNum = cellStr !== '' && !isNaN(Number(cellStr));
                                    if (isNum) {
                                      const numVal = Number(cellStr);
                                      if (numVal > 0) {
                                        return (
                                          <span className="inline-flex items-center px-2.5 py-0.5 rounded bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-200 font-extrabold font-mono">
                                            {cellStr}
                                          </span>
                                        );
                                      } else {
                                        return (
                                          <span className="font-mono font-bold text-slate-900 dark:text-zinc-100">
                                            {cellStr}
                                          </span>
                                        );
                                      }
                                    }
                                    return (
                                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-extrabold ${
                                        cellStr.toLowerCase() === 'closed'
                                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/55 dark:text-emerald-400'
                                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950/55 dark:text-amber-400'
                                      }`}>
                                        {cellStr || '-'}
                                      </span>
                                    );
                                  })()
                                ) : isDemeritCol ? (
                                  <span className="font-mono font-bold text-red-600 dark:text-red-400 text-sm">
                                    {cell && cell.trim() !== '' && cell !== '-' ? cell : '-'}
                                  </span>
                                ) : (
                                  cell || '-'
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-zinc-900/60 border-t border-slate-200 dark:border-zinc-800 text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400 flex justify-end">
              <span className="flex items-center gap-1">
                <span className="inline-block w-2.5 h-2.5 bg-red-500/20 rounded border border-red-500"></span>
                Click a row to highlight
              </span>
            </div>
          </div>

          {/* Secondary Table Section (P3:T37) */}
          {summaryTableData.length > 0 && (
            <div className="glass-card overflow-hidden mt-6">
              <div className="p-4 bg-slate-50 dark:bg-zinc-900/80 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <span className="material-symbols-outlined text-amber-500 text-base">table_chart</span>
                  <span>Safety Violation Summary & Demerit Matrix </span>
                </h3>
              </div>
              <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-zinc-700">
                <table className="w-full border-collapse border border-slate-300 dark:border-zinc-700 text-left text-xs sm:text-sm whitespace-nowrap">
                  <thead className="bg-slate-100 dark:bg-zinc-800/80 text-slate-800 dark:text-zinc-100 border-b border-slate-300 dark:border-zinc-700">
                    <tr>
                      {summaryHeaders.map((hdr, idx) => (
                        <th
                          key={idx}
                          className="py-3 px-4 font-extrabold uppercase tracking-wider text-center border border-slate-300 dark:border-zinc-700"
                        >
                          {hdr || `Col ${idx + 1}`}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-300 dark:divide-zinc-700">
                    {filteredSummaryRows.length === 0 ? (
                      <tr>
                        <td
                          colSpan={Math.max(summaryHeaders.length, 1)}
                          className="py-8 text-center text-xs text-slate-400 italic border border-slate-300 dark:border-zinc-700"
                        >
                          No summary records found matching "{searchQuery}"
                        </td>
                      </tr>
                    ) : (
                      filteredSummaryRows.map((row, rIdx) => {
                        const isSelected = selectedSummaryRowIndex === rIdx;
                        return (
                          <tr
                            key={rIdx}
                            onClick={() => setSelectedSummaryRowIndex(isSelected ? null : rIdx)}
                            className={`transition-colors cursor-pointer ${
                              isSelected
                                ? 'bg-amber-50/80 dark:bg-amber-950/30 text-slate-900 dark:text-white font-semibold shadow-inner'
                                : 'hover:bg-slate-50 dark:hover:bg-zinc-800/50 text-slate-700 dark:text-zinc-300'
                            }`}
                          >
                            {row.map((cell, cIdx) => (
                              <td
                                key={cIdx}
                                className={`py-2.5 px-4 border border-slate-300 dark:border-zinc-700 ${
                                  cIdx === 0 || cIdx === 2 || cIdx === 3 ? 'text-center font-semibold' : 'text-left'
                                }`}
                              >
                                {cell || '-'}
                              </td>
                            ))}
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
