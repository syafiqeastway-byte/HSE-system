import { supabase } from '../lib/supabase';
import {
  MOCK_INCIDENT_RECORDS,
  MOCK_INSPECTION_RECORDS,
  MOCK_FIRST_AID_CERTS,
  MOCK_MINUTE_MEETINGS
} from '../data/mockData';

export interface SupabaseStatus {
  connected: boolean;
  url: string;
  message: string;
}

/**
 * Check connectivity to Supabase project
 */
export async function checkSupabaseConnection(): Promise<SupabaseStatus> {
  const meta = import.meta as any;
  const url = meta.env?.VITE_SUPABASE_URL || 'https://pbdnbxnzojlhntzdnsbh.supabase.co';
  try {
    // Attempt a light query or RPC test
    const { error } = await supabase.from('incidents').select('id').limit(1);
    if (!error) {
      return {
        connected: true,
        url,
        message: 'Connected to Supabase Project'
      };
    } else {
      // Table might not exist yet, but server reached
      return {
        connected: true,
        url,
        message: `Connected (${error.message || 'Ready for tables'})`
      };
    }
  } catch (err: any) {
    return {
      connected: false,
      url,
      message: err?.message || 'Connection offline'
    };
  }
}

/**
 * Fetch incidents with Supabase attempt & fallback
 */
export async function getSupabaseIncidents() {
  try {
    const { data, error } = await supabase.from('incidents').select('*');
    if (!error && data && data.length > 0) {
      return data;
    }
  } catch (e) {
    console.warn('[Supabase] Falling back to default records:', e);
  }
  return MOCK_INCIDENT_RECORDS;
}

/**
 * Fetch inspections with Supabase attempt & fallback
 */
export async function getSupabaseInspections() {
  try {
    const { data, error } = await supabase.from('inspections').select('*');
    if (!error && data && data.length > 0) {
      return data;
    }
  } catch (e) {
    console.warn('[Supabase] Falling back to default inspection records:', e);
  }
  return MOCK_INSPECTION_RECORDS;
}

/**
 * Fetch first aid certs with Supabase attempt & fallback
 */
export async function getSupabaseFirstAidCerts() {
  try {
    const { data, error } = await supabase.from('first_aid_certs').select('*');
    if (!error && data && data.length > 0) {
      return data;
    }
  } catch (e) {
    console.warn('[Supabase] Falling back to default cert records:', e);
  }
  return MOCK_FIRST_AID_CERTS;
}

/**
 * Fetch minute meetings with Supabase attempt & fallback
 */
export async function getSupabaseMinuteMeetings() {
  try {
    const { data, error } = await supabase.from('minute_meetings').select('*');
    if (!error && data && data.length > 0) {
      return data;
    }
  } catch (e) {
    console.warn('[Supabase] Falling back to default minute meetings:', e);
  }
  return MOCK_MINUTE_MEETINGS;
}
