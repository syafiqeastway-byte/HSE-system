import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { FireExtinguisherRecord } from '../types';
import { fetchFireExtinguisherData } from '../utils/gasBridge';
import { formatToPreviewUrl } from '../utils/formatDriveUrl';
import { useAutoRefresh } from '../hooks/useAutoRefresh';

interface SafetyEquipmentPageProps {
  onBackToHome: () => void;
}

/**
 * Evaluates CERT EXPIRY DATE status:
 * - 'expired': expiry date is earlier than today (< 0 days left / already passed) -> Red
 * - 'warning': expiry date is within 1 month before/at current date (0 to 30 days left) -> Orange
 * - 'valid': more than 1 month remaining -> Normal
 * - 'none': empty or unparseable date
 */
function getExpiryStatus(rawDate?: string): 'expired' | 'warning' | 'valid' | 'none' {
  if (!rawDate || !rawDate.trim() || rawDate.trim() === '-') return 'none';
  const clean = rawDate.trim();

  let targetDate: Date | null = null;

  // Format 1: DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = clean.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (dmyMatch) {
    const day = parseInt(dmyMatch[1], 10);
    const month = parseInt(dmyMatch[2], 10) - 1;
    const year = parseInt(dmyMatch[3], 10);
    targetDate = new Date(year, month, day, 23, 59, 59);
  } else {
    // Format 2: YYYY-MM-DD
    const ymdMatch = clean.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})$/);
    if (ymdMatch) {
      const year = parseInt(ymdMatch[1], 10);
      const month = parseInt(ymdMatch[2], 10) - 1;
      const day = parseInt(ymdMatch[3], 10);
      targetDate = new Date(year, month, day, 23, 59, 59);
    } else {
      // Fallback native parse
      const parsed = Date.parse(clean);
      if (!isNaN(parsed)) {
        targetDate = new Date(parsed);
      }
    }
  }

  if (!targetDate || isNaN(targetDate.getTime())) return 'none';

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffMs = targetDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return 'expired'; // More than expired / passed expiry date -> Red
  } else if (diffDays <= 30) {
    return 'warning'; // 1 month or less before current date -> Orange
  } else {
    return 'valid';
  }
}

export const SafetyEquipmentPage: React.FC<SafetyEquipmentPageProps> = ({ onBackToHome }) => {
  const [fireExtinguishers, setFireExtinguishers] = useState<FireExtinguisherRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFEId, setSelectedFEId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadData = (isBackground: boolean = false) => {
    let isMounted = true;
    if (isBackground) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
    }

    fetchFireExtinguisherData()
      .then((data) => {
        if (!isMounted) return;
        setFireExtinguishers(data);
      })
      .catch((err) => {
        console.warn('Error fetching Fire Extinguisher data:', err);
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
          setIsRefreshing(false);
        }
      });

    return () => {
      isMounted = false;
    };
  };

  useEffect(() => {
    return loadData(false);
  }, []);

  useAutoRefresh(() => {
    loadData(true);
  }, { intervalMs: 60000 });

  const filteredData = fireExtinguishers.filter((item) => {
    if (item.isHeader) return false;
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      (item.location || '').toLowerCase().includes(query) ||
      (item.brand || '').toLowerCase().includes(query) ||
      (item.serialNumber || '').toLowerCase().includes(query) ||
      (item.month || '').toLowerCase().includes(query) ||
      (item.year || '').toLowerCase().includes(query) ||
      (item.certExpiryDate || '').toLowerCase().includes(query) ||
      (item.remarks || '').toLowerCase().includes(query)
    );
  });

  const handleExportExcel = () => {
    if (filteredData.length === 0) return;
    const exportData = filteredData.map((item) => ({
      'No': item.no || '',
      'Location': item.location || '',
      'Type ABC': item.typeABC || '',
      'Type CO2': item.typeCO2 || '',
      'Brand': item.brand || '',
      'Serial Number': item.serialNumber || '',
      'Month': item.month || '',
      'Year': item.year || '',
      'Cert Expiry Date': item.certExpiryDate || '',
      'Remarks 2026': item.remarks || ''
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Fire Extinguishers");
    XLSX.writeFile(wb, "Fire_Extinguisher_Records.xlsx");
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
              <span className="material-symbols-outlined text-red-400">local_fire_department</span>
              <span>SAFETY EQUIPMENT - FIRE EXTINGUISHER INSPECTIONS</span>
            </h2>
            <p className="text-xs text-slate-300">
              Fire extinguisher asset register, inspection records & statutory certification tracking
            </p>
          </div>
        </div>
      </div>

      {/* Action Controls */}
      <div className="glass-card p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Bar */}
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="SEARCH FIRE EXTINGUISHER BY LOCATION, BRAND, SERIAL NO..."
            className="w-full pl-9 pr-9 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500"
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

        {/* Download Excel Button */}
        <button
          onClick={handleExportExcel}
          disabled={loading || filteredData.length === 0}
          className="px-3.5 py-2 rounded-xl bg-emerald-600/90 hover:bg-emerald-600 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 border border-emerald-500/40 shadow-sm transition-all disabled:opacity-50 flex-shrink-0"
          title="Download Fire Extinguisher Records to Excel (.xlsx)"
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

      {/* Expiry Status Legend */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-slate-400 font-semibold">CERT STATUS:</span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-950/80 border border-red-500/50 text-red-200 font-bold">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
            Expired / Overdue (Red)
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-950/80 border border-amber-500/50 text-amber-200 font-bold">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            Expiring Within 1 Month (Orange)
          </span>
        </div>
        <div className="text-slate-400 text-[11px]">
          Total Units: <strong className="text-white">{filteredData.length}</strong>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center flex flex-col items-center justify-center glass-card">
          <span className="material-symbols-outlined text-4xl text-cyan-400 animate-spin">sync</span>
          <span className="text-xs text-slate-400 mt-2">Loading Fire Extinguisher Data from Sheet...</span>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-cyan-500/20 text-center text-xs whitespace-nowrap bg-transparent">
              <thead className="bg-slate-950/95 text-cyan-400 border-b-2 border-cyan-500/40">
                <tr className="h-8">
                  <th className="py-1 px-2.5 text-center font-bold border border-cyan-500/20 text-xs text-cyan-400">NO</th>
                  <th className="py-1 px-2.5 text-center font-bold border border-cyan-500/20 text-xs text-cyan-400">LOCATION</th>
                  <th className="py-1 px-2.5 text-center font-bold border border-cyan-500/20 text-xs text-cyan-400">TYPE ABC</th>
                  <th className="py-1 px-2.5 text-center font-bold border border-cyan-500/20 text-xs text-cyan-400">TYPE CO2</th>
                  <th className="py-1 px-2.5 text-center font-bold border border-cyan-500/20 text-xs text-cyan-400">BRAND</th>
                  <th className="py-1 px-2.5 text-center font-bold border border-cyan-500/20 text-xs text-cyan-400">SERIAL NUMBER</th>
                  <th className="py-1 px-2.5 text-center font-bold border border-cyan-500/20 text-xs text-cyan-400">MONTH</th>
                  <th className="py-1 px-2.5 text-center font-bold border border-cyan-500/20 text-xs text-cyan-400">YEAR</th>
                  <th className="py-1 px-2.5 text-center font-bold border border-cyan-500/20 text-xs text-cyan-400">CERT EXPIRY DATE</th>
                  <th className="py-1 px-2.5 text-center font-bold border border-cyan-500/20 text-xs text-cyan-400">REMARKS 2026</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cyan-500/10 text-xs text-white">
                {filteredData.length === 0 ? (
                  <tr className="h-8">
                    <td colSpan={10} className="py-6 text-center text-xs text-white border border-cyan-500/20">
                      No fire extinguisher records found matching "{searchQuery}"
                    </td>
                  </tr>
                ) : (
                  filteredData.map((item, rIdx) => {
                    const isSelected = selectedFEId === item.id;
                    const expiryStatus = getExpiryStatus(item.certExpiryDate);

                    return (
                      <tr
                        key={`fe-row-${item.id}-${rIdx}`} 
                        onClick={() => setSelectedFEId(isSelected ? null : item.id)}
                        className={`h-8 transition-colors cursor-pointer select-none ${
                          isSelected
                            ? '!bg-cyan-600 !text-white font-bold [&>td]:!bg-cyan-600 [&>td]:!text-white [&>td]:!border-cyan-400/40 [&_*]:!text-white shadow-md'
                            : rIdx % 2 === 0
                            ? 'bg-slate-900/40 hover:bg-cyan-950/30'
                            : 'bg-slate-900/80 hover:bg-cyan-950/40'
                        }`}
                      >
                        <td className="py-1 px-2 text-center font-mono font-medium border border-cyan-500/20 leading-none">
                          {item.no || '-'}
                        </td>
                        <td className="py-1 px-2 text-center font-medium border border-cyan-500/20 leading-none">
                          {item.location || '-'}
                        </td>
                        <td className="py-1 px-2 text-center border border-cyan-500/20 leading-none font-bold text-xs text-cyan-400">
                          {item.typeABC || '-'}
                        </td>
                        <td className="py-1 px-2 text-center border border-cyan-500/20 leading-none font-bold text-xs text-cyan-400">
                          {item.typeCO2 || '-'}
                        </td>
                        <td className="py-1 px-2 text-center font-medium border border-cyan-500/20 leading-none">
                          {item.brand || '-'}
                        </td>
                        <td className="py-1 px-2 text-center font-mono border border-cyan-500/20 leading-none">
                          {item.serialNumber || '-'}
                        </td>
                        <td className="py-1 px-2 text-center font-mono border border-cyan-500/20 leading-none">
                          {item.month || '-'}
                        </td>
                        <td className="py-1 px-2 text-center font-mono font-medium border border-cyan-500/20 leading-none">
                          {item.year || '-'}
                        </td>
                        <td className="py-1 px-2 whitespace-nowrap font-mono font-bold border border-cyan-500/20 text-center leading-none">
                          <span className={
                            expiryStatus === 'expired'
                              ? 'inline-flex items-center gap-1 text-red-300 font-extrabold'
                              : expiryStatus === 'warning'
                              ? 'inline-flex items-center gap-1 text-amber-300 font-extrabold'
                              : 'text-white'
                          }>
                            {item.certExpiryDate || '-'}
                            {expiryStatus === 'expired' && <span className="text-[10px] px-1 py-0.2 rounded bg-red-600 text-white font-sans uppercase">EXPIRED</span>}
                            {expiryStatus === 'warning' && <span className="text-[10px] px-1 py-0.2 rounded bg-amber-500 text-black font-sans uppercase font-bold">&lt;1 MO</span>}
                          </span>
                        </td>
                        <td className="py-1 px-2 text-center border border-cyan-500/20 leading-none">
                          {item.remarks || '-'}
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
