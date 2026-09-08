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
  const [incidents, setIncidents] = useState<IncidentRecord[]>(MOCK_INCIDENT_RECORDS);
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [source, setSource] = useState<'Google Sheets Live' | 'Local Cache Fallback'>('Google Sheets Live');
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);

  const fetchIncidents = async () => {
    setIsRefreshing(true);
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
      setIsRefreshing(false);
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
    if (!inc) return false;
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    
    const id = String(inc.id || '');
    const date = String(inc.date || '');
    const year = String(inc.year || '');
    const location = String(inc.location || '');
    const desc = String((inc as any).rootCause || inc.description || (inc as any).root_cause || '');
    const occupationalIncident = String(inc.occupationalIncident || '');
    const category = String(inc.category || '');
    const propertyDamage = String(inc.propertyDamage || '');
    const damageLevel = String(inc.damageLevel || '');
    const classification = String(inc.classification || '');
    const injuryType = String(inc.injuryType || '');
    const person = String(inc.personInvolved || (inc as any).person_involved || '');
    const experienceLevel = String(inc.experienceLevel || '');
    const reported = String(inc.reportedBy || (inc as any).investigator || '');
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
      <div className="glass-card p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToHome}
            className="p-2 rounded-xl bg-slate-800 text-white hover:bg-slate-700 transition-colors border border-cyan-500/20 flex-shrink-0"
          >
            <span className="material-symbols-outlined text-xl">arrow_back</span>
          </button>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-cyan-400">database</span>
              <span>ALL INCIDENT RECORDS</span>
            </h2>
          </div>
        </div>
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full sm:w-auto">
          <button
            onClick={handleGeneratePdfReport}
            disabled={isGeneratingPdf}
            className="flex-1 sm:flex-none justify-center px-3 sm:px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold text-xs flex items-center gap-1.5 transition-all border border-red-700 shadow-sm disabled:opacity-50 cursor-pointer whitespace-nowrap"
            title="Generate comprehensive 7-section incident analytics PDF report with charts"
          >
            <span className={`material-symbols-outlined text-base ${isGeneratingPdf ? 'animate-spin' : ''}`}>
              {isGeneratingPdf ? 'sync' : 'picture_as_pdf'}
            </span>
            <span>{isGeneratingPdf ? 'Generating...' : 'PDF Report'}</span>
          </button>
          <button
            onClick={handleDownloadExcel}
            className="flex-1 sm:flex-none justify-center px-3 sm:px-4 py-2 rounded-xl bg-[#107C41] hover:bg-[#0e6b37] text-white font-bold text-xs flex items-center gap-1.5 transition-all border border-[#107C41] shadow-sm whitespace-nowrap"
          >
            <span className="material-symbols-outlined text-base">download</span>
            <span>Download Excel</span>
          </button>
          <button
            onClick={handleLoadLiveData}
            disabled={isRefreshing}
            className="flex-1 sm:flex-none justify-center px-3 sm:px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 font-bold text-xs flex items-center gap-1.5 transition-all border border-cyan-500/30 whitespace-nowrap"
          >
            <span className={`material-symbols-outlined text-base ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`}>
              sync
            </span>
            <span>Refresh</span>
          </button>
        </div>
      </div>

      <div className="glass-card flex flex-col min-h-[460px]">
        {/* Toolbar & Filter Bar */}
        <div className="p-3.5 sm:p-4 border-b border-cyan-500/20 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/60">
          <div className="relative w-full sm:w-96">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
              search
            </span>
            <input
              type="text"
              placeholder="Search ID, Location, Category, Description, Person..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-400 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5 rounded-full"
                title="Clear search"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            )}
          </div>
          <div className="text-xs font-medium text-white">
            {searchQuery.trim() ? (
              <span>Found <strong className="text-cyan-400">{filteredIncidents.length}</strong> matching records (Total {incidents.length})</span>
            ) : (
              <span>Total <strong className="text-cyan-400">{incidents.length}</strong> incident records</span>
            )}
          </div>
        </div>

        {/* Table Content */}
        <div className="flex-1 overflow-auto p-0 sm:p-3.5 bg-transparent">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 text-white">
              <span className="material-symbols-outlined text-4xl text-cyan-400 animate-spin">
                sync
              </span>
            </div>
          ) : filteredIncidents.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-white space-y-2">
              <span className="material-symbols-outlined text-4xl text-slate-400">folder_off</span>
              <p className="text-sm font-bold text-white">No incident records found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto sm:rounded-xl border-y sm:border border-cyan-500/20">
              <table className="w-full border-collapse border border-cyan-500/20 text-left text-xs sm:text-sm whitespace-nowrap bg-transparent">
                <thead className="bg-slate-950/95 text-cyan-400 border-b-2 border-cyan-500/40">
                  <tr className="h-8">
                    <th className="w-14 py-1.5 px-3 border border-cyan-500/20 font-bold uppercase text-xs tracking-wider whitespace-nowrap text-center text-cyan-400">NO</th>
                    <th className="w-28 py-1.5 px-3 border border-cyan-500/20 font-bold uppercase text-xs tracking-wider whitespace-nowrap text-center text-cyan-400">DATE</th>
                    <th className="w-20 py-1.5 px-3 border border-cyan-500/20 font-bold uppercase text-xs tracking-wider whitespace-nowrap text-center text-cyan-400">YEAR</th>
                    <th className="min-w-[130px] py-1.5 px-3 border border-cyan-500/20 font-bold uppercase text-xs tracking-wider text-cyan-400">LOCATION</th>
                    <th className="min-w-[220px] py-1.5 px-3 border border-cyan-500/20 font-bold uppercase text-xs tracking-wider text-cyan-400">DESCRIPTION</th>
                    <th className="w-36 py-1.5 px-3 border border-cyan-500/20 font-bold uppercase text-xs tracking-wider whitespace-nowrap text-center text-cyan-400">OCCUPATIONAL INCIDENT?</th>
                    <th className="min-w-[140px] py-1.5 px-3 border border-cyan-500/20 font-bold uppercase text-xs tracking-wider text-cyan-400">INCIDENT CATEGORY</th>
                    <th className="w-32 py-1.5 px-3 border border-cyan-500/20 font-bold uppercase text-xs tracking-wider whitespace-nowrap text-center text-cyan-400">PROPERTY DAMAGE</th>
                    <th className="w-28 py-1.5 px-3 border border-cyan-500/20 font-bold uppercase text-xs tracking-wider whitespace-nowrap text-cyan-400">DAMAGE LEVEL</th>
                    <th className="min-w-[140px] py-1.5 px-3 border border-cyan-500/20 font-bold uppercase text-xs tracking-wider text-cyan-400">CLASSIFICATION</th>
                    <th className="min-w-[120px] py-1.5 px-3 border border-cyan-500/20 font-bold uppercase text-xs tracking-wider text-cyan-400">INJURY TYPE</th>
                    <th className="min-w-[120px] py-1.5 px-3 border border-cyan-500/20 font-bold uppercase text-xs tracking-wider text-cyan-400">PERSON INVOLVE</th>
                    <th className="w-32 py-1.5 px-3 border border-cyan-500/20 font-bold uppercase text-xs tracking-wider whitespace-nowrap text-cyan-400">WORK EXPERIENCE</th>
                    <th className="min-w-[110px] py-1.5 px-3 border border-cyan-500/20 font-bold uppercase text-xs tracking-wider text-cyan-400">REPORTED BY</th>
                    <th className="w-28 py-1.5 px-3 border border-cyan-500/20 font-bold uppercase text-xs tracking-wider text-center whitespace-nowrap text-cyan-400">PDF</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cyan-500/10 text-white text-xs sm:text-sm">
                  {filteredIncidents.map((inc) => {
                    const isSelected = selectedRowId === inc.id;
                    return (
                      <tr 
                        key={inc.id} 
                        onClick={() => setSelectedRowId(isSelected ? null : inc.id)}
                        className={`h-9 transition-colors cursor-pointer select-none ${
                          isSelected 
                            ? '!bg-cyan-600 !text-white font-bold [&>td]:!bg-cyan-600 [&>td]:!text-white [&>td]:!border-cyan-400/40 [&_*]:!text-white shadow-md' 
                            : 'hover:bg-cyan-950/40 active:bg-slate-700/60'
                        }`}
                      >
                      {/* 1. NO */}
                      <td className="py-1 px-3 font-mono font-medium text-white whitespace-nowrap border border-cyan-500/20 text-center leading-none">
                        {inc.id}
                      </td>
                      {/* 2. DATE */}
                      <td className="py-1 px-3 whitespace-nowrap text-white border border-cyan-500/20 text-center leading-none">
                        {inc.date}
                      </td>
                      {/* 3. YEAR */}
                      <td className="py-1 px-3 whitespace-nowrap text-white border border-cyan-500/20 text-center leading-none">
                        {inc.year || '-'}
                      </td>
                      {/* 4. LOCATION */}
                      <td className="py-1 px-3 font-medium text-white whitespace-nowrap border border-cyan-500/20 leading-none">
                        {inc.location}
                      </td>
                      {/* 5. DESCRIPTION */}
                      <td className="py-1 px-3 text-white max-w-[240px] truncate border border-cyan-500/20 leading-none" title={(inc as any).rootCause || inc.description || (inc as any).root_cause || ''}>
                        {(inc as any).rootCause || inc.description || (inc as any).root_cause || '-'}
                      </td>
                      {/* 6. OCCUPATIONAL INCIDENT? */}
                      <td className="py-1 px-3 text-center whitespace-nowrap border border-cyan-500/20 leading-none">
                        <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded text-[11px] font-semibold uppercase leading-tight ${
                          inc.occupationalIncident?.toUpperCase() === 'YES'
                            ? 'bg-emerald-500/20 text-white border border-emerald-500/30'
                            : 'bg-slate-800 text-white border border-cyan-500/20'
                        }`}>
                          {inc.occupationalIncident || '-'}
                        </span>
                      </td>
                      {/* 7. INCIDENT CATEGORY */}
                      <td className="py-1 px-3 whitespace-nowrap border border-cyan-500/20 leading-none">
                        <span className="inline-flex items-center justify-center px-2 py-0.5 rounded bg-slate-800 text-white border border-slate-700 text-[11px] font-medium leading-tight">
                          {inc.category || '-'}
                        </span>
                      </td>
                      {/* 8. PROPERTY DAMAGE */}
                      <td className="py-1 px-3 text-center whitespace-nowrap font-medium text-white border border-cyan-500/20 leading-none">
                        {inc.propertyDamage || '-'}
                      </td>
                      {/* 9. DAMAGE LEVEL */}
                      <td className="py-1 px-3 whitespace-nowrap text-white border border-cyan-500/20 leading-none">
                        {inc.damageLevel || '-'}
                      </td>
                      {/* 10. CLASSIFICATION */}
                      <td className="py-1 px-3 font-medium text-white whitespace-nowrap border border-cyan-500/20 leading-none">
                        {inc.classification || '-'}
                      </td>
                      {/* 11. INJURY TYPE */}
                      <td className="py-1 px-3 text-white whitespace-nowrap border border-cyan-500/20 leading-none">
                        {inc.injuryType || '-'}
                      </td>
                      {/* 12. PERSON INVOLVE */}
                      <td className="py-1 px-3 font-medium text-white whitespace-nowrap border border-cyan-500/20 leading-none">
                        {inc.personInvolved || (inc as any).person_involved || '-'}
                      </td>
                      {/* 13. WORK EXPERIENCE */}
                      <td className="py-1 px-3 text-white whitespace-nowrap border border-cyan-500/20 leading-none">
                        {inc.experienceLevel || '-'}
                      </td>
                      {/* 14. REPORTED BY */}
                      <td className="py-1 px-3 text-white whitespace-nowrap border border-cyan-500/20 leading-none">
                        {inc.reportedBy || (inc as any).investigator || '-'}
                      </td>
                      {/* 15. PDF / DOCUMENT */}
                      <td className="py-1 px-3 text-center whitespace-nowrap border border-cyan-500/20 leading-none">
                         {(inc as any).documentUrl && (inc as any).documentUrl !== '-' && (inc as any).documentUrl !== '' ? (
                           <a 
                             href={formatToPreviewUrl((inc as any).documentUrl)} 
                             target="_blank" 
                             rel="noopener noreferrer" 
                             onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center justify-center px-2.5 py-0.5 text-[11px] font-semibold rounded bg-slate-800 text-white border border-slate-700 hover:bg-slate-700 transition-colors leading-tight"
                          >
                            Open Doc</a>
                         ) : (
                           <span className="text-slate-400">-</span>
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
        <div className="p-4 sm:px-6 py-3 border-t border-cyan-500/20 bg-slate-900/60 flex items-center justify-between text-xs text-white rounded-b-2xl sm:rounded-b-3xl">
          <div>
            Showing <strong className="text-white">{filteredIncidents.length}</strong> of <strong className="text-white">{incidents.length}</strong> records
          </div>
        </div>
      </div>
    </div>
  );
};
