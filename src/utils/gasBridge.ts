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
import { FirstAidCert } from '../types';

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
export function fetchInspectionData(): Promise<typeof MOCK_INSPECTION_RECORDS> {
  return callGasFunction<typeof MOCK_INSPECTION_RECORDS>('getInspectionData', MOCK_INSPECTION_RECORDS);
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
                  status: 'Closed' // Default status
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
