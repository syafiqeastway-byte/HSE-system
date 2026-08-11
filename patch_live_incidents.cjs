const fs = require('fs');
let code = fs.readFileSync('src/utils/gasBridge.ts', 'utf8');

const oldFunc = `export async function fetchLiveIncidentRecords(requireAuth: boolean = false): Promise<any[]> {
  const SPREADSHEET_ID = '1o9P6GnlsAwSJEUYHxITt1Opz973uX37MLBiv0LdFdIs';
  const url = \`https://docs.google.com/spreadsheets/d/\${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&gid=88563672&range=A4:O60\`;
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
              if (row.length > 0 && row[0]?.trim() !== '') {
                records.push({
                  id: \`\${row[0]}-\${index}\`, // Ensure uniqueness
                  date: row[1] || '-',
                  location: row[3] || '-',
                  description: row[4] || '-',
                  classification: row[6] || '-',
                  category: row[9] || '-',
                  injuryType: row[10] || '-',
                  personInvolved: row[11] || '-',
                  experienceLevel: row[12] || '-',
                  investigator: row[13] || '-',
                  documentUrl: row[14] || '',
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
}`;

const newFunc = `export async function fetchLiveIncidentRecords(requireAuth: boolean = false): Promise<any[]> {
  const SPREADSHEET_ID = '1o9P6GnlsAwSJEUYHxITt1Opz973uX37MLBiv0LdFdIs';
  const url = \`https://docs.google.com/spreadsheets/d/\${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&gid=88563672&range=A4:O60\`;
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
            // First row (index 0) is the header, skip it.
            const dataRows = results.data.slice(1);
            dataRows.forEach((row: any) => {
              if (row.length > 0 && row[0]?.trim() !== '') {
                records.push({
                  id: row[0].trim(), // Load only the ID directly from the cell
                  date: row[1] || '-',
                  location: row[3] || '-',
                  description: row[4] || '-',
                  classification: row[6] || '-',
                  category: row[9] || '-',
                  injuryType: row[10] || '-',
                  personInvolved: row[11] || '-',
                  experienceLevel: row[12] || '-',
                  investigator: row[13] || '-',
                  documentUrl: row[14] || '',
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
}`;

code = code.replace(oldFunc, newFunc);
fs.writeFileSync('src/utils/gasBridge.ts', code);
console.log('Patched gasBridge.ts');
