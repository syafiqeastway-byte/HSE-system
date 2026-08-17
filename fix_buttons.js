import fs from 'fs';

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
    
    // Replace the title="ument" and the icon span with just text and proper padding.
    // We will find all anchor tags that look like this.
    
    // Pattern 1: Blue button (SOP, MinuteMeeting, IncidentCharts, AllIncidents)
    // Actually, let's just target title="ument" ... </a>
    // We can use a regex that matches `title="ument"` up to `</a>`
    
    // But let's be safer and more generic.
    content = content.replace(/title="ument"/g, '');
    
    // Remove the description icon
    content = content.replace(/<span className="material-symbols-outlined text-\[16px\]">description<\/span>\s*/g, 'Open Doc');
    
    // For padding, p-1.5 might be a bit tight for text, so let's change it back to px-2 py-1 or px-2.5 py-1
    content = content.replace(/p-1\.5 bg-blue/g, 'px-2 py-1 text-[11px] font-bold bg-blue');
    content = content.replace(/p-1\.5 bg-amber/g, 'px-2 py-1 text-[11px] font-bold bg-amber');
    content = content.replace(/p-1\.5 rounded-md bg-blue/g, 'px-2 py-1 text-[11px] font-bold rounded-md bg-blue');
    
    fs.writeFileSync(file, content);
});
