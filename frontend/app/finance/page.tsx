'use client';

import React, { useState, useEffect } from 'react';
import { formatPKR } from '@/lib/currency';
import { Banknote, Plus, PiggyBank, ReceiptText } from 'lucide-react';
import { financeApi, isAdmin } from '@/lib/api';

export default function FinancialManagementPage() {
  const [financials, setFinancials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    type: 'income',
    category: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
  });
  const admin = isAdmin();

  const fetchFinancialRecords = async () => {
    try {
      const res = await financeApi.list();
      setFinancials(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinancialRecords();
  }, []);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await financeApi.create({
        ...formData,
        amount: parseFloat(formData.amount)
      });
      setShowModal(false);
      setFormData({ type: 'income', category: '', amount: '', date: new Date().toISOString().split('T')[0], description: '' });
      fetchFinancialRecords(); // Refresh data
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this transaction? This can only be done by an admin.')) return;
    try {
      await financeApi.remove(id);
      fetchFinancialRecords();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const totalIncome = financials.filter(f => f.type === 'income').reduce((sum, f) => sum + f.amount, 0);
  const totalExpense = financials.filter(f => f.type === 'expense').reduce((sum, f) => sum + f.amount, 0);
  const netProfit = totalIncome - totalExpense;

  return (
    <div>
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-forest">Financial Management</h1>
          <p className="text-gray-500 text-sm">Track farm income and expenses to monitor profitability.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-forest text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-forest/90 transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Transaction
        </button>
      </div>

      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Total Income</p>
            <h3 className="text-2xl font-bold text-green-700">{formatPKR(totalIncome)}</h3>
          </div>
          <PiggyBank className="w-8 h-8 text-green-500" />
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Total Expenses</p>
            <h3 className="text-2xl font-bold text-red-700">{formatPKR(totalExpense)}</h3>
          </div>
          <ReceiptText className="w-8 h-8 text-red-500" />
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Net Profit</p>
            <h3 className={`text-2xl font-bold ${netProfit >= 0 ? 'text-forest' : 'text-red-700'}`}>{formatPKR(netProfit)}</h3>
          </div>
          <Banknote className={`w-8 h-8 ${netProfit >= 0 ? 'text-lightGreen' : 'text-red-500'}`} />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b text-gray-500 text-xs uppercase tracking-wider">
              <th className="p-4">ID</th>
              <th className="p-4">Date</th>
              <th className="p-4">Type</th>
              <th className="p-4">Category</th>
              <th className="p-4">Description</th>
              <th className="p-4 text-right">Amount</th>
              {admin && <th className="p-4 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {loading ? (
              <tr><td colSpan={7} className="p-6 text-center text-gray-400">Loading financial records...</td></tr>
            ) : financials.length === 0 ? (
              <tr><td colSpan={7} className="p-6 text-center text-gray-400">No financial records found.</td></tr>
            ) : (
              financials.map(f => (
                <tr key={f.id} className="hover:bg-gray-50/50">
                  <td className="p-4 font-medium text-forest">TXN-{f.id}</td>
                  <td className="p-4">{f.date}</td>
                  <td className="p-4 capitalize">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${f.type === 'income' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {f.type}
                    </span>
                  </td>
                  <td className="p-4">{f.category}</td>
                  <td className="p-4 text-gray-600">{f.description || '--'}</td>
                  <td className={`p-4 text-right font-semibold ${f.type === 'income' ? 'text-green-700' : 'text-red-700'}`}>{formatPKR(f.amount)}</td>
                  {admin && (
                    <td className="p-4 text-right">
                      <button onClick={() => handleDelete(f.id)} className="text-red-500 hover:text-red-700 text-xs font-semibold">Delete</button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl">
            <h2 className="text-xl font-bold text-forest mb-4">Add New Transaction</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Type</label>
                <select
                  name="type"
                  required
                  value={formData.type}
                  onChange={handleFormChange}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest/50"
                >
                  <option value="income">Income</option>
                  <option value="expense">Expense</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Category</label>
                <input
                  type="text"
                  required
                  name="category"
                  value={formData.category}
                  onChange={handleFormChange}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest/50"
                  placeholder="e.g. Goat Sales, Feed Purchase"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Amount (PKR)</label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  required
                  name="amount"
                  value={formData.amount}
                  onChange={handleFormChange}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest/50"
                  placeholder="e.g. 45000"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Date</label>
                <input
                  type="date"
                  required
                  name="date"
                  value={formData.date}
                  onChange={handleFormChange}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest/50"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Description (Optional)</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleFormChange}
                  rows={3}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest/50"
                  placeholder="Details about the transaction..."
                ></textarea>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-forest text-white rounded-lg text-sm hover:bg-forest/90"
                >
                  Save Transaction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}