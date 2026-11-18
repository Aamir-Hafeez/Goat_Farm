'use client';

import React, { useState, useEffect } from 'react';
import { goatApi, breedsApi, isAdmin, canEditRecord } from '@/lib/api';
import { Plus, Search, Filter, Eye, Trash2, Edit as EditIcon, X, Stethoscope } from 'lucide-react';
import Link from 'next/link';
import { fileToResizedDataUrl } from '@/lib/image';

const emptyForm = {
  name: '',
  breed: '',
  gender: 'female',
  dob: '',
  weight: '',
  color: '',
  purchase_date: '',
  purchase_price: '',
  health_status: 'Healthy',
  breeding_status: 'Eligible',
  current_location: 'Main Barn',
  status: 'active',
  photo_url: '',
};

export default function GoatManagementPage() {
  const [goats, setGoats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<any>(emptyForm);

  const [search, setSearch] = useState('');
  const [breedFilter, setBreedFilter] = useState('');
  const [genderFilter, setGenderFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const [breeds, setBreeds] = useState<string[]>([]);

  const admin = isAdmin();

  useEffect(() => {
    breedsApi.list()
      .then((res) => setBreeds((res.data || []).map((b: any) => b.name)))
      .catch(() => setBreeds([]));
  }, []);

  const fetchGoats = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (breedFilter) params.breed = breedFilter;
      if (genderFilter) params.gender = genderFilter;
      const res = await goatApi.list(params);
      setGoats(res.data);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to load goats');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const t = setTimeout(fetchGoats, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, breedFilter, genderFilter]);

  const [profile, setProfile] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  const openProfile = async (id: number) => {
    setProfile({ id });
    setProfileLoading(true);
    try {
      const res = await goatApi.get(id);
      setProfile(res.data);
    } catch (err: any) {
      alert(err.message);
      setProfile(null);
    } finally {
      setProfileLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingId(null);
    setFormData({ ...emptyForm, breed: breeds[0] || '' });
    setShowModal(true);
  };

  const openEditModal = (goat: any) => {
    setEditingId(goat.id);
    setFormData({
      name: goat.name || '',
      breed: goat.breed || breeds[0] || '',
      gender: goat.gender || 'female',
      dob: goat.dob || '',
      weight: goat.weight || '',
      color: goat.color || '',
      purchase_date: goat.purchase_date || '',
      purchase_price: goat.purchase_price || '',
      health_status: goat.health_status || 'Healthy',
      breeding_status: goat.breeding_status || 'Eligible',
      current_location: goat.current_location || 'Main Barn',
      status: goat.status || 'active',
      photo_url: goat.photo_url || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await goatApi.update(editingId, formData);
      } else {
        await goatApi.create(formData);
      }
      setShowModal(false);
      setFormData(emptyForm);
      setEditingId(null);
      fetchGoats();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Permanently delete this goat and its health, breeding, pregnancy and delivery records? This cannot be undone.')) return;
    try {
      await goatApi.remove(id);
      fetchGoats();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-forest">Goat Management</h1>
          <p className="text-gray-500 text-sm">Maintain complete digital profiles for every goat.</p>
        </div>
        <button onClick={openAddModal} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add New Goat
        </button>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-lg">{error}</div>}

      <div className="card p-6 mb-6">
        <div className="flex gap-4 items-center">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by ID, name, or breed..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lightGreen"
            />
          </div>
          <button
            onClick={() => setShowFilters((v) => !v)}
            className="px-4 py-2.5 border border-gray-300 rounded-lg flex items-center gap-2 text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Filter className="w-4 h-4" /> Filter
          </button>
        </div>
        {showFilters && (
          <div className="flex gap-4 mt-4 pt-4 border-t border-gray-100">
            <select
              value={breedFilter}
              onChange={(e) => setBreedFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">All Breeds</option>
              {breeds.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
            <select
              value={genderFilter}
              onChange={(e) => setGenderFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">All Genders</option>
              <option value="female">Female</option>
              <option value="male">Male</option>
            </select>
          </div>
        )}
      </div>

      <div className="card overflow-x-auto">
        <table className="min-w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="p-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">ID</th>
              <th className="p-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Name</th>
              <th className="p-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Breed</th>
              <th className="p-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Gender</th>
              <th className="p-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Weight (kg)</th>
              <th className="p-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">DOB</th>
              <th className="p-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
              <th className="p-4 text-xs font-semibold text-gray-600 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {loading ? (
              <tr>
                <td colSpan={8} className="p-6 text-center text-gray-400">Loading goats...</td>
              </tr>
            ) : goats.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-6 text-center text-gray-500">No goats found. Add your first goat above.</td>
              </tr>
            ) : (
              goats.map((goat) => {
                const canEdit = canEditRecord(goat.created_at);
                return (
                  <tr key={goat.id} className="hover:bg-gray-50">
                    <td className="p-4 font-medium text-forest">GOAT-{goat.id}</td>
                    <td className="p-4 font-semibold text-gray-800">
                      <div className="flex items-center gap-3">
                        {goat.photo_url && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={goat.photo_url} alt={goat.name} className="w-9 h-9 rounded-full object-cover border border-gray-200" />
                        )}
                        {goat.name}
                      </div>
                    </td>
                    <td className="p-4">{goat.breed}</td>
                    <td className="p-4 capitalize">
                      <span className={`badge ${goat.gender === 'female' ? 'bg-pink-100 text-pink-700' : 'bg-blue-100 text-blue-700'}`}>
                        {goat.gender}
                      </span>
                    </td>
                    <td className="p-4">{goat.weight || 'N/A'}</td>
                    <td className="p-4">{goat.dob || 'N/A'}</td>
                    <td className="p-4">
                      <span className={`badge ${goat.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                        {goat.status}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-3">
                      <button
                        onClick={() => openProfile(goat.id)}
                        className="text-forest hover:text-lightGreen transition-colors"
                        title="View health & vaccination history"
                      >
                        <Stethoscope className="w-4 h-4 inline-block" />
                      </button>
                      <Link href={`/genealogy?goat=${goat.id}`} className="text-forest hover:text-lightGreen transition-colors" title="View family tree">
                        <Eye className="w-4 h-4 inline-block" />
                      </Link>
                      <button
                        onClick={() => openEditModal(goat)}
                        disabled={!canEdit}
                        title={canEdit ? 'Edit goat' : 'Editing locked: record is older than 1 day (admin only)'}
                        className={`transition-colors ${canEdit ? 'text-blue-500 hover:text-blue-700' : 'text-gray-300 cursor-not-allowed'}`}
                      >
                        <EditIcon className="w-4 h-4 inline-block" />
                      </button>
                      {admin && (
                        <button
                          onClick={() => handleDelete(goat.id)}
                          className="text-red-500 hover:text-red-700 transition-colors"
                          title="Delete (admin only)"
                        >
                          <Trash2 className="w-4 h-4 inline-block" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {profile && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full p-5 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-forest">
                {profile.name ? `${profile.name} (GOAT-${profile.id})` : 'Loading...'}
              </h2>
              <button onClick={() => setProfile(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            {profileLoading || !profile.name ? (
              <p className="text-gray-400 text-sm">Loading profile...</p>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  {profile.photo_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={profile.photo_url} alt={profile.name} className="w-20 h-20 rounded-lg object-cover border border-gray-200" />
                  )}
                  <div className="text-sm text-gray-600">
                    <p>{profile.breed} · <span className="capitalize">{profile.gender}</span> · {profile.age}</p>
                    <p>Health: {profile.health_status} · Breeding: {profile.breeding_status}</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-gray-800 mb-2">Vaccinations</h3>
                  {(profile.vaccinations || []).length === 0 ? (
                    <p className="text-sm text-gray-400">No vaccination records.</p>
                  ) : (
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs uppercase text-gray-500 border-b">
                        <tr><th className="py-2">Vaccine</th><th>Date</th><th>Next Due</th><th>Status</th></tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {profile.vaccinations.map((v: any) => (
                          <tr key={v.id}>
                            <td className="py-2 font-medium text-gray-800">{v.name}</td>
                            <td>{v.date}</td>
                            <td>{v.next_due_date || '--'}</td>
                            <td>{v.status}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                <div>
                  <h3 className="font-bold text-gray-800 mb-2">Health Records</h3>
                  {(profile.healthRecords || []).length === 0 ? (
                    <p className="text-sm text-gray-400">No health records.</p>
                  ) : (
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs uppercase text-gray-500 border-b">
                        <tr><th className="py-2">Type</th><th>Details</th><th>Date</th><th>Next Checkup</th></tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {profile.healthRecords.map((h: any) => (
                          <tr key={h.id}>
                            <td className="py-2 font-medium text-gray-800">{h.type}</td>
                            <td className="text-gray-600">{h.notes || h.treatment || h.diagnosis || '--'}</td>
                            <td>{h.date}</td>
                            <td>{h.next_checkup_date || '--'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-lg w-full p-5 sm:p-8 shadow-2xl animate-fade-in-up max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-forest">{editingId ? 'Edit Goat' : 'Register New Goat'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Photo</label>
                <div className="flex items-center gap-4">
                  {formData.photo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={formData.photo_url} alt="Goat preview" className="w-20 h-20 rounded-lg object-cover border border-gray-200" />
                  ) : (
                    <div className="w-20 h-20 rounded-lg border border-dashed border-gray-300 flex items-center justify-center text-xs text-gray-400">No photo</div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      try {
                        const dataUrl = await fileToResizedDataUrl(file);
                        setFormData((f: any) => ({ ...f, photo_url: dataUrl }));
                      } catch (err: any) {
                        alert(err.message);
                      }
                    }}
                    className="text-sm text-gray-600"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-lightGreen"
                  placeholder="e.g. Daisy"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Breed</label>
                  <select
                    required
                    value={formData.breed}
                    onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-lightGreen"
                  >
                    {!formData.breed && <option value="">Select breed...</option>}
                    {formData.breed && !breeds.includes(formData.breed) && (
                      <option value={formData.breed}>{formData.breed}</option>
                    )}
                    {breeds.map((b) => <option key={b} value={b}>{b}</option>)}
                  </select>
                  {breeds.length === 0 && (
                    <p className="text-xs text-amber-600 mt-1">No breeds defined. An admin can add breeds in Settings.</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Gender</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-lightGreen"
                  >
                    <option value="female">Female (Doe)</option>
                    <option value="male">Male (Buck)</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={formData.dob}
                    onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-lightGreen"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Weight (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-lightGreen"
                    placeholder="e.g. 45.5"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Color</label>
                  <input
                    type="text"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-lightGreen"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Current Location</label>
                  <input
                    type="text"
                    value={formData.current_location}
                    onChange={(e) => setFormData({ ...formData, current_location: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-lightGreen"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Health Status</label>
                  <select
                    value={formData.health_status}
                    onChange={(e) => setFormData({ ...formData, health_status: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-lightGreen"
                  >
                    <option>Healthy</option>
                    <option>Under Treatment</option>
                    <option>Sick</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Breeding Status</label>
                  <select
                    value={formData.breeding_status}
                    onChange={(e) => setFormData({ ...formData, breeding_status: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-lightGreen"
                  >
                    <option>Eligible</option>
                    <option>Active Breeder</option>
                    <option>Pregnant</option>
                    <option>Lactating</option>
                    <option>In Heat</option>
                    <option>Resting</option>
                    <option>Kid / Growing</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-8">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingId ? 'Save Changes' : 'Save Goat'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
