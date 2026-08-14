const fs = require('fs');

// 1. Remove from gasBridge.ts
let gasBridge = fs.readFileSync('src/utils/gasBridge.ts', 'utf-8');
gasBridge = gasBridge.replace(/status: 'Closed' \/\/ Default status/g, '');
fs.writeFileSync('src/utils/gasBridge.ts', gasBridge);

// 2. Remove from AllIncidentRecordModal.tsx
let modal = fs.readFileSync('src/components/AllIncidentRecordModal.tsx', 'utf-8');
modal = modal.replace(/const \[statusFilter, setStatusFilter\] = useState<string>\('All'\);\n/g, '');
modal = modal.replace(/const matchesStatus =\n\s+statusFilter === 'All' \? true : item.status\?\.toLowerCase\(\) === statusFilter.toLowerCase\(\);\n\s+if \(\!matchesStatus\) return false;\n/g, '');
modal = modal.replace(/<select[\s\S]*?<\/select>/, ''); // Removes the select block
fs.writeFileSync('src/components/AllIncidentRecordModal.tsx', modal);

