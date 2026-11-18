'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Settings as SettingsIcon, Save, Plus, Trash2, Check, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { fetchApi, breedsApi, isAdmin } from '@/lib/api';

type Toast = { type: 'success' | 'error'; text: string } | null;

const prettyKey = (key: string) =>
  key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

export default function SettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [savedValues, setSavedValues] = useState<Record<string, string>>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [justSavedKey, setJustSavedKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [breeds, setBreeds] = useState<any[]>([]);
  const [newBreed, setNewBreed] = useState('');
  const [breedBusy, setBreedBusy] = useState(false);

  const [toast, setToast] = useState<Toast>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const admin = isAdmin();

  const showToast = (type: 'success' | 'error', text: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ type, text });
    toastTimer.current = setTimeout(() => setToast(null), 4000);
  };

  const loadBreeds = async () => {
    try {
      const res = await breedsApi.list();
      setBreeds(res.data || []);
    } catch (err: any) {
      showToast('error', err.message || 'Failed to load breeds');
    }
  };

  useEffect(() => {
    fetchApi('/settings')
      .then((res) => {
        setSettings(res.data || {});
        setSavedValues(res.data || {});
      })
      .catch(console.error)
      .finally(() => setLoading(false));
    loadBreeds();
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (key: string, value: string) => {
    setSettings({ ...settings, [key]: value });
    if (justSavedKey === key) setJustSavedKey(null);
  };

  const handleSave = async (key: string) => {
    setSavingKey(key);
    try {
      await fetchApi(`/settings/${key}`, {
        method: 'PUT',
        body: JSON.stringify({ value: settings[key] }),
      });
      setSavedValues((prev) => ({ ...prev, [key]: settings[key] }));
      setJustSavedKey(key);
      setTimeout(() => setJustSavedKey((k) => (k === key ? null : k)), 3000);
      showToast('success', `${prettyKey(key)} saved successfully: "${settings[key]}"`);
    } catch (err: any) {
      showToast('error', `Could not save ${prettyKey(key)}: ${err.message}`);
    } finally {
      setSavingKey(null);
    }
  };

  const handleAddBreed = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newBreed.trim();
    if (!name) return;
    setBreedBusy(true);
    try {
      await breedsApi.create(name);
      setNewBreed('');
      await loadBreeds();
      showToast('success', `Breed "${name}" added successfully`);
    } catch (err: any) {
      showToast('error', err.message);
    } finally {
      setBreedBusy(false);
    }
  };

  const handleDeleteBreed = async (b: any) => {
    if (!confirm(`Delete breed "${b.name}"?`)) return;
    try {
      await breedsApi.remove(b.id);
      await loadBreeds();
      showToast('success', `Breed "${b.name}" deleted successfully`);
    } catch (err: any) {
      showToast('error', err.message);
    }
  };

  if (loading) return <div className="p-8">Loading settings...</div>;

  return (
    <div className="space-y-6 max-w-4xl">
      {toast && (
        <div
          role="status"
          className={`fixed top-6 right-6 z-[100] max-w-sm flex items-start gap-3 rounded-xl shadow-2xl px-4 py-3 text-sm border animate-fade-in-up ${
            toast.type === 'success'
              ? 'bg-green-50 border-green-300 text-green-800'
              : 'bg-red-50 border-red-300 text-red-800'
          }`}
        >
          {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
          <span className="flex-1 font-medium">{toast.text}</span>
          <button onClick={() => setToast(null)} className="opacity-60 hover:opacity-100" aria-label="Dismiss">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div>
        <h1 className="text-3xl font-bold text-forest">Farm Settings</h1>
        <p className="text-gray-500 text-sm">Configure farm parameters, gestation period and other settings.</p>
        {!admin && <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-3 inline-block">View only &mdash; only an admin can change farm settings.</p>}
      </div>

      <div className="card p-6 space-y-5">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Goat Breeds</h2>
          <p className="text-sm text-gray-500">These breeds appear in the Add / Edit Goat form and the goat filters.</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {breeds.length === 0 && <p className="text-sm text-gray-400">No breeds defined yet.</p>}
          {breeds.map((b) => (
            <span key={b.id} className="inline-flex items-center gap-2 pl-3 pr-2 py-1.5 bg-gray-50 border border-gray-200 rounded-full text-sm text-gray-800">
              {b.name}
              <span className="text-xs text-gray-400">{b.goat_count} goat{b.goat_count === 1 ? '' : 's'}</span>
              {admin && (
                <button
                  onClick={() => handleDeleteBreed(b)}
                  disabled={b.goat_count > 0}
                  title={b.goat_count > 0 ? 'In use by goats - cannot delete' : `Delete ${b.name}`}
                  className="text-red-500 hover:text-red-700 disabled:text-gray-300 disabled:cursor-not-allowed"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </span>
          ))}
        </div>

        {admin && (
          <form onSubmit={handleAddBreed} className="flex gap-3">
            <input
              type="text"
              value={newBreed}
              onChange={(e) => setNewBreed(e.target.value)}
              maxLength={50}
              placeholder="New breed name (e.g. Jamnapari)"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-forest"
            />
            <button
              type="submit"
              disabled={breedBusy || !newBreed.trim()}
              className="px-4 py-2 bg-forest text-white rounded-lg text-sm font-bold hover:bg-forest/90 transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              <Plus className="w-4 h-4" /> Add Breed
            </button>
          </form>
        )}
      </div>

      <div className="card p-6 space-y-6">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <SettingsIcon className="w-5 h-5 text-forest" /> Core Parameters
        </h2>

        <div className="space-y-4">
          {Object.entries(settings).map(([key, value]) => {
            const dirty = value !== savedValues[key];
            return (
              <div key={key} className="flex items-center justify-between gap-4 p-4 bg-gray-50 rounded-xl">
                <div className="flex-1">
                  <label className="block text-sm font-semibold text-gray-700">{prettyKey(key)}</label>
                  <span className="text-xs text-gray-400 font-mono">{key}</span>
                  {dirty && <span className="block text-xs text-amber-600 mt-0.5">Unsaved changes</span>}
                  {justSavedKey === key && !dirty && (
                    <span className="flex items-center gap-1 text-xs text-green-600 font-medium mt-0.5">
                      <Check className="w-3 h-3" /> Saved
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 w-1/2">
                  <input
                    type="text"
                    disabled={!admin}
                    value={value as string}
                    onChange={(e) => handleChange(key, e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-forest disabled:bg-gray-100 disabled:text-gray-500"
                  />
                  {admin && (
                    <button
                      onClick={() => handleSave(key)}
                      disabled={savingKey === key || !dirty}
                      className="px-4 py-2 bg-forest text-white rounded-lg text-sm font-bold hover:bg-forest/90 transition-colors flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" /> {savingKey === key ? 'Saving...' : 'Save'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
