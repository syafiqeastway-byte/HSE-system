import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { InspectionRecord, FireExtinguisherRecord } from '../types';
import { fetchInspectionData, fetchFireExtinguisherData } from '../utils/gasBridge';
import { formatToPreviewUrl } from '../utils/formatDriveUrl';

interface InspectionModalProps {
  isOpen: boolean;
  filterType: 'Workplace' | 'First Aid Box' | 'Fire Extinguisher' | 'All';
  onClose: () => void;
}

export const InspectionModal: React.FC<InspectionModalProps> = ({ isOpen, filterType, onClose }) => {
  const [activeTab, setActiveTab] = useState<'workplace' | 'fireExtinguisher'>('workplace');
  
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

  useEffect(() => {
    if (!isOpen) return;

    if (filterType === 'Fire Extinguisher') {
      setActiveTab('fireExtinguisher');
    } else {
      setActiveTab('workplace');
    }

    let isMounted = true;
    setLoadingWorkplace(true);
    setLoadingFireExtinguisher(true);

    // 1. Fetch Workplace Inspections
    fetchInspectionData()
      .then((data) => {
        if (!isMounted) return;
        if (filterType === 'All' || filterType === 'Fire Extinguisher') {
          setInspections(data);
        } else {
          setInspections(data.filter((item) => item.type === filterType));
        }
        setLoadingWorkplace(false);
      })
      .catch(() => {
        if (isMounted) setLoadingWorkplace(false);
      });

    // 2. Fetch Fire Extinguisher Data
    fetchFireExtinguisherData()
      .then((data) => {
        if (!isMounted) return;
        setFireExtinguishers(data);
        setLoadingFireExtinguisher(false);
      })
      .catch(() => {
        if (isMounted) setLoadingFireExtinguisher(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, filterType]);

  if (!isOpen) return null;

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
  // When searching, headers (row 19) are kept if matching or displayed for context
  // Row 2 is already rendered as the primary <thead>
  const filteredFEData = fireExtinguishers
    .filter((item) => item.rowNumber !== 2)
    .filter((item) => {
      const query = searchQueryFE.toLowerCase().trim();
      if (!query) return true;
      if (item.isHeader) return true; // Keep section headers visible
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="glass-card max-w-7xl w-full max-h-[92vh] overflow-hidden flex flex-col shadow-2xl border border-slate-200 dark:border-zinc-800">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50 dark:bg-zinc-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-300">
              <span className="material-symbols-outlined text-2xl">fact_check</span>
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white uppercase tracking-tight">
                INSPECTION RECORDS & REGISTRY
              </h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium">
                Comprehensive HSE inspections, audit trails & equipment compliance
              </p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-zinc-800 transition-colors self-end sm:self-auto"
            title="Close"
          >
            <span className="material-symbols-outlined text-2xl">close</span>
          </button>
        </div>

        {/* Tab Selector Bar */}
        <div className="px-4 sm:px-6 pt-3 pb-2 border-b border-slate-200 dark:border-zinc-800 bg-white/60 dark:bg-zinc-900/60 flex items-center gap-2 overflow-x-auto scrollbar-none">
          {/* Tab 1: Workplace */}
          <button
            onClick={() => setActiveTab('workplace')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wider flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'workplace'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800'
            }`}
          >
            <span className="material-symbols-outlined text-lg">fact_check</span>
            <span>WORKPLACE & WORKSHOP</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
              activeTab === 'workplace' ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-zinc-700 text-slate-700 dark:text-zinc-300'
            }`}>
              {inspections.length}
            </span>
          </button>

          {/* Tab 2: Fire Extinguisher */}
          <button
            onClick={() => setActiveTab('fireExtinguisher')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wider flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'fireExtinguisher'
                ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                : 'text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800'
            }`}
          >
            <span className="material-symbols-outlined text-lg">local_fire_department</span>
            <span>FIRE EXTINGUISHER</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
              activeTab === 'fireExtinguisher' ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-zinc-700 text-slate-700 dark:text-zinc-300'
            }`}>
              {fireExtinguishers.filter(r => !r.isHeader).length}
            </span>
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-slate-50/50 dark:bg-zinc-950/40">
          
          {/* ========================================================================= */}
          {/* VIEW 1: WORKPLACE & WORKSHOP INSPECTIONS */}
          {/* ========================================================================= */}
          {activeTab === 'workplace' && (
            <div>
              {/* Controls Header */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-4">
                {/* Search Bar */}
                <div className="relative flex-1">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
                    search
                  </span>
                  <input
                    type="text"
                    value={searchQueryWorkplace}
                    onChange={(e) => setSearchQueryWorkplace(e.target.value)}
                    placeholder="SEARCH WORKPLACE INSPECTION RECORDS..."
                    className="w-full pl-9 pr-9 py-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs sm:text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
                  />
                  {searchQueryWorkplace && (
                    <button
                      type="button"
                      onClick={() => setSearchQueryWorkplace('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded-full"
                      title="Clear search"
                    >
                      <span className="material-symbols-outlined text-base">close</span>
                    </button>
                  )}
                </div>

                {/* Download Excel Button */}
                <button
                  onClick={handleExportWorkplaceExcel}
                  className="px-3.5 py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm flex-shrink-0"
                  title="Download Workplace Inspection Records to Excel (.xlsx)"
                >
                  <span className="material-symbols-outlined text-base">download</span>
                  <span>Download Excel</span>
                </button>
              </div>

              {loadingWorkplace ? (
                <div className="p-12 text-center flex flex-col items-center justify-center gap-3">
                  <span className="material-symbols-outlined text-3xl text-emerald-500 animate-spin">sync</span>
                  <span className="text-xs text-slate-500 font-semibold uppercase">Loading Workplace Inspection Records...</span>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-300 dark:border-zinc-700 shadow-sm">
                  <table className="w-full border-collapse border border-slate-300 dark:border-zinc-700 text-left text-xs sm:text-sm text-slate-800 dark:text-slate-200">
                    <thead className="bg-slate-100 dark:bg-zinc-800/90 text-slate-800 dark:text-zinc-100 uppercase border-b border-slate-300 dark:border-zinc-700 font-extrabold">
                      <tr>
                        <th className="p-2 sm:p-3 border border-slate-300 dark:border-zinc-700 font-extrabold tracking-wider text-center w-12">NO</th>
                        <th className="p-2 sm:p-3 border border-slate-300 dark:border-zinc-700 font-extrabold tracking-wider">DATE</th>
                        <th className="p-2 sm:p-3 border border-slate-300 dark:border-zinc-700 font-extrabold tracking-wider">LOCATION</th>
                        <th className="p-2 sm:p-3 border border-slate-300 dark:border-zinc-700 font-extrabold tracking-wider">TYPE OF INSPECTION</th>
                        <th className="p-2 sm:p-3 border border-slate-300 dark:border-zinc-700 font-extrabold tracking-wider">INSPECTOR</th>
                        <th className="p-2 sm:p-3 border border-slate-300 dark:border-zinc-700 font-extrabold tracking-wider">REMARK</th>
                        <th className="p-2 sm:p-3 border border-slate-300 dark:border-zinc-700 font-extrabold tracking-wider text-center">PDF</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-300 dark:divide-zinc-700 bg-white dark:bg-zinc-900/60">
                      {filteredWorkplaceData.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-4 text-center text-slate-400 border border-slate-300 dark:border-zinc-700">
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
                              className={`transition-colors cursor-pointer ${
                                isSelected 
                                  ? 'bg-slate-200/80 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold' 
                                  : 'hover:bg-slate-50 dark:hover:bg-zinc-800/60'
                              }`}
                            >
                              <td className="p-2 sm:p-3 text-center font-mono font-semibold text-slate-500 border border-slate-300 dark:border-zinc-700">{index + 1}</td>
                              <td className="p-2 sm:p-3 whitespace-nowrap font-mono border border-slate-300 dark:border-zinc-700">{item.date}</td>
                              <td className="p-2 sm:p-3 font-bold text-slate-900 dark:text-white border border-slate-300 dark:border-zinc-700">{item.location || '-'}</td>
                              <td className="p-2 sm:p-3 font-semibold text-emerald-600 dark:text-emerald-400 border border-slate-300 dark:border-zinc-700">{item.typeOfInspection || '-'}</td>
                              <td className="p-2 sm:p-3 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-zinc-700">{item.inspector || '-'}</td>
                              <td className="p-2 sm:p-3 text-slate-600 dark:text-slate-400 max-w-xs truncate border border-slate-300 dark:border-zinc-700" title={item.remark}>{item.remark || '-'}</td>
                              <td className="p-2 sm:p-3 text-center border border-slate-300 dark:border-zinc-700">
                                {item.documentUrl ? (
                                  <a
                                    href={formatToPreviewUrl(item.documentUrl)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-bold transition-colors shadow-sm shadow-blue-500/20"
                                  >
                                    <span className="material-symbols-outlined text-[13px]">open_in_new</span>
                                    View PDF
                                  </a>
                                ) : (
                                  <span className="text-[9px] sm:text-[10px] text-slate-400 italic">No PDF</span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* VIEW 2: FIRE EXTINGUISHER INSPECTION & EQUIPMENT REGISTER */}
          {/* ========================================================================= */}
          {activeTab === 'fireExtinguisher' && (
            <div>
              {/* Controls Header */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-4">
                {/* Search Bar */}
                <div className="relative flex-1">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
                    search
                  </span>
                  <input
                    type="text"
                    value={searchQueryFE}
                    onChange={(e) => setSearchQueryFE(e.target.value)}
                    placeholder="SEARCH BY LOCATION, BRAND, SERIAL NO, EXPIRY DATE, REMARKS..."
                    className="w-full pl-9 pr-9 py-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs sm:text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-red-500 shadow-sm"
                  />
                  {searchQueryFE && (
                    <button
                      type="button"
                      onClick={() => setSearchQueryFE('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded-full"
                      title="Clear search"
                    >
                      <span className="material-symbols-outlined text-base">close</span>
                    </button>
                  )}
                </div>

                {/* Download Excel Button */}
                <button
                  onClick={handleExportFireExtinguisherExcel}
                  className="px-3.5 py-2.5 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/60 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm flex-shrink-0"
                  title="Download Fire Extinguisher Records to Excel (.xlsx)"
                >
                  <span className="material-symbols-outlined text-base">download</span>
                  <span>Download Excel</span>
                </button>
              </div>

              {loadingFireExtinguisher ? (
                <div className="p-12 text-center flex flex-col items-center justify-center gap-3">
                  <span className="material-symbols-outlined text-3xl text-red-500 animate-spin">sync</span>
                  <span className="text-xs text-slate-500 font-semibold uppercase">Loading Fire Extinguisher Data from Sheet...</span>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-300 dark:border-zinc-700 shadow-sm">
                  <table className="w-full border-collapse border border-slate-300 dark:border-zinc-700 text-left text-xs sm:text-sm text-slate-800 dark:text-slate-200">
                    {/* Primary Table Head (Row 2 in Google Sheet) */}
                    <thead className="bg-slate-200 dark:bg-zinc-800 text-slate-900 dark:text-white uppercase border-b-2 border-slate-400 dark:border-zinc-700">
                      <tr>
                        <th className="p-2 sm:p-3 border border-slate-300 dark:border-zinc-700 font-extrabold tracking-wider text-center w-12">NO</th>
                        <th className="p-2 sm:p-3 border border-slate-300 dark:border-zinc-700 font-extrabold tracking-wider">LOCATION</th>
                        <th className="p-2 sm:p-3 border border-slate-300 dark:border-zinc-700 font-extrabold tracking-wider text-center">TYPE ABC</th>
                        <th className="p-2 sm:p-3 border border-slate-300 dark:border-zinc-700 font-extrabold tracking-wider text-center">TYPE CO2</th>
                        <th className="p-2 sm:p-3 border border-slate-300 dark:border-zinc-700 font-extrabold tracking-wider">BRAND</th>
                        <th className="p-2 sm:p-3 border border-slate-300 dark:border-zinc-700 font-extrabold tracking-wider">SERIAL NUMBER</th>
                        <th className="p-2 sm:p-3 border border-slate-300 dark:border-zinc-700 font-extrabold tracking-wider text-center">MONTH</th>
                        <th className="p-2 sm:p-3 border border-slate-300 dark:border-zinc-700 font-extrabold tracking-wider text-center">YEAR</th>
                        <th className="p-2 sm:p-3 border border-slate-300 dark:border-zinc-700 font-extrabold tracking-wider">CERT EXPIRY DATE</th>
                        <th className="p-2 sm:p-3 border border-slate-300 dark:border-zinc-700 font-extrabold tracking-wider">REMARKS 2026</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-300 dark:divide-zinc-700 bg-white dark:bg-zinc-900/60">
                      {filteredFEData.length === 0 ? (
                        <tr>
                          <td colSpan={10} className="p-4 text-center text-slate-400 border border-slate-300 dark:border-zinc-700">
                            No fire extinguisher records found matching "{searchQueryFE}"
                          </td>
                        </tr>
                      ) : (
                        filteredFEData.map((item) => {
                          // Check if row 2 or row 19 (Header Rows)
                          if (item.isHeader) {
                            return (
                              <tr 
                                key={item.id}
                                className="bg-slate-200 dark:bg-zinc-800 text-slate-900 dark:text-white font-extrabold uppercase tracking-wider text-[11px] sm:text-xs border-y-2 border-slate-400 dark:border-zinc-600 shadow-sm"
                              >
                                <td className="p-2 sm:p-3 text-center font-black border border-slate-300 dark:border-zinc-600">{item.no || '—'}</td>
                                <td className="p-2 sm:p-3 font-black border border-slate-300 dark:border-zinc-600">{item.location || 'LOCATION'}</td>
                                <td className="p-2 sm:p-3 text-center font-black border border-slate-300 dark:border-zinc-600">{item.typeABC || 'TYPE ABC'}</td>
                                <td className="p-2 sm:p-3 text-center font-black border border-slate-300 dark:border-zinc-600">{item.typeCO2 || 'TYPE CO2'}</td>
                                <td className="p-2 sm:p-3 font-black border border-slate-300 dark:border-zinc-600">{item.brand || 'BRAND'}</td>
                                <td className="p-2 sm:p-3 font-black border border-slate-300 dark:border-zinc-600">{item.serialNumber || 'SERIAL NUMBER'}</td>
                                <td className="p-2 sm:p-3 text-center font-black border border-slate-300 dark:border-zinc-600">{item.month || 'MONTH'}</td>
                                <td className="p-2 sm:p-3 text-center font-black border border-slate-300 dark:border-zinc-600">{item.year || 'YEAR'}</td>
                                <td className="p-2 sm:p-3 font-black border border-slate-300 dark:border-zinc-600">{item.certExpiryDate || 'CERT EXPIRY DATE'}</td>
                                <td className="p-2 sm:p-3 font-black border border-slate-300 dark:border-zinc-600">{item.remarks || 'REMARKS 2026'}</td>
                              </tr>
                            );
                          }

                          const isSelected = selectedFEId === item.id;
                          const hasRemarks = Boolean(item.remarks && item.remarks.trim() !== '');

                          return (
                            <tr
                              key={item.id}
                              onClick={() => setSelectedFEId(isSelected ? null : item.id)}
                              className={`transition-colors cursor-pointer ${
                                isSelected
                                  ? 'bg-slate-200/80 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold'
                                  : 'hover:bg-slate-50 dark:hover:bg-zinc-800/60'
                              }`}
                            >
                              {/* NO */}
                              <td className="p-2 sm:p-3 text-center font-mono font-semibold text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-zinc-700">
                                {item.no || '-'}
                              </td>

                              {/* LOCATION */}
                              <td className="p-2 sm:p-3 font-bold text-slate-900 dark:text-white border border-slate-300 dark:border-zinc-700">
                                <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 font-bold text-xs sm:text-sm">
                                  {item.location || '-'}
                                </span>
                              </td>

                              {/* TYPE ABC */}
                              <td className="p-2 sm:p-3 text-center border border-slate-300 dark:border-zinc-700">
                                {item.typeABC && item.typeABC.trim() !== '' ? (
                                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 font-black text-xs">
                                    ✓
                                  </span>
                                ) : (
                                  <span className="text-slate-300 dark:text-zinc-700 font-mono">-</span>
                                )}
                              </td>

                              {/* TYPE CO2 */}
                              <td className="p-2 sm:p-3 text-center border border-slate-300 dark:border-zinc-700">
                                {item.typeCO2 && item.typeCO2.trim() !== '' ? (
                                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-black text-xs">
                                    ✓
                                  </span>
                                ) : (
                                  <span className="text-slate-300 dark:text-zinc-700 font-mono">-</span>
                                )}
                              </td>

                              {/* BRAND */}
                              <td className="p-2 sm:p-3 font-bold text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-zinc-700">
                                {item.brand ? (
                                  <span className="font-semibold text-slate-800 dark:text-zinc-200">
                                    {item.brand}
                                  </span>
                                ) : (
                                  <span className="text-slate-400">-</span>
                                )}
                              </td>

                              {/* SERIAL NUMBER */}
                              <td className="p-2 sm:p-3 font-mono text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-zinc-700">
                                {item.serialNumber || '-'}
                              </td>

                              {/* MONTH */}
                              <td className="p-2 sm:p-3 text-center font-mono text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-zinc-700">
                                {item.month || '-'}
                              </td>

                              {/* YEAR */}
                              <td className="p-2 sm:p-3 text-center font-mono font-semibold text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-zinc-700">
                                {item.year || '-'}
                              </td>

                              {/* CERT EXPIRY DATE */}
                              <td className="p-2 sm:p-3 whitespace-nowrap font-mono font-bold text-red-600 dark:text-red-400 border border-slate-300 dark:border-zinc-700">
                                {item.certExpiryDate || '-'}
                              </td>

                              {/* REMARKS */}
                              <td className="p-2 sm:p-3 border border-slate-300 dark:border-zinc-700">
                                {hasRemarks ? (
                                  <span className="px-2 py-1 rounded bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 font-semibold text-[10px] block">
                                    {item.remarks}
                                  </span>
                                ) : (
                                  <span className="text-slate-400 italic text-[10px]">-</span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/80 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-white font-bold text-xs transition-colors shadow-sm"
          >
            Close Records
          </button>
        </div>

      </div>
    </div>
  );
};
