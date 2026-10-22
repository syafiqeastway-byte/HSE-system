import { supabase } from '../lib/supabase';
import { FirstAidKitTableData } from '../types';
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
  const url = meta.env?.VITE_SUPABASE_URL || 'https://esmqveagrvugmkhxkvxj.supabase.co';
  try {
    // Attempt a light query test on First Aid Kit Records
    const { error } = await supabase.from('First Aid Kit Records').select('NO').limit(1);
    if (!error) {
      return {
        connected: true,
        url,
        message: 'Connected to Supabase Project (First Aid Kit Records ready)'
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
    console.warn('[Cloud DB] Falling back to default records:', e);
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
    console.warn('[Cloud DB] Falling back to default inspection records:', e);
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
    console.warn('[Cloud DB] Falling back to default cert records:', e);
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
    console.warn('[Cloud DB] Falling back to default minute meetings:', e);
  }
  return MOCK_MINUTE_MEETINGS;
}

/**
 * Submit First Aid Kit Usage Report to Supabase "First Aid Kit Records"
 * Auto-generates sequential NO (1, 2, 3...)
 */
export async function submitFirstAidKitUsageToSupabase(submission: {
  modelPlace: string;
  plateNo: string;
  location: string;
  code: string;
  userName: string;
  department: string;
  usageDate: string;
  items: Array<{ item: string; quantity: number; remarks?: string }>;
  generalNotes?: string;
}): Promise<{ success: boolean; nextNo: number; error?: string }> {
  // 1. Determine next auto-increment NO (1, 2, 3...) in sequential order
  let nextNo = 1;

  try {
    const savedNo = localStorage.getItem('HSE_LAST_FIRST_AID_NO');
    if (savedNo) {
      const parsed = parseInt(savedNo, 10);
      if (!isNaN(parsed) && parsed >= 1) {
        nextNo = parsed + 1;
      }
    }
  } catch {}

  // Attempt to check existing records in Cloud Database to sync highest NO
  try {
    const { data } = await supabase
      .from('First Aid Kit Records')
      .select('NO')
      .order('NO', { ascending: false })
      .limit(1);

    if (Array.isArray(data) && data.length > 0) {
      const topNo = parseInt(String((data[0] as any)?.NO || (data[0] as any)?.no || 0), 10);
      if (!isNaN(topNo) && topNo >= nextNo) {
        nextNo = topNo + 1;
      }
    }
  } catch (err) {
    console.warn('[Cloud DB] Could not query latest NO from First Aid Kit Records:', err);
  }

  // Update local sequential counter
  try {
    localStorage.setItem('HSE_LAST_FIRST_AID_NO', String(nextNo));
  } catch {}

  // 2. Build row payload for "First Aid Kit Records" matching exact table schema
  const rowPayload: Record<string, any> = {
    NO: String(nextNo),
    'MODELS/PLACE': submission.modelPlace || null,
    'PLATE NO': submission.plateNo || null,
    'LOCATION': submission.location || null,
    'CODE': submission.code || null,
    'DATE OF USE': submission.usageDate || null,
    'PERSON NAME': submission.userName || null,
    'DEPARTMENT': submission.department || null,
    'ITEM DESCRIPTION 1': submission.items[0]?.item || null,
    'QTY': submission.items[0] ? String(submission.items[0].quantity) : null,
    'ITEM DESCRIPTION 2': submission.items[1]?.item || null,
    'QTY_1': submission.items[1] ? String(submission.items[1].quantity) : null,
    'ITEM DESCRIPTION 3': submission.items[2]?.item || null,
    'QTY_2': submission.items[2] ? String(submission.items[2].quantity) : null,
    'NOTES': submission.generalNotes || null
  };

  try {
    const { error } = await supabase
      .from('First Aid Kit Records')
      .insert([rowPayload]);

    if (error) {
      console.warn('[Cloud DB Insert Error]:', error);
      return { success: false, nextNo, error: error.message };
    }
    return { success: true, nextNo };
  } catch (err: any) {
    console.warn('[Cloud DB Insert Exception]:', err);
    return { success: false, nextNo, error: err?.message || 'Network exception' };
  }
}

/**
 * Fetch Kit Register Table data from Supabase "First Aid Kit Items"
 */
export async function fetchFirstAidKitItemsFromSupabase(): Promise<FirstAidKitTableData> {
  const standardHeaders = [
    'NO', 'MODELS/PLACE', 'PLATE NO', 'LOCATION', 'CODE', 'LAST INSPECTION',
    '1) STERILE GAUZE PAD', '2) PLASTER LUKA', '3) WOW/ELASTIC BANDAGE', '4) PITA PELEKAT PERUBATAN',
    '5) KAPAS', '6) IODINE', '7) GUNTING/PISAU', '8) KAIN ANDUH/TRIANGULAR BANDAGE',
    '9) WOODEN SPLINT', '10) PIN', '11) SARUNG TANGAN', '12) MUSCLE CREAM',
    '13) ALCOHOL SWAB', '14) ANTISEPTIC CREAM', '15) PENGEPIT', '16) STERILE EYE PADS',
    '17) COLD PACK', 'NEXT INSPECTION', 'DESCRIPTION'
  ];

  const processRecords = (data: any[]): FirstAidKitTableData => {
    const sorted = [...data].sort((a, b) => {
      const nA = parseInt(String(a.NO || a.no || '0'), 10);
      const nB = parseInt(String(b.NO || b.no || '0'), 10);
      return nA - nB;
    });
    const sample = sorted[0];
    const headers = Object.keys(sample).length > 0 ? Object.keys(sample) : standardHeaders;
    const rows = sorted.map((item: any) => {
      return headers.map(h => item[h] !== null && item[h] !== undefined ? String(item[h]) : '');
    });
    return {
      headers,
      rows,
      rawRecords: sorted
    };
  };

  try {
    const { data, error } = await supabase.from('First Aid Kit Items').select('*');
    if (!error && Array.isArray(data) && data.length > 0) {
      return processRecords(data);
    }
  } catch (e) {
    console.warn('[Cloud DB] Supabase client error:', e);
  }

  // Direct REST API fallback
  try {
    const res = await fetch('https://esmqveagrvugmkhxkvxj.supabase.co/rest/v1/First%20Aid%20Kit%20Items?select=*', {
      headers: {
        'apikey': 'sb_publishable_nUotvQxnYnyld2f3xbi1IA_8REEibp8',
        'Authorization': 'Bearer sb_publishable_nUotvQxnYnyld2f3xbi1IA_8REEibp8'
      }
    });
    if (res.ok) {
      const directData = await res.json();
      if (Array.isArray(directData) && directData.length > 0) {
        return processRecords(directData);
      }
    }
  } catch (err) {
    console.warn('[Cloud DB] Direct fetch error:', err);
  }

  return {
    headers: standardHeaders,
    rows: [],
    rawRecords: []
  };
}

/**
 * Automatically deduct used items from Supabase "First Aid Kit Items" when usage form is submitted
 */
export async function deductFirstAidKitStockInSupabase(submission: {
  modelPlace: string;
  plateNo: string;
  items: Array<{ item: string; quantity: number }>;
}) {
  try {
    const { data: records, error } = await supabase
      .from('First Aid Kit Items')
      .select('*');
    
    if (error || !records || records.length === 0) return;

    const targetRow = records.find((r: any) => {
      const m = String(r['MODELS/PLACE'] || '').trim().toLowerCase();
      const p = String(r['PLATE NO'] || '').trim().toLowerCase();
      const sm = (submission.modelPlace || '').trim().toLowerCase();
      const sp = (submission.plateNo || '').trim().toLowerCase();
      return m === sm && (sp === '' || p === sp || p.includes(sp) || sp.includes(p));
    });

    if (!targetRow) return;

    const updatedRow = { ...targetRow };
    let hasChanges = false;

    submission.items.forEach(u => {
      const itemName = u.item.trim();
      for (const colKey of Object.keys(updatedRow)) {
        if (colKey.toLowerCase() === itemName.toLowerCase() || colKey.toLowerCase().includes(itemName.toLowerCase())) {
          const currentVal = updatedRow[colKey];
          const num = parseInt(currentVal, 10);
          if (!isNaN(num)) {
            const newVal = Math.max(0, num - Number(u.quantity));
            updatedRow[colKey] = String(newVal);
            hasChanges = true;
          }
          break;
        }
      }
    });

    if (hasChanges && targetRow.NO !== undefined) {
      await supabase
        .from('First Aid Kit Items')
        .update(updatedRow)
        .eq('NO', targetRow.NO);
    }
  } catch (err) {
    console.warn('[Cloud DB Stock Deduction Error]:', err);
  }
}

// Admin CRUD functions for Kit Items
export async function updateFirstAidKitItemRow(noVal: any, updatedRecord: Record<string, any>) {
  try {
    const { error } = await supabase
      .from('First Aid Kit Items')
      .update(updatedRecord)
      .eq('NO', noVal);
    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message };
  }
}

export async function insertFirstAidKitItemRow(newRecord: Record<string, any>) {
  try {
    const { error } = await supabase
      .from('First Aid Kit Items')
      .insert([newRecord]);
    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message };
  }
}

export async function deleteFirstAidKitItemRow(noVal: any) {
  try {
    const { error } = await supabase
      .from('First Aid Kit Items')
      .delete()
      .eq('NO', noVal);
    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message };
  }
}
