import React, { useEffect, useState, useRef } from 'react';
import { IncidentRecord } from '../types';
import {
  fetchLiveIncidentRecords,
  fetchSummaryTablesFromGoogleSheet,
  SummaryTablesMap,
  SummaryTableSectionData,
} from '../utils/gasBridge';
import { formatToPreviewUrl } from '../utils/formatDriveUrl';
import * as XLSX from 'xlsx';
import Chart from 'chart.js/auto';
import { generateIncidentFullAnalyticsReport } from '../utils/incidentReportPdfGenerator';

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
  const [summaryTables, setSummaryTables] = useState<SummaryTablesMap | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [selectedSummaryRowIdx, setSelectedSummaryRowIdx] = useState<number | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);

  // Canvas Refs for Charts
  const chartRef1 = useRef<HTMLCanvasElement | null>(null);
  const chartRef2 = useRef<HTMLCanvasElement | null>(null);
  const occupationalChartRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstance1 = useRef<any>(null);
  const chartInstance2 = useRef<any>(null);
  const occupationalChartInstance = useRef<any>(null);

  // Fetch Live Incident Records & Summary Tables from Google Sheets
  const loadData = async () => {
    setLoading(true);
    try {
      const [data, tablesMap] = await Promise.all([
        fetchLiveIncidentRecords(),
        fetchSummaryTablesFromGoogleSheet(),
      ]);
      setIncidents(data as IncidentRecord[]);
      setSummaryTables(tablesMap);
    } catch (err) {
      console.error('Error loading incident records or summary tables:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Helper to get active summary table from Google Sheets data matching dropdown list selection
  const getActiveSummaryTable = (): SummaryTableSectionData | null => {
    if (!summaryTables) return null;

    switch (activeTab) {
      case 'LOCATION':
        return summaryTables['LOCATION'] || null;
      case 'INCIDENT CATEGORY':
        return summaryTables['INCIDENT CATEGORY'] || null;
      case 'CLASSIFICATION':
        return summaryTables['CLASSIFICATION'] || null;
      case 'INJURY TYPE':
        return summaryTables['INJURY TYPE'] || null;
      case 'WORK EXPERIENCE':
        return summaryTables['WORK EXPERIENCE'] || null;
      case 'OCCUPATIONAL INCIDENT?':
        return summaryTables['OCCUPATIONAL INCIDENT'] || null;
      default:
        // Default to LOCATION summary table for other tabs (DATE, YEAR, DESCRIPTION, etc.)
        return summaryTables['LOCATION'] || summaryTables['INCIDENT CATEGORY'] || null;
    }
  };

  // Export summary table to Excel as requested
  const exportSummaryTableToExcel = () => {
    const tableData = getActiveSummaryTable();
    if (!tableData) return;

    const colName = tableData.headers[1] || 'CATEGORY';
    const totalName = tableData.headers[7] || 'TOTAL INCIDENTS';

    const exportRows = tableData.rows.map((r, idx) => {
      const obj: any = {};
      obj['NO'] = r.no || (r.isTotal ? '' : String(idx + 1));
      obj[colName] = r.label;
      obj['2022'] = r.c2022;
      obj['2023'] = r.c2023;
      obj['2024'] = r.c2024;
      obj['2025'] = r.c2025;
      obj['2026'] = r.c2026;
      obj[totalName] = r.total;
      return obj;
    });

    const headerOrder = [
      'NO',
      colName,
      '2022',
      '2023',
      '2024',
      '2025',
      '2026',
      totalName
    ];

    const worksheet = XLSX.utils.json_to_sheet(exportRows, { header: headerOrder });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Summary');

    const fileName = `${tableData.title.replace(/[^a-zA-Z0-9]/g, '_')}_Summary.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  // Generate Comprehensive PDF Report with analysis & charts for 7 sections
  const handleGeneratePdfReport = async () => {
    if (isGeneratingPdf) return;
    setIsGeneratingPdf(true);
    try {
      const recordsToAnalyze = filteredIncidents.length > 0 ? filteredIncidents : incidents;
      await generateIncidentFullAnalyticsReport(recordsToAnalyze);
    } catch (err) {
      console.error('Failed to generate full analytics PDF report:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Export All Incidents Live Table to Excel
  const exportAllIncidentsToExcel = () => {
    const recordsToExport = filteredIncidents.length > 0 ? filteredIncidents : incidents;
    const ws = XLSX.utils.json_to_sheet(recordsToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Incidents');
    XLSX.writeFile(wb, 'All_Incident_Records.xlsx');
  };

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
    if (loading || incidents.length === 0) return;

    // Register plugin
    try {
      Chart.register(centerDataLabelsPlugin);
    } catch (e) {
      // ignore duplicate registration
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

    // Common interactive movement options for multi-device support (PC, iOS, Android, Smartphones)
    const getMovementOptions = (chartType: 'bar' | 'line' | 'pie' | 'doughnut' | 'polarArea', isHorizontal: boolean = false) => {
      const isCircular = chartType === 'pie' || chartType === 'doughnut' || chartType === 'polarArea';
      return {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 1000,
          easing: 'easeOutQuart' as const,
        },
        transitions: {
          active: {
            animation: {
              duration: 250,
              easing: 'easeOutQuart' as const,
            },
          },
        },
        // Enable full spectrum of mouse and touch gestures across all smartphones, iOS and Android
        events: ['mousemove' as const, 'mouseout' as const, 'click' as const, 'touchstart' as const, 'touchmove' as const],
        interaction: {
          mode: isCircular ? ('nearest' as const) : ('index' as const),
          intersect: false,
          axis: isHorizontal ? ('y' as const) : ('x' as const),
        },
        hover: {
          mode: isCircular ? ('nearest' as const) : ('index' as const),
          intersect: false,
        },
      };
    };

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
        const baseLineOpts = getMovementOptions('line');

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
                pointHoverRadius: 10,
                pointHitRadius: 25,
                pointHoverBorderWidth: 3,
                pointHoverBackgroundColor: '#FBBF24',
                fill: true,
              },
            ],
          },
          options: {
            ...baseLineOpts,
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
              tooltip: {
                enabled: true,
                animation: { duration: 200 },
                padding: 10,
                cornerRadius: 8,
              },
              title: {
                display: true,
                text: 'OCCUPATIONAL INCIDENTS ANNUAL TREND',
                color: textColor,
                font: { size: 12, weight: 'bold' },
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

        const baseBarOpts = getMovementOptions('bar');
        chartInstance1.current = new Chart(ctx1, {
          type: 'bar',
          data: {
            labels: months,
            datasets: [
              {
                label: 'Incidents Count',
                data: months.map((m) => monthCounts[m]),
                backgroundColor: '#10B981',
                hoverBackgroundColor: '#059669',
                hoverBorderColor: textColor,
                hoverBorderWidth: 2,
                borderRadius: 6,
              },
            ],
          },
          options: {
            ...baseBarOpts,
            scales: {
              x: { ticks: { color: textColor }, grid: { color: gridColor } },
              y: { ticks: { color: textColor, precision: 0 }, grid: { color: gridColor } },
            },
            plugins: {
              legend: { display: false },
              tooltip: {
                enabled: true,
                animation: { duration: 200 },
                padding: 10,
                cornerRadius: 8,
              },
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
        const baseBarOpts = getMovementOptions('bar');

        chartInstance1.current = new Chart(ctx1, {
          type: 'bar',
          data: {
            labels,
            datasets: [
              {
                label: 'Total Incidents',
                data,
                backgroundColor: ['#3B82F6', '#8B5CF6', '#EC4899', '#10B981'],
                hoverBorderColor: textColor,
                hoverBorderWidth: 2,
                borderRadius: 8,
              },
            ],
          },
          options: {
            ...baseBarOpts,
            scales: {
              x: { ticks: { color: textColor }, grid: { color: gridColor } },
              y: { ticks: { color: textColor, precision: 0 }, grid: { color: gridColor } },
            },
            plugins: {
              legend: { display: false },
              tooltip: {
                enabled: true,
                animation: { duration: 200 },
                padding: 10,
                cornerRadius: 8,
              },
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
        const baseBarOpts = getMovementOptions('bar', true);

        chartInstance1.current = new Chart(ctx1, {
          type: 'bar',
          data: {
            labels,
            datasets: [
              {
                label: 'Incidents Count',
                data,
                backgroundColor: '#3B82F6',
                hoverBackgroundColor: '#2563EB',
                hoverBorderColor: textColor,
                hoverBorderWidth: 2,
                borderRadius: 6,
              },
            ],
          },
          options: {
            ...baseBarOpts,
            indexAxis: 'y',
            scales: {
              x: { ticks: { color: textColor, precision: 0 }, grid: { color: gridColor } },
              y: { ticks: { color: textColor }, grid: { color: gridColor } },
            },
            plugins: {
              legend: { display: false },
              tooltip: {
                enabled: true,
                animation: { duration: 200 },
                padding: 10,
                cornerRadius: 8,
              },
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
        const baseBarOpts = getMovementOptions('bar');

        chartInstance1.current = new Chart(ctx1, {
          type: 'bar',
          data: {
            labels,
            datasets: [
              {
                label: 'Incidents Count',
                data,
                backgroundColor: PALETTE.slice(0, labels.length),
                hoverBorderColor: textColor,
                hoverBorderWidth: 2,
                borderRadius: 6,
              },
            ],
          },
          options: {
            ...baseBarOpts,
            scales: {
              x: { ticks: { color: textColor, font: { size: 10 } }, grid: { color: gridColor } },
              y: { ticks: { color: textColor, precision: 0 }, grid: { color: gridColor } },
            },
            plugins: {
              legend: { display: false },
              tooltip: {
                enabled: true,
                animation: { duration: 200 },
                padding: 10,
                cornerRadius: 8,
              },
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
        const basePieOpts = getMovementOptions('pie');

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
                hoverOffset: 16,
                hoverBorderWidth: 3,
                hoverBorderColor: textColor,
              },
            ],
          },
          options: {
            ...basePieOpts,
            plugins: {
              legend: { labels: { color: textColor, font: { size: 12, weight: 'bold' } } },
              tooltip: {
                enabled: true,
                animation: { duration: 200 },
                padding: 10,
                cornerRadius: 8,
              },
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
        const baseDoughnutOpts = getMovementOptions('doughnut');

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
                hoverOffset: 16,
                hoverBorderWidth: 3,
                hoverBorderColor: textColor,
              },
            ],
          },
          options: {
            ...baseDoughnutOpts,
            plugins: {
              legend: { labels: { color: textColor, font: { size: 11, weight: 'bold' } } },
              tooltip: {
                enabled: true,
                animation: { duration: 200 },
                padding: 10,
                cornerRadius: 8,
              },
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
        const basePieOpts = getMovementOptions('pie');

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
                hoverOffset: 16,
                hoverBorderWidth: 3,
                hoverBorderColor: textColor,
              },
            ],
          },
          options: {
            ...basePieOpts,
            plugins: {
              legend: { labels: { color: textColor, font: { size: 12, weight: 'bold' } } },
              tooltip: {
                enabled: true,
                animation: { duration: 200 },
                padding: 10,
                cornerRadius: 8,
              },
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
        const baseBarOpts = getMovementOptions('bar');

        chartInstance1.current = new Chart(ctx1, {
          type: 'bar',
          data: {
            labels,
            datasets: [
              {
                label: 'Incidents Count',
                data,
                backgroundColor: ['#F59E0B', '#EF4444', '#64748B', '#3B82F6'],
                hoverBorderColor: textColor,
                hoverBorderWidth: 2,
                borderRadius: 6,
              },
            ],
          },
          options: {
            ...baseBarOpts,
            scales: {
              x: { ticks: { color: textColor }, grid: { color: gridColor } },
              y: { ticks: { color: textColor, precision: 0 }, grid: { color: gridColor } },
            },
            plugins: {
              legend: { display: false },
              tooltip: {
                enabled: true,
                animation: { duration: 200 },
                padding: 10,
                cornerRadius: 8,
              },
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
        const baseBarOpts = getMovementOptions('bar');

        chartInstance1.current = new Chart(ctx1, {
          type: 'bar',
          data: {
            labels,
            datasets: [
              {
                label: 'Incidents Count',
                data,
                backgroundColor: '#8B5CF6',
                hoverBackgroundColor: '#7C3AED',
                hoverBorderColor: textColor,
                hoverBorderWidth: 2,
                borderRadius: 6,
              },
            ],
          },
          options: {
            ...baseBarOpts,
            scales: {
              x: { ticks: { color: textColor, font: { size: 10 } }, grid: { color: gridColor } },
              y: { ticks: { color: textColor, precision: 0 }, grid: { color: gridColor } },
            },
            plugins: {
              legend: { display: false },
              tooltip: {
                enabled: true,
                animation: { duration: 200 },
                padding: 10,
                cornerRadius: 8,
              },
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
        const baseDoughnutOpts = getMovementOptions('doughnut');

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
                hoverOffset: 16,
                hoverBorderWidth: 3,
                hoverBorderColor: textColor,
              },
            ],
          },
          options: {
            ...baseDoughnutOpts,
            plugins: {
              legend: { labels: { color: textColor, font: { size: 11, weight: 'bold' } } },
              tooltip: {
                enabled: true,
                animation: { duration: 200 },
                padding: 10,
                cornerRadius: 8,
              },
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
        const baseBarOpts = getMovementOptions('bar');

        chartInstance1.current = new Chart(ctx1, {
          type: 'bar',
          data: {
            labels,
            datasets: [
              {
                label: 'Incidents Count',
                data,
                backgroundColor: '#EC4899',
                hoverBackgroundColor: '#DB2777',
                hoverBorderColor: textColor,
                hoverBorderWidth: 2,
                borderRadius: 6,
              },
            ],
          },
          options: {
            ...baseBarOpts,
            scales: {
              x: { ticks: { color: textColor, font: { size: 10 } }, grid: { color: gridColor } },
              y: { ticks: { color: textColor, precision: 0 }, grid: { color: gridColor } },
            },
            plugins: {
              legend: { display: false },
              tooltip: {
                enabled: true,
                animation: { duration: 200 },
                padding: 10,
                cornerRadius: 8,
              },
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
        const basePolarOpts = getMovementOptions('polarArea');

        chartInstance1.current = new Chart(ctx1, {
          type: 'polarArea',
          data: {
            labels,
            datasets: [
              {
                data,
                backgroundColor: PALETTE.slice(0, labels.length).map((c) => c + 'B3'),
                hoverBorderColor: textColor,
                hoverBorderWidth: 3,
              },
            ],
          },
          options: {
            ...basePolarOpts,
            plugins: {
              legend: { labels: { color: textColor, font: { size: 11, weight: 'bold' } } },
              tooltip: {
                enabled: true,
                animation: { duration: 200 },
                padding: 10,
                cornerRadius: 8,
              },
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
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
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
    const reporter = inc.reportedBy || (inc as any).investigator || '';

    return (
      id.toLowerCase().includes(q) ||
      date.toLowerCase().includes(q) ||
      year.toLowerCase().includes(q) ||
      location.toLowerCase().includes(q) ||
      desc.toLowerCase().includes(q) ||
      occupationalIncident.toLowerCase().includes(q) ||
      category.toLowerCase().includes(q) ||
      propertyDamage.toLowerCase().includes(q) ||
      damageLevel.toLowerCase().includes(q) ||
      classification.toLowerCase().includes(q) ||
      injuryType.toLowerCase().includes(q) ||
      person.toLowerCase().includes(q) ||
      experienceLevel.toLowerCase().includes(q) ||
      reporter.toLowerCase().includes(q)
    );
  });

  // Display all matched cases if searching, otherwise display 10 latest cases
  const sortedIncidents = [...filteredIncidents].sort((a, b) => {
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
  });

  const displayIncidents = searchQuery.trim() ? sortedIncidents : sortedIncidents.slice(0, 10).reverse();

  const renderSummaryTable = (extraClass = "") => {
    const tableData = getActiveSummaryTable();
    if (!tableData) return null;

    return (
      <div className={`p-4 sm:p-6 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-md ${extraClass}`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 text-2xl">table_chart</span>
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                {tableData.title}
              </h3>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={exportSummaryTableToExcel}
              className="px-3.5 py-1.5 rounded-lg text-white font-bold flex items-center gap-1.5 shadow-sm hover:brightness-110 active:scale-95 transition-all text-xs cursor-pointer"
              style={{ backgroundColor: '#217346' }}
            >
              <span className="material-symbols-outlined text-sm">download</span>
              Download Excel
            </button>
          </div>
        </div>

        {/* Table Container - Fixed formatting with bold header row as requested */}
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-sm">
          <table className="w-full text-left text-xs border-collapse whitespace-nowrap">
            <thead>
              <tr className="h-8 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border-b-2 border-slate-300 dark:border-slate-600">
                {tableData.headers.map((h, i) => (
                  <th
                    key={i}
                    className={`py-1 px-3 font-bold uppercase tracking-wider text-xs ${
                      i === 0
                        ? 'w-12 text-center'
                        : i === 1
                        ? 'text-left min-w-[180px]'
                        : 'text-center min-w-[85px]'
                    }`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-800 dark:text-slate-200 text-xs">
              {tableData.rows.map((row, idx) => {
                const isTotal = row.isTotal || row.label.toUpperCase() === 'TOTAL';
                const isSelected = selectedSummaryRowIdx === idx;
                return (
                  <tr
                    key={idx}
                    onClick={() => {
                      if (!isTotal) {
                        setSelectedSummaryRowIdx(selectedSummaryRowIdx === idx ? null : idx);
                      }
                    }}
                    className={`h-9 transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-slate-200/80 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold'
                        : isTotal
                        ? 'bg-blue-50/90 dark:bg-blue-950/60 font-bold text-slate-900 dark:text-white border-t-2 border-slate-300 dark:border-slate-600'
                        : idx % 2 === 0
                        ? 'bg-white dark:bg-slate-900/60 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                        : 'bg-slate-50/50 dark:bg-slate-800/30 hover:bg-slate-100/60 dark:hover:bg-slate-800/70'
                    }`}
                  >
                    <td className={`py-1 px-3 text-center font-medium leading-none ${isTotal ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-slate-500'}`}>
                      {row.no || (isTotal ? '—' : idx + 1)}
                    </td>
                    <td className={`py-1 px-3 leading-none ${isTotal ? 'font-bold text-blue-700 dark:text-blue-300' : 'font-medium'}`}>
                      {row.label}
                    </td>
                    <td className={`py-1 px-3 text-center leading-none ${isTotal ? 'font-bold text-blue-700 dark:text-blue-300' : 'font-medium'}`}>
                      {row.c2022}
                    </td>
                    <td className={`py-1 px-3 text-center leading-none ${isTotal ? 'font-bold text-blue-700 dark:text-blue-300' : 'font-medium'}`}>
                      {row.c2023}
                    </td>
                    <td className={`py-1 px-3 text-center leading-none ${isTotal ? 'font-bold text-blue-700 dark:text-blue-300' : 'font-medium'}`}>
                      {row.c2024}
                    </td>
                    <td className={`py-1 px-3 text-center leading-none ${isTotal ? 'font-bold text-blue-700 dark:text-blue-300' : 'font-medium'}`}>
                      {row.c2025}
                    </td>
                    <td className={`py-1 px-3 text-center leading-none ${isTotal ? 'font-bold text-blue-700 dark:text-blue-300' : 'font-medium'}`}>
                      {row.c2026}
                    </td>
                    <td className="py-1 px-3 text-center font-bold text-amber-600 dark:text-amber-400 bg-amber-500/5 dark:bg-amber-400/5 leading-none">
                      {row.total}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="glass-card p-4 sm:p-6 mb-8">
      {/* Title & Refresh Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-base sm:text-lg font-bold flex items-center gap-2 text-slate-900 dark:text-white">
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
            <div className="flex flex-col gap-6">
              <div className="relative p-4 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 h-80 shadow-sm w-full">
                <canvas ref={chartRef1} className="w-full h-full cursor-pointer" style={{ touchAction: 'pan-y' }}></canvas>
              </div>

              {/* On smartphone/mobile/tablet, the table goes here right below the first interactive chart */}
              {renderSummaryTable("block lg:hidden")}
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-4">
              {/* Annual Occupational Incidents Sharp Line Chart */}
              <div className="relative p-3 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800/80 rounded-xl shadow-sm h-40 w-full">
                <canvas ref={occupationalChartRef} className="w-full h-full cursor-pointer" style={{ touchAction: 'pan-y' }}></canvas>
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
                    <p className="text-xs sm:text-sm font-bold text-slate-400 uppercase">Total Records</p>
                    <p className="text-base font-extrabold text-blue-600 dark:text-blue-400">{incidents.length}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <p className="text-xs sm:text-sm font-bold text-slate-400 uppercase">Occupational</p>
                    <p className="text-base font-extrabold text-amber-600 dark:text-amber-400">
                      {incidents.filter((i) => i.occupationalIncident?.toUpperCase() === 'YES').length}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* On desktop (large screens), the summary table is displayed full-width below both boxes */}
          {renderSummaryTable("hidden lg:block mb-8")}

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
                className="w-full pl-9 pr-9 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded-full"
                  title="Clear search"
                >
                  <span className="material-symbols-outlined text-base">close</span>
                </button>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {searchQuery.trim() ? (
                  <>Found <strong className="text-blue-600 dark:text-blue-400">{filteredIncidents.length}</strong> matching cases (Total <strong className="text-slate-900 dark:text-white">{incidents.length}</strong> records)</>
                ) : (
                  <>Showing <strong className="text-slate-900 dark:text-white">{displayIncidents.length}</strong> latest cases (Total <strong className="text-slate-900 dark:text-white">{incidents.length}</strong> records)</>
                )}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={exportAllIncidentsToExcel}
                  className="px-3 py-1.5 rounded-lg text-white font-bold flex items-center gap-1.5 shadow-sm hover:brightness-110 active:scale-95 transition-all text-xs cursor-pointer bg-[#217346] hover:bg-[#1b5e39] border border-[#1b5e39]"
                  title="Export all incident records to Excel"
                >
                  <span className="material-symbols-outlined text-sm">download</span>
                  <span>Download Excel</span>
                </button>
              </div>
            </div>
          </div>

          {/* All Incident Records Live Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-300 dark:border-zinc-700 shadow-sm">
            <table className="w-full border-collapse border border-slate-300 dark:border-zinc-700 text-left text-xs sm:text-sm whitespace-nowrap">
              <thead>
                <tr className="h-8 bg-slate-100 dark:bg-zinc-800/80 text-slate-800 dark:text-zinc-100 border-b border-slate-300 dark:border-zinc-700">
                  <th className="w-14 py-1 px-3 border border-slate-300 dark:border-zinc-700 font-bold uppercase text-xs tracking-wider whitespace-nowrap text-center">NO</th>
                  <th className="w-28 py-1 px-3 border border-slate-300 dark:border-zinc-700 font-bold uppercase text-xs tracking-wider whitespace-nowrap text-center">DATE</th>
                  <th className="w-20 py-1 px-3 border border-slate-300 dark:border-zinc-700 font-bold uppercase text-xs tracking-wider whitespace-nowrap text-center">YEAR</th>
                  <th className="min-w-[130px] py-1 px-3 border border-slate-300 dark:border-zinc-700 font-bold uppercase text-xs tracking-wider">LOCATION</th>
                  <th className="min-w-[220px] py-1 px-3 border border-slate-300 dark:border-zinc-700 font-bold uppercase text-xs tracking-wider">DESCRIPTION</th>
                  <th className="w-36 py-1 px-3 border border-slate-300 dark:border-zinc-700 font-bold uppercase text-xs tracking-wider text-center whitespace-nowrap">OCCUPATIONAL INCIDENT?</th>
                  <th className="min-w-[140px] py-1 px-3 border border-slate-300 dark:border-zinc-700 font-bold uppercase text-xs tracking-wider">INCIDENT CATEGORY</th>
                  <th className="w-32 py-1 px-3 border border-slate-300 dark:border-zinc-700 font-bold uppercase text-xs tracking-wider text-center whitespace-nowrap">PROPERTY DAMAGE</th>
                  <th className="w-28 py-1 px-3 border border-slate-300 dark:border-zinc-700 font-bold uppercase text-xs tracking-wider whitespace-nowrap">DAMAGE LEVEL</th>
                  <th className="min-w-[140px] py-1 px-3 border border-slate-300 dark:border-zinc-700 font-bold uppercase text-xs tracking-wider">CLASSIFICATION</th>
                  <th className="min-w-[120px] py-1 px-3 border border-slate-300 dark:border-zinc-700 font-bold uppercase text-xs tracking-wider">INJURY TYPE</th>
                  <th className="min-w-[120px] py-1 px-3 border border-slate-300 dark:border-zinc-700 font-bold uppercase text-xs tracking-wider">PERSON INVOLVE</th>
                  <th className="w-32 py-1 px-3 border border-slate-300 dark:border-zinc-700 font-bold uppercase text-xs tracking-wider whitespace-nowrap">WORK EXPERIENCE</th>
                  <th className="min-w-[110px] py-1 px-3 border border-slate-300 dark:border-zinc-700 font-bold uppercase text-xs tracking-wider">REPORTED BY</th>
                  <th className="w-28 py-1 px-3 border border-slate-300 dark:border-zinc-700 font-bold uppercase text-xs tracking-wider text-center whitespace-nowrap">PDF</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 bg-white dark:bg-slate-900/40 text-slate-700 dark:text-slate-300 text-xs sm:text-sm">
                {displayIncidents.length === 0 ? (
                  <tr className="h-9">
                    <td colSpan={15} className="py-4 text-center text-xs text-slate-400 border border-slate-300 dark:border-zinc-700">
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
                        className={`h-9 transition-colors cursor-pointer ${
                          isSelected 
                            ? 'bg-slate-200/80 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold shadow-inner' 
                            : 'hover:bg-slate-100 dark:hover:bg-slate-800/80 active:bg-slate-200 dark:active:bg-slate-700/60'
                        }`}
                      >
                      {/* 1. NO */}
                      <td className="py-1 px-3 font-mono font-medium text-blue-600 dark:text-blue-400 whitespace-nowrap border border-slate-300 dark:border-zinc-700 text-center leading-none">
                        {inc.id}
                      </td>
                      {/* 2. DATE */}
                      <td className="py-1 px-3 whitespace-nowrap text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-zinc-700 text-center leading-none">
                        {inc.date}
                      </td>
                      {/* 3. YEAR */}
                      <td className="py-1 px-3 whitespace-nowrap text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-zinc-700 text-center leading-none">
                        {inc.year || '-'}
                      </td>
                      {/* 4. LOCATION */}
                      <td className="py-1 px-3 font-medium text-slate-900 dark:text-slate-200 whitespace-nowrap border border-slate-300 dark:border-zinc-700 leading-none">
                        {inc.location}
                      </td>
                      {/* 5. DESCRIPTION */}
                      <td className="py-1 px-3 text-slate-700 dark:text-slate-300 max-w-[240px] truncate border border-slate-300 dark:border-zinc-700 leading-none" title={inc.description}>
                        {inc.description || '-'}
                      </td>
                      {/* 6. OCCUPATIONAL INCIDENT? */}
                      <td className="py-1 px-3 text-center whitespace-nowrap border border-slate-300 dark:border-zinc-700 leading-none">
                        <span
                          className={`inline-flex items-center justify-center px-2 py-0.5 rounded text-[11px] font-semibold uppercase leading-tight ${
                            inc.occupationalIncident?.toUpperCase() === 'YES'
                              ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          {inc.occupationalIncident || '-'}
                        </span>
                      </td>
                      {/* 7. INCIDENT CATEGORY */}
                      <td className="py-1 px-3 whitespace-nowrap border border-slate-300 dark:border-zinc-700 leading-none">
                        <span className="inline-flex items-center justify-center px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-[11px] font-medium leading-tight">
                          {inc.category || '-'}
                        </span>
                      </td>
                      {/* 8. PROPERTY DAMAGE */}
                      <td className="py-1 px-3 text-center whitespace-nowrap font-medium border border-slate-300 dark:border-zinc-700 leading-none">
                        {inc.propertyDamage || '-'}
                      </td>
                      {/* 9. DAMAGE LEVEL */}
                      <td className="py-1 px-3 whitespace-nowrap text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-zinc-700 leading-none">
                        {inc.damageLevel || '-'}
                      </td>
                      {/* 10. CLASSIFICATION */}
                      <td className="py-1 px-3 font-medium text-slate-800 dark:text-slate-200 whitespace-nowrap border border-slate-300 dark:border-zinc-700 leading-none">
                        {inc.classification || '-'}
                      </td>
                      {/* 11. INJURY TYPE */}
                      <td className="py-1 px-3 text-slate-700 dark:text-slate-300 whitespace-nowrap border border-slate-300 dark:border-zinc-700 leading-none">
                        {inc.injuryType || '-'}
                      </td>
                      {/* 12. PERSON INVOLVE */}
                      <td className="py-1 px-3 font-medium text-slate-800 dark:text-slate-200 whitespace-nowrap border border-slate-300 dark:border-zinc-700 leading-none">
                        {inc.personInvolved || (inc as any).person_involved || '-'}
                      </td>
                      {/* 13. WORK EXPERIENCE */}
                      <td className="py-1 px-3 text-slate-700 dark:text-slate-300 whitespace-nowrap border border-slate-300 dark:border-zinc-700 leading-none">
                        {inc.experienceLevel || '-'}
                      </td>
                      {/* 14. REPORTED BY */}
                      <td className="py-1 px-3 text-slate-700 dark:text-slate-300 whitespace-nowrap border border-slate-300 dark:border-zinc-700 leading-none">
                        {inc.reportedBy || (inc as any).investigator || '-'}
                      </td>
                      {/* 15. PDF / DOCUMENT */}
                      <td className="py-1 px-3 text-center whitespace-nowrap border border-slate-300 dark:border-zinc-700 leading-none">
                        {inc.documentUrl && inc.documentUrl !== '-' && inc.documentUrl !== '' ? (
                          <a
                            href={formatToPreviewUrl(inc.documentUrl)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center px-2.5 py-0.5 text-[11px] font-semibold rounded bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors leading-tight"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Open Doc</a>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-600">-</span>
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
