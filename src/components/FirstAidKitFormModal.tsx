import React, { useState } from 'react';

interface FirstAidKitFormModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ITEMS = [
  "STERILE GAUZE PAD", "ADHESIVE BANDAGE", "ANTISEPTIC WIPES", "ADHESIVE TAPE",
  "SCISSORS", "TWEEZERS", "GLOVES", "SAFETY PINS",
  "CPR MASK", "EYE WASH", "THERMOMETER", "TRIANGULAR BANDAGE",
  "ELASTIC BANDAGE", "BURN GEL", "DISPOSABLE BAG", "FIRST AID GUIDE", "COLD PACK"
];

const MOCK_DATA = [
  { model: "Kit A - Main Office", plate: "KIT-A-001", location: "Level 1 Reception", code: "FA-001" },
  { model: "Kit B - Workshop", plate: "KIT-B-002", location: "Workshop Bay 1", code: "FA-002" },
  { model: "Kit C - Site Office", plate: "KIT-C-003", location: "Site Office B", code: "FA-003" }
];

export const FirstAidKitFormModal: React.FC<FirstAidKitFormModalProps> = ({ isOpen, onClose }) => {
  const [selectedModel, setSelectedModel] = useState(MOCK_DATA[0].model);
  const [formData, setFormData] = useState({
    plateNo: MOCK_DATA[0].plate,
    location: MOCK_DATA[0].location,
    code: MOCK_DATA[0].code,
    quantities: Object.fromEntries(ITEMS.map(item => [item, '0']))
  });

  if (!isOpen) return null;

  const handleModelChange = (model: string) => {
    const data = MOCK_DATA.find(d => d.model === model);
    if (data) {
      setSelectedModel(model);
      setFormData(prev => ({
        ...prev,
        plateNo: data.plate,
        location: data.location,
        code: data.code
      }));
    }
  };

  const handleQuantityChange = (item: string, qty: string) => {
    setFormData(prev => ({
      ...prev,
      quantities: { ...prev.quantities, [item]: qty }
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-cyan-500/30 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-bold text-white mb-4">First Aid Kit Inspection Form</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <select 
            value={selectedModel}
            onChange={(e) => handleModelChange(e.target.value)}
            className="p-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
          >
            {MOCK_DATA.map(d => <option key={d.model} value={d.model}>{d.model}</option>)}
          </select>
          <input type="text" value={formData.plateNo} readOnly className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-white" />
          <input type="text" value={formData.location} readOnly className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-white" />
          <input type="text" value={formData.code} readOnly className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-white" />
        </div>

        <div className="space-y-2 mb-6">
          {ITEMS.map(item => (
            <div key={item} className="flex items-center justify-between gap-4">
              <span className="text-sm text-white">{item}</span>
              <input 
                type="number" 
                min="0"
                value={formData.quantities[item]}
                onChange={(e) => handleQuantityChange(item, e.target.value)}
                className="w-20 p-1 rounded bg-slate-800 border border-slate-700 text-white text-center"
              />
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-xl bg-slate-800 text-white">Cancel</button>
          <button onClick={onClose} className="px-4 py-2 rounded-xl bg-cyan-600 text-white">Submit</button>
        </div>
      </div>
    </div>
  );
};
