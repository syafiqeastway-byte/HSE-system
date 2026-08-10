const fs = require('fs');
let code = fs.readFileSync('src/components/HomePage.tsx', 'utf8');

// Remove p tag in section 2
code = code.replace(/<p className="text-xs text-slate-500 dark:text-slate-400">\s*Joint employer-employee safety committee & quarterly review minutes\s*<\/p>/, '');

// Remove p tag in section 3
code = code.replace(/<p className="text-xs text-slate-500 dark:text-slate-400">\s*Interactive English dropdowns for 30 SOPs, 25 HIRARCs, and Workplace Inspection Records\s*<\/p>/, '');

// Update the Inspection Form button
const oldButton = `<a
            href="https://script.google.com/macros/s/AKfycbx_INSPECTION_FORM_EE/exec"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs sm:text-sm flex items-center justify-between shadow-md shadow-blue-500/20 transition-all min-h-[44px] group"
          >
            <div className="flex items-center gap-2 truncate">
              <span className="material-symbols-outlined text-xl">edit_note</span>
              <span className="truncate">INSPECTION FORM (WEB APP)</span>
            </div>
            <span className="material-symbols-outlined text-lg group-hover:translate-x-1 transition-transform">
              open_in_new
            </span>
          </a>`;

const newButton = `<a
            href="https://script.google.com/macros/s/AKfycby-Bg4p7Z_1jUowq7PY7rKcaOR5Kx3uXxddB31jjflSBrCj6sJ6j4TwVTxEWLYmuVHX4w/exec"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full px-4 py-3.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100 font-semibold text-xs sm:text-sm flex items-center justify-between hover:border-amber-500 dark:hover:border-amber-400 transition-all shadow-sm group min-h-[44px]"
          >
            <div className="flex items-center gap-2 truncate">
              <span className="material-symbols-outlined text-amber-600 dark:text-amber-400 text-xl">edit_note</span>
              <span className="truncate">INSPECTION FORM</span>
            </div>
            <span className="material-symbols-outlined text-slate-400 group-hover:text-amber-500 group-hover:translate-x-1 transition-transform">
              open_in_new
            </span>
          </a>`;

code = code.replace(oldButton, newButton);

fs.writeFileSync('src/components/HomePage.tsx', code);
console.log('HomePage.tsx patched successfully');
