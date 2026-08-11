import React, { useState, useEffect } from 'react';
import { IncidentRecord } from '../types';
import { MOCK_INCIDENT_RECORDS } from '../data/mockData';
import { fetchLiveIncidentRecords } from '../utils/gasBridge';

interface AllIncidentRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AllIncidentRecordModal: React.FC<AllIncidentRecordModalProps> = ({ isOpen, onClose }) => {
  const [incidents, setIncidents] = useState<IncidentRecord[]>([]);
  const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [source, setSource] = useState<'Google Sheets Live' | 'Local Cache Fallback'>('Google Sheets Live');

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
useEffect(() => {
    if (isOpen) {
      fetchIncidents();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Filtered incidents
  const filteredIncidents = incidents.filter(item => {
    const matchesStatus =
      statusFilter === 'All' ? true : item.status?.toLowerCase() === statusFilter.toLowerCase();

    if (!matchesStatus) return false;
    if (!searchQuery.trim()) return true;

    const query = searchQuery.toLowerCase();
    
    const id = item.id || '';
    const date = item.date || '';
    const year = item.year || '';
    const location = item.location || '';
    const desc = (item as any).rootCause || item.description || (item as any).root_cause || '';
    const occupationalIncident = item.occupationalIncident || '';
    const category = item.category || '';
    const propertyDamage = item.propertyDamage || '';
    const damageLevel = item.damageLevel || '';
    const classification = item.classification || '';
    const injuryType = item.injuryType || '';
    const person = item.personInvolved || (item as any).person_involved || '';
    const experienceLevel = item.experienceLevel || '';
    const reported = item.reportedBy || (item as any).investigator || '';
    const status = item.status || '';

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
      reported.toLowerCase().includes(query) ||
      status.toLowerCase().includes(query)
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="glass-card max-w-6xl w-full h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-blue-500/30 rounded-2xl">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-blue-600/10 dark:bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-600/30">
              <span className="material-symbols-outlined text-2xl">database</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-xl font-black text-slate-900 dark:text-white tracking-wide uppercase">
                  ALL INCIDENT RECORD
                </h2>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Connected Data Source: <code className="font-mono text-emerald-400">Google Sheets (NEW IR)</code>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchIncidents()}
              disabled={loading}
              className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors border border-slate-700"
              title="Refresh from Google Sheets"
            >
              <span className={`material-symbols-outlined text-xl ${loading ? 'animate-spin' : ''}`}>
                refresh
              </span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              <span className="material-symbols-outlined text-2xl">close</span>
            </button>
          </div>
        </div>

        {/* Toolbar & Filter Bar */}
        <div className="p-4 bg-slate-900/60 border-b border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
              search
            </span>
            <input
              type="text"
              placeholder="Search ID, Location, Category, Cause..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 placeholder-slate-500 text-xs focus:outline-none focus:border-blue-500 transition-all"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 text-xs font-semibold focus:outline-none focus:border-blue-500"
            >
              <option value="All">Status: All</option>
              <option value="Closed">Status: Closed</option>
              <option value="Open">Status: Open</option>
            </select>

            <button
              onClick={handleLoadLiveData}
              disabled={loading}
              className="px-3 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-400 font-bold text-xs flex items-center gap-1.5 transition-all"
              title="Fetch live records from Google Sheets"
            >
              <span className={`material-symbols-outlined text-base ${loading ? 'animate-spin' : ''}`}>
                cloud_download
              </span>
              <span>{loading ? 'Syncing...' : 'Sync with Google Sheets'}</span>
            </button>
          </div>
        </div>

        {/* Table Content */}
        <div className="flex-1 overflow-auto p-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400">
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
            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-900/90 text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-slate-800">
                    <th className="py-3 px-3 whitespace-nowrap">NO</th>
                    <th className="py-3 px-3 whitespace-nowrap">DATE</th>
                    <th className="py-3 px-3 whitespace-nowrap">YEAR</th>
                    <th className="py-3 px-3 min-w-[120px]">LOCATION</th>
                    <th className="py-3 px-3 min-w-[200px]">DESCRIPTION</th>
                    <th className="py-3 px-3 text-center whitespace-nowrap">OCCUPATIONAL INCIDENT?</th>
                    <th className="py-3 px-3 min-w-[140px]">INCIDENT CATEGORY</th>
                    <th className="py-3 px-3 text-center whitespace-nowrap">PROPERTY DAMAGE</th>
                    <th className="py-3 px-3 whitespace-nowrap">DAMAGE LEVEL</th>
                    <th className="py-3 px-3 min-w-[140px]">CLASSIFICATION</th>
                    <th className="py-3 px-3 min-w-[120px]">INJURY TYPE</th>
                    <th className="py-3 px-3 min-w-[120px]">PERSON INVOLVE</th>
                    <th className="py-3 px-3 whitespace-nowrap">WORK EXPERIENCE</th>
                    <th className="py-3 px-3 min-w-[110px]">REPORTED BY</th>
                    <th className="py-3 px-3 text-center whitespace-nowrap">PDF</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-slate-950/40 font-medium text-slate-300">
                  {filteredIncidents.map((inc) => (
                    <tr key={inc.id} className="hover:bg-slate-900/50 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-blue-400 whitespace-nowrap">
                        {inc.id}
                      </td>
                      <td className="py-3 px-3 font-mono whitespace-nowrap text-slate-400">
                        {inc.date}
                      </td>
                      <td className="py-3 px-3 font-mono whitespace-nowrap text-slate-400">
                        {inc.year || '-'}
                      </td>
                      <td className="py-3 px-3 font-bold text-slate-200 whitespace-nowrap">
                        {inc.location}
                      </td>
                      <td className="py-3 px-3 min-w-[200px] text-slate-400" title={(inc as any).rootCause || inc.description || (inc as any).root_cause || ''}>
                        <div className="line-clamp-2">
                          {(inc as any).rootCause || inc.description || (inc as any).root_cause || '-'}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          inc.occupationalIncident?.toUpperCase() === 'YES'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}>
                          {inc.occupationalIncident || '-'}
                        </span>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-bold">
                          {inc.category || '-'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap text-slate-400">
                        {inc.propertyDamage || '-'}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap text-slate-400">
                        {inc.damageLevel || '-'}
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-300 whitespace-nowrap">
                        {inc.classification || '-'}
                      </td>
                      <td className="py-3 px-3 text-slate-400 whitespace-nowrap">
                        {inc.injuryType || '-'}
                      </td>
                      <td className="py-3 px-3 text-slate-300 font-medium whitespace-nowrap">
                        {inc.personInvolved || (inc as any).person_involved || '-'}
                      </td>
                      <td className="py-3 px-3 text-slate-400 whitespace-nowrap">
                        {inc.experienceLevel || '-'}
                      </td>
                      <td className="py-3 px-3 text-slate-400 whitespace-nowrap">
                        {inc.reportedBy || (inc as any).investigator || '-'}
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        {(inc as any).documentUrl && (inc as any).documentUrl !== '-' && (inc as any).documentUrl !== '' ? (
                          <a href={(inc as any).documentUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center px-2.5 py-1 rounded-md bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 text-xs font-bold gap-1 transition-colors">
                            <span className="material-symbols-outlined text-[14px]">description</span>
                            <span>Open Doc</span>
                          </a>
                        ) : (
                          <span className="text-slate-600">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <div>
            Showing <strong className="text-white">{filteredIncidents.length}</strong> of <strong className="text-white">{incidents.length}</strong> incident records from Google Sheets
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
