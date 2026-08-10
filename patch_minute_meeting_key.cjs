const fs = require('fs');
let code = fs.readFileSync('src/utils/gasBridge.ts', 'utf8');

// For minute meetings
code = code.replace(/results\.data\.forEach\(\(row: any\) => \{\n\s*if \(row\.length >= 4 && row\[0\]\?\.trim\(\) !== ''\) \{\n\s*meetings\.push\(\{\n\s*id: row\[0\],/, `results.data.forEach((row: any, index: number) => {
              if (row.length >= 4 && row[0]?.trim() !== '' && row[1]?.trim() !== '') {
                meetings.push({
                  id: \`\${row[0]}-\${index}\`,`);

fs.writeFileSync('src/utils/gasBridge.ts', code);
console.log('minute meeting patched');
