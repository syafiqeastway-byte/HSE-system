const fs = require('fs');
let code = fs.readFileSync('src/components/HomePage.tsx', 'utf8');

code = code.replace(/import { SOPDropdown } from '\.\/SOPDropdown';/, '');
code = code.replace(/onNavigateHIRARC: \(\) => void;/, "onNavigateHIRARC: () => void;\n  onNavigateSOP: () => void;");
code = code.replace(/onNavigateHIRARC,/, "onNavigateHIRARC,\n  onNavigateSOP,");

const oldSop = `<SOPDropdown onSelectSOP={onOpenDocument} />`;
const newSop = `<button
            onClick={onNavigateSOP}
            className="w-full px-4 py-3.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100 font-semibold text-xs sm:text-sm flex items-center justify-between hover:border-blue-500 dark:hover:border-blue-400 transition-all shadow-sm group min-h-[44px]"
          >
            <div className="flex items-center gap-2 truncate">
              <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 text-xl">description</span>
              <span className="truncate">Standard Operating Procedures (SOP)</span>
            </div>
            <span className="material-symbols-outlined text-slate-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-transform">
              arrow_forward
            </span>
          </button>`;

code = code.replace(oldSop, newSop);

fs.writeFileSync('src/components/HomePage.tsx', code);
console.log('HomePage.tsx patched successfully for SOP');
