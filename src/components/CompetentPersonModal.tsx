import React from 'react';
import { MOCK_COMPETENT_PERSONS } from '../data/mockData';

interface CompetentPersonModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CompetentPersonModal: React.FC<CompetentPersonModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="glass-card max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-purple-500/20 flex items-center justify-between bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-950/80 text-blue-300">
              <span className="material-symbols-outlined text-2xl">badge</span>
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white">
                COMPETENT PERSON & CERTIFIED SUPERVISORS
              </h2>
              <p className="text-xs text-purple-300/70">
                Statutory credentials registered under DOSH (JKKP) Malaysia
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <span className="material-symbols-outlined text-2xl">close</span>
          </button>
        </div>

        {/* Credentials Grid List */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
          {MOCK_COMPETENT_PERSONS.map((cp) => (
            <div
              key={cp.id}
              className="p-4 rounded-2xl bg-slate-900/60 border border-purple-500/20 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-purple-500/40 hover:bg-purple-950/30 transition-all"
            >
              <div className="flex items-start gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center font-bold text-lg flex-shrink-0 shadow-md">
                  {cp.name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-bold text-white">{cp.name}</h3>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-950 text-emerald-300 text-[9px] sm:text-[10px] font-bold border border-emerald-800">
                      {cp.status}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-blue-400 mt-0.5">
                    {cp.title} ({cp.category})
                  </p>
                  <p className="text-[11px] font-mono text-slate-400 mt-1">
                    DOSH Reg No: <strong className="text-slate-200">{cp.doshRegNo}</strong> | Cert Expiry: <span className="text-slate-200">{cp.certExpiry}</span>
                  </p>
                  
                  {/* Qualification Badges */}
                  <div className="flex items-center gap-1.5 flex-wrap mt-2">
                    {cp.qualifications.map((q, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded bg-purple-950/60 border border-purple-500/20 text-purple-200 text-[9px] sm:text-[10px] font-medium"
                      >
                        • {q}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-purple-500/20 bg-slate-900/80 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
