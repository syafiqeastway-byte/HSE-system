const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(/import { HIRARCPage } from '\.\/components\/HIRARCPage';/, "import { HIRARCPage } from './components/HIRARCPage';\nimport { SOPPage } from './components/SOPPage';");

code = code.replace(/onNavigateHIRARC=\{\(\) => setActivePage\('hirarcPage'\)\}/, "onNavigateHIRARC={() => setActivePage('hirarcPage')}\n              onNavigateSOP={() => setActivePage('sopPage')}");

const hirarcPage = `{activePage === 'hirarcPage' && (
            <HIRARCPage
              onBackToHome={() => setActivePage('homePage')}
            />
          )}`;

const sopPage = `{activePage === 'sopPage' && (
            <SOPPage
              onBackToHome={() => setActivePage('homePage')}
            />
          )}`;

code = code.replace(hirarcPage, `${hirarcPage}\n\n          ${sopPage}`);

fs.writeFileSync('src/App.tsx', code);
console.log('App.tsx patched for SOP');
