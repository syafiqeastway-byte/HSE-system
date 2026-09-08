import React, { useState, useEffect } from 'react';
import { FirstAidCert, DocumentViewContext } from '../types';
import { fetchFirstAidCertData } from '../utils/gasBridge';
import { MOCK_FIRST_AID_CERTS } from '../data/mockData';

interface EmergencyPlanPageProps {
  onOpenDocument: (doc: DocumentViewContext) => void;
  onBackToHome: () => void;
}

export const EmergencyPlanPage: React.FC<EmergencyPlanPageProps> = ({
  onOpenDocument,
  onBackToHome
}) => {
  const [certs, setCerts] = useState<FirstAidCert[]>(MOCK_FIRST_AID_CERTS);
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCertId, setSelectedCertId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    fetchFirstAidCertData()
      .then((data) => {
        if (isMounted && data && data.length > 0) {
          setCerts(data);
        }
      })
      .catch((err) => {
        console.error('Error fetching First Aid Certs:', err);
      });

    return () => { isMounted = false; };
  }, []);

  const handleLoadLiveData = () => {
    setIsRefreshing(true);
    fetchFirstAidCertData(true)
      .then((data) => {
        if (data && data.length > 0) {
          setCerts(data);
        }
      })
      .catch(() => {})
      .finally(() => {
        setIsRefreshing(false);
      });
  };

  const filteredCerts = certs.filter((c) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      (c.employeeId || '').toLowerCase().includes(q) ||
      (c.name || '').toLowerCase().includes(q) ||
      (c.department || '').toLowerCase().includes(q) ||
      (c.expiryDate || '').toLowerCase().includes(q) ||
      (c.id || '').toString().toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="glass-card p-5 border-l-4 border-red-500 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToHome}
            className="p-2 rounded-xl bg-slate-800 text-white hover:bg-slate-700 transition-colors border border-cyan-500/20"
          >
            <span className="material-symbols-outlined text-xl">arrow_back</span>
          </button>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-red-500 animate-pulse">e911_emergency</span>
              <span>EMERGENCY RESPONSE PLAN & COMMAND CENTER</span>
            </h2>
            <p className="text-xs text-white">
              Site evacuation routes, trained emergency response teams, and medical certification tracking
            </p>
          </div>
        </div>

        <button
          onClick={() =>
            onOpenDocument({
              title: 'EMERGENCY RESPONSE PLAN & EVACUATION MAP',
              subtitle: 'Eastway Engineering Primary Yard & Evacuation Route Map',
              url: 'https://drive.google.com/file/d/1atnIb570BsXBjZpVe48QjDMVYmtHesgZ/view?usp=drive_link',
              type: 'pdf'
            })
          }
          className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-lg shadow-red-600/30"
        >
          <span className="material-symbols-outlined text-lg">map</span>
          <span>View Evacuation Route Map</span>
        </button>
      </div>

      {/* Emergency Hotlines Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-4 flex items-center gap-3 border-l-4 border-red-500">
          <div className="p-2.5 rounded-xl bg-slate-800 text-red-400 border border-slate-700">
            <span className="material-symbols-outlined text-2xl">local_fire_department</span>
          </div>
          <div>
            <div className="text-[11px] font-bold text-white uppercase">FIRE & RESCUE SERVICES</div>
            <div className="text-base font-extrabold text-white font-mono">999</div>
          </div>
        </div>

        <div className="glass-card p-4 flex items-center gap-3 border-l-4 border-emerald-500">
          <div className="p-2.5 rounded-xl bg-slate-800 text-emerald-400 border border-slate-700">
            <span className="material-symbols-outlined text-2xl">medical_services</span>
          </div>
          <div>
            <div className="text-[11px] font-bold text-white uppercase">AMBULANCE & HOSPITAL</div>
            <div className="text-base font-extrabold text-white font-mono">999</div>
          </div>
        </div>

        <div className="glass-card p-4 flex items-center gap-3 border-l-4 border-blue-500">
          <div className="p-2.5 rounded-xl bg-slate-800 text-blue-400 border border-slate-700">
            <span className="material-symbols-outlined text-2xl">shield_person</span>
          </div>
          <div>
            <div className="text-[11px] font-bold text-white uppercase">CIVIL DEFENCE FORCE (APM)</div>
            <div className="text-base font-extrabold text-white font-mono">03-33710820</div>
          </div>
        </div>

        <div className="glass-card p-4 flex items-center gap-3 border-l-4 border-amber-500">
          <div className="p-2.5 rounded-xl bg-slate-800 text-amber-400 border border-slate-700">
            <span className="material-symbols-outlined text-2xl">gavel</span>
          </div>
          <div>
            <div className="text-[11px] font-bold text-white uppercase">DOSH / JKKP HOTLINE</div>
            <div className="text-base font-extrabold text-white font-mono">+603 8000 8000</div>
          </div>
        </div>
      </div>

      {/* First Aid & CPR Certifications Section */}
      <div className="glass-card p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 pb-3 border-b border-cyan-500/20">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-400">clinical_notes</span>
              <span>FIRST AID & CPR CERTIFIED PERSONNEL RECORDS</span>
            </h3>
            <p className="text-xs text-white">
              Verified first aid & emergency response credentials
            </p>
          </div>

          {/* Search & Refresh Controls */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-72">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="SEARCH RECORDS..."
                className="w-full pl-9 pr-9 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
            <button
              onClick={handleLoadLiveData}
              disabled={isRefreshing}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white transition-colors border border-cyan-500/20 flex-shrink-0"
              title="Refresh from Google Sheets"
            >
              <span className={`material-symbols-outlined text-xl ${isRefreshing ? 'animate-spin text-white' : ''}`}>
                sync
              </span>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center flex flex-col items-center">
            <span className="material-symbols-outlined text-3xl text-white animate-spin">sync</span>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-cyan-500/20">
            <table className="w-full border-collapse border border-cyan-500/20 text-left text-xs sm:text-sm text-white whitespace-nowrap bg-transparent">
              <thead className="bg-slate-950/95 text-cyan-400 uppercase border-b-2 border-cyan-500/40">
                <tr className="h-8">
                  <th className="min-w-[130px] py-1 px-3 border border-cyan-500/20 font-bold uppercase text-xs tracking-wider text-cyan-400">EMPLOYEE ID</th>
                  <th className="min-w-[180px] py-1 px-3 border border-cyan-500/20 font-bold uppercase text-xs tracking-wider text-cyan-400">Name</th>
                  <th className="min-w-[160px] py-1 px-3 border border-cyan-500/20 font-bold uppercase text-xs tracking-wider text-cyan-400">Department</th>
                  <th className="w-36 py-1 px-3 border border-cyan-500/20 font-bold uppercase text-xs tracking-wider text-center text-cyan-400">CERT EXPIRED</th>
                  <th className="w-28 py-1 px-3 border border-cyan-500/20 font-bold uppercase text-xs tracking-wider text-center text-cyan-400">CERT PDF</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cyan-500/10 text-xs sm:text-sm text-white">
                {filteredCerts.length === 0 ? (
                  <tr className="h-9">
                    <td colSpan={5} className="py-4 text-center text-xs text-white border border-cyan-500/20">
                      No first aid cert found matching "{searchQuery}"
                    </td>
                  </tr>
                ) : (
                  filteredCerts.map((cert, idx) => {
                    const isSelected = selectedCertId === cert.id;
                    return (
                      <tr 
                        key={cert.id} 
                        onClick={() => setSelectedCertId(isSelected ? null : cert.id)}
                        className={`h-9 transition-colors cursor-pointer select-none ${
                          isSelected
                            ? '!bg-cyan-600 !text-white font-bold [&>td]:!bg-cyan-600 [&>td]:!text-white [&>td]:!border-cyan-400/40 [&_*]:!text-white shadow-md'
                            : idx % 2 === 0
                            ? 'bg-slate-900/40 hover:bg-cyan-950/30'
                            : 'bg-slate-900/80 hover:bg-cyan-950/40'
                        }`}
                      >
                        <td className="py-1 px-3 font-mono font-medium text-white border border-cyan-500/20 leading-none">
                          {cert.employeeId || '-'}
                        </td>
                        <td className="py-1 px-3 font-medium text-white border border-cyan-500/20 leading-none">{cert.name}</td>
                        <td className="py-1 px-3 text-white border border-cyan-500/20 leading-none">{cert.department}</td>
                        <td className="py-1 px-3 font-mono font-bold text-emerald-400 border border-cyan-500/20 text-center leading-none">{cert.expiryDate}</td>
                        <td className="py-1 px-3 border border-cyan-500/20 text-center leading-none">
                          <div className="flex justify-center">
                            {cert.certLink ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onOpenDocument({
                                    title: `First Aid & CPR Certificate - ${cert.name}`,
                                    subtitle: `Department: ${cert.department}`,
                                    url: cert.certLink,
                                    type: 'pdf'
                                  });
                                }}
                                className="inline-flex items-center justify-center px-2.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 font-semibold text-[11px] uppercase tracking-wider transition-colors leading-tight"
                              >
                                View Cert
                              </button>
                            ) : (
                              <span className="text-slate-400 text-xs">-</span>
                            )}
                          </div>
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

    </div>
  );
};
