const fs = require('fs');
let code = fs.readFileSync('src/components/AllIncidentsPage.tsx', 'utf8');

// Remove status filter state
code = code.replace(/const \[statusFilter, setStatusFilter\] = useState<string>\('All'\);\n/, '');

// Remove status matching logic
code = code.replace(/const matchesStatus = statusFilter === 'All' \|\| inc.status === statusFilter;\n\s*return matchesSearch && matchesStatus;/g, 'return matchesSearch;');

// Remove the select element for status filter
const selectRegex = /<div className="w-full sm:w-auto">\s*<select[\s\S]*?<\/select>\s*<\/div>/g;
code = code.replace(selectRegex, '');

// Remove Status and Action headers
code = code.replace(/<th className="py-4 px-4 text-center">Status<\/th>\s*<th className="py-4 px-4 text-center">Action<\/th>/g, '<th className="py-4 px-4 text-center">Document</th>');

// Remove Status and Action cells, replace Action with Document cell
const tdRegex = /<td className="py-3 px-4 text-center whitespace-nowrap">\s*<span className={`inline-flex items-center justify-center px-2\.5 py-1 rounded-full text-\[10px\] font-extrabold uppercase tracking-wider[^>]*>\s*\{inc\.status \|\| 'Closed'\}\s*<\/span>\s*<\/td>\s*<td className="py-3 px-4 text-center whitespace-nowrap">\s*\{\(inc as any\)\.documentUrl && \(inc as any\)\.documentUrl !== '-' && \(inc as any\)\.documentUrl !== '' \? \(\s*<a href=\{\(inc as any\)\.documentUrl\} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center p-1\.5 rounded-lg bg-blue-50 dark:bg-blue-500\/10 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500\/20 transition-colors">\s*<span className="material-symbols-outlined text-\[18px\]">visibility<\/span>\s*<\/a>\s*\) : \(\s*<span className="text-slate-300 dark:text-slate-600">-<\/span>\s*\)\}\s*<\/td>/g;

const newTd = `<td className="py-3 px-4 text-center whitespace-nowrap">
                         {(inc as any).documentUrl && (inc as any).documentUrl !== '-' && (inc as any).documentUrl !== '' ? (
                           <a href={(inc as any).documentUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors text-xs font-bold gap-1.5">
                             <span className="material-symbols-outlined text-[16px]">description</span>
                             <span>Open Doc</span>
                           </a>
                         ) : (
                           <span className="text-slate-300 dark:text-slate-600">-</span>
                         )}
                      </td>`;

code = code.replace(tdRegex, newTd);

fs.writeFileSync('src/components/AllIncidentsPage.tsx', code);
console.log('patched');
