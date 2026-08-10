const fs = require('fs');
let code = fs.readFileSync('src/utils/gasBridge.ts', 'utf8');

const replacement1 = `
// 10. First Aid Certifications
export async function fetchFirstAidCertData(requireAuth: boolean = false): Promise<FirstAidCert[]> {
  const SPREADSHEET_ID = '1o9P6GnlsAwSJEUYHxITt1Opz973uX37MLBiv0LdFdIs';
  const url = \`https://docs.google.com/spreadsheets/d/\${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=FIRST+AID+KIT+INSPECTION&range=AA6:AD12\`;

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
                  id: \`FA-\${index}\`,
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
`;

const replacement2 = `
// 11. Live Incident Records
export async function fetchLiveIncidentRecords(requireAuth: boolean = false): Promise<any[]> {
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
                  id: row[0],
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
}
`;

const startIndex1 = code.indexOf('// 10. First Aid Certifications');
const endIndex1 = code.indexOf('// 11. Live Incident Records');
const endIndex2 = code.indexOf('// 12. Minute Meetings');

if (startIndex1 !== -1 && endIndex1 !== -1 && endIndex2 !== -1) {
  let newCode = code.substring(0, startIndex1) + replacement1 + '\n' + replacement2 + '\n' + code.substring(endIndex2);
  
  // also remove let cachedAccessToken = '';
  newCode = newCode.replace(/let cachedAccessToken = '';\n/, '');
  
  fs.writeFileSync('src/utils/gasBridge.ts', newCode);
  console.log('patched successfully');
} else {
  console.log('could not find indexes');
}
