const fs = require('fs');
let code = fs.readFileSync('src/components/HIRARCPage.tsx', 'utf8');

code = code.replace(/href=\{r.documentUrl.startsWith\('http'\) \? r.documentUrl : '#'\}/, "href={r.documentUrl}");
code = code.replace(/target=\{r.documentUrl.startsWith\('http'\) \? "_blank" : "_self"\}/, 'target="_blank"');

fs.writeFileSync('src/components/HIRARCPage.tsx', code);
console.log('patched href');
