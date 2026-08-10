const fs = require('fs');
let code = fs.readFileSync('src/types.ts', 'utf8');

code = code.replace(/export type PageType = 'homePage' \| 'analyticsPage' \| 'documentViewPage' \| 'minuteMeetingPage' \| 'emergencyPlanPage';/, "export type PageType = 'homePage' | 'analyticsPage' | 'documentViewPage' | 'minuteMeetingPage' | 'emergencyPlanPage' | 'hirarcPage';");

fs.writeFileSync('src/types.ts', code);
