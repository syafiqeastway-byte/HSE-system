const fs = require('fs');
let code = fs.readFileSync('src/types.ts', 'utf8');

const typeDef = `
export interface HIRARCRecord {
  id: string;
  title: string;
  date: string;
  revDate: string;
  documentUrl: string;
}
`;

if (!code.includes('HIRARCRecord')) {
  code = code + typeDef;
  fs.writeFileSync('src/types.ts', code);
}
