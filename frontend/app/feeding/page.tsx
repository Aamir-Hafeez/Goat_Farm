'use client';

import React, { useState, useEffect } from 'react';
import { Utensils, Warehouse, AlertTriangle, Plus, X } from 'lucide-react';
import { feedingApi, goatApi, isAdmin } from '@/lib/api';

export default function FeedingManagementPage() {
  const [inventory, setInventory] = useState<any[]>([]);
  const [records, setRecords] = useState<any[]>([]);
  const [goats, setGoats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [showRecordModal, setShowRecordModal] = useState(false);
  const admin = isAdmin();

  const [invForm, setInvForm] = useState({ name: '', category: 'Forage', stock_kg: '', min_stock_kg: '50', unit_cost: '', supplier: '' });
  const [recForm, setRecForm] = useState({ feed_id: '', goat_id: '', group_name: '', feed_type: '', amount_kg: '', cost: '', date: new Date().toISOString().split('T')[0], notes: '' });

  const fetchAll = async () => {
    try {
      const [invRes, recRes, goatsRes] = await Promise.all([
        feedingApi.inventory(),
        feedingApi.records(),
        goatApi.list(),
      ]);
      setInventory(invRes.data || []);
      setRecords(recRes.data || []);
      setGoats(goatsRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleAddInventory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await feedingApi.addInventory({ ...invForm, stock_kg: parseFloat(invForm.stock_kg) || 0, min_stock_kg: parseFloat(invForm.min_stock_kg) || 50, unit_cost: parseFloat(invForm.unit_cost) || 0 });
      setShowInventoryModal(false);
      setInvForm({ name: '', category: 'Forage', stock_kg: '', min_stock_kg: '50', unit_cost: '', supplier: '' });
      fetchAll();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteInventory = async (id: number) => {
    if (!confirm('Remove this feed inventory item? This can only be done by an admin.')) return;
    try {
      await feedingApi.removeInventory(id);
      fetchAll();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleAddRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await feedingApi.addRecord({ ...recForm, feed_id: recForm.feed_id || null, goat_id: recForm.goat_id || null, amount_kg: parseFloat(recForm.amount_kg), cost: parseFloat(recForm.cost) || 0 });
      setShowRecordModal(false);
      setRecForm({ feed_id: '', goat_id: '', group_name: '', feed_type: '', amount_kg: '', cost: '', date: new Date().toISOString().split('T')[0], notes: '' });
      fetchAll();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-forest">Feeding & Nutrition Management</h1>
        <p className="text-gray-500 text-sm">Monitor feed inventory, daily schedules, and specialized nutrition for pregnant goats.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-forest flex items-center gap-2">
              <Warehouse className="w-5 h-5" /> Feed Inventory
            </h2>
            <button onClick={() => setShowInventoryModal(true)} className="text-xs font-bold text-forest hover:underline flex items-center gap-1">
              <Plus className="w-3.5 h-3.5" /> Add Stock
            </button>
          </div>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {loading ? (
              <p className="text-sm text-gray-400">Loading inventory...</p>
            ) : inventory.length === 0 ? (
              <p className="text-sm text-gray-400">No feed inventory yet.</p>
            ) : inventory.map((item) => {
              const low = item.stock_kg <= item.min_stock_kg;
              return (
                <div key={item.id} className={`flex justify-between items-center p-3 rounded-lg ${low ? 'bg-red-50 border border-red-100' : 'bg-gray-50'}`}>
                  <div>
                    <p className={`text-sm font-semibold ${low ? 'text-red-900' : 'text-gray-800'}`}><span className="font-mono text-xs opacity-60 mr-1">FEED-{item.id}</span>{item.name}</p>
                    <p className={`text-xs ${low ? 'text-red-700' : 'text-gray-500'}`}>{item.category} · {item.supplier || 'No supplier'}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold ${low ? 'text-red-700' : 'text-forest'}`}>{item.stock_kg} kg</p>
                    <p className={`text-[10px] font-medium uppercase ${low ? 'text-red-600 flex items-center gap-1 justify-end' : 'text-green-600'}`}>
                      {low && <AlertTriangle className="w-2.5 h-2.5" />} {low ? 'Low Stock' : 'In Stock'}
                    </p>
                    {admin && (
                      <button onClick={() => handleDeleteInventory(item.id)} className="text-[10px] text-gray-400 hover:text-red-600 mt-1">Remove</button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-forest flex items-center gap-2">
              <Utensils className="w-5 h-5" /> Feeding Records
            </h2>
            <button onClick={() => setShowRecordModal(true)} className="text-xs font-bold text-forest hover:underline flex items-center gap-1">
              <Plus className="w-3.5 h-3.5" /> Log Feeding
            </button>
          </div>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {records.length === 0 ? (
              <p className="text-sm text-gray-400">No feeding records logged yet.</p>
            ) : records.map((r) => (
              <div key={r.id} className="flex justify-between border-b pb-2 text-sm">
                <div>
                  <p className="font-semibold text-gray-800"><span className="font-mono text-xs text-gray-400 mr-1">FDG-{r.id}</span>{r.feed_type}</p>
                  <p className="text-xs text-gray-500">{r.group_name || (r.goat_id ? `GOAT-${r.goat_id}` : 'General')} · {r.date}</p>
                </div>
                <span className="font-semibold text-forest">{r.amount_kg} kg</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showInventoryModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl relative">
            <button onClick={() => setShowInventoryModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            <h2 className="text-xl font-bold text-forest mb-4">Add Feed Stock</h2>
            <form onSubmit={handleAddInventory} className="space-y-4">
              <input required placeholder="Feed name" value={invForm.name} onChange={(e) => setInvForm({ ...invForm, name: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" />
              <select value={invForm.category} onChange={(e) => setInvForm({ ...invForm, category: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm">
                <option>Forage</option><option>Concentrate</option><option>Minerals</option><option>Kid Feed</option>
              </select>
              <div className="grid grid-cols-2 gap-3">
                <input required type="number" step="0.1" placeholder="Stock (kg)" value={invForm.stock_kg} onChange={(e) => setInvForm({ ...invForm, stock_kg: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" />
                <input type="number" step="0.1" placeholder="Min stock (kg)" value={invForm.min_stock_kg} onChange={(e) => setInvForm({ ...invForm, min_stock_kg: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input type="number" step="0.01" placeholder="Unit cost" value={invForm.unit_cost} onChange={(e) => setInvForm({ ...invForm, unit_cost: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" />
                <input placeholder="Supplier" value={invForm.supplier} onChange={(e) => setInvForm({ ...invForm, supplier: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
              <div className="flex justify-end gap-3 mt-4">
                <button type="button" onClick={() => setShowInventoryModal(false)} className="px-4 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-forest text-white rounded-lg text-sm hover:bg-forest/90">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showRecordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl relative">
            <button onClick={() => setShowRecordModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            <h2 className="text-xl font-bold text-forest mb-4">Log Feeding Record</h2>
            <form onSubmit={handleAddRecord} className="space-y-4">
              <select value={recForm.feed_id} onChange={(e) => setRecForm({ ...recForm, feed_id: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm">
                <option value="">-- Select Feed (optional) --</option>
                {inventory.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
              </select>
              <input required placeholder="Feed type (e.g. Alfalfa Hay)" value={recForm.feed_type} onChange={(e) => setRecForm({ ...recForm, feed_type: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" />
              <select value={recForm.goat_id} onChange={(e) => setRecForm({ ...recForm, goat_id: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm">
                <option value="">-- Group feeding (no specific goat) --</option>
                {goats.map((g) => <option key={g.id} value={g.id}>{g.name} (ID: {g.id})</option>)}
              </select>
              <input placeholder="Group name (e.g. Maternity Pen)" value={recForm.group_name} onChange={(e) => setRecForm({ ...recForm, group_name: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" />
              <div className="grid grid-cols-2 gap-3">
                <input required type="number" step="0.1" placeholder="Amount (kg)" value={recForm.amount_kg} onChange={(e) => setRecForm({ ...recForm, amount_kg: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" />
                <input type="number" step="0.01" placeholder="Cost" value={recForm.cost} onChange={(e) => setRecForm({ ...recForm, cost: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
              <input required type="date" value={recForm.date} onChange={(e) => setRecForm({ ...recForm, date: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" />
              <div className="flex justify-end gap-3 mt-4">
                <button type="button" onClick={() => setShowRecordModal(false)} className="px-4 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-forest text-white rounded-lg text-sm hover:bg-forest/90">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
