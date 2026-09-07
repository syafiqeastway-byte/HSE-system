import React, { useState, useEffect, useMemo } from 'react';
import { FirstAidKit, FirstAidItem, FirstAidUsageLog } from '../types';
import {
  fetchFirstAidKits,
  fetchFirstAidItems,
  fetchFirstAidUsageLogs,
  createFirstAidKit,
  updateFirstAidKit,
  deleteFirstAidKit,
  createFirstAidItem,
  updateFirstAidItem,
  deleteFirstAidItem,
  recordItemUsage,
  testSupabaseFirstAidTables,
  isLowStock,
  SUPABASE_SQL_SCHEMA_SCRIPT,
  SupabaseFirstAidStatus,
} from '../utils/firstAidSupabase';

interface FirstAidKitPageProps {
  onBackToHome: () => void;
  isDarkMode?: boolean;
}

export const FirstAidKitPage: React.FC<FirstAidKitPageProps> = ({
  onBackToHome,
}) => {
  // Data States
  const [kits, setKits] = useState<FirstAidKit[]>([]);
  const [items, setItems] = useState<FirstAidItem[]>([]);
  const [logs, setLogs] = useState<FirstAidUsageLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [dbStatus, setDbStatus] = useState<SupabaseFirstAidStatus>({
    isConfigured: false,
    hasTables: false,
    message: 'Checking database connectivity...',
  });

  // UI States
  const [activeTab, setActiveTab] = useState<'kits' | 'items' | 'logs'>('kits');
  const [filterLowStockOnly, setFilterLowStockOnly] = useState<boolean>(false);
  const [selectedKitFilter, setSelectedKitFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals
  const [isKitModalOpen, setIsKitModalOpen] = useState<boolean>(false);
  const [editingKit, setEditingKit] = useState<FirstAidKit | null>(null);

  const [isItemModalOpen, setIsItemModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<FirstAidItem | null>(null);
  const [targetKitForNewItem, setTargetKitForNewItem] = useState<string>('');

  const [isUsageModalOpen, setIsUsageModalOpen] = useState<boolean>(false);
  const [usageSelectedKitId, setUsageSelectedKitId] = useState<string>('');
  const [usageSelectedItemId, setUsageSelectedItemId] = useState<string>('');
  const [usageQuantity, setUsageQuantity] = useState<number>(1);
  const [usageTakenBy, setUsageTakenBy] = useState<string>('');
  const [usagePurpose, setUsagePurpose] = useState<string>('');
  const [usageError, setUsageError] = useState<string | null>(null);
  const [usageSuccess, setUsageSuccess] = useState<string | null>(null);

  const [isSqlModalOpen, setIsSqlModalOpen] = useState<boolean>(false);
  const [copiedSql, setCopiedSql] = useState<boolean>(false);

  // Kit Form Fields
  const [kitCode, setKitCode] = useState<string>('');
  const [kitName, setKitName] = useState<string>('');
  const [kitLocation, setKitLocation] = useState<string>('');
  const [kitIsActive, setKitIsActive] = useState<boolean>(true);

  // Item Form Fields
  const [itemKitId, setItemKitId] = useState<string>('');
  const [itemName, setItemName] = useState<string>('');
  const [itemQuantity, setItemQuantity] = useState<number>(10);
  const [itemMinQuantity, setItemMinQuantity] = useState<number>(5);
  const [itemUnit, setItemUnit] = useState<string>('pcs');

  // Load data on mount
  const loadAllData = async () => {
    setLoading(true);
    try {
      const [statusRes, kitsRes, itemsRes, logsRes] = await Promise.all([
        testSupabaseFirstAidTables(),
        fetchFirstAidKits(),
        fetchFirstAidItems(),
        fetchFirstAidUsageLogs(),
      ]);

      setDbStatus(statusRes);
      setKits(kitsRes.kits);
      setItems(itemsRes.items);
      setLogs(logsRes.logs);
    } catch (err) {
      console.error('Failed to load first aid data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Calculate Summary Metrics
  const metrics = useMemo(() => {
    const totalKits = kits.length;
    const activeKits = kits.filter((k) => k.is_active).length;
    const totalItemsCount = items.length;
    const lowStockItems = items.filter(isLowStock);
    const totalQuantitySum = items.reduce((sum, item) => sum + item.quantity, 0);

    return {
      totalKits,
      activeKits,
      totalItemsCount,
      lowStockCount: lowStockItems.length,
      totalQuantitySum,
    };
  }, [kits, items]);

  // Filtered Kits
  const filteredKits = useMemo(() => {
    return kits.filter((kit) => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        kit.kit_name.toLowerCase().includes(q) ||
        kit.kit_code.toLowerCase().includes(q) ||
        kit.location.toLowerCase().includes(q);

      if (!matchSearch) return false;

      if (filterLowStockOnly) {
        const kitItems = items.filter((i) => i.kit_id === kit.id);
        const hasLow = kitItems.some(isLowStock);
        return hasLow;
      }

      return true;
    });
  }, [kits, items, searchQuery, filterLowStockOnly]);

  // Filtered Items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (selectedKitFilter !== 'ALL' && item.kit_id !== selectedKitFilter) {
        return false;
      }

      if (filterLowStockOnly && !isLowStock(item)) {
        return false;
      }

      const q = searchQuery.toLowerCase();
      if (!q) return true;

      const parentKit = kits.find((k) => k.id === item.kit_id);
      const matchName = item.item_name.toLowerCase().includes(q);
      const matchKitName = parentKit ? parentKit.kit_name.toLowerCase().includes(q) : false;
      const matchKitCode = parentKit ? parentKit.kit_code.toLowerCase().includes(q) : false;

      return matchName || matchKitName || matchKitCode;
    });
  }, [items, kits, selectedKitFilter, filterLowStockOnly, searchQuery]);

  // Open Add/Edit Kit Modal
  const handleOpenKitModal = (kitToEdit?: FirstAidKit) => {
    if (kitToEdit) {
      setEditingKit(kitToEdit);
      setKitCode(kitToEdit.kit_code);
      setKitName(kitToEdit.kit_name);
      setKitLocation(kitToEdit.location);
      setKitIsActive(kitToEdit.is_active);
    } else {
      setEditingKit(null);
      setKitCode(`FAK-00${kits.length + 1}`);
      setKitName('');
      setKitLocation('');
      setKitIsActive(true);
    }
    setIsKitModalOpen(true);
  };

  // Save Kit (Create or Update)
  const handleSaveKit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kitCode.trim() || !kitName.trim() || !kitLocation.trim()) {
      alert('Please fill in Kit Code, Name, and Location.');
      return;
    }

    try {
      if (editingKit) {
        const updated = await updateFirstAidKit(editingKit.id, {
          kit_code: kitCode.trim(),
          kit_name: kitName.trim(),
          location: kitLocation.trim(),
          is_active: kitIsActive,
        });
        if (updated) {
          setKits((prev) => prev.map((k) => (k.id === editingKit.id ? updated : k)));
        }
      } else {
        const created = await createFirstAidKit({
          kit_code: kitCode.trim(),
          kit_name: kitName.trim(),
          location: kitLocation.trim(),
          is_active: kitIsActive,
        });
        setKits((prev) => [...prev, created]);
      }
      setIsKitModalOpen(false);
    } catch (err: any) {
      alert(`Error saving kit: ${err.message || err}`);
    }
  };

  // Delete Kit
  const handleDeleteKit = async (kitId: string, kitName: string) => {
    if (
      window.confirm(
        `Are you sure you want to delete "${kitName}"? All contained items and logs for this kit will be permanently removed.`
      )
    ) {
      await deleteFirstAidKit(kitId);
      setKits((prev) => prev.filter((k) => k.id !== kitId));
      setItems((prev) => prev.filter((i) => i.kit_id !== kitId));
    }
  };

  // Toggle Kit Active/Inactive status
  const handleToggleKitStatus = async (kit: FirstAidKit) => {
    const updated = await updateFirstAidKit(kit.id, { is_active: !kit.is_active });
    if (updated) {
      setKits((prev) => prev.map((k) => (k.id === kit.id ? updated : k)));
    }
  };

  // Open Add/Edit Item Modal
  const handleOpenItemModal = (itemToEdit?: FirstAidItem, defaultKitId?: string) => {
    if (itemToEdit) {
      setEditingItem(itemToEdit);
      setItemKitId(itemToEdit.kit_id);
      setItemName(itemToEdit.item_name);
      setItemQuantity(itemToEdit.quantity);
      setItemMinQuantity(itemToEdit.min_quantity);
      setItemUnit(itemToEdit.unit || 'pcs');
    } else {
      setEditingItem(null);
      setItemKitId(defaultKitId || (kits[0] ? kits[0].id : ''));
      setItemName('');
      setItemQuantity(20);
      setItemMinQuantity(5);
      setItemUnit('pcs');
    }
    setIsItemModalOpen(true);
  };

  // Save Item (Create or Update)
  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemKitId || !itemName.trim()) {
      alert('Please select a First Aid Kit and provide an Item Name.');
      return;
    }

    try {
      if (editingItem) {
        const updated = await updateFirstAidItem(editingItem.id, {
          item_name: itemName.trim(),
          quantity: Math.max(0, Number(itemQuantity)),
          min_quantity: Math.max(0, Number(itemMinQuantity)),
          unit: itemUnit.trim() || 'pcs',
        });
        if (updated) {
          setItems((prev) => prev.map((i) => (i.id === editingItem.id ? updated : i)));
        }
      } else {
        const created = await createFirstAidItem({
          kit_id: itemKitId,
          item_name: itemName.trim(),
          quantity: Math.max(0, Number(itemQuantity)),
          min_quantity: Math.max(0, Number(itemMinQuantity)),
          unit: itemUnit.trim() || 'pcs',
        });
        setItems((prev) => [...prev, created]);
      }
      setIsItemModalOpen(false);
    } catch (err: any) {
      alert(`Error saving item: ${err.message || err}`);
    }
  };

  // Delete Item
  const handleDeleteItem = async (itemId: string, itemName: string) => {
    if (window.confirm(`Are you sure you want to remove "${itemName}" from this kit?`)) {
      await deleteFirstAidItem(itemId);
      setItems((prev) => prev.filter((i) => i.id !== itemId));
    }
  };

  // Open "Take / Use Item" Modal
  const handleOpenUsageModal = (presetKitId?: string, presetItemId?: string) => {
    setUsageError(null);
    setUsageSuccess(null);
    const initialKitId = presetKitId || (kits[0] ? kits[0].id : '');
    setUsageSelectedKitId(initialKitId);

    const kitItems = items.filter((i) => i.kit_id === initialKitId);
    const initialItemId = presetItemId || (kitItems[0] ? kitItems[0].id : '');
    setUsageSelectedItemId(initialItemId);

    setUsageQuantity(1);
    setUsageTakenBy('');
    setUsagePurpose('');
    setIsUsageModalOpen(true);
  };

  // When kit changes in usage modal, update available item selection
  const handleUsageKitChange = (kitId: string) => {
    setUsageSelectedKitId(kitId);
    const kitItems = items.filter((i) => i.kit_id === kitId);
    setUsageSelectedItemId(kitItems[0] ? kitItems[0].id : '');
    setUsageError(null);
  };

  // Selected item object for live calculation in usage modal
  const selectedUsageItem = useMemo(() => {
    return items.find((i) => i.id === usageSelectedItemId);
  }, [items, usageSelectedItemId]);

  // Live calculation of remaining quantity
  const calculatedRemaining = useMemo(() => {
    if (!selectedUsageItem) return 0;
    return selectedUsageItem.quantity - usageQuantity;
  }, [selectedUsageItem, usageQuantity]);

  // Submit Item Usage with Automated Quantity Deduction
  const handleRecordUsage = async (e: React.FormEvent) => {
    e.preventDefault();
    setUsageError(null);
    setUsageSuccess(null);

    if (!usageSelectedKitId || !usageSelectedItemId) {
      setUsageError('Please select both a First Aid Kit and an Item.');
      return;
    }

    if (!selectedUsageItem) {
      setUsageError('Selected item not found.');
      return;
    }

    if (usageQuantity <= 0) {
      setUsageError('Quantity used must be at least 1.');
      return;
    }

    if (usageQuantity > selectedUsageItem.quantity) {
      setUsageError(
        `Cannot deduct ${usageQuantity} ${selectedUsageItem.unit || 'pcs'}. Only ${selectedUsageItem.quantity} available in this kit!`
      );
      return;
    }

    try {
      const result = await recordItemUsage({
        kit_id: usageSelectedKitId,
        item_id: usageSelectedItemId,
        quantity_used: usageQuantity,
        taken_by: usageTakenBy.trim() || 'Staff Member',
        purpose: usagePurpose.trim() || 'Treatment',
      });

      // Update local state
      setItems((prev) => prev.map((i) => (i.id === result.item.id ? result.item : i)));
      setLogs((prev) => [result.log, ...prev]);

      setUsageSuccess(
        `Successfully deducted ${usageQuantity} ${result.item.unit || 'pcs'} of "${result.item.item_name}". Remaining balance: ${result.remaining_quantity}. ${
          result.is_low_stock ? '⚠️ LOW STOCK ALERT TRIGGERED!' : ''
        }`
      );

      // Close after short delay or keep open for confirmation
      setTimeout(() => {
        setIsUsageModalOpen(false);
      }, 1500);
    } catch (err: any) {
      setUsageError(err.message || 'Failed to record item usage.');
    }
  };

  // Copy SQL script to clipboard
  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA_SCRIPT);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Header */}
      <div className="glass-card p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-t-4 border-emerald-600">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToHome}
            className="p-2.5 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors shadow-sm"
            title="Back to HSE Dashboard"
          >
            <span className="material-symbols-outlined text-xl">arrow_back</span>
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400 text-2xl">
                medical_services
              </span>
              <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                First Aid Kit Management
              </h1>
            </div>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
              Live inventory tracking, automated usage deduction, and Supabase cloud synchronization
            </p>
          </div>
        </div>

        {/* Action Buttons & Supabase Status Badge */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-start md:justify-end">
          {/* Supabase Status Pill */}
          <button
            onClick={() => setIsSqlModalOpen(true)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold border flex items-center gap-1.5 transition-all shadow-sm ${
              dbStatus.hasTables
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                : 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
            }`}
            title="Click to view database schema & setup instructions"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                dbStatus.hasTables ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
              }`}
            ></span>
            <span>{dbStatus.hasTables ? 'Supabase Connected' : 'Local / SQL Setup'}</span>
            <span className="material-symbols-outlined text-sm">database</span>
          </button>

          {/* Quick Action: Take / Use Item */}
          <button
            onClick={() => handleOpenUsageModal()}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-md shadow-red-600/20 transition-all hover:scale-[1.02] active:scale-95"
          >
            <span className="material-symbols-outlined text-base">remove_circle</span>
            <span>Take / Use Item</span>
          </button>

          {/* Add New Kit */}
          <button
            onClick={() => handleOpenKitModal()}
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-md shadow-blue-600/20 transition-all hover:scale-[1.02] active:scale-95"
          >
            <span className="material-symbols-outlined text-base">add_box</span>
            <span>Add First Aid Kit</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Kits */}
        <div className="glass-card p-4 flex items-center justify-between border-l-4 border-blue-600">
          <div>
            <p className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
              Total First Aid Kits
            </p>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {metrics.totalKits}
            </p>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
              {metrics.activeKits} Active on Site
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <span className="material-symbols-outlined text-2xl">medical_information</span>
          </div>
        </div>

        {/* Total Tracked Items */}
        <div className="glass-card p-4 flex items-center justify-between border-l-4 border-emerald-600">
          <div>
            <p className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
              Supplies Tracked
            </p>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {metrics.totalItemsCount}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
              {metrics.totalQuantitySum} total units
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <span className="material-symbols-outlined text-2xl">inventory_2</span>
          </div>
        </div>

        {/* Low Stock Alert Button Card */}
        <div
          onClick={() => setFilterLowStockOnly(!filterLowStockOnly)}
          className={`glass-card p-4 flex items-center justify-between border-l-4 border-red-500 cursor-pointer transition-all hover:shadow-md ${
            filterLowStockOnly ? 'ring-2 ring-red-500 bg-red-50/20 dark:bg-red-950/20' : ''
          }`}
        >
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-[11px] font-bold text-red-600 dark:text-red-400 uppercase tracking-wider">
                Low Stock Alerts
              </p>
              {filterLowStockOnly && (
                <span className="text-[10px] bg-red-600 text-white px-1.5 py-0.2 rounded font-bold">
                  ACTIVE
                </span>
              )}
            </div>
            <p className="text-2xl font-black text-red-600 dark:text-red-400 mt-1">
              {metrics.lowStockCount}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
              {filterLowStockOnly ? 'Click to show all items' : 'Click to filter items below min.'}
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center">
            <span className="material-symbols-outlined text-2xl">warning</span>
          </div>
        </div>

        {/* Usage Logs Count */}
        <div className="glass-card p-4 flex items-center justify-between border-l-4 border-indigo-600">
          <div>
            <p className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
              Recorded Usages
            </p>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {logs.length}
            </p>
            <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold mt-0.5">
              Audit trail intact
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <span className="material-symbols-outlined text-2xl">history</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs, Search & Filters Bar */}
      <div className="glass-card p-3 sm:p-4 space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          
          {/* Main Module Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-zinc-800/80 p-1 rounded-xl overflow-x-auto scrollbar-none">
            <button
              onClick={() => setActiveTab('kits')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all whitespace-nowrap ${
                activeTab === 'kits'
                  ? 'bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-base">emergency</span>
              <span>Kits Overview ({kits.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('items')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all whitespace-nowrap ${
                activeTab === 'items'
                  ? 'bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-base">format_list_numbered</span>
              <span>All Items Inventory ({items.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('logs')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all whitespace-nowrap ${
                activeTab === 'logs'
                  ? 'bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-base">receipt_long</span>
              <span>Usage Logs ({logs.length})</span>
            </button>
          </div>

          {/* Search Input */}
          <div className="flex items-center gap-2 flex-grow max-w-md">
            <div className="relative w-full">
              <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-lg">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search kit code, item name, location..."
                className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  <span className="material-symbols-outlined text-base">close</span>
                </button>
              )}
            </div>

            {/* Low Stock Toggle Button */}
            <button
              onClick={() => setFilterLowStockOnly(!filterLowStockOnly)}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap border ${
                filterLowStockOnly
                  ? 'bg-red-600 text-white border-red-600 shadow-sm'
                  : 'bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-800 hover:border-red-400'
              }`}
              title="Show only items where Quantity <= Minimum Quantity"
            >
              <span className="material-symbols-outlined text-sm">warning</span>
              <span>Low Stock Only</span>
            </button>
          </div>
        </div>

        {/* Kit Filter Dropdown (When on Items tab) */}
        {activeTab === 'items' && (
          <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800/80 overflow-x-auto pb-1">
            <span className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase whitespace-nowrap">
              Filter By Kit:
            </span>
            <button
              onClick={() => setSelectedKitFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${
                selectedKitFilter === 'ALL'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300'
              }`}
            >
              All Kits ({items.length})
            </button>
            {kits.map((kit) => {
              const count = items.filter((i) => i.kit_id === kit.id).length;
              return (
                <button
                  key={kit.id}
                  onClick={() => setSelectedKitFilter(kit.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap flex items-center gap-1 ${
                    selectedKitFilter === kit.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300'
                  }`}
                >
                  <span>{kit.kit_code}</span>
                  <span className="opacity-75">({count})</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* TAB 1: KITS OVERVIEW CARDS */}
      {activeTab === 'kits' && (
        <div className="space-y-4">
          {filteredKits.length === 0 ? (
            <div className="glass-card p-12 text-center text-slate-500 dark:text-zinc-400">
              <span className="material-symbols-outlined text-4xl mb-2 text-slate-400">
                search_off
              </span>
              <p className="font-bold text-base">No First Aid Kits Found</p>
              <p className="text-xs mt-1">Try adjusting your search query or add a new First Aid Kit.</p>
              <button
                onClick={() => handleOpenKitModal()}
                className="mt-4 px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs"
              >
                Add First Aid Kit
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {filteredKits.map((kit) => {
                const kitItems = items.filter((i) => i.kit_id === kit.id);
                const lowStockItems = kitItems.filter(isLowStock);
                const hasLowStock = lowStockItems.length > 0;

                return (
                  <div
                    key={kit.id}
                    className={`glass-card p-5 rounded-2xl flex flex-col justify-between border-t-4 transition-all shadow-sm hover:shadow-md ${
                      !kit.is_active
                        ? 'border-slate-400 opacity-70'
                        : hasLowStock
                        ? 'border-red-500'
                        : 'border-emerald-500'
                    }`}
                  >
                    <div>
                      {/* Kit Card Top Header */}
                      <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100 dark:border-zinc-800">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-mono font-bold text-xs">
                              {kit.kit_code}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                kit.is_active
                                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                                  : 'bg-slate-200 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400'
                              }`}
                            >
                              {kit.is_active ? 'Active' : 'Deactivated'}
                            </span>
                            {hasLowStock && (
                              <span className="px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 text-[10px] font-bold flex items-center gap-1 animate-pulse">
                                <span className="material-symbols-outlined text-xs">warning</span>
                                <span>{lowStockItems.length} LOW STOCK</span>
                              </span>
                            )}
                          </div>
                          <h2 className="text-base font-bold text-slate-900 dark:text-white mt-1.5">
                            {kit.kit_name}
                          </h2>
                          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-zinc-400 mt-1">
                            <span className="material-symbols-outlined text-sm text-slate-400">
                              location_on
                            </span>
                            <span>{kit.location}</span>
                          </div>
                        </div>

                        {/* Kit Options Menu */}
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleOpenKitModal(kit)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                            title="Edit Kit details"
                          >
                            <span className="material-symbols-outlined text-lg">edit</span>
                          </button>
                          <button
                            onClick={() => handleToggleKitStatus(kit)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              kit.is_active
                                ? 'text-amber-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                                : 'text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                            }`}
                            title={kit.is_active ? 'Deactivate Kit' : 'Activate Kit'}
                          >
                            <span className="material-symbols-outlined text-lg">
                              {kit.is_active ? 'toggle_on' : 'toggle_off'}
                            </span>
                          </button>
                          <button
                            onClick={() => handleDeleteKit(kit.id, kit.kit_name)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                            title="Delete Kit"
                          >
                            <span className="material-symbols-outlined text-lg">delete</span>
                          </button>
                        </div>
                      </div>

                      {/* Items List Inside Kit */}
                      <div className="mt-3 space-y-2">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-zinc-400 pb-1">
                          <span>SUPPLIES IN KIT ({kitItems.length})</span>
                          <button
                            onClick={() => handleOpenItemModal(undefined, kit.id)}
                            className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5 text-xs font-semibold"
                          >
                            <span className="material-symbols-outlined text-sm">add</span>
                            <span>Add Item</span>
                          </button>
                        </div>

                        {kitItems.length === 0 ? (
                          <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-900/60 text-center text-xs text-slate-400">
                            No items added yet. Click &quot;Add Item&quot; to stock this First Aid Kit.
                          </div>
                        ) : (
                          <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                            {kitItems.map((item) => {
                              const low = isLowStock(item);
                              return (
                                <div
                                  key={item.id}
                                  className={`p-2.5 rounded-xl border text-xs flex items-center justify-between transition-colors ${
                                    low
                                      ? 'bg-red-50/70 dark:bg-red-950/30 border-red-200 dark:border-red-900/50'
                                      : 'bg-slate-50 dark:bg-zinc-900/60 border-slate-200/60 dark:border-zinc-800'
                                  }`}
                                >
                                  <div className="flex flex-col truncate pr-2">
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-semibold text-slate-900 dark:text-white truncate">
                                        {item.item_name}
                                      </span>
                                      {low && (
                                        <span className="px-1.5 py-0.2 rounded bg-red-600 text-white font-bold text-[9px] uppercase tracking-wider flex-shrink-0">
                                          LOW STOCK
                                        </span>
                                      )}
                                    </div>
                                    <span className="text-[10px] text-slate-500 dark:text-zinc-400">
                                      Min: {item.min_quantity} {item.unit || 'pcs'}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-2 flex-shrink-0">
                                    <div className="text-right">
                                      <span
                                        className={`font-black text-sm ${
                                          low
                                            ? 'text-red-600 dark:text-red-400'
                                            : 'text-slate-900 dark:text-white'
                                        }`}
                                      >
                                        {item.quantity}
                                      </span>
                                      <span className="text-[10px] text-slate-400 ml-1">
                                        {item.unit || 'pcs'}
                                      </span>
                                    </div>

                                    {/* Quick Take Button */}
                                    <button
                                      onClick={() => handleOpenUsageModal(kit.id, item.id)}
                                      disabled={item.quantity <= 0}
                                      className="p-1 rounded-lg bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 hover:bg-rose-200 dark:hover:bg-rose-900 transition-colors disabled:opacity-30"
                                      title="Take / Use from this item"
                                    >
                                      <span className="material-symbols-outlined text-sm">
                                        remove
                                      </span>
                                    </button>

                                    {/* Edit Item */}
                                    <button
                                      onClick={() => handleOpenItemModal(item)}
                                      className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 hover:bg-slate-200 dark:hover:bg-zinc-800 transition-colors"
                                      title="Edit item"
                                    >
                                      <span className="material-symbols-outlined text-sm">
                                        edit
                                      </span>
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bottom Kit Actions */}
                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between gap-2">
                      <button
                        onClick={() => handleOpenItemModal(undefined, kit.id)}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 font-semibold text-xs hover:border-blue-500 transition-colors flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-sm">add</span>
                        <span>Add Supplies</span>
                      </button>

                      <button
                        onClick={() => handleOpenUsageModal(kit.id)}
                        className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1 shadow-sm transition-colors"
                      >
                        <span className="material-symbols-outlined text-sm">remove_circle</span>
                        <span>Use Supplies</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ALL ITEMS INVENTORY TABLE */}
      {activeTab === 'items' && (
        <div className="glass-card rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-100 dark:border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white uppercase">
                First Aid Supplies Master Inventory
              </h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Showing {filteredItems.length} items. Red rows indicate stock equal to or below minimum threshold.
              </p>
            </div>
            <button
              onClick={() => handleOpenItemModal()}
              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm"
            >
              <span className="material-symbols-outlined text-sm">add</span>
              <span>Add New Item</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/80 dark:bg-zinc-800/80 text-slate-600 dark:text-zinc-300 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-zinc-700">
                  <th className="py-3 px-4">Item Name</th>
                  <th className="py-3 px-4">First Aid Kit & Location</th>
                  <th className="py-3 px-4 text-center">Current Quantity</th>
                  <th className="py-3 px-4 text-center">Minimum Threshold</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                      No supplies match the current filter.
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => {
                    const parentKit = kits.find((k) => k.id === item.kit_id);
                    const low = isLowStock(item);

                    return (
                      <tr
                        key={item.id}
                        className={`hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors ${
                          low ? 'bg-red-50/40 dark:bg-red-950/20' : ''
                        }`}
                      >
                        <td className="py-3 px-4">
                          <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                            {item.item_name}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {parentKit ? (
                            <div>
                              <span className="font-semibold text-blue-600 dark:text-blue-400">
                                {parentKit.kit_code} - {parentKit.kit_name}
                              </span>
                              <p className="text-[11px] text-slate-400">{parentKit.location}</p>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">Unassigned Kit</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`font-black text-sm sm:text-base ${
                              low ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-white'
                            }`}
                          >
                            {item.quantity}
                          </span>
                          <span className="text-slate-400 text-[10px] ml-1">
                            {item.unit || 'pcs'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center font-semibold text-slate-500 dark:text-zinc-400">
                          {item.min_quantity} {item.unit || 'pcs'}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {low ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 font-bold text-[10px] tracking-wider uppercase border border-red-200 dark:border-red-900/50 animate-pulse">
                              <span className="material-symbols-outlined text-xs">warning</span>
                              <span>LOW STOCK</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold text-[10px] tracking-wider uppercase border border-emerald-200 dark:border-emerald-900/50">
                              <span className="material-symbols-outlined text-xs">check_circle</span>
                              <span>SUFFICIENT</span>
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Fast Action: Take / Use Item */}
                            <button
                              onClick={() => handleOpenUsageModal(item.kit_id, item.id)}
                              disabled={item.quantity <= 0}
                              className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1 transition-colors disabled:opacity-30"
                              title="Deduct used quantity"
                            >
                              <span className="material-symbols-outlined text-xs">remove</span>
                              <span>Use</span>
                            </button>

                            {/* Edit */}
                            <button
                              onClick={() => handleOpenItemModal(item)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                              title="Edit item"
                            >
                              <span className="material-symbols-outlined text-sm">edit</span>
                            </button>

                            {/* Delete */}
                            <button
                              onClick={() => handleDeleteItem(item.id, item.item_name)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                              title="Delete item"
                            >
                              <span className="material-symbols-outlined text-sm">delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: USAGE LOGS AUDIT TRAIL */}
      {activeTab === 'logs' && (
        <div className="glass-card rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white uppercase">
                First Aid Item Usage History
              </h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Detailed audit trail of quantities deducted, staff personnel, and treatment purposes.
              </p>
            </div>
            <button
              onClick={() => handleOpenUsageModal()}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 text-white font-bold text-xs flex items-center gap-1 shadow-sm"
            >
              <span className="material-symbols-outlined text-sm">remove_circle</span>
              <span>Record Usage</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/80 dark:bg-zinc-800/80 text-slate-600 dark:text-zinc-300 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-zinc-700">
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">First Aid Kit</th>
                  <th className="py-3 px-4">Item Taken</th>
                  <th className="py-3 px-4 text-center">Qty Deducted</th>
                  <th className="py-3 px-4 text-center">Remaining</th>
                  <th className="py-3 px-4">Taken By</th>
                  <th className="py-3 px-4">Treatment Purpose / Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                      No usage logs recorded yet. Use &quot;Take / Use Item&quot; to begin tracking deductions.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors">
                      <td className="py-3 px-4 text-slate-500 dark:text-zinc-400 whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString('en-MY', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800 dark:text-zinc-200">
                        {log.kit_name || 'Kit'}
                      </td>
                      <td className="py-3 px-4 font-bold text-blue-600 dark:text-blue-400">
                        {log.item_name}
                      </td>
                      <td className="py-3 px-4 text-center font-black text-red-600 dark:text-red-400">
                        -{log.quantity_used}
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-slate-700 dark:text-zinc-300">
                        {log.remaining_quantity !== undefined ? log.remaining_quantity : '-'}
                      </td>
                      <td className="py-3 px-4 text-slate-800 dark:text-zinc-200 font-medium">
                        {log.taken_by || 'Staff'}
                      </td>
                      <td className="py-3 px-4 text-slate-500 dark:text-zinc-400">
                        {log.purpose || 'General First Aid'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: ADD / EDIT FIRST AID KIT */}
      {/* ========================================================================= */}
      {isKitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-md w-full p-5 sm:p-6 border border-slate-200 dark:border-zinc-800 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800 mb-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-600 text-2xl">medical_information</span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white uppercase">
                  {editingKit ? 'Edit First Aid Kit' : 'Add New First Aid Kit'}
                </h3>
              </div>
              <button
                onClick={() => setIsKitModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveKit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase mb-1">
                  Kit Code *
                </label>
                <input
                  type="text"
                  required
                  value={kitCode}
                  onChange={(e) => setKitCode(e.target.value.toUpperCase())}
                  placeholder="e.g. FAK-W01"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-[10px] text-slate-400 mt-0.5">Unique identifier for physical kit label.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase mb-1">
                  Kit Name *
                </label>
                <input
                  type="text"
                  required
                  value={kitName}
                  onChange={(e) => setKitName(e.target.value)}
                  placeholder="e.g. Fabrication Workshop Kit A"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase mb-1">
                  Location *
                </label>
                <input
                  type="text"
                  required
                  value={kitLocation}
                  onChange={(e) => setKitLocation(e.target.value)}
                  placeholder="e.g. Fabrication Yard Pillar 4"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="kitActiveCheck"
                  checked={kitIsActive}
                  onChange={(e) => setKitIsActive(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <label htmlFor="kitActiveCheck" className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  Kit is Active on Site
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsKitModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 text-xs font-bold hover:bg-slate-50 dark:hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20"
                >
                  {editingKit ? 'Save Changes' : 'Create Kit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: ADD / EDIT FIRST AID ITEM */}
      {/* ========================================================================= */}
      {isItemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-md w-full p-5 sm:p-6 border border-slate-200 dark:border-zinc-800 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800 mb-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-600 text-2xl">healing</span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white uppercase">
                  {editingItem ? 'Edit First Aid Item' : 'Add First Aid Item'}
                </h3>
              </div>
              <button
                onClick={() => setIsItemModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase mb-1">
                  Assign to First Aid Kit *
                </label>
                <select
                  required
                  value={itemKitId}
                  onChange={(e) => setItemKitId(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {kits.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.kit_code} - {k.kit_name} ({k.location})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase mb-1">
                  Item Name *
                </label>
                <input
                  type="text"
                  required
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  placeholder="e.g. Waterproof Plasters, Gauze Swabs, Gloves..."
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase mb-1">
                    Current Quantity *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={itemQuantity}
                    onChange={(e) => setItemQuantity(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase mb-1">
                    Minimum Quantity *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={itemMinQuantity}
                    onChange={(e) => setItemMinQuantity(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">Triggers LOW STOCK if ≤ this number.</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase mb-1">
                  Unit of Measure
                </label>
                <select
                  value={itemUnit}
                  onChange={(e) => setItemUnit(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="pcs">pcs (pieces)</option>
                  <option value="rolls">rolls</option>
                  <option value="packs">packs</option>
                  <option value="pairs">pairs</option>
                  <option value="sachets">sachets</option>
                  <option value="bottles">bottles</option>
                  <option value="boxes">boxes</option>
                </select>
              </div>

              {/* Status preview */}
              <div
                className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                  itemQuantity <= itemMinQuantity
                    ? 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900 text-red-700 dark:text-red-300'
                    : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300'
                }`}
              >
                <span>Preview Stock Status:</span>
                <span className="font-bold">
                  {itemQuantity <= itemMinQuantity ? '⚠️ LOW STOCK' : '✅ SUFFICIENT'}
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsItemModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 text-xs font-bold hover:bg-slate-50 dark:hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20"
                >
                  {editingItem ? 'Save Item' : 'Add Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: ITEM USAGE & AUTOMATIC QUANTITY DEDUCTION */}
      {/* ========================================================================= */}
      {isUsageModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-md w-full p-5 sm:p-6 border border-slate-200 dark:border-zinc-800 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800 mb-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-rose-600 text-2xl">remove_circle</span>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white uppercase">
                    Take / Use First Aid Item
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                    System automatically deducts quantity and logs the action.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsUsageModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {usageSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-600">check_circle</span>
                <span>{usageSuccess}</span>
              </div>
            )}

            {usageError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 text-xs font-semibold flex items-center gap-2">
                <span className="material-symbols-outlined text-red-600">error</span>
                <span>{usageError}</span>
              </div>
            )}

            <form onSubmit={handleRecordUsage} className="space-y-4">
              {/* Step 1: Select Kit */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase mb-1">
                  1. Select First Aid Kit *
                </label>
                <select
                  required
                  value={usageSelectedKitId}
                  onChange={(e) => handleUsageKitChange(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-rose-500"
                >
                  {kits.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.kit_code} - {k.kit_name} ({k.location})
                    </option>
                  ))}
                </select>
              </div>

              {/* Step 2: Select Item */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase mb-1">
                  2. Select Item *
                </label>
                <select
                  required
                  value={usageSelectedItemId}
                  onChange={(e) => {
                    setUsageSelectedItemId(e.target.value);
                    setUsageError(null);
                  }}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-rose-500"
                >
                  {items
                    .filter((i) => i.kit_id === usageSelectedKitId)
                    .map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.item_name} (Current: {item.quantity} {item.unit || 'pcs'} | Min:{' '}
                        {item.min_quantity})
                      </option>
                    ))}
                </select>
              </div>

              {/* Step 3: Enter Quantity Used */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase mb-1">
                  3. Quantity Used *
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setUsageQuantity((q) => Math.max(1, q - 1))}
                    className="w-10 h-10 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-100 dark:bg-zinc-800 font-bold text-lg text-slate-700 dark:text-zinc-200 hover:bg-slate-200"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    max={selectedUsageItem ? selectedUsageItem.quantity : 999}
                    required
                    value={usageQuantity}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 1;
                      setUsageQuantity(val);
                      setUsageError(null);
                    }}
                    className="w-full py-2 px-3 text-center text-base rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-white font-black focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedUsageItem && usageQuantity < selectedUsageItem.quantity) {
                        setUsageQuantity((q) => q + 1);
                      }
                    }}
                    className="w-10 h-10 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-100 dark:bg-zinc-800 font-bold text-lg text-slate-700 dark:text-zinc-200 hover:bg-slate-200"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Automated Calculation & Negative Protection Box */}
              {selectedUsageItem && (
                <div
                  className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
                    calculatedRemaining < 0
                      ? 'bg-red-100 dark:bg-red-950 border-red-300 text-red-900 dark:text-red-200'
                      : calculatedRemaining <= selectedUsageItem.min_quantity
                      ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 text-amber-900 dark:text-amber-200'
                      : 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 text-blue-900 dark:text-blue-200'
                  }`}
                >
                  <div className="flex justify-between font-medium">
                    <span>Current Stock:</span>
                    <span className="font-bold">
                      {selectedUsageItem.quantity} {selectedUsageItem.unit || 'pcs'}
                    </span>
                  </div>
                  <div className="flex justify-between font-medium text-rose-600 dark:text-rose-400">
                    <span>Quantity Used (Deducted):</span>
                    <span className="font-bold">
                      -{usageQuantity} {selectedUsageItem.unit || 'pcs'}
                    </span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-slate-200 dark:border-zinc-700/60 font-black text-sm">
                    <span>Remaining Balance:</span>
                    <span
                      className={
                        calculatedRemaining < 0
                          ? 'text-red-600 underline'
                          : calculatedRemaining <= selectedUsageItem.min_quantity
                          ? 'text-amber-600'
                          : 'text-emerald-600'
                      }
                    >
                      {calculatedRemaining} {selectedUsageItem.unit || 'pcs'}
                    </span>
                  </div>

                  {/* Dynamic Alert Messages */}
                  {calculatedRemaining < 0 ? (
                    <p className="text-[11px] font-bold text-red-600 pt-1 flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">block</span>
                      <span>Cannot deduct more than current stock! Negative values not allowed.</span>
                    </p>
                  ) : calculatedRemaining <= selectedUsageItem.min_quantity ? (
                    <p className="text-[11px] font-bold text-amber-600 pt-1 flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">warning</span>
                      <span>Warning: Remaining stock will trigger LOW STOCK status (Min: {selectedUsageItem.min_quantity}).</span>
                    </p>
                  ) : null}
                </div>
              )}

              {/* Taken By */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase mb-1">
                  Taken By (Staff Name / Personnel)
                </label>
                <input
                  type="text"
                  value={usageTakenBy}
                  onChange={(e) => setUsageTakenBy(e.target.value)}
                  placeholder="e.g. Ahmad Faiz (Fitter)"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              {/* Purpose / Injury Note */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase mb-1">
                  Purpose / Treatment Details (Optional)
                </label>
                <input
                  type="text"
                  value={usagePurpose}
                  onChange={(e) => setUsagePurpose(e.target.value)}
                  placeholder="e.g. Minor finger scrape during bevel grinding"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsUsageModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 text-xs font-bold hover:bg-slate-50 dark:hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={calculatedRemaining < 0}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white text-xs font-bold shadow-md shadow-red-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-sm">remove_circle</span>
                  <span>Confirm Deduction</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: SUPABASE SQL SCHEMA & SETUP INSTRUCTIONS */}
      {/* ========================================================================= */}
      {isSqlModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-2xl w-full p-5 sm:p-6 border border-slate-200 dark:border-zinc-800 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800 mb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-600 text-2xl">database</span>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white uppercase">
                    Supabase Database Setup
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                    Execute this SQL query in your Supabase SQL Editor to initialize the tables.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsSqlModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Status explanation */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700 text-xs mb-3 space-y-1">
              <div className="flex items-center gap-2">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    dbStatus.hasTables ? 'bg-emerald-500' : 'bg-amber-500'
                  }`}
                ></span>
                <span className="font-bold text-slate-800 dark:text-zinc-200">
                  Current Status: {dbStatus.message}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                Environment variables: <code className="bg-slate-200 dark:bg-zinc-700 px-1 py-0.5 rounded">SUPABASE_URL</code> &amp; <code className="bg-slate-200 dark:bg-zinc-700 px-1 py-0.5 rounded">SUPABASE_ANON_KEY</code>.
              </p>
            </div>

            {/* SQL Code Block with Copy Button */}
            <div className="relative flex-grow overflow-hidden rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-900 text-slate-200 font-mono text-[11px]">
              <div className="flex items-center justify-between px-3 py-1.5 bg-slate-800 border-b border-slate-700 text-slate-400 text-xs">
                <span>supabase_first_aid_schema.sql</span>
                <button
                  onClick={handleCopySql}
                  className="px-2 py-1 rounded bg-blue-600 text-white font-sans font-bold text-xs hover:bg-blue-700 flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-xs">content_copy</span>
                  <span>{copiedSql ? 'Copied!' : 'Copy SQL'}</span>
                </button>
              </div>
              <pre className="p-3 overflow-y-auto max-h-72 text-slate-300 font-mono text-xs">
                {SUPABASE_SQL_SCHEMA_SCRIPT}
              </pre>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-zinc-800 mt-3">
              <button
                onClick={loadAllData}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-zinc-800 flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-sm">refresh</span>
                <span>Re-check Tables</span>
              </button>
              <button
                onClick={() => setIsSqlModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
