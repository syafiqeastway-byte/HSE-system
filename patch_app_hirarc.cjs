const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Add import
code = code.replace(/import { MinuteMeetingPage } from '\.\/components\/MinuteMeetingPage';/, "import { MinuteMeetingPage } from './components/MinuteMeetingPage';\nimport { HIRARCPage } from './components/HIRARCPage';");

// Add to HomePage props
code = code.replace(/onNavigateMinuteMeetings=\{\(\) => setActivePage\('minuteMeetingPage'\)\}/, "onNavigateMinuteMeetings={() => setActivePage('minuteMeetingPage')}\n              onNavigateHIRARC={() => setActivePage('hirarcPage')}");

// Add to page switch
const mmPage = `{activePage === 'minuteMeetingPage' && (
            <MinuteMeetingPage
              onOpenDocument={handleOpenDocument}
              onBackToHome={() => setActivePage('homePage')}
            />
          )}`;

const hirarcPage = `{activePage === 'hirarcPage' && (
            <HIRARCPage
              onBackToHome={() => setActivePage('homePage')}
            />
          )}`;

code = code.replace(mmPage, `${mmPage}\n\n          ${hirarcPage}`);

fs.writeFileSync('src/App.tsx', code);
console.log('App.tsx patched for HIRARC');
