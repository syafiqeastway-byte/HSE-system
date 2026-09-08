import React, { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';
import { FirstAidKitTableData } from '../types';
import { fetchFirstAidKitTableData } from '../utils/gasBridge';

interface FirstAidKitPageProps {
  onBackToHome: () => void;
}

export const FirstAidKitPage: React.FC<FirstAidKitPageProps> = ({ onBackToHome }) => {
  const [data, setData] = useState<FirstAidKitTableData>({
    headers: [],
    rows: [],
    rawRecords: []
  });
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRowIndex, setSelectedRowIndex] = useState<number | null>(null);

  const loadData = (isBackground: boolean = false) => {
    let isMounted = true;
    if (isBackground) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
    }

    fetchFirstAidKitTableData()
      .then((res) => {
        if (isMounted && res) {
          setData(res);
        }
      })
      .catch((err) => {
        console.warn('Error fetching First Aid Kit data:', err);
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

  // Filter rows based on search query
  const filteredRows = data.rows.filter((row) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase().trim();
    return row.some((cell) => cell.toLowerCase().includes(query));
  });

  // Export to Excel (.xlsx)
  const handleExportExcel = () => {
    if (data.headers.length === 0 || data.rows.length === 0) return;

    const exportData = data.rows.map((row) => {
      const obj: Record<string, string> = {};
      data.headers.forEach((header, index) => {
        obj[header || `Col_${index + 1}`] = row[index] || '';
      });
      return obj;
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "FIRST AID KIT");
    XLSX.writeFile(wb, "First_Aid_Kit_Register.xlsx");
  };

  const getCellBadge = (cellVal: string) => {
    const val = cellVal.trim().toUpperCase();
    if (val === 'OK' || val === 'COMPLIANT' || val === 'YES' || val === 'GOOD' || val === 'INTACT' || val === 'SEALED' || val === 'SUFFICIENT') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
          {cellVal}
        </span>
      );
    }
    if (val === 'NO' || val === 'NONE' || val === 'N/A' || val === '-') {
      return <span className="text-slate-400 font-medium text-xs">{cellVal}</span>;
    }
    if (val === 'ACTION' || val === 'EXPIRED' || val === 'REPLENISH' || val === 'DEFECT' || val === 'LOW') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
          {cellVal}
        </span>
      );
    }
    return <span className="text-white text-xs font-medium">{cellVal}</span>;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="glass-card p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
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
              <span className="material-symbols-outlined text-rose-400">medical_services</span>
              <span>FIRST AID KIT</span>
            </h2>
            <p className="text-xs text-white">
              First Aid Kit Register & Inspection Records
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap sm:flex-nowrap">
          {/* Search Input */}
          <div className="relative flex-1 sm:w-64">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="SEARCH RECORDS..."
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

          {/* Download Excel */}
          <button
            onClick={handleExportExcel}
            disabled={loading || data.rows.length === 0}
            className="px-3.5 py-2 rounded-xl bg-emerald-600/90 hover:bg-emerald-600 text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 border border-emerald-500/40 shadow-sm transition-all disabled:opacity-50 flex-shrink-0"
            title="Download Excel"
          >
            <span className="material-symbols-outlined text-base">download</span>
            <span className="hidden md:inline">Download Excel</span>
            <span className="md:hidden">Excel</span>
          </button>

          {/* Refresh Button */}
          <button
            onClick={() => loadData(true)}
            disabled={isRefreshing}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white transition-colors border border-cyan-500/20 flex-shrink-0"
            title="Refresh from Google Sheets"
          >
            <span className={`material-symbols-outlined text-xl ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`}>
              sync
            </span>
          </button>
        </div>
      </div>

      {/* Records Table */}
      {loading ? (
        <div className="p-12 text-center flex flex-col items-center justify-center glass-card">
          <span className="material-symbols-outlined text-4xl text-cyan-400 animate-spin">sync</span>
          <span className="text-xs text-slate-400 mt-2">Loading First Aid Kit records...</span>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-cyan-500/20 text-left text-xs sm:text-sm whitespace-nowrap bg-transparent">
              <thead className="bg-slate-950/95 text-cyan-400 border-b-2 border-cyan-500/40">
                <tr className="h-8">
                  {data.headers.map((header, idx) => (
                    <th
                      key={idx}
                      className="py-1.5 px-3 font-bold uppercase tracking-wider border border-cyan-500/20 text-xs text-cyan-400"
                    >
                      {header || `Column ${idx + 1}`}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-cyan-500/10 text-xs sm:text-sm text-white">
                {filteredRows.length === 0 ? (
                  <tr className="h-9">
                    <td
                      colSpan={data.headers.length || 1}
                      className="py-6 text-center text-xs text-white border border-cyan-500/20"
                    >
                      No records found matching "{searchQuery}"
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
                            : rIdx % 2 === 0
                            ? 'bg-slate-900/40 hover:bg-cyan-950/30'
                            : 'bg-slate-900/80 hover:bg-cyan-950/40'
                        }`}
                      >
                        {data.headers.map((_, cIdx) => {
                          const cellValue = row[cIdx] || '-';
                          return (
                            <td
                              key={cIdx}
                              className="py-1 px-3 border border-cyan-500/20 font-medium text-white max-w-xs truncate leading-none"
                              title={cellValue}
                            >
                              {getCellBadge(cellValue)}
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
    </div>
  );
};
