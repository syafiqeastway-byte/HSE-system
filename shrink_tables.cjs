const fs = require('fs');

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  
  // Replace table padding
  content = content.replace(/className="py-3 px-3 /g, 'className="py-1.5 px-2 sm:py-3 sm:px-3 ');
  
  // Replace text size on table wrapper
  content = content.replace(/<table className="([^"]*)text-xs([^"]*)"/g, '<table className="$1text-[10px] sm:text-xs$2"');

  // Replace text size on th
  content = content.replace(/text-\[10px\]/g, 'text-[9px] sm:text-[10px]');
  
  fs.writeFileSync(filePath, content);
  console.log(`Processed ${filePath}`);
}

processFile('src/components/IncidentChartsAndTables.tsx');
processFile('src/components/AllIncidentsPage.tsx');
