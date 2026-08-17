import {
  MOCK_INCIDENT_RECORDS,
  MOCK_DEMERIT_LOGS,
  MOCK_DEMERIT_MATRIX,
  MOCK_INSPECTION_RECORDS,
  MOCK_FIRST_AID_CERTS,
  MOCK_MINUTE_MEETINGS,
  INITIAL_DAYS_WITHOUT_INCIDENT
} from '../data/mockData';
import Papa from 'papaparse';
import { FirstAidCert, InspectionRecord, FireExtinguisherRecord } from '../types';

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
  const SPREADSHEET_ID = '1o9P6GnlsAwSJEUYHxITt1Opz973uX37MLBiv0LdFdIs';
  const GID = '582761149';
  const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&gid=${GID}&range=B3:I`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Network response was not ok');
    const csvText = await res.text();
    
    // Check if it returned general HTML instead of actual CSV data (e.g., error or sign-in walls)
    if (csvText.includes('<!DOCTYPE html>') || csvText.includes('google-signin-button')) {
      throw new Error('Returned HTML instead of CSV data');
    }

    const records: InspectionRecord[] = await new Promise((resolve) => {
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
                  id: `INSP-DYN-${index}-${sheetNo || index}`,
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
        error: () => {
          resolve([]);
        }
      });
    });

    if (records.length > 0) {
      return records;
    }
  } catch (err) {
    console.warn(`Error fetching inspection data with GID: ${GID}`, err);
  }

  // Fallback to callGasFunction or mock data
  return callGasFunction<InspectionRecord[]>('getInspectionData', MOCK_INSPECTION_RECORDS);
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
  const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=FIRST+AID+KIT+INSPECTION&range=AA6:AD12`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch from sheets');
    const csvText = await res.text();
    
    return new Promise((resolve) => {
      Papa.parse(csvText, {
        header: false,
        skipEmptyLines: true,
        complete: (results) => {
          const certs: FirstAidCert[] = [];
          if (results.data && results.data.length > 0) {
            results.data.forEach((row: any, index: number) => {
              if (row.length >= 4 && row[0]?.trim() !== '') {
                certs.push({
                  id: `FA-${index}`,
                  name: row[0],
                  department: row[1],
                  expiryDate: row[2],
                  certLink: row[3]
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


// 11. Live Incident Records
export async function fetchLiveIncidentRecords(requireAuth: boolean = false): Promise<any[]> {
  const SPREADSHEET_ID = '1o9P6GnlsAwSJEUYHxITt1Opz973uX37MLBiv0LdFdIs';
  const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&gid=88563672&range=A4:O`;

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
          resolve(records);
        },
        error: () => {
          resolve([]);
        }
      });
    });
  } catch (err) {
    console.warn('Error fetching HIRARC:', err);
    return [];
  }
}

export async function fetchDynamicSOP(): Promise<any[]> {
  const SPREADSHEET_ID = '1o9P6GnlsAwSJEUYHxITt1Opz973uX37MLBiv0LdFdIs';
  const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&gid=1423932800&range=B24:F54`;

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
          resolve(records);
        },
        error: () => {
          resolve([]);
        }
      });
    });
  } catch (err) {
    console.warn('Error fetching SOP:', err);
    return [];
  }
}

export async function fetchSafetyViolationSummaryTable(): Promise<string[][]> {
  const SPREADSHEET_ID = '1o9P6GnlsAwSJEUYHxITt1Opz973uX37MLBiv0LdFdIs';
  const GID = '817838002';
  const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&gid=${GID}&range=P3:T37`;

  const fallbackData: string[][] = [
    ["No", "Company / Subcontractor / Dept", "Total Violations", "Accumulated Demerit", "Action / Status"],
    ["1", "Subcon - Lin & Co", "3", "75", "High Risk - Final Warning"],
    ["2", "Subcon - Tan Weld", "2", "55", "Medium Risk - Written Warning"],
    ["3", "Subcon - Syarikat Jaya", "3", "55", "Medium Risk - Written Warning"],
    ["4", "Subcon - Elite Power", "2", "65", "High Risk - Suspension Review"],
    ["5", "Logistics Dept", "5", "85", "Under HSE Monitoring"],
    ["6", "Maintenance Dept", "3", "55", "Safety Audit Scheduled"],
    ["7", "Production Line 1", "2", "25", "Low Risk"],
    ["8", "Production Line 2", "2", "30", "Low Risk"],
    ["9", "Production Line 3", "1", "30", "Low Risk"],
    ["10", "Operations Dept", "1", "45", "Written Warning Issued"]
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
    console.warn('Error fetching Safety Violation Summary (P3:T37):', err);
    return fallbackData;
  }
}

// 14. Safety Violation Scoring System Fetcher
export async function fetchSafetyViolationScoring(): Promise<string[][]> {
  const SPREADSHEET_ID = '1o9P6GnlsAwSJEUYHxITt1Opz973uX37MLBiv0LdFdIs';
  const GID = '817838002';
  const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&gid=${GID}&range=A3:N33`;

  const fallbackData: string[][] = [
    [
      "No", "Date", "Worker Name / ID", "Department / Company", "Location", 
      "Violation Description", "Category", "First Offence", "Second Offence", 
      "Third Offence", "Demerit Points", "Action Taken / Fine (RM)", "Inspector Name", "Status"
    ],
    ["1", "2026-08-01", "Ahmad Razak (EE-104)", "Logistics Dept", "Warehouse A", "Not wearing safety helmet in designated zone", "PPE Non-Compliance", "Warning", "N/A", "N/A", "10", "RM 50 Fine", "M. Syahmi (SHO)", "Closed"],
    ["2", "2026-08-02", "Subcon - Lin & Co", "Electrical Subcontractor", "Block C Level 2", "Working at height without safety harness hook", "Height Safety", "N/A", "Suspension", "N/A", "30", "Stop Work Order", "M. Syahmi (SHO)", "Closed"],
    ["3", "2026-08-03", "Johnathan Doe (EE-089)", "Production Line 1", "Fabrication Area", "Using damaged grinding machine without guard", "Equipment Safety", "Warning", "N/A", "N/A", "15", "Machine Confiscated", "M. Syahmi (SHO)", "Closed"],
    ["4", "2026-08-04", "Kamaluddin (EE-212)", "Maintenance Dept", "Boiler Room", "Blocked fire extinguisher and exit pathway", "Fire Hazard", "Warning", "N/A", "N/A", "10", "Verbal Warning", "M. Syahmi (SHO)", "Closed"],
    ["5", "2026-08-05", "Tan Kah Seng (EE-115)", "Warehouse Operations", "Loading Bay 2", "Operating forklift above speed limit (15km/h)", "Vehicle Safety", "N/A", "Written Warning", "N/A", "20", "RM 100 Fine", "M. Syahmi (SHO)", "Closed"]
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
            const formatted: string[][] = results.data.map((row: any) => 
              Array.isArray(row) ? row.map(cell => String(cell || '').trim()) : []
            );
            resolve(formatted);
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

export async function fetchSummaryTablesFromGoogleSheet(): Promise<SummaryTablesMap> {
  const SPREADSHEET_ID = '1o9P6GnlsAwSJEUYHxITt1Opz973uX37MLBiv0LdFdIs';
  const GID = '88563672';
  const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&gid=${GID}&range=Q25:W102`;

  const fallbackTables: SummaryTablesMap = {
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

  try {
    const res = await fetch(url);
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

