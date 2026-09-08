import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { FirstAidKitTableData } from '../types';
import { fetchFirstAidKitTableData } from '../utils/gasBridge';

interface FirstAidKitModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FirstAidKitModal: React.FC<FirstAidKitModalProps> = ({ isOpen, onClose }) => {
  const [data, setData] = useState<FirstAidKitTableData>({
    headers: [],
    rows: [],
    rawRecords: []
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRowIndex, setSelectedRowIndex] = useState<number | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetchFirstAidKitTableData();
      setData(res);
    } catch (err) {
      console.warn('Error fetching First Aid Kit data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

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
    return <span className="text-slate-200 text-xs font-medium">{cellVal}</span>;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="glass-card max-w-[96vw] xl:max-w-7xl w-full max-h-[94vh] overflow-hidden flex flex-col shadow-2xl border border-cyan-500/30 bg-slate-900/95">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-cyan-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 shadow-sm">
              <span className="material-symbols-outlined text-2xl">medical_services</span>
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-cyan-400 tracking-wide uppercase">
                FIRST AID KIT REGISTER & INSPECTION
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            {/* Download Excel Button */}
            <button
              onClick={handleExportExcel}
              disabled={loading || data.rows.length === 0}
              className="px-3.5 py-2 rounded-xl bg-emerald-600/90 hover:bg-emerald-600 text-white text-xs font-bold flex items-center gap-1.5 border border-emerald-500/40 shadow-sm transition-all disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-sm">download</span>
              <span>Download Excel</span>
            </button>

            {/* Reload Button */}
            <button
              onClick={loadData}
              disabled={loading}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-cyan-500/20 transition-all disabled:opacity-50"
              title="Refresh Data from Google Sheets"
            >
              <span className={`material-symbols-outlined text-lg ${loading ? 'animate-spin' : ''}`}>
                sync
              </span>
            </button>

            {/* Close Modal */}
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-rose-950/40 text-slate-300 hover:text-rose-400 border border-slate-700 transition-all"
              title="Close modal (Esc)"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          </div>
        </div>

        {/* Toolbar & Filter Bar */}
        <div className="p-3.5 sm:px-5 border-b border-slate-700/60 bg-slate-900/50 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
              search
            </span>
            <input
              type="text"
              placeholder="Search by item, specification, status, month, remarks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-950/80 border border-cyan-500/30 text-white placeholder-slate-400 text-xs focus:outline-none focus:border-cyan-400 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-300 flex-wrap">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700">
              <span className="text-slate-400">Total Items:</span>
              <span className="font-bold text-cyan-400">{filteredRows.length}</span>
              {searchQuery && <span className="text-slate-400">/ {data.rows.length}</span>}
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700">
              <span className="text-slate-400">Columns:</span>
              <span className="font-bold text-cyan-400">{data.headers.length || 25}</span>
            </div>
          </div>
        </div>

        {/* Modal Body / Table View */}
        <div className="flex-1 overflow-auto p-3 sm:p-5 relative custom-scrollbar bg-slate-950/40">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-300">
              <span className="material-symbols-outlined text-4xl text-cyan-400 animate-spin">
                progress_activity
              </span>
              <div className="text-sm font-semibold text-white">Loading First Aid Kit Data...</div>
            </div>
          ) : data.headers.length === 0 || data.rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-slate-400">
              <span className="material-symbols-outlined text-4xl text-slate-500 mb-2">
                folder_off
              </span>
              <p className="text-sm font-semibold text-white">No First Aid Kit Records Found</p>
            </div>
          ) : (
            <div className="border border-slate-700/80 rounded-xl overflow-hidden shadow-lg bg-slate-900/60">
              <div className="overflow-x-auto max-h-[62vh]">
                <table className="w-full text-left border-collapse whitespace-nowrap text-xs">
                  <thead className="sticky top-0 z-20 bg-slate-900 border-b border-cyan-500/30 text-cyan-400 font-bold tracking-wider uppercase text-[11px] shadow-sm">
                    <tr>
                      {data.headers.map((header, idx) => (
                        <th
                          key={idx}
                          className="p-3 font-bold border-r border-slate-700/50 text-cyan-400 tracking-wider"
                        >
                          <div className="flex items-center gap-1.5 min-w-[120px] text-cyan-400">
                            <span className="text-cyan-400 font-bold">{header || `COL ${idx + 1}`}</span>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {filteredRows.length === 0 ? (
                      <tr>
                        <td
                          colSpan={data.headers.length}
                          className="p-8 text-center text-slate-400"
                        >
                          No matching items found for query "{searchQuery}"
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
                                  className="p-3 border-r border-slate-800/50 max-w-xs truncate"
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

        {/* Modal Footer */}
        <div className="p-3 sm:px-5 border-t border-slate-700/60 bg-slate-900/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-sm text-cyan-400">info</span>
            <span>
              Showing <span className="text-white font-bold">{filteredRows.length}</span> items
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-colors border border-slate-700"
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
