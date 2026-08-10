import { createClient } from '@supabase/supabase-js';

const meta = import.meta as any;
const supabaseUrl = meta.env?.VITE_SUPABASE_URL || 'https://pbdnbxnzojlhntzdnsbh.supabase.co';
const supabaseAnonKey = meta.env?.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBiZG5ieG56b2psaG50emRuc2JoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYwODQ1MDMsImV4cCI6MjEwMTY2MDUwM30.z1PYELw5UI45QjHlc7Pf-PYy9uaH83QVU7UN5G_ja28';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

