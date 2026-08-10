import React, { useState } from 'react';
import { generateGasIndexHtml } from '../utils/generateGasHtml';

interface ExportGasModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExportGasModal: React.FC<ExportGasModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const htmlCode = generateGasIndexHtml();

  const handleCopy = () => {
    navigator.clipboard.writeText(htmlCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([htmlCode], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Index.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="glass-card max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-blue-500/30">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-blue-50/50 dark:bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/30">
              <span className="material-symbols-outlined text-2xl">code</span>
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
                GOOGLE APPS SCRIPT INDEX.HTML EXPORTER
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                100% Standalone Single-File Google Apps Script Web App Template
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
          >
            <span className="material-symbols-outlined text-2xl">close</span>
          </button>
        </div>

        {/* Code Content Box */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-slate-950 text-slate-200 font-mono text-xs">
          <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-800 text-[11px] text-slate-400">
            <span>File Target: Index.html (Google Apps Script IDE)</span>
            <span>Includes HTML, CSS, Chart.js, Weather API & google.script.run</span>
          </div>
          <pre className="overflow-x-auto p-4 rounded-xl bg-slate-900 border border-slate-800 leading-relaxed max-h-[50vh] selection:bg-blue-500 selection:text-white">
            {htmlCode}
          </pre>
        </div>

        {/* Actions Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/80 flex items-center justify-between gap-3">
          <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
            Copy code and paste into <code>Index.html</code> in Google Apps Script editor.
          </p>
          
          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              onClick={handleDownload}
              className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-semibold text-xs hover:bg-slate-100 dark:hover:bg-slate-700 transition-all flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-base">download</span>
              <span>Download Index.html</span>
            </button>

            <button
              onClick={handleCopy}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/30 transition-all flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-base">
                {copied ? 'check_circle' : 'content_copy'}
              </span>
              <span>{copied ? 'Copied to Clipboard!' : 'Copy Code'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
