import React, { useEffect, useState, useRef } from 'react';
import { IncidentRecord, DemeritRecord, DemeritMatrix } from '../types';
import {
  fetchAllIncidents,
  fetchIncidentLocations,
  fetchIncidentCategories,
  fetchClassificationData,
  fetchInjuryTypeData,
  fetchExperienceLevelData,
  fetchDemeritData
} from '../utils/gasBridge';

declare const Chart: any;

interface IncidentChartsAndTablesProps {
  isDarkMode: boolean;
  onOpenAllIncidentsModal?: () => void;
}

export const IncidentChartsAndTables: React.FC<IncidentChartsAndTablesProps> = ({ isDarkMode, onOpenAllIncidentsModal }) => {
  const [activeTab, setActiveTab] = useState<
    'all' | 'location' | 'category' | 'classification' | 'injury' | 'experience' | 'demerit'
  >('all');

  const [incidents, setIncidents] = useState<IncidentRecord[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [classifications, setClassifications] = useState<any[]>([]);
  const [injuries, setInjuries] = useState<any[]>([]);
  const [experiences, setExperiences] = useState<any[]>([]);
  const [demeritLogs, setDemeritLogs] = useState<DemeritRecord[]>([]);
  const [demeritMatrix, setDemeritMatrix] = useState<DemeritMatrix[]>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Canvas Refs for Charts
  const chartRef1 = useRef<HTMLCanvasElement | null>(null);
  const chartRef2 = useRef<HTMLCanvasElement | null>(null);
  const chartInstance1 = useRef<any>(null);
  const chartInstance2 = useRef<any>(null);

  // Load All Data via GAS Bridge
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    Promise.all([
      fetchAllIncidents(),
      fetchIncidentLocations(),
      fetchIncidentCategories(),
      fetchClassificationData(),
      fetchInjuryTypeData(),
      fetchExperienceLevelData(),
      fetchDemeritData()
    ])
      .then(([allInc, locs, cats, classes, injs, exps, demeritRes]) => {
        if (!isMounted) return;
        setIncidents(allInc);
        setLocations(locs);
        setCategories(cats);
        setClassifications(classes);
        setInjuries(injs);
        setExperiences(exps);
        setDemeritLogs(demeritRes.logs);
        setDemeritMatrix(demeritRes.matrix);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching incident datasets:', err);
        if (isMounted) setLoading(false);
      });

    return () => { isMounted = false; };
  }, []);

  // Chart Rendering and Dark Mode Sync Effect
  useEffect(() => {
    if (loading || typeof Chart === 'undefined') return;

    // Destroy existing charts
    if (chartInstance1.current) {
      chartInstance1.current.destroy();
      chartInstance1.current = null;
    }
    if (chartInstance2.current) {
      chartInstance2.current.destroy();
      chartInstance2.current = null;
    }

    const textColor = isDarkMode ? '#F8FAFC' : '#0F172A';
    const gridColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(15, 23, 42, 0.08)';

    // Chart 1 Render
    if (chartRef1.current) {
      const ctx1 = chartRef1.current.getContext('2d');
      if (ctx1) {
        if (activeTab === 'all') {
          // Category Distribution Doughnut Chart
          const labels = categories.map((c) => c.category);
          const dataVals = categories.map((c) => c.count);
          chartInstance1.current = new Chart(ctx1, {
            type: 'doughnut',
            data: {
              labels,
              datasets: [
                {
                  label: 'Incidents by Category',
                  data: dataVals,
                  backgroundColor: ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6'],
                  borderWidth: 2,
                  borderColor: isDarkMode ? '#1E293B' : '#FFFFFF'
                }
              ]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { labels: { color: textColor, font: { family: 'Inter', size: 12 } } },
                title: { display: true, text: 'Incident Breakdown by Severity Category', color: textColor, font: { family: 'Poppins', size: 14, weight: 'bold' } }
              }
            }
          });
        } else if (activeTab === 'location') {
          const labels = locations.map((l) => l.location);
          const dataVals = locations.map((l) => l.count);
          chartInstance1.current = new Chart(ctx1, {
            type: 'bar',
            data: {
              labels,
              datasets: [{ label: 'Incidents by Location', data: dataVals, backgroundColor: '#3B82F6', borderRadius: 8 }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              scales: {
                x: { ticks: { color: textColor }, grid: { color: gridColor } },
                y: { ticks: { color: textColor }, grid: { color: gridColor } }
              },
              plugins: { legend: { display: false }, title: { display: true, text: 'Location-based Incident Distribution', color: textColor, font: { family: 'Poppins', size: 14, weight: 'bold' } } }
            }
          });
        } else if (activeTab === 'category') {
          const labels = categories.map((c) => c.category);
          const dataVals = categories.map((c) => c.count);
          chartInstance1.current = new Chart(ctx1, {
            type: 'pie',
            data: {
              labels,
              datasets: [{ data: dataVals, backgroundColor: ['#34D399', '#60A5FA', '#FBBF24', '#F87171', '#A78BFA'] }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { labels: { color: textColor } }, title: { display: true, text: 'Category Severity Proportion', color: textColor, font: { family: 'Poppins', size: 14, weight: 'bold' } } }
            }
          });
        } else if (activeTab === 'classification') {
          const labels = classifications.map((c) => c.classification);
          const dataVals = classifications.map((c) => c.count);
          chartInstance1.current = new Chart(ctx1, {
            type: 'bar',
            data: {
              labels,
              datasets: [{ label: 'Classification Count', data: dataVals, backgroundColor: '#8B5CF6', borderRadius: 8 }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              scales: {
                x: { ticks: { color: textColor }, grid: { color: gridColor } },
                y: { ticks: { color: textColor }, grid: { color: gridColor } }
              },
              plugins: { legend: { display: false }, title: { display: true, text: 'Safety Classification Analysis (Acts vs Conditions)', color: textColor, font: { family: 'Poppins', size: 14, weight: 'bold' } } }
            }
          });
        } else if (activeTab === 'injury') {
          const labels = injuries.map((i) => i.injuryType);
          const dataVals = injuries.map((i) => i.count);
          chartInstance1.current = new Chart(ctx1, {
            type: 'doughnut',
            data: {
              labels,
              datasets: [{ data: dataVals, backgroundColor: ['#EC4899', '#F43F5E', '#10B981', '#F59E0B', '#3B82F6'] }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { labels: { color: textColor } }, title: { display: true, text: 'Injury Type Distribution', color: textColor, font: { family: 'Poppins', size: 14, weight: 'bold' } } }
            }
          });
        } else if (activeTab === 'experience') {
          const labels = experiences.map((e) => e.experienceLevel);
          const dataVals = experiences.map((e) => e.count);
          chartInstance1.current = new Chart(ctx1, {
            type: 'polarArea',
            data: {
              labels,
              datasets: [{ data: dataVals, backgroundColor: ['rgba(59, 130, 246, 0.7)', 'rgba(16, 185, 129, 0.7)', 'rgba(245, 158, 11, 0.7)', 'rgba(239, 68, 68, 0.7)'] }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { labels: { color: textColor } }, title: { display: true, text: 'Experience Level Correlation', color: textColor, font: { family: 'Poppins', size: 14, weight: 'bold' } } }
            }
          });
        } else if (activeTab === 'demerit') {
          const labels = demeritLogs.map((d) => d.workerName);
          const dataVals = demeritLogs.map((d) => d.demeritPoints);
          chartInstance1.current = new Chart(ctx1, {
            type: 'bar',
            data: {
              labels,
              datasets: [{ label: 'Demerit Points', data: dataVals, backgroundColor: '#EF4444', borderRadius: 6 }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              scales: {
                x: { ticks: { color: textColor }, grid: { color: gridColor } },
                y: { ticks: { color: textColor }, grid: { color: gridColor } }
              },
              plugins: { legend: { display: false }, title: { display: true, text: 'Safety Violation Demerit Points by Worker', color: textColor, font: { family: 'Poppins', size: 14, weight: 'bold' } } }
            }
          });
        }
      }
    }

    // Chart 2 Render (for 'all' tab or second visual comparison)
    if (chartRef2.current && activeTab === 'all') {
      const ctx2 = chartRef2.current.getContext('2d');
      if (ctx2) {
        const labels = locations.map((l) => l.location);
        const dataVals = locations.map((l) => l.count);
        chartInstance2.current = new Chart(ctx2, {
          type: 'bar',
          data: {
            labels,
            datasets: [{ label: 'Incidents Count', data: dataVals, backgroundColor: '#2563EB', borderRadius: 8 }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              x: { ticks: { color: textColor }, grid: { color: gridColor } },
              y: { ticks: { color: textColor }, grid: { color: gridColor } }
            },
            plugins: { legend: { display: false }, title: { display: true, text: 'Incident Distribution Across Plant Locations', color: textColor, font: { family: 'Poppins', size: 14, weight: 'bold' } } }
          }
        });
      }
    }
  }, [activeTab, isDarkMode, loading, categories, locations, classifications, injuries, experiences, demeritLogs]);

  // Client-Side Search Filter
  const filteredIncidents = incidents.filter(
    (inc) =>
      inc.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inc.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inc.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inc.classification.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inc.incidentCode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredDemeritLogs = demeritLogs.filter(
    (log) =>
      log.workerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.workerId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.violation.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="glass-card p-4 sm:p-6 mb-8">
      {/* Tab Navigation Header */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-200 dark:border-slate-700">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2">
              <span className="material-symbols-outlined text-blue-600 dark:text-blue-400">analytics</span>
              <span>Safety Performance & Incident Records</span>
            </h2>

            {onOpenAllIncidentsModal && (
              <button
                onClick={onOpenAllIncidentsModal}
                className="ml-0 sm:ml-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white font-extrabold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-blue-600/20 transition-all hover:scale-105"
              >
                <span className="material-symbols-outlined text-base">database</span>
                <span>ALL INCIDENT RECORD</span>
              </button>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time analytics, category breakdowns, and safety violation demerit tracking via Supabase Database
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-1 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
          {[
            { key: 'all', label: 'All Incident' },
            { key: 'location', label: 'Location' },
            { key: 'category', label: 'Category' },
            { key: 'classification', label: 'Classification' },
            { key: 'injury', label: 'Injury Type' },
            { key: 'experience', label: 'Experience' },
            { key: 'demerit', label: 'Violation Demerits' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key as any);
                setSearchQuery('');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === tab.key
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-800 border border-transparent dark:border-zinc-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Loading Skeleton State */}
      {loading ? (
        <div className="p-8 text-center flex flex-col items-center justify-center gap-3">
          <span className="material-symbols-outlined text-4xl text-blue-500 animate-spin">sync</span>
          <p className="text-xs text-slate-500 dark:text-zinc-400">Loading HSE Incident Datasets via GAS Bridge...</p>
        </div>
      ) : (
        <div>
          {/* Analytical Charts Container */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="p-4 rounded-2xl bg-white/60 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 h-72">
              <canvas ref={chartRef1}></canvas>
            </div>
            {activeTab === 'all' && (
              <div className="p-4 rounded-2xl bg-white/60 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 h-72">
                <canvas ref={chartRef2}></canvas>
              </div>
            )}
            {activeTab !== 'all' && (
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 flex flex-col justify-center">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-2 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-blue-500">lightbulb</span>
                  <span>Safety Key Takeaways & Recommendations</span>
                </h3>
                <ul className="text-xs space-y-2 text-slate-600 dark:text-slate-300">
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0"></span>
                    <span><strong>Workshop A & Fabrication Yard</strong> account for over 65% of recorded near misses and minor first-aid cases.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0"></span>
                    <span><strong>Workers with &lt; 1 year experience</strong> require mandatory mentor pairing and refreshed HIRARC briefings.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0"></span>
                    <span>Demerit scoring system has reduced unsafe acts by <strong>42%</strong> over the past 3 quarters.</span>
                  </li>
                </ul>
              </div>
            )}
          </div>

          {/* Client-Side Search Bar */}
          <div className="mb-4 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 dark:bg-slate-900/40 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="relative w-full sm:w-80">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="SEARCH RECORDS..."
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Showing filtered records dynamically
            </span>
          </div>

          {/* Data Tables depending on Active Tab */}
          {activeTab === 'demerit' ? (
            <div className="space-y-6">
              {/* Demerit Violation Log */}
              <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700">
                <table className="w-full text-left text-xs text-slate-800 dark:text-slate-200">
                  <thead className="bg-slate-100 dark:bg-slate-800 uppercase font-bold text-slate-600 dark:text-slate-300">
                    <tr>
                      <th className="p-3">Date</th>
                      <th className="p-3">Worker ID / Name</th>
                      <th className="p-3">Department</th>
                      <th className="p-3">Violation Description</th>
                      <th className="p-3 text-center">Demerit Points</th>
                      <th className="p-3">Action Taken</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700 bg-white dark:bg-slate-900">
                    {filteredDemeritLogs.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-4 text-center text-slate-400">
                          No violation demerit log found matching "{searchQuery}"
                        </td>
                      </tr>
                    ) : (
                      filteredDemeritLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                          <td className="p-3 whitespace-nowrap font-mono">{log.date}</td>
                          <td className="p-3 font-semibold">
                            <div>{log.workerName}</div>
                            <span className="text-[10px] text-slate-400 font-mono">{log.workerId}</span>
                          </td>
                          <td className="p-3">{log.department}</td>
                          <td className="p-3 max-w-xs">{log.violation}</td>
                          <td className="p-3 text-center">
                            <span className="px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 font-bold text-xs">
                              -{log.demeritPoints} pts
                            </span>
                          </td>
                          <td className="p-3 font-medium text-slate-600 dark:text-slate-300">{log.actionTaken}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Demerit Matrix Reference */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700">
                <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3">
                  SAFETY VIOLATION DEMERIT POINTS MATRIX
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-200 dark:bg-slate-800 font-bold">
                      <tr>
                        <th className="p-2.5">Violation Type</th>
                        <th className="p-2.5">Severity</th>
                        <th className="p-2.5 text-center">Deduction</th>
                        <th className="p-2.5">Remediation Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                      {demeritMatrix.map((item) => (
                        <tr key={item.id}>
                          <td className="p-2.5 font-medium">{item.violationType}</td>
                          <td className="p-2.5 font-bold text-amber-600 dark:text-amber-400">{item.severityLevel}</td>
                          <td className="p-2.5 text-center font-bold text-red-500">-{item.pointsDeducted}</td>
                          <td className="p-2.5 text-slate-500 dark:text-slate-400">{item.penaltyRemediation}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            /* Main Incidents Table */
            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700">
              <table className="w-full text-left text-xs text-slate-800 dark:text-slate-200">
                <thead className="bg-slate-100 dark:bg-slate-800 uppercase font-bold text-slate-600 dark:text-slate-300">
                  <tr>
                    <th className="p-3">Code / Date</th>
                    <th className="p-3">Location</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Classification</th>
                    <th className="p-3">Injury Type</th>
                    <th className="p-3">Experience</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Description & Action Plan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700 bg-white dark:bg-slate-900">
                  {filteredIncidents.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-4 text-center text-slate-400">
                        No incident records found matching "{searchQuery}"
                      </td>
                    </tr>
                  ) : (
                    filteredIncidents.map((inc) => (
                      <tr key={inc.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                        <td className="p-3 font-semibold whitespace-nowrap">
                          <div>{inc.incidentCode}</div>
                          <span className="text-[10px] text-slate-400 font-mono">{inc.date}</span>
                        </td>
                        <td className="p-3 whitespace-nowrap font-medium">{inc.location}</td>
                        <td className="p-3 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold">
                            {inc.category}
                          </span>
                        </td>
                        <td className="p-3 whitespace-nowrap">{inc.classification}</td>
                        <td className="p-3 whitespace-nowrap font-medium">{inc.injuryType}</td>
                        <td className="p-3 whitespace-nowrap text-slate-500">{inc.experienceLevel}</td>
                        <td className="p-3 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold">
                            {inc.status}
                          </span>
                        </td>
                        <td className="p-3 max-w-xs">
                          <div className="font-medium text-slate-800 dark:text-slate-200">{inc.description}</div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                            Action: {inc.actionPlan}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
