const fs = require('fs');

// Patch gasBridge.ts
let code = fs.readFileSync('src/utils/gasBridge.ts', 'utf8');

code = code.replace(/results\.data\.forEach\(\(row: any\) => \{/, "results.data.forEach((row: any, index: number) => {");
code = code.replace(/if \(row\.length >= 4 && row\[0\]\?\.trim\(\) !== '' && row\[0\] !== 'HIRARC'\) \{/, "if (row.length >= 4 && row[0]?.trim() !== '' && row[1]?.trim() !== '' && row[0] !== 'HIRARC') {");
code = code.replace(/id: row\[0\],/, "id: `${row[0]}-${index}`, // Ensure uniqueness");

fs.writeFileSync('src/utils/gasBridge.ts', code);
console.log('gasBridge patched');

// Patch App.tsx MinuteMeeting & HIRARCPage rendering
// It's just a safeguard, wait, it's the key in the mapping, which is r.id.
// By changing gasBridge, r.id is now unique!
