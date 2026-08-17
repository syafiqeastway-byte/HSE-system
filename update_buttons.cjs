const fs = require('fs');

const filesToUpdate = [
    'src/components/SOPPage.tsx',
    'src/components/HIRARCPage.tsx',
    'src/components/MinuteMeetingPage.tsx',
    'src/components/IncidentChartsAndTables.tsx',
    'src/components/AllIncidentsPage.tsx',
    'src/components/AllIncidentRecordModal.tsx'
];

filesToUpdate.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    
    // Update solid blue button (SOP, MinuteMeeting)
    content = content.replace(
        /className="inline-flex items-center justify-center gap-1 px-2\.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-\[11px\] font-bold transition-colors shadow-sm shadow-blue-500\/20"\s*>\s*<span className="material-symbols-outlined text-\[13px\]">open_in_new<\/span>\s*Open Doc/g,
        `title="Open Document"\n                              className="inline-flex items-center justify-center p-1.5 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500/20 rounded-md transition-colors"\n                            >\n                              <span className="material-symbols-outlined text-[16px]">description</span>`
    );
    
    // Update solid amber button (HIRARC)
    content = content.replace(
        /className="inline-flex items-center justify-center gap-1 px-2\.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-md text-\[11px\] font-bold transition-colors shadow-sm shadow-amber-500\/20"\s*>\s*<span className="material-symbols-outlined text-\[13px\]">open_in_new<\/span>\s*Open Doc/g,
        `title="Open Document"\n                              className="inline-flex items-center justify-center p-1.5 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-500/20 rounded-md transition-colors"\n                            >\n                              <span className="material-symbols-outlined text-[16px]">description</span>`
    );
    
    // Update light blue button with gap-1 (IncidentChartsAndTables, AllIncidentsPage)
    content = content.replace(
        /className="inline-flex items-center justify-center px-2 py-1 rounded-md bg-blue-50 dark:bg-blue-500\/10 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500\/20 transition-colors text-\[11px\] font-bold gap-1"(?:[\s\S]*?)>\s*<span className="material-symbols-outlined text-\[13px\]">description<\/span>\s*<span>Open Doc<\/span>/g,
        (match) => {
            const hasOnClick = match.includes('onClick');
            return `title="Open Document"\n                            className="inline-flex items-center justify-center p-1.5 rounded-md bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors"${hasOnClick ? '\n                            onClick={(e) => e.stopPropagation()}' : ''}\n                          >\n                            <span className="material-symbols-outlined text-[16px]">description</span>`;
        }
    );
    
    // Update light blue button without gap-1 (AllIncidentRecordModal)
    content = content.replace(
        /className="inline-flex items-center justify-center px-2 py-1 rounded-md bg-blue-500\/10 text-blue-400 hover:bg-blue-500\/20 text-\[11px\] font-bold gap-1 transition-colors"\s*>\s*<span className="material-symbols-outlined text-\[13px\]">description<\/span>\s*<span>Open Doc<\/span>/g,
        `title="Open Document"\n                            className="inline-flex items-center justify-center p-1.5 rounded-md bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors"\n                          >\n                            <span className="material-symbols-outlined text-[16px]">description</span>`
    );

    fs.writeFileSync(file, content);
});
