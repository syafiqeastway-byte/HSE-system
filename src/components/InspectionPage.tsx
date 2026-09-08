import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { InspectionRecord, FireExtinguisherRecord } from '../types';
import { fetchInspectionData, fetchFireExtinguisherData } from '../utils/gasBridge';
import { formatToPreviewUrl } from '../utils/formatDriveUrl';

interface InspectionPageProps {
  onBackToHome: () => void;
  initialTab?: 'workplace' | 'fireExtinguisher';
}

export const InspectionPage: React.FC<InspectionPageProps> = ({ 
  onBackToHome,
  initialTab = 'workplace'
}) => {
  const [activeTab, setActiveTab] = useState<'workplace' | 'fireExtinguisher'>(initialTab);
  
  // Workplace Inspection State
  const [inspections, setInspections] = useState<InspectionRecord[]>([]);
  const [loadingWorkplace, setLoadingWorkplace] = useState(true);
  const [searchQueryWorkplace, setSearchQueryWorkplace] = useState('');
  const [selectedWorkplaceId, setSelectedWorkplaceId] = useState<string | null>(null);

  // Fire Extinguisher State
  const [fireExtinguishers, setFireExtinguishers] = useState<FireExtinguisherRecord[]>([]);
  const [loadingFireExtinguisher, setLoadingFireExtinguisher] = useState(true);
  const [searchQueryFE, setSearchQueryFE] = useState('');
  const [selectedFEId, setSelectedFEId] = useState<string | null>(null);

  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadAllData = (isBackground: boolean = false) => {
    let isMounted = true;
    if (isBackground) {
      setIsRefreshing(true);
    } else {
      setLoadingWorkplace(true);
      setLoadingFireExtinguisher(true);
    }

    // 1. Fetch Workplace Inspections
    fetchInspectionData()
      .then((data) => {
        if (!isMounted) return;
        setInspections(data);
      })
      .catch((err) => {
        console.warn('Error fetching Workplace inspections:', err);
      })
      .finally(() => {
        if (isMounted) setLoadingWorkplace(false);
      });

    // 2. Fetch Fire Extinguisher Data
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
          setLoadingFireExtinguisher(false);
          setIsRefreshing(false);
        }
      });

    return () => {
      isMounted = false;
    };
  };

  useEffect(() => {
    return loadAllData(false);
  }, []);

  // Filtered Workplace Data
  const filteredWorkplaceData = inspections.filter((item) => {
    const query = searchQueryWorkplace.toLowerCase().trim();
    if (!query) return true;
    return (
      (item.date || '').toLowerCase().includes(query) ||
      (item.day || '').toLowerCase().includes(query) ||
      (item.location || '').toLowerCase().includes(query) ||
      (item.typeOfInspection || '').toLowerCase().includes(query) ||
      (item.inspector || '').toLowerCase().includes(query) ||
      (item.remark || '').toLowerCase().includes(query)
    );
  });

  // Filtered Fire Extinguisher Data
  const filteredFEData = fireExtinguishers
    .filter((item) => item.rowNumber !== 2)
    .filter((item) => {
      const query = searchQueryFE.toLowerCase().trim();
      if (!query) return true;
      if (item.isHeader) return true;
      return (
        (item.no || '').toLowerCase().includes(query) ||
        (item.location || '').toLowerCase().includes(query) ||
        (item.brand || '').toLowerCase().includes(query) ||
        (item.serialNumber || '').toLowerCase().includes(query) ||
        (item.month || '').toLowerCase().includes(query) ||
        (item.year || '').toLowerCase().includes(query) ||
        (item.certExpiryDate || '').toLowerCase().includes(query) ||
        (item.remarks || '').toLowerCase().includes(query)
      );
    });

  // Export functions
  const handleExportWorkplaceExcel = () => {
    if (filteredWorkplaceData.length === 0) return;
    const exportData = filteredWorkplaceData.map((item, index) => ({
      'No': index + 1,
      'Date': item.date || '',
      'Day': item.day || '',
      'Location': item.location || '',
      'Type of Inspection': item.typeOfInspection || '',
      'Inspector': item.inspector || '',
      'Remark': item.remark || '',
      'Document URL': item.documentUrl || ''
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Workplace Inspections");
    XLSX.writeFile(wb, "Workplace_Inspection_Records.xlsx");
  };

  const handleExportFireExtinguisherExcel = () => {
    if (filteredFEData.length === 0) return;
    const exportData = filteredFEData.map((item) => {
      if (item.isHeader) {
        return {
          'No': item.no || '—',
          'Location': item.location || 'LOCATION',
          'Type ABC': item.typeABC || 'TYPE ABC',
          'Type CO2': item.typeCO2 || 'TYPE CO2',
          'Brand': item.brand || 'BRAND',
          'Serial Number': item.serialNumber || 'SERIAL NUMBER',
          'Month': item.month || 'MONTH',
          'Year': item.year || 'YEAR',
          'Cert Expiry Date': item.certExpiryDate || 'CERT EXPIRY DATE',
          'Remarks 2026': item.remarks || 'REMARKS 2026'
        };
      }
      return {
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
      };
    });
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
              <span className="material-symbols-outlined text-cyan-400">fact_check</span>
              <span>INSPECTION RECORDS</span>
            </h2>
            <p className="text-xs text-white">
              Comprehensive HSE inspections, audit trails & equipment compliance
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 p-1 bg-slate-950/80 rounded-xl border border-cyan-500/20 w-full sm:w-auto overflow-x-auto">
          <button
            onClick={() => setActiveTab('workplace')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'workplace'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <span className="material-symbols-outlined text-base">fact_check</span>
            <span>Workplace & Workshop</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
              activeTab === 'workplace' ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-300'
            }`}>
              {inspections.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('fireExtinguisher')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'fireExtinguisher'
                ? 'bg-red-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <span className="material-symbols-outlined text-base">local_fire_department</span>
            <span>Fire Extinguisher</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
              activeTab === 'fireExtinguisher' ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-300'
            }`}>
              {fireExtinguishers.filter(r => !r.isHeader).length}
            </span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* VIEW 1: WORKPLACE & WORKSHOP INSPECTIONS */}
      {/* ========================================================================= */}
      {activeTab === 'workplace' && (
        <div className="space-y-4">
          {/* Action Controls */}
          <div className="glass-card p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Search Bar */}
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
                search
              </span>
              <input
                type="text"
                value={searchQueryWorkplace}
                onChange={(e) => setSearchQueryWorkplace(e.target.value)}
                placeholder="SEARCH WORKPLACE INSPECTIONS..."
                className="w-full pl-9 pr-9 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
              {searchQueryWorkplace && (
                <button
                  type="button"
                  onClick={() => setSearchQueryWorkplace('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5 rounded-full"
                  title="Clear search"
                >
                  <span className="material-symbols-outlined text-base">close</span>
                </button>
              )}
            </div>

            {/* Download Excel Button */}
            <button
              onClick={handleExportWorkplaceExcel}
              disabled={loadingWorkplace || filteredWorkplaceData.length === 0}
              className="px-3.5 py-2 rounded-xl bg-emerald-600/90 hover:bg-emerald-600 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 border border-emerald-500/40 shadow-sm transition-all disabled:opacity-50 flex-shrink-0"
              title="Download Workplace Inspection Records to Excel (.xlsx)"
            >
              <span className="material-symbols-outlined text-base">download</span>
              <span className="hidden md:inline">Download Excel</span>
              <span className="md:hidden">Excel</span>
            </button>

            {/* Refresh Button */}
            <button
              onClick={() => loadAllData(true)}
              disabled={isRefreshing}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white transition-colors border border-cyan-500/20 flex-shrink-0"
              title="Refresh from Google Sheets"
            >
              <span className={`material-symbols-outlined text-xl ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`}>
                sync
              </span>
            </button>
          </div>

          {loadingWorkplace ? (
            <div className="p-12 text-center flex flex-col items-center justify-center glass-card">
              <span className="material-symbols-outlined text-4xl text-cyan-400 animate-spin">sync</span>
              <span className="text-xs text-slate-400 mt-2">Loading Workplace Inspection Records...</span>
            </div>
          ) : (
            <div className="glass-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-cyan-500/20 text-left text-xs sm:text-sm whitespace-nowrap bg-transparent">
                  <thead className="bg-slate-950/95 text-cyan-400 border-b-2 border-cyan-500/40">
                    <tr className="h-8">
                      <th className="py-1.5 px-3 font-bold uppercase tracking-wider border border-cyan-500/20 text-center w-12 text-xs text-cyan-400">NO</th>
                      <th className="py-1.5 px-3 font-bold uppercase tracking-wider border border-cyan-500/20 text-center w-28 text-xs text-cyan-400">DATE</th>
                      <th className="py-1.5 px-3 font-bold uppercase tracking-wider border border-cyan-500/20 min-w-[150px] text-xs text-cyan-400">LOCATION</th>
                      <th className="py-1.5 px-3 font-bold uppercase tracking-wider border border-cyan-500/20 min-w-[160px] text-xs text-cyan-400">TYPE OF INSPECTION</th>
                      <th className="py-1.5 px-3 font-bold uppercase tracking-wider border border-cyan-500/20 min-w-[140px] text-xs text-cyan-400">INSPECTOR</th>
                      <th className="py-1.5 px-3 font-bold uppercase tracking-wider border border-cyan-500/20 min-w-[180px] text-xs text-cyan-400">REMARK</th>
                      <th className="py-1.5 px-3 font-bold uppercase tracking-wider border border-cyan-500/20 text-center w-28 text-xs text-cyan-400">PDF</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cyan-500/10 text-xs sm:text-sm text-white">
                    {filteredWorkplaceData.length === 0 ? (
                      <tr className="h-9">
                        <td colSpan={7} className="py-6 text-center text-xs text-white border border-cyan-500/20">
                          No workplace inspection records found matching "{searchQueryWorkplace}"
                        </td>
                      </tr>
                    ) : (
                      filteredWorkplaceData.map((item, index) => {
                        const isSelected = selectedWorkplaceId === String(item.id);
                        return (
                          <tr 
                            key={item.id} 
                            onClick={() => setSelectedWorkplaceId(isSelected ? null : String(item.id))}
                            className={`h-9 transition-colors cursor-pointer select-none ${
                              isSelected
                                ? '!bg-cyan-600 !text-white font-bold [&>td]:!bg-cyan-600 [&>td]:!text-white [&>td]:!border-cyan-400/40 [&_*]:!text-white shadow-md'
                                : index % 2 === 0
                                ? 'bg-slate-900/40 hover:bg-cyan-950/30'
                                : 'bg-slate-900/80 hover:bg-cyan-950/40'
                            }`}
                          >
                            <td className="py-1 px-3 text-center font-mono font-medium text-white border border-cyan-500/20 leading-none">{index + 1}</td>
                            <td className="py-1 px-3 whitespace-nowrap font-mono text-center text-white border border-cyan-500/20 leading-none">{item.date}</td>
                            <td className="py-1 px-3 font-medium text-white border border-cyan-500/20 leading-none">{item.location || '-'}</td>
                            <td className="py-1 px-3 font-medium text-white border border-cyan-500/20 leading-none">{item.typeOfInspection || '-'}</td>
                            <td className="py-1 px-3 text-white border border-cyan-500/20 leading-none">{item.inspector || '-'}</td>
                            <td className="py-1 px-3 text-white max-w-xs truncate border border-cyan-500/20 leading-none" title={item.remark}>{item.remark || '-'}</td>
                            <td className="py-1 px-3 text-center border border-cyan-500/20 leading-none">
                              {item.documentUrl ? (
                                <a
                                  href={formatToPreviewUrl(item.documentUrl)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="inline-flex items-center justify-center gap-1 px-2.5 py-0.5 bg-red-600 hover:bg-red-700 text-white rounded text-[11px] font-semibold transition-colors leading-tight"
                                >
                                  <span className="material-symbols-outlined text-[13px]">open_in_new</span>
                                  View PDF
                                </a>
                              ) : (
                                <span className="text-[11px] text-slate-400 italic leading-tight">No PDF</span>
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
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: FIRE EXTINGUISHER INSPECTION & EQUIPMENT REGISTER */}
      {/* ========================================================================= */}
      {activeTab === 'fireExtinguisher' && (
        <div className="space-y-4">
          {/* Action Controls */}
          <div className="glass-card p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Search Bar */}
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
                search
              </span>
              <input
                type="text"
                value={searchQueryFE}
                onChange={(e) => setSearchQueryFE(e.target.value)}
                placeholder="SEARCH FIRE EXTINGUISHER BY LOCATION, BRAND, SERIAL NO..."
                className="w-full pl-9 pr-9 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              {searchQueryFE && (
                <button
                  type="button"
                  onClick={() => setSearchQueryFE('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5 rounded-full"
                  title="Clear search"
                >
                  <span className="material-symbols-outlined text-base">close</span>
                </button>
              )}
            </div>

            {/* Download Excel Button */}
            <button
              onClick={handleExportFireExtinguisherExcel}
              disabled={loadingFireExtinguisher || filteredFEData.length === 0}
              className="px-3.5 py-2 rounded-xl bg-emerald-600/90 hover:bg-emerald-600 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 border border-emerald-500/40 shadow-sm transition-all disabled:opacity-50 flex-shrink-0"
              title="Download Fire Extinguisher Records to Excel (.xlsx)"
            >
              <span className="material-symbols-outlined text-base">download</span>
              <span className="hidden md:inline">Download Excel</span>
              <span className="md:hidden">Excel</span>
            </button>

            {/* Refresh Button */}
            <button
              onClick={() => loadAllData(true)}
              disabled={isRefreshing}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white transition-colors border border-cyan-500/20 flex-shrink-0"
              title="Refresh from Google Sheets"
            >
              <span className={`material-symbols-outlined text-xl ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`}>
                sync
              </span>
            </button>
          </div>

          {loadingFireExtinguisher ? (
            <div className="p-12 text-center flex flex-col items-center justify-center glass-card">
              <span className="material-symbols-outlined text-4xl text-cyan-400 animate-spin">sync</span>
              <span className="text-xs text-slate-400 mt-2">Loading Fire Extinguisher Data from Sheet...</span>
            </div>
          ) : (
            <div className="glass-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-cyan-500/20 text-left text-xs sm:text-sm whitespace-nowrap bg-transparent">
                  <thead className="bg-slate-950/95 text-cyan-400 border-b-2 border-cyan-500/40">
                    <tr className="h-8">
                      <th className="py-1.5 px-3 font-bold uppercase tracking-wider border border-cyan-500/20 text-center w-12 text-xs text-cyan-400">NO</th>
                      <th className="py-1.5 px-3 font-bold uppercase tracking-wider border border-cyan-500/20 min-w-[140px] text-xs text-cyan-400">LOCATION</th>
                      <th className="py-1.5 px-3 font-bold uppercase tracking-wider border border-cyan-500/20 text-center w-24 text-xs text-cyan-400">TYPE ABC</th>
                      <th className="py-1.5 px-3 font-bold uppercase tracking-wider border border-cyan-500/20 text-center w-24 text-xs text-cyan-400">TYPE CO2</th>
                      <th className="py-1.5 px-3 font-bold uppercase tracking-wider border border-cyan-500/20 min-w-[120px] text-xs text-cyan-400">BRAND</th>
                      <th className="py-1.5 px-3 font-bold uppercase tracking-wider border border-cyan-500/20 min-w-[140px] text-xs text-cyan-400">SERIAL NUMBER</th>
                      <th className="py-1.5 px-3 font-bold uppercase tracking-wider border border-cyan-500/20 text-center w-20 text-xs text-cyan-400">MONTH</th>
                      <th className="py-1.5 px-3 font-bold uppercase tracking-wider border border-cyan-500/20 text-center w-20 text-xs text-cyan-400">YEAR</th>
                      <th className="py-1.5 px-3 font-bold uppercase tracking-wider border border-cyan-500/20 min-w-[150px] text-xs text-center text-cyan-400">CERT EXPIRY DATE</th>
                      <th className="py-1.5 px-3 font-bold uppercase tracking-wider border border-cyan-500/20 min-w-[160px] text-xs text-cyan-400">REMARKS 2026</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cyan-500/10 text-xs sm:text-sm text-white">
                    {filteredFEData.length === 0 ? (
                      <tr className="h-9">
                        <td colSpan={10} className="py-6 text-center text-xs text-white border border-cyan-500/20">
                          No fire extinguisher records found matching "{searchQueryFE}"
                        </td>
                      </tr>
                    ) : (
                      filteredFEData.map((item, rIdx) => {
                        if (item.isHeader) {
                          return (
                            <tr 
                              key={item.id} 
                              className="h-8 bg-slate-950 text-cyan-400 font-bold uppercase tracking-wider text-xs border-y-2 border-cyan-500/40"
                            >
                              <td className="py-1 px-3 text-center font-bold border border-cyan-500/20 text-cyan-400 leading-none">{item.no || '—'}</td>
                              <td className="py-1 px-3 font-bold border border-cyan-500/20 text-cyan-400 leading-none">{item.location || 'LOCATION'}</td>
                              <td className="py-1 px-3 text-center font-bold border border-cyan-500/20 text-cyan-400 leading-none">{item.typeABC || 'TYPE ABC'}</td>
                              <td className="py-1 px-3 text-center font-bold border border-cyan-500/20 text-cyan-400 leading-none">{item.typeCO2 || 'TYPE CO2'}</td>
                              <td className="py-1 px-3 font-bold border border-cyan-500/20 text-cyan-400 leading-none">{item.brand || 'BRAND'}</td>
                              <td className="py-1 px-3 font-bold border border-cyan-500/20 text-cyan-400 leading-none">{item.serialNumber || 'SERIAL NUMBER'}</td>
                              <td className="py-1 px-3 text-center font-bold border border-cyan-500/20 text-cyan-400 leading-none">{item.month || 'MONTH'}</td>
                              <td className="py-1 px-3 text-center font-bold border border-cyan-500/20 text-cyan-400 leading-none">{item.year || 'YEAR'}</td>
                              <td className="py-1 px-3 font-bold border border-cyan-500/20 text-center text-cyan-400 leading-none">{item.certExpiryDate || 'CERT EXPIRY DATE'}</td>
                              <td className="py-1 px-3 font-bold border border-cyan-500/20 text-cyan-400 leading-none">{item.remarks || 'REMARKS 2026'}</td>
                            </tr>
                          );
                        }

                        const isSelected = selectedFEId === item.id;
                        return (
                          <tr
                            key={item.id}
                            onClick={() => setSelectedFEId(isSelected ? null : item.id)}
                            className={`h-9 transition-colors cursor-pointer select-none ${
                              isSelected
                                ? '!bg-cyan-600 !text-white font-bold [&>td]:!bg-cyan-600 [&>td]:!text-white [&>td]:!border-cyan-400/40 [&_*]:!text-white shadow-md'
                                : rIdx % 2 === 0
                                ? 'bg-slate-900/40 hover:bg-cyan-950/30'
                                : 'bg-slate-900/80 hover:bg-cyan-950/40'
                            }`}
                          >
                            <td className="py-1 px-3 text-center font-mono font-medium text-white border border-cyan-500/20 leading-none">
                              {item.no || '-'}
                            </td>
                            <td className="py-1 px-3 font-medium text-white border border-cyan-500/20 leading-none">
                              {item.location || '-'}
                            </td>
                            <td className="py-1 px-3 text-center border border-cyan-500/20 text-white leading-none">
                              {item.typeABC && item.typeABC.trim() !== '' ? (
                                <span className="inline-flex items-center justify-center font-bold text-xs text-cyan-400">
                                  ✓
                                </span>
                              ) : (
                                <span className="text-slate-500 font-mono">-</span>
                              )}
                            </td>
                            <td className="py-1 px-3 text-center border border-cyan-500/20 text-white leading-none">
                              {item.typeCO2 && item.typeCO2.trim() !== '' ? (
                                <span className="inline-flex items-center justify-center font-bold text-xs text-cyan-400">
                                  ✓
                                </span>
                              ) : (
                                <span className="text-slate-500 font-mono">-</span>
                              )}
                            </td>
                            <td className="py-1 px-3 font-medium text-white border border-cyan-500/20 leading-none">
                              {item.brand || '-'}
                            </td>
                            <td className="py-1 px-3 font-mono text-white border border-cyan-500/20 leading-none">
                              {item.serialNumber || '-'}
                            </td>
                            <td className="py-1 px-3 text-center font-mono text-white border border-cyan-500/20 leading-none">
                              {item.month || '-'}
                            </td>
                            <td className="py-1 px-3 text-center font-mono font-medium text-white border border-cyan-500/20 leading-none">
                              {item.year || '-'}
                            </td>
                            <td className="py-1 px-3 whitespace-nowrap font-mono font-bold text-white border border-cyan-500/20 text-center leading-none">
                              {item.certExpiryDate || '-'}
                            </td>
                            <td className="py-1 px-3 text-white border border-cyan-500/20 leading-none">
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
      )}
    </div>
  );
};
