const fs = require('fs');
let code = fs.readFileSync('src/utils/gasBridge.ts', 'utf8');

const fetchFunc = `
export async function fetchDynamicSOP(): Promise<any[]> {
  const SPREADSHEET_ID = '1o9P6GnlsAwSJEUYHxITt1Opz973uX37MLBiv0LdFdIs';
  const url = \`https://docs.google.com/spreadsheets/d/\${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&gid=1423932800&range=B24:F54\`;

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
                  id: \`\${row[0]}-\${index}\`,
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
`;

if (!code.includes('fetchDynamicSOP')) {
  code = code + fetchFunc;
  fs.writeFileSync('src/utils/gasBridge.ts', code);
}
