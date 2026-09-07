import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { FirstAidKit, FirstAidItem, FirstAidUsageLog } from '../types';

const LOCAL_STORAGE_KITS_KEY = 'ee_first_aid_kits_v1';
const LOCAL_STORAGE_ITEMS_KEY = 'ee_first_aid_items_v1';
const LOCAL_STORAGE_LOGS_KEY = 'ee_first_aid_logs_v1';

// Initial Seed Data for offline/fallback mode
export const DEFAULT_FIRST_AID_KITS: FirstAidKit[] = [
  {
    id: 'kit-1',
    kit_code: 'FAK-W01',
    kit_name: 'Main Fabrication Workshop Kit A',
    location: 'Fabrication Yard Pillar 4',
    is_active: true,
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'kit-2',
    kit_code: 'FAK-W02',
    kit_name: 'Machining & CNC Section Kit',
    location: 'CNC Workshop Main Entrance',
    is_active: true,
    created_at: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'kit-3',
    kit_code: 'FAK-Y01',
    kit_name: 'Heavy Lifting & Blasting Bay Kit',
    location: 'Blasting Bay Control Office',
    is_active: true,
    created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'kit-4',
    kit_code: 'FAK-O01',
    kit_name: 'HSE & Operations Office Kit',
    location: 'Level 2 HSE Operations Room',
    is_active: true,
    created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const DEFAULT_FIRST_AID_ITEMS: FirstAidItem[] = [
  // Kit 1 Items
  {
    id: 'item-101',
    kit_id: 'kit-1',
    item_name: 'Waterproof Plasters (Adhesive Bandages)',
    quantity: 40,
    min_quantity: 15,
    unit: 'pcs',
  },
  {
    id: 'item-102',
    kit_id: 'kit-1',
    item_name: 'Sterile Gauze Swabs (7.5cm x 7.5cm)',
    quantity: 8, // Below min -> Low stock
    min_quantity: 10,
    unit: 'packs',
  },
  {
    id: 'item-103',
    kit_id: 'kit-1',
    item_name: 'Crepe Bandage (Roll)',
    quantity: 12,
    min_quantity: 5,
    unit: 'rolls',
  },
  {
    id: 'item-104',
    kit_id: 'kit-1',
    item_name: 'Triangular Bandage',
    quantity: 3, // Below min -> Low stock
    min_quantity: 4,
    unit: 'pcs',
  },
  {
    id: 'item-105',
    kit_id: 'kit-1',
    item_name: 'Nitrile Medical Gloves',
    quantity: 20,
    min_quantity: 8,
    unit: 'pairs',
  },
  {
    id: 'item-106',
    kit_id: 'kit-1',
    item_name: 'Antiseptic Wipes (Alcohol Free)',
    quantity: 30,
    min_quantity: 12,
    unit: 'sachets',
  },
  {
    id: 'item-107',
    kit_id: 'kit-1',
    item_name: 'Sterile Eye Wash Solution (500ml)',
    quantity: 2, // Equal to min -> Low stock
    min_quantity: 2,
    unit: 'bottles',
  },
  {
    id: 'item-108',
    kit_id: 'kit-1',
    item_name: 'Burn Dressing / Hydrogel Pad',
    quantity: 7,
    min_quantity: 4,
    unit: 'pcs',
  },

  // Kit 2 Items
  {
    id: 'item-201',
    kit_id: 'kit-2',
    item_name: 'Fabric Plasters (Heavy Duty)',
    quantity: 35,
    min_quantity: 15,
    unit: 'pcs',
  },
  {
    id: 'item-202',
    kit_id: 'kit-2',
    item_name: 'Sterile Gauze Swabs',
    quantity: 15,
    min_quantity: 8,
    unit: 'packs',
  },
  {
    id: 'item-203',
    kit_id: 'kit-2',
    item_name: 'Elastic Adhesive Bandage',
    quantity: 4, // Below min -> Low stock
    min_quantity: 6,
    unit: 'rolls',
  },
  {
    id: 'item-204',
    kit_id: 'kit-2',
    item_name: 'Nitrile Medical Gloves',
    quantity: 18,
    min_quantity: 8,
    unit: 'pairs',
  },
  {
    id: 'item-205',
    kit_id: 'kit-2',
    item_name: 'Saline Eye Wash Pods (20ml)',
    quantity: 10,
    min_quantity: 5,
    unit: 'vials',
  },

  // Kit 3 Items
  {
    id: 'item-301',
    kit_id: 'kit-3',
    item_name: 'Waterproof Plasters',
    quantity: 25,
    min_quantity: 10,
    unit: 'pcs',
  },
  {
    id: 'item-302',
    kit_id: 'kit-3',
    item_name: 'Emergency Burn Shield / Blanket',
    quantity: 2,
    min_quantity: 2,
    unit: 'pcs',
  },
  {
    id: 'item-303',
    kit_id: 'kit-3',
    item_name: 'Heavy Duty Dressing Pad',
    quantity: 8,
    min_quantity: 5,
    unit: 'pcs',
  },

  // Kit 4 Items
  {
    id: 'item-401',
    kit_id: 'kit-4',
    item_name: 'Assorted Plasters (Clear / Waterproof)',
    quantity: 50,
    min_quantity: 20,
    unit: 'pcs',
  },
  {
    id: 'item-402',
    kit_id: 'kit-4',
    item_name: 'Antiseptic Cleansing Wipes',
    quantity: 40,
    min_quantity: 15,
    unit: 'sachets',
  },
  {
    id: 'item-403',
    kit_id: 'kit-4',
    item_name: 'CPR Face Shield',
    quantity: 3,
    min_quantity: 2,
    unit: 'pcs',
  },
];

export const DEFAULT_USAGE_LOGS: FirstAidUsageLog[] = [
  {
    id: 'log-1',
    kit_id: 'kit-1',
    item_id: 'item-101',
    kit_name: 'Main Fabrication Workshop Kit A',
    item_name: 'Waterproof Plasters (Adhesive Bandages)',
    quantity_used: 3,
    remaining_quantity: 40,
    taken_by: 'Ahmad Faiz (Welder)',
    purpose: 'Minor finger scrape during bevel grinding',
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'log-2',
    kit_id: 'kit-1',
    item_id: 'item-102',
    kit_name: 'Main Fabrication Workshop Kit A',
    item_name: 'Sterile Gauze Swabs (7.5cm x 7.5cm)',
    quantity_used: 2,
    remaining_quantity: 8,
    taken_by: 'R. Kumar (Fitter)',
    purpose: 'Clean light abrasion on forearm',
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
];

// Helper to check if item is low stock
export const isLowStock = (item: FirstAidItem): boolean => {
  return item.quantity <= item.min_quantity;
};

// Local storage helpers
export function getLocalKits(): FirstAidKit[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KITS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading local kits:', e);
  }
  return DEFAULT_FIRST_AID_KITS;
}

export function saveLocalKits(kits: FirstAidKit[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KITS_KEY, JSON.stringify(kits));
  } catch (e) {
    console.error('Error saving local kits:', e);
  }
}

export function getLocalItems(): FirstAidItem[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_ITEMS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading local items:', e);
  }
  return DEFAULT_FIRST_AID_ITEMS;
}

export function saveLocalItems(items: FirstAidItem[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_ITEMS_KEY, JSON.stringify(items));
  } catch (e) {
    console.error('Error saving local items:', e);
  }
}

export function getLocalLogs(): FirstAidUsageLog[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_LOGS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading local logs:', e);
  }
  return DEFAULT_USAGE_LOGS;
}

export function saveLocalLogs(logs: FirstAidUsageLog[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_LOGS_KEY, JSON.stringify(logs));
  } catch (e) {
    console.error('Error saving local logs:', e);
  }
}

export interface SupabaseFirstAidStatus {
  isConfigured: boolean;
  hasTables: boolean;
  message: string;
}

/**
 * Check if Supabase has the required first aid tables
 */
export async function testSupabaseFirstAidTables(): Promise<SupabaseFirstAidStatus> {
  if (!isSupabaseConfigured()) {
    return {
      isConfigured: false,
      hasTables: false,
      message: 'Supabase credentials not configured. Running in Local Persistence mode.',
    };
  }

  try {
    const { data, error } = await supabase.from('first_aid_kits').select('id').limit(1);
    if (error) {
      return {
        isConfigured: true,
        hasTables: false,
        message: `Supabase reached, but table 'first_aid_kits' not detected (${error.message}). Please execute the SQL migration script.`,
      };
    }
    return {
      isConfigured: true,
      hasTables: true,
      message: 'Connected to Supabase. Live PostgreSQL synchronization active.',
    };
  } catch (err: any) {
    return {
      isConfigured: true,
      hasTables: false,
      message: `Failed to query Supabase: ${err?.message || 'Network error'}`,
    };
  }
}

/**
 * Fetch all first aid kits
 */
export async function fetchFirstAidKits(): Promise<{ kits: FirstAidKit[]; fromSupabase: boolean }> {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('first_aid_kits')
        .select('*')
        .order('kit_code', { ascending: true });

      if (!error && data && data.length > 0) {
        // Sync to local storage for offline resiliency
        saveLocalKits(data as FirstAidKit[]);
        return { kits: data as FirstAidKit[], fromSupabase: true };
      }
    } catch (e) {
      console.warn('[FirstAid] Falling back to local kits:', e);
    }
  }

  // Fallback to local storage
  return { kits: getLocalKits(), fromSupabase: false };
}

/**
 * Fetch all first aid items (optionally filtered by kitId)
 */
export async function fetchFirstAidItems(kitId?: string): Promise<{ items: FirstAidItem[]; fromSupabase: boolean }> {
  if (isSupabaseConfigured()) {
    try {
      let query = supabase.from('first_aid_items').select('*').order('item_name', { ascending: true });
      if (kitId) {
        query = query.eq('kit_id', kitId);
      }
      const { data, error } = await query;

      if (!error && data && data.length > 0) {
        if (!kitId) {
          saveLocalItems(data as FirstAidItem[]);
        }
        return { items: data as FirstAidItem[], fromSupabase: true };
      }
    } catch (e) {
      console.warn('[FirstAid] Falling back to local items:', e);
    }
  }

  // Fallback
  const allItems = getLocalItems();
  const filtered = kitId ? allItems.filter((i) => i.kit_id === kitId) : allItems;
  return { items: filtered, fromSupabase: false };
}

/**
 * Fetch recent item usage logs
 */
export async function fetchFirstAidUsageLogs(limit: number = 50): Promise<{ logs: FirstAidUsageLog[]; fromSupabase: boolean }> {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('first_aid_usage_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (!error && data && data.length > 0) {
        saveLocalLogs(data as FirstAidUsageLog[]);
        return { logs: data as FirstAidUsageLog[], fromSupabase: true };
      }
    } catch (e) {
      console.warn('[FirstAid] Falling back to local logs:', e);
    }
  }

  return { logs: getLocalLogs(), fromSupabase: false };
}

/**
 * 1. CREATE / ADD FIRST AID KIT
 */
export async function createFirstAidKit(kit: {
  kit_code: string;
  kit_name: string;
  location: string;
  is_active?: boolean;
}): Promise<FirstAidKit> {
  const newKit: FirstAidKit = {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'kit-' + Date.now(),
    kit_code: kit.kit_code.trim().toUpperCase(),
    kit_name: kit.kit_name.trim(),
    location: kit.location.trim(),
    is_active: kit.is_active ?? true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // Try Supabase insert
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('first_aid_kits')
        .insert({
          kit_code: newKit.kit_code,
          kit_name: newKit.kit_name,
          location: newKit.location,
          is_active: newKit.is_active,
        })
        .select()
        .single();

      if (!error && data) {
        newKit.id = data.id;
      }
    } catch (e) {
      console.warn('Supabase insert kit error:', e);
    }
  }

  // Update local storage
  const current = getLocalKits();
  const updated = [...current, newKit];
  saveLocalKits(updated);

  return newKit;
}

/**
 * 2. EDIT / UPDATE FIRST AID KIT
 */
export async function updateFirstAidKit(
  id: string,
  updates: Partial<Pick<FirstAidKit, 'kit_code' | 'kit_name' | 'location' | 'is_active'>>
): Promise<FirstAidKit | null> {
  const payload = {
    ...updates,
    updated_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured()) {
    try {
      await supabase.from('first_aid_kits').update(payload).eq('id', id);
    } catch (e) {
      console.warn('Supabase update kit error:', e);
    }
  }

  const current = getLocalKits();
  const index = current.findIndex((k) => k.id === id);
  if (index !== -1) {
    current[index] = { ...current[index], ...payload };
    saveLocalKits(current);
    return current[index];
  }
  return null;
}

/**
 * 3. DELETE / DEACTIVATE FIRST AID KIT
 */
export async function deleteFirstAidKit(id: string): Promise<boolean> {
  if (isSupabaseConfigured()) {
    try {
      await supabase.from('first_aid_kits').delete().eq('id', id);
    } catch (e) {
      console.warn('Supabase delete kit error:', e);
    }
  }

  const current = getLocalKits();
  const filtered = current.filter((k) => k.id !== id);
  saveLocalKits(filtered);

  // Also remove items associated with kit
  const items = getLocalItems();
  const remainingItems = items.filter((i) => i.kit_id !== id);
  saveLocalItems(remainingItems);

  return true;
}

/**
 * 4. ADD / CREATE ITEM FOR A FIRST AID KIT
 */
export async function createFirstAidItem(item: {
  kit_id: string;
  item_name: string;
  quantity: number;
  min_quantity: number;
  unit?: string;
}): Promise<FirstAidItem> {
  const newItem: FirstAidItem = {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'item-' + Date.now(),
    kit_id: item.kit_id,
    item_name: item.item_name.trim(),
    quantity: Math.max(0, Number(item.quantity)),
    min_quantity: Math.max(0, Number(item.min_quantity)),
    unit: item.unit?.trim() || 'pcs',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('first_aid_items')
        .insert({
          kit_id: newItem.kit_id,
          item_name: newItem.item_name,
          quantity: newItem.quantity,
          min_quantity: newItem.min_quantity,
          unit: newItem.unit,
        })
        .select()
        .single();

      if (!error && data) {
        newItem.id = data.id;
      }
    } catch (e) {
      console.warn('Supabase insert item error:', e);
    }
  }

  const current = getLocalItems();
  saveLocalItems([...current, newItem]);
  return newItem;
}

/**
 * 5. EDIT / UPDATE FIRST AID ITEM
 */
export async function updateFirstAidItem(
  id: string,
  updates: Partial<Pick<FirstAidItem, 'item_name' | 'quantity' | 'min_quantity' | 'unit'>>
): Promise<FirstAidItem | null> {
  const payload = {
    ...updates,
    updated_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured()) {
    try {
      await supabase.from('first_aid_items').update(payload).eq('id', id);
    } catch (e) {
      console.warn('Supabase update item error:', e);
    }
  }

  const current = getLocalItems();
  const index = current.findIndex((i) => i.id === id);
  if (index !== -1) {
    current[index] = { ...current[index], ...payload };
    saveLocalItems(current);
    return current[index];
  }
  return null;
}

/**
 * 6. DELETE FIRST AID ITEM
 */
export async function deleteFirstAidItem(id: string): Promise<boolean> {
  if (isSupabaseConfigured()) {
    try {
      await supabase.from('first_aid_items').delete().eq('id', id);
    } catch (e) {
      console.warn('Supabase delete item error:', e);
    }
  }

  const current = getLocalItems();
  saveLocalItems(current.filter((i) => i.id !== id));
  return true;
}

/**
 * 7. ITEM USAGE WITH AUTOMATIC QUANTITY DEDUCTION
 * Rule:
 * - Deducts Quantity Used from Current Quantity
 * - Do not allow quantity to become negative (throws descriptive Error)
 * - Returns remaining quantity and records usage log
 */
export async function recordItemUsage(params: {
  kit_id: string;
  item_id: string;
  quantity_used: number;
  taken_by?: string;
  purpose?: string;
}): Promise<{
  success: boolean;
  previous_quantity: number;
  remaining_quantity: number;
  is_low_stock: boolean;
  item: FirstAidItem;
  log: FirstAidUsageLog;
}> {
  const qtyUsed = Math.floor(Number(params.quantity_used));
  if (isNaN(qtyUsed) || qtyUsed <= 0) {
    throw new Error('Quantity used must be a positive number greater than 0.');
  }

  // Find item
  const localItems = getLocalItems();
  const itemIndex = localItems.findIndex((i) => i.id === params.item_id);
  if (itemIndex === -1) {
    throw new Error('First Aid Item not found.');
  }

  const currentItem = localItems[itemIndex];
  const currentQuantity = currentItem.quantity;

  // Strict constraint: Do not allow the quantity to become negative
  if (qtyUsed > currentQuantity) {
    throw new Error(
      `Cannot take ${qtyUsed} ${currentItem.unit || 'pcs'}. Only ${currentQuantity} available in this First Aid Kit.`
    );
  }

  const remainingQuantity = currentQuantity - qtyUsed;
  const updatedItem: FirstAidItem = {
    ...currentItem,
    quantity: remainingQuantity,
    updated_at: new Date().toISOString(),
  };

  // Find kit info for log
  const kits = getLocalKits();
  const kit = kits.find((k) => k.id === params.kit_id);

  const logEntry: FirstAidUsageLog = {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'log-' + Date.now(),
    kit_id: params.kit_id,
    item_id: params.item_id,
    kit_name: kit ? `${kit.kit_code} - ${kit.kit_name}` : 'First Aid Kit',
    item_name: currentItem.item_name,
    quantity_used: qtyUsed,
    remaining_quantity: remainingQuantity,
    taken_by: params.taken_by?.trim() || 'Staff Member',
    purpose: params.purpose?.trim() || 'General First Aid treatment',
    created_at: new Date().toISOString(),
  };

  // 1. Update Supabase if configured
  if (isSupabaseConfigured()) {
    try {
      // Update item quantity
      await supabase
        .from('first_aid_items')
        .update({
          quantity: remainingQuantity,
          updated_at: new Date().toISOString(),
        })
        .eq('id', params.item_id);

      // Insert log
      await supabase.from('first_aid_usage_logs').insert({
        kit_id: params.kit_id,
        item_id: params.item_id,
        quantity_used: qtyUsed,
        remaining_quantity: remainingQuantity,
        taken_by: logEntry.taken_by,
        purpose: logEntry.purpose,
      });
    } catch (e) {
      console.warn('Supabase usage deduction sync error:', e);
    }
  }

  // 2. Update LocalStorage
  localItems[itemIndex] = updatedItem;
  saveLocalItems(localItems);

  const localLogs = getLocalLogs();
  saveLocalLogs([logEntry, ...localLogs]);

  return {
    success: true,
    previous_quantity: currentQuantity,
    remaining_quantity: remainingQuantity,
    is_low_stock: remainingQuantity <= updatedItem.min_quantity,
    item: updatedItem,
    log: logEntry,
  };
}

/**
 * Raw SQL script for copying from the UI
 */
export const SUPABASE_SQL_SCHEMA_SCRIPT = `-- =========================================================================
-- EASTWAY ENGINEERING - FIRST AID KIT MANAGEMENT MODULE
-- Run this in Supabase Project SQL Editor
-- =========================================================================

-- 1. Create First Aid Kits Table
CREATE TABLE IF NOT EXISTS first_aid_kits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kit_code VARCHAR(50) NOT NULL UNIQUE,
    kit_name VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Create First Aid Items Table
CREATE TABLE IF NOT EXISTS first_aid_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kit_id UUID NOT NULL REFERENCES first_aid_kits(id) ON DELETE CASCADE,
    item_name VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    min_quantity INTEGER NOT NULL DEFAULT 5 CHECK (min_quantity >= 0),
    unit VARCHAR(50) NOT NULL DEFAULT 'pcs',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Create First Aid Item Usage Logs Table
CREATE TABLE IF NOT EXISTS first_aid_usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kit_id UUID NOT NULL REFERENCES first_aid_kits(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES first_aid_items(id) ON DELETE CASCADE,
    quantity_used INTEGER NOT NULL CHECK (quantity_used > 0),
    remaining_quantity INTEGER NOT NULL DEFAULT 0,
    taken_by VARCHAR(255) NOT NULL DEFAULT 'Staff Member',
    purpose TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Fast Indexing
CREATE INDEX IF NOT EXISTS idx_first_aid_kits_code ON first_aid_kits(kit_code);
CREATE INDEX IF NOT EXISTS idx_first_aid_items_kit_id ON first_aid_items(kit_id);
CREATE INDEX IF NOT EXISTS idx_first_aid_usage_logs_kit_id ON first_aid_usage_logs(kit_id);

-- Enable Row Level Security (RLS)
ALTER TABLE first_aid_kits ENABLE ROW LEVEL SECURITY;
ALTER TABLE first_aid_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE first_aid_usage_logs ENABLE ROW LEVEL SECURITY;

-- Allow anonymous read & write policies
CREATE POLICY "Allow anon full access to first_aid_kits" 
    ON first_aid_kits FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow anon full access to first_aid_items" 
    ON first_aid_items FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow anon full access to first_aid_usage_logs" 
    ON first_aid_usage_logs FOR ALL USING (true) WITH CHECK (true);
`;
