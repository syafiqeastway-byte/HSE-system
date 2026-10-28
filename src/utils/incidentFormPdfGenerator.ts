import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface IncidentFormData {
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

export const downloadIncidentReportPdf = async (data: IncidentFormData) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 12;
  const contentWidth = pageWidth - margin * 2;

  // Attempt to load EE logo
  const logoDataUrl = await loadImageToDataUrl('/EE LOGO.png?v=2');

  // Filter only actual uploaded pictures
  const validPhotos = (data.pictures || []).filter((p): p is string => Boolean(p && typeof p === 'string' && p.startsWith('data:')));
  const totalPages = validPhotos.length > 0 ? 3 : 2;

  // Helper for Header
  const drawHeader = (title: string, pageNum: number) => {
    // Header Bar
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(margin, 8, contentWidth, 16, 'F');

    if (logoDataUrl) {
      try {
        doc.addImage(logoDataUrl, 'PNG', margin + 3, 10, 15, 12);
      } catch (err) {
        doc.setTextColor(59, 130, 246);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text('EASTWAY', margin + 3, 19);
      }
    } else {
      doc.setTextColor(59, 130, 246);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('EASTWAY', margin + 3, 19);
    }

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11.5);
    doc.text(title, margin + 22, 15);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text('EASTWAY ENGINEERING SDN. BHD. - HSE MANAGEMENT SYSTEM', margin + 22, 20.5);

    // Footer
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, pageHeight - 8, pageWidth - margin, pageHeight - 8);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`CONFIDENTIAL - FOR INTERNAL SAFETY INVESTIGATION ONLY`, margin, pageHeight - 4.5);
    doc.text(`Page ${pageNum} of ${totalPages}`, pageWidth - margin - 18, pageHeight - 4.5);
  };

  // ================= PAGE 1 =================
  drawHeader('INCIDENT INVESTIGATION REPORT', 1);

  let currentY = 27;

  // SECTION 1: Report Classification & Reporter Info
  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    head: [[
      { content: 'INCIDENT CLASSIFICATION & REPORTER INFO', colSpan: 2, styles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8.5 } }
    ]],
    body: [
      [
        { content: `REPORT MADE BY:\n${data.reportMadeBy || 'N/A'}${data.reportMadeBy === 'Other' && data.reportMadeByOther ? ` (${data.reportMadeByOther})` : ''}`, styles: { fontStyle: 'bold' } },
        { content: `THIS IS A REPORT OF A:\n${data.reportType || 'N/A'}`, styles: { fontStyle: 'bold', textColor: [220, 38, 38] } }
      ]
    ],
    theme: 'grid',
    styles: { fontSize: 8.5, cellPadding: 2.5, lineColor: [203, 213, 225], lineWidth: 0.2 },
  });

  currentY = (doc as any).lastAutoTable.finalY + 2.5;

  // SECTION 2: Step 1 Injured Employee
  const bodyPartsText = data.partOfBodyAffected.length > 0 ? data.partOfBodyAffected.join(', ') : 'None specified';
  const natureText = data.natureOfInjury === 'Others [lain-lain]' && data.natureOfInjuryOther
    ? `Others (${data.natureOfInjuryOther})`
    : (data.natureOfInjury || 'Not specified');

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    head: [[
      { content: 'STEP 1: INJURED EMPLOYEE INFORMATION', colSpan: 4, styles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8.5 } }
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
    styles: { fontSize: 8.5, cellPadding: 2.4, lineColor: [203, 213, 225], lineWidth: 0.2 },
  });

  currentY = (doc as any).lastAutoTable.finalY + 2.5;

  // SECTION 3: Step 2 Incident Context
  const workdayText = data.workdayPart === 'Others' && data.workdayPartOther
    ? `Others (${data.workdayPartOther})`
    : (data.workdayPart || 'N/A');

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    head: [[
      { content: 'STEP 2: INCIDENT LOCATION & WORKDAY DETAILS', colSpan: 3, styles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8.5 } }
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
    styles: { fontSize: 8.5, cellPadding: 2.4, lineColor: [203, 213, 225], lineWidth: 0.2 },
  });

  // Note: REPORTED CHRONOLOGY / INITIAL BRIEF section completely removed as requested!

  // ================= PAGE 2 =================
  doc.addPage();
  drawHeader('INCIDENT INVESTIGATION REPORT (CONT.)', 2);

  currentY = 27;

  // SECTION: Description of the Incident
  const descContent = data.description.trim() || 'No detailed incident description generated yet.';
  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    head: [[
      { content: 'DESCRIPTION OF THE INCIDENT (FORMAL NARRATIVE)', styles: { fillColor: [16, 185, 129], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8.5 } }
    ]],
    body: [
      [{ content: descContent, styles: { textColor: [15, 23, 42], fontStyle: 'normal', cellPadding: 3.5 } }]
    ],
    theme: 'grid',
    styles: { fontSize: 8.5, cellPadding: 2.8, lineColor: [203, 213, 225], lineWidth: 0.2 },
  });

  currentY = (doc as any).lastAutoTable.finalY + 3;

  // SECTION: Preliminary Causes
  const causesBody = data.preliminaryCauses.length > 0
    ? data.preliminaryCauses.map((c, i) => [`${i + 1}.`, c])
    : [['-', 'No preliminary causes specified.']];

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    head: [[
      { content: '#', styles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center', cellWidth: 8, fontSize: 8.5 } },
      { content: 'PRELIMINARY CAUSE(S)', styles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8.5 } }
    ]],
    body: causesBody,
    theme: 'grid',
    styles: { fontSize: 8.5, cellPadding: 2.2, lineColor: [203, 213, 225], lineWidth: 0.2 },
  });

  currentY = (doc as any).lastAutoTable.finalY + 3;

  // SECTION: Preventive Actions
  const actionsBody = data.preventiveActions.length > 0
    ? data.preventiveActions.map((a, i) => [`${i + 1}.`, a])
    : [['-', 'No preventive actions specified.']];

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    head: [[
      { content: '#', styles: { fillColor: [14, 116, 144], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center', cellWidth: 8, fontSize: 8.5 } },
      { content: 'PREVENTIVE ACTION(S) & CORRECTIVE MEASURES', styles: { fillColor: [14, 116, 144], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8.5 } }
    ]],
    body: actionsBody,
    theme: 'grid',
    styles: { fontSize: 8.5, cellPadding: 2.2, lineColor: [203, 213, 225], lineWidth: 0.2 },
  });

  // ================= PAGE 3 (ONLY IF PICTURES WERE UPLOADED) =================
  if (validPhotos.length > 0) {
    doc.addPage();
    drawHeader('INCIDENT PICTURES & EVIDENCE', 3);

    let picY = 28;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(15, 23, 42);
    doc.text('INCIDENT PHOTOGRAPHS & SITE DOCUMENTATION', margin, picY);

    picY += 4;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`Photographic documentation gathered during occupational incident investigation (${validPhotos.length} photo${validPhotos.length === 1 ? '' : 's'}).`, margin, picY);

    picY += 5;

    // Render ONLY uploaded pictures
    const count = validPhotos.length;
    const isSingle = count === 1;
    const cols = isSingle ? 1 : 2;
    const colWidth = isSingle ? contentWidth * 0.75 : (contentWidth - 6) / 2;
    const rowHeight = isSingle ? 115 : (count === 2 ? 95 : 82);
    const startX = isSingle ? margin + (contentWidth - colWidth) / 2 : margin;

    validPhotos.forEach((photoData, index) => {
      const col = isSingle ? 0 : index % 2;
      const row = isSingle ? 0 : Math.floor(index / 2);
      const x = isSingle ? startX : margin + col * (colWidth + 6);
      const y = picY + row * (rowHeight + 6);

      // Card frame
      doc.setDrawColor(203, 213, 225);
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(x, y, colWidth, rowHeight, 1.5, 1.5, 'FD');

      try {
        doc.addImage(photoData, 'JPEG', x + 2, y + 2, colWidth - 4, rowHeight - 9);
      } catch (imgErr) {
        try {
          doc.addImage(photoData, 'PNG', x + 2, y + 2, colWidth - 4, rowHeight - 9);
        } catch (e) {
          console.warn('Image embedding failed:', e);
        }
      }

      // Caption
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(51, 65, 85);
      doc.text(`Photo ${index + 1}: Incident Site Record`, x + colWidth / 2, y + rowHeight - 2.5, { align: 'center' });
    });
  }

  // File Name
  const safeName = (data.employeeName || 'Report').replace(/[^a-zA-Z0-9_-]/g, '_');
  const safeDate = (data.incidentDate || new Date().toISOString().split('T')[0]).replace(/[^a-zA-Z0-9_-]/g, '_');
  const fileName = `Incident_Report_${safeName}_${safeDate}.pdf`;

  doc.save(fileName);
};
