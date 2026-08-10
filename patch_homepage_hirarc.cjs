const fs = require('fs');
let code = fs.readFileSync('src/components/HomePage.tsx', 'utf8');

// Replace HIRARCDropdown with the button
code = code.replace(/import { HIRARCDropdown } from '\.\/HIRARCDropdown';/, '');
code = code.replace(/onNavigateMinuteMeetings: \(\) => void;/, "onNavigateMinuteMeetings: () => void;\n  onNavigateHIRARC: () => void;");
code = code.replace(/onNavigateMinuteMeetings,/, "onNavigateMinuteMeetings,\n  onNavigateHIRARC,");

const oldHirarc = `<HIRARCDropdown onSelectHIRARC={onOpenDocument} />`;
const newHirarc = `<button
            onClick={onNavigateHIRARC}
            className="w-full px-4 py-3.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100 font-semibold text-xs sm:text-sm flex items-center justify-between hover:border-amber-500 dark:hover:border-amber-400 transition-all shadow-sm group min-h-[44px]"
          >
            <div className="flex items-center gap-2 truncate">
              <span className="material-symbols-outlined text-amber-600 dark:text-amber-400 text-xl">assignment_turned_in</span>
              <span className="truncate">HIRARC</span>
            </div>
            <span className="material-symbols-outlined text-slate-400 group-hover:text-amber-500 group-hover:translate-x-1 transition-transform">
              arrow_forward
            </span>
          </button>`;

code = code.replace(oldHirarc, newHirarc);

fs.writeFileSync('src/components/HomePage.tsx', code);
console.log('HomePage.tsx patched successfully for HIRARC');
