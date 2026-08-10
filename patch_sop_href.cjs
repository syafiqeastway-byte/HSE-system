const fs = require('fs');
let code = fs.readFileSync('src/components/SOPPage.tsx', 'utf8');

code = code.replace(
  /href=\{r.documentUrl.startsWith\('http'\) \? r.documentUrl : '#'\}/, 
  "href={r.documentUrl.startsWith('http') ? r.documentUrl : '#'}"
);

fs.writeFileSync('src/components/SOPPage.tsx', code);
console.log('patched sop href');
