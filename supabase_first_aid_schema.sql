-- =========================================================================
-- EASTWAY ENGINEERING HSE MANAGEMENT SYSTEM
-- FIRST AID KIT MANAGEMENT MODULE - SUPABASE DATABASE SCHEMA
-- =========================================================================
-- Instructions: Run this script in your Supabase Project's SQL Editor
-- (Dashboard -> SQL Editor -> New Query -> Run)
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

-- 2. Create First Aid Items Table (Each kit can contain multiple items)
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

-- 3. Create First Aid Item Usage Logs Table (Audit trail for item deductions)
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

-- Create Fast Query Indexes
CREATE INDEX IF NOT EXISTS idx_first_aid_kits_code ON first_aid_kits(kit_code);
CREATE INDEX IF NOT EXISTS idx_first_aid_items_kit_id ON first_aid_items(kit_id);
CREATE INDEX IF NOT EXISTS idx_first_aid_usage_logs_kit_id ON first_aid_usage_logs(kit_id);
CREATE INDEX IF NOT EXISTS idx_first_aid_usage_logs_item_id ON first_aid_usage_logs(item_id);

-- Enable Row Level Security (RLS)
ALTER TABLE first_aid_kits ENABLE ROW LEVEL SECURITY;
ALTER TABLE first_aid_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE first_aid_usage_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if re-running
DROP POLICY IF EXISTS "Allow anon full access to first_aid_kits" ON first_aid_kits;
DROP POLICY IF EXISTS "Allow anon full access to first_aid_items" ON first_aid_items;
DROP POLICY IF EXISTS "Allow anon full access to first_aid_usage_logs" ON first_aid_usage_logs;

-- Create Policies for anonymous read & write access
CREATE POLICY "Allow anon full access to first_aid_kits" 
    ON first_aid_kits FOR ALL 
    USING (true) WITH CHECK (true);

CREATE POLICY "Allow anon full access to first_aid_items" 
    ON first_aid_items FOR ALL 
    USING (true) WITH CHECK (true);

CREATE POLICY "Allow anon full access to first_aid_usage_logs" 
    ON first_aid_usage_logs FOR ALL 
    USING (true) WITH CHECK (true);

-- =========================================================================
-- SEED INITIAL SAMPLE FIRST AID KITS & ESSENTIAL ITEMS
-- =========================================================================

INSERT INTO first_aid_kits (kit_code, kit_name, location, is_active)
VALUES 
    ('FAK-W01', 'Main Fabrication Workshop Kit A', 'Fabrication Yard Pillar 4', TRUE),
    ('FAK-W02', 'Machining & CNC Section Kit', 'CNC Workshop Main Entrance', TRUE),
    ('FAK-Y01', 'Heavy Lifting & Blasting Bay Kit', 'Blasting Bay Control Office', TRUE),
    ('FAK-O01', 'HSE & Operations Office Kit', 'Level 2 HSE Operations Room', TRUE)
ON CONFLICT (kit_code) DO NOTHING;

-- Seed Standard Essential Items for FAK-W01
DO $$
DECLARE
    v_kit_id UUID;
BEGIN
    SELECT id INTO v_kit_id FROM first_aid_kits WHERE kit_code = 'FAK-W01' LIMIT 1;
    IF v_kit_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM first_aid_items WHERE kit_id = v_kit_id) THEN
        INSERT INTO first_aid_items (kit_id, item_name, quantity, min_quantity, unit)
        VALUES 
            (v_kit_id, 'Waterproof Plasters (Adhesive Bandages)', 40, 15, 'pcs'),
            (v_kit_id, 'Sterile Gauze Swabs (7.5cm x 7.5cm)', 25, 10, 'packs'),
            (v_kit_id, 'Crepe Bandage (Roll)', 12, 5, 'rolls'),
            (v_kit_id, 'Triangular Bandage', 6, 4, 'pcs'),
            (v_kit_id, 'Nitrile Medical Gloves', 20, 8, 'pairs'),
            (v_kit_id, 'Antiseptic Wipes (Alcohol Free)', 30, 12, 'sachets'),
            (v_kit_id, 'Sterile Eye Wash Solution (500ml)', 4, 2, 'bottles'),
            (v_kit_id, 'Burn Dressing / Hydrogel Pad', 8, 4, 'pcs'),
            (v_kit_id, 'Medical Micropore Tape', 5, 2, 'rolls');
    END IF;
END $$;
