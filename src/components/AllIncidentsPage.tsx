import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { IncidentRecord } from '../types';
import { MOCK_INCIDENT_RECORDS } from '../data/mockData';
import { fetchLiveIncidentRecords } from '../utils/gasBridge';
import { formatToPreviewUrl } from '../utils/formatDriveUrl';

interface AllIncidentsPageProps {
  onBackToHome: () => void;
  isDarkMode: boolean;
}

export const AllIncidentsPage: React.FC<AllIncidentsPageProps> = ({ onBackToHome, isDarkMode }) => {
  const [incidents, setIncidents] = useState<IncidentRecord[]>([]);
  const [loading, setLoading] = useState(false);
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
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-blue-600 dark:text-blue-400">database</span>
              ALL INCIDENT RECORDS
            </h2>
          </div>
        </div>
        <div className="flex items-center gap-2">
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
              placeholder="Search ID, Location, Category, Description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
            />
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
                  <tr className="border-b border-slate-300 dark:border-zinc-700">
                    <th className="py-1.5 px-2 sm:py-3 sm:px-3 border border-slate-300 dark:border-zinc-700 font-extrabold text-xs sm:text-sm tracking-wider whitespace-nowrap text-center">NO</th>
                    <th className="py-1.5 px-2 sm:py-3 sm:px-3 border border-slate-300 dark:border-zinc-700 font-extrabold text-xs sm:text-sm tracking-wider whitespace-nowrap text-center">DATE</th>
                    <th className="py-1.5 px-2 sm:py-3 sm:px-3 border border-slate-300 dark:border-zinc-700 font-extrabold text-xs sm:text-sm tracking-wider whitespace-nowrap text-center">YEAR</th>
                    <th className="py-1.5 px-2 sm:py-3 sm:px-3 border border-slate-300 dark:border-zinc-700 font-extrabold text-xs sm:text-sm tracking-wider min-w-[120px]">LOCATION</th>
                    <th className="py-1.5 px-2 sm:py-3 sm:px-3 border border-slate-300 dark:border-zinc-700 font-extrabold text-xs sm:text-sm tracking-wider min-w-[200px]">DESCRIPTION</th>
                    <th className="py-1.5 px-2 sm:py-3 sm:px-3 border border-slate-300 dark:border-zinc-700 font-extrabold text-xs sm:text-sm tracking-wider whitespace-nowrap text-center">OCCUPATIONAL INCIDENT?</th>
                    <th className="py-1.5 px-2 sm:py-3 sm:px-3 border border-slate-300 dark:border-zinc-700 font-extrabold text-xs sm:text-sm tracking-wider min-w-[140px]">INCIDENT CATEGORY</th>
                    <th className="py-1.5 px-2 sm:py-3 sm:px-3 border border-slate-300 dark:border-zinc-700 font-extrabold text-xs sm:text-sm tracking-wider whitespace-nowrap text-center">PROPERTY DAMAGE</th>
                    <th className="py-1.5 px-2 sm:py-3 sm:px-3 border border-slate-300 dark:border-zinc-700 font-extrabold text-xs sm:text-sm tracking-wider whitespace-nowrap">DAMAGE LEVEL</th>
                    <th className="py-1.5 px-2 sm:py-3 sm:px-3 border border-slate-300 dark:border-zinc-700 font-extrabold text-xs sm:text-sm tracking-wider min-w-[140px]">CLASSIFICATION</th>
                    <th className="py-1.5 px-2 sm:py-3 sm:px-3 border border-slate-300 dark:border-zinc-700 font-extrabold text-xs sm:text-sm tracking-wider min-w-[120px]">INJURY TYPE</th>
                    <th className="py-1.5 px-2 sm:py-3 sm:px-3 border border-slate-300 dark:border-zinc-700 font-extrabold text-xs sm:text-sm tracking-wider min-w-[120px]">PERSON INVOLVE</th>
                    <th className="py-1.5 px-2 sm:py-3 sm:px-3 border border-slate-300 dark:border-zinc-700 font-extrabold text-xs sm:text-sm tracking-wider whitespace-nowrap">WORK EXPERIENCE</th>
                    <th className="py-1.5 px-2 sm:py-3 sm:px-3 border border-slate-300 dark:border-zinc-700 font-extrabold text-xs sm:text-sm tracking-wider min-w-[110px]">REPORTED BY</th>
                    <th className="py-1.5 px-2 sm:py-3 sm:px-3 border border-slate-300 dark:border-zinc-700 font-extrabold text-xs sm:text-sm tracking-wider text-center whitespace-nowrap">PDF</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 bg-white dark:bg-transparent text-slate-700 dark:text-slate-300">
                  {filteredIncidents.map((inc) => {
                    const isSelected = selectedRowId === inc.id;
                    return (
                      <tr 
                        key={inc.id} 
                        onClick={() => setSelectedRowId(isSelected ? null : inc.id)}
                        className={`transition-colors cursor-pointer ${
                          isSelected 
                            ? 'bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold shadow-inner' 
                            : 'hover:bg-slate-100 dark:hover:bg-slate-800/80 active:bg-slate-200 dark:active:bg-slate-700/60'
                        }`}
                      >
                      {/* 1. NO */}
                      <td className="py-1.5 px-2 sm:py-3 sm:px-3 font-mono font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap border border-slate-300 dark:border-zinc-700 text-center">
                        {inc.id}
                      </td>
                      {/* 2. DATE */}
                      <td className="py-1.5 px-2 sm:py-3 sm:px-3 font-mono whitespace-nowrap text-slate-500 dark:text-slate-400 border border-slate-300 dark:border-zinc-700">
                        {inc.date}
                      </td>
                      {/* 3. YEAR */}
                      <td className="py-1.5 px-2 sm:py-3 sm:px-3 font-mono whitespace-nowrap text-slate-500 dark:text-slate-400 border border-slate-300 dark:border-zinc-700 text-center">
                        {inc.year || '-'}
                      </td>
                      {/* 4. LOCATION */}
                      <td className="py-1.5 px-2 sm:py-3 sm:px-3 font-bold text-slate-900 dark:text-slate-200 whitespace-nowrap border border-slate-300 dark:border-zinc-700">
                        {inc.location}
                      </td>
                      {/* 5. DESCRIPTION */}
                      <td className="py-1.5 px-2 sm:py-3 sm:px-3 text-slate-600 dark:text-slate-400 min-w-[200px] border border-slate-300 dark:border-zinc-700" title={(inc as any).rootCause || inc.description || (inc as any).root_cause || ''}>
                        <div className="line-clamp-2">
                          {(inc as any).rootCause || inc.description || (inc as any).root_cause || '-'}
                        </div>
                      </td>
                      {/* 6. OCCUPATIONAL INCIDENT? */}
                      <td className="py-1.5 px-2 sm:py-3 sm:px-3 text-center whitespace-nowrap border border-slate-300 dark:border-zinc-700">
                        <span className={`px-2 py-0.5 rounded text-xs sm:text-sm font-bold uppercase ${
                          inc.occupationalIncident?.toUpperCase() === 'YES'
                            ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}>
                          {inc.occupationalIncident || '-'}
                        </span>
                      </td>
                      {/* 7. INCIDENT CATEGORY */}
                      <td className="py-1.5 px-2 sm:py-3 sm:px-3 whitespace-nowrap border border-slate-300 dark:border-zinc-700">
                        <span className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-[11px] font-bold">
                          {inc.category || '-'}
                        </span>
                      </td>
                      {/* 8. PROPERTY DAMAGE */}
                      <td className="py-1.5 px-2 sm:py-3 sm:px-3 text-center whitespace-nowrap font-medium border border-slate-300 dark:border-zinc-700">
                        {inc.propertyDamage || '-'}
                      </td>
                      {/* 9. DAMAGE LEVEL */}
                      <td className="py-1.5 px-2 sm:py-3 sm:px-3 whitespace-nowrap font-medium text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-zinc-700">
                        {inc.damageLevel || '-'}
                      </td>
                      {/* 10. CLASSIFICATION */}
                      <td className="py-1.5 px-2 sm:py-3 sm:px-3 font-medium text-slate-800 dark:text-slate-300 whitespace-nowrap border border-slate-300 dark:border-zinc-700">
                        {inc.classification || '-'}
                      </td>
                      {/* 11. INJURY TYPE */}
                      <td className="py-1.5 px-2 sm:py-3 sm:px-3 text-slate-600 dark:text-slate-400 whitespace-nowrap border border-slate-300 dark:border-zinc-700">
                        {inc.injuryType || '-'}
                      </td>
                      {/* 12. PERSON INVOLVE */}
                      <td className="py-1.5 px-2 sm:py-3 sm:px-3 font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap border border-slate-300 dark:border-zinc-700">
                        {inc.personInvolved || (inc as any).person_involved || '-'}
                      </td>
                      {/* 13. WORK EXPERIENCE */}
                      <td className="py-1.5 px-2 sm:py-3 sm:px-3 text-slate-600 dark:text-slate-400 whitespace-nowrap border border-slate-300 dark:border-zinc-700">
                        {inc.experienceLevel || '-'}
                      </td>
                      {/* 14. REPORTED BY */}
                      <td className="py-1.5 px-2 sm:py-3 sm:px-3 text-slate-600 dark:text-slate-400 whitespace-nowrap border border-slate-300 dark:border-zinc-700">
                        {inc.reportedBy || (inc as any).investigator || '-'}
                      </td>
                      {/* 15. PDF / DOCUMENT */}
                      <td className="py-1.5 px-2 sm:py-3 sm:px-3 text-center whitespace-nowrap border border-slate-300 dark:border-zinc-700">
                         {(inc as any).documentUrl && (inc as any).documentUrl !== '-' && (inc as any).documentUrl !== '' ? (
                           <a 
                             href={formatToPreviewUrl((inc as any).documentUrl)} 
                             target="_blank" 
                             rel="noopener noreferrer" 
                             onClick={(e) => e.stopPropagation()}
                             className="inline-flex items-center justify-center px-2 py-1 rounded-md bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors text-[11px] font-bold gap-1"
                           >
                             <span className="material-symbols-outlined text-[13px]">description</span>
                             <span>Open Doc</span>
                           </a>
                         ) : (
                           <span className="text-slate-300 dark:text-slate-600">-</span>
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
