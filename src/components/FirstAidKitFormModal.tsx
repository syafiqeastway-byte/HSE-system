import React, { useState, useEffect, useMemo } from 'react';
import { FirstAidKitTableData } from '../types';
import { submitFirstAidKitUsageToSupabase, deductFirstAidKitStockInSupabase } from '../utils/supabaseService';

export const FIRST_AID_17_ITEMS = [
  '1) STERILE GAUZE PAD',
  '2) PLASTER LUKA',
  '3) WOW/ELASTIC BANDAGE',
  '4) PITA PELEKAT PERUBATAN',
  '5) KAPAS',
  '6) IODINE',
  '7) GUNTING/PISAU',
  '8) KAIN ANDUH/TRIANGULAR BANDAGE',
  '9) WOODEN SPLINT',
  '10) PIN',
  '11) SARUNG TANGAN',
  '12) MUSCLE CREAM',
  '13) ALCOHOL SWAB',
  '14) ANTISEPTIC CREAM',
  '15) PENGEPIT',
  '16) STERILE EYE PADS',
  '17) COLD PACK'
];

export interface FirstAidKitParsedUnit {
  id: string;
  no: string;
  modelPlace: string;
  plateNo: string;
  location: string;
  code: string;
  lastInspection?: string;
  nextInspection?: string;
  items: Record<string, string>;
}

export const DEFAULT_FIRST_AID_UNITS: FirstAidKitParsedUnit[] = [
  { id: 'unit-1', no: '1', modelPlace: 'ISUZU DMAX', plateNo: 'BRU 9233', location: 'IJOK', code: 'CASA', items: {} },
  { id: 'unit-2', no: '2', modelPlace: 'ISUZU DMAX DOUBLE', plateNo: 'BRF 6233', location: 'IJOK', code: 'T12', items: {} },
  { id: 'unit-3', no: '3', modelPlace: 'ISUZU DMAX', plateNo: 'JXB 9233', location: 'IJOK', code: 'T7', items: {} },
  { id: 'unit-4', no: '4', modelPlace: 'TOYOTA HILUX', plateNo: 'BPE 2233', location: 'IJOK', code: 'T3', items: {} },
  { id: 'unit-5', no: '5', modelPlace: 'PERODUA VIVA', plateNo: 'WA 1584 K', location: 'IJOK', code: 'T8', items: {} },
  { id: 'unit-6', no: '6', modelPlace: 'PERODUA VIVA', plateNo: 'WA 1582 K', location: 'IJOK', code: '-', items: {} },
  { id: 'unit-7', no: '7', modelPlace: 'ISUZU LORRY', plateNo: 'WMP 2233', location: 'IJOK', code: 'T1', items: {} },
  { id: 'unit-8', no: '8', modelPlace: 'HICOM LORRY', plateNo: 'WVS 7589', location: 'IJOK', code: 'T5', items: {} },
  { id: 'unit-9', no: '9', modelPlace: 'NISSAN LOADERS', plateNo: 'NDS 8310', location: 'IJOK', code: 'T9', items: {} },
  { id: 'unit-10', no: '10', modelPlace: 'TOYOTA HILUX DOUBLE', plateNo: 'WYX 2233', location: 'IJOK', code: 'ADA', items: {} },
  { id: 'unit-11', no: '11', modelPlace: 'PROTON ARENA', plateNo: 'WPY 105', location: 'PENANG', code: '-', items: {} },
  { id: 'unit-12', no: '12', modelPlace: 'NISSAN NAVARA', plateNo: 'BMG 2233', location: 'PENANG', code: '-', items: {} },
  { id: 'unit-13', no: '13', modelPlace: 'ISUZU DMAX', plateNo: 'VKA 9233', location: 'PENANG', code: '-', items: {} },
  { id: 'unit-14', no: '14', modelPlace: 'PERODUA KEMBARA', plateNo: 'WMM 4589', location: 'PENANG', code: '-', items: {} },
  { id: 'unit-15', no: '15', modelPlace: 'IJOK WAREHOUSE (01)', plateNo: '-', location: 'KITCHEN', code: '-', items: {} },
  { id: 'unit-16', no: '16', modelPlace: 'IJOK WAREHOUSE', plateNo: '-', location: 'ROOM', code: '-', items: {} },
  { id: 'unit-17', no: '17', modelPlace: 'SUBANG OFFICE HQ (1)', plateNo: '-', location: 'SUBANG', code: '-', items: {} },
  { id: 'unit-18', no: '18', modelPlace: 'SUBANG OFFICE HQ (2)', plateNo: '-', location: 'SUBANG', code: '-', items: {} },
  { id: 'unit-19', no: '19', modelPlace: 'PENANG WAREHOUSE', plateNo: '-', location: 'PENANG', code: '-', items: {} },
];

export interface UsedItemRow {
  id: string;
  item: string;
  quantity: number;
  remarks: string;
}

interface FirstAidKitFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  tableData?: FirstAidKitTableData;
  initialUnitId?: string;
  onSaveInspection?: (formData: any) => void;
  isInline?: boolean;
}

export const FirstAidKitFormModal: React.FC<FirstAidKitFormModalProps> = ({
  isOpen,
  onClose,
  tableData,
  initialUnitId,
  onSaveInspection,
  isInline = false,
}) => {
  // Parse dynamic units from First Aid Kit table list
  const units: FirstAidKitParsedUnit[] = useMemo(() => {
    if (!tableData || !tableData.headers || !tableData.rows || tableData.rows.length === 0) {
      return DEFAULT_FIRST_AID_UNITS;
    }

    const h = tableData.headers.map(x => (x || '').toUpperCase().trim());
    const modelIdx = h.findIndex(col => col.includes('MODEL') || col.includes('PLACE'));
    const plateIdx = h.findIndex(col => col.includes('PLATE'));
    const locIdx = h.findIndex(col => col.includes('LOCATION'));
    const codeIdx = h.findIndex(col => col === 'CODE' || col.includes('CODE'));
    const lastInspIdx = h.findIndex(col => col.includes('LAST'));
    const nextInspIdx = h.findIndex(col => col.includes('NEXT'));

    if (modelIdx === -1) {
      return DEFAULT_FIRST_AID_UNITS;
    }

    const parsed: FirstAidKitParsedUnit[] = [];
    tableData.rows.forEach((row, idx) => {
      const modelVal = row[modelIdx]?.trim();
      if (!modelVal) return;

      parsed.push({
        id: `row-${idx}`,
        no: row[0] || `${idx + 1}`,
        modelPlace: modelVal,
        plateNo: plateIdx !== -1 && row[plateIdx] ? row[plateIdx].trim() : '-',
        location: locIdx !== -1 && row[locIdx] ? row[locIdx].trim() : '-',
        code: codeIdx !== -1 && row[codeIdx] ? row[codeIdx].trim() : '-',
        lastInspection: lastInspIdx !== -1 ? row[lastInspIdx] : '-',
        nextInspection: nextInspIdx !== -1 ? row[nextInspIdx] : '-',
        items: {},
      });
    });

    return parsed.length > 0 ? parsed : DEFAULT_FIRST_AID_UNITS;
  }, [tableData]);

  const [selectedUnitId, setSelectedUnitId] = useState<string>(() => {
    return initialUnitId || units[0]?.id || 'unit-1';
  });

  // Sync selected unit
  useEffect(() => {
    if (initialUnitId && units.some(u => u.id === initialUnitId)) {
      setSelectedUnitId(initialUnitId);
    } else if (units.length > 0 && !units.some(u => u.id === selectedUnitId)) {
      setSelectedUnitId(units[0].id);
    }
  }, [initialUnitId, units, selectedUnitId]);

  // Active selected kit unit
  const activeUnit = useMemo(() => {
    return units.find(u => u.id === selectedUnitId) || units[0] || DEFAULT_FIRST_AID_UNITS[0];
  }, [units, selectedUnitId]);

  // User form details
  const [userName, setUserName] = useState<string>('');
  const [department, setDepartment] = useState<string>('');
  const [usageDate, setUsageDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [reason, setReason] = useState<string>('');
  const [generalNotes, setGeneralNotes] = useState<string>('');
  const [submittedMessage, setSubmittedMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Dynamic list of items used by the user
  const [usedItems, setUsedItems] = useState<UsedItemRow[]>([
    { id: 'item-1', item: FIRST_AID_17_ITEMS[1] || FIRST_AID_17_ITEMS[0], quantity: 1, remarks: '' }
  ]);

  if (!isOpen && !isInline) return null;

  // Add Item to dynamic list (Maximum 3 items allowed)
  const handleAddItem = () => {
    if (usedItems.length >= 3) return;
    // Find next item not already in the list if possible
    const existingItems = new Set(usedItems.map(u => u.item));
    const nextItem = FIRST_AID_17_ITEMS.find(item => !existingItems.has(item)) || FIRST_AID_17_ITEMS[0];
    
    setUsedItems(prev => {
      if (prev.length >= 3) return prev;
      return [
        ...prev,
        {
          id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          item: nextItem,
          quantity: 1,
          remarks: ''
        }
      ];
    });
  };

  // Remove Item from dynamic list
  const handleRemoveItem = (id: string) => {
    if (usedItems.length <= 1) {
      // If only one, reset it rather than removing completely
      setUsedItems([
        { id: `item-${Date.now()}`, item: FIRST_AID_17_ITEMS[0], quantity: 1, remarks: '' }
      ]);
      return;
    }
    setUsedItems(prev => prev.filter(row => row.id !== id));
  };

  // Update item field
  const handleItemChange = (id: string, field: keyof UsedItemRow, value: any) => {
    setUsedItems(prev => prev.map(row => {
      if (row.id === id) {
        return { ...row, [field]: value };
      }
      return row;
    }));
  };

  // Adjust quantity
  const handleQuantityAdjust = (id: string, delta: number) => {
    setUsedItems(prev => prev.map(row => {
      if (row.id === id) {
        const newQty = Math.max(1, (Number(row.quantity) || 1) + delta);
        return { ...row, quantity: newQty };
      }
      return row;
    }));
  };

  // Handle Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (usedItems.length === 0) {
      alert('Please add at least one item used from the kit.');
      return;
    }

    setIsSubmitting(true);

    const submission = {
      id: `USAGE-${Date.now()}`,
      modelPlace: activeUnit.modelPlace,
      plateNo: activeUnit.plateNo,
      location: activeUnit.location,
      code: activeUnit.code,
      userName: userName || 'Employee / User',
      department: department || '-',
      usageDate,
      reason: reason || 'Minor First Aid Treatment',
      items: usedItems.map(u => ({
        item: u.item,
        quantity: Number(u.quantity) || 1,
        remarks: u.remarks || ''
      })),
      generalNotes,
      submittedAt: new Date().toISOString(),
    };

    // Submit to Supabase "First Aid Kit Records" with auto-generated sequential NO (1, 2, 3...)
    const supabaseResult = await submitFirstAidKitUsageToSupabase(submission);

    // Automatically deduct items from "First Aid Kit Items" table
    await deductFirstAidKitStockInSupabase(submission);

    if (onSaveInspection) {
      onSaveInspection({ ...submission, no: supabaseResult.nextNo });
    }

    try {
      const prev = JSON.parse(localStorage.getItem('HSE_FIRST_AID_USAGE_LOGS') || '[]');
      prev.unshift({ ...submission, no: supabaseResult.nextNo });
      localStorage.setItem('HSE_FIRST_AID_USAGE_LOGS', JSON.stringify(prev));
    } catch {}

    setIsSubmitting(false);

    setSubmittedMessage(
      `Usage report (NO: ${supabaseResult.nextNo}) for ${activeUnit.modelPlace} (${activeUnit.plateNo || activeUnit.location}) has been submitted successfully to Supabase!`
    );

    // Reset items list after submission
    setTimeout(() => {
      setSubmittedMessage(null);
      setUserName('');
      setDepartment('');
      setReason('');
      setGeneralNotes('');
      setUsedItems([
        { id: `item-${Date.now()}`, item: FIRST_AID_17_ITEMS[1] || FIRST_AID_17_ITEMS[0], quantity: 1, remarks: '' }
      ]);
      if (!isInline) {
        onClose();
      }
    }, 2800);
  };

  const formBody = (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-cyan-500/20">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-rose-400 text-xl">medical_services</span>
            <h2 className="text-sm sm:text-base font-extrabold text-white uppercase tracking-wide">
              First Aid Kit Item Usage Form
            </h2>
          </div>
          <p className="text-[11px] text-slate-300 mt-0.5">
            Please log any items taken from this First Aid Kit for inventory control & immediate replenishment
          </p>
        </div>

        {!isInline && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Close Form"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        )}
      </div>

      {submittedMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs sm:text-sm font-bold flex items-center gap-2 animate-fadeIn shadow-lg">
          <span className="material-symbols-outlined text-emerald-400 text-lg">check_circle</span>
          <span>{submittedMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* SECTION 1: KIT IDENTIFICATION & AUTOFILL METADATA */}
        <div className="bg-slate-950/80 border border-cyan-500/30 rounded-2xl p-3.5 sm:p-4 shadow-lg">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-cyan-500/20">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-cyan-400 text-base">directions_car</span>
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                1. Kit Identification & Location Details
              </span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30 text-cyan-300">
              {units.length} Kits Registered
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* 1. MODELS / PLACE Dropdown */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-cyan-300 mb-1">
                MODELS / PLACE <span className="text-rose-400">*</span>
              </label>
              <select
                value={selectedUnitId}
                onChange={(e) => setSelectedUnitId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-cyan-500/40 text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-cyan-500 cursor-pointer shadow-inner"
              >
                {units.map((u, uIdx) => (
                  <option key={`${u.id}-${uIdx}`} value={u.id} className="bg-slate-900 text-white">
                    {u.no}. {u.modelPlace} {u.plateNo && u.plateNo !== '-' ? `(${u.plateNo})` : ''} - {u.location}
                  </option>
                ))}
              </select>
            </div>

            {/* 2. PLATE NO (Autofill) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                  PLATE NO
                </label>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/50 px-1.5 py-0.2 rounded border border-emerald-500/30">
                  Autofill
                </span>
              </div>
              <div className="relative">
                <input
                  type="text"
                  value={activeUnit.plateNo || '-'}
                  readOnly
                  className="w-full px-3 py-2 rounded-xl bg-slate-900/90 border border-slate-700 text-cyan-300 text-xs font-mono font-bold select-none focus:outline-none shadow-inner"
                />
                <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">
                  lock
                </span>
              </div>
            </div>

            {/* 3. LOCATION (Autofill) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                  LOCATION
                </label>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/50 px-1.5 py-0.2 rounded border border-emerald-500/30">
                  Autofill
                </span>
              </div>
              <div className="relative">
                <input
                  type="text"
                  value={activeUnit.location || '-'}
                  readOnly
                  className="w-full px-3 py-2 rounded-xl bg-slate-900/90 border border-slate-700 text-white text-xs font-semibold select-none focus:outline-none shadow-inner"
                />
                <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">
                  location_on
                </span>
              </div>
            </div>

            {/* 4. CODE (Autofill) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                  CODE
                </label>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/50 px-1.5 py-0.2 rounded border border-emerald-500/30">
                  Autofill
                </span>
              </div>
              <div className="relative">
                <input
                  type="text"
                  value={activeUnit.code || '-'}
                  readOnly
                  className="w-full px-3 py-2 rounded-xl bg-slate-900/90 border border-slate-700 text-amber-300 text-xs font-mono font-bold select-none focus:outline-none shadow-inner"
                />
                <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">
                  tag
                </span>
              </div>
            </div>
          </div>

          {/* Usage Metadata: User, Date, Reason */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3 pt-3 border-t border-slate-800/80">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-300 mb-1">
                Date of Use <span className="text-rose-400">*</span>
              </label>
              <input
                type="date"
                required
                value={usageDate}
                onChange={(e) => setUsageDate(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-300 mb-1">
                Used By / Person Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Name of user or patient..."
                className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-300 mb-1">
                Department / Team
              </label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="e.g. Workshop, Logistic, Driver..."
                className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: ITEMS USED (DROPDOWN LIST + ADD ITEM FUNCTIONALITY) */}
        <div className="bg-slate-950/80 border border-cyan-500/30 rounded-2xl p-3.5 sm:p-4 shadow-lg space-y-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-2 border-b border-cyan-500/20">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-rose-400 text-base">medication</span>
              <span className="text-xs font-bold uppercase tracking-wider text-white">
                2. Items Used (Select from Dropdown List)
              </span>
            </div>
            {usedItems.length < 3 && (
              <button
                type="button"
                onClick={handleAddItem}
                className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all border border-cyan-400/40 active:scale-95"
              >
                <span className="material-symbols-outlined text-base">add_circle</span>
                <span>Add Item ({usedItems.length}/3)</span>
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-cyan-500/20 text-xs text-white">
              <thead className="bg-slate-900 text-cyan-400 border-b border-cyan-500/30">
                <tr className="h-8">
                  <th className="py-1 px-2.5 border border-cyan-500/20 text-center w-12 font-bold text-cyan-400">
                    NO
                  </th>
                  <th className="py-1 px-3 border border-cyan-500/20 text-left min-w-[260px] font-bold text-cyan-400">
                    ITEM DESCRIPTION (DROPDOWN)
                  </th>
                  <th className="py-1 px-3 border border-cyan-500/20 text-center w-36 font-bold text-cyan-400">
                    QUANTITY
                  </th>
                  <th className="py-1 px-2 border border-cyan-500/20 text-center w-16 font-bold text-rose-400">
                    ACTION
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cyan-500/10">
                {usedItems.map((row, index) => (
                  <tr
                    key={`${row.id}-${index}`}
                    className={`h-11 hover:bg-slate-900/60 transition-colors ${
                      index % 2 === 0 ? 'bg-slate-900/20' : 'bg-slate-900/50'
                    }`}
                  >
                    {/* 1. NO */}
                    <td className="py-1 px-2.5 border border-cyan-500/20 text-center font-mono font-medium text-white">
                      {index + 1}
                    </td>

                    {/* 2. ITEM (Dropdown list of all items) */}
                    <td className="py-1.5 px-3 border border-cyan-500/20">
                      <select
                        value={row.item}
                        onChange={(e) => handleItemChange(row.id, 'item', e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-cyan-500 cursor-pointer shadow-inner"
                      >
                        {FIRST_AID_17_ITEMS.map((itemOption, oIdx) => (
                          <option key={`${itemOption}-${oIdx}`} value={itemOption} className="bg-slate-900 text-white">
                            {itemOption}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* 3. QUANTITY */}
                    <td className="py-1.5 px-3 border border-cyan-500/20 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleQuantityAdjust(row.id, -1)}
                          disabled={row.quantity <= 1}
                          className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center border border-slate-700 disabled:opacity-40 transition-colors"
                          title="Decrease quantity"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min="1"
                          max="999"
                          value={row.quantity}
                          onChange={(e) => {
                            const val = Math.max(1, parseInt(e.target.value, 10) || 1);
                            handleItemChange(row.id, 'quantity', val);
                          }}
                          className="w-16 px-2 py-1 rounded bg-slate-950 border border-cyan-500/40 text-cyan-300 font-mono font-bold text-xs text-center focus:outline-none focus:ring-1 focus:ring-cyan-500 shadow-inner"
                        />
                        <button
                          type="button"
                          onClick={() => handleQuantityAdjust(row.id, 1)}
                          className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center border border-slate-700 transition-colors"
                          title="Increase quantity"
                        >
                          +
                        </button>
                      </div>
                    </td>

                    {/* 4. ACTION (Remove) */}
                    <td className="py-1.5 px-2 border border-cyan-500/20 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(row.id)}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/20 transition-colors"
                        title="Remove this item"
                      >
                        <span className="material-symbols-outlined text-base">delete</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Quick Add Button Bar */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-slate-400">
              Total items being logged: <strong className="text-cyan-400">{usedItems.length}</strong> / 3
            </span>
            {usedItems.length < 3 ? (
              <button
                type="button"
                onClick={handleAddItem}
                className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all"
              >
                <span className="material-symbols-outlined text-sm">add</span>
                <span>Add Another Item</span>
              </button>
            ) : (
              <span className="text-[11px] font-semibold text-amber-400">
                Maximum 3 items reached
              </span>
            )}
          </div>
        </div>

        {/* SECTION 3: REASON & SUBMISSION */}
        <div className="bg-slate-950/80 border border-cyan-500/30 rounded-2xl p-3.5 sm:p-4 shadow-lg">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5">
            General Notes & Incident Details (Optional)
          </label>
          <textarea
            rows={2}
            value={generalNotes}
            onChange={(e) => setGeneralNotes(e.target.value)}
            placeholder="Provide additional details regarding the incident or replenishment request..."
            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500"
          ></textarea>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-3 pt-3 border-t border-slate-800">
            <span className="text-[11px] text-slate-400">
              * Submission updates the kit replenishment log and notifies safety team
            </span>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              {!isInline && (
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs sm:text-sm font-semibold transition-colors"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-cyan-600/30 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
              >
                <span className={`material-symbols-outlined text-base ${isSubmitting ? 'animate-spin' : ''}`}>
                  {isSubmitting ? 'sync' : 'send'}
                </span>
                <span>{isSubmitting ? 'Submitting to Supabase...' : 'Submit Usage Report'}</span>
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );

  if (isInline) {
    return <div className="glass-card p-4 sm:p-5">{formBody}</div>;
  }

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center z-50 p-3 sm:p-4 md:p-6 overflow-y-auto">
      <div className="glass-card p-4 sm:p-6 w-full max-w-4xl max-h-[92vh] overflow-y-auto border border-cyan-500/40 shadow-2xl rounded-2xl my-auto">
        {formBody}
      </div>
    </div>
  );
};
