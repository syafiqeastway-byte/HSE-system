const fs = require('fs');
let code = fs.readFileSync('src/types.ts', 'utf8');
code = code.replace(/export interface MinuteMeeting \{[\s\S]*?\}/, `export interface MinuteMeeting {
  id: string;
  title: string;
  location: string;
  date: string;
  documentUrl: string;
}`);
fs.writeFileSync('src/types.ts', code);
