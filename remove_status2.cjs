const fs = require('fs');

function removeStatusSearch(file) {
  let content = fs.readFileSync(file, 'utf-8');
  content = content.replace(/const status = inc\.status \|\| '';\n\s*/g, '');
  content = content.replace(/const status = item\.status \|\| '';\n\s*/g, '');
  content = content.replace(/status\.toLowerCase\(\)\.includes\(query\) \|\|\n\s*/g, '');
  content = content.replace(/\|\|\s*status\.toLowerCase\(\)\.includes\(query\)/g, '');
  fs.writeFileSync(file, content);
}

removeStatusSearch('src/components/AllIncidentsPage.tsx');
removeStatusSearch('src/components/AllIncidentRecordModal.tsx');
