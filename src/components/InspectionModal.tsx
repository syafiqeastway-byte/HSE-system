import React, { useState, useEffect } from 'react';
import { InspectionRecord } from '../types';
import { fetchInspectionData } from '../utils/gasBridge';
import { formatToPreviewUrl } from '../utils/formatDriveUrl';

interface InspectionModalProps {
  isOpen: boolean;
  filterType: 'Workplace' | 'First Aid Box' | 'Fire Extinguisher' | 'All';
  onClose: () => void;
}

export const InspectionModal: React.FC<InspectionModalProps> = ({ isOpen, filterType, onClose }) => {
  const [inspections, setInspections] = useState<InspectionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;
    setLoading(true);

    fetchInspectionData()
      .then((data) => {
        if (!isMounted) return;
        if (filterType === 'All') {
          setInspections(data);
        } else {
          setInspections(data.filter((item) => item.type === filterType));
        }
        setLoading(false);
      })
      .catch(() => {
        if (isMounted) setLoading(false);
      });

    return () => { isMounted = false; };
  }, [isOpen, filterType]);

  if (!isOpen) return null;

  const filteredData = inspections.filter((item) => {
    const query = searchQuery.toLowerCase();
    return (
      (item.date || '').toLowerCase().includes(query) ||
      (item.day || '').toLowerCase().includes(query) ||
      (item.location || '').toLowerCase().includes(query) ||
      (item.typeOfInspection || '').toLowerCase().includes(query) ||
      (item.inspector || '').toLowerCase().includes(query) ||
      (item.remark || '').toLowerCase().includes(query)
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="glass-card max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-300">
              <span className="material-symbols-outlined text-2xl">fact_check</span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                WORKPLACE & WORKSHOP INSPECTION RECORDS
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
          >
            <span className="material-symbols-outlined text-2xl">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          
          {/* Client Side Search Bar */}
          <div className="mb-4 relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="SEARCH RECORDS..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
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
                    <th className="p-3 text-center w-12">NO</th>
                    <th className="p-3">DATE</th>
                    <th className="p-3">LOCATION</th>
                    <th className="p-3">TYPE OF INSPECTION</th>
                    <th className="p-3">INSPECTOR</th>
                    <th className="p-3">REMARK</th>
                    <th className="p-3 text-center">PDF</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700 bg-white dark:bg-slate-900">
                  {filteredData.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-4 text-center text-slate-400">
                        No inspection records found matching "{searchQuery}"
                      </td>
                    </tr>
                  ) : (
                    filteredData.map((item, index) => {
                      const isSelected = selectedRowId === String(item.id);
                      return (
                        <tr 
                          key={item.id} 
                          onClick={() => setSelectedRowId(isSelected ? null : String(item.id))}
                          className={`transition-colors cursor-pointer ${
                            isSelected 
                              ? 'bg-slate-200/80 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold shadow-inner' 
                              : 'hover:bg-slate-100 dark:hover:bg-slate-800/80 active:bg-slate-200 dark:active:bg-slate-700/60'
                          }`}
                        >
                          <td className="p-3 text-center font-mono font-semibold text-slate-500">{index + 1}</td>
                          <td className="p-3 whitespace-nowrap font-mono">{item.date}</td>
                          <td className="p-3 font-bold text-slate-900 dark:text-white">{item.location || '-'}</td>
                          <td className="p-3 font-semibold text-emerald-600 dark:text-emerald-400">{item.typeOfInspection || '-'}</td>
                          <td className="p-3 text-slate-700 dark:text-slate-300">{item.inspector || '-'}</td>
                          <td className="p-3 text-slate-600 dark:text-slate-400 max-w-xs truncate" title={item.remark}>{item.remark || '-'}</td>
                          <td className="p-3 text-center">
                            {item.documentUrl ? (
                              <a
                                href={formatToPreviewUrl(item.documentUrl)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-bold transition-colors shadow-sm shadow-blue-500/20"
                              >
                                <span className="material-symbols-outlined text-[13px]">open_in_new</span>
                                View PDF
                              </a>
                            ) : (
                              <span className="text-[10px] text-slate-400 italic">No PDF</span>
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

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-700 text-white font-semibold text-xs hover:bg-slate-800 transition-colors"
          >
            Close Audit Logs
          </button>
        </div>

      </div>
    </div>
  );
};
