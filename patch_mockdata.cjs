const fs = require('fs');
let code = fs.readFileSync('src/data/mockData.ts', 'utf8');

code = code.replace(/export const MOCK_MINUTE_MEETINGS: MinuteMeeting\[\] = \[[\s\S]*?\];/g, `export const MOCK_MINUTE_MEETINGS: MinuteMeeting[] = [
  { id: '1', title: '1st Minute Meeting', location: 'IJOK', date: '06/10/2023', documentUrl: '' },
  { id: '2', title: '2nd Minute Meeting', location: 'ONLINE', date: '26/01/2024', documentUrl: '' },
];`);

fs.writeFileSync('src/data/mockData.ts', code);
