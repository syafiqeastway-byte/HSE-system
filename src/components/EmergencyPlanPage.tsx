import React, { useState, useEffect } from 'react';
import { FirstAidCert, DocumentViewContext } from '../types';
import { fetchFirstAidCertData } from '../utils/gasBridge';

interface EmergencyPlanPageProps {
  onOpenDocument: (doc: DocumentViewContext) => void;
  onBackToHome: () => void;
}

export const EmergencyPlanPage: React.FC<EmergencyPlanPageProps> = ({
  onOpenDocument,
  onBackToHome
}) => {
  const [certs, setCerts] = useState<FirstAidCert[]>([]);
  const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    fetchFirstAidCertData()
      .then((data) => {
        if (isMounted) {
          setCerts(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Error fetching First Aid Certs:', err);
        if (isMounted) setLoading(false);
      });

    return () => { isMounted = false; };
  }, []);

  const handleLoadLiveData = () => {
    setLoading(true);
    fetchFirstAidCertData(true)
      .then((data) => {
        setCerts(data);
        if (data.length > 0) {
        }
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  };

  const filteredCerts = certs.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="glass-card p-5 border-l-4 border-red-500 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToHome}
            className="p-2 rounded-xl bg-slate-100 dark:bg-zinc-900 text-slate-600 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-800 transition-colors border border-transparent dark:border-zinc-800"
          >
            <span className="material-symbols-outlined text-xl">arrow_back</span>
          </button>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-red-500 animate-pulse">e911_emergency</span>
              <span>EMERGENCY RESPONSE PLAN & COMMAND CENTER</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
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
          <div className="p-2.5 rounded-xl bg-red-100 dark:bg-red-950 text-red-600">
            <span className="material-symbols-outlined text-2xl">local_fire_department</span>
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase">FIRE & RESCUE (BOMBA)</div>
            <div className="text-base font-extrabold text-red-600 dark:text-red-400 font-mono">999</div>
          </div>
        </div>

        <div className="glass-card p-4 flex items-center gap-3 border-l-4 border-emerald-500">
          <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600">
            <span className="material-symbols-outlined text-2xl">medical_services</span>
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase">AMBULANCE & HOSPITAL</div>
            <div className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">999</div>
          </div>
        </div>

        <div className="glass-card p-4 flex items-center gap-3 border-l-4 border-blue-500">
          <div className="p-2.5 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600">
            <span className="material-symbols-outlined text-2xl">shield_person</span>
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase">ANGKATAN PERTAHANAN AWAM (APM)</div>
            <div className="text-base font-extrabold text-blue-600 dark:text-blue-400 font-mono">03-33710820</div>
          </div>
        </div>

        <div className="glass-card p-4 flex items-center gap-3 border-l-4 border-amber-500">
          <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600">
            <span className="material-symbols-outlined text-2xl">gavel</span>
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase">DOSH / JKKP HOTLINE</div>
            <div className="text-base font-extrabold text-amber-600 dark:text-amber-400 font-mono">+603 8000 8000</div>
          </div>
        </div>
      </div>

      {/* First Aid & CPR Certifications Section */}
      <div className="glass-card p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 pb-3 border-b border-slate-200 dark:border-slate-700">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-500">clinical_notes</span>
              <span>FIRST AID & CPR CERTIFIED PERSONNEL RECORDS</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Verified first aid & emergency response credentials
            </p>
          </div>

          {/* Real time search bar */}
          <div className="relative w-full sm:w-72">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="SEARCH RECORDS..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center flex flex-col items-center">
            <span className="material-symbols-outlined text-3xl text-emerald-500 animate-spin">sync</span>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700">
            <table className="w-full text-left text-xs text-slate-800 dark:text-slate-200">
              <thead className="bg-slate-100 dark:bg-slate-800 uppercase font-bold text-slate-600 dark:text-slate-300">
                <tr>
                  <th className="p-3">Name</th>
                  <th className="p-3">Department</th>
                  <th className="p-3">CERT EXPIRED</th>
                  <th className="p-3">CERT PDF</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700 bg-white dark:bg-slate-900">
                {filteredCerts.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-4 text-center text-slate-400">
                      No first aid cert found matching "{searchQuery}"
                    </td>
                  </tr>
                ) : (
                  filteredCerts.map((cert) => (
                    <tr key={cert.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                      <td className="p-3 font-semibold text-slate-900 dark:text-slate-100">{cert.name}</td>
                      <td className="p-3 text-slate-700 dark:text-slate-300">{cert.department}</td>
                      <td className="p-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">{cert.expiryDate}</td>
                      <td className="p-3">
                        <button
                          onClick={() => onOpenDocument({
                            title: `First Aid & CPR Certificate - ${cert.name}`,
                            subtitle: `Department: ${cert.department}`,
                            url: cert.certLink,
                            type: 'pdf'
                          })}
                          className="px-3 py-1.5 rounded-lg bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/40 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-semibold text-[10px] uppercase tracking-wider flex items-center gap-1.5 transition-colors"
                        >
                          <span className="material-symbols-outlined text-[14px]">visibility</span>
                          View Cert
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
