'use client';

import React, { useState, useEffect } from 'react';
import { Heart, Calendar, AlertCircle } from 'lucide-react';
import { pregnancyApi } from '@/lib/api';

export default function PregnancyTrackingPage() {
  const [pregnancies, setPregnancies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    pregnancyApi
      .list()
      .then((data) => setPregnancies(data.data || []))
      .catch((err) => setError(err.message || 'Failed to load pregnancies'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-forest">Pregnancy Tracking</h1>
        <p className="text-gray-500 text-sm">Monitor expected delivery dates, health status, and veterinary checkups.</p>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-lg">{error}</div>}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b text-gray-500 text-xs uppercase tracking-wider">
              <th className="p-4">ID</th>
              <th className="p-4">Doe Name</th>
              <th className="p-4">Mating Date</th>
              <th className="p-4">Confirmation Date</th>
              <th className="p-4">Expected Due Date</th>
              <th className="p-4">Days Remaining</th>
              <th className="p-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {loading ? (
              <tr><td colSpan={7} className="p-6 text-center text-gray-400">Loading pregnancies...</td></tr>
            ) : pregnancies.length === 0 ? (
              <tr><td colSpan={7} className="p-6 text-center text-gray-400">No active pregnancies found.</td></tr>
            ) : (
              pregnancies.map(p => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="p-4 font-medium text-forest">PRG-{p.id}</td>
                  <td className="p-4 font-semibold text-gray-800">{p.goat_name} <span className="text-xs font-normal text-gray-400">(GOAT-{p.goat_id})</span></td>
                  <td className="p-4">{p.mating_date}</td>
                  <td className="p-4">{p.confirmation_date || 'N/A'}</td>
                  <td className="p-4 font-bold text-forest">{p.expected_delivery_date}</td>
                  <td className="p-4">
                    {p.is_overdue ? (
                      <span className="text-red-600 font-semibold flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" /> {p.days_overdue} days overdue</span>
                    ) : (
                      <span>{p.days_remaining} days</span>
                    )}
                  </td>
                  <td className="p-4">
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 capitalize">
                      {p.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}