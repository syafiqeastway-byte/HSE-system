const fs = require('fs');
let code = fs.readFileSync('src/types.ts', 'utf8');

const typeDef = `
export interface SOPRecord {
  id: string;
  title: string;
  date: string;
  revDate: string;
  documentUrl: string;
}
`;

if (!code.includes('SOPRecord')) {
  code = code + typeDef;
}

code = code.replace(/export type PageType = 'homePage' \| 'analyticsPage' \| 'documentViewPage' \| 'minuteMeetingPage' \| 'emergencyPlanPage' \| 'hirarcPage';/, "export type PageType = 'homePage' | 'analyticsPage' | 'documentViewPage' | 'minuteMeetingPage' | 'emergencyPlanPage' | 'hirarcPage' | 'sopPage';");

fs.writeFileSync('src/types.ts', code);
