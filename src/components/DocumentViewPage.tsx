import React, { useState } from 'react';
import { DocumentViewContext } from '../types';

interface DocumentViewPageProps {
  docContext: DocumentViewContext;
  onBack: () => void;
}

/**
 * Format Google Drive or Docs URLs to guarantee clean, full-frame embedded previewing
 */
function formatEmbedUrl(rawUrl: string): string {
  if (!rawUrl) return '';
  let url = rawUrl.trim();

  // If Google Drive File Link (e.g., https://drive.google.com/file/d/ID/view?usp=drive_link)
  if (url.includes('drive.google.com/file/d/')) {
    // Strip trailing query parameters like ?usp=drive_link or /view or /edit
    url = url.replace(/\/view(\?.*)?$/, '/preview');
    url = url.replace(/\/edit(\?.*)?$/, '/preview');
    if (!url.endsWith('/preview')) {
      url = url.split('?')[0];
      if (!url.endsWith('/preview')) {
        url = url + '/preview';
      }
    }
    return url;
  }

  // If Google Docs / Sheets Link (e.g., https://docs.google.com/document/d/ID/edit?usp=drive_link)
  if (url.includes('docs.google.com/document/d/')) {
    url = url.replace(/\/edit(\?.*)?$/, '/preview');
    if (!url.includes('/preview') && !url.includes('/pub')) {
      url = url.split('?')[0] + '/preview';
    }
    return url;
  }

  return url;
}

export const DocumentViewPage: React.FC<DocumentViewPageProps> = ({ docContext, onBack }) => {
  const [loading, setLoading] = useState(true);

  const formattedUrl = formatEmbedUrl(docContext.url);
  // Ensure preview URL is formatted for Google Drive
  const iframeUrl = formattedUrl;

  return (
    <div className="space-y-3">
      {/* Top Action Header Banner */}
      <div className="glass-card p-3 sm:p-4 flex items-center justify-between gap-3 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-zinc-900 text-slate-700 dark:text-zinc-200 hover:bg-slate-200 dark:hover:bg-zinc-800 font-semibold text-xs flex items-center gap-1.5 transition-all shadow-sm border border-transparent dark:border-zinc-800"
          >
            <span className="material-symbols-outlined text-lg">arrow_back</span>
            <span>Back</span>
          </button>
          
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-tight flex items-center gap-2">
              <span className="material-symbols-outlined text-blue-500 text-lg">description</span>
              <span>{docContext.title}</span>
            </h2>
            {docContext.subtitle && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {docContext.subtitle}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Iframe Frame Container with Full Height Loader */}
      <div className="glass-card relative w-full h-[88vh] min-h-[750px] overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl">
        
        {/* Full Height Skeleton Loader */}
        {loading && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm transition-opacity duration-300">
            <div className="relative flex items-center justify-center mb-4">
              <div className="w-16 h-16 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin"></div>
              <span className="material-symbols-outlined absolute text-2xl text-blue-600">article</span>
            </div>
            <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
              Memuatkan Preview Document Google Drive...
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Establishing secure connection frame with Google Drive
            </p>
          </div>
        )}

        <iframe
          src={iframeUrl}
          title={docContext.title}
          onLoad={() => setLoading(false)}
          className="w-full h-full border-0 rounded-2xl bg-white"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        ></iframe>
      </div>
    </div>
  );
};

