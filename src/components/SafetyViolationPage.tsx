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
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRowIndex, setSelectedRowIndex] = useState<number | null>(null);
  const [selectedSummaryRowIndex, setSelectedSummaryRowIndex] = useState<number | null>(null);

  const loadData = (isBackground: boolean = false) => {
    let isMounted = true;
    if (isBackground) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
    }
    
    Promise.all([
      fetchSafetyViolationScoring(),
      fetchSafetyViolationSummaryTable()
    ])
      .then(([scoringData, summaryData]) => {
        if (isMounted) {
          setTableData(scoringData);
          setSummaryTableData(summaryData);
        }
      })
      .catch((err) => {
        console.error('Error fetching safety violation scoring data:', err);
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
    return loadData(false);
  }, []);

  // First table (A3:N33)
  const headers = tableData.length > 0 ? tableData[0] : [];
  const rows = tableData.length > 1 ? tableData.slice(1) : [];

  // Second table (P3:T37)
  const summaryHeaders = summaryTableData.length > 0 ? summaryTableData[0] : [];
  const summaryRows = summaryTableData.length > 1 ? summaryTableData.slice(1) : [];

  // Filter rows based on search query
  const filteredRows = rows.filter((row) => {
    if (!Array.isArray(row)) return false;
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return row.some((cell) => String(cell || '').toLowerCase().includes(q));
  });

  const filteredSummaryRows = summaryRows.filter((row) => {
    if (!Array.isArray(row)) return false;
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return row.some((cell) => String(cell || '').toLowerCase().includes(q));
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="glass-card p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-t-4 border-red-500">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToHome}
            className="p-2 rounded-xl bg-slate-800 text-white hover:bg-slate-700 transition-colors border border-cyan-500/20"
            title="Back to Dashboard"
          >
            <span className="material-symbols-outlined text-xl">arrow_back</span>
          </button>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
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
              className="w-full pl-9 pr-9 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5 rounded-full"
                title="Clear search"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            )}
          </div>
          <button
            onClick={() => loadData(true)}
            disabled={isRefreshing}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white transition-colors border border-cyan-500/20 flex items-center justify-center flex-shrink-0"
            title="Refresh from Google Sheets"
          >
            <span className={`material-symbols-outlined text-xl ${isRefreshing ? 'animate-spin text-white' : ''}`}>
              sync
            </span>
          </button>
        </div>
      </div>

      {/* Primary Table Section (A3:N33) */}
      {loading ? (
        <div className="p-12 text-center flex flex-col items-center justify-center glass-card">
          <span className="material-symbols-outlined text-4xl text-white animate-spin mb-2">sync</span>
          <p className="text-xs text-white">Loading safety records from spreadsheet...</p>
        </div>
      ) : (
        <>
          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-700">
              {/* The table includes full column and row borders (grid lines) */}
              <table className="w-full border-collapse border border-cyan-500/20 text-left text-xs sm:text-sm whitespace-nowrap bg-transparent">
                <thead className="bg-slate-950/95 text-cyan-400 border-b-2 border-cyan-500/40">
                  <tr className="h-8">
                    {headers.map((hdr, idx) => (
                      <th
                        key={idx}
                        className="py-1 px-3 font-bold uppercase tracking-wider text-center border border-cyan-500/20 text-xs text-cyan-400"
                      >
                        {hdr || `Col ${idx + 1}`}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-cyan-500/10 text-xs sm:text-sm text-white">
                  {filteredRows.length === 0 ? (
                    <tr className="h-9">
                      <td
                        colSpan={Math.max(headers.length, 1)}
                        className="py-4 text-center text-xs text-white italic border border-cyan-500/20"
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
                          className={`h-9 transition-colors cursor-pointer select-none ${
                            isSelected
                              ? '!bg-cyan-600 !text-white font-bold [&>td]:!bg-cyan-600 [&>td]:!text-white [&>td]:!border-cyan-400/40 [&_*]:!text-white shadow-md'
                              : 'hover:bg-cyan-950/40 text-white'
                          }`}
                        >
                          {row.map((cell, cIdx) => {
                            // Find column indexes dynamically from headers
                            const headerText = (headers[cIdx] || '').toUpperCase();
                            const isPointCol = headerText.includes('POINT') || headerText.includes('DEMERIT');
                            const isCodeCol = headerText === 'CODE';
                            const isNoCol = headerText === 'NO' || headerText === 'NO.';
                            const isDateCol = headerText.includes('DATE');
                            const isIdCol = headerText.includes('ID') || headerText.includes('EMPLOYEE');
                            const isStatusCol = headerText.includes('STATUS');

                            const isCenterCol = isNoCol || isIdCol || isCodeCol || isPointCol || isDateCol;
                            const isDemeritCol = isPointCol;
                            
                            return (
                              <td
                                key={cIdx}
                                className={`py-1.5 px-3 border border-cyan-500/20 leading-normal text-xs sm:text-sm text-white ${
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
                                          <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-800 text-white border border-slate-700 font-bold font-mono text-[11px] leading-tight">
                                            {cellStr}
                                          </span>
                                        );
                                      } else {
                                        return (
                                          <span className="font-mono font-medium text-white text-xs">
                                            {cellStr}
                                          </span>
                                        );
                                      }
                                    }
                                    return (
                                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold leading-tight ${
                                        cellStr.toLowerCase() === 'closed'
                                          ? 'bg-slate-800 text-emerald-400 border border-emerald-500/30'
                                          : 'bg-slate-800 text-amber-400 border border-amber-500/30'
                                      }`}>
                                        {cellStr || '-'}
                                      </span>
                                    );
                                  })()
                                ) : isIdCol ? (
                                  <span className="font-mono font-medium text-white">
                                    {(() => {
                                      const val = (cell || '').trim();
                                      if (!val || val === '-') return '-';
                                      if (val.length >= 3) {
                                        return '***' + val.slice(3);
                                      }
                                      return '***';
                                    })()}
                                  </span>
                                ) : isDemeritCol ? (
                                  <span className="font-mono font-bold text-red-400 text-xs bg-slate-800 px-2 py-0.5 rounded border border-red-500/30">
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
            <div className="p-3 bg-slate-900/60 border-t border-cyan-500/20 text-[9px] sm:text-[10px] text-white flex justify-end">
              <span className="flex items-center gap-1">
                <span className="inline-block w-2.5 h-2.5 bg-red-500/20 rounded border border-red-500"></span>
                Click a row to highlight
              </span>
            </div>
          </div>

          {/* Secondary Table Section (DEMERIT K3:O37) */}
          {summaryTableData.length > 0 && (
            <div className="glass-card overflow-hidden mt-6">
              <div className="p-4 bg-slate-900/80 border-b border-cyan-500/20 flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                  <span className="material-symbols-outlined text-amber-400 text-base">table_chart</span>
                  <span>Safety Violation Summary & Demerit Matrix</span>
                </h3>
              </div>
              <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-700">
                <table className="w-full border-collapse border border-cyan-500/20 text-left text-xs sm:text-sm whitespace-nowrap bg-transparent">
                  <thead className="bg-slate-950/95 text-cyan-400 border-b-2 border-cyan-500/40">
                    <tr className="h-8">
                      {summaryHeaders.map((hdr, idx) => (
                        <th
                          key={idx}
                          className="py-2 px-3 font-bold uppercase tracking-wider text-center border border-cyan-500/20 text-xs sm:text-sm text-cyan-400"
                        >
                          {hdr || `Col ${idx + 1}`}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cyan-500/10 text-xs sm:text-sm text-white">
                    {filteredSummaryRows.length === 0 ? (
                      <tr className="h-9">
                        <td
                          colSpan={Math.max(summaryHeaders.length, 1)}
                          className="py-4 text-center text-xs text-white italic border border-cyan-500/20"
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
                            className={`h-9 transition-colors cursor-pointer select-none ${
                              isSelected
                                ? '!bg-cyan-600 !text-white font-bold [&>td]:!bg-cyan-600 [&>td]:!text-white [&>td]:!border-cyan-400/40 [&_*]:!text-white shadow-md'
                                : 'hover:bg-cyan-950/40 text-white'
                            }`}
                          >
                            {row.map((cell, cIdx) => {
                              const headerTitle = (summaryHeaders[cIdx] || '').toUpperCase();
                              const isCodeCol = headerTitle.includes('KOD') || headerTitle.includes('CODE');
                              const isCategoryCol = headerTitle.includes('KATEGORI') || headerTitle.includes('CATEGORY');
                              const isDemeritCol = headerTitle.includes('DEMERIT') || headerTitle.includes('POINT');
                              const isCenterCol = isCodeCol || isDemeritCol || isCategoryCol;

                              const cellTrimmed = (cell || '').trim();

                              return (
                                <td
                                  key={cIdx}
                                  className={`py-1.5 px-3 border border-cyan-500/20 leading-normal text-xs sm:text-sm text-white ${
                                    isCenterCol ? 'text-center' : 'text-left'
                                  }`}
                                >
                                  {isCodeCol ? (
                                    <span className="font-mono font-bold text-white bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                                      {cellTrimmed || '-'}
                                    </span>
                                  ) : isCategoryCol ? (
                                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold uppercase ${
                                      cellTrimmed.toLowerCase().includes('kritikal') || cellTrimmed.toLowerCase().includes('critical')
                                        ? 'bg-rose-950/60 text-rose-300 border border-rose-500/30'
                                        : cellTrimmed.toLowerCase().includes('serius') || cellTrimmed.toLowerCase().includes('serious')
                                        ? 'bg-orange-950/60 text-orange-300 border border-orange-500/30'
                                        : cellTrimmed.toLowerCase().includes('sederhana') || cellTrimmed.toLowerCase().includes('moderate')
                                        ? 'bg-amber-950/60 text-amber-300 border border-amber-500/30'
                                        : 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/30'
                                    }`}>
                                      {cellTrimmed || '-'}
                                    </span>
                                  ) : isDemeritCol ? (
                                    <span className="font-mono font-bold text-red-400 text-xs bg-slate-800 px-2 py-0.5 rounded border border-red-500/30">
                                      {cellTrimmed || '-'}
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
            </div>
          )}
        </>
      )}
    </div>
  );
};
