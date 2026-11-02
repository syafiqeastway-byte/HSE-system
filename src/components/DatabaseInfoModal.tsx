import React, { useState, useEffect } from 'react';

interface DatabaseConnectionItem {
  id: string;
  tableName: string;
  category: 'Google Sheets' | 'Cloud DB' | 'GAS Bridge' | 'Local Cache';
  connector: string;
  spreadsheetId?: string;
  sheetName?: string;
  gid?: string;
  range?: string;
  url?: string;
  codeReference: string;
}

const DATABASE_CONNECTIONS: DatabaseConnectionItem[] = [
  {
    id: 'fe-inspections',
    tableName: 'SAFETY EQUIPMENT - FIRE EXTINGUISHER INSPECTIONS',
    category: 'Google Sheets',
    connector: 'PapaParse (v5.5.4) + HTTP Fetch API (GViz CSV)',
    spreadsheetId: '1o9P6GnlsAwSJEUYHxITt1Opz973uX37MLBiv0LdFdIs',
    sheetName: 'FIRE EXTINGUISHER',
    gid: '1996690139',
    range: 'B:K',
    url: 'https://docs.google.com/spreadsheets/d/1o9P6GnlsAwSJEUYHxITt1Opz973uX37MLBiv0LdFdIs/gviz/tq?tqx=out:csv&sheet=FIRE%20EXTINGUISHER&gid=1996690139&range=B:K',
    codeReference: 'src/utils/gasBridge.ts -> fetchFireExtinguisherData()'
  },
  {
    id: 'inspection-records',
    tableName: 'INSPECTION RECORDS (Workplace Inspections)',
    category: 'Google Sheets',
    connector: 'PapaParse (v5.5.4) + HTTP Fetch API (GViz CSV)',
    spreadsheetId: '1o9P6GnlsAwSJEUYHxITt1Opz973uX37MLBiv0LdFdIs & 1HLebePp1L31C-nZk6HgTxDwy6kXktNHDdbEdGcMvbbA',
    sheetName: 'Original GID 582761149 (Range B:I) & New Sheet: Records (Row 5+)',
    gid: '582761149',
    range: 'B:I & Records Sheet A5:BF',
    url: 'https://docs.google.com/spreadsheets/d/1HLebePp1L31C-nZk6HgTxDwy6kXktNHDdbEdGcMvbbA/gviz/tq?tqx=out:csv&sheet=Records',
    codeReference: 'src/utils/gasBridge.ts -> fetchInspectionData()'
  },
  {
    id: 'days-without-incident',
    tableName: 'DAYS WITHOUT INCIDENT COUNTER',
    category: 'Google Sheets',
    connector: 'HTTP Fetch API (GViz CSV Single Cell Stream)',
    spreadsheetId: '1o9P6GnlsAwSJEUYHxITt1Opz973uX37MLBiv0LdFdIs',
    sheetName: 'HSE FILE',
    range: 'I2:I2',
    url: 'https://docs.google.com/spreadsheets/d/1o9P6GnlsAwSJEUYHxITt1Opz973uX37MLBiv0LdFdIs/gviz/tq?tqx=out:csv&sheet=HSE%20FILE&range=I2:I2',
    codeReference: 'src/utils/gasBridge.ts -> fetchDaysWithoutIncident()'
  },
  {
    id: 'incident-records',
    tableName: 'INCIDENT LOG & RECORDS',
    category: 'Google Sheets',
    connector: 'PapaParse (v5.5.4) + HTTP Fetch API (GViz CSV)',
    spreadsheetId: '1o9P6GnlsAwSJEUYHxITt1Opz973uX37MLBiv0LdFdIs',
    sheetName: 'Incident Sheet GID 88563672',
    gid: '88563672',
    range: 'A4:O',
    url: 'https://docs.google.com/spreadsheets/d/1o9P6GnlsAwSJEUYHxITt1Opz973uX37MLBiv0LdFdIs/gviz/tq?tqx=out:csv&gid=88563672&range=A4:O',
    codeReference: 'src/utils/gasBridge.ts -> fetchLiveIncidentRecords()'
  },
  {
    id: 'first-aid-certs',
    tableName: 'FIRST AID CERTIFICATIONS',
    category: 'Google Sheets',
    connector: 'PapaParse (v5.5.4) + HTTP Fetch API (GViz CSV)',
    spreadsheetId: '1o9P6GnlsAwSJEUYHxITt1Opz973uX37MLBiv0LdFdIs',
    sheetName: 'FIRST AID KIT INSPECTION',
    range: 'AA5:AE',
    url: 'https://docs.google.com/spreadsheets/d/1o9P6GnlsAwSJEUYHxITt1Opz973uX37MLBiv0LdFdIs/gviz/tq?tqx=out:csv&sheet=FIRST%20AID%20KIT%20INSPECTION&range=AA5:AE',
    codeReference: 'src/utils/gasBridge.ts -> fetchFirstAidCertData()'
  },
  {
    id: 'jkk-meetings',
    tableName: 'JKK COMMITTEE MEETING MINUTES',
    category: 'Google Sheets',
    connector: 'PapaParse (v5.5.4) + HTTP Fetch API (GViz CSV)',
    spreadsheetId: '1o9P6GnlsAwSJEUYHxITt1Opz973uX37MLBiv0LdFdIs',
    sheetName: 'JKK MEETING',
    gid: '1985060946',
    range: 'A:D (Summary) & A4:E (Meetings list)',
    url: 'https://docs.google.com/spreadsheets/d/1o9P6GnlsAwSJEUYHxITt1Opz973uX37MLBiv0LdFdIs/gviz/tq?tqx=out:csv&sheet=JKK%20MEETING&range=A:D',
    codeReference: 'src/utils/gasBridge.ts -> fetchLatestJkkMeeting(), fetchDynamicMinuteMeetings()'
  },
  {
    id: 'demerit-system',
    tableName: 'SAFETY VIOLATIONS & DEMERIT SYSTEM',
    category: 'Google Sheets',
    connector: 'PapaParse (v5.5.4) + HTTP Fetch API (GViz CSV)',
    spreadsheetId: '1o9P6GnlsAwSJEUYHxITt1Opz973uX37MLBiv0LdFdIs',
    sheetName: 'DEMERIT',
    gid: '817838002',
    range: 'K3:O37 (Matrix) & A3:I (Scoring Log)',
    url: 'https://docs.google.com/spreadsheets/d/1o9P6GnlsAwSJEUYHxITt1Opz973uX37MLBiv0LdFdIs/gviz/tq?tqx=out:csv&sheet=DEMERIT&range=K3:O37',
    codeReference: 'src/utils/gasBridge.ts -> fetchSafetyViolationSummaryTable(), fetchSafetyViolationScoring()'
  },
  {
    id: 'hirarc-sop',
    tableName: 'HIRARC & SOP DOCUMENTATION',
    category: 'Google Sheets',
    connector: 'PapaParse (v5.5.4) + HTTP Fetch API (GViz CSV)',
    spreadsheetId: '1o9P6GnlsAwSJEUYHxITt1Opz973uX37MLBiv0LdFdIs',
    sheetName: 'GID 1423932800',
    gid: '1423932800',
    range: 'B57:F (HIRARC) & B24:F54 (SOP)',
    url: 'https://docs.google.com/spreadsheets/d/1o9P6GnlsAwSJEUYHxITt1Opz973uX37MLBiv0LdFdIs/gviz/tq?tqx=out:csv&gid=1423932800&range=B57:F',
    codeReference: 'src/utils/gasBridge.ts -> fetchDynamicHIRARC(), fetchDynamicSOP()'
  },
  {
    id: 'supabase-db',
    tableName: 'SUPABASE CLOUD POSTGRESQL (incidents, inspections, first_aid_certs)',
    category: 'Cloud DB',
    connector: '@supabase/supabase-js (v2.112.2)',
    url: 'https://esmqveagrvugmkhxkvxj.supabase.co',
    codeReference: 'src/utils/supabaseService.ts & src/components/SupabaseModal.tsx'
  },
  {
    id: 'firebase-db',
    tableName: 'FIREBASE FIRESTORE & AUTH',
    category: 'Cloud DB',
    connector: 'firebase (v13.1.0) SDK',
    codeReference: 'package.json & firebase-applet-config.json'
  },
  {
    id: 'gas-rpc',
    tableName: 'GOOGLE APPS SCRIPT RPC BRIDGE',
    category: 'GAS Bridge',
    connector: 'window.google.script.run (callGasFunction)',
    codeReference: 'src/utils/gasBridge.ts -> callGasFunction()'
  },
  {
    id: 'local-cache',
    tableName: 'BROWSER LOCALSTORAGE CACHE',
    category: 'Local Cache',
    connector: 'Native HTML5 localStorage Web API',
    codeReference: 'src/utils/gasBridge.ts (HSE_CACHED_*) & src/App.tsx'
  }
];

interface DatabaseInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DatabaseInfoModal: React.FC<DatabaseInfoModalProps> = ({ isOpen, onClose }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [passwordError, setPasswordError] = useState<string>('');

  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Reset state when modal is opened/closed
  useEffect(() => {
    if (!isOpen) {
      setIsAuthenticated(false);
      setPasswordInput('');
      setPasswordError('');
      setShowPassword(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput.trim() === 'ABC1207') {
      setIsAuthenticated(true);
      setPasswordError('');
    } else {
      setPasswordError('Invalid Password! Please enter the correct password.');
    }
  };

  // Password Protection Gate UI
  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
        <div className="max-w-md w-full bg-slate-900 border border-cyan-500/40 rounded-2xl p-6 sm:p-8 shadow-2xl text-slate-100 flex flex-col items-center relative overflow-hidden">
          
          {/* Decorative Glowing Accent */}
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none"></div>
          <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none"></div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>

          {/* Security Icon */}
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-600 text-white flex items-center justify-center shadow-lg shadow-cyan-500/20 mb-4 border border-cyan-400/30">
            <span className="material-symbols-outlined text-3xl">lock</span>
          </div>

          <h2 className="text-lg sm:text-xl font-black text-white uppercase tracking-wide text-center">
            DATABASE SECURITY ACCESS
          </h2>
          <p className="text-xs text-slate-400 text-center mt-1.5 leading-relaxed max-w-xs">
            Password required to view database connections, sheet IDs, and system connectors.
          </p>

          {/* Password Form */}
          <form onSubmit={handlePasswordSubmit} className="w-full mt-6 space-y-4">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300 block mb-1.5">
                ENTER ACCESS PASSWORD
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={passwordInput}
                  onChange={(e) => {
                    setPasswordInput(e.target.value);
                    if (passwordError) setPasswordError('');
                  }}
                  placeholder="Enter password..."
                  autoFocus
                  className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200 transition-colors"
                >
                  <span className="material-symbols-outlined text-lg">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>

              {passwordError && (
                <div className="mt-2 text-xs font-bold text-rose-400 flex items-center gap-1.5 animate-in fade-in">
                  <span className="material-symbols-outlined text-base">error</span>
                  <span>{passwordError}</span>
                </div>
              )}
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors border border-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition-all border border-emerald-400/30 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">lock_open</span>
                <span>UNLOCK</span>
              </button>
            </div>
          </form>

        </div>
      </div>
    );
  }

  const categories = ['All', 'Google Sheets', 'Cloud DB', 'GAS Bridge', 'Local Cache'];

  const filteredConnections = DATABASE_CONNECTIONS.filter((item) => {
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesSearch =
      item.tableName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.connector.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.spreadsheetId && item.spreadsheetId.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.sheetName && item.sheetName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      item.codeReference.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="glass-card w-full max-w-[96vw] xl:max-w-7xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl border border-cyan-500/40 rounded-2xl bg-slate-900 text-slate-100">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-600/30">
              <span className="material-symbols-outlined text-2xl">database</span>
            </div>
            <div>
              <h2 className="text-base sm:text-xl font-black text-white uppercase tracking-wide flex items-center gap-2">
                DATABASE CONNECTIONS & CONNECTORS
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <span className="material-symbols-outlined text-2xl">close</span>
          </button>
        </div>

        {/* Filter Bar */}
        <div className="p-4 border-b border-slate-800 bg-slate-900/60 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all whitespace-nowrap ${
                  selectedCategory === cat
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative flex-1 max-w-xs">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-lg">
              search
            </span>
            <input
              type="text"
              placeholder="Search database, sheet or range..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        {/* Connections Table Container */}
        <div className="p-3 sm:p-5 overflow-y-auto flex-1 min-h-0 flex flex-col">
          <div className="text-xs text-slate-400 font-semibold mb-2.5 flex flex-wrap items-center justify-between gap-2 shrink-0">
            <span>Showing <strong className="text-cyan-400">{filteredConnections.length}</strong> Active Data Connections</span>
            <div className="flex items-center gap-3 text-[11px]">
              <span className="hidden sm:inline text-slate-500 italic">Scroll table right to view all columns</span>
              <span className="text-slate-400">Total Integrations: <strong className="text-white">{DATABASE_CONNECTIONS.length}</strong></span>
            </div>
          </div>

          {filteredConnections.length === 0 ? (
            <div className="p-8 text-center rounded-xl bg-slate-950/50 border border-slate-800">
              <span className="material-symbols-outlined text-4xl text-slate-500 mb-2">search_off</span>
              <p className="text-sm font-bold text-slate-300">No database connections found</p>
              <p className="text-xs text-slate-500 mt-1">Try adjusting your search criteria or selecting "All" category.</p>
            </div>
          ) : (
            <div className="border border-slate-800 rounded-xl overflow-x-auto bg-slate-950/60 shadow-inner flex-1 max-h-full">
              <table className="w-full text-left border-collapse text-xs min-w-[1050px]">
                <thead className="sticky top-0 z-10 bg-slate-900 border-b border-slate-800 text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                  <tr>
                    <th className="p-3 min-w-[200px] max-w-[240px]">Data Source Name</th>
                    <th className="p-3 min-w-[130px] max-w-[150px]">Category / Status</th>
                    <th className="p-3 min-w-[160px] max-w-[190px]">Connector Tech</th>
                    <th className="p-3 min-w-[200px] max-w-[260px]">Spreadsheet ID / Endpoint</th>
                    <th className="p-3 min-w-[160px] max-w-[200px]">Sheet & Range</th>
                    <th className="p-3 min-w-[200px] max-w-[260px]">Code File Reference & Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {filteredConnections.map((conn) => (
                    <tr key={conn.id} className="hover:bg-slate-800/40 transition-colors group">
                      
                      {/* Column 1: Table Name */}
                      <td className="p-3 align-top">
                        <div className="flex items-start gap-2">
                          <span className="material-symbols-outlined text-cyan-400 text-base mt-0.5 shrink-0">
                            {conn.category === 'Google Sheets'
                              ? 'table_chart'
                              : conn.category === 'Cloud DB'
                              ? 'cloud'
                              : conn.category === 'GAS Bridge'
                              ? 'extension'
                              : 'storage'}
                          </span>
                          <div>
                            <div className="font-bold text-white text-xs leading-snug group-hover:text-cyan-300 transition-colors break-words">
                              {conn.tableName}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Column 2: Category & Status Badges */}
                      <td className="p-3 align-top">
                        <div className="flex flex-col gap-1.5 items-start">
                          <span className="px-2 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/30 text-blue-400 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap">
                            {conn.category}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold flex items-center gap-1 whitespace-nowrap">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                            CONNECTED
                          </span>
                        </div>
                      </td>

                      {/* Column 3: Connector Technology */}
                      <td className="p-3 align-top">
                        <span className="font-mono text-cyan-300 font-semibold text-[11px] block leading-tight break-words">
                          {conn.connector}
                        </span>
                      </td>

                      {/* Column 4: Spreadsheet ID or Endpoint URL */}
                      <td className="p-3 align-top font-mono text-[11px]">
                        {conn.spreadsheetId ? (
                          <div className="space-y-1">
                            <span className="text-yellow-400 font-medium break-all block text-[10px]">
                              {conn.spreadsheetId}
                            </span>
                            {conn.gid && (
                              <span className="text-[10px] text-slate-400 block font-sans">
                                GID: <strong className="text-slate-200 font-mono">{conn.gid}</strong>
                              </span>
                            )}
                          </div>
                        ) : conn.url ? (
                          <span className="text-slate-300 break-all block text-[10px] bg-slate-900 p-1.5 rounded border border-slate-800">
                            {conn.url}
                          </span>
                        ) : (
                          <span className="text-slate-500 italic text-[11px] font-sans">Internal Engine</span>
                        )}
                      </td>

                      {/* Column 5: Sheet Name & Range */}
                      <td className="p-3 align-top font-mono text-[11px]">
                        {conn.sheetName || conn.range ? (
                          <div className="space-y-1">
                            {conn.sheetName && (
                              <div className="text-slate-200 font-semibold text-[11px] break-words">
                                {conn.sheetName}
                              </div>
                            )}
                            {conn.range && (
                              <div className="inline-block px-1.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-800/60 text-cyan-400 font-bold text-[10px] break-words">
                                Range: {conn.range}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-500 italic text-[11px] font-sans">N/A</span>
                        )}
                      </td>

                      {/* Column 6: Code File Reference & Actions */}
                      <td className="p-3 align-top">
                        <div className="space-y-2">
                          <span className="font-mono text-emerald-400 font-semibold text-[11px] block leading-snug break-words">
                            {conn.codeReference}
                          </span>
                          
                          <div className="flex items-center gap-2 flex-wrap">
                            {conn.spreadsheetId && (
                              <button
                                onClick={() => copyToClipboard(conn.spreadsheetId!, `id-${conn.id}`)}
                                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-400 text-[10px] font-bold border border-slate-700 hover:border-cyan-500/50 transition-all flex items-center gap-1 whitespace-nowrap cursor-pointer"
                                title="Copy Spreadsheet ID"
                              >
                                <span className="material-symbols-outlined text-xs">
                                  {copiedId === `id-${conn.id}` ? 'check' : 'content_copy'}
                                </span>
                                <span>{copiedId === `id-${conn.id}` ? 'ID Copied!' : 'Copy ID'}</span>
                              </button>
                            )}

                            {conn.url && (
                              <button
                                onClick={() => copyToClipboard(conn.url!, `url-${conn.id}`)}
                                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-400 text-[10px] font-bold border border-slate-700 hover:border-cyan-500/50 transition-all flex items-center gap-1 whitespace-nowrap cursor-pointer"
                                title="Copy Endpoint URL"
                              >
                                <span className="material-symbols-outlined text-xs">
                                  {copiedId === `url-${conn.id}` ? 'check' : 'content_copy'}
                                </span>
                                <span>{copiedId === `url-${conn.id}` ? 'URL Copied!' : 'Copy URL'}</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <p className="text-xs text-slate-400">
            System Architecture: <span className="text-white font-bold">Multi-Connector Integrated Pipeline</span>
          </p>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors border border-slate-700 cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
