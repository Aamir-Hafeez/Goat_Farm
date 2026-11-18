'use client';

import React, { useState, useEffect } from 'react';
import { Baby, Plus, Calendar as CalendarIcon } from 'lucide-react';
import { deliveryApi, pregnancyApi, goatApi } from '@/lib/api';
import { fileToResizedDataUrl } from '@/lib/image';

export default function KiddingDeliveriesPage() {
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [pregnancies, setPregnancies] = useState<any[]>([]);
  const [goats, setGoats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  // Photos per newborn, indexed in order: male kids first, then female kids.
  const [kidPhotos, setKidPhotos] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    pregnancy_id: '',
    mother_id: '',
    father_id: '',
    delivery_date: new Date().toISOString().split('T')[0],
    num_kids: 0,
    male_kids: 0,
    female_kids: 0,
    notes: '',
  });

  const fetchDeliveriesAndPregnancies = async () => {
    try {
      const [deliveriesRes, pregnanciesRes, goatsRes] = await Promise.all([
        deliveryApi.list(),
        pregnancyApi.list(),
        goatApi.list(),
      ]);

      setDeliveries(deliveriesRes.data || []);
      setPregnancies((pregnanciesRes.data || []).filter((p: any) => p.status === 'Pregnant'));
      setGoats(goatsRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeliveriesAndPregnancies();
  }, []);

  const resetForm = () => {
    setKidPhotos([]);
    setFormData({
      pregnancy_id: '', mother_id: '', father_id: '',
      delivery_date: new Date().toISOString().split('T')[0],
      num_kids: 0, male_kids: 0, female_kids: 0, notes: '',
    });
  };

  // One entry per newborn that will be registered (males first, then females).
  const kidRows = [
    ...Array.from({ length: formData.male_kids }, () => 'male'),
    ...Array.from({ length: formData.female_kids }, () => 'female'),
  ];

  const handleKidPhoto = async (idx: number, file?: File) => {
    if (!file) return;
    try {
      const dataUrl = await fileToResizedDataUrl(file);
      setKidPhotos(prev => {
        const next = [...prev];
        next[idx] = dataUrl;
        return next;
      });
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'num_kids' || name === 'male_kids' || name === 'female_kids') {
      setFormData(prev => ({ ...prev, [name]: parseInt(value) || 0 }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handlePregnancySelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const pregId = e.target.value;
    const preg = pregnancies.find((p) => String(p.id) === pregId);
    setFormData(prev => ({
      ...prev,
      pregnancy_id: pregId,
      mother_id: preg ? String(preg.goat_id) : prev.mother_id,
      father_id: preg?.father_id ? String(preg.father_id) : prev.father_id,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.mother_id) {
      alert('Please select the mother goat.');
      return;
    }
    if (kidRows.length === 0) {
      alert('Enter the number of male and female kids, then add a picture for each.');
      return;
    }
    const missing = kidRows.findIndex((_, i) => !kidPhotos[i]);
    if (missing !== -1) {
      alert(`Please add a picture for Kid ${missing + 1}.`);
      return;
    }
    try {
      await deliveryApi.create({
        ...formData,
        pregnancy_id: formData.pregnancy_id || null,
        father_id: formData.father_id || null,
        num_kids: kidRows.length,
        kids_data: kidRows.map((gender, i) => ({ gender, photo_url: kidPhotos[i] })),
      });
      setShowModal(false);
      resetForm();
      fetchDeliveriesAndPregnancies(); // Refresh data
    } catch (err: any) {
      alert(err.message);
    }
  };

  const females = goats.filter((g) => g.gender === 'female');
  const males = goats.filter((g) => g.gender === 'male');

  return (
    <div>
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-forest">Kidding & Deliveries</h1>
          <p className="text-gray-500 text-sm">Record every delivery and track newborn statistics.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-forest text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-forest/90 transition-colors"
        >
          <Plus className="w-4 h-4" /> Record Delivery
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b text-gray-500 text-xs uppercase tracking-wider">
              <th className="p-4">Delivery ID</th>
              <th className="p-4">Mother</th>
              <th className="p-4">Father</th>
              <th className="p-4">Date</th>
              <th className="p-4">Kids Born</th>
              <th className="p-4">Male</th>
              <th className="p-4">Female</th>
              <th className="p-4">Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {loading ? (
              <tr><td colSpan={8} className="p-6 text-center text-gray-400">Loading deliveries...</td></tr>
            ) : deliveries.length === 0 ? (
              <tr><td colSpan={8} className="p-6 text-center text-gray-400">No deliveries recorded yet.</td></tr>
            ) : (
              deliveries.map(d => (
                <tr key={d.id} className="hover:bg-gray-50/50">
                  <td className="p-4 font-medium text-forest">DEL-{d.id}</td>
                  <td className="p-4 font-semibold text-gray-800">{d.mother_name || 'N/A'} {d.mother_id && <span className="text-xs font-normal text-gray-400">(GOAT-{d.mother_id})</span>}</td>
                  <td className="p-4">{d.father_name || 'N/A'} {d.father_id && <span className="text-xs text-gray-400">(GOAT-{d.father_id})</span>}</td>
                  <td className="p-4">{d.delivery_date}</td>
                  <td className="p-4">{d.num_kids}</td>
                  <td className="p-4">{d.male_kids}</td>
                  <td className="p-4">{d.female_kids}</td>
                  <td className="p-4 text-gray-600">{d.notes || '--'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl">
            <h2 className="text-xl font-bold text-forest mb-4">Record New Delivery</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Associated Pregnancy (Optional)</label>
                <select
                  name="pregnancy_id"
                  value={formData.pregnancy_id}
                  onChange={handlePregnancySelect}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest/50"
                >
                  <option value="">-- Select Pregnancy --</option>
                  {pregnancies.map(p => (
                    <option key={p.id} value={p.id}>Doe: {p.goat_name} (Due: {p.expected_delivery_date})</option>
                  ))}
                </select>
                <p className="text-xs text-gray-400 mt-1">Selecting a pregnancy auto-fills the mother/father below.</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Mother Goat</label>
                  <select
                    name="mother_id"
                    required
                    value={formData.mother_id}
                    onChange={handleFormChange}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest/50"
                  >
                    <option value="">-- Select Doe --</option>
                    {females.map(g => (
                      <option key={g.id} value={g.id}>{g.name} (ID: {g.id})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Father Goat (Optional)</label>
                  <select
                    name="father_id"
                    value={formData.father_id}
                    onChange={handleFormChange}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest/50"
                  >
                    <option value="">-- Select Buck --</option>
                    {males.map(g => (
                      <option key={g.id} value={g.id}>{g.name} (ID: {g.id})</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Delivery Date</label>
                <input
                  type="date"
                  required
                  name="delivery_date"
                  value={formData.delivery_date}
                  onChange={handleFormChange}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest/50"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Total Kids</label>
                  <input
                    type="number"
                    readOnly
                    name="num_kids"
                    value={formData.male_kids + formData.female_kids}
                    className="w-full border rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Male Kids</label>
                  <input
                    type="number"
                    min="0"
                    required
                    name="male_kids"
                    value={formData.male_kids}
                    onChange={handleFormChange}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Female Kids</label>
                  <input
                    type="number"
                    min="0"
                    required
                    name="female_kids"
                    value={formData.female_kids}
                    onChange={handleFormChange}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest/50"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-2">Kid Photos (Required)</label>
                {kidRows.length === 0 && (
                  <p className="text-xs text-gray-400 border border-dashed border-gray-300 rounded-lg p-3">
                    Enter the number of male and female kids above, then add a photo for each kid here.
                  </p>
                )}
                {kidRows.length > 0 && (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {kidRows.map((gender, i) => (
                      <div key={i} className="flex items-center gap-3">
                        {kidPhotos[i] ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={kidPhotos[i]} alt={`Kid ${i + 1}`} className="w-12 h-12 rounded-lg object-cover border border-gray-200" />
                        ) : (
                          <div className="w-12 h-12 rounded-lg border border-dashed border-gray-300 flex items-center justify-center text-[10px] text-gray-400">No photo</div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-gray-700 capitalize">Kid {i + 1} ({gender})</p>
                          <input
                            type="file"
                            accept="image/*"
                            required={!kidPhotos[i]}
                            onChange={(e) => handleKidPhoto(i, e.target.files?.[0])}
                            className="text-xs text-gray-600 w-full"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Notes</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleFormChange}
                  rows={3}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest/50"
                  placeholder="Any observations during delivery..."
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
                  Record Delivery
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}