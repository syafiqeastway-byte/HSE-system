import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface IncidentFormData {
  formNo?: string;
  reportMadeBy: string;
  reportMadeByOther: string;
  reportType: string;
  employeeName: string;
  employeeId?: string;
  gender: string;
  age: string;
  department: string;
  jobTitle: string;
  partOfBodyAffected: string[];
  natureOfInjury: string;
  natureOfInjuryOther: string;
  exactLocation: string;
  incidentDate: string;
  exactTime: string;
  witnessNames: string;
  workdayPart: string;
  workdayPartOther: string;
  chronology: string;
  description: string;
  preliminaryCauses: string[];
  preventiveActions: string[];
  pictures: (string | null)[];
}

/**
 * Loads an image URL into a base64 Data URL
 */
const loadImageToDataUrl = async (url: string): Promise<string | null> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width || 200;
        canvas.height = img.height || 100;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/png'));
          return;
        }
      } catch (e) {
        console.warn('Canvas toDataURL failed', e);
      }
      resolve(null);
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
};

export const createIncidentReportPdfBlob = async (data: IncidentFormData): Promise<{ blob: Blob; fileName: string }> => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 10;
  const contentWidth = pageWidth - margin * 2;

  // Attempt to load EE logo
  const logoDataUrl = await loadImageToDataUrl('/EE LOGO.png?v=2');

  // Filter only actual uploaded pictures
  const validPhotos = (data.pictures || []).filter((p): p is string => Boolean(p && typeof p === 'string' && p.startsWith('data:')));

  // Render header & footer for a given page
  const drawHeaderAndFooter = (title: string, pageNum: number, total: number) => {
    // Header Bar
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(margin, 7, contentWidth, 14, 'F');

    if (logoDataUrl) {
      try {
        doc.addImage(logoDataUrl, 'PNG', margin + 2.5, 8.5, 14, 11);
      } catch {
        doc.setTextColor(59, 130, 246);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.text('EASTWAY', margin + 2.5, 16);
      }
    } else {
      doc.setTextColor(59, 130, 246);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('EASTWAY', margin + 2.5, 16);
    }

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(title, margin + 19, 13);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text('EASTWAY ENGINEERING SDN. BHD. - HSE MANAGEMENT SYSTEM', margin + 19, 18);

    // Footer
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, pageHeight - 7, pageWidth - margin, pageHeight - 7);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text('CONFIDENTIAL - FOR INTERNAL SAFETY INVESTIGATION ONLY', margin, pageHeight - 3.8);
    doc.text(`Page ${pageNum} of ${total}`, pageWidth - margin - 18, pageHeight - 3.8);
  };

  // Start content right below the header bar
  let currentY = 23;

  // SECTION 1: Report Classification & Reporter Info
  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin, bottom: 9 },
    head: [[
      { content: 'INCIDENT CLASSIFICATION & REPORTER INFO', colSpan: 3, styles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 } }
    ]],
    body: [
      [
        { content: `FORM NO:\n${data.formNo || 'N/A'}`, styles: { fontStyle: 'bold', textColor: [2, 132, 199] } },
        { content: `REPORT MADE BY:\n${data.reportMadeBy || 'N/A'}${data.reportMadeBy === 'Other' && data.reportMadeByOther ? ` (${data.reportMadeByOther})` : ''}`, styles: { fontStyle: 'bold' } },
        { content: `THIS IS A REPORT OF A:\n${data.reportType || 'N/A'}`, styles: { fontStyle: 'bold', textColor: [220, 38, 38] } }
      ]
    ],
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2, lineColor: [203, 213, 225], lineWidth: 0.15 },
  });

  currentY = (doc as any).lastAutoTable.finalY + 1.8;

  // SECTION 2: Step 1 Injured Employee
  const bodyPartsText = data.partOfBodyAffected.length > 0 ? data.partOfBodyAffected.join(', ') : 'None specified';
  const natureText = data.natureOfInjury === 'Others [lain-lain]' && data.natureOfInjuryOther
    ? `Others (${data.natureOfInjuryOther})`
    : (data.natureOfInjury || 'Not specified');

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin, bottom: 9 },
    head: [[
      { content: 'STEP 1: INJURED EMPLOYEE INFORMATION', colSpan: 4, styles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 } }
    ]],
    body: [
      [
        { content: `Name:\n${data.employeeName || 'N/A'}${data.employeeId ? ` (ID: ${data.employeeId})` : ''}`, styles: { fontStyle: 'bold' } },
        { content: `Gender:\n${data.gender || 'N/A'}` },
        { content: `Age:\n${data.age || 'N/A'}` },
        { content: `Department:\n${data.department || 'N/A'}` },
      ],
      [
        { content: `Job Title:\n${data.jobTitle || 'N/A'}`, colSpan: 2 },
        { content: `Nature of Injury:\n${natureText}`, colSpan: 2, styles: { textColor: [185, 28, 28] } },
      ],
      [
        { content: `Part of Body Affected:\n${bodyPartsText}`, colSpan: 4 },
      ]
    ],
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2, lineColor: [203, 213, 225], lineWidth: 0.15 },
  });

  currentY = (doc as any).lastAutoTable.finalY + 1.8;

  // SECTION 3: Step 2 Incident Location & Workday Details
  const workdayText = data.workdayPart === 'Others' && data.workdayPartOther
    ? `Others (${data.workdayPartOther})`
    : (data.workdayPart || 'N/A');

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin, bottom: 9 },
    head: [[
      { content: 'STEP 2: INCIDENT LOCATION & WORKDAY DETAILS', colSpan: 3, styles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 } }
    ]],
    body: [
      [
        { content: `Exact Location:\n${data.exactLocation || 'N/A'}`, colSpan: 2 },
        { content: `Date & Time:\n${data.incidentDate || 'N/A'} at ${data.exactTime || 'N/A'}` },
      ],
      [
        { content: `Workday Period:\n${workdayText}`, colSpan: 2 },
        { content: `Witnesses:\n${data.witnessNames || 'None'}` },
      ]
    ],
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2, lineColor: [203, 213, 225], lineWidth: 0.15 },
  });

  currentY = (doc as any).lastAutoTable.finalY + 1.8;

  // SECTION 4: Description of the Incident
  const descContent = data.description.trim() || 'No detailed incident description generated yet.';
  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin, bottom: 9 },
    head: [[
      { content: 'DESCRIPTION OF THE INCIDENT (FORMAL NARRATIVE)', styles: { fillColor: [16, 185, 129], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 } }
    ]],
    body: [
      [{ content: descContent, styles: { textColor: [15, 23, 42], fontStyle: 'normal', cellPadding: 2.2 } }]
    ],
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2, lineColor: [203, 213, 225], lineWidth: 0.15 },
  });

  currentY = (doc as any).lastAutoTable.finalY + 1.8;

  // SECTION 5: Preliminary Causes
  const causesBody = data.preliminaryCauses.length > 0
    ? data.preliminaryCauses.map((c, i) => [`${i + 1}.`, c])
    : [['-', 'No preliminary causes specified.']];

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin, bottom: 9 },
    head: [[
      { content: '#', styles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center', cellWidth: 7, fontSize: 8 } },
      { content: 'PRELIMINARY CAUSE(S)', styles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 } }
    ]],
    body: causesBody,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 1.8, lineColor: [203, 213, 225], lineWidth: 0.15 },
  });

  currentY = (doc as any).lastAutoTable.finalY + 1.8;

  // SECTION 6: Preventive Actions
  const actionsBody = data.preventiveActions.length > 0
    ? data.preventiveActions.map((a, i) => [`${i + 1}.`, a])
    : [['-', 'No preventive actions specified.']];

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin, bottom: 9 },
    head: [[
      { content: '#', styles: { fillColor: [14, 116, 144], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center', cellWidth: 7, fontSize: 8 } },
      { content: 'PREVENTIVE ACTION(S) & CORRECTIVE MEASURES', styles: { fillColor: [14, 116, 144], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 } }
    ]],
    body: actionsBody,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 1.8, lineColor: [203, 213, 225], lineWidth: 0.15 },
  });

  // PAGE FOR PICTURES (ONLY IF PICTURES WERE UPLOADED)
  if (validPhotos.length > 0) {
    doc.addPage();
    let picY = 24;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text('INCIDENT PHOTOGRAPHS & SITE DOCUMENTATION', margin, picY);

    picY += 4.5;

    // Render uploaded pictures fitting neatly
    const count = validPhotos.length;
    const isSingle = count === 1;
    const colWidth = isSingle ? contentWidth * 0.75 : (contentWidth - 5) / 2;
    const rowHeight = isSingle ? 120 : (count === 2 ? 100 : 85);
    const startX = isSingle ? margin + (contentWidth - colWidth) / 2 : margin;

    validPhotos.forEach((photoData, index) => {
      const col = isSingle ? 0 : index % 2;
      const row = isSingle ? 0 : Math.floor(index / 2);
      const x = isSingle ? startX : margin + col * (colWidth + 5);
      const y = picY + row * (rowHeight + 5);

      // Card frame
      doc.setDrawColor(203, 213, 225);
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(x, y, colWidth, rowHeight, 1.2, 1.2, 'FD');

      try {
        doc.addImage(photoData, 'JPEG', x + 1.5, y + 1.5, colWidth - 3, rowHeight - 8);
      } catch {
        try {
          doc.addImage(photoData, 'PNG', x + 1.5, y + 1.5, colWidth - 3, rowHeight - 8);
        } catch (e) {
          console.warn('Image embedding failed:', e);
        }
      }

      // Caption
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(51, 65, 85);
      doc.text(`Photo ${index + 1}: Incident Site Record`, x + colWidth / 2, y + rowHeight - 2.2, { align: 'center' });
    });
  }

  // Draw Header & Footer across all pages dynamically
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    const headerTitle = i === 1
      ? (data.formNo ? `INCIDENT INVESTIGATION REPORT (${data.formNo})` : 'INCIDENT INVESTIGATION REPORT')
      : (i === totalPages && validPhotos.length > 0 ? 'INCIDENT PICTURES & EVIDENCE' : 'INCIDENT INVESTIGATION REPORT (CONT.)');
    drawHeaderAndFooter(headerTitle, i, totalPages);
  }

  // File Name: Rename to use FORM NO and NAME
  const cleanFormNo = (data.formNo || '').trim().replace(/[^a-zA-Z0-9_-]/g, '_');
  const cleanName = (data.employeeName || 'INCIDENT_REPORT').trim().replace(/[^a-zA-Z0-9_-]/g, '_');
  const fileName = cleanFormNo
    ? `${cleanFormNo}_${cleanName}.pdf`
    : `${cleanName}.pdf`;

  const blob = doc.output('blob');
  return { blob, fileName };
};

export const downloadIncidentReportPdf = async (data: IncidentFormData) => {
  const { blob, fileName } = await createIncidentReportPdfBlob(data);
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
};
