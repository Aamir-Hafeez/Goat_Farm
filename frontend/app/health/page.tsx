'use client';

import React, { useState, useEffect } from 'react';
import { Stethoscope, Plus, Syringe } from 'lucide-react';
import { healthApi, goatApi, isAdmin, canEditRecord } from '@/lib/api';

export default function HealthVaccinationPage() {
  const [goats, setGoats] = useState<any[]>([]);
  const [healthRecords, setHealthRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    goat_id: '',
    type: 'Medical Checkup',
    vaccine_name: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    next_checkup_date: '',
  });
  const admin = isAdmin();

  const fetchHealthRecordsAndGoats = async () => {
    try {
      const [healthRes, goatsRes] = await Promise.all([
        healthApi.list(),
        goatApi.list(),
      ]);
      setHealthRecords(healthRes.data || []);
      setGoats(goatsRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealthRecordsAndGoats();
  }, []);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { vaccine_name, ...rest } = formData;
      // The vaccine name is stored in the record's "medicines" column.
      await healthApi.create({
        ...rest,
        medicines: formData.type === 'Vaccination' ? vaccine_name.trim() : undefined,
      });
      setShowModal(false);
      setFormData({ goat_id: '', type: 'Medical Checkup', vaccine_name: '', description: '', date: new Date().toISOString().split('T')[0], next_checkup_date: '' });
      fetchHealthRecordsAndGoats(); // Refresh data
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this health record? This can only be done by an admin.')) return;
    try {
      await healthApi.remove(id);
      fetchHealthRecordsAndGoats();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-forest">Health & Vaccination</h1>
          <p className="text-gray-500 text-sm">Manage medical history and vaccination schedules for your goats.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-forest text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-forest/90 transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Health Record
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b text-gray-500 text-xs uppercase tracking-wider">
              <th className="p-4">ID</th>
              <th className="p-4">Goat</th>
              <th className="p-4">Type</th>
              <th className="p-4">Description</th>
              <th className="p-4">Date</th>
              <th className="p-4">Next Checkup</th>
              {admin && <th className="p-4 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {loading ? (
              <tr><td colSpan={7} className="p-6 text-center text-gray-400">Loading health records...</td></tr>
            ) : healthRecords.length === 0 ? (
              <tr><td colSpan={7} className="p-6 text-center text-gray-400">No health records found.</td></tr>
            ) : (
              healthRecords.map(rec => (
                <tr key={rec.id} className="hover:bg-gray-50/50">
                  <td className="p-4 font-medium text-forest">HLT-{rec.id}</td>
                  <td className="p-4 font-semibold text-gray-800">{rec.goat_name} <span className="text-xs font-normal text-gray-400">(GOAT-{rec.goat_id})</span></td>
                  <td className="p-4">{rec.type}</td>
                  <td className="p-4 text-gray-600">{rec.type === 'Vaccination' && rec.medicines && <span className="font-semibold text-gray-800">{rec.medicines}{(rec.notes || rec.description) ? ' — ' : ''}</span>}{rec.notes || rec.description || rec.treatment || rec.diagnosis || (rec.type === 'Vaccination' && rec.medicines ? '' : '--')}</td>
                  <td className="p-4">{rec.date}</td>
                  <td className="p-4 font-medium text-forest">{rec.next_checkup_date || 'N/A'}</td>
                  {admin && (
                    <td className="p-4 text-right">
                      <button onClick={() => handleDelete(rec.id)} className="text-red-500 hover:text-red-700 text-xs font-semibold">Delete</button>
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
            <h2 className="text-xl font-bold text-forest mb-4">Add New Health Record</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Select Goat</label>
                <select
                  name="goat_id"
                  required
                  value={formData.goat_id}
                  onChange={handleFormChange}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest/50"
                >
                  <option value="">-- Select Goat --</option>
                  {goats.map(g => (
                    <option key={g.id} value={g.id}>{g.name} (GOAT-{g.id})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Record Type</label>
                <select
                  name="type"
                  required
                  value={formData.type}
                  onChange={handleFormChange}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest/50"
                >
                  <option value="Medical Checkup">Medical Checkup</option>
                  <option value="Vaccination">Vaccination</option>
                  <option value="Treatment">Treatment</option>
                  <option value="Observation">Observation</option>
                </select>
              </div>
              {formData.type === 'Vaccination' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Vaccine Name</label>
                  <input
                    type="text"
                    name="vaccine_name"
                    required
                    value={formData.vaccine_name}
                    onChange={handleFormChange}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest/50"
                    placeholder="e.g. CDT, PPR, Enterotoxemia"
                  />
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleFormChange}
                  rows={3}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest/50"
                  placeholder="e.g. Annual deworming, suspected lameness..."
                ></textarea>
              </div>
              <div className="grid grid-cols-2 gap-4">
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
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Next Checkup/Due Date (Optional)</label>
                  <input
                    type="date"
                    name="next_checkup_date"
                    value={formData.next_checkup_date}
                    onChange={handleFormChange}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest/50"
                  />
                </div>
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
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}