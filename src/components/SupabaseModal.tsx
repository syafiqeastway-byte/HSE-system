import React, { useState, useEffect } from 'react';
import { checkSupabaseConnection, SupabaseStatus } from '../utils/supabaseService';

interface SupabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupabaseModal: React.FC<SupabaseModalProps> = ({ isOpen, onClose }) => {
  const [status, setStatus] = useState<SupabaseStatus>({
    connected: false,
    url: 'https://pbdnbxnzojlhntzdnsbh.supabase.co',
    message: 'Testing connection...'
  });
  const [testing, setTesting] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  const supabaseUrl = 'https://pbdnbxnzojlhntzdnsbh.supabase.co';
  const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBiZG5ieG56b2psaG50emRuc2JoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYwODQ1MDMsImV4cCI6MjEwMTY2MDUwM30.z1PYELw5UI45QjHlc7Pf-PYy9uaH83QVU7UN5G_ja28';

  const testConnection = async () => {
    setTesting(true);
    const res = await checkSupabaseConnection();
    setStatus(res);
    setTesting(false);
  };

  useEffect(() => {
    if (isOpen) {
      testConnection();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const sqlSchema = `-- Supabase Table Schemas for Eastway Engineering MYSAFETY Dashboard

-- 1. Incidents Table
CREATE TABLE IF NOT EXISTS incidents (
  id TEXT PRIMARY KEY,
  date DATE NOT NULL,
  location TEXT NOT NULL,
  category TEXT NOT NULL,
  classification TEXT NOT NULL,
  injury_type TEXT,
  experience_level TEXT,
  root_cause TEXT,
  corrective_action TEXT,
  status TEXT DEFAULT 'Closed'
);

-- 2. Inspections Table
CREATE TABLE IF NOT EXISTS inspections (
  id TEXT PRIMARY KEY,
  date DATE NOT NULL,
  type TEXT NOT NULL,
  location_facility TEXT NOT NULL,
  inspector_name TEXT NOT NULL,
  total_checked INT DEFAULT 10,
  compliant_count INT DEFAULT 10,
  compliance_rate TEXT DEFAULT '100%',
  status TEXT DEFAULT 'Passed'
);

-- 3. First Aid Certifications
CREATE TABLE IF NOT EXISTS first_aid_certs (
  id TEXT PRIMARY KEY,
  staff_id TEXT NOT NULL,
  name TEXT NOT NULL,
  department TEXT NOT NULL,
  cert_level TEXT NOT NULL,
  issuer TEXT NOT NULL,
  issue_date DATE,
  expiry_date DATE,
  status TEXT DEFAULT 'Valid'
);

-- Enable RLS & Read Policies
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access" ON incidents FOR SELECT USING (true);
`;

  const copyToClipboard = (text: string, setCopiedFn: (val: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setCopiedFn(true);
    setTimeout(() => setCopiedFn(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="glass-card max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-emerald-500/30">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-emerald-50/50 dark:bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-500/30">
              <span className="material-symbols-outlined text-2xl">database</span>
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
                SUPABASE DASHBOARD INTEGRATION
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Connected Project & Real-Time Sync Status
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

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          
          {/* Connection Banner */}
          <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${status.connected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  {status.connected ? 'Supabase Project Active' : 'Supabase Connecting'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {status.message}
              </p>
            </div>

            <button
              onClick={testConnection}
              disabled={testing}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-emerald-600/20"
            >
              <span className={`material-symbols-outlined text-base ${testing ? 'animate-spin' : ''}`}>
                sync
              </span>
              <span>{testing ? 'Testing...' : 'Test Connection'}</span>
            </button>
          </div>

          {/* Project URL & Key Details */}
          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                Supabase Project URL
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={supabaseUrl}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 font-mono text-xs text-emerald-400 focus:outline-none"
                />
                <a
                  href={supabaseUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs flex items-center gap-1 hover:bg-blue-700 transition-all flex-shrink-0"
                >
                  <span className="material-symbols-outlined text-base">open_in_new</span>
                  <span>Open Supabase</span>
                </a>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                Project Anon API Key
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={anonKey}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 font-mono text-[11px] text-slate-400 focus:outline-none truncate"
                />
                <button
                  onClick={() => copyToClipboard(supabaseUrl, setCopiedUrl)}
                  className="px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-xs hover:bg-slate-100 dark:hover:bg-slate-700 transition-all flex-shrink-0 flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-base">
                    {copiedUrl ? 'check_circle' : 'content_copy'}
                  </span>
                  <span>{copiedUrl ? 'Copied Link!' : 'Copy URL'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* SQL Setup Code Snippet */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                SQL Schema Setup for Supabase SQL Editor
              </label>
              <button
                onClick={() => copyToClipboard(sqlSchema, setCopiedSql)}
                className="text-xs text-emerald-600 dark:text-emerald-400 font-bold hover:underline flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-sm">
                  {copiedSql ? 'check' : 'content_copy'}
                </span>
                <span>{copiedSql ? 'SQL Copied!' : 'Copy SQL Script'}</span>
              </button>
            </div>
            <pre className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 font-mono text-[11px] overflow-x-auto max-h-48 leading-relaxed">
              {sqlSchema}
            </pre>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/80 flex items-center justify-between">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Project Ref: <code className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">pbdnbxnzojlhntzdnsbh</code>
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-700 text-white font-bold text-xs hover:bg-slate-800 transition-colors"
          >
            Close Window
          </button>
        </div>

      </div>
    </div>
  );
};
