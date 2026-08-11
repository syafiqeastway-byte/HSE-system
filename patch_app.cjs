const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Replace imports
code = code.replace(
  "import { AllIncidentRecordModal } from './components/AllIncidentRecordModal';",
  "import { AllIncidentsPage } from './components/AllIncidentsPage';"
);

// Add to the main switch
const allIncidentsPageRender = `
          {activePage === 'allIncidentsPage' && (
            <AllIncidentsPage
              onBackToHome={() => setActivePage('homePage')}
              isDarkMode={isDarkMode}
            />
          )}
`;

code = code.replace("</main>", allIncidentsPageRender + "</main>");

// Change references to setAllIncidentsModalOpen(true) to setActivePage('allIncidentsPage')
code = code.replace(/setAllIncidentsModalOpen\(true\)/g, "setActivePage('allIncidentsPage')");

// Remove the state and modal
code = code.replace(/const \[allIncidentsModalOpen, setAllIncidentsModalOpen\] = useState\(false\);\n/, "");
code = code.replace(/<AllIncidentRecordModal[^>]*>\s*<\/AllIncidentRecordModal>|<AllIncidentRecordModal[\s\S]*?\/>/g, "");

fs.writeFileSync('src/App.tsx', code);
console.log('patched App.tsx');
