import {
  MOCK_INCIDENT_RECORDS,
  MOCK_DEMERIT_LOGS,
  MOCK_DEMERIT_MATRIX,
  MOCK_INSPECTION_RECORDS,
  MOCK_FIRST_AID_CERTS,
  MOCK_MINUTE_MEETINGS,
  MOCK_HIRARCS,
  MOCK_SOPS,
  INITIAL_DAYS_WITHOUT_INCIDENT
} from '../data/mockData';
import Papa from 'papaparse';
import { FirstAidCert, InspectionRecord, FireExtinguisherRecord, FirstAidKitTableData } from '../types';

declare global {
  interface Window {
    google?: any; // To allow google.accounts.oauth2 and google.script.run
  }
}

/**
 * Generic helper to invoke a Google Apps Script server function with fallback
 */
export function callGasFunction<T>(functionName: string, mockFallbackData: T, delayMs: number = 250): Promise<T> {
  return new Promise((resolve) => {
    if (window.google && window.google.script && window.google.script.run) {
      try {
        const runner = window.google.script.run;
        if (typeof (runner as any)[functionName] === 'function') {
          runner
            .withSuccessHandler((res: any) => resolve(res as T))
            .withFailureHandler((err: any) => {
              console.warn(`[GAS Bridge] Function ${functionName} failed:`, err);
              resolve(mockFallbackData);
            })
            [functionName]();
          return;
        }
      } catch (e) {
        console.warn(`[GAS Bridge] Exception calling ${functionName}:`, e);
      }
    }
    
    // Standalone / Preview Fallback with realistic delay
    setTimeout(() => {
      resolve(mockFallbackData);
    }, delayMs);
  });
}

/**
 * Fetch helper with timeout to prevent hanging UI requests
 */
async function fetchWithTimeout(url: string, timeoutMs: number = 6000): Promise<Response> {
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timeoutId = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;
  try {
    return await fetch(url, { signal: controller ? controller.signal : undefined });
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

// 1. Days Without Incident
export async function fetchDaysWithoutIncident(): Promise<number> {
  const SPREADSHEET_ID = '1o9P6GnlsAwSJEUYHxITt1Opz973uX37MLBiv0LdFdIs';
  const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=HSE+FILE&range=I2:I2`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch from sheets');
    const csvText = await res.text();
    
    // csvText is usually '"18"' or '18'
    const value = parseInt(csvText.replace(/"/g, '').trim(), 10);
    if (!isNaN(value)) {
      return value;
    }
  } catch (err) {
    console.warn('Error fetching days without incident:', err);
  }
  return callGasFunction<number>('getDaysWithoutIncident', INITIAL_DAYS_WITHOUT_INCIDENT);
}

// 2. All Incidents
export async function fetchAllIncidents(): Promise<any[]> {
  return fetchLiveIncidentRecords();
}

// 3. Location breakdown
export function fetchIncidentLocations(): Promise<any[]> {
  const locationCounts: Record<string, number> = {};
  MOCK_INCIDENT_RECORDS.forEach(rec => {
    locationCounts[rec.location] = (locationCounts[rec.location] || 0) + 1;
  });
  const mockResult = Object.entries(locationCounts).map(([location, count]) => ({
    location,
    count,
    percentage: ((count / MOCK_INCIDENT_RECORDS.length) * 100).toFixed(1) + '%'
  }));
  return callGasFunction<any[]>('getNewIncidentLocation', mockResult);
}

// 4. Category breakdown
export function fetchIncidentCategories(): Promise<any[]> {
  const categoryCounts: Record<string, number> = {};
  MOCK_INCIDENT_RECORDS.forEach(rec => {
    categoryCounts[rec.category] = (categoryCounts[rec.category] || 0) + 1;
  });
  const mockResult = Object.entries(categoryCounts).map(([category, count]) => ({
    category,
    count,
    percentage: ((count / MOCK_INCIDENT_RECORDS.length) * 100).toFixed(1) + '%'
  }));
  return callGasFunction<any[]>('getNewIncidentCategory', mockResult);
}

// 5. Classification breakdown
export function fetchClassificationData(): Promise<any[]> {
  const classCounts: Record<string, number> = {};
  MOCK_INCIDENT_RECORDS.forEach(rec => {
    classCounts[rec.classification] = (classCounts[rec.classification] || 0) + 1;
  });
  const mockResult = Object.entries(classCounts).map(([classification, count]) => ({
    classification,
    count
  }));
  return callGasFunction<any[]>('getClassification', mockResult);
}

// 6. Injury Type breakdown
export function fetchInjuryTypeData(): Promise<any[]> {
  const injuryCounts: Record<string, number> = {};
  MOCK_INCIDENT_RECORDS.forEach(rec => {
    injuryCounts[rec.injuryType] = (injuryCounts[rec.injuryType] || 0) + 1;
  });
  const mockResult = Object.entries(injuryCounts).map(([injuryType, count]) => ({
    injuryType,
    count
  }));
  return callGasFunction<any[]>('getInjuryType', mockResult);
}

// 7. Experience Level breakdown
export function fetchExperienceLevelData(): Promise<any[]> {
  const expCounts: Record<string, number> = {};
  MOCK_INCIDENT_RECORDS.forEach(rec => {
    expCounts[rec.experienceLevel] = (expCounts[rec.experienceLevel] || 0) + 1;
  });
  const mockResult = Object.entries(expCounts).map(([experienceLevel, count]) => ({
    experienceLevel,
    count
  }));
  return callGasFunction<any[]>('getExperienceLevel', mockResult);
}

// 8. Demerit System
export function fetchDemeritData(): Promise<{ logs: typeof MOCK_DEMERIT_LOGS; matrix: typeof MOCK_DEMERIT_MATRIX }> {
  return callGasFunction<{ logs: typeof MOCK_DEMERIT_LOGS; matrix: typeof MOCK_DEMERIT_MATRIX }>(
    'getDemerit',
    { logs: MOCK_DEMERIT_LOGS, matrix: MOCK_DEMERIT_MATRIX }
  );
}

// 9. Inspection Data
export async function fetchInspectionData(): Promise<InspectionRecord[]> {
  const SPREADSHEET_ID_ORIGINAL = '1o9P6GnlsAwSJEUYHxITt1Opz973uX37MLBiv0LdFdIs';
  const GID_ORIGINAL = '582761149';
  const urlOriginal = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID_ORIGINAL}/gviz/tq?tqx=out:csv&gid=${GID_ORIGINAL}&range=B3:I`;

  // New Google Sheet requested:
  // spreadsheet_id: 1HLebePp1L31C-nZk6HgTxDwy6kXktNHDdbEdGcMvbbA
  // sheet_name: Records
  // Range / Columns:
  // NO: A5
  // DATE: E5
  // LOCATION: D5
  // TYPE OF INSPECTION: tulis "Workplace"
  // INSPECTOR: C5
  // REMARK: G5
  // PDF: BF
  const SPREADSHEET_ID_NEW = '1HLebePp1L31C-nZk6HgTxDwy6kXktNHDdbEdGcMvbbA';
  const SHEET_NAME_NEW = 'Records';
  const urlNew = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID_NEW}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(SHEET_NAME_NEW)}`;

  let originalRecords: InspectionRecord[] = [];
  let newRecords: InspectionRecord[] = [];

  // 1. Fetch original table records
  try {
    const resOrig = await fetchWithTimeout(urlOriginal, 8000);
    if (resOrig.ok) {
      const csvText = await resOrig.text();
      if (!csvText.includes('<!DOCTYPE html>') && !csvText.includes('google-signin-button')) {
        originalRecords = await new Promise((resolve) => {
          Papa.parse(csvText, {
            header: false,
            skipEmptyLines: true,
            complete: (results) => {
              const parsed: InspectionRecord[] = [];
              if (results.data && results.data.length > 1) {
                // Row 3 is the header row, so we slice it out to only parse real records
                const dataRows = results.data.slice(1);
                dataRows.forEach((row: any, index: number) => {
                  if (row.length > 0 && (row[1]?.trim() !== '' || row[0]?.trim() !== '')) {
                    const sheetNo = (row[0] || '').trim();
                    const date = (row[1] || '').trim();
                    const day = (row[2] || '').trim();
                    const location = (row[3] || '').trim();
                    const typeOfInspection = (row[4] || '').trim();
                    const inspector = (row[5] || '').trim();
                    const remark = (row[6] || '').trim();
                    const documentUrl = (row[7] || '').trim();

                    parsed.push({
                      id: `INSP-ORIG-${index}-${sheetNo || index}`,
                      date,
                      day,
                      location,
                      typeOfInspection,
                      inspector,
                      remark,
                      documentUrl,

                      // Compatibility fallbacks
                      locationFacility: location,
                      inspectorName: inspector,
                      type: typeOfInspection,
                      totalChecked: 0,
                      compliantCount: 0,
                      complianceRate: '-',
                      status: 'Passed'
                    });
                  }
                });
              }
              resolve(parsed);
            },
            error: () => resolve([])
          });
        });
      }
    }
  } catch (err) {
    console.warn(`Error fetching original inspection data with GID: ${GID_ORIGINAL}`, err);
  }

  if (originalRecords.length === 0) {
    originalRecords = await callGasFunction<InspectionRecord[]>('getInspectionData', MOCK_INSPECTION_RECORDS);
  }

  // 2. Fetch new records from Records sheet (Row 5 onwards: A5, E5, D5, C5, G5, BF5...)
  try {
    const resNew = await fetchWithTimeout(urlNew, 8000);
    if (resNew.ok) {
      const csvNewText = await resNew.text();
      if (!csvNewText.includes('<!DOCTYPE html>') && !csvNewText.includes('google-signin-button')) {
        newRecords = await new Promise((resolve) => {
          Papa.parse(csvNewText, {
            header: false,
            skipEmptyLines: true,
            complete: (results) => {
              const parsed: InspectionRecord[] = [];
              if (results.data && results.data.length > 0) {
                const headerRow = results.data[0] as string[];

                // Column indices:
                // NO: A (index 0)
                let noIdx = 0;
                // INSPECTOR: C (index 2)
                let inspectorIdx = 2;
                // LOCATION: D (index 3)
                let locationIdx = 3;
                // DATE: E (index 4)
                let dateIdx = 4;
                // REMARK: G (index 6)
                let remarkIdx = 6;
                // PDF: BF (index 57)
                let pdfIdx = 57;

                // Match dynamically if header columns present
                if (headerRow && headerRow.length > 0) {
                  headerRow.forEach((h, idx) => {
                    const cleanH = (h || '').trim().toLowerCase();
                    if (cleanH === 'nama') inspectorIdx = idx;
                    else if (cleanH === 'kawasan') locationIdx = idx;
                    else if (cleanH === 'tarikh') dateIdx = idx;
                    else if (cleanH.includes('catitan keseluruhan')) remarkIdx = idx;
                    else if (cleanH === 'pdf') pdfIdx = idx;
                  });
                }

                // Range starts from row 5 onwards (slice 4 because index 0 is Row 1, index 1 is Row 2, index 2 is Row 3, index 3 is Row 4, index 4 is Row 5)
                const dataRows = results.data.slice(4);

                dataRows.forEach((row: any, index: number) => {
                  if (row && row.length > 0) {
                    const sheetNo = (row[noIdx] || '').trim();
                    const rawDate = (row[dateIdx] || '').trim();
                    const location = (row[locationIdx] || '').trim();
                    const inspector = (row[inspectorIdx] || '').trim();
                    const remark = (row[remarkIdx] || '').trim();
                    const documentUrl = (row[pdfIdx] || '').trim();

                    // Skip empty rows
                    if (!rawDate && !location && !inspector && !remark && !documentUrl) {
                      return;
                    }

                    // Format date: format YYYY-MM-DD or DD/MM/YYYY to DD-MM-YY to match existing rows
                    let date = rawDate;
                    let day = '';
                    if (/^\d{4}-\d{2}-\d{2}$/.test(rawDate)) {
                      const [yyyy, mm, dd] = rawDate.split('-');
                      date = `${dd}-${mm}-${yyyy.slice(2)}`;
                      try {
                        const d = new Date(rawDate);
                        if (!isNaN(d.getTime())) {
                          const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                          day = daysOfWeek[d.getDay()];
                        }
                      } catch {
                        // ignore
                      }
                    } else if (/^\d{2}\/\d{2}\/\d{4}$/.test(rawDate)) {
                      const [dd, mm, yyyy] = rawDate.split('/');
                      date = `${dd}-${mm}-${yyyy.slice(2)}`;
                    }

                    const rowNum = originalRecords.length + index + 1;

                    parsed.push({
                      id: `INSP-RECORDS-${index + 5}-${sheetNo || rowNum}`,
                      date,
                      day,
                      location,
                      typeOfInspection: 'Workplace', // User requirement: TYPE OF INSPECTION: tulis "Workplace"
                      inspector,
                      remark,
                      documentUrl,

                      // Compatibility fallbacks
                      locationFacility: location,
                      inspectorName: inspector,
                      type: 'Workplace',
                      totalChecked: 0,
                      compliantCount: 0,
                      complianceRate: '-',
                      status: 'Passed'
                    });
                  }
                });
              }
              resolve(parsed);
            },
            error: () => resolve([])
          });
        });
      }
    }
  } catch (err) {
    console.warn(`Error fetching new inspection records from sheet ${SHEET_NAME_NEW}:`, err);
  }

  // If new records fetch returned empty (e.g. offline preview), provide fallback for Row 5
  if (newRecords.length === 0) {
    newRecords = [
      {
        id: 'INSP-RECORDS-5-fallback',
        date: '07-09-26',
        day: 'Mon',
        location: 'Utara stor',
        typeOfInspection: 'Workplace',
        inspector: 'Yeoh Kuan Lai',
        remark: 'Kakitangan diberikan tempoh satu bulan untuk melakukan penambahbaikan 5S demi mewujudkan persekitaran kerja yang lebih selamat. (Dateline: 6/Oktober 2026)',
        documentUrl: 'https://drive.google.com/file/d/1XbWNLfhM03mc5EtrOBY2sRM6cc1P9Mv0/view?usp=drivesdk',
        locationFacility: 'Utara stor',
        inspectorName: 'Yeoh Kuan Lai',
        type: 'Workplace',
        totalChecked: 0,
        compliantCount: 0,
        complianceRate: '-',
        status: 'Passed'
      }
    ];
  }

  // Combine: original table is preserved, new records are appended to the next rows
  return [...originalRecords, ...newRecords];
}

// 9b. Fire Extinguisher Inspection Data
export async function fetchFireExtinguisherData(): Promise<FireExtinguisherRecord[]> {
  const SPREADSHEET_ID = '1o9P6GnlsAwSJEUYHxITt1Opz973uX37MLBiv0LdFdIs';
  const GID = '1996690139';
  const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&gid=${GID}&range=B2:K`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Network response was not ok');
    const csvText = await res.text();
    
    if (csvText.includes('<!DOCTYPE html>') || csvText.includes('google-signin-button')) {
      throw new Error('Returned HTML instead of CSV data');
    }

    return new Promise((resolve) => {
      Papa.parse(csvText, {
        header: false,
        skipEmptyLines: false,
        complete: (results) => {
          const records: FireExtinguisherRecord[] = [];
          if (results.data && results.data.length > 0) {
            results.data.forEach((row: any, index: number) => {
              const sheetRowNumber = index + 2; // Range B2:K begins at row 2
              
              // Skip completely blank rows
              if (!row || row.every((c: any) => !c || String(c).trim() === '')) {
                return;
              }

              // Row 2 and Row 19 are headers and bold
              const isHeader = sheetRowNumber === 2 || sheetRowNumber === 19;

              records.push({
                id: `FE-ROW-${sheetRowNumber}-${index}`,
                rowNumber: sheetRowNumber,
                isHeader,
                no: (row[0] || '').trim(),
                location: (row[1] || '').trim(),
                typeABC: (row[2] || '').trim(),
                typeCO2: (row[3] || '').trim(),
                brand: (row[4] || '').trim(),
                serialNumber: (row[5] || '').trim(),
                month: (row[6] || '').trim(),
                year: (row[7] || '').trim(),
                certExpiryDate: (row[8] || '').trim(),
                remarks: (row[9] || '').trim(),
              });
            });
          }
          resolve(records);
        },
        error: () => resolve([])
      });
    });
  } catch (err) {
    console.warn(`Error fetching Fire Extinguisher data with GID: ${GID}`, err);
    return [];
  }
}


// 10. First Aid Certifications
export async function fetchFirstAidCertData(requireAuth: boolean = false): Promise<FirstAidCert[]> {
  const SPREADSHEET_ID = '1o9P6GnlsAwSJEUYHxITt1Opz973uX37MLBiv0LdFdIs';
  const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=FIRST%20AID%20KIT%20INSPECTION&range=AA5:AE12`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch from sheets');
    const csvText = await res.text();

    if (csvText.includes('<!DOCTYPE html>') || csvText.includes('google-signin-button')) {
      throw new Error('Returned HTML instead of CSV data');
    }
    
    return new Promise((resolve) => {
      Papa.parse(csvText, {
        header: false,
        skipEmptyLines: true,
        complete: (results) => {
          const certs: FirstAidCert[] = [];
          if (results.data && results.data.length > 0) {
            // Row 5 in sheet is index 0 in CSV (header row: EMPLOYEE ID, NAME, DEPARTMENT, CERT EXPIRED, CERT PDF)
            const firstRow = results.data[0] as any;
            const isFirstRowHeader = Array.isArray(firstRow) && firstRow.some((c: any) => 
              String(c || '').toUpperCase().includes('EMPLOYEE') || 
              String(c || '').toUpperCase().includes('NAME') ||
              String(c || '').toUpperCase().includes('CERT')
            );
            const dataRows = isFirstRowHeader ? results.data.slice(1) : results.data;

            dataRows.forEach((row: any, index: number) => {
              if (Array.isArray(row) && row.length >= 2 && row.some((c: any) => c && String(c).trim() !== '')) {
                const rawEmpId = (row[0] || '').trim();
                let maskedEmpId = '-';
                if (rawEmpId) {
                  maskedEmpId = rawEmpId.length >= 3 ? '***' + rawEmpId.slice(3) : '***';
                }

                certs.push({
                  id: `FA-${index + 1}`,
                  employeeId: maskedEmpId,
                  name: (row[1] || '').trim(),
                  department: (row[2] || '-').trim(),
                  expiryDate: (row[3] || '-').trim(),
                  certLink: (row[4] || '').trim()
                });
              }
            });
          }
          resolve(certs.length > 0 ? certs : callGasFunction<FirstAidCert[]>('getFirstAidCertData', MOCK_FIRST_AID_CERTS));
        },
        error: () => {
          resolve(callGasFunction<FirstAidCert[]>('getFirstAidCertData', MOCK_FIRST_AID_CERTS));
        }
      });
    });
  } catch (err) {
    console.warn('Error fetching First Aid Certs:', err);
    return callGasFunction<FirstAidCert[]>('getFirstAidCertData', MOCK_FIRST_AID_CERTS);
  }
}

// 10b. First Aid Kit Table Data (Spreadsheet ID: 17RUlbsvnS8c2keut4n1ZqW5LZJIFGTfZBFuVV_sjnDA, Sheet: FIRST AID KIT, Range: A1:Y20)
export function getMockFirstAidKitData(): FirstAidKitTableData {
  const headers = [
    'NO', 'ITEM / CONTENT', 'SPECIFICATION / SIZE', 'MIN QTY', 'LOCATION',
    'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
    'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC',
    'EXPIRY DATE', 'CONDITION', 'REMARK', 'INSPECTED BY', 'VERIFIED BY', 'STATUS', 'REPLENISHMENT REQUIRED', 'ACTION PLAN'
  ];
  
  const sampleItems = [
    ['1', 'Triangular Bandage', '90cm x 90cm x 130cm', '4 pcs', 'Main First Aid Box A', 'OK', 'OK', 'OK', 'OK', 'OK', 'OK', 'OK', 'OK', 'OK', 'OK', 'OK', 'OK', '2028-12-31', 'Good', 'Adequate Stock', 'Safety Officer', 'HSE Committee', 'COMPLIANT', 'NO', 'Routine monitoring'],
    ['2', 'Roller Bandage 5cm', '5cm x 5m', '6 rolls', 'Main First Aid Box A', 'OK', 'OK', 'OK', 'OK', 'OK', 'OK', 'OK', 'OK', 'OK', 'OK', 'OK', 'OK', '2028-06-30', 'Good', 'Stock Verified', 'Safety Officer', 'HSE Committee', 'COMPLIANT', 'NO', 'Routine monitoring'],
    ['3', 'Roller Bandage 7.5cm', '7.5cm x 5m', '6 rolls', 'Main First Aid Box A', 'OK', 'OK', 'OK', 'OK', 'OK', 'OK', 'OK', 'OK', 'OK', 'OK', 'OK', 'OK', '2028-06-30', 'Good', 'Stock Verified', 'Safety Officer', 'HSE Committee', 'COMPLIANT', 'NO', 'Routine monitoring'],
    ['4', 'Sterile Gauze Pad', '7.5cm x 7.5cm (Pack of 5)', '5 pkts', 'Main First Aid Box A', 'OK', 'OK', 'OK', 'OK', 'OK', 'OK', 'OK', 'OK', 'OK', 'OK', 'OK', 'OK', '2027-10-15', 'Sealed', 'Sufficient', 'Safety Officer', 'HSE Committee', 'COMPLIANT', 'NO', 'None'],
    ['5', 'Adhesive Plaster (Assorted)', 'Assorted Waterproof', '40 pcs', 'Main First Aid Box A', 'OK', 'OK', 'OK', 'OK', 'OK', 'OK', 'OK', 'OK', 'OK', 'OK', 'OK', 'OK', '2027-08-20', 'Good', 'Replenished', 'Safety Officer', 'HSE Committee', 'COMPLIANT', 'NO', 'Regular check'],
    ['6', 'Microporous Surgical Tape', '2.5cm x 5m', '2 rolls', 'Main First Aid Box A', 'OK', 'OK', 'OK', 'OK', 'OK', 'OK', 'OK', 'OK', 'OK', 'OK', 'OK', 'OK', '2028-04-10', 'Good', 'Original box', 'Safety Officer', 'HSE Committee', 'COMPLIANT', 'NO', 'None'],
    ['7', 'Burn Dressing / Hydrogel', '10cm x 10cm', '2 pkts', 'Main First Aid Box A', 'OK', 'OK', 'OK', 'OK', 'OK', 'OK', 'OK', 'OK', 'OK', 'OK', 'OK', 'OK', '2027-05-30', 'Good', 'Sterile packaging', 'Safety Officer', 'HSE Committee', 'COMPLIANT', 'NO', 'None'],
    ['8', 'Antiseptic Solution / Povidone', '60 ml', '1 bottle', 'Main First Aid Box A', 'OK', 'OK', 'OK', 'OK', 'OK', 'OK', 'OK', 'OK', 'OK', 'OK', 'OK', 'OK', '2027-12-31', 'Intact', 'Cap sealed', 'Safety Officer', 'HSE Committee', 'COMPLIANT', 'NO', 'Check seal'],
    ['9', 'Normal Saline Solution (Eye / Wound wash)', '500 ml', '2 bottles', 'Main First Aid Box A', 'OK', 'OK', 'OK', 'OK', 'OK', 'OK', 'OK', 'OK', 'OK', 'OK', 'OK', 'OK', '2027-09-15', 'Intact', 'Sterile', 'Safety Officer', 'HSE Committee', 'COMPLIANT', 'NO', 'None'],
    ['10', 'Stainless Steel Bandage Scissors', '15cm Surgical Grade', '1 pair', 'Main First Aid Box A', 'OK', 'OK', 'OK', 'OK', 'OK', 'OK', 'OK', 'OK', 'OK', 'OK', 'OK', 'OK', 'N/A', 'Sharp & Clean', 'Inspected', 'Safety Officer', 'HSE Committee', 'COMPLIANT', 'NO', 'None'],
    ['11', 'Safety Pins', 'Assorted Sizes', '12 pcs', 'Main First Aid Box A', 'OK', 'OK', 'OK', 'OK', 'OK', 'OK', 'OK', 'OK', 'OK', 'OK', 'OK', 'OK', 'N/A', 'Rust-free', 'In pouch', 'Safety Officer', 'HSE Committee', 'COMPLIANT', 'NO', 'None'],
    ['12', 'Disposable Nitrile Gloves (Pairs)', 'Size L Powder-free', '4 pairs', 'Main First Aid Box A', 'OK', 'OK', 'OK', 'OK', 'OK', 'OK', 'OK', 'OK', 'OK', 'OK', 'OK', 'OK', '2028-02-28', 'Good elasticity', 'Pouch sealed', 'Safety Officer', 'HSE Committee', 'COMPLIANT', 'NO', 'None'],
    ['13', 'CPR Face Shield / Pocket Mask', 'With One-Way Valve', '2 pcs', 'Main First Aid Box A', 'OK', 'OK', 'OK', 'OK', 'OK', 'OK', 'OK', 'OK', 'OK', 'OK', 'OK', 'OK', '2028-11-30', 'Good', 'Hygienic case', 'Safety Officer', 'HSE Committee', 'COMPLIANT', 'NO', 'None'],
    ['14', 'First Aid Booklet & Log Sheet', 'DOSH Standard Format', '1 set', 'Main First Aid Box A', 'OK', 'OK', 'OK', 'OK', 'OK', 'OK', 'OK', 'OK', 'OK', 'OK', 'OK', 'OK', 'N/A', 'Updated', 'Records active', 'Safety Officer', 'HSE Committee', 'COMPLIANT', 'NO', 'None'],
    ['15', 'Sterile Eye Pad', 'Oval Shape', '2 pkts', 'Main First Aid Box A', 'OK', 'OK', 'OK', 'OK', 'OK', 'OK', 'OK', 'OK', 'OK', 'OK', 'OK', 'OK', '2027-11-15', 'Sealed', 'Intact', 'Safety Officer', 'HSE Committee', 'COMPLIANT', 'NO', 'None'],
    ['16', 'Elastic Crepe Bandage', '10cm x 4.5m', '2 rolls', 'Main First Aid Box A', 'OK', 'OK', 'OK', 'OK', 'OK', 'OK', 'OK', 'OK', 'OK', 'OK', 'OK', 'OK', '2028-01-31', 'Good elasticity', 'Clean wrap', 'Safety Officer', 'HSE Committee', 'COMPLIANT', 'NO', 'None'],
    ['17', 'Forehead Thermometer / Digital', 'Digital LCD', '1 unit', 'Main First Aid Box A', 'OK', 'OK', 'OK', 'OK', 'OK', 'OK', 'OK', 'OK', 'OK', 'OK', 'OK', 'OK', 'N/A', 'Functional', 'Battery full', 'Safety Officer', 'HSE Committee', 'COMPLIANT', 'NO', 'None'],
    ['18', 'Absorbent Cotton Wool', '50g Pack', '1 pkt', 'Main First Aid Box A', 'OK', 'OK', 'OK', 'OK', 'OK', 'OK', 'OK', 'OK', 'OK', 'OK', 'OK', 'OK', '2028-08-31', 'Clean', 'Sealed bag', 'Safety Officer', 'HSE Committee', 'COMPLIANT', 'NO', 'None'],
    ['19', 'Emergency Blanket / Foil', '140cm x 210cm', '1 pc', 'Main First Aid Box A', 'OK', 'OK', 'OK', 'OK', 'OK', 'OK', 'OK', 'OK', 'OK', 'OK', 'OK', 'OK', '2029-01-01', 'Folded neat', 'Unused', 'Safety Officer', 'HSE Committee', 'COMPLIANT', 'NO', 'None'],
  ];

  const rawRecords = sampleItems.map((row) => {
    const rec: Record<string, string> = {};
    headers.forEach((h, idx) => {
      rec[h] = row[idx] || '';
    });
    return rec;
  });

  return {
    headers,
    rows: sampleItems,
    rawRecords,
  };
}

export async function fetchFirstAidKitTableData(): Promise<FirstAidKitTableData> {
  const SPREADSHEET_ID = '17RUlbsvnS8c2keut4n1ZqW5LZJIFGTfZBFuVV_sjnDA';
  const SHEET_NAME = 'FIRST AID KIT';
  const RANGE = 'A1:Y20';
  const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(SHEET_NAME)}&range=${RANGE}`;

  try {
    const res = await fetchWithTimeout(url, 8000);
    if (!res.ok) throw new Error(`Google Sheets responded with status ${res.status}`);
    const csvText = await res.text();

    if (csvText.includes('<!DOCTYPE html>') || csvText.includes('google-signin-button')) {
      throw new Error('Returned HTML instead of CSV data');
    }

    return new Promise((resolve) => {
      Papa.parse(csvText, {
        header: false,
        skipEmptyLines: false,
        complete: (results) => {
          if (results.data && results.data.length > 0) {
            const rawRows = results.data as string[][];
            // Filter out trailing completely blank rows
            const nonEmptyRows = rawRows.filter((r) => Array.isArray(r) && r.some((c) => c && String(c).trim() !== ''));
            if (nonEmptyRows.length > 0) {
              // Row 1 is header (index 0)
              const firstRow = nonEmptyRows[0];
              const headers = firstRow.map((h, i) => (h && String(h).trim() !== '' ? String(h).trim() : `Column ${i + 1}`));
              const dataRows = nonEmptyRows.slice(1);

              const cleanRows = dataRows.map((r) => {
                const filledRow: string[] = [];
                for (let i = 0; i < headers.length; i++) {
                  filledRow.push(r[i] !== undefined && r[i] !== null ? String(r[i]).trim() : '');
                }
                return filledRow;
              });

              const rawRecords = cleanRows.map((r) => {
                const record: Record<string, string> = {};
                headers.forEach((h, idx) => {
                  record[h] = r[idx] || '';
                });
                return record;
              });

              resolve({
                headers,
                rows: cleanRows,
                rawRecords,
              });
              return;
            }
          }
          resolve(getMockFirstAidKitData());
        },
        error: () => resolve(getMockFirstAidKitData()),
      });
    });
  } catch (err) {
    console.warn('Error fetching First Aid Kit table data from Google Sheets, using fallback:', err);
    return getMockFirstAidKitData();
  }
}



// 11. Live Incident Records
export async function fetchLiveIncidentRecords(requireAuth: boolean = false): Promise<any[]> {
  const SPREADSHEET_ID = '1o9P6GnlsAwSJEUYHxITt1Opz973uX37MLBiv0LdFdIs';
  const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&gid=88563672&range=A4:O`;

  try {
    const res = await fetchWithTimeout(url, 5000);
    if (!res.ok) throw new Error('Failed to fetch from sheets');
    const csvText = await res.text();
    
    return new Promise((resolve) => {
      Papa.parse(csvText, {
        header: false,
        skipEmptyLines: true,
        complete: (results) => {
          const records: any[] = [];
          if (results.data && results.data.length > 0) {
            // Row 4 is index 0 (header row), so skip it using slice(1)
            const dataRows = results.data.slice(1);
            dataRows.forEach((row: any) => {
              if (row.length > 0 && row[0]?.trim() !== '') {
                records.push({
                  id: row[0].trim(), // Column A: NO
                  date: row[1] || '-', // Column B: DATE
                  year: row[2] || '-', // Column C: YEAR
                  location: row[3] || '-', // Column D: LOCATION
                  description: row[4] || '-', // Column E: DESCRIPTION
                  occupationalIncident: row[5] || '-', // Column F: OCCUPATIONAL INCIDENT?
                  category: row[6] || '-', // Column G: INCIDENT CATEGORY
                  propertyDamage: row[7] || '-', // Column H: PROPERTY DAMAGE
                  damageLevel: row[8] || '-', // Column I: DAMAGE LEVEL
                  classification: row[9] || '-', // Column J: CLASSIFICATION
                  injuryType: row[10] || '-', // Column K: INJURY TYPE
                  personInvolved: row[11] || '-', // Column L: PERSON INVOLVE
                  experienceLevel: row[12] || '-', // Column M: WORK EXPERIENCE
                  reportedBy: row[13] || '-', // Column N: REPORTED BY
                  documentUrl: row[14] || '', // Column O: PDF
                  
                });
              }
            });
          }
          resolve(records.length > 0 ? records : MOCK_INCIDENT_RECORDS);
        },
        error: () => {
          resolve(MOCK_INCIDENT_RECORDS);
        }
      });
    });
  } catch (err) {
    console.warn('Error fetching live incidents:', err);
    return MOCK_INCIDENT_RECORDS;
  }
}

// 12. Minute Meetings
export interface JkkMeetingSummary {
  date: string;
  meetingTitle: string;
  location?: string;
  meetingNo?: string;
  totalMeetings?: number;
}

export async function fetchLatestJkkMeeting(): Promise<JkkMeetingSummary> {
  const SPREADSHEET_ID = '1o9P6GnlsAwSJEUYHxITt1Opz973uX37MLBiv0LdFdIs';
  // Query JKK MEETING sheet column D (and A:D)
  const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=JKK%20MEETING&range=A:D`;

  const fallback: JkkMeetingSummary = {
    date: '09/10/2026',
    meetingTitle: '13th Minute Meeting',
    location: 'IJOK',
    meetingNo: '13',
    totalMeetings: 13
  };

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch from JKK MEETING sheet');
    const csvText = await res.text();

    if (csvText.includes('<!DOCTYPE html>') || csvText.includes('google-signin-button')) {
      throw new Error('Returned HTML instead of CSV data');
    }

    return new Promise((resolve) => {
      Papa.parse(csvText, {
        header: false,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.data && results.data.length > 0) {
            const rows: string[][] = results.data
              .map((row: any) => Array.isArray(row) ? row.map(c => String(c || '').trim()) : [])
              .filter((row: string[]) => row.some(c => c !== ''));

            const dataRows = rows.length > 1 && rows[0].some(c => c.toUpperCase().includes('MEETING') || c.toUpperCase().includes('DATE'))
              ? rows.slice(1)
              : rows;

            const validDateRows = dataRows.filter(r => {
              const dateVal = r.length >= 4 ? r[3] : r[0];
              return dateVal && dateVal !== '' && dateVal.toUpperCase() !== 'DATE';
            });

            if (validDateRows.length > 0) {
              const lastRow = validDateRows[validDateRows.length - 1];
              const dateVal = lastRow.length >= 4 ? lastRow[3] : lastRow[0];
              const meetingTitle = lastRow.length >= 2 ? lastRow[1] : `Meeting #${validDateRows.length}`;
              const location = lastRow.length >= 3 ? lastRow[2] : 'IJOK';
              const meetingNo = lastRow.length >= 1 ? lastRow[0] : String(validDateRows.length);

              resolve({
                date: dateVal || '09/10/2026',
                meetingTitle: meetingTitle || 'Latest Minute Meeting',
                location: location || 'IJOK',
                meetingNo: meetingNo || String(validDateRows.length),
                totalMeetings: validDateRows.length
              });
              return;
            }
          }
          resolve(fallback);
        },
        error: () => {
          resolve(fallback);
        }
      });
    });
  } catch (err) {
    console.warn('Error fetching JKK Meeting data:', err);
    return fallback;
  }
}

export async function fetchDynamicMinuteMeetings(): Promise<any[]> {
  const SPREADSHEET_ID = '1o9P6GnlsAwSJEUYHxITt1Opz973uX37MLBiv0LdFdIs';
  const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&gid=1985060946&range=A4:E`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch from sheets');
    const csvText = await res.text();
    
    return new Promise((resolve) => {
      Papa.parse(csvText, {
        header: false,
        skipEmptyLines: true,
        complete: (results) => {
          const meetings: any[] = [];
          if (results.data && results.data.length > 0) {
            results.data.forEach((row: any, index: number) => {
              if (row.length >= 4 && row[0]?.trim() !== '') {
                meetings.push({
                  id: row[0],
                  title: row[1] || '-',
                  location: row[2] || '-',
                  date: row[3] || '-',
                  documentUrl: row[4] || ''
                });
              }
            });
          }
          resolve(meetings.length > 0 ? meetings : MOCK_MINUTE_MEETINGS);
        },
        error: () => {
          resolve(MOCK_MINUTE_MEETINGS);
        }
      });
    });
  } catch (err) {
    console.warn('Error fetching minute meetings:', err);
    return MOCK_MINUTE_MEETINGS;
  }
}

export async function fetchDynamicHIRARC(): Promise<any[]> {
  const SPREADSHEET_ID = '1o9P6GnlsAwSJEUYHxITt1Opz973uX37MLBiv0LdFdIs';
  const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&gid=1423932800&range=B57:F`;

  const fallbackHirarc = MOCK_HIRARCS.map((h, index) => ({
    id: h.code || `HIRARC-${index + 1}`,
    title: h.activityName,
    date: '15/01/2026',
    revDate: '15/02/2026',
    documentUrl: h.documentUrl
  }));

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch from sheets');
    const csvText = await res.text();
    
    return new Promise((resolve) => {
      Papa.parse(csvText, {
        header: false,
        skipEmptyLines: true,
        complete: (results) => {
          const records: any[] = [];
          if (results.data && results.data.length > 0) {
            results.data.forEach((row: any) => {
              if (row.length >= 4 && row[0]?.trim() !== '' && row[1]?.trim() !== '' && row[0] !== 'HIRARC') {
                records.push({
                  id: row[0],
                  title: row[1] || '-',
                  date: row[2] || '-',
                  revDate: row[3] || '-',
                  documentUrl: row[4] || ''
                });
              }
            });
          }
          resolve(records.length > 0 ? records : fallbackHirarc);
        },
        error: () => {
          resolve(fallbackHirarc);
        }
      });
    });
  } catch (err) {
    console.warn('Error fetching HIRARC:', err);
    return fallbackHirarc;
  }
}

export async function fetchDynamicSOP(): Promise<any[]> {
  const SPREADSHEET_ID = '1o9P6GnlsAwSJEUYHxITt1Opz973uX37MLBiv0LdFdIs';
  const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&gid=1423932800&range=B24:F54`;

  const fallbackSop = MOCK_SOPS.map((s, index) => ({
    id: s.code || `SOP-${index + 1}`,
    title: s.title,
    date: '10/01/2026',
    revDate: s.revisionDate,
    documentUrl: s.documentUrl
  }));

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch from sheets');
    const csvText = await res.text();
    
    return new Promise((resolve) => {
      Papa.parse(csvText, {
        header: false,
        skipEmptyLines: true,
        complete: (results) => {
          const records: any[] = [];
          if (results.data && results.data.length > 0) {
            results.data.forEach((row: any, index: number) => {
              if (row.length >= 4 && row[0]?.trim() !== '' && row[1]?.trim() !== '' && !row[0].toString().includes('SOP FOR WAREHOUSE ACTIVITY')) {
                records.push({
                  id: `${row[0]}-${index}`,
                  title: row[1] || '-',
                  date: row[2] || '-',
                  revDate: row[3] || '-',
                  documentUrl: row[4] || ''
                });
              }
            });
          }
          resolve(records.length > 0 ? records : fallbackSop);
        },
        error: () => {
          resolve(fallbackSop);
        }
      });
    });
  } catch (err) {
    console.warn('Error fetching SOP:', err);
    return fallbackSop;
  }
}

export async function fetchSafetyViolationSummaryTable(): Promise<string[][]> {
  const SPREADSHEET_ID = '1o9P6GnlsAwSJEUYHxITt1Opz973uX37MLBiv0LdFdIs';
  const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=DEMERIT&range=K3:O37`;

  const fallbackData: string[][] = [
    ["Kod Kesalahan", "Kategori", "Penerangan Salah Laku", "Demerit", "Tindakan"],
    ["A1", "Ringan", "Tidak memakai PPE lengkap/bersesuaian", "5", "1) Teguran dan nasihat"],
    ["A2", "Ringan", "Tidak hadir toolbox talk/taklimat/latihan tanpa sebab munasabah", "5", "2) Rekod dalam HSE fie"],
    ["A3", "Ringan", "Housekeeping tidak memuaskan di kawasan kerja", "5", "3) Briefing semula"],
    ["A4", "Ringan", "Merokok/Makan di kawasan larangan", "5", ""],
    ["A5", "Ringan", "Menggunakan PPE rosak", "5", ""],
    ["A6", "Ringan", "Tidak lapor unsafe condition", "5", ""],
    ["A7", "Ringan", "Tidak patuhi arahan keselamatan am", "5", ""],
    ["A8", "Ringan", "Menggunakan telefon semasa kerja", "5", ""],
    ["A9", "Ringan", "Bergurau, bermain, atau membuat aksi berbahaya di tempat kerja", "5", ""],
    ["A10", "Ringan", "Apa-apa salahlaku yang Ringan", "5", ""],
    ["B1", "Sederhana", "Tidak buat pemeriksaan harian mesin", "10", "1) Teguran keras"],
    ["B2", "Sederhana", "Mengendalikan mesin tanpa latihan rasmi", "10", "2) Rekod dalam HSE fie"],
    ["B3", "Sederhana", "Tidak memakai harness semasa kerja di tempat tinggi", "10", "3) Briefing semula"],
    ["B4", "Sederhana", "Menggunakan peralatan tidak diperiksa", "10", ""],
    ["B5", "Sederhana", "Tidak patuhi SOP ", "10", ""],
    ["B6", "Sederhana", "Tiada barricade atau signage keselamatan", "10", ""],
    ["B7", "Sederhana", "Mengangkat beban tanpa penilaian risiko", "10", ""],
    ["B8", "Sederhana", "Tidak patuhi prosedur LOTO bukan elektrik", "10", ""],
    ["B9", "Sederhana", "Near miss akibat kecuaian", "10", ""],
    ["B10", "Sederhana", "Apa-apa salahlaku yang Sederhana", "10", ""],
    ["C1", "Serius", "Operasi forklift / MEWP/ Kenderaan syarikat tanpa kebenaran", "20", "1) Teguran keras"],
    ["C2", "Serius", "Mengangkat beban melebihi kapasiti mesin", "20", "2) Rekod dalam HSE fie"],
    ["C3", "Serius", "Bypass safety device mesin", "20", "3) Surat amaran"],
    ["C4", "Serius", "Kerja elektrik tanpa LOTO", "20", ""],
    ["C5", "Serius", "Ingkar arahan keselamatan penyelia / HSE", "20", ""],
    ["C6", "Serius", "Menggunakan mesin ber-tag DO NOT USE", "20", ""],
    ["C7", "Serius", "Apa-apa salahlaku yang Serius", "20", ""],
    ["D1", "Kritikal", "Menyebabkan kemalangan serius atau maut diri sendiri/orang lain", "50", "1) Teguran keras"],
    ["D2", "Kritikal", "Kerja tempat tinggi tanpa PPE yang lengkap", "50", "2) Rekod dalam HSE fie"],
    ["D3", "Kritikal", "Operasi mesin dalam keadaan mabuk / dadah", "50", "3) Surat amaran"],
    ["D4", "Kritikal", "Sengaja melanggar arahan keselamatan bertulis", "50", "4) Pergantungan /Penamatan perkhidmatan"],
    ["D5", "Kritikal", "Menyembunyikan / memalsukan laporan kemalangan", "50", ""],
    ["D6", "Kritikal", "Tidak memberi bantuan semasa kecemasan ", "50", ""],
    ["D7", "Kritikal", "Apa-apa salahlaku yang Kritikal", "50", ""]
  ];

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch from sheets');
    const csvText = await res.text();
    
    if (csvText.includes('<!DOCTYPE html>') || csvText.includes('google-signin-button')) {
      throw new Error('Returned HTML instead of CSV data');
    }

    return new Promise((resolve) => {
      Papa.parse(csvText, {
        header: false,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.data && results.data.length > 0) {
            const formatted: string[][] = results.data
              .map((row: any) => Array.isArray(row) ? row.map(cell => String(cell || '').trim()) : [])
              .filter((row: string[]) => row.some(c => c !== ''));
            resolve(formatted.length > 0 ? formatted : fallbackData);
          } else {
            resolve(fallbackData);
          }
        },
        error: () => {
          resolve(fallbackData);
        }
      });
    });
  } catch (err) {
    console.warn('Error fetching Safety Violation Summary (DEMERIT K3:O37):', err);
    return fallbackData;
  }
}

// 14. Safety Violation Scoring System Fetcher
export async function fetchSafetyViolationScoring(): Promise<string[][]> {
  const SPREADSHEET_ID = '1o9P6GnlsAwSJEUYHxITt1Opz973uX37MLBiv0LdFdIs';
  const GID = '817838002';
  const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&gid=${GID}&range=A3:I`;

  const fallbackData: string[][] = [
    ["NO", "NAME", "EMPLOYEE ID", "DEPARTMENT", "POSITION", "CODE", "POINT", "DATE", "DESCRIPTION"],
    ["1", "Nikod", "1410001", "CI & PROJECT", "TEAM LEADER", "B7", "10", "16/1/25", ""],
    ["2", "Firdaus", "2203001", "O&M (IJOK)", "TEAM LEADER", "B5", "10", "13/8/26", ""],
    ["3", "Yunus", "1509001", "O&M (IJOK)", "ASSISTANT TECH", "B7", "10", "1/4/26", ""],
    ["4", "Roziman", "2508003", "O&M (IJOK)", "ENGINEER", "A1", "5", "29/8/26", "TIDAK MEAMAKAI SAFETY BOOT SEMASA MENGENDALIKAN FORKLIFT"]
  ];

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch from sheets');
    const csvText = await res.text();
    
    if (csvText.includes('<!DOCTYPE html>') || csvText.includes('google-signin-button')) {
      throw new Error('Returned HTML instead of CSV data');
    }

    return new Promise((resolve) => {
      Papa.parse(csvText, {
        header: false,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.data && results.data.length > 0) {
            const formatted: string[][] = results.data
              .map((row: any) => Array.isArray(row) ? row.map(cell => String(cell || '').trim()) : [])
              .filter((row: string[]) => row.some(c => c !== ''));
            resolve(formatted.length > 0 ? formatted : fallbackData);
          } else {
            resolve(fallbackData);
          }
        },
        error: () => {
          resolve(fallbackData);
        }
      });
    });
  } catch (err) {
    console.warn('Error fetching Safety Violation Scoring System:', err);
    return fallbackData;
  }
}

// 15. Summary Tables Fetcher (Q25:W102) from Google Sheet
export interface SummaryTableRowData {
  no: string;
  label: string;
  c2022: string;
  c2023: string;
  c2024: string;
  c2025: string;
  c2026: string;
  total: string;
  isTotal?: boolean;
}

export interface SummaryTableSectionData {
  title: string;
  headers: string[];
  rows: SummaryTableRowData[];
}

export type SummaryTablesMap = Record<string, SummaryTableSectionData>;

export const FALLBACK_SUMMARY_TABLES: SummaryTablesMap = {
    LOCATION: {
      title: 'LOCATION OF INCIDENTS',
      headers: ['NO', 'LOCATION', '2022', '2023', '2024', '2025', '2026', 'TOTAL INCIDENTS'],
      rows: [
        { no: '1', label: 'IJOK', c2022: '3', c2023: '3', c2024: '3', c2025: '6', c2026: '5', total: '20' },
        { no: '2', label: 'PENANG', c2022: '0', c2023: '0', c2024: '1', c2025: '1', c2026: '3', total: '5' },
        { no: '3', label: 'PUBLIC ROAD', c2022: '2', c2023: '1', c2024: '11', c2025: '6', c2026: '9', total: '29' },
        { no: '4', label: 'SITE', c2022: '0', c2023: '0', c2024: '1', c2025: '0', c2026: '3', total: '4' },
        { no: '', label: 'TOTAL', c2022: '5', c2023: '4', c2024: '16', c2025: '13', c2026: '20', total: '58', isTotal: true },
      ],
    },
    'INCIDENT CATEGORY': {
      title: 'INCIDENT CATEGORY',
      headers: ['NO', 'INCIDENT CATEGORY', '2022', '2023', '2024', '2025', '2026', 'TOTAL INCIDENTS'],
      rows: [
        { no: '1', label: 'Near Miss', c2022: '0', c2023: '0', c2024: '1', c2025: '0', c2026: '2', total: '3' },
        { no: '2', label: 'Property Damage Only', c2022: '2', c2023: '2', c2024: '5', c2025: '8', c2026: '11', total: '28' },
        { no: '3', label: 'First Aid Case (FAC)', c2022: '0', c2023: '0', c2024: '1', c2025: '1', c2026: '0', total: '2' },
        { no: '4', label: 'Medical Treatment Case (MTC)', c2022: '3', c2023: '1', c2024: '9', c2025: '3', c2026: '4', total: '20' },
        { no: '5', label: 'Restricted Work Case (RWC)', c2022: '0', c2023: '0', c2024: '0', c2025: '0', c2026: '0', total: '0' },
        { no: '6', label: 'Lost Time Injury (LTI)', c2022: '0', c2023: '1', c2024: '0', c2025: '1', c2026: '3', total: '5' },
        { no: '7', label: 'Fatality', c2022: '0', c2023: '0', c2024: '0', c2025: '0', c2026: '0', total: '0' },
        { no: '8', label: 'Occupational Illness', c2022: '0', c2023: '0', c2024: '0', c2025: '0', c2026: '0', total: '0' },
        { no: '9', label: 'Other Illness', c2022: '0', c2023: '0', c2024: '0', c2025: '0', c2026: '1', total: '1' },
        { no: '', label: 'TOTAL', c2022: '5', c2023: '4', c2024: '16', c2025: '13', c2026: '21', total: '59', isTotal: true },
      ],
    },
    CLASSIFICATION: {
      title: 'INCIDENT CLASSIFICATION',
      headers: ['NO', 'CLASSIFICATION', '2022', '2023', '2024', '2025', '2026', 'TOTAL INCIDENTS'],
      rows: [
        { no: '1', label: 'Unsafe Act', c2022: '1', c2023: '0', c2024: '3', c2025: '7', c2026: '7', total: '18' },
        { no: '2', label: 'Unsafe Condition', c2022: '2', c2023: '2', c2024: '1', c2025: '0', c2026: '1', total: '6' },
        { no: '3', label: 'Equipment Failure', c2022: '0', c2023: '0', c2024: '1', c2025: '0', c2026: '1', total: '2' },
        { no: '4', label: 'Environmental', c2022: '0', c2023: '0', c2024: '0', c2025: '0', c2026: '1', total: '1' },
        { no: '5', label: 'Fire / Explosion', c2022: '0', c2023: '1', c2024: '0', c2025: '1', c2026: '1', total: '3' },
        { no: '6', label: 'Vehicle Incident', c2022: '0', c2023: '0', c2024: '8', c2025: '4', c2026: '7', total: '19' },
        { no: '7', label: 'Company Vehicle Incident', c2022: '2', c2023: '1', c2024: '3', c2025: '1', c2026: '3', total: '10' },
        { no: '', label: 'TOTAL', c2022: '5', c2023: '4', c2024: '16', c2025: '13', c2026: '21', total: '59', isTotal: true },
      ],
    },
    'INJURY TYPE': {
      title: 'INJURY TYPE / NATURE OF INJURY',
      headers: ['NO', 'INJURY TYPE', '2022', '2023', '2024', '2025', '2026', 'TOTAL INCIDENTS'],
      rows: [
        { no: '1', label: 'N/A', c2022: '3', c2023: '2', c2024: '6', c2025: '8', c2026: '13', total: '32' },
        { no: '2', label: 'Cut/Abrasion', c2022: '2', c2023: '1', c2024: '10', c2025: '3', c2026: '3', total: '19' },
        { no: '3', label: 'Bruise', c2022: '0', c2023: '0', c2024: '0', c2025: '1', c2026: '4', total: '5' },
        { no: '4', label: 'Pinch Injury', c2022: '0', c2023: '1', c2024: '0', c2025: '1', c2026: '0', total: '2' },
        { no: '5', label: 'Other', c2022: '0', c2023: '0', c2024: '0', c2025: '0', c2026: '1', total: '1' },
        { no: '', label: 'TOTAL', c2022: '5', c2023: '4', c2024: '16', c2025: '13', c2026: '21', total: '59', isTotal: true },
      ],
    },
    'WORK EXPERIENCE': {
      title: 'WORK EXPERIENCE OF INJURED PERSON',
      headers: ['NO', 'WORK EXPERIENCE', '2022', '2023', '2024', '2025', '2026', 'TOTAL INCIDENTS'],
      rows: [
        { no: '1', label: 'Permanent Staff <5 Year', c2022: '3', c2023: '3', c2024: '7', c2025: '5', c2026: '10', total: '28' },
        { no: '2', label: 'Permanent Staff 5-10 Year', c2022: '1', c2023: '0', c2024: '0', c2025: '1', c2026: '2', total: '4' },
        { no: '3', label: 'Permanent Staff >10 Year', c2022: '0', c2023: '0', c2024: '1', c2025: '1', c2026: '3', total: '5' },
        { no: '4', label: 'Intern/OJT', c2022: '1', c2023: '0', c2024: '6', c2025: '5', c2026: '0', total: '12' },
        { no: '5', label: 'Others', c2022: '0', c2023: '1', c2024: '2', c2025: '1', c2026: '1', total: '5' },
        { no: '', label: 'TOTAL', c2022: '5', c2023: '4', c2024: '16', c2025: '13', c2026: '16', total: '54', isTotal: true },
      ],
    },
    'OCCUPATIONAL INCIDENT': {
      title: 'OCCUPATIONAL INCIDENT VS NON-OCCUPATIONAL INCIDENT',
      headers: ['NO', 'INCIDENT TYPE', '2022', '2023', '2024', '2025', '2026', 'TOTAL INCIDENTS'],
      rows: [
        { no: '1', label: 'YES (WORK-RELATED)', c2022: '4', c2023: '4', c2024: '8', c2025: '9', c2026: '13', total: '38' },
        { no: '2', label: 'NO (NON-WORK RELATED)', c2022: '1', c2023: '0', c2024: '8', c2025: '4', c2026: '8', total: '21' },
        { no: '', label: 'TOTAL', c2022: '5', c2023: '4', c2024: '16', c2025: '13', c2026: '21', total: '59', isTotal: true },
      ],
    },
  };

export async function fetchSummaryTablesFromGoogleSheet(): Promise<SummaryTablesMap> {
  const SPREADSHEET_ID = '1o9P6GnlsAwSJEUYHxITt1Opz973uX37MLBiv0LdFdIs';
  const GID = '88563672';
  const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&gid=${GID}&range=Q25:W102`;
  const fallbackTables = FALLBACK_SUMMARY_TABLES;

  try {
    const res = await fetchWithTimeout(url, 5000);
    if (!res.ok) throw new Error('Failed to fetch summary tables from sheets');
    const csvText = await res.text();

    if (csvText.includes('<!DOCTYPE html>') || csvText.includes('google-signin-button')) {
      throw new Error('Returned HTML instead of CSV data');
    }

    return new Promise((resolve) => {
      Papa.parse(csvText, {
        header: false,
        skipEmptyLines: true,
        complete: (results) => {
          if (!results.data || results.data.length === 0) {
            resolve(fallbackTables);
            return;
          }

          const parsed: string[][] = results.data as string[][];
          const map: SummaryTablesMap = {};
          let currentKey = '';
          let currentTitle = '';
          let currentRows: SummaryTableRowData[] = [];
          let itemIndex = 1;

          parsed.forEach((row: any) => {
            if (!Array.isArray(row)) return;
            const col0 = String(row[0] || '').trim();
            if (!col0) return;

            const isHeaderRow = ['LOCATION', 'INCIDENT CATEGORY', 'CLASSIFICATION', 'INJURY TYPE', 'WORK EXPERIENCE', 'OCCUPATIONAL INCIDENT'].some(
              (k) => col0.toUpperCase().includes(k)
            );

            if (isHeaderRow) {
              if (currentKey && currentRows.length > 0) {
                // Add calculated TOTAL row if not exists
                const total2022 = currentRows.reduce((sum, r) => sum + (parseInt(r.c2022, 10) || 0), 0);
                const total2023 = currentRows.reduce((sum, r) => sum + (parseInt(r.c2023, 10) || 0), 0);
                const total2024 = currentRows.reduce((sum, r) => sum + (parseInt(r.c2024, 10) || 0), 0);
                const total2025 = currentRows.reduce((sum, r) => sum + (parseInt(r.c2025, 10) || 0), 0);
                const total2026 = currentRows.reduce((sum, r) => sum + (parseInt(r.c2026, 10) || 0), 0);
                const grandTotal = total2022 + total2023 + total2024 + total2025 + total2026;

                currentRows.push({
                  no: '',
                  label: 'TOTAL',
                  c2022: String(total2022),
                  c2023: String(total2023),
                  c2024: String(total2024),
                  c2025: String(total2025),
                  c2026: String(total2026),
                  total: String(grandTotal),
                  isTotal: true,
                });

                map[currentKey] = {
                  title: currentTitle,
                  headers: ['NO', currentTitle, '2022', '2023', '2024', '2025', '2026', 'TOTAL INCIDENTS'],
                  rows: currentRows,
                };
              }

              currentTitle = col0;
              currentKey = col0.toUpperCase();
              currentRows = [];
              itemIndex = 1;
            } else if (currentKey) {
              const c2022 = String(row[1] || '0').trim();
              const c2023 = String(row[2] || '0').trim();
              const c2024 = String(row[3] || '0').trim();
              const c2025 = String(row[4] || '0').trim();
              const c2026 = String(row[5] || '0').trim();
              let tot = String(row[6] || '0').trim();

              const sumVal =
                (parseInt(c2022, 10) || 0) +
                (parseInt(c2023, 10) || 0) +
                (parseInt(c2024, 10) || 0) +
                (parseInt(c2025, 10) || 0) +
                (parseInt(c2026, 10) || 0);

              if (tot === '0' || !tot) {
                tot = String(sumVal);
              }

              currentRows.push({
                no: String(itemIndex++),
                label: col0,
                c2022,
                c2023,
                c2024,
                c2025,
                c2026,
                total: tot,
              });
            }
          });

          if (currentKey && currentRows.length > 0) {
            const total2022 = currentRows.reduce((sum, r) => sum + (parseInt(r.c2022, 10) || 0), 0);
            const total2023 = currentRows.reduce((sum, r) => sum + (parseInt(r.c2023, 10) || 0), 0);
            const total2024 = currentRows.reduce((sum, r) => sum + (parseInt(r.c2024, 10) || 0), 0);
            const total2025 = currentRows.reduce((sum, r) => sum + (parseInt(r.c2025, 10) || 0), 0);
            const total2026 = currentRows.reduce((sum, r) => sum + (parseInt(r.c2026, 10) || 0), 0);
            const grandTotal = total2022 + total2023 + total2024 + total2025 + total2026;

            currentRows.push({
              no: '',
              label: 'TOTAL',
              c2022: String(total2022),
              c2023: String(total2023),
              c2024: String(total2024),
              c2025: String(total2025),
              c2026: String(total2026),
              total: String(grandTotal),
              isTotal: true,
            });

            map[currentKey] = {
              title: currentTitle,
              headers: ['NO', currentTitle, '2022', '2023', '2024', '2025', '2026', 'TOTAL INCIDENTS'],
              rows: currentRows,
            };
          }

          resolve(Object.keys(map).length > 0 ? map : fallbackTables);
        },
        error: () => resolve(fallbackTables),
      });
    });
  } catch (err) {
    console.warn('Error fetching summary tables:', err);
    return fallbackTables;
  }
}

