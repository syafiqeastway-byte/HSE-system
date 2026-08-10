const fs = require('fs');
let code = fs.readFileSync('src/utils/gasBridge.ts', 'utf8');

const newFunc = `export async function fetchDaysWithoutIncident(): Promise<number> {
  const SPREADSHEET_ID = '1o9P6GnlsAwSJEUYHxITt1Opz973uX37MLBiv0LdFdIs';
  const url = \`https://docs.google.com/spreadsheets/d/\${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=HSE+FILE&range=I2:I2\`;
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
}`;

code = code.replace(/export function fetchDaysWithoutIncident\(\): Promise<number> \{\n\s*return callGasFunction<number>\('getDaysWithoutIncident', INITIAL_DAYS_WITHOUT_INCIDENT\);\n\}/, newFunc);

fs.writeFileSync('src/utils/gasBridge.ts', code);
console.log('patched fetchDaysWithoutIncident');
