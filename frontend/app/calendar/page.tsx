'use client';

import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, Plus, X } from 'lucide-react';
import { calendarApi, goatApi, isAdmin, canEditRecord } from '@/lib/api';

const EVENT_COLORS: Record<string, string> = {
  'Heat Cycle': 'bg-pink-50 border-pink-200 text-pink-800',
  'Scheduled Mating': 'bg-purple-50 border-purple-200 text-purple-800',
  'Pregnancy Confirmation': 'bg-blue-50 border-blue-200 text-blue-800',
  'Veterinary Checkup': 'bg-amber-50 border-amber-200 text-amber-800',
  'Expected Delivery': 'bg-green-50 border-green-200 text-green-800',
  'Vaccination': 'bg-cyan-50 border-cyan-200 text-cyan-800',
  'Weaning': 'bg-orange-50 border-orange-200 text-orange-800',
};

const EVENT_TYPES = Object.keys(EVENT_COLORS);

export default function BreedingCalendarPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [goats, setGoats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filterType, setFilterType] = useState('');
  const [formData, setFormData] = useState({
    title: '', event_type: 'Veterinary Checkup', event_date: new Date().toISOString().split('T')[0],
    goat_id: '', description: '', status: 'Scheduled',
  });
  const admin = isAdmin();

  const fetchData = async () => {
    try {
      const params: Record<string, string> = {};
      if (filterType) params.event_type = filterType;
      const [eventsRes, goatsRes] = await Promise.all([calendarApi.list(params), goatApi.list()]);
      setEvents(eventsRes.data || []);
      setGoats(goatsRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [filterType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await calendarApi.create({ ...formData, goat_id: formData.goat_id || null });
      setShowModal(false);
      setFormData({ title: '', event_type: 'Veterinary Checkup', event_date: new Date().toISOString().split('T')[0], goat_id: '', description: '', status: 'Scheduled' });
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this event? This can only be done by an admin.')) return;
    try {
      await calendarApi.remove(id);
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const today = new Date().toISOString().split('T')[0];
  const upcoming = events.filter(e => e.event_date >= today).slice(0, 8);

  return (
    <div>
      <div className="mb-8 flex flex-wrap justify-between items-start gap-4">
        <div>
          <h1 className="text-3xl font-bold text-forest">Breeding Calendar & Smart Scheduling</h1>
          <p className="text-gray-500 text-sm">Visual schedule for heat cycles, mating, pregnancies, and vaccinations.</p>
        </div>
        <button onClick={() => setShowModal(true)} className="bg-forest text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-forest/90 transition-colors">
          <Plus className="w-4 h-4" /> Add Event
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-gray-800">All Events</h2>
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="border rounded-lg px-3 py-1.5 text-sm">
              <option value="">All Types</option>
              {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div className="space-y-3 max-h-[480px] overflow-y-auto">
            {loading ? (
              <p className="text-center text-gray-400 py-8">Loading events...</p>
            ) : events.length === 0 ? (
              <p className="text-center text-gray-400 py-8">No events scheduled. Add one to get started.</p>
            ) : (
              events.map(ev => (
                <div key={ev.id} className={`flex items-start justify-between gap-3 p-3 rounded-lg border ${EVENT_COLORS[ev.event_type] || 'bg-gray-50 border-gray-200 text-gray-800'}`}>
                  <div className="flex items-start gap-3">
                    <CalendarIcon className="w-5 h-5 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold"><span className="font-mono text-xs opacity-70 mr-1">EVT-{ev.id}</span>{ev.title}</p>
                      <p className="text-xs mt-0.5">{ev.event_type} · {ev.event_date} {ev.goat_name ? `· ${ev.goat_name} (GOAT-${ev.goat_id})` : ''}</p>
                      {ev.description && <p className="text-xs mt-1 opacity-80">{ev.description}</p>}
                    </div>
                  </div>
                  {admin && (
                    <button onClick={() => handleDelete(ev.id)} className="text-xs font-semibold hover:underline shrink-0">Delete</button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4">Upcoming Schedule</h3>
            <div className="space-y-4">
              {upcoming.length === 0 ? (
                <p className="text-sm text-gray-400">No upcoming events.</p>
              ) : upcoming.map(ev => (
                <div key={ev.id} className={`flex items-start gap-3 p-3 rounded-lg border ${EVENT_COLORS[ev.event_type] || 'bg-gray-50 border-gray-200'}`}>
                  <Clock className="w-5 h-5 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold"><span className="font-mono text-xs opacity-70 mr-1">EVT-{ev.id}</span>{ev.title}</p>
                    <p className="text-xs mt-0.5">Due: {ev.event_date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl relative">
            <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            <h2 className="text-xl font-bold text-forest mb-4">Add Calendar Event</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Title</label>
                <input type="text" required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest/50" placeholder="e.g. Vet checkup - Luna" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Event Type</label>
                <select value={formData.event_type} onChange={(e) => setFormData({ ...formData, event_type: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest/50">
                  {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Related Goat (Optional)</label>
                <select value={formData.goat_id} onChange={(e) => setFormData({ ...formData, goat_id: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest/50">
                  <option value="">-- None --</option>
                  {goats.map(g => <option key={g.id} value={g.id}>{g.name} (ID: {g.id})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Event Date</label>
                <input type="date" required value={formData.event_date} onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest/50" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Description</label>
                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest/50" />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-forest text-white rounded-lg text-sm hover:bg-forest/90">Save Event</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
