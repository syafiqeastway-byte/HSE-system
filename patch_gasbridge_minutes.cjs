const fs = require('fs');
let code = fs.readFileSync('src/utils/gasBridge.ts', 'utf8');

const fetchFunc = `export async function fetchDynamicMinuteMeetings(): Promise<any[]> {
  const SPREADSHEET_ID = '1o9P6GnlsAwSJEUYHxITt1Opz973uX37MLBiv0LdFdIs';
  const url = \`https://docs.google.com/spreadsheets/d/\${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&gid=1985060946&range=A4:E\`;

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
            results.data.forEach((row: any) => {
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
}`;

code = code.replace(/export function fetchDynamicMinuteMeetings\(\): Promise<typeof MOCK_MINUTE_MEETINGS> \{[\s\S]*?\}/, fetchFunc);

fs.writeFileSync('src/utils/gasBridge.ts', code);
