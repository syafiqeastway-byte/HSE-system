const fs = require('fs');

let content = fs.readFileSync('src/data/mockData.ts', 'utf-8');
content = content.replace(/status: 'Closed',\n\s*/g, '');
fs.writeFileSync('src/data/mockData.ts', content);
