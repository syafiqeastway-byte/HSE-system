import fs from 'fs';

let content = fs.readFileSync('src/components/MinuteMeetingPage.tsx', 'utf8');

// The original button regex:
// <span className="material-symbols-outlined text-\[13px\]">open_in_new</span>
content = content.replace(/<span className="material-symbols-outlined text-\[13px\]">open_in_new<\/span>/g, 'Open Doc');

fs.writeFileSync('src/components/MinuteMeetingPage.tsx', content);
