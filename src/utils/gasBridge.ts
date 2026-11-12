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
let cachedDaysWithoutIncident: number = (() => {
  try {
    const val = localStorage.getItem('HSE_CACHED_DAYS_WITHOUT_INCIDENT');
    if (val) {
      const p = parseInt(val, 10);
      if (!isNaN(p)) return p;
    }
  } catch {}
  return 2;
})();

export function getCachedDaysWithoutIncident(): number {
  return cachedDaysWithoutIncident;
}

export async function fetchDaysWithoutIncident(): Promise<number> {
  const SPREADSHEET_ID = '1o9P6GnlsAwSJEUYHxITt1Opz973uX37MLBiv0LdFdIs';
  const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=HSE+FILE&range=I2:I2`;
  try {
    const res = await fetchWithTimeout(url, 3500);
    if (!res.ok) throw new Error('Failed to fetch from sheets');
    const csvText = await res.text();
    
    // csvText is usually '"17"' or '17'
    const value = parseInt(csvText.replace(/"/g, '').trim(), 10);
    if (!isNaN(value)) {
      cachedDaysWithoutIncident = value;
      try {
        localStorage.setItem('HSE_CACHED_DAYS_WITHOUT_INCIDENT', String(value));
      } catch {}
      return value;
    }
  } catch (err) {
    console.warn('Error fetching days without incident:', err);
  }
  return cachedDaysWithoutIncident;
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
  // Google Sheet:
  // spreadsheet_id: 1HLebePp1L31C-nZk6HgTxDwy6kXktNHDdbEdGcMvbbA
  // sheet_name: Records
  // Range: row 2 onwards until current data
  // Columns:
  // Form No (A): No
  // Nama (C): Inspector
  // Kawasan (D): Location
  // Tarikh (E): Date
  // Catitan Keseluruhan (G): Remark
  // PDF (BF): Document URL
  const SPREADSHEET_ID = '1HLebePp1L31C-nZk6HgTxDwy6kXktNHDdbEdGcMvbbA';
  const SHEET_NAME = 'Records';
  const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(SHEET_NAME)}`;

  let records: InspectionRecord[] = [];

  try {
    const res = await fetchWithTimeout(url, 8000);
    if (res.ok) {
      const csvText = await res.text();
      if (!csvText.includes('<!DOCTYPE html>') && !csvText.includes('google-signin-button')) {
        records = await new Promise((resolve) => {
          Papa.parse(csvText, {
            header: false,
            skipEmptyLines: true,
            complete: (results) => {
              const parsed: InspectionRecord[] = [];
              if (results.data && results.data.length > 0) {
                const headerRow = results.data[0] as string[];

                // Column indices defaults:
                // NO / Form No: A (index 0)
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

                // Take data from row 2 until current data (slice 1 skips header row 1)
                const dataRows = results.data.slice(1);

                dataRows.forEach((row: any, index: number) => {
                  if (row && row.length > 0) {
                    const sheetNo = (row[noIdx] || '').trim();
                    const rawDate = (row[dateIdx] || '').trim();
                    const location = (row[locationIdx] || '').trim();
                    const inspector = (row[inspectorIdx] || '').trim();
                    const remark = (row[remarkIdx] || '').trim();
                    const documentUrl = (row[pdfIdx] || '').trim();

                    // Skip completely empty rows
                    if (!rawDate && !location && !inspector && !remark && !documentUrl && !sheetNo) {
                      return;
                    }

                    // Format date: format YYYY-MM-DD or DD/MM/YYYY to DD-MM-YY to match display
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

                    const rowNum = index + 1;

                    parsed.push({
                      id: `INSP-${index + 2}-${sheetNo || rowNum}`,
                      date,
                      day,
                      location,
                      typeOfInspection: 'Workplace',
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
    console.warn(`Error fetching inspection records from sheet ${SHEET_NAME}:`, err);
  }

  // Fallback data if fetch failed (e.g. offline / disconnected)
  if (records.length === 0) {
    records = [
      {
        id: 'INSP-2-fallback-1',
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
      },
      {
        id: 'INSP-3-fallback-2',
        date: '09-10-26',
        day: 'Fri',
        location: 'IJOK WAREHOUSE',
        typeOfInspection: 'Workplace',
        inspector: 'MUHAMMAD SYAFIQ ASHRAF BIN ZAINAL ABIDIN',
        remark: 'secara keseluruhan,tempat kerja dalam keadaan yang memuaskan,perlu tambah baik lagi dan cuba kekalkan persekitaran kerja ',
        documentUrl: 'https://drive.google.com/file/d/10MFJq6ByVUj2G7eJSwYjDoC31WNVKULZ/view?usp=drivesdk',
        locationFacility: 'IJOK WAREHOUSE',
        inspectorName: 'MUHAMMAD SYAFIQ ASHRAF BIN ZAINAL ABIDIN',
        type: 'Workplace',
        totalChecked: 0,
        compliantCount: 0,
        complianceRate: '-',
        status: 'Passed'
      }
    ];
  }

  return records;
}

// 9b. Fire Extinguisher Inspection Data Fallback Data from Google Sheets
export const FALLBACK_FIRE_EXTINGUISHER_RECORDS: FireExtinguisherRecord[] = [
  { id: 'FE-ROW-3-1', rowNumber: 3, isHeader: false, no: '1', location: 'IJOK', typeABC: '✓', typeCO2: '', brand: 'UQ (NEW)', serialNumber: '988275', month: '2', year: '2026', certExpiryDate: '16/02/2027', remarks: '' },
  { id: 'FE-ROW-4-2', rowNumber: 4, isHeader: false, no: '2', location: 'IJOK', typeABC: '✓', typeCO2: '', brand: 'UQ (NEW)', serialNumber: '989807', month: '2', year: '2026', certExpiryDate: '16/02/2027', remarks: '' },
  { id: 'FE-ROW-5-3', rowNumber: 5, isHeader: false, no: '3', location: 'IJOK', typeABC: '✓', typeCO2: '', brand: 'UQ (NEW)', serialNumber: '986899', month: '2', year: '2026', certExpiryDate: '16/02/2027', remarks: '' },
  { id: 'FE-ROW-6-4', rowNumber: 6, isHeader: false, no: '4', location: 'IJOK', typeABC: '✓', typeCO2: '', brand: 'UQ (NEW)', serialNumber: '986602', month: '2', year: '2026', certExpiryDate: '16/02/2027', remarks: '' },
  { id: 'FE-ROW-7-5', rowNumber: 7, isHeader: false, no: '5', location: 'IJOK', typeABC: '✓', typeCO2: '', brand: 'UF', serialNumber: '906276', month: '1', year: '2018', certExpiryDate: '16/02/2027', remarks: 'CHANGE METAL HANDLE, HOSE BELT, REFILL' },
  { id: 'FE-ROW-8-6', rowNumber: 8, isHeader: false, no: '6', location: 'IJOK', typeABC: '✓', typeCO2: '', brand: 'EE', serialNumber: '819375', month: '10', year: '2022', certExpiryDate: '16/02/2027', remarks: 'REFILL' },
  { id: 'FE-ROW-9-7', rowNumber: 9, isHeader: false, no: '7', location: 'IJOK', typeABC: '✓', typeCO2: '', brand: 'UF', serialNumber: '905482', month: '1', year: '2018', certExpiryDate: '16/02/2027', remarks: '' },
  { id: 'FE-ROW-10-8', rowNumber: 10, isHeader: false, no: '8', location: 'IJOK', typeABC: '✓', typeCO2: '', brand: 'EE', serialNumber: '37642', month: '3', year: '2019', certExpiryDate: '16/02/2027', remarks: 'REFILL' },
  { id: 'FE-ROW-11-9', rowNumber: 11, isHeader: false, no: '9', location: 'OFFICE', typeABC: '', typeCO2: '✓', brand: 'UF', serialNumber: '500187', month: '1', year: '2018', certExpiryDate: '16/02/2027', remarks: '' },
  { id: 'FE-ROW-12-10', rowNumber: 12, isHeader: false, no: '10', location: 'OFFICE', typeABC: '✓', typeCO2: '', brand: 'UF', serialNumber: '907392', month: '1', year: '2018', certExpiryDate: '16/02/2027', remarks: '' },
  { id: 'FE-ROW-13-11', rowNumber: 13, isHeader: false, no: '11', location: 'OFFICE', typeABC: '✓', typeCO2: '', brand: 'EE', serialNumber: '271442', month: '9', year: '2022', certExpiryDate: '16/02/2027', remarks: '' },
  { id: 'FE-ROW-14-12', rowNumber: 14, isHeader: false, no: '12', location: 'PROJECT', typeABC: '✓', typeCO2: '', brand: 'EE', serialNumber: '718139', month: '10', year: '2022', certExpiryDate: '16/02/2027', remarks: '' },
  { id: 'FE-ROW-15-13', rowNumber: 15, isHeader: false, no: '13', location: 'PROJECT', typeABC: '✓', typeCO2: '', brand: 'EE', serialNumber: '170991', month: '9', year: '2022', certExpiryDate: '16/02/2027', remarks: 'HOSE BELT' },
  { id: 'FE-ROW-16-14', rowNumber: 16, isHeader: false, no: '14', location: 'LORRY NDS', typeABC: '', typeCO2: '✓', brand: 'EE', serialNumber: '566', month: '3', year: '2019', certExpiryDate: '16/02/2027', remarks: 'REFILL' },
  { id: 'FE-ROW-17-15', rowNumber: 17, isHeader: false, no: '15', location: 'LORRY WVS', typeABC: '✓', typeCO2: '', brand: '???', serialNumber: '', month: '', year: '', certExpiryDate: '', remarks: 'GUNA EXP UNIT' },
  { id: 'FE-ROW-18-16', rowNumber: 18, isHeader: false, no: '16', location: 'LORRY WMP', typeABC: '', typeCO2: '', brand: '???', serialNumber: '', month: '9', year: '2015', certExpiryDate: '', remarks: 'EXP, TONG KECIL' },
  { id: 'FE-ROW-19-17', rowNumber: 19, isHeader: true, no: '—', location: 'LOCATION', typeABC: 'TYPE ABC', typeCO2: 'TYPE CO2', brand: 'BRAND', serialNumber: 'SERIAL NUMBER', month: 'MONTH', year: 'YEAR', certExpiryDate: 'CERT EXPIRY DATE', remarks: 'REMARKS 2026' },
  { id: 'FE-ROW-20-18', rowNumber: 20, isHeader: false, no: '1', location: 'PENANG', typeABC: '✓', typeCO2: '', brand: 'UF', serialNumber: 'UF 09 2023 Y 998312', month: '9', year: '2023', certExpiryDate: '01/12/2026', remarks: '' },
  { id: 'FE-ROW-21-19', rowNumber: 21, isHeader: false, no: '2', location: 'PENANG', typeABC: '✓', typeCO2: '', brand: 'UF', serialNumber: 'UF 09 2023 Y 998313', month: '9', year: '2023', certExpiryDate: '01/12/2026', remarks: '' },
  { id: 'FE-ROW-22-20', rowNumber: 22, isHeader: false, no: '3', location: 'PENANG', typeABC: '✓', typeCO2: '', brand: 'UF', serialNumber: 'UF 09 2023 Y 998314', month: '9', year: '2023', certExpiryDate: '01/12/2026', remarks: '' },
  { id: 'FE-ROW-23-21', rowNumber: 23, isHeader: false, no: '4', location: 'PENANG', typeABC: '✓', typeCO2: '', brand: 'UF', serialNumber: 'UF 09 2023 Y 998315', month: '9', year: '2023', certExpiryDate: '01/12/2026', remarks: '' },
  { id: 'FE-ROW-24-22', rowNumber: 24, isHeader: false, no: '5', location: 'PENANG', typeABC: '✓', typeCO2: '', brand: 'UF', serialNumber: 'UF 09 2023 Y 998316', month: '9', year: '2023', certExpiryDate: '01/12/2026', remarks: '' },
  { id: 'FE-ROW-25-23', rowNumber: 25, isHeader: false, no: '6', location: 'PENANG', typeABC: '✓', typeCO2: '', brand: 'UF', serialNumber: 'UF 09 2023 Y 998317', month: '9', year: '2023', certExpiryDate: '01/12/2026', remarks: '' },
  { id: 'FE-ROW-26-24', rowNumber: 26, isHeader: false, no: '7', location: 'PENANG', typeABC: '✓', typeCO2: '', brand: 'UF', serialNumber: 'UF 09 2023 Y 998318', month: '9', year: '2023', certExpiryDate: '01/12/2026', remarks: '' },
  { id: 'FE-ROW-27-25', rowNumber: 27, isHeader: false, no: '8', location: 'PENANG', typeABC: '✓', typeCO2: '', brand: 'UF', serialNumber: 'UF 09 2023 Y 998319', month: '9', year: '2023', certExpiryDate: '01/12/2026', remarks: '' }
];

export async function fetchFireExtinguisherData(): Promise<FireExtinguisherRecord[]> {
  const SPREADSHEET_ID = '1o9P6GnlsAwSJEUYHxITt1Opz973uX37MLBiv0LdFdIs';
  const SHEET_NAME = 'FIRE EXTINGUISHER';
  const GID = '1996690139';
  const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(SHEET_NAME)}&gid=${GID}&range=B:K`;

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
              const sheetRowNumber = index + 1; // Range B:K starts at row 1
              
              // Skip completely empty rows
              if (!row || row.every((c: any) => !c || String(c).trim() === '')) {
                return;
              }

              const rowNo = (row[0] ?? '').toString().trim();
              const locationVal = (row[1] ?? '').toString().trim();
              const isHeader = (rowNo.toUpperCase() === 'NO' && locationVal.toUpperCase() === 'LOCATION') || (locationVal.toUpperCase() === 'LOCATION');

              records.push({
                id: `FE-ROW-${sheetRowNumber}-${index}`,
                rowNumber: sheetRowNumber,
                isHeader,
                no: rowNo,
                location: locationVal,
                typeABC: (row[2] ?? '').toString().trim(),
                typeCO2: (row[3] ?? '').toString().trim(),
                brand: (row[4] ?? '').toString().trim(),
                serialNumber: (row[5] ?? '').toString().trim(),
                month: (row[6] ?? '').toString().trim(),
                year: (row[7] ?? '').toString().trim(),
                certExpiryDate: (row[8] ?? '').toString().trim(),
                remarks: (row[9] ?? '').toString().trim(),
              });
            });
          }
          resolve(records.length > 0 ? records : FALLBACK_FIRE_EXTINGUISHER_RECORDS);
        },
        error: () => resolve(FALLBACK_FIRE_EXTINGUISHER_RECORDS)
      });
    });
  } catch (err) {
    console.warn(`Error fetching Fire Extinguisher data with GID: ${GID}`, err);
    return FALLBACK_FIRE_EXTINGUISHER_RECORDS;
  }
}


// 10. First Aid Certifications
export async function fetchFirstAidCertData(requireAuth: boolean = false): Promise<FirstAidCert[]> {
  const SPREADSHEET_ID = '1o9P6GnlsAwSJEUYHxITt1Opz973uX37MLBiv0LdFdIs';
  // Range AB5:AE fetches NAME, DEPARTMENT, CERT EXPIRED, CERT PDF starting from row 5 down dynamically
  const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=FIRST%20AID%20KIT%20INSPECTION&range=AB5:AE`;

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
            // Row 5 is header (NAME, DEPARTMENT, CERT EXPIRED, CERT PDF)
            const firstRow = results.data[0] as any;
            const isFirstRowHeader = Array.isArray(firstRow) && firstRow.some((c: any) => 
              String(c || '').toUpperCase().includes('NAME') || 
              String(c || '').toUpperCase().includes('DEPARTMENT') ||
              String(c || '').toUpperCase().includes('CERT')
            );
            const dataRows = isFirstRowHeader ? results.data.slice(1) : results.data;

            dataRows.forEach((row: any, index: number) => {
              // Range AB:AE -> Col 0: NAME, Col 1: DEPARTMENT, Col 2: CERT EXPIRED, Col 3: CERT PDF
              if (Array.isArray(row) && row.length >= 1 && row.some((c: any) => c && String(c).trim() !== '')) {
                const name = (row[0] || '').trim();
                if (name && name !== '-' && name.toUpperCase() !== 'NAME') {
                  certs.push({
                    id: `FA-${index + 1}`,
                    name,
                    department: (row[1] || '-').trim(),
                    expiryDate: (row[2] || '-').trim(),
                    certLink: (row[3] || '').trim()
                  });
                }
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

// 10b. First Aid Kit Register Table Data (Google Sheet range A4:Y22)
export async function fetchFirstAidKitRegisterData(): Promise<FirstAidKitTableData> {
  const SPREADSHEET_ID = '1o9P6GnlsAwSJEUYHxITt1Opz973uX37MLBiv0LdFdIs';
  const SHEET_NAME = 'FIRST AID KIT INSPECTION';
  const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(SHEET_NAME)}&range=A4:Y22`;

  const standardHeaders = [
    'NO', 'MODELS/PLACE', 'PLATE NO', 'LOCATION', 'CODE', 'LAST INSPECTION',
    '1) STERILE GAUZE PAD', '2) PLASTER LUKA', '3) WOW/ELASTIC BANDAGE', '4) PITA PELEKAT PERUBATAN',
    '5) KAPAS', '6) IODINE', '7) GUNTING/PISAU', '8) KAIN ANDUH/TRIANGULAR BANDAGE',
    '9) WOODEN SPLINT', '10) PIN', '11) SARUNG TANGAN', '12) MUSCLE CREAM',
    '13) ALCOHOL SWAB', '14) ANTISEPTIC CREAM', '15) PENGEPIT', '16) STERILE EYE PADS',
    '17) COLD PACK', 'NEXT INSPECTION', 'DESCRIPTION'
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
            const dataRows = results.data as string[][];
            const validRows = dataRows.filter(r => r && r.some(c => String(c || '').trim() !== ''));

            const rawObjects: Record<string, string>[] = validRows.map(r => {
              const obj: Record<string, string> = {};
              standardHeaders.forEach((h, i) => {
                obj[h || `Col_${i}`] = String(r[i] ?? '').trim();
              });
              return obj;
            });

            const parsedData: FirstAidKitTableData = {
              headers: standardHeaders,
              rows: validRows.map(r => r.map(c => String(c ?? '').trim())),
              rawRecords: rawObjects
            };

            try {
              localStorage.setItem('HSE_CACHED_KIT_REGISTER', JSON.stringify(parsedData));
            } catch {}

            resolve(parsedData);
          } else {
            resolve({ headers: standardHeaders, rows: [], rawRecords: [] });
          }
        },
        error: () => resolve({ headers: standardHeaders, rows: [], rawRecords: [] })
      });
    });
  } catch (err) {
    console.warn('Error fetching First Aid Kit Register from Google Sheet:', err);
    try {
      const cached = localStorage.getItem('HSE_CACHED_KIT_REGISTER');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && Array.isArray(parsed.rows) && parsed.rows.length > 0) {
          return parsed;
        }
      }
    } catch {}

    return {
      headers: standardHeaders,
      rows: [],
      rawRecords: []
    };
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

const DEFAULT_JKK_MEETING: JkkMeetingSummary = {
  date: '08/01/2027',
  meetingTitle: '14th JKK Meeting',
  location: 'IJOK',
  meetingNo: '14',
  totalMeetings: 14
};

let cachedJkkMeeting: JkkMeetingSummary = (() => {
  try {
    const val = localStorage.getItem('HSE_CACHED_JKK_MEETING');
    if (val) {
      return JSON.parse(val);
    }
  } catch {}
  return DEFAULT_JKK_MEETING;
})();

export function getCachedLatestJkkMeeting(): JkkMeetingSummary {
  return cachedJkkMeeting;
}

export async function fetchLatestJkkMeeting(): Promise<JkkMeetingSummary> {
  const SPREADSHEET_ID = '1o9P6GnlsAwSJEUYHxITt1Opz973uX37MLBiv0LdFdIs';
  // Query JKK MEETING sheet column D (and A:D)
  const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=JKK%20MEETING&range=A:D`;

  try {
    const res = await fetchWithTimeout(url, 3500);
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

              const summary: JkkMeetingSummary = {
                date: dateVal || '09/10/2026',
                meetingTitle: meetingTitle || 'Latest Minute Meeting',
                location: location || 'IJOK',
                meetingNo: meetingNo || String(validDateRows.length),
                totalMeetings: validDateRows.length
              };

              cachedJkkMeeting = summary;
              try {
                localStorage.setItem('HSE_CACHED_JKK_MEETING', JSON.stringify(summary));
              } catch {}

              resolve(summary);
              return;
            }
          }
          resolve(cachedJkkMeeting);
        },
        error: () => {
          resolve(cachedJkkMeeting);
        }
      });
    });
  } catch (err) {
    console.warn('Error fetching JKK Meeting data:', err);
    return cachedJkkMeeting;
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
                const meetingNo = row[0]?.trim() || `${index + 1}`;
                meetings.push({
                  id: `MM-${index + 1}-${meetingNo}`,
                  no: meetingNo,
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
  const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&gid=1423932800&range=B58:F86`;

  const fallbackHirarc = MOCK_HIRARCS.map((h, index) => ({
    id: h.code || `HIRARC-${index + 1}`,
    no: String(index + 1),
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
            results.data.forEach((row: any, index: number) => {
              if (row.length >= 4 && row[0]?.trim() !== '' && row[1]?.trim() !== '' && row[0] !== 'HIRARC') {
                const hirarcNo = row[0]?.trim() || `${index + 1}`;
                records.push({
                  id: `HIRARC-${index + 1}-${hirarcNo}`,
                  no: hirarcNo,
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
  const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&gid=1423932800&range=B24:F57`;

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

