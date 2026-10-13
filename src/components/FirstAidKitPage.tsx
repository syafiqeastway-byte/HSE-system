import React, { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';
import { FirstAidKitTableData } from '../types';
import { fetchFirstAidKitTableData } from '../utils/gasBridge';
import { useAutoRefresh } from '../hooks/useAutoRefresh';
import { FirstAidKitFormModal } from './FirstAidKitFormModal';

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
  
  // Default active view is 'form' so when user clicks FIRST AID button, the usage form is immediately visible
  const [activeView, setActiveView] = useState<'form' | 'table'>('form');

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

  // AUTO-REFRESH: Automatically poll live First Aid Kit table in background
  useAutoRefresh(() => {
    loadData(true);
  }, { intervalMs: 60000 });

  // Filter rows based on search query
  const filteredRows = data.rows.filter((row) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase().trim();
    return row.some((cell) => (cell || '').toLowerCase().includes(query));
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
    const val = (cellVal || '').trim().toUpperCase();
    if (val === 'OK' || val === 'COMPLIANT' || val === 'YES' || val === 'GOOD' || val === 'INTACT' || val === 'SEALED' || val === 'SUFFICIENT') {
      return (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
          {cellVal}
        </span>
      );
    }
    if (val === 'NO' || val === 'NONE' || val === 'N/A' || val === 'NA' || val === '-') {
      return <span className="text-slate-400 font-medium text-[11px]">{cellVal}</span>;
    }
    if (val.includes('EXP') || val === 'ACTION' || val === 'EXPIRED' || val === 'REPLENISH' || val === 'DEFECT' || val === 'LOW') {
      return (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
          {cellVal}
        </span>
      );
    }
    return <span className="text-white text-xs font-medium">{cellVal}</span>;
  };

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="glass-card p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToHome}
            className="p-2 rounded-xl bg-slate-800 text-white hover:bg-slate-700 transition-colors border border-cyan-500/20 shadow-sm"
            title="Back to Dashboard"
          >
            <span className="material-symbols-outlined text-xl">arrow_back</span>
          </button>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-rose-400">medical_services</span>
              <span>FIRST AID KIT</span>
            </h2>
            <p className="text-xs text-slate-300">
              Post-Usage Log Form & First Aid Kit Inventory Register
            </p>
          </div>
        </div>

        {/* Top Tab Switcher & Quick Actions */}
        <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap sm:flex-nowrap">
          {/* View Mode Toggle: Form vs Table */}
          <div className="flex items-center p-1 bg-slate-950/80 rounded-xl border border-cyan-500/30 shadow-inner">
            <button
              onClick={() => setActiveView('form')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                activeView === 'form'
                  ? 'bg-cyan-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <span className="material-symbols-outlined text-base">edit_note</span>
              <span>Usage Form</span>
            </button>
            <button
              onClick={() => setActiveView('table')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                activeView === 'table'
                  ? 'bg-cyan-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <span className="material-symbols-outlined text-base">table_chart</span>
              <span>Kit Register Table</span>
            </button>
          </div>

          {/* Download Excel */}
          <button
            onClick={handleExportExcel}
            disabled={loading || data.rows.length === 0}
            className="px-3 py-1.5 rounded-xl bg-emerald-600/90 hover:bg-emerald-600 text-white text-xs font-bold flex items-center gap-1 border border-emerald-500/40 shadow-sm transition-all disabled:opacity-50 flex-shrink-0"
            title="Download Excel Spreadsheet"
          >
            <span className="material-symbols-outlined text-base">download</span>
            <span className="hidden md:inline">Export Excel</span>
            <span className="md:hidden">Excel</span>
          </button>

          {/* Refresh Button */}
          <button
            onClick={() => loadData(true)}
            disabled={isRefreshing}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white transition-colors border border-cyan-500/20 flex-shrink-0"
            title="Sync live from Google Sheets"
          >
            <span className={`material-symbols-outlined text-xl ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`}>
              sync
            </span>
          </button>
        </div>
      </div>

      {/* VIEW 1: POST-USAGE LOG FORM (DEFAULT ACTIVE) */}
      {activeView === 'form' && (
        <FirstAidKitFormModal
          isOpen={true}
          isInline={true}
          tableData={data}
          initialUnitId={selectedRowIndex !== null ? `row-${selectedRowIndex}` : undefined}
          onClose={() => setActiveView('table')}
        />
      )}

      {/* VIEW 2: RECORDS TABLE (ALL CELLS CENTERED, COMPACT FIT) */}
      {activeView === 'table' && (
        <div className="space-y-4">
          {/* Search bar & quick info */}
          <div className="glass-card p-3 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-base">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="SEARCH MODEL, PLATE, LOCATION, CODE..."
                className="w-full pl-9 pr-9 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5 rounded-full"
                  title="Clear search"
                >
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              )}
            </div>

            {selectedRowIndex !== null && data.rows[selectedRowIndex] && (
              <button
                onClick={() => setActiveView('form')}
                className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
              >
                <span className="material-symbols-outlined text-base">edit_note</span>
                <span>Log Item Usage for Selected Kit ({data.rows[selectedRowIndex][1]})</span>
              </button>
            )}
          </div>

          {loading ? (
            <div className="p-12 text-center flex flex-col items-center justify-center glass-card">
              <span className="material-symbols-outlined text-4xl text-cyan-400 animate-spin">sync</span>
              <span className="text-xs text-slate-400 mt-2">Loading First Aid Kit records...</span>
            </div>
          ) : (
            <div className="glass-card overflow-hidden">
              <div className="overflow-x-auto">
                {/* Table: All cells center-aligned, fit height & width */}
                <table className="w-full border-collapse border border-cyan-500/20 text-center text-xs whitespace-nowrap bg-transparent">
                  <thead className="bg-slate-950/95 text-cyan-400 border-b-2 border-cyan-500/40">
                    <tr className="h-8">
                      {data.headers.map((header, idx) => (
                        <th
                          key={idx}
                          className="py-1 px-2.5 font-bold uppercase tracking-wider border border-cyan-500/20 text-center text-xs text-cyan-400"
                        >
                          {header || `Column ${idx + 1}`}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cyan-500/10 text-xs text-white">
                    {filteredRows.length === 0 ? (
                      <tr className="h-8">
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
                            className={`h-8 transition-colors cursor-pointer select-none ${
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
                                  className="py-1 px-2 border border-cyan-500/20 font-medium text-white text-center leading-none"
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
      )}
    </div>
  );
};
