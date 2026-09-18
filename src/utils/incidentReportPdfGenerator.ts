import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { IncidentRecord } from '../types';

/**
 * High-DPI Canvas Chart Renderer
 * Generates crisp, publication-grade analytical charts directly to base64 images for jsPDF embedding.
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

  private static roundRectSafe(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number | number[]
  ) {
    if (w <= 0 || h <= 0) return;
    if (typeof ctx.roundRect === 'function') {
      ctx.roundRect(x, y, w, h, r);
    } else {
      ctx.rect(x, y, w, h);
    }
  }

  /**
   * 1. Render Annual Trend Vertical Bar Chart (Clean & Focused on Total Incidents by Year)
   */
  static renderAnnualTrendChart(
    years: string[],
    totals: number[],
    percentages: string[],
    title: string = 'Total Incidents by Year (Annual Incident Frequency Trend)'
  ): string {
    const width = 640;
    const height = 230;
    const { canvas, ctx } = this.createCanvas(width, height);

    // Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Subtle modern outer card border
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.strokeRect(1, 1, width - 2, height - 2);

    // Chart Title
    ctx.font = 'bold 12.5px sans-serif';
    ctx.fillStyle = '#0f172a';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(title, 24, 22);

    const maxVal = Math.max(...totals, 5);
    const chartLeft = 52;
    const chartRight = width - 28;
    const chartTop = 52;
    const chartBottom = height - 44;
    const chartHeight = chartBottom - chartTop;
    const chartWidth = chartRight - chartLeft;

    // Y Axis Grid lines
    const steps = 4;
    ctx.font = '10px sans-serif';
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

    const barCount = years.length;
    if (barCount === 0) return canvas.toDataURL('image/png');

    const totalSlot = chartWidth / barCount;
    const barWidth = Math.min(totalSlot * 0.44, 48);

    // Professional royal blue & indigo palette for annual columns
    const barGradients = ['#2563eb', '#1d4ed8', '#1e40af', '#3b82f6', '#4338ca', '#6366f1'];

    years.forEach((yr, i) => {
      const val = totals[i] || 0;
      const barH = (val / maxVal) * chartHeight;
      const x = chartLeft + i * totalSlot + (totalSlot - barWidth) / 2;
      const y = chartBottom - barH;
      const col = barGradients[i % barGradients.length];

      // Column Bar
      ctx.fillStyle = col;
      ctx.beginPath();
      if (barH > 4) {
        this.roundRectSafe(ctx, x, y, barWidth, barH, [4, 4, 0, 0]);
      } else {
        ctx.rect(x, y, barWidth, Math.max(barH, 2));
      }
      ctx.fill();

      // Top value badge (Pill)
      const labelText = `${val} Cases`;
      ctx.font = 'bold 10px sans-serif';
      ctx.fillStyle = '#0f172a';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(labelText, x + barWidth / 2, y - 4);

      // X Label (Year)
      ctx.font = 'bold 11px sans-serif';
      ctx.fillStyle = '#1e293b';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(yr, x + barWidth / 2, chartBottom + 7);

      // Share Percentage Label
      const pctText = percentages[i] ? `${percentages[i]}%` : '';
      ctx.font = '9px sans-serif';
      ctx.fillStyle = '#64748b';
      ctx.fillText(pctText, x + barWidth / 2, chartBottom + 22);
    });

    return canvas.toDataURL('image/png');
  }

  /**
   * 2. Render Monthly Incident Trend by Year (12 Months Stacked Bar Chart)
   */
  static renderMonthlyYearlyChart(
    monthLabels: string[],
    years: string[],
    matrix: Record<number, Record<string, number>>,
    title: string = 'Total Incidents by Month and Year (Seasonal Multi-Year Trend)',
    yearColors: Record<string, string>
  ): string {
    const width = 640;
    const height = 230;
    const { canvas, ctx } = this.createCanvas(width, height);

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.strokeRect(1, 1, width - 2, height - 2);

    // Title
    ctx.font = 'bold 12.5px sans-serif';
    ctx.fillStyle = '#0f172a';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(title, 24, 22);

    // Render Legend at Top Right
    let legendX = width - 24;
    const legendY = 22;
    ctx.font = 'bold 9.5px sans-serif';
    ctx.textBaseline = 'middle';

    [...years].reverse().forEach((yr) => {
      const col = yearColors[yr] || '#2563eb';
      const textW = ctx.measureText(yr).width;
      legendX -= textW;

      ctx.fillStyle = '#334155';
      ctx.textAlign = 'left';
      ctx.fillText(yr, legendX, legendY + 5);

      legendX -= 13;
      ctx.fillStyle = col;
      ctx.beginPath();
      this.roundRectSafe(ctx, legendX, legendY, 9, 9, 2);
      ctx.fill();

      legendX -= 11;
    });

    // Calculate maximum monthly total
    let maxVal = 1;
    monthLabels.forEach((_, mIdx) => {
      let mSum = 0;
      years.forEach((yr) => {
        mSum += matrix[mIdx]?.[yr] || 0;
      });
      if (mSum > maxVal) maxVal = mSum;
    });
    maxVal = Math.max(maxVal, 4);

    const chartLeft = 45;
    const chartRight = width - 25;
    const chartTop = 50;
    const chartBottom = height - 38;
    const chartHeight = chartBottom - chartTop;
    const chartWidth = chartRight - chartLeft;

    // Y Axis Grid
    const steps = 4;
    ctx.font = '10px sans-serif';
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

      ctx.fillText(String(val), chartLeft - 6, y);
    }

    // Baseline
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(chartLeft, chartBottom);
    ctx.lineTo(chartRight, chartBottom);
    ctx.stroke();

    const barSlot = chartWidth / monthLabels.length;
    const barWidth = Math.min(barSlot * 0.58, 28);

    monthLabels.forEach((mLabel, mIdx) => {
      const x = chartLeft + mIdx * barSlot + (barSlot - barWidth) / 2;
      let currentBottom = chartBottom;
      let monthTotal = 0;

      years.forEach((yr) => {
        const count = matrix[mIdx]?.[yr] || 0;
        monthTotal += count;
        if (count > 0) {
          const segH = (count / maxVal) * chartHeight;
          const segY = currentBottom - segH;

          ctx.fillStyle = yearColors[yr] || '#2563eb';
          ctx.beginPath();
          ctx.rect(x, segY, barWidth, segH);
          ctx.fill();

          currentBottom = segY;
        }
      });

      // Total label on top of bar if monthTotal > 0
      if (monthTotal > 0) {
        ctx.font = 'bold 9.5px sans-serif';
        ctx.fillStyle = '#0f172a';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(String(monthTotal), x + barWidth / 2, currentBottom - 3);
      }

      // X Label (Month)
      ctx.font = '10px sans-serif';
      ctx.fillStyle = '#334155';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(mLabel, x + barWidth / 2, chartBottom + 6);
    });

    return canvas.toDataURL('image/png');
  }

  /**
   * 3. Render Stacked Horizontal Bar Chart
   * Used for: Location by Year, Category by Year, Classification by Year, Injury Type by Year, Work Experience by Year
   */
  static renderStackedHorizontalBarChart(
    items: Array<{ label: string; total: number; byYear: Record<string, number> }>,
    years: string[],
    title: string,
    yearColors: Record<string, string>,
    maxItems: number = 7
  ): string {
    const displayItems = items.slice(0, maxItems);
    const rowHeight = 27;
    const width = 640;
    const height = Math.max(205, displayItems.length * rowHeight + 76);
    const { canvas, ctx } = this.createCanvas(width, height);

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.strokeRect(1, 1, width - 2, height - 2);

    // Title
    ctx.font = 'bold 12.5px sans-serif';
    ctx.fillStyle = '#0f172a';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(title, 24, 22);

    // Legend on Top Right
    let legendX = width - 24;
    const legendY = 22;
    ctx.font = 'bold 9.5px sans-serif';
    ctx.textBaseline = 'middle';

    [...years].reverse().forEach((yr) => {
      const col = yearColors[yr] || '#2563eb';
      const textW = ctx.measureText(yr).width;
      legendX -= textW;

      ctx.fillStyle = '#334155';
      ctx.textAlign = 'left';
      ctx.fillText(yr, legendX, legendY + 5);

      legendX -= 13;
      ctx.fillStyle = col;
      ctx.beginPath();
      this.roundRectSafe(ctx, legendX, legendY, 9, 9, 2);
      ctx.fill();

      legendX -= 11;
    });

    const maxVal = Math.max(...displayItems.map((d) => d.total), 1);
    const labelWidth = 185;
    const chartLeft = labelWidth + 24;
    const chartRight = width - 50;
    const chartWidth = chartRight - chartLeft;
    const startY = 48;

    displayItems.forEach((item, i) => {
      const y = startY + i * rowHeight;
      const barH = 16;

      // Label (truncated cleanly if long)
      ctx.font = '10px sans-serif';
      ctx.fillStyle = '#1e293b';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';

      let displayLabel = item.label;
      if (displayLabel.length > 27) {
        displayLabel = displayLabel.substring(0, 25) + '...';
      }
      ctx.fillText(displayLabel, chartLeft - 10, y + barH / 2);

      // Track background
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      this.roundRectSafe(ctx, chartLeft, y, chartWidth, barH, 3);
      ctx.fill();

      // Stacked Bar segments
      let currentX = chartLeft;
      years.forEach((yr) => {
        const count = item.byYear[yr] || 0;
        if (count > 0) {
          const segW = (count / maxVal) * chartWidth;
          ctx.fillStyle = yearColors[yr] || '#2563eb';
          ctx.beginPath();
          ctx.rect(currentX, y, segW, barH);
          ctx.fill();
          currentX += segW;
        }
      });

      // Total count on right side
      ctx.font = 'bold 10px sans-serif';
      ctx.fillStyle = '#0f172a';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${item.total}`, currentX + 6, y + barH / 2);
    });

    return canvas.toDataURL('image/png');
  }
}

/**
 * Data Aggregation & Cross-Tabulation Engine for Incident Records
 */
function analyzeIncidentFullReport(incidents: IncidentRecord[]) {
  const total = incidents.length;

  // 1. Extract and sort unique years
  const yearsSet = new Set<string>();
  incidents.forEach((inc) => {
    let yr = (inc.year || '').trim();
    if (!yr || yr === '-') {
      if (inc.date) {
        const m = inc.date.match(/\b(20\d\d)\b/);
        if (m) yr = m[1];
      }
    }
    if (yr && yr !== '-') {
      yearsSet.add(yr);
    }
  });

  let sortedYears = Array.from(yearsSet).sort();
  if (sortedYears.length === 0) {
    sortedYears = [new Date().getFullYear().toString()];
  }

  // High-contrast modern color palette for years
  const BASE_PALETTE = ['#475569', '#0d9488', '#2563eb', '#d97706', '#7c3aed', '#ec4899', '#0891b2', '#059669'];
  const yearColors: Record<string, string> = {};
  sortedYears.forEach((yr, idx) => {
    yearColors[yr] = BASE_PALETTE[idx % BASE_PALETTE.length];
  });

  // Helper for incident year normalization
  const getIncidentYear = (inc: IncidentRecord): string => {
    let yr = (inc.year || '').trim();
    if (!yr || yr === '-') {
      if (inc.date) {
        const m = inc.date.match(/\b(20\d\d)\b/);
        if (m) yr = m[1];
      }
    }
    return yr && yr !== '-' ? yr : sortedYears[0];
  };

  // Helper for incident month extraction (0 = Jan, 11 = Dec)
  const getIncidentMonthIndex = (inc: IncidentRecord): number => {
    const d = (inc.date || '').trim();
    if (!d) return -1;
    if (d.includes('/')) {
      const parts = d.split('/');
      if (parts.length >= 2) {
        const m = parseInt(parts[1], 10);
        if (m >= 1 && m <= 12) return m - 1;
      }
    } else if (d.includes('-')) {
      const parts = d.split('-');
      if (parts.length >= 2) {
        if (parts[0].length === 4) {
          const m = parseInt(parts[1], 10);
          if (m >= 1 && m <= 12) return m - 1;
        } else {
          const m = parseInt(parts[1], 10);
          if (m >= 1 && m <= 12) return m - 1;
        }
      }
    }
    return -1;
  };

  // ----------------------------------------------------
  // DIMENSION 1: TOTAL INCIDENTS BY YEAR
  // ----------------------------------------------------
  const yearCounts: Record<string, number> = {};
  sortedYears.forEach((yr) => {
    yearCounts[yr] = 0;
  });

  incidents.forEach((inc) => {
    const yr = getIncidentYear(inc);
    if (yearCounts[yr] === undefined) {
      yearCounts[yr] = 0;
    }
    yearCounts[yr] += 1;
  });

  const yearBreakdown = sortedYears.map((yr, idx) => {
    const count = yearCounts[yr] || 0;
    const prevCount = idx > 0 ? (yearCounts[sortedYears[idx - 1]] || 0) : null;
    let trendLabel = 'Baseline Period';
    if (prevCount !== null) {
      if (count > prevCount) {
        const diff = count - prevCount;
        trendLabel = `+${diff} vs prev year`;
      } else if (count < prevCount) {
        const diff = prevCount - count;
        trendLabel = `-${diff} vs prev year`;
      } else {
        trendLabel = 'Consistent';
      }
    }

    return {
      year: yr,
      total: count,
      pct: total > 0 ? ((count / total) * 100).toFixed(1) : '0',
      trendLabel
    };
  });

  // ----------------------------------------------------
  // DIMENSION 2: TOTAL INCIDENTS BY MONTH AND YEAR
  // ----------------------------------------------------
  const monthNamesShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthNamesFull = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const monthlyMatrix: Record<number, Record<string, number>> = {};
  monthNamesShort.forEach((_, idx) => {
    monthlyMatrix[idx] = {};
    sortedYears.forEach((yr) => {
      monthlyMatrix[idx][yr] = 0;
    });
  });

  incidents.forEach((inc) => {
    const yr = getIncidentYear(inc);
    const mIdx = getIncidentMonthIndex(inc);
    if (mIdx >= 0 && mIdx <= 11) {
      if (monthlyMatrix[mIdx][yr] !== undefined) {
        monthlyMatrix[mIdx][yr] += 1;
      }
    }
  });

  const monthlyBreakdown = monthNamesShort.map((shortName, idx) => {
    let monthTotal = 0;
    const countsByYear: Record<string, number> = {};
    sortedYears.forEach((yr) => {
      const c = monthlyMatrix[idx][yr] || 0;
      countsByYear[yr] = c;
      monthTotal += c;
    });

    return {
      monthIndex: idx,
      shortName,
      fullName: monthNamesFull[idx],
      countsByYear,
      total: monthTotal,
      pct: total > 0 ? ((monthTotal / total) * 100).toFixed(1) : '0'
    };
  });

  // Generic dimension cross-tabulation
  function buildCrossTabulation(
    getValue: (inc: IncidentRecord) => string,
    fallback: string = 'Unspecified'
  ) {
    const dict: Record<string, { label: string; total: number; byYear: Record<string, number> }> = {};

    incidents.forEach((inc) => {
      let val = getValue(inc).trim();
      if (!val || val === '-' || val.toUpperCase() === 'N/A') val = fallback;

      if (!dict[val]) {
        dict[val] = { label: val, total: 0, byYear: {} };
        sortedYears.forEach((y) => (dict[val].byYear[y] = 0));
      }
      dict[val].total += 1;
      const yr = getIncidentYear(inc);
      if (dict[val].byYear[yr] !== undefined) {
        dict[val].byYear[yr] += 1;
      }
    });

    return Object.values(dict)
      .sort((a, b) => b.total - a.total)
      .map((item, index) => ({
        rank: index + 1,
        ...item,
        pct: total > 0 ? ((item.total / total) * 100).toFixed(1) : '0'
      }));
  }

  // ----------------------------------------------------
  // DIMENSION 3: INCIDENT LOCATION BY YEAR
  // ----------------------------------------------------
  const locationBreakdown = buildCrossTabulation((inc) => inc.location, 'Unspecified Location');

  // ----------------------------------------------------
  // DIMENSION 4: INCIDENT CATEGORY BY YEAR
  // ----------------------------------------------------
  const categoryBreakdown = buildCrossTabulation((inc) => inc.category, 'Uncategorized');

  // ----------------------------------------------------
  // DIMENSION 5: CLASSIFICATION BY YEAR
  // ----------------------------------------------------
  const classificationBreakdown = buildCrossTabulation((inc) => inc.classification, 'Unclassified');

  // ----------------------------------------------------
  // DIMENSION 6: INJURY TYPE BY YEAR
  // ----------------------------------------------------
  const injuryBreakdown = buildCrossTabulation(
    (inc) => (inc.injuryType || '').toUpperCase() === 'N/A' ? 'No Injury / Nil' : (inc.injuryType || 'No Injury / Nil'),
    'No Injury / Nil'
  );

  // ----------------------------------------------------
  // DIMENSION 7: WORK EXPERIENCE BY YEAR
  // ----------------------------------------------------
  const experienceBreakdown = buildCrossTabulation((inc) => inc.experienceLevel || '', 'Unspecified Tenure');

  const averagePerYear = sortedYears.length > 0 ? (total / sortedYears.length).toFixed(1) : '0';
  const topLocation = locationBreakdown[0]?.label || 'N/A';
  const topCategory = categoryBreakdown[0]?.label || 'N/A';

  return {
    total,
    sortedYears,
    yearColors,
    averagePerYear,
    topLocation,
    topCategory,
    yearBreakdown,
    monthlyBreakdown,
    monthNamesShort,
    monthlyMatrix,
    locationBreakdown,
    categoryBreakdown,
    classificationBreakdown,
    injuryBreakdown,
    experienceBreakdown
  };
}

/**
 * Main Function: Generate Comprehensive Multi-Year Incident Analytics PDF Report in English
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

  const analysis = analyzeIncidentFullReport(incidents);
  const reportGeneratedDate = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  // Standard Header & Footer (Uniform across all pages)
  const addHeaderAndFooter = (pageNum: number, totalPagesPlaceholder: string) => {
    // Top banner bar
    doc.setFillColor(15, 23, 42); // #0f172a (Slate 900)
    doc.rect(0, 0, pageWidth, 12, 'F');

    // Accent line
    doc.setFillColor(37, 99, 235); // #2563eb (Royal Blue)
    doc.rect(0, 12, pageWidth, 1.5, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(255, 255, 255);
    doc.text('EE SAFETY & HEALTH MANAGEMENT SYSTEM', margin, 7.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(203, 213, 225);
    doc.text(`REPORT GENERATED: ${reportGeneratedDate}`, pageWidth - margin, 7.5, { align: 'right' });

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

  // Modern Section Header Banner
  const drawSectionHeader = (sectionNumber: string, title: string, subtitle: string, yPos: number): number => {
    // Background bar
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(margin, yPos, contentWidth, 10, 1.5, 1.5, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, yPos, contentWidth, 10, 1.5, 1.5, 'S');

    // Accent Tag
    doc.setFillColor(37, 99, 235);
    doc.roundedRect(margin, yPos, 3, 10, 1, 1, 'F');

    // Section Pill
    doc.setFillColor(224, 231, 255);
    doc.roundedRect(margin + 6, yPos + 2, 19, 6, 1.2, 1.2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(30, 64, 175);
    doc.text(sectionNumber, margin + 15.5, yPos + 6, { align: 'center' });

    // Section Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text(title, margin + 28, yPos + 6.2);

    // Subtitle on right
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(subtitle, pageWidth - margin - 4, yPos + 6.2, { align: 'right' });

    return yPos + 13;
  };

  // Modern Executive Insights Box
  const drawInsightBox = (title: string, content: string, yPos: number): number => {
    const boxH = 14;
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(margin, yPos, contentWidth, boxH, 1.5, 1.5, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, yPos, contentWidth, boxH, 1.5, 1.5, 'S');

    // Blue indicator strip
    doc.setFillColor(37, 99, 235);
    doc.roundedRect(margin, yPos, 2.5, boxH, 1, 1, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(30, 41, 59);
    doc.text(`EXECUTIVE INSIGHT: ${title}`, margin + 6, yPos + 4.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(71, 85, 105);
    doc.text(content, margin + 6, yPos + 9.5, { maxWidth: contentWidth - 12 });

    return yPos + boxH + 4;
  };

  // =========================================================================
  // PAGE 1: EXECUTIVE DASHBOARD & 1. TOTAL INCIDENTS BY YEAR
  // =========================================================================
  let currentY = 18;

  // Title Block
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42);
  doc.text('INCIDENT ANALYTICS COMPREHENSIVE REPORT', margin, currentY + 4);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text('Multi-Year Statistical Evaluation, Hotspot Distribution & Safety Risk Profiling', margin, currentY + 9.5);

  currentY += 14;

  // 4 Executive KPI Cards (Professional, clean, no occupational breakdown)
  const kpiBoxWidth = (contentWidth - 9) / 4;
  const kpiBoxHeight = 17;
  const kpis = [
    { label: 'TOTAL INCIDENTS', value: `${analysis.total} Cases`, color: [37, 99, 235], sub: 'Overall recorded events' },
    { label: 'MONITORED PERIOD', value: `${analysis.sortedYears[0]} - ${analysis.sortedYears[analysis.sortedYears.length - 1]}`, color: [99, 102, 241], sub: `${analysis.sortedYears.length} Consecutive years` },
    { label: 'ANNUAL AVERAGE', value: `${analysis.averagePerYear} Cases/Yr`, color: [13, 148, 136], sub: 'Average yearly volume' },
    { label: 'PRIMARY RISK LOCATION', value: analysis.topLocation, color: [217, 119, 6], sub: 'Highest event cluster' }
  ];

  kpis.forEach((kpi, idx) => {
    const x = margin + idx * (kpiBoxWidth + 3);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(x, currentY, kpiBoxWidth, kpiBoxHeight, 1.8, 1.8, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(x, currentY, kpiBoxWidth, kpiBoxHeight, 1.8, 1.8, 'S');

    // Left accent strip
    doc.setFillColor(kpi.color[0], kpi.color[1], kpi.color[2]);
    doc.roundedRect(x, currentY, 2.5, kpiBoxHeight, 1, 1, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(kpi.label, x + 5, currentY + 4.8);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    let valStr = kpi.value;
    if (valStr.length > 18) valStr = valStr.substring(0, 16) + '...';
    doc.text(valStr, x + 5, currentY + 11.2);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(148, 163, 184);
    doc.text(kpi.sub, x + 5, currentY + 14.8);
  });

  currentY += kpiBoxHeight + 8;

  // SECTION 1: TOTAL INCIDENTS BY YEAR
  currentY = drawSectionHeader('PART 01', 'TOTAL INCIDENTS BY YEAR', 'Annual Incident Frequency & Trajectory', currentY);

  // Annual Trend Chart
  const annualChartImg = CanvasChartRenderer.renderAnnualTrendChart(
    analysis.sortedYears,
    analysis.yearBreakdown.map((y) => y.total),
    analysis.yearBreakdown.map((y) => y.pct),
    'Annual Incident Volume by Year'
  );
  doc.addImage(annualChartImg, 'PNG', margin, currentY, contentWidth, 48);
  currentY += 51;

  // Annual Trend Table
  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    head: [['Year', 'Total Recorded Incidents', 'Share of Total (%)', 'Period Trajectory & Status']],
    body: analysis.yearBreakdown.map((r) => [r.year, `${r.total} Cases`, `${r.pct}%`, r.trendLabel]),
    foot: [
      [
        'Total Across All Monitored Years',
        `${analysis.total} Cases`,
        '100.0%',
        'Complete Recorded Portfolio'
      ]
    ],
    theme: 'grid',
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8, halign: 'center' },
    footStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: 'bold', fontSize: 8, halign: 'center' },
    bodyStyles: { fontSize: 8, textColor: [30, 41, 59], halign: 'center' },
    styles: { cellPadding: 2.2 }
  });

  currentY = (doc as any).lastAutoTable.finalY + 6;

  drawInsightBox(
    'Annual Incident Volume Trends',
    'Longitudinal evaluation demonstrates operational growth patterns. Maintaining continuous hazard tracking across all operating entities ensures proactive mitigation.',
    currentY
  );

  // =========================================================================
  // PAGE 2: 2. TOTAL INCIDENTS BY MONTH AND YEAR
  // =========================================================================
  doc.addPage();
  currentY = 18;

  currentY = drawSectionHeader('PART 02', 'TOTAL INCIDENTS BY MONTH AND YEAR', '12-Month Seasonal & Multi-Year Distribution', currentY);

  // Monthly Stacked Chart
  const monthlyChartImg = CanvasChartRenderer.renderMonthlyYearlyChart(
    analysis.monthNamesShort,
    analysis.sortedYears,
    analysis.monthlyMatrix,
    'Monthly Incident Distribution Across All Recorded Years',
    analysis.yearColors
  );
  doc.addImage(monthlyChartImg, 'PNG', margin, currentY, contentWidth, 50);
  currentY += 53;

  // Monthly Cross-Tabulation Table
  const monthTableHead = ['Month', ...analysis.sortedYears, 'Total Cases', '% of Total'];
  const monthTableBody = analysis.monthlyBreakdown.map((m) => {
    const row = [m.fullName];
    analysis.sortedYears.forEach((yr) => {
      row.push(String(m.countsByYear[yr] || 0));
    });
    row.push(`${m.total} Cases`);
    row.push(`${m.pct}%`);
    return row;
  });

  const monthTableFoot = ['Total'];
  analysis.sortedYears.forEach((yr) => {
    const yrSum = analysis.yearBreakdown.find((y) => y.year === yr)?.total || 0;
    monthTableFoot.push(String(yrSum));
  });
  monthTableFoot.push(`${analysis.total} Cases`);
  monthTableFoot.push('100.0%');

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    head: [monthTableHead],
    body: monthTableBody,
    foot: [monthTableFoot],
    theme: 'grid',
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5, halign: 'center' },
    footStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: 'bold', fontSize: 7.5, halign: 'center' },
    bodyStyles: { fontSize: 7.5, textColor: [30, 41, 59], halign: 'center' },
    columnStyles: {
      0: { halign: 'left', fontStyle: 'bold', cellWidth: 32 }
    },
    styles: { cellPadding: 1.8 }
  });

  currentY = (doc as any).lastAutoTable.finalY + 6;

  drawInsightBox(
    'Seasonality & Monthly Concentration',
    'Monthly variance often correlates with project schedules, seasonal turnaround activities, and shifting operating tempos. Targeted pre-shift toolbox briefings during high-incident months reduce frequency.',
    currentY
  );

  // =========================================================================
  // PAGE 3: 3. INCIDENT LOCATION BY YEAR
  // =========================================================================
  doc.addPage();
  currentY = 18;

  currentY = drawSectionHeader('PART 03', 'INCIDENT LOCATION BY YEAR', 'Workplace, Site & Operational Transit Areas', currentY);

  const locChartImg = CanvasChartRenderer.renderStackedHorizontalBarChart(
    analysis.locationBreakdown,
    analysis.sortedYears,
    'Top Incident Locations by Year (Cross-Year Exposure Profile)',
    analysis.yearColors,
    7
  );
  doc.addImage(locChartImg, 'PNG', margin, currentY, contentWidth, 54);
  currentY += 57;

  // Location Cross-Tabulation Table
  const locTableHead = ['Rank', 'Location / Facility Area', ...analysis.sortedYears, 'Total Cases', '% Share'];
  const locTableBody = analysis.locationBreakdown.map((item) => {
    const row = [String(item.rank), item.label];
    analysis.sortedYears.forEach((yr) => {
      row.push(String(item.byYear[yr] || 0));
    });
    row.push(`${item.total} Cases`);
    row.push(`${item.pct}%`);
    return row;
  });

  const locTableFoot = ['-', 'Total Across All Locations'];
  analysis.sortedYears.forEach((yr) => {
    const sumYr = analysis.locationBreakdown.reduce((acc, curr) => acc + (curr.byYear[yr] || 0), 0);
    locTableFoot.push(String(sumYr));
  });
  locTableFoot.push(`${analysis.total} Cases`);
  locTableFoot.push('100.0%');

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    head: [locTableHead],
    body: locTableBody,
    foot: [locTableFoot],
    theme: 'grid',
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5, halign: 'center' },
    footStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: 'bold', fontSize: 7.5, halign: 'center' },
    bodyStyles: { fontSize: 7.5, textColor: [30, 41, 59], halign: 'center' },
    columnStyles: {
      0: { halign: 'center', cellWidth: 12 },
      1: { halign: 'left', fontStyle: 'bold' }
    },
    styles: { cellPadding: 2 }
  });

  currentY = (doc as any).lastAutoTable.finalY + 6;

  drawInsightBox(
    'Location Risk Prioritization',
    'Locations with the highest cumulative incidents require structured area walkthroughs, ergonomic assessments, and physical perimeter safety barriers to prevent recurring occurrences.',
    currentY
  );

  // =========================================================================
  // PAGE 4: 4. INCIDENT CATEGORY BY YEAR
  // =========================================================================
  doc.addPage();
  currentY = 18;

  currentY = drawSectionHeader('PART 04', 'INCIDENT CATEGORY BY YEAR', 'Severity & Impact Classification Spectrum', currentY);

  const catChartImg = CanvasChartRenderer.renderStackedHorizontalBarChart(
    analysis.categoryBreakdown,
    analysis.sortedYears,
    'Incident Categories by Year (Severity Spectrum)',
    analysis.yearColors,
    7
  );
  doc.addImage(catChartImg, 'PNG', margin, currentY, contentWidth, 54);
  currentY += 57;

  // Category Cross-Tabulation Table
  const catTableHead = ['No', 'Incident Category', ...analysis.sortedYears, 'Total Cases', '% Share', 'Severity Rating & Profile'];
  const catTableBody = analysis.categoryBreakdown.map((item) => {
    const row = [String(item.rank), item.label];
    analysis.sortedYears.forEach((yr) => {
      row.push(String(item.byYear[yr] || 0));
    });
    row.push(`${item.total} Cases`);
    row.push(`${item.pct}%`);

    const u = item.label.toUpperCase();
    if (u.includes('LTI') || u.includes('LOST TIME')) {
      row.push('Critical Severity (Lost Workdays)');
    } else if (u.includes('MTC') || u.includes('MEDICAL')) {
      row.push('Moderate Severity (Clinic Medical Care)');
    } else if (u.includes('FAC') || u.includes('FIRST AID')) {
      row.push('Minor Severity (First Aid Dressing)');
    } else if (u.includes('NEAR MISS')) {
      row.push('Proactive Opportunity (Zero Harm Warning)');
    } else if (u.includes('PROPERTY DAMAGE')) {
      row.push('Asset & Equipment Impact (No Bodily Harm)');
    } else {
      row.push('Standard Remedial Monitoring');
    }

    return row;
  });

  const catTableFoot = ['-', 'Total', ...analysis.sortedYears.map((yr) => {
    return String(analysis.categoryBreakdown.reduce((acc, curr) => acc + (curr.byYear[yr] || 0), 0));
  }), `${analysis.total} Cases`, '100.0%', 'Overall Severity Portfolio'];

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    head: [catTableHead],
    body: catTableBody,
    foot: [catTableFoot],
    theme: 'grid',
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5, halign: 'center' },
    footStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: 'bold', fontSize: 7.5, halign: 'center' },
    bodyStyles: { fontSize: 7.5, textColor: [30, 41, 59], halign: 'center' },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { halign: 'left', fontStyle: 'bold', cellWidth: 46 },
      [analysis.sortedYears.length + 4]: { halign: 'left', fontSize: 7 }
    },
    styles: { cellPadding: 2 }
  });

  currentY = (doc as any).lastAutoTable.finalY + 6;

  drawInsightBox(
    'Heinrich Triangle Principles',
    'Analyzing Near Misses and Property Damage events reveals leading warnings before serious Lost Time Injuries occur. Encouraging open hazard reporting creates a resilient safety culture.',
    currentY
  );

  // =========================================================================
  // PAGE 5: 5. CLASSIFICATION BY YEAR (ROOT CAUSE)
  // =========================================================================
  doc.addPage();
  currentY = 18;

  currentY = drawSectionHeader('PART 05', 'CLASSIFICATION BY YEAR', 'Root Causes, Behavioral Patterns & Physical Hazards', currentY);

  const classChartImg = CanvasChartRenderer.renderStackedHorizontalBarChart(
    analysis.classificationBreakdown,
    analysis.sortedYears,
    'Classification & Root Cause Patterns Across Years',
    analysis.yearColors,
    7
  );
  doc.addImage(classChartImg, 'PNG', margin, currentY, contentWidth, 54);
  currentY += 57;

  // Classification Cross-Tabulation Table
  const classTableHead = ['No', 'Classification / Cause', ...analysis.sortedYears, 'Total Cases', '% Share', 'Key Preventative Safeguard'];
  const classTableBody = analysis.classificationBreakdown.map((item) => {
    const row = [String(item.rank), item.label];
    analysis.sortedYears.forEach((yr) => {
      row.push(String(item.byYear[yr] || 0));
    });
    row.push(`${item.total} Cases`);
    row.push(`${item.pct}%`);

    const c = item.label.toLowerCase();
    if (c.includes('act')) {
      row.push('Behavioral safety audits, positive coaching & STOP authority');
    } else if (c.includes('condition')) {
      row.push('Facility maintenance, machine guarding & housekeeping');
    } else if (c.includes('vehicle')) {
      row.push('Defensive driver training, telematics & pre-trip inspections');
    } else if (c.includes('equipment') || c.includes('failure')) {
      row.push('Preventative maintenance checklists & pre-operational checks');
    } else if (c.includes('fire')) {
      row.push('Hot work permits, flammable segregation & extinguisher checks');
    } else {
      row.push('Standard operating procedure (SOP) compliance audits');
    }

    return row;
  });

  const classTableFoot = ['-', 'Total', ...analysis.sortedYears.map((yr) => {
    return String(analysis.classificationBreakdown.reduce((acc, curr) => acc + (curr.byYear[yr] || 0), 0));
  }), `${analysis.total} Cases`, '100.0%', 'Root Cause Portfolio'];

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    head: [classTableHead],
    body: classTableBody,
    foot: [classTableFoot],
    theme: 'grid',
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5, halign: 'center' },
    footStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: 'bold', fontSize: 7.5, halign: 'center' },
    bodyStyles: { fontSize: 7.5, textColor: [30, 41, 59], halign: 'center' },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { halign: 'left', fontStyle: 'bold', cellWidth: 44 },
      [analysis.sortedYears.length + 4]: { halign: 'left', fontSize: 7 }
    },
    styles: { cellPadding: 2 }
  });

  currentY = (doc as any).lastAutoTable.finalY + 6;

  drawInsightBox(
    'Behavioral Safety vs Physical Controls',
    'Unsafe Acts require positive behavioral reinforcement and supervisor presence, whereas Unsafe Conditions necessitate robust engineering controls, housekeeping, and maintenance.',
    currentY
  );

  // =========================================================================
  // PAGE 6: 6. INJURY TYPE BY YEAR
  // =========================================================================
  doc.addPage();
  currentY = 18;

  currentY = drawSectionHeader('PART 06', 'INJURY TYPE BY YEAR', 'Bodily Injury Spectrum & Trauma Nature', currentY);

  const injChartImg = CanvasChartRenderer.renderStackedHorizontalBarChart(
    analysis.injuryBreakdown,
    analysis.sortedYears,
    'Injury Nature & Bodily Trauma Distribution Across Years',
    analysis.yearColors,
    7
  );
  doc.addImage(injChartImg, 'PNG', margin, currentY, contentWidth, 54);
  currentY += 57;

  // Injury Cross-Tabulation Table
  const injTableHead = ['No', 'Injury Nature / Type', ...analysis.sortedYears, 'Total Cases', '% Share', 'Recommended PPE & Protective Controls'];
  const injTableBody = analysis.injuryBreakdown.map((item) => {
    const row = [String(item.rank), item.label];
    analysis.sortedYears.forEach((yr) => {
      row.push(String(item.byYear[yr] || 0));
    });
    row.push(`${item.total} Cases`);
    row.push(`${item.pct}%`);

    const inj = item.label.toLowerCase();
    if (inj.includes('cut') || inj.includes('abrasion')) {
      row.push('Level 5 Cut-resistant Kevlar gloves, deburring & safety blades');
    } else if (inj.includes('pinch') || inj.includes('crush')) {
      row.push('Pinch-point danger tags, impact gloves & safe-distance tooling');
    } else if (inj.includes('bruise') || inj.includes('contusion')) {
      row.push('Bump caps, safety steel-toe footwear & material handling aids');
    } else if (inj.includes('burn')) {
      row.push('Thermal sleeves, welding protection aprons & face shields');
    } else if (inj.includes('nil') || inj.includes('n/a') || inj.includes('no injury')) {
      row.push('Asset/property damage event with zero bodily injury recorded');
    } else {
      row.push('Targeted PPE compliance audits & ergonomic posture training');
    }

    return row;
  });

  const injTableFoot = ['-', 'Total', ...analysis.sortedYears.map((yr) => {
    return String(analysis.injuryBreakdown.reduce((acc, curr) => acc + (curr.byYear[yr] || 0), 0));
  }), `${analysis.total} Cases`, '100.0%', 'Injury Registry Portfolio'];

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    head: [injTableHead],
    body: injTableBody,
    foot: [injTableFoot],
    theme: 'grid',
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5, halign: 'center' },
    footStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: 'bold', fontSize: 7.5, halign: 'center' },
    bodyStyles: { fontSize: 7.5, textColor: [30, 41, 59], halign: 'center' },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { halign: 'left', fontStyle: 'bold', cellWidth: 42 },
      [analysis.sortedYears.length + 4]: { halign: 'left', fontSize: 7 }
    },
    styles: { cellPadding: 2 }
  });

  currentY = (doc as any).lastAutoTable.finalY + 6;

  drawInsightBox(
    'Ergonomic & Extremity Protection',
    'Hands and fingers represent the most frequently exposed extremities in mechanical and workshop operations. Mandatory cut-resistant gloves and pinch-point guards significantly mitigate this hazard.',
    currentY
  );

  // =========================================================================
  // PAGE 7: 7. WORK EXPERIENCE BY YEAR & STRATEGIC RECOMMENDATIONS
  // =========================================================================
  doc.addPage();
  currentY = 18;

  currentY = drawSectionHeader('PART 07', 'WORK EXPERIENCE BY YEAR', 'Tenure, Competency Correlation & Skill Demographics', currentY);

  const expChartImg = CanvasChartRenderer.renderStackedHorizontalBarChart(
    analysis.experienceBreakdown,
    analysis.sortedYears,
    'Incidents by Employee Work Experience Bracket Across Years',
    analysis.yearColors,
    7
  );
  doc.addImage(expChartImg, 'PNG', margin, currentY, contentWidth, 52);
  currentY += 55;

  // Work Experience Cross-Tabulation Table
  const expTableHead = ['No', 'Experience Level / Tenure', ...analysis.sortedYears, 'Total Cases', '% Share', 'Risk Implication & Training Focus'];
  const expTableBody = analysis.experienceBreakdown.map((item) => {
    const row = [String(item.rank), item.label];
    analysis.sortedYears.forEach((yr) => {
      row.push(String(item.byYear[yr] || 0));
    });
    row.push(`${item.total} Cases`);
    row.push(`${item.pct}%`);

    const exp = item.label.toUpperCase();
    if (exp.includes('INTERN') || exp.includes('OJT')) {
      row.push('High Vulnerability: Mandatory mentor supervision & onboarding safety induction');
    } else if (exp.includes('<5') || exp.includes('LESS')) {
      row.push('Developing Skills: Susceptible to familiarity traps; reinforce toolbox briefings');
    } else if (exp.includes('5-10')) {
      row.push('Mid Tenure: Guard against shortcuts, over-confidence & routine complacency');
    } else if (exp.includes('>10') || exp.includes('SENIOR')) {
      row.push('Senior Tenure: Leverage as Safety Champions, peer mentors & safety role models');
    } else {
      row.push('Continuous safety refresher training & SOP competency verification');
    }

    return row;
  });

  const expTableFoot = ['-', 'Total', ...analysis.sortedYears.map((yr) => {
    return String(analysis.experienceBreakdown.reduce((acc, curr) => acc + (curr.byYear[yr] || 0), 0));
  }), `${analysis.total} Cases`, '100.0%', 'Workforce Demographic Portfolio'];

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    head: [expTableHead],
    body: expTableBody,
    foot: [expTableFoot],
    theme: 'grid',
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5, halign: 'center' },
    footStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: 'bold', fontSize: 7.5, halign: 'center' },
    bodyStyles: { fontSize: 7.5, textColor: [30, 41, 59], halign: 'center' },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { halign: 'left', fontStyle: 'bold', cellWidth: 38 },
      [analysis.sortedYears.length + 4]: { halign: 'left', fontSize: 7 }
    },
    styles: { cellPadding: 2 }
  });

  // Apply Headers and Footers with Total Page Count
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addHeaderAndFooter(i, String(totalPages));
  }

  // Download the Generated PDF
  const filename = `EE_Incident_Analytics_Report_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}
