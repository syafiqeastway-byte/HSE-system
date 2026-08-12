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
import { FirstAidCert, InspectionRecord } from '../types';

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

  // Provide high-quality fallback data matching 14 columns (A to N) and 31 rows (Row 3 header + 30 rows data)
  const fallbackData: string[][] = [
    // Header (Row 3)
    [
      "No", "Date", "Worker Name / ID", "Department / Company", "Location", 
      "Violation Description", "Category", "First Offence", "Second Offence", 
      "Third Offence", "Demerit Points", "Action Taken / Fine (RM)", "Inspector Name", "Status"
    ],
    // Rows 4 to 33 (30 rows of realistic HSE safety violations)
    ["1", "2026-08-01", "Ahmad Razak (EE-104)", "Logistics Dept", "Warehouse A", "Not wearing safety helmet in designated zone", "PPE Non-Compliance", "Warning", "N/A", "N/A", "10", "RM 50 Fine", "M. Syahmi (SHO)", "Closed"],
    ["2", "2026-08-02", "Subcon - Lin & Co", "Electrical Subcontractor", "Block C Level 2", "Working at height without safety harness hook", "Height Safety", "N/A", "Suspension", "N/A", "30", "Stop Work Order", "M. Syahmi (SHO)", "Closed"],
    ["3", "2026-08-03", "Johnathan Doe (EE-089)", "Production Line 1", "Fabrication Area", "Using damaged grinding machine without guard", "Equipment Safety", "Warning", "N/A", "N/A", "15", "Machine Confiscated", "M. Syahmi (SHO)", "Closed"],
    ["4", "2026-08-04", "Kamaluddin (EE-212)", "Maintenance Dept", "Boiler Room", "Blocked fire extinguisher and exit pathway", "Fire Hazard", "Warning", "N/A", "N/A", "10", "Verbal Warning", "M. Syahmi (SHO)", "Closed"],
    ["5", "2026-08-05", "Tan Kah Seng (EE-115)", "Warehouse Operations", "Loading Bay 2", "Operating forklift above speed limit (15km/h)", "Vehicle Safety", "N/A", "Written Warning", "N/A", "20", "RM 100 Fine", "M. Syahmi (SHO)", "Closed"],
    ["6", "2026-08-05", "Subcon - Syarikat Jaya", "Civil Subcontractor", "Drainage Site B", "Failure to provide safety barriers around excavation", "Excavation", "Written Warning", "N/A", "N/A", "25", "RM 200 Subcon Fine", "M. Syahmi (SHO)", "Closed"],
    ["7", "2026-08-06", "S. Vijay (EE-311)", "Painting Dept", "Spray Booth 1", "Not wearing chemical respirator while painting", "PPE Non-Compliance", "Warning", "N/A", "N/A", "10", "Verbal Warning", "M. Syahmi (SHO)", "Closed"],
    ["8", "2026-08-07", "Subcon - Tan Weld", "Mechanical Subcontractor", "Assembly Yard", "Hot work conducted without valid Hot Work Permit", "Permit to Work", "N/A", "N/A", "Stop Work", "40", "Stop Work & RM 500 Fine", "M. Syahmi (SHO)", "Closed"],
    ["9", "2026-08-08", "Zulkifli (EE-145)", "Store Management", "Chemical Store", "Poor housekeeping, chemical spill not cleaned", "Housekeeping", "Warning", "N/A", "N/A", "10", "Clean-up directive", "M. Syahmi (SHO)", "Closed"],
    ["10", "2026-08-09", "Muhammad Ali (EE-220)", "Production Line 3", "Machining Area", "Bypassing safety interlock door of CNC machine", "Machine Guarding", "N/A", "Suspension 3 days", "N/A", "30", "Suspension Order", "M. Syahmi (SHO)", "Closed"],
    ["11", "2026-08-10", "Subcon - Elite Power", "Electrical Subcontractor", "Main Switchboard Room", "No LOTO (Lockout/Tagout) applied during repair", "Electrical Safety", "N/A", "Written Warning", "N/A", "35", "LOTO enforcement instruction", "M. Syahmi (SHO)", "Closed"],
    ["12", "2026-08-10", "R. Ramasamy (EE-043)", "Logistics Dept", "Warehouse B", "Smoking in non-designated high risk storage area", "Fire Hazard", "N/A", "RM 150 Fine", "N/A", "25", "RM 150 Fine & Warning", "M. Syahmi (SHO)", "Closed"],
    ["13", "2026-08-11", "Michael Wong (EE-188)", "Quality Control", "Testing Lab 2", "Disposing chemical solvent into municipal drain", "Environmental", "N/A", "Written Warning", "N/A", "30", "Environmental training req.", "M. Syahmi (SHO)", "Open"],
    ["14", "2026-08-11", "Subcon - Lin & Co", "Electrical Subcontractor", "Generator Room", "Using non-certified electrical power tools", "Electrical Safety", "Warning", "N/A", "N/A", "15", "Tool Confiscated", "M. Syahmi (SHO)", "Open"],
    ["15", "2026-08-11", "Azlan Shah (EE-205)", "Production Line 2", "Mixing Yard", "Failure to report minor spill immediately", "Incident Reporting", "Warning", "N/A", "N/A", "10", "Verbal Warning", "M. Syahmi (SHO)", "Closed"],
    ["16", "2026-08-11", "Chong Wei (EE-072)", "Maintenance Dept", "Roof Area", "Working on roof without anchor point line setup", "Height Safety", "N/A", "Written Warning", "N/A", "25", "Harness installation instruction", "M. Syahmi (SHO)", "Open"],
    ["17", "2026-08-11", "Subcon - Syarikat Jaya", "Civil Subcontractor", "Gate 3 Entrance", "Obstructing emergency fire hydrant with soil pile", "Fire Hazard", "Warning", "N/A", "N/A", "15", "Removal order issued", "M. Syahmi (SHO)", "Closed"],
    ["18", "2026-08-11", "G. Naidu (EE-119)", "Logistics Dept", "Loading Dock 1", "Not wearing steel toe safety shoes in dock area", "PPE Non-Compliance", "Warning", "N/A", "N/A", "10", "Verbal Warning", "M. Syahmi (SHO)", "Closed"],
    ["19", "2026-08-11", "Subcon - Tan Weld", "Mechanical Subcontractor", "Welding Bay C", "Lack of proper ventilation during heavy arc welding", "Industrial Hygiene", "Warning", "N/A", "N/A", "15", "Ventilation fan deployed", "M. Syahmi (SHO)", "Closed"],
    ["20", "2026-08-11", "Mustafa (EE-302)", "Security Dept", "Front Gate Control", "Sleeping while on safety surveillance shift duty", "Safety Conduct", "N/A", "Written Warning", "N/A", "20", "Disciplinary hearing", "M. Syahmi (SHO)", "Closed"],
    ["21", "2026-08-11", "Lim Kok Wing (EE-091)", "Production Line 1", "Packaging Area", "Stacking pallets dangerously high above yellow line", "Housekeeping", "Warning", "N/A", "N/A", "10", "Re-stack directive", "M. Syahmi (SHO)", "Closed"],
    ["22", "2026-08-11", "Subcon - Elite Power", "Electrical Subcontractor", "Utility Building", "Leaving energized electrical panels open & unattended", "Electrical Safety", "N/A", "Written Warning", "N/A", "30", "Secure panel order", "M. Syahmi (SHO)", "Closed"],
    ["23", "2026-08-11", "Steven Cole (EE-401)", "Operations Dept", "Silo Area", "Entering confined space without oxygen gas testing", "Confined Space", "N/A", "Suspension 5 days", "N/A", "45", "Immediate suspension & fine", "M. Syahmi (SHO)", "Open"],
    ["24", "2026-08-11", "Faris (EE-289)", "Maintenance Dept", "Compressor Room", "Overriding air compressor pressure limit safety valve", "Pressure Vessel", "N/A", "Written Warning", "N/A", "25", "Reset safety valve order", "M. Syahmi (SHO)", "Closed"],
    ["25", "2026-08-11", "Subcon - Lin & Co", "Electrical Subcontractor", "Office Annex", "Using daisy-chained extension leads for high load", "Electrical Safety", "Warning", "N/A", "N/A", "10", "Leads confiscated", "M. Syahmi (SHO)", "Closed"],
    ["26", "2026-08-11", "S. Selvam (EE-341)", "Logistics Dept", "Scrap Yard", "Lifting steel plates without certified crane rigger", "Rigging/Lifting", "N/A", "Written Warning", "N/A", "25", "Stop lift & training req.", "M. Syahmi (SHO)", "Closed"],
    ["27", "2026-08-11", "Amiruddin (EE-099)", "Production Line 2", "Conveyor Yard", "Riding on active assembly conveyor line for fun", "Safety Conduct", "N/A", "Written Warning", "N/A", "20", "Warning letter issued", "M. Syahmi (SHO)", "Closed"],
    ["28", "2026-08-11", "Subcon - Syarikat Jaya", "Civil Subcontractor", "Piling Area", "Failure to deploy ear protection in high noise zone", "PPE Non-Compliance", "Warning", "N/A", "N/A", "10", "Ear plugs distributed", "M. Syahmi (SHO)", "Closed"],
    ["29", "2026-08-11", "Yeoh Boon Hean (EE-137)", "Quality Control", "Chemical Lab 1", "Eating/drinking inside chemical analysis laboratory", "Hygiene Safety", "Warning", "N/A", "N/A", "10", "Verbal Warning", "M. Syahmi (SHO)", "Closed"],
    ["30", "2026-08-11", "Rahmat (EE-164)", "Logistics Dept", "Warehouse C", "Using mobile phone while driving warehouse forklift", "Vehicle Safety", "N/A", "Written Warning", "N/A", "20", "RM 100 Fine", "M. Syahmi (SHO)", "Closed"]
  ];

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch from sheets');
    const csvText = await res.text();
    
    // Check if it returned general HTML instead of actual CSV data (e.g., error or sign-in walls)
    if (csvText.includes('<!DOCTYPE html>') || csvText.includes('google-signin-button')) {
      throw new Error('Returned HTML instead of CSV data');
    }

    return new Promise((resolve) => {
      Papa.parse(csvText, {
        header: false,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.data && results.data.length > 0) {
            // Standardize output to array of string arrays
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
