import React, { useEffect, useState, useRef } from 'react';
import { IncidentRecord } from '../types';
import { fetchLiveIncidentRecords } from '../utils/gasBridge';

declare const Chart: any;

interface IncidentChartsAndTablesProps {
  isDarkMode: boolean;
  onOpenAllIncidentsModal?: () => void;
}

export type TabHeaderKey =
  | 'DATE'
  | 'YEAR'
  | 'LOCATION'
  | 'DESCRIPTION'
  | 'OCCUPATIONAL INCIDENT?'
  | 'INCIDENT CATEGORY'
  | 'PROPERTY DAMAGE'
  | 'DAMAGE LEVEL'
  | 'CLASSIFICATION'
  | 'INJURY TYPE'
  | 'PERSON INVOLVE'
  | 'WORK EXPERIENCE';

export const TAB_HEADERS: { key: TabHeaderKey; label: string; icon: string }[] = [
  { key: 'DATE', label: 'DATE', icon: 'calendar_today' },
  { key: 'YEAR', label: 'YEAR', icon: 'event' },
  { key: 'LOCATION', label: 'LOCATION', icon: 'location_on' },
  { key: 'DESCRIPTION', label: 'DESCRIPTION', icon: 'notes' },
  { key: 'OCCUPATIONAL INCIDENT?', label: 'OCCUPATIONAL INCIDENT?', icon: 'engineering' },
  { key: 'INCIDENT CATEGORY', label: 'INCIDENT CATEGORY', icon: 'category' },
  { key: 'PROPERTY DAMAGE', label: 'PROPERTY DAMAGE', icon: 'home_repair_service' },
  { key: 'DAMAGE LEVEL', label: 'DAMAGE LEVEL', icon: 'warning' },
  { key: 'CLASSIFICATION', label: 'CLASSIFICATION', icon: 'report_problem' },
  { key: 'INJURY TYPE', label: 'INJURY TYPE', icon: 'medical_services' },
  { key: 'PERSON INVOLVE', label: 'PERSON INVOLVE', icon: 'person' },
  { key: 'WORK EXPERIENCE', label: 'WORK EXPERIENCE', icon: 'work_history' },
];

const PALETTE = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#EC4899', '#06B6D4', '#6366F1', '#14B8A6', '#F97316',
  '#84CC16', '#A855F7', '#64748B'
];

// Custom Plugin to draw centered data labels/numbers on chart elements
const centerDataLabelsPlugin = {
  id: 'centerDataLabels',
  afterDatasetsDraw(chart: any) {
    const { ctx } = chart;
    ctx.save();
    ctx.font = 'bold 11px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    chart.data.datasets.forEach((dataset: any, datasetIndex: number) => {
      const meta = chart.getDatasetMeta(datasetIndex);
      if (!meta || !meta.data) return;

      const isHorizontalBar = chart.options?.indexAxis === 'y';

      meta.data.forEach((element: any, index: number) => {
        const val = dataset.data[index];
        if (val === undefined || val === null || val === 0) return;

        let posX = element.x;
        let posY = element.y;

        if (meta.type === 'bar') {
          if (isHorizontalBar) {
            const base = element.base ?? 0;
            posX = (base + element.x) / 2;
            posY = element.y;
          } else {
            const base = element.base ?? (chart.chartArea ? chart.chartArea.bottom : element.y);
            posX = element.x;
            posY = (base + element.y) / 2;
          }
        } else if (element.tooltipPosition) {
          const pos = element.tooltipPosition();
          posX = pos.x;
          posY = pos.y;
        }

        const textStr = String(val);

        // Optional shadow for contrast without rectangle box
        ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
        ctx.shadowBlur = 3;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 1;

        // Centered white text
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(textStr, posX, posY + 0.5);
      });
    });
    ctx.restore();
  },
};

export const IncidentChartsAndTables: React.FC<IncidentChartsAndTablesProps> = ({
  isDarkMode,
  onOpenAllIncidentsModal,
}) => {
  const [activeTab, setActiveTab] = useState<TabHeaderKey>('YEAR');
  const [incidents, setIncidents] = useState<IncidentRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);

  // Canvas Refs for Charts
  const chartRef1 = useRef<HTMLCanvasElement | null>(null);
  const chartRef2 = useRef<HTMLCanvasElement | null>(null);
  const occupationalChartRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstance1 = useRef<any>(null);
  const chartInstance2 = useRef<any>(null);
  const occupationalChartInstance = useRef<any>(null);

  // Fetch Live Incident Records from Google Sheets
  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchLiveIncidentRecords();
      setIncidents(data as IncidentRecord[]);
    } catch (err) {
      console.error('Error loading incident records:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Calculate Frequency map helper
  const getFrequencyMap = (fieldExtractor: (record: IncidentRecord) => string) => {
    const counts: Record<string, number> = {};
    incidents.forEach((rec) => {
      const val = fieldExtractor(rec)?.trim() || 'N/A';
      if (val !== '' && val !== '-') {
        counts[val] = (counts[val] || 0) + 1;
      } else {
        counts['N/A'] = (counts['N/A'] || 0) + 1;
      }
    });
    return counts;
  };

  // Render Charts on activeTab / data change
  useEffect(() => {
    if (loading || typeof Chart === 'undefined' || incidents.length === 0) return;

    // Register plugin if supported
    if (typeof Chart !== 'undefined' && Chart.register) {
      try {
        Chart.register(centerDataLabelsPlugin);
      } catch (e) {
        // ignore duplicate registration
      }
    }

    // Destroy previous chart instances
    if (chartInstance1.current) {
      chartInstance1.current.destroy();
      chartInstance1.current = null;
    }
    if (chartInstance2.current) {
      chartInstance2.current.destroy();
      chartInstance2.current = null;
    }
    if (occupationalChartInstance.current) {
      occupationalChartInstance.current.destroy();
      occupationalChartInstance.current = null;
    }

    const textColor = isDarkMode ? '#F8FAFC' : '#0F172A';
    const gridColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(15, 23, 42, 0.08)';

    // Render Occupational Incidents (YES only) Sharp Line Chart
    if (occupationalChartRef.current) {
      const occCtx = occupationalChartRef.current.getContext('2d');
      if (occCtx) {
        // Group by Year for OCCUPATIONAL INCIDENT? === 'YES'
        const occCountsByYear: Record<string, number> = {};
        incidents.forEach((r) => {
          const isOcc = r.occupationalIncident?.trim().toUpperCase() === 'YES';
          if (isOcc) {
            let yr = r.year?.trim() || '';
            if (!yr || yr === '-') {
              if (r.date && r.date.includes('/')) {
                const parts = r.date.split('/');
                if (parts.length === 3) {
                  const possibleYear = parts[2].trim();
                  if (possibleYear.length === 4) {
                    yr = possibleYear;
                  }
                }
              } else if (r.date && r.date.includes('-')) {
                const parts = r.date.split('-');
                if (parts.length === 3) {
                  const possibleYear = parts[0].trim();
                  if (possibleYear.length === 4) {
                    yr = possibleYear;
                  }
                }
              }
            }
            if (yr && yr !== '-') {
              occCountsByYear[yr] = (occCountsByYear[yr] || 0) + 1;
            }
          }
        });

        const occYears = Object.keys(occCountsByYear).sort();
        const occData = occYears.map((y) => occCountsByYear[y]);

        occupationalChartInstance.current = new Chart(occCtx, {
          type: 'line',
          data: {
            labels: occYears.length > 0 ? occYears : ['2022', '2023', '2024', '2025', '2026'],
            datasets: [
              {
                label: 'Occupational Incidents',
                data: occYears.length > 0 ? occData : [0, 0, 0, 0, 0],
                borderColor: '#F59E0B',
                backgroundColor: 'rgba(245, 158, 11, 0.08)',
                borderWidth: 3.5,
                tension: 0, // Sharp line segments ("jenis tajam")
                pointBackgroundColor: '#F59E0B',
                pointBorderColor: isDarkMode ? '#1E293B' : '#FFFFFF',
                pointBorderWidth: 2,
                pointRadius: 6,
                pointHoverRadius: 8,
                fill: true,
              },
            ],
          },
          options: {
            animation: { duration: 1500, easing: 'easeOutQuart' },
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              x: {
                ticks: { color: textColor, font: { weight: 'bold', size: 11 } },
                grid: { color: gridColor },
              },
              y: {
                ticks: { color: textColor, precision: 0 },
                grid: { color: gridColor },
                suggestedMin: 0,
              },
            },
            plugins: {
              legend: { display: false },
              title: {
                display: true,
                text: 'OCCUPATIONAL INCIDENTS ANNUAL TREND',
                color: textColor,
                font: { size: 12, weight: 'extrabold' },
              },
            },
          },
        });
      }
    }

    if (!chartRef1.current) return;
    const ctx1 = chartRef1.current.getContext('2d');
    if (!ctx1) return;

    // Chart 1 Render according to selected Header Tab
    switch (activeTab) {
      case 'DATE': {
        // Group by Month from date strings e.g. "25/07/2022" -> "Jul"
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthCounts: Record<string, number> = {};
        months.forEach((m) => (monthCounts[m] = 0));

        incidents.forEach((r) => {
          if (r.date && r.date.includes('/')) {
            const parts = r.date.split('/');
            if (parts.length >= 2) {
              const monthIdx = parseInt(parts[1], 10) - 1;
              if (monthIdx >= 0 && monthIdx < 12) {
                const mName = months[monthIdx];
                monthCounts[mName] = (monthCounts[mName] || 0) + 1;
              }
            }
          }
        });

        chartInstance1.current = new Chart(ctx1, {
          type: 'bar',
          data: {
            labels: months,
            datasets: [
              {
                label: 'Incidents Count',
                data: months.map((m) => monthCounts[m]),
                backgroundColor: '#10B981',
                borderRadius: 6,
              },
            ],
          },
          options: { animation: { duration: 1500, easing: 'easeOutQuart' },
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              x: { ticks: { color: textColor }, grid: { color: gridColor } },
              y: { ticks: { color: textColor, precision: 0 }, grid: { color: gridColor } },
            },
            plugins: {
              legend: { display: false },
              title: {
                display: true,
                text: 'INCIDENT FREQUENCY BY MONTH OF YEAR',
                color: textColor,
                font: { size: 14, weight: 'bold' },
              },
            },
          },
        });
        break;
      }

      case 'YEAR': {
        const counts = getFrequencyMap((r) => r.year || 'N/A');
        const labels = Object.keys(counts).sort();
        const data = labels.map((l) => counts[l]);

        chartInstance1.current = new Chart(ctx1, {
          type: 'bar',
          data: {
            labels,
            datasets: [
              {
                label: 'Total Incidents',
                data,
                backgroundColor: ['#3B82F6', '#8B5CF6', '#EC4899', '#10B981'],
                borderRadius: 8,
              },
            ],
          },
          options: { animation: { duration: 1500, easing: 'easeOutQuart' },
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              x: { ticks: { color: textColor }, grid: { color: gridColor } },
              y: { ticks: { color: textColor, precision: 0 }, grid: { color: gridColor } },
            },
            plugins: {
              legend: { display: false },
              title: {
                display: true,
                text: 'INCIDENTS BREAKDOWN BY YEAR',
                color: textColor,
                font: { size: 14, weight: 'bold' },
              },
            },
          },
        });
        break;
      }

      case 'LOCATION': {
        const counts = getFrequencyMap((r) => r.location);
        const labels = Object.keys(counts);
        const data = Object.values(counts);

        chartInstance1.current = new Chart(ctx1, {
          type: 'bar',
          data: {
            labels,
            datasets: [
              {
                label: 'Incidents Count',
                data,
                backgroundColor: '#3B82F6',
                borderRadius: 6,
              },
            ],
          },
          options: { animation: { duration: 1500, easing: 'easeOutQuart' },
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              x: { ticks: { color: textColor, precision: 0 }, grid: { color: gridColor } },
              y: { ticks: { color: textColor }, grid: { color: gridColor } },
            },
            plugins: {
              legend: { display: false },
              title: {
                display: true,
                text: 'INCIDENTS DISTRIBUTION BY LOCATION',
                color: textColor,
                font: { size: 14, weight: 'bold' },
              },
            },
          },
        });
        break;
      }

      case 'DESCRIPTION': {
        // Extract common keywords/incident types from description
        const keywords = [
          'Motorcycle',
          'Company car / lorry',
          'Power tools / Grinder',
          'Fire / Platform',
          'Fell / Hit',
          'Bitten by dog',
        ];
        const kwCounts: Record<string, number> = {
          'Motorcycle Accident': 0,
          'Vehicle Incident (Car/Lorry)': 0,
          'Power Tools / Grinder': 0,
          'Fire / Platform Basket': 0,
          'Object Fell / Pinch / Hit': 0,
          'Animal Bite (Dog)': 0,
          'Others': 0,
        };

        incidents.forEach((r) => {
          const desc = r.description.toLowerCase();
          if (desc.includes('motorcycle')) kwCounts['Motorcycle Accident']++;
          else if (desc.includes('car') || desc.includes('lorry')) kwCounts['Vehicle Incident (Car/Lorry)']++;
          else if (desc.includes('tools') || desc.includes('grinder')) kwCounts['Power Tools / Grinder']++;
          else if (desc.includes('fire')) kwCounts['Fire / Platform Basket']++;
          else if (desc.includes('fell') || desc.includes('hit') || desc.includes('pinched')) kwCounts['Object Fell / Pinch / Hit']++;
          else if (desc.includes('dog') || desc.includes('bitten')) kwCounts['Animal Bite (Dog)']++;
          else kwCounts['Others']++;
        });

        const labels = Object.keys(kwCounts);
        const data = Object.values(kwCounts);

        chartInstance1.current = new Chart(ctx1, {
          type: 'bar',
          data: {
            labels,
            datasets: [
              {
                label: 'Incidents Count',
                data,
                backgroundColor: PALETTE.slice(0, labels.length),
                borderRadius: 6,
              },
            ],
          },
          options: { animation: { duration: 1500, easing: 'easeOutQuart' },
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              x: { ticks: { color: textColor, font: { size: 10 } }, grid: { color: gridColor } },
              y: { ticks: { color: textColor, precision: 0 }, grid: { color: gridColor } },
            },
            plugins: {
              legend: { display: false },
              title: {
                display: true,
                text: 'COMMON INCIDENT TYPES (EXTRACTED FROM DESCRIPTION)',
                color: textColor,
                font: { size: 14, weight: 'bold' },
              },
            },
          },
        });
        break;
      }

      case 'OCCUPATIONAL INCIDENT?': {
        const counts = getFrequencyMap((r) => r.occupationalIncident || 'NO');
        const labels = Object.keys(counts);
        const data = Object.values(counts);

        chartInstance1.current = new Chart(ctx1, {
          type: 'pie',
          data: {
            labels,
            datasets: [
              {
                data,
                backgroundColor: ['#10B981', '#EF4444', '#F59E0B'],
                borderWidth: 2,
                borderColor: isDarkMode ? '#1E293B' : '#FFFFFF',
              },
            ],
          },
          options: { animation: { duration: 1500, easing: 'easeOutQuart' },
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { labels: { color: textColor, font: { size: 12, weight: 'bold' } } },
              title: {
                display: true,
                text: 'OCCUPATIONAL vs NON-OCCUPATIONAL INCIDENTS',
                color: textColor,
                font: { size: 14, weight: 'bold' },
              },
            },
          },
        });
        break;
      }

      case 'INCIDENT CATEGORY': {
        const counts = getFrequencyMap((r) => r.category);
        const labels = Object.keys(counts);
        const data = Object.values(counts);

        chartInstance1.current = new Chart(ctx1, {
          type: 'doughnut',
          data: {
            labels,
            datasets: [
              {
                data,
                backgroundColor: ['#F59E0B', '#3B82F6', '#EF4444', '#10B981', '#8B5CF6'],
                borderWidth: 2,
                borderColor: isDarkMode ? '#1E293B' : '#FFFFFF',
              },
            ],
          },
          options: { animation: { duration: 1500, easing: 'easeOutQuart' },
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { labels: { color: textColor, font: { size: 11, weight: 'bold' } } },
              title: {
                display: true,
                text: 'INCIDENT CATEGORY DISTRIBUTION',
                color: textColor,
                font: { size: 14, weight: 'bold' },
              },
            },
          },
        });
        break;
      }

      case 'PROPERTY DAMAGE': {
        const counts = getFrequencyMap((r) => r.propertyDamage || 'N/A');
        const labels = Object.keys(counts);
        const data = Object.values(counts);

        chartInstance1.current = new Chart(ctx1, {
          type: 'pie',
          data: {
            labels,
            datasets: [
              {
                data,
                backgroundColor: ['#EF4444', '#10B981', '#64748B'],
                borderWidth: 2,
                borderColor: isDarkMode ? '#1E293B' : '#FFFFFF',
              },
            ],
          },
          options: { animation: { duration: 1500, easing: 'easeOutQuart' },
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { labels: { color: textColor, font: { size: 12, weight: 'bold' } } },
              title: {
                display: true,
                text: 'PROPERTY DAMAGE INVOLVEMENT (YES / NO)',
                color: textColor,
                font: { size: 14, weight: 'bold' },
              },
            },
          },
        });
        break;
      }

      case 'DAMAGE LEVEL': {
        const counts = getFrequencyMap((r) => r.damageLevel || 'N/A');
        const labels = Object.keys(counts);
        const data = Object.values(counts);

        chartInstance1.current = new Chart(ctx1, {
          type: 'bar',
          data: {
            labels,
            datasets: [
              {
                label: 'Incidents Count',
                data,
                backgroundColor: ['#F59E0B', '#EF4444', '#64748B', '#3B82F6'],
                borderRadius: 6,
              },
            ],
          },
          options: { animation: { duration: 1500, easing: 'easeOutQuart' },
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              x: { ticks: { color: textColor }, grid: { color: gridColor } },
              y: { ticks: { color: textColor, precision: 0 }, grid: { color: gridColor } },
            },
            plugins: {
              legend: { display: false },
              title: {
                display: true,
                text: 'DAMAGE SEVERITY LEVEL BREAKDOWN',
                color: textColor,
                font: { size: 14, weight: 'bold' },
              },
            },
          },
        });
        break;
      }

      case 'CLASSIFICATION': {
        const counts = getFrequencyMap((r) => r.classification);
        const labels = Object.keys(counts);
        const data = Object.values(counts);

        chartInstance1.current = new Chart(ctx1, {
          type: 'bar',
          data: {
            labels,
            datasets: [
              {
                label: 'Incidents Count',
                data,
                backgroundColor: '#8B5CF6',
                borderRadius: 6,
              },
            ],
          },
          options: { animation: { duration: 1500, easing: 'easeOutQuart' },
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              x: { ticks: { color: textColor, font: { size: 10 } }, grid: { color: gridColor } },
              y: { ticks: { color: textColor, precision: 0 }, grid: { color: gridColor } },
            },
            plugins: {
              legend: { display: false },
              title: {
                display: true,
                text: 'SAFETY CLASSIFICATION (ACTS vs CONDITIONS vs VEHICLES)',
                color: textColor,
                font: { size: 14, weight: 'bold' },
              },
            },
          },
        });
        break;
      }

      case 'INJURY TYPE': {
        const counts = getFrequencyMap((r) => r.injuryType || 'N/A');
        const labels = Object.keys(counts);
        const data = Object.values(counts);

        chartInstance1.current = new Chart(ctx1, {
          type: 'doughnut',
          data: {
            labels,
            datasets: [
              {
                data,
                backgroundColor: PALETTE.slice(0, labels.length),
                borderWidth: 2,
                borderColor: isDarkMode ? '#1E293B' : '#FFFFFF',
              },
            ],
          },
          options: { animation: { duration: 1500, easing: 'easeOutQuart' },
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { labels: { color: textColor, font: { size: 11, weight: 'bold' } } },
              title: {
                display: true,
                text: 'INJURY TYPE DISTRIBUTION',
                color: textColor,
                font: { size: 14, weight: 'bold' },
              },
            },
          },
        });
        break;
      }

      case 'PERSON INVOLVE': {
        const counts = getFrequencyMap((r) => r.personInvolved || (r as any).person_involved || 'N/A');
        const labels = Object.keys(counts);
        const data = Object.values(counts);

        chartInstance1.current = new Chart(ctx1, {
          type: 'bar',
          data: {
            labels,
            datasets: [
              {
                label: 'Incidents Count',
                data,
                backgroundColor: '#EC4899',
                borderRadius: 6,
              },
            ],
          },
          options: { animation: { duration: 1500, easing: 'easeOutQuart' },
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              x: { ticks: { color: textColor, font: { size: 10 } }, grid: { color: gridColor } },
              y: { ticks: { color: textColor, precision: 0 }, grid: { color: gridColor } },
            },
            plugins: {
              legend: { display: false },
              title: {
                display: true,
                text: 'INCIDENTS FREQUENCY BY PERSON INVOLVED',
                color: textColor,
                font: { size: 14, weight: 'bold' },
              },
            },
          },
        });
        break;
      }

      case 'WORK EXPERIENCE': {
        const counts = getFrequencyMap((r) => r.experienceLevel || 'N/A');
        const labels = Object.keys(counts);
        const data = Object.values(counts);

        chartInstance1.current = new Chart(ctx1, {
          type: 'polarArea',
          data: {
            labels,
            datasets: [
              {
                data,
                backgroundColor: PALETTE.slice(0, labels.length).map((c) => c + 'B3'),
              },
            ],
          },
          options: { animation: { duration: 1500, easing: 'easeOutQuart' },
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { labels: { color: textColor, font: { size: 11, weight: 'bold' } } },
              title: {
                display: true,
                text: 'WORK EXPERIENCE LEVEL CORRELATION',
                color: textColor,
                font: { size: 14, weight: 'bold' },
              },
            },
          },
        });
        break;
      }

      default:
        break;
    }
  }, [activeTab, incidents, isDarkMode, loading]);

  // Client-Side Search Filter across all fields
  const filteredIncidents = incidents.filter((inc) => {
    const q = searchQuery.toLowerCase();
    const desc = inc.description || '';
    const person = inc.personInvolved || '';
    const reporter = inc.reportedBy || '';
    return (
      inc.id.toLowerCase().includes(q) ||
      inc.date.toLowerCase().includes(q) ||
      (inc.year && inc.year.toLowerCase().includes(q)) ||
      inc.location.toLowerCase().includes(q) ||
      desc.toLowerCase().includes(q) ||
      inc.category.toLowerCase().includes(q) ||
      inc.classification.toLowerCase().includes(q) ||
      (inc.injuryType && inc.injuryType.toLowerCase().includes(q)) ||
      person.toLowerCase().includes(q) ||
      (inc.experienceLevel && inc.experienceLevel.toLowerCase().includes(q)) ||
      reporter.toLowerCase().includes(q)
    );
  });

  // Display only 10 latest cases
  const displayIncidents = [...filteredIncidents]
    .sort((a, b) => {
      const yearA = parseInt(a.year || '0', 10);
      const yearB = parseInt(b.year || '0', 10);
      if (yearA !== yearB && !isNaN(yearA) && !isNaN(yearB) && yearA > 0 && yearB > 0) {
        return yearB - yearA;
      }
      const idA = parseInt(a.id.replace(/\D/g, ''), 10);
      const idB = parseInt(b.id.replace(/\D/g, ''), 10);
      if (!isNaN(idA) && !isNaN(idB) && idA !== idB && idA > 0 && idB > 0) {
        return idB - idA;
      }
      return 0;
    })
    .slice(0, 10);

  return (
    <div className="glass-card p-4 sm:p-6 mb-8">
      {/* Title & Refresh Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-lg sm:text-xl font-extrabold flex items-center gap-2 text-slate-900 dark:text-white">
            <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 text-2xl">analytics</span>
            <span>SAFETY PERFORMANCE & LIVE INCIDENT ANALYTICS</span>
          </h2>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end">
          <button
            onClick={loadData}
            disabled={loading}
            className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-2 transition-all border border-slate-200 dark:border-slate-700"
          >
            <span className={`material-symbols-outlined text-base ${loading ? 'animate-spin text-blue-500' : ''}`}>
              sync
            </span>
            <span>REFRESH</span>
          </button>

          {onOpenAllIncidentsModal && (
            <button
              onClick={onOpenAllIncidentsModal}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white font-extrabold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-blue-600/20 transition-all hover:scale-105"
            >
              <span className="material-symbols-outlined text-base">database</span>
              <span>ALL INCIDENT RECORD TABLE</span>
            </button>
          )}
        </div>
      </div>

      {/* Header Dropdown Filter matching All Incident Record Table Columns */}
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-900/60 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800">
        <label htmlFor="header-select" className="text-xs font-extrabold text-slate-700 dark:text-slate-300 flex items-center gap-2 uppercase tracking-wider">
          <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 text-xl">filter_alt</span>
          <span>INTERACTIVE CHART</span>
        </label>
        <div className="relative w-full sm:w-80">
          <select
            id="header-select"
            value={activeTab}
            onChange={(e) => setActiveTab(e.target.value as TabHeaderKey)}
            className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-extrabold text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm cursor-pointer appearance-none pr-10"
          >
            {TAB_HEADERS.map((tab) => (
              <option key={tab.key} value={tab.key}>
                {tab.label}
              </option>
            ))}
          </select>
          <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-xl">
            arrow_drop_down
          </span>
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="p-12 text-center flex flex-col items-center justify-center">
          <span className="material-symbols-outlined text-4xl text-blue-500 animate-spin">sync</span>
        </div>
      ) : (
        <div>
          {/* Interactive Chart Container */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 h-80 shadow-sm">
              <canvas ref={chartRef1}></canvas>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-4">
              {/* Annual Occupational Incidents Sharp Line Chart */}
              <div className="p-3 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800/80 rounded-xl shadow-sm h-40">
                <canvas ref={occupationalChartRef}></canvas>
              </div>

              <div className="flex flex-col space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                  <span className="material-symbols-outlined text-blue-500 text-xl">insights</span>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    HEADER KPI SUMMARY: {activeTab}
                  </h3>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Total Records</p>
                    <p className="text-base font-extrabold text-blue-600 dark:text-blue-400">{incidents.length}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Occupational</p>
                    <p className="text-base font-extrabold text-amber-600 dark:text-amber-400">
                      {incidents.filter((i) => i.occupationalIncident?.toUpperCase() === 'YES').length}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Search Toolbar */}
          <div className="mb-4 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 dark:bg-slate-900/40 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="relative w-full sm:w-96">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search ID, Location, Category, Description, Person..."
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Showing <strong className="text-slate-900 dark:text-white">{displayIncidents.length}</strong> latest cases (Total <strong className="text-slate-900 dark:text-white">{incidents.length}</strong> records)
            </span>
          </div>

          {/* All Incident Records Live Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-300 dark:border-zinc-700 shadow-sm">
            <table className="w-full border-collapse border border-slate-300 dark:border-zinc-700 text-left text-xs whitespace-nowrap">
              <thead>
                <tr className="bg-slate-100 dark:bg-zinc-800/80 text-slate-800 dark:text-zinc-100">
                  <th className="py-3 px-3 border border-slate-300 dark:border-zinc-700 font-extrabold uppercase text-[10px] tracking-wider whitespace-nowrap text-center">NO</th>
                  <th className="py-3 px-3 border border-slate-300 dark:border-zinc-700 font-extrabold uppercase text-[10px] tracking-wider whitespace-nowrap text-center">DATE</th>
                  <th className="py-3 px-3 border border-slate-300 dark:border-zinc-700 font-extrabold uppercase text-[10px] tracking-wider whitespace-nowrap text-center">YEAR</th>
                  <th className="py-3 px-3 border border-slate-300 dark:border-zinc-700 font-extrabold uppercase text-[10px] tracking-wider min-w-[120px]">LOCATION</th>
                  <th className="py-3 px-3 border border-slate-300 dark:border-zinc-700 font-extrabold uppercase text-[10px] tracking-wider min-w-[200px]">DESCRIPTION</th>
                  <th className="py-3 px-3 border border-slate-300 dark:border-zinc-700 font-extrabold uppercase text-[10px] tracking-wider text-center whitespace-nowrap">OCCUPATIONAL INCIDENT?</th>
                  <th className="py-3 px-3 border border-slate-300 dark:border-zinc-700 font-extrabold uppercase text-[10px] tracking-wider min-w-[140px]">INCIDENT CATEGORY</th>
                  <th className="py-3 px-3 border border-slate-300 dark:border-zinc-700 font-extrabold uppercase text-[10px] tracking-wider text-center whitespace-nowrap">PROPERTY DAMAGE</th>
                  <th className="py-3 px-3 border border-slate-300 dark:border-zinc-700 font-extrabold uppercase text-[10px] tracking-wider whitespace-nowrap">DAMAGE LEVEL</th>
                  <th className="py-3 px-3 border border-slate-300 dark:border-zinc-700 font-extrabold uppercase text-[10px] tracking-wider min-w-[140px]">CLASSIFICATION</th>
                  <th className="py-3 px-3 border border-slate-300 dark:border-zinc-700 font-extrabold uppercase text-[10px] tracking-wider min-w-[120px]">INJURY TYPE</th>
                  <th className="py-3 px-3 border border-slate-300 dark:border-zinc-700 font-extrabold uppercase text-[10px] tracking-wider min-w-[120px]">PERSON INVOLVE</th>
                  <th className="py-3 px-3 border border-slate-300 dark:border-zinc-700 font-extrabold uppercase text-[10px] tracking-wider whitespace-nowrap">WORK EXPERIENCE</th>
                  <th className="py-3 px-3 border border-slate-300 dark:border-zinc-700 font-extrabold uppercase text-[10px] tracking-wider min-w-[110px]">REPORTED BY</th>
                  <th className="py-3 px-3 border border-slate-300 dark:border-zinc-700 font-extrabold uppercase text-[10px] tracking-wider text-center whitespace-nowrap">PDF</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 bg-white dark:bg-slate-900/40 text-slate-700 dark:text-slate-300">
                {displayIncidents.length === 0 ? (
                  <tr>
                    <td colSpan={15} className="py-8 text-center text-slate-400">
                      No incident records found matching "{searchQuery}"
                    </td>
                  </tr>
                ) : (
                  displayIncidents.map((inc) => {
                    const isSelected = selectedRowId === inc.id;
                    return (
                      <tr 
                        key={inc.id} 
                        onClick={() => setSelectedRowId(isSelected ? null : inc.id)}
                        className={`transition-colors cursor-pointer ${
                          isSelected 
                            ? 'bg-slate-200/80 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold shadow-inner' 
                            : 'hover:bg-slate-100 dark:hover:bg-slate-800/80 active:bg-slate-200 dark:active:bg-slate-700/60'
                        }`}
                      >
                      {/* 1. NO */}
                      <td className="py-3 px-3 font-mono font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap border border-slate-300 dark:border-zinc-700 text-center">
                        {inc.id}
                      </td>
                      {/* 2. DATE */}
                      <td className="py-3 px-3 font-mono whitespace-nowrap text-slate-500 dark:text-slate-400 border border-slate-300 dark:border-zinc-700">
                        {inc.date}
                      </td>
                      {/* 3. YEAR */}
                      <td className="py-3 px-3 font-mono whitespace-nowrap text-slate-500 dark:text-slate-400 border border-slate-300 dark:border-zinc-700 text-center">
                        {inc.year || '-'}
                      </td>
                      {/* 4. LOCATION */}
                      <td className="py-3 px-3 font-bold text-slate-900 dark:text-slate-200 whitespace-nowrap border border-slate-300 dark:border-zinc-700">
                        {inc.location}
                      </td>
                      {/* 5. DESCRIPTION */}
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-400 min-w-[200px] border border-slate-300 dark:border-zinc-700" title={inc.description}>
                        <div className="line-clamp-2">{inc.description || '-'}</div>
                      </td>
                      {/* 6. OCCUPATIONAL INCIDENT? */}
                      <td className="py-3 px-3 text-center whitespace-nowrap border border-slate-300 dark:border-zinc-700">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            inc.occupationalIncident?.toUpperCase() === 'YES'
                              ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          {inc.occupationalIncident || '-'}
                        </span>
                      </td>
                      {/* 7. INCIDENT CATEGORY */}
                      <td className="py-3 px-3 whitespace-nowrap border border-slate-300 dark:border-zinc-700">
                        <span className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-[11px] font-bold">
                          {inc.category || '-'}
                        </span>
                      </td>
                      {/* 8. PROPERTY DAMAGE */}
                      <td className="py-3 px-3 text-center whitespace-nowrap font-medium border border-slate-300 dark:border-zinc-700">
                        {inc.propertyDamage || '-'}
                      </td>
                      {/* 9. DAMAGE LEVEL */}
                      <td className="py-3 px-3 whitespace-nowrap font-medium text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-zinc-700">
                        {inc.damageLevel || '-'}
                      </td>
                      {/* 10. CLASSIFICATION */}
                      <td className="py-3 px-3 font-medium text-slate-800 dark:text-slate-300 whitespace-nowrap border border-slate-300 dark:border-zinc-700">
                        {inc.classification || '-'}
                      </td>
                      {/* 11. INJURY TYPE */}
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-400 whitespace-nowrap border border-slate-300 dark:border-zinc-700">
                        {inc.injuryType || '-'}
                      </td>
                      {/* 12. PERSON INVOLVE */}
                      <td className="py-3 px-3 font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap border border-slate-300 dark:border-zinc-700">
                        {inc.personInvolved || (inc as any).person_involved || '-'}
                      </td>
                      {/* 13. WORK EXPERIENCE */}
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-400 whitespace-nowrap border border-slate-300 dark:border-zinc-700">
                        {inc.experienceLevel || '-'}
                      </td>
                      {/* 14. REPORTED BY */}
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-400 whitespace-nowrap border border-slate-300 dark:border-zinc-700">
                        {inc.reportedBy || (inc as any).investigator || '-'}
                      </td>
                      {/* 15. PDF / DOCUMENT */}
                      <td className="py-3 px-3 text-center whitespace-nowrap border border-slate-300 dark:border-zinc-700">
                        {inc.documentUrl && inc.documentUrl !== '-' && inc.documentUrl !== '' ? (
                          <a
                            href={inc.documentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors text-xs font-bold gap-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <span className="material-symbols-outlined text-[15px]">description</span>
                            <span>Open Doc</span>
                          </a>
                        ) : (
                          <span className="text-slate-300 dark:text-slate-600">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
