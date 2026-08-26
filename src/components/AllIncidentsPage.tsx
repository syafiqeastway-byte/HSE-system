import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { IncidentRecord } from '../types';
import { MOCK_INCIDENT_RECORDS } from '../data/mockData';
import { fetchLiveIncidentRecords } from '../utils/gasBridge';
import { formatToPreviewUrl } from '../utils/formatDriveUrl';
import { generateIncidentFullAnalyticsReport } from '../utils/incidentReportPdfGenerator';

interface AllIncidentsPageProps {
  onBackToHome: () => void;
  isDarkMode: boolean;
}

export const AllIncidentsPage: React.FC<AllIncidentsPageProps> = ({ onBackToHome, isDarkMode }) => {
  const [incidents, setIncidents] = useState<IncidentRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [source, setSource] = useState<'Google Sheets Live' | 'Local Cache Fallback'>('Google Sheets Live');
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);

  const fetchIncidents = async () => {
    setLoading(true);
    try {
      const data = await fetchLiveIncidentRecords();
      if (data && data.length > 0) {
        setIncidents(data as IncidentRecord[]);
        setSource('Google Sheets Live');
      } else {
        setIncidents(MOCK_INCIDENT_RECORDS);
        setSource('Local Cache Fallback');
      }
    } catch (err) {
      console.warn('Error fetching live incidents:', err);
      setIncidents(MOCK_INCIDENT_RECORDS);
      setSource('Local Cache Fallback');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadLiveData = () => {
    fetchIncidents();
  };

  const handleDownloadExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filteredIncidents);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Incidents");
    XLSX.writeFile(wb, "Incident_Records.xlsx");
  };

  const handleGeneratePdfReport = async () => {
    if (isGeneratingPdf) return;
    setIsGeneratingPdf(true);
    try {
      const recordsToAnalyze = filteredIncidents.length > 0 ? filteredIncidents : incidents;
      await generateIncidentFullAnalyticsReport(recordsToAnalyze);
    } catch (error) {
      console.error('Failed to generate PDF Report:', error);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, []);

  const filteredIncidents = incidents.filter(inc => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    
    const id = inc.id || '';
    const date = inc.date || '';
    const year = inc.year || '';
    const location = inc.location || '';
    const desc = (inc as any).rootCause || inc.description || (inc as any).root_cause || '';
    const occupationalIncident = inc.occupationalIncident || '';
    const category = inc.category || '';
    const propertyDamage = inc.propertyDamage || '';
    const damageLevel = inc.damageLevel || '';
    const classification = inc.classification || '';
    const injuryType = inc.injuryType || '';
    const person = inc.personInvolved || (inc as any).person_involved || '';
    const experienceLevel = inc.experienceLevel || '';
    const reported = inc.reportedBy || (inc as any).investigator || '';
    return (
      id.toLowerCase().includes(query) ||
      date.toLowerCase().includes(query) ||
      year.toLowerCase().includes(query) ||
      location.toLowerCase().includes(query) ||
      desc.toLowerCase().includes(query) ||
      occupationalIncident.toLowerCase().includes(query) ||
      category.toLowerCase().includes(query) ||
      propertyDamage.toLowerCase().includes(query) ||
      damageLevel.toLowerCase().includes(query) ||
      classification.toLowerCase().includes(query) ||
      injuryType.toLowerCase().includes(query) ||
      person.toLowerCase().includes(query) ||
      experienceLevel.toLowerCase().includes(query) ||
      reported.toLowerCase().includes(query) 
    );
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="glass-card p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToHome}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <span className="material-symbols-outlined text-xl">arrow_back</span>
          </button>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-blue-600 dark:text-blue-400">database</span>
              ALL INCIDENT RECORDS
            </h2>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleGeneratePdfReport}
            disabled={isGeneratingPdf}
            className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold text-xs flex items-center gap-2 transition-all border border-red-700 shadow-sm disabled:opacity-50 cursor-pointer"
            title="Generate comprehensive 7-section incident analytics PDF report with charts"
          >
            <span className={`material-symbols-outlined text-base ${isGeneratingPdf ? 'animate-spin' : ''}`}>
              {isGeneratingPdf ? 'sync' : 'picture_as_pdf'}
            </span>
            <span>{isGeneratingPdf ? 'Generating PDF...' : 'PDF Report'}</span>
          </button>
          <button
            onClick={handleDownloadExcel}
            className="px-4 py-2 rounded-xl bg-[#217346] hover:bg-[#1b5e39] text-white font-bold text-xs flex items-center gap-2 transition-all border border-[#1b5e39] shadow-sm"
          >
            <span className="material-symbols-outlined text-base">download</span>
            <span>Download Excel</span>
          </button>
          <button
            onClick={handleLoadLiveData}
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-2 transition-all border border-slate-200 dark:border-slate-700"
          >
            <span className={`material-symbols-outlined text-base ${loading ? 'animate-spin text-blue-500' : ''}`}>
              sync
            </span>
            <span>Refresh</span>
          </button>
        </div>
      </div>

      <div className="glass-card flex flex-col min-h-[500px]">
        {/* Toolbar & Filter Bar */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-96">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
              search
            </span>
            <input
              type="text"
              placeholder="Search ID, Location, Category, Description, Person..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded-full"
                title="Clear search"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            )}
          </div>
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {searchQuery.trim() ? (
              <span>Found <strong className="text-blue-600 dark:text-blue-400">{filteredIncidents.length}</strong> matching records (Total {incidents.length})</span>
            ) : (
              <span>Total <strong className="text-slate-800 dark:text-slate-200">{incidents.length}</strong> incident records</span>
            )}
          </div>
        </div>

        {/* Table Content */}
        <div className="flex-1 overflow-auto p-0 sm:p-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-500 dark:text-slate-400">
              <span className="material-symbols-outlined text-4xl text-blue-500 animate-spin">
                sync
              </span>
            </div>
          ) : filteredIncidents.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-500 space-y-2">
              <span className="material-symbols-outlined text-4xl">folder_off</span>
              <p className="text-sm font-bold">No incident records found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto sm:rounded-xl border-y sm:border border-slate-200 dark:border-slate-800">
              <table className="w-full border-collapse border border-slate-300 dark:border-zinc-700 text-left text-xs sm:text-sm whitespace-nowrap">
                <thead className="bg-slate-100 dark:bg-zinc-800/80 text-slate-800 dark:text-zinc-100">
                  <tr className="h-8 border-b border-slate-300 dark:border-zinc-700">
                    <th className="w-14 py-1 px-3 border border-slate-300 dark:border-zinc-700 font-bold uppercase text-xs tracking-wider whitespace-nowrap text-center">NO</th>
                    <th className="w-28 py-1 px-3 border border-slate-300 dark:border-zinc-700 font-bold uppercase text-xs tracking-wider whitespace-nowrap text-center">DATE</th>
                    <th className="w-20 py-1 px-3 border border-slate-300 dark:border-zinc-700 font-bold uppercase text-xs tracking-wider whitespace-nowrap text-center">YEAR</th>
                    <th className="min-w-[130px] py-1 px-3 border border-slate-300 dark:border-zinc-700 font-bold uppercase text-xs tracking-wider">LOCATION</th>
                    <th className="min-w-[220px] py-1 px-3 border border-slate-300 dark:border-zinc-700 font-bold uppercase text-xs tracking-wider">DESCRIPTION</th>
                    <th className="w-36 py-1 px-3 border border-slate-300 dark:border-zinc-700 font-bold uppercase text-xs tracking-wider whitespace-nowrap text-center">OCCUPATIONAL INCIDENT?</th>
                    <th className="min-w-[140px] py-1 px-3 border border-slate-300 dark:border-zinc-700 font-bold uppercase text-xs tracking-wider">INCIDENT CATEGORY</th>
                    <th className="w-32 py-1 px-3 border border-slate-300 dark:border-zinc-700 font-bold uppercase text-xs tracking-wider whitespace-nowrap text-center">PROPERTY DAMAGE</th>
                    <th className="w-28 py-1 px-3 border border-slate-300 dark:border-zinc-700 font-bold uppercase text-xs tracking-wider whitespace-nowrap">DAMAGE LEVEL</th>
                    <th className="min-w-[140px] py-1 px-3 border border-slate-300 dark:border-zinc-700 font-bold uppercase text-xs tracking-wider">CLASSIFICATION</th>
                    <th className="min-w-[120px] py-1 px-3 border border-slate-300 dark:border-zinc-700 font-bold uppercase text-xs tracking-wider">INJURY TYPE</th>
                    <th className="min-w-[120px] py-1 px-3 border border-slate-300 dark:border-zinc-700 font-bold uppercase text-xs tracking-wider">PERSON INVOLVE</th>
                    <th className="w-32 py-1 px-3 border border-slate-300 dark:border-zinc-700 font-bold uppercase text-xs tracking-wider whitespace-nowrap">WORK EXPERIENCE</th>
                    <th className="min-w-[110px] py-1 px-3 border border-slate-300 dark:border-zinc-700 font-bold uppercase text-xs tracking-wider">REPORTED BY</th>
                    <th className="w-28 py-1 px-3 border border-slate-300 dark:border-zinc-700 font-bold uppercase text-xs tracking-wider text-center whitespace-nowrap">PDF</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 bg-white dark:bg-transparent text-slate-700 dark:text-slate-300 text-xs sm:text-sm">
                  {filteredIncidents.map((inc) => {
                    const isSelected = selectedRowId === inc.id;
                    return (
                      <tr 
                        key={inc.id} 
                        onClick={() => setSelectedRowId(isSelected ? null : inc.id)}
                        className={`h-9 transition-colors cursor-pointer ${
                          isSelected 
                            ? 'bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold shadow-inner' 
                            : 'hover:bg-slate-100 dark:hover:bg-slate-800/80 active:bg-slate-200 dark:active:bg-slate-700/60'
                        }`}
                      >
                      {/* 1. NO */}
                      <td className="py-1 px-3 font-mono font-medium text-blue-600 dark:text-blue-400 whitespace-nowrap border border-slate-300 dark:border-zinc-700 text-center leading-none">
                        {inc.id}
                      </td>
                      {/* 2. DATE */}
                      <td className="py-1 px-3 whitespace-nowrap text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-zinc-700 text-center leading-none">
                        {inc.date}
                      </td>
                      {/* 3. YEAR */}
                      <td className="py-1 px-3 whitespace-nowrap text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-zinc-700 text-center leading-none">
                        {inc.year || '-'}
                      </td>
                      {/* 4. LOCATION */}
                      <td className="py-1 px-3 font-medium text-slate-900 dark:text-slate-200 whitespace-nowrap border border-slate-300 dark:border-zinc-700 leading-none">
                        {inc.location}
                      </td>
                      {/* 5. DESCRIPTION */}
                      <td className="py-1 px-3 text-slate-700 dark:text-slate-300 max-w-[240px] truncate border border-slate-300 dark:border-zinc-700 leading-none" title={(inc as any).rootCause || inc.description || (inc as any).root_cause || ''}>
                        {(inc as any).rootCause || inc.description || (inc as any).root_cause || '-'}
                      </td>
                      {/* 6. OCCUPATIONAL INCIDENT? */}
                      <td className="py-1 px-3 text-center whitespace-nowrap border border-slate-300 dark:border-zinc-700 leading-none">
                        <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded text-[11px] font-semibold uppercase leading-tight ${
                          inc.occupationalIncident?.toUpperCase() === 'YES'
                            ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}>
                          {inc.occupationalIncident || '-'}
                        </span>
                      </td>
                      {/* 7. INCIDENT CATEGORY */}
                      <td className="py-1 px-3 whitespace-nowrap border border-slate-300 dark:border-zinc-700 leading-none">
                        <span className="inline-flex items-center justify-center px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-[11px] font-medium leading-tight">
                          {inc.category || '-'}
                        </span>
                      </td>
                      {/* 8. PROPERTY DAMAGE */}
                      <td className="py-1 px-3 text-center whitespace-nowrap font-medium border border-slate-300 dark:border-zinc-700 leading-none">
                        {inc.propertyDamage || '-'}
                      </td>
                      {/* 9. DAMAGE LEVEL */}
                      <td className="py-1 px-3 whitespace-nowrap text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-zinc-700 leading-none">
                        {inc.damageLevel || '-'}
                      </td>
                      {/* 10. CLASSIFICATION */}
                      <td className="py-1 px-3 font-medium text-slate-800 dark:text-slate-200 whitespace-nowrap border border-slate-300 dark:border-zinc-700 leading-none">
                        {inc.classification || '-'}
                      </td>
                      {/* 11. INJURY TYPE */}
                      <td className="py-1 px-3 text-slate-700 dark:text-slate-300 whitespace-nowrap border border-slate-300 dark:border-zinc-700 leading-none">
                        {inc.injuryType || '-'}
                      </td>
                      {/* 12. PERSON INVOLVE */}
                      <td className="py-1 px-3 font-medium text-slate-800 dark:text-slate-200 whitespace-nowrap border border-slate-300 dark:border-zinc-700 leading-none">
                        {inc.personInvolved || (inc as any).person_involved || '-'}
                      </td>
                      {/* 13. WORK EXPERIENCE */}
                      <td className="py-1 px-3 text-slate-700 dark:text-slate-300 whitespace-nowrap border border-slate-300 dark:border-zinc-700 leading-none">
                        {inc.experienceLevel || '-'}
                      </td>
                      {/* 14. REPORTED BY */}
                      <td className="py-1 px-3 text-slate-700 dark:text-slate-300 whitespace-nowrap border border-slate-300 dark:border-zinc-700 leading-none">
                        {inc.reportedBy || (inc as any).investigator || '-'}
                      </td>
                      {/* 15. PDF / DOCUMENT */}
                      <td className="py-1 px-3 text-center whitespace-nowrap border border-slate-300 dark:border-zinc-700 leading-none">
                         {(inc as any).documentUrl && (inc as any).documentUrl !== '-' && (inc as any).documentUrl !== '' ? (
                           <a 
                             href={formatToPreviewUrl((inc as any).documentUrl)} 
                             target="_blank" 
                             rel="noopener noreferrer" 
                             onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center justify-center px-2.5 py-0.5 text-[11px] font-semibold rounded bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors leading-tight"
                          >
                            Open Doc</a>
                         ) : (
                           <span className="text-slate-400 dark:text-slate-600">-</span>
                         )}
                      </td>
                    </tr>
                  );
                })}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="p-4 sm:px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 rounded-b-2xl sm:rounded-b-3xl">
          <div>
            Showing <strong className="text-slate-700 dark:text-white">{filteredIncidents.length}</strong> of <strong className="text-slate-700 dark:text-white">{incidents.length}</strong> records
          </div>
        </div>
      </div>
    </div>
  );
};
