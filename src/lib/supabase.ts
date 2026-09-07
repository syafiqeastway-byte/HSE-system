import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Retrieve environment variables safely across Vite and Node process definitions
const getEnvVar = (key: string): string => {
  const meta = import.meta as any;
  if (meta.env && meta.env[key]) return meta.env[key];
  if (typeof process !== 'undefined' && process.env && process.env[key]) return process.env[key];
  return '';
};

export const SUPABASE_URL = 
  getEnvVar('VITE_SUPABASE_URL') || 
  getEnvVar('SUPABASE_URL') || 
  'https://pbdnbxnzojlhntzdnsbh.supabase.co';

export const SUPABASE_ANON_KEY = 
  getEnvVar('VITE_SUPABASE_ANON_KEY') || 
  getEnvVar('SUPABASE_ANON_KEY') || 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBiZG5ieG56b2psaG50emRuc2JoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYwODQ1MDMsImV4cCI6MjEwMTY2MDUwM30.z1PYELw5UI45QjHlc7Pf-PYy9uaH83QVU7UN5G_ja28';

export const isSupabaseConfigured = (): boolean => {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY && SUPABASE_URL !== 'https://your-project.supabase.co');
};

export const supabase: SupabaseClient = createClient(
  SUPABASE_URL || 'https://placeholder.supabase.co',
  SUPABASE_ANON_KEY || 'placeholder'
);


