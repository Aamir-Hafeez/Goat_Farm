'use client';

import React, { useState, useEffect } from 'react';
import { goatApi, breedingApi, isAdmin, canEditRecord } from '@/lib/api';
import { GitMerge, AlertTriangle, CheckCircle2, Calendar as CalIcon, Trash2 } from 'lucide-react';

export default function BreedingManagementPage() {
  const [goats, setGoats] = useState<any[]>([]);
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    female_id: '',
    male_id: '',
    mating_date: new Date().toISOString().split('T')[0],
  });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const admin = isAdmin();

  const fetchData = async () => {
    try {
      const [goatsRes, recordsRes] = await Promise.all([goatApi.list(), breedingApi.list()]);
      setGoats(goatsRes.data);
      setRecords(recordsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    try {
      await breedingApi.create(formData);
      setMessage({ type: 'success', text: 'Mating record created successfully!' });
      setFormData({ ...formData, female_id: '', male_id: '' });
      fetchData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this breeding record? This can only be done by an admin.')) return;
    try {
      await breedingApi.remove(id);
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const females = goats.filter((g) => g.gender === 'female');
  const males = goats.filter((g) => g.gender === 'male');

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-forest">Breeding Management</h1>
        <p className="text-gray-500 text-sm">Coordinate breeding pairs and maintain genetic diversity.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 card">
          <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-3">
            <GitMerge className="w-6 h-6 text-forest" /> Record New Mating
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            {message && (
              <div
                className={`p-4 rounded-xl text-sm flex items-center gap-3 border ${
                  message.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
                }`}
              >
                {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                {message.text}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Select Doe (Female)</label>
                <select
                  required
                  value={formData.female_id}
                  onChange={(e) => setFormData({ ...formData, female_id: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-lightGreen"
                >
                  <option value="">-- Choose Doe --</option>
                  {females.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name} (ID: {g.id})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Select Buck (Male)</label>
                <select
                  required
                  value={formData.male_id}
                  onChange={(e) => setFormData({ ...formData, male_id: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-lightGreen"
                >
                  <option value="">-- Choose Buck --</option>
                  {males.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name} (ID: {g.id})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Mating Date</label>
              <input
                type="date"
                required
                value={formData.mating_date}
                onChange={(e) => setFormData({ ...formData, mating_date: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-lightGreen"
              />
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full">
              Confirm Mating Attempt
            </button>
          </form>
        </div>

        <div className="space-y-6">
          <div className="card">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" /> Breeding Policy
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Genetic diversity is crucial. Our inbreeding prevention system automatically flags potential risks for all new pairings.
            </p>
          </div>

          <div className="card">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <CalIcon className="w-5 h-5 text-forest" /> Quick Metrics
            </h3>
            <ul className="space-y-4 text-sm">
              <li className="flex justify-between items-center pb-2 border-b">
                <span className="text-gray-500">Gestation Period</span>
                <span className="font-bold text-forest">150 Days</span>
              </li>
              <li className="flex justify-between items-center">
                <span className="text-gray-500">Cycle Interval</span>
                <span className="font-bold text-forest">21 Days</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="card overflow-x-auto">
        <div className="card-header">
          <h2 className="text-xl font-bold text-gray-800">Breeding History</h2>
        </div>
        <table className="min-w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="p-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">ID</th>
              <th className="p-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Doe</th>
              <th className="p-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Buck</th>
              <th className="p-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Mating Date</th>
              <th className="p-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Method</th>
              <th className="p-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
              {admin && <th className="p-4 text-xs font-semibold text-gray-600 uppercase tracking-wider text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {loading ? (
              <tr><td colSpan={7} className="p-6 text-center text-gray-400">Loading records...</td></tr>
            ) : records.length === 0 ? (
              <tr><td colSpan={7} className="p-6 text-center text-gray-400">No breeding records yet.</td></tr>
            ) : (
              records.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50/50">
                  <td className="p-4 font-medium text-forest">BRD-{r.id}</td>
                  <td className="p-4 font-semibold text-gray-800">{r.female_name} <span className="text-xs font-normal text-gray-400">(GOAT-{r.female_id})</span></td>
                  <td className="p-4">{r.male_name} <span className="text-xs text-gray-400">(GOAT-{r.male_id})</span></td>
                  <td className="p-4">{r.mating_date}</td>
                  <td className="p-4">{r.method}</td>
                  <td className="p-4">
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">{r.status}</span>
                  </td>
                  {admin && (
                    <td className="p-4 text-right">
                      <button onClick={() => handleDelete(r.id)} className="text-red-500 hover:text-red-700">
                        <Trash2 className="w-4 h-4 inline-block" />
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
