import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { IncidentRecord } from '../types';

/**
 * High-DPI Canvas Chart Renderer
 * Generates beautiful, crisp charts directly to base64 images for embedding in jsPDF.
 */
class CanvasChartRenderer {
  private static createCanvas(width: number, height: number, scale: number = 2): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
    const canvas = document.createElement('canvas');
    canvas.width = width * scale;
    canvas.height = height * scale;
    const ctx = canvas.getContext('2d')!;
    ctx.scale(scale, scale);
    return { canvas, ctx };
  }

  /**
   * Render Vertical Column / Bar Chart
   */
  static renderBarChart(
    labels: string[],
    data: number[],
    title: string,
    colors: string[] = ['#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe']
  ): string {
    const width = 600;
    const height = 280;
    const { canvas, ctx } = this.createCanvas(width, height);

    // Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Border & subtle shadow
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.strokeRect(1, 1, width - 2, height - 2);

    // Title
    ctx.font = 'bold 15px sans-serif';
    ctx.fillStyle = '#0f172a';
    ctx.fillText(title, 24, 30);

    const maxVal = Math.max(...data, 1);
    const chartLeft = 55;
    const chartRight = width - 30;
    const chartTop = 60;
    const chartBottom = height - 50;
    const chartHeight = chartBottom - chartTop;
    const chartWidth = chartRight - chartLeft;

    // Y Axis Grid lines & Labels
    const steps = 4;
    ctx.font = '11px sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';

    for (let i = 0; i <= steps; i++) {
      const val = Math.round((maxVal / steps) * i);
      const y = chartBottom - (i / steps) * chartHeight;

      ctx.strokeStyle = '#f1f5f9';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(chartLeft, y);
      ctx.lineTo(chartRight, y);
      ctx.stroke();

      ctx.fillText(String(val), chartLeft - 8, y);
    }

    // Baseline
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(chartLeft, chartBottom);
    ctx.lineTo(chartRight, chartBottom);
    ctx.stroke();

    // Bars
    const barCount = labels.length;
    if (barCount === 0) return canvas.toDataURL('image/png');

    const totalSlot = chartWidth / barCount;
    const barWidth = Math.min(totalSlot * 0.55, 48);

    labels.forEach((label, i) => {
      const val = data[i] || 0;
      const barH = (val / maxVal) * chartHeight;
      const x = chartLeft + i * totalSlot + (totalSlot - barWidth) / 2;
      const y = chartBottom - barH;
      const color = colors[i % colors.length];

      // Bar gradient / fill
      ctx.fillStyle = color;
      ctx.beginPath();
      const radius = 4;
      if (barH > 4) {
        ctx.roundRect(x, y, barWidth, barH, [radius, radius, 0, 0]);
      } else {
        ctx.rect(x, y, barWidth, Math.max(barH, 2));
      }
      ctx.fill();

      // Bar Value on top
      ctx.font = 'bold 12px sans-serif';
      ctx.fillStyle = '#1e293b';
      ctx.textAlign = 'center';
      ctx.fillText(String(val), x + barWidth / 2, y - 6);

      // X Label
      ctx.font = '11px sans-serif';
      ctx.fillStyle = '#334155';
      ctx.textAlign = 'center';
      ctx.fillText(label, x + barWidth / 2, chartBottom + 18);
    });

    return canvas.toDataURL('image/png');
  }

  /**
   * Render Horizontal Bar Chart (Great for Location, Category, Classification, Injury Type)
   */
  static renderHorizontalBarChart(
    labels: string[],
    data: number[],
    title: string,
    colorScheme: 'blue' | 'red' | 'amber' | 'emerald' | 'purple' = 'blue'
  ): string {
    const width = 600;
    const rowHeight = 32;
    const height = Math.max(220, labels.length * rowHeight + 90);
    const { canvas, ctx } = this.createCanvas(width, height);

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.strokeRect(1, 1, width - 2, height - 2);

    // Title
    ctx.font = 'bold 15px sans-serif';
    ctx.fillStyle = '#0f172a';
    ctx.textAlign = 'left';
    ctx.fillText(title, 24, 30);

    const maxVal = Math.max(...data, 1);
    const labelWidth = 170;
    const chartLeft = labelWidth + 24;
    const chartRight = width - 60;
    const chartWidth = chartRight - chartLeft;
    const startY = 55;

    const baseColorMap = {
      blue: { bar: '#3b82f6', bg: '#eff6ff', top: '#1d4ed8' },
      red: { bar: '#ef4444', bg: '#fef2f2', top: '#b91c1c' },
      amber: { bar: '#f59e0b', bg: '#fffbeb', top: '#d97706' },
      emerald: { bar: '#10b981', bg: '#ecfdf5', top: '#047857' },
      purple: { bar: '#8b5cf6', bg: '#f5f3ff', top: '#6d28d9' }
    };
    const colors = baseColorMap[colorScheme] || baseColorMap.blue;

    labels.forEach((label, i) => {
      const val = data[i] || 0;
      const y = startY + i * rowHeight;
      const barW = Math.max((val / maxVal) * chartWidth, 3);
      const isTop = i === 0 && val > 0;

      // Label (truncated if too long)
      ctx.font = isTop ? 'bold 11px sans-serif' : '11px sans-serif';
      ctx.fillStyle = '#334155';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';

      let displayLabel = label;
      if (displayLabel.length > 24) {
        displayLabel = displayLabel.substring(0, 22) + '...';
      }
      ctx.fillText(displayLabel, chartLeft - 12, y + 10);

      // Track background
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.roundRect(chartLeft, y, chartWidth, 18, 4);
      ctx.fill();

      // Bar
      ctx.fillStyle = isTop ? colors.top : colors.bar;
      ctx.beginPath();
      ctx.roundRect(chartLeft, y, barW, 18, 4);
      ctx.fill();

      // Value text
      ctx.font = 'bold 11px sans-serif';
      ctx.fillStyle = isTop ? colors.top : '#1e293b';
      ctx.textAlign = 'left';
      ctx.fillText(`${val}`, chartLeft + barW + 8, y + 10);
    });

    return canvas.toDataURL('image/png');
  }

  /**
   * Render Donut Chart with Legend
   */
  static renderDonutChart(
    labels: string[],
    data: number[],
    title: string,
    colorPalette: string[] = ['#10b981', '#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6']
  ): string {
    const width = 600;
    const height = 260;
    const { canvas, ctx } = this.createCanvas(width, height);

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.strokeRect(1, 1, width - 2, height - 2);

    // Title
    ctx.font = 'bold 15px sans-serif';
    ctx.fillStyle = '#0f172a';
    ctx.textAlign = 'left';
    ctx.fillText(title, 24, 30);

    const total = data.reduce((a, b) => a + b, 0);
    const centerX = 160;
    const centerY = 145;
    const radius = 75;
    const innerRadius = 45;

    if (total === 0) {
      ctx.font = '13px sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.textAlign = 'center';
      ctx.fillText('No data available', centerX, centerY);
      return canvas.toDataURL('image/png');
    }

    let startAngle = -Math.PI / 2;

    data.forEach((val, i) => {
      const sliceAngle = (val / total) * 2 * Math.PI;
      const endAngle = startAngle + sliceAngle;
      const color = colorPalette[i % colorPalette.length];

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.arc(centerX, centerY, innerRadius, endAngle, startAngle, true);
      ctx.closePath();
      ctx.fill();

      // Divider line
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      startAngle = endAngle;
    });

    // Center total label
    ctx.font = 'bold 18px sans-serif';
    ctx.fillStyle = '#0f172a';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(total), centerX, centerY - 6);

    ctx.font = '10px sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText('TOTAL', centerX, centerY + 12);

    // Legend
    const legendX = 320;
    let legendY = 65;

    labels.forEach((label, i) => {
      const val = data[i] || 0;
      const pct = total > 0 ? ((val / total) * 100).toFixed(1) : '0';
      const color = colorPalette[i % colorPalette.length];

      // Color Box
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.roundRect(legendX, legendY, 14, 14, 3);
      ctx.fill();

      // Label text
      ctx.font = 'bold 12px sans-serif';
      ctx.fillStyle = '#1e293b';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(label, legendX + 22, legendY);

      // Value & percentage
      ctx.font = '11px sans-serif';
      ctx.fillStyle = '#64748b';
      ctx.fillText(`${val} cases (${pct}%)`, legendX + 22, legendY + 16);

      legendY += 38;
    });

    return canvas.toDataURL('image/png');
  }
}

/**
 * Aggregates and analyzes incident data for report generation
 */
function analyzeIncidentData(incidents: IncidentRecord[]) {
  const total = incidents.length;

  // 1. Year Analysis
  const yearMap: Record<string, { total: number; occupational: number; nonOccupational: number }> = {};
  incidents.forEach((inc) => {
    let yr = (inc.year || '').trim();
    if (!yr && inc.date) {
      const match = inc.date.match(/\b(20\d\d)\b/);
      if (match) yr = match[1];
    }
    if (!yr) yr = 'Unknown';

    if (!yearMap[yr]) {
      yearMap[yr] = { total: 0, occupational: 0, nonOccupational: 0 };
    }
    yearMap[yr].total += 1;
    const isOcc = (inc.occupationalIncident || '').toUpperCase() === 'YES';
    if (isOcc) {
      yearMap[yr].occupational += 1;
    } else {
      yearMap[yr].nonOccupational += 1;
    }
  });

  const sortedYears = Object.keys(yearMap).sort((a, b) => {
    if (a === 'Unknown') return 1;
    if (b === 'Unknown') return -1;
    return a.localeCompare(b);
  });

  // 2. Location Analysis
  const locMap: Record<string, { total: number; occupational: number }> = {};
  incidents.forEach((inc) => {
    const loc = (inc.location || 'Unspecified').trim();
    if (!locMap[loc]) locMap[loc] = { total: 0, occupational: 0 };
    locMap[loc].total += 1;
    if ((inc.occupationalIncident || '').toUpperCase() === 'YES') {
      locMap[loc].occupational += 1;
    }
  });
  const sortedLocations = Object.entries(locMap).sort((a, b) => b[1].total - a[1].total);

  // 3. Occupational Incident Analysis
  let occYes = 0;
  let occNo = 0;
  let occOther = 0;
  incidents.forEach((inc) => {
    const val = (inc.occupationalIncident || '').trim().toUpperCase();
    if (val === 'YES') occYes += 1;
    else if (val === 'NO') occNo += 1;
    else occOther += 1;
  });

  // 4. Incident Category Analysis
  const catMap: Record<string, number> = {};
  incidents.forEach((inc) => {
    const cat = (inc.category || 'Uncategorized').trim();
    catMap[cat] = (catMap[cat] || 0) + 1;
  });
  const sortedCategories = Object.entries(catMap).sort((a, b) => b[1] - a[1]);

  // 5. Classification Analysis
  const classMap: Record<string, number> = {};
  incidents.forEach((inc) => {
    const cls = (inc.classification || 'Unclassified').trim();
    classMap[cls] = (classMap[cls] || 0) + 1;
  });
  const sortedClassifications = Object.entries(classMap).sort((a, b) => b[1] - a[1]);

  // 6. Injury Type Analysis
  const injuryMap: Record<string, number> = {};
  incidents.forEach((inc) => {
    const inj = (inc.injuryType || 'No Injury / Nil').trim();
    injuryMap[inj] = (injuryMap[inj] || 0) + 1;
  });
  const sortedInjuries = Object.entries(injuryMap).sort((a, b) => b[1] - a[1]);

  // 7. Work Experience Analysis
  const expMap: Record<string, number> = {};
  incidents.forEach((inc) => {
    let exp = (inc.experienceLevel || '').trim();
    if (!exp || exp === '-' || exp.toUpperCase() === 'N/A') exp = 'Not Specified';
    expMap[exp] = (expMap[exp] || 0) + 1;
  });
  const sortedExperiences = Object.entries(expMap).sort((a, b) => b[1] - a[1]);

  return {
    total,
    yearData: {
      labels: sortedYears,
      totals: sortedYears.map((y) => yearMap[y].total),
      breakdown: sortedYears.map((y) => ({
        year: y,
        total: yearMap[y].total,
        occupational: yearMap[y].occupational,
        nonOccupational: yearMap[y].nonOccupational,
        pct: total > 0 ? ((yearMap[y].total / total) * 100).toFixed(1) : '0'
      }))
    },
    locationData: {
      labels: sortedLocations.slice(0, 8).map(([loc]) => loc),
      values: sortedLocations.slice(0, 8).map(([, d]) => d.total),
      allList: sortedLocations.map(([loc, d], idx) => ({
        rank: idx + 1,
        location: loc,
        total: d.total,
        occupational: d.occupational,
        pct: total > 0 ? ((d.total / total) * 100).toFixed(1) : '0'
      }))
    },
    occupationalData: {
      yes: occYes,
      no: occNo,
      other: occOther,
      rate: total > 0 ? ((occYes / total) * 100).toFixed(1) : '0'
    },
    categoryData: {
      labels: sortedCategories.slice(0, 8).map(([c]) => c),
      values: sortedCategories.slice(0, 8).map(([, v]) => v),
      allList: sortedCategories.map(([cat, count]) => ({
        category: cat,
        count,
        pct: total > 0 ? ((count / total) * 100).toFixed(1) : '0'
      }))
    },
    classificationData: {
      labels: sortedClassifications.slice(0, 8).map(([c]) => c),
      values: sortedClassifications.slice(0, 8).map(([, v]) => v),
      allList: sortedClassifications.map(([cls, count]) => ({
        classification: cls,
        count,
        pct: total > 0 ? ((count / total) * 100).toFixed(1) : '0'
      }))
    },
    injuryData: {
      labels: sortedInjuries.slice(0, 8).map(([i]) => i),
      values: sortedInjuries.slice(0, 8).map(([, v]) => v),
      allList: sortedInjuries.map(([inj, count]) => ({
        injuryType: inj,
        count,
        pct: total > 0 ? ((count / total) * 100).toFixed(1) : '0'
      }))
    },
    experienceData: {
      labels: sortedExperiences.map(([e]) => e),
      values: sortedExperiences.map(([, v]) => v),
      allList: sortedExperiences.map(([exp, count]) => ({
        experience: exp,
        count,
        pct: total > 0 ? ((count / total) * 100).toFixed(1) : '0'
      }))
    }
  };
}

/**
 * Main Function: Generate Comprehensive PDF Analytics Report
 */
export async function generateIncidentFullAnalyticsReport(incidents: IncidentRecord[]): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  const analysis = analyzeIncidentData(incidents);
  const reportGeneratedDate = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  // Helper: Draw Standard Page Header & Footer
  const addHeaderAndFooter = (pageNum: number, totalPagesPlaceholder: string) => {
    // Top banner bar
    doc.setFillColor(15, 23, 42); // #0f172a (Slate 900)
    doc.rect(0, 0, pageWidth, 12, 'F');

    // Accent line
    doc.setFillColor(37, 99, 235); // #2563eb (Blue 600)
    doc.rect(0, 12, pageWidth, 1.5, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(255, 255, 255);
    doc.text('EE INCIDENT ANALYTICS REPORT', margin, 7.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(203, 213, 225);
    doc.text(`DATE: ${reportGeneratedDate}`, pageWidth - margin, 7.5, { align: 'right' });

    // Footer
    doc.setFillColor(248, 250, 252);
    doc.rect(0, pageHeight - 10, pageWidth, 10, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.line(0, pageHeight - 10, pageWidth, pageHeight - 10);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text('CONFIDENTIAL  —  FOR INTERNAL HSE MONITORING & STATUTORY REVIEW ONLY', margin, pageHeight - 4);
    doc.text(`Page ${pageNum} of ${totalPagesPlaceholder}`, pageWidth - margin, pageHeight - 4, { align: 'right' });
  };

  // ==========================================
  // PAGE 1: COVER, EXECUTIVE SUMMARY & 1. YEAR, 2. LOCATION
  // ==========================================
  let currentY = 18;

  // Title Block
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42);
  doc.text('INCIDENT ANALYTICS FULL REPORT', margin, currentY + 6);

  currentY += 12;

  // KPI Quick Highlight Boxes
  const kpiBoxWidth = (contentWidth - 9) / 4;
  const kpiBoxHeight = 16;

  const kpis = [
    { label: 'TOTAL INCIDENTS', value: `${analysis.total}`, color: [37, 99, 235] },
    { label: 'OCCUPATIONAL', value: `${analysis.occupationalData.yes} (${analysis.occupationalData.rate}%)`, color: [220, 38, 38] },
    { label: 'TOP LOCATION', value: analysis.locationData.labels[0] || 'N/A', color: [217, 119, 6] },
    { label: 'RECORD YEARS', value: `${analysis.yearData.labels[0] || '-'} - ${analysis.yearData.labels[analysis.yearData.labels.length - 1] || '-'}`, color: [16, 185, 129] }
  ];

  kpis.forEach((kpi, idx) => {
    const x = margin + idx * (kpiBoxWidth + 3);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(x, currentY, kpiBoxWidth, kpiBoxHeight, 2, 2, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(x, currentY, kpiBoxWidth, kpiBoxHeight, 2, 2, 'S');

    // Left accent strip
    doc.setFillColor(kpi.color[0], kpi.color[1], kpi.color[2]);
    doc.roundedRect(x, currentY, 2.5, kpiBoxHeight, 1, 1, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(kpi.label, x + 5, currentY + 5.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    let valStr = kpi.value;
    if (valStr.length > 18) valStr = valStr.substring(0, 16) + '...';
    doc.text(valStr, x + 5, currentY + 12.5);
  });

  currentY += kpiBoxHeight + 6;

  // ----------------------------------------------------
  // SECTION 1: YEAR ANALYTICS
  // ----------------------------------------------------
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin, currentY, contentWidth, 7, 1.5, 1.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text('1. YEARLY INCIDENT TREND & TEMPORAL DISTRIBUTION', margin + 3, currentY + 5);
  currentY += 9;

  // Render Year Bar Chart
  const yearChartImg = CanvasChartRenderer.renderBarChart(
    analysis.yearData.labels,
    analysis.yearData.totals,
    'Incident Frequency by Year (Temporal Comparison)'
  );
  doc.addImage(yearChartImg, 'PNG', margin, currentY, contentWidth, 42);
  currentY += 44;

  // Year Table
  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    head: [['Year', 'Total Incidents', 'Occupational (Yes)', 'Non-Occupational (No)', '% of Total']],
    body: analysis.yearData.breakdown.map((r) => [r.year, r.total, r.occupational, r.nonOccupational, `${r.pct}%`]),
    foot: [
      [
        'Total',
        analysis.total,
        analysis.occupationalData.yes,
        analysis.occupationalData.no + analysis.occupationalData.other,
        '100.0%'
      ]
    ],
    theme: 'grid',
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5, halign: 'center' },
    footStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: 'bold', fontSize: 7.5, halign: 'center' },
    bodyStyles: { fontSize: 7.5, textColor: [30, 41, 59], halign: 'center' },
    styles: { cellPadding: 1.8 }
  });

  currentY = (doc as any).lastAutoTable.finalY + 7;

  // ----------------------------------------------------
  // SECTION 2: LOCATION ANALYTICS (Start on Page 1 if space, or Page 2)
  // ----------------------------------------------------
  if (currentY + 65 > pageHeight - 15) {
    doc.addPage();
    currentY = 18;
  }

  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin, currentY, contentWidth, 7, 1.5, 1.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text('2. LOCATION & SITE RISK DISTRIBUTION', margin + 3, currentY + 5);
  currentY += 9;

  const locChartImg = CanvasChartRenderer.renderHorizontalBarChart(
    analysis.locationData.labels,
    analysis.locationData.values,
    'Top Incident Risk Hotspots by Work Area / Location',
    'amber'
  );
  doc.addImage(locChartImg, 'PNG', margin, currentY, contentWidth, 48);
  currentY += 50;

  // Location Table
  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    head: [['Rank', 'Location / Area', 'Incident Cases', 'Occupational Cases', '% Share']],
    body: analysis.locationData.allList.slice(0, 7).map((r) => [
      r.rank,
      r.location,
      r.total,
      r.occupational,
      `${r.pct}%`
    ]),
    theme: 'grid',
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5, halign: 'center' },
    bodyStyles: { fontSize: 7.5, textColor: [30, 41, 59] },
    columnStyles: {
      0: { halign: 'center', cellWidth: 15 },
      1: { halign: 'left', fontStyle: 'bold' },
      2: { halign: 'center', cellWidth: 28 },
      3: { halign: 'center', cellWidth: 32 },
      4: { halign: 'center', cellWidth: 25 }
    },
    styles: { cellPadding: 1.8 }
  });

  // ==========================================
  // PAGE 2: 3. OCCUPATIONAL INCIDENT?, 4. INCIDENT CATEGORY, 5. CLASSIFICATION
  // ==========================================
  doc.addPage();
  currentY = 18;

  // ----------------------------------------------------
  // SECTION 3: OCCUPATIONAL INCIDENT? ANALYTICS
  // ----------------------------------------------------
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin, currentY, contentWidth, 7, 1.5, 1.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text('3. OCCUPATIONAL INCIDENT CLASSIFICATION (YES / NO)', margin + 3, currentY + 5);
  currentY += 9;

  const occLabels = ['Occupational (YES)', 'Non-Occupational (NO)'];
  const occValues = [analysis.occupationalData.yes, analysis.occupationalData.no];
  if (analysis.occupationalData.other > 0) {
    occLabels.push('Unspecified / Others');
    occValues.push(analysis.occupationalData.other);
  }

  const occChartImg = CanvasChartRenderer.renderDonutChart(
    occLabels,
    occValues,
    'Occupational Incident Split (DOSH / OSHA Work-Related Criteria)',
    ['#ef4444', '#10b981', '#94a3b8']
  );
  doc.addImage(occChartImg, 'PNG', margin, currentY, contentWidth, 42);
  currentY += 44;

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    head: [['Classification', 'Case Count', 'Proportion Rate (%)', 'Statutory Reporting Note']],
    body: [
      [
        'Occupational Incident (YES)',
        analysis.occupationalData.yes,
        `${analysis.occupationalData.rate}%`,
        'Meets work-related incident criteria; subject to DOSH / JKKP records'
      ],
      [
        'Non-Occupational Incident (NO)',
        analysis.occupationalData.no,
        `${(100 - parseFloat(analysis.occupationalData.rate)).toFixed(1)}%`,
        'Non-work related event, commute, or pre-existing non-occupational factor'
      ]
    ],
    theme: 'grid',
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5, halign: 'center' },
    bodyStyles: { fontSize: 7.5, textColor: [30, 41, 59] },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 48 },
      1: { halign: 'center', cellWidth: 24 },
      2: { halign: 'center', cellWidth: 32 },
      3: { halign: 'left' }
    },
    styles: { cellPadding: 1.8 }
  });

  currentY = (doc as any).lastAutoTable.finalY + 6;

  // ----------------------------------------------------
  // SECTION 4: INCIDENT CATEGORY ANALYTICS
  // ----------------------------------------------------
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin, currentY, contentWidth, 7, 1.5, 1.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text('4. INCIDENT CATEGORY DISTRIBUTION & SEVERITY', margin + 3, currentY + 5);
  currentY += 9;

  const catChartImg = CanvasChartRenderer.renderHorizontalBarChart(
    analysis.categoryData.labels,
    analysis.categoryData.values,
    'Distribution by Incident Category (FAC, LTI, NM, PD, etc.)',
    'purple'
  );
  doc.addImage(catChartImg, 'PNG', margin, currentY, contentWidth, 46);
  currentY += 48;

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    head: [['Category Name', 'Total Cases', '% of Total', 'Severity & Risk Implications']],
    body: analysis.categoryData.allList.slice(0, 6).map((r) => [
      r.category,
      r.count,
      `${r.pct}%`,
      r.category.toUpperCase().includes('LTI')
        ? 'High Severity - Lost time injury investigation'
        : r.category.toUpperCase().includes('FIRST AID')
        ? 'Minor Severity - On-site treatment administered'
        : r.category.toUpperCase().includes('NEAR MISS')
        ? 'Proactive Opportunity - Leading indicator to prevent future harm'
        : 'Standard HSE review and remediation'
    ]),
    theme: 'grid',
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5, halign: 'center' },
    bodyStyles: { fontSize: 7.5, textColor: [30, 41, 59] },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 50 },
      1: { halign: 'center', cellWidth: 24 },
      2: { halign: 'center', cellWidth: 24 },
      3: { halign: 'left' }
    },
    styles: { cellPadding: 1.8 }
  });

  // ==========================================
  // PAGE 3: 5. CLASSIFICATION, 6. INJURY TYPE, 7. WORK EXPERIENCE & SIGN-OFF
  // ==========================================
  doc.addPage();
  currentY = 18;

  // ----------------------------------------------------
  // SECTION 5: CLASSIFICATION ANALYTICS (Unsafe Act / Unsafe Condition)
  // ----------------------------------------------------
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin, currentY, contentWidth, 7, 1.5, 1.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text('5. ROOT CAUSE / CLASSIFICATION ANALYSIS', margin + 3, currentY + 5);
  currentY += 9;

  const classChartImg = CanvasChartRenderer.renderHorizontalBarChart(
    analysis.classificationData.labels,
    analysis.classificationData.values,
    'Incident Classification & Behavioral / Physical Contributing Causes',
    'red'
  );
  doc.addImage(classChartImg, 'PNG', margin, currentY, contentWidth, 42);
  currentY += 44;

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    head: [['Classification', 'Case Frequency', '% Share', 'Recommended Corrective Focus']],
    body: analysis.classificationData.allList.slice(0, 5).map((r) => [
      r.classification,
      r.count,
      `${r.pct}%`,
      r.classification.toLowerCase().includes('act')
        ? 'Behavioral safety training, supervisor toolbox talks & observation audits'
        : r.classification.toLowerCase().includes('condition')
        ? 'Workplace housekeeping, mechanical guarding & environmental maintenance'
        : 'SOP enforcement and preventive safety controls'
    ]),
    theme: 'grid',
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5, halign: 'center' },
    bodyStyles: { fontSize: 7.5, textColor: [30, 41, 59] },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 50 },
      1: { halign: 'center', cellWidth: 26 },
      2: { halign: 'center', cellWidth: 22 },
      3: { halign: 'left' }
    },
    styles: { cellPadding: 1.8 }
  });

  currentY = (doc as any).lastAutoTable.finalY + 6;

  // ----------------------------------------------------
  // SECTION 6: INJURY TYPE ANALYTICS
  // ----------------------------------------------------
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin, currentY, contentWidth, 7, 1.5, 1.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text('6. INJURY TYPE & BODILY TRAUMA PATTERNS', margin + 3, currentY + 5);
  currentY += 9;

  const injChartImg = CanvasChartRenderer.renderHorizontalBarChart(
    analysis.injuryData.labels,
    analysis.injuryData.values,
    'Injuries by Nature and Medical Severity',
    'emerald'
  );
  doc.addImage(injChartImg, 'PNG', margin, currentY, contentWidth, 42);
  currentY += 44;

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    head: [['Injury Nature / Type', 'Recorded Cases', '% Breakdown', 'Preventive PPE & Controls']],
    body: analysis.injuryData.allList.slice(0, 5).map((r) => [
      r.injuryType,
      r.count,
      `${r.pct}%`,
      r.injuryType.toLowerCase().includes('cut')
        ? 'Cut-resistant gloves & safe blade handling SOP'
        : r.injuryType.toLowerCase().includes('burn')
        ? 'Heat-resistant PPE & thermal protection barriers'
        : r.injuryType.toLowerCase().includes('eye')
        ? 'Safety goggles with side-shields requirement'
        : 'General PPE compliance & ergonomic task rotation'
    ]),
    theme: 'grid',
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5, halign: 'center' },
    bodyStyles: { fontSize: 7.5, textColor: [30, 41, 59] },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 50 },
      1: { halign: 'center', cellWidth: 26 },
      2: { halign: 'center', cellWidth: 22 },
      3: { halign: 'left' }
    },
    styles: { cellPadding: 1.8 }
  });

  // ==========================================
  // PAGE 4: 7. WORK EXPERIENCE & HSE STRATEGY SIGN-OFF
  // ==========================================
  doc.addPage();
  currentY = 18;

  // ----------------------------------------------------
  // SECTION 7: WORK EXPERIENCE ANALYTICS
  // ----------------------------------------------------
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin, currentY, contentWidth, 7, 1.5, 1.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text('7. WORK EXPERIENCE', margin + 3, currentY + 5);
  currentY += 9;

  const expChartImg = CanvasChartRenderer.renderBarChart(
    analysis.experienceData.labels,
    analysis.experienceData.values,
    'Incidents by Employee Experience Level (Tenure Risk Profile)',
    ['#3b82f6', '#f59e0b', '#10b981', '#8b5cf6', '#64748b']
  );
  doc.addImage(expChartImg, 'PNG', margin, currentY, contentWidth, 44);
  currentY += 46;

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    head: [['Experience Level / Tenure', 'Incident Count', '% Proportion']],
    body: analysis.experienceData.allList.map((r) => [
      r.experience,
      r.count,
      `${r.pct}%`
    ]),
    theme: 'grid',
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5, halign: 'center' },
    bodyStyles: { fontSize: 7.5, textColor: [30, 41, 59] },
    columnStyles: {
      0: { fontStyle: 'bold', halign: 'left' },
      1: { halign: 'center', cellWidth: 40 },
      2: { halign: 'center', cellWidth: 40 }
    },
    styles: { cellPadding: 1.8 }
  });

  // Apply Headers and Footers with Total Page Count
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addHeaderAndFooter(i, String(totalPages));
  }

  // Save the PDF
  const filename = `Incident_Analytics_Full_Report_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}
