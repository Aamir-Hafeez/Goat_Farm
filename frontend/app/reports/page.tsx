'use client';

import React, { useState, useEffect } from 'react';
import { FileText, Download, Printer, BarChart3, TrendingUp, Users } from 'lucide-react';
import { fetchApi } from '@/lib/api';
import { formatPKR } from '@/lib/currency';

export default function ReportsPage() {
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApi('/reports/summary')
      .then(res => setSummary(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handlePrint = () => {
    window.print();
  };

  if (loading) return <div className="p-8">Loading reports...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-forest">Farm Reports & Analytics</h1>
          <p className="text-gray-500 text-sm">Comprehensive operational and financial summaries.</p>
        </div>
        <button
          onClick={handlePrint}
          className="bg-forest text-white px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-forest/90 transition-colors shadow"
        >
          <Printer className="w-4 h-4" /> Print / Export PDF
        </button>
      </div>

      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card p-6 border-l-4 border-forest">
            <p className="text-sm font-semibold text-gray-500 uppercase">Active Herd Size</p>
            <h3 className="text-3xl font-extrabold text-forest mt-1">{summary.total_goats}</h3>
            <p className="text-xs text-gray-400 mt-2">{summary.male_goats} Bucks, {summary.female_goats} Does, {summary.total_kids} Kids</p>
          </div>
          <div className="card p-6 border-l-4 border-blue-500">
            <p className="text-sm font-semibold text-gray-500 uppercase">Breeding & Pregnancies</p>
            <h3 className="text-3xl font-extrabold text-blue-600 mt-1">{summary.pregnant_goats} Pregnant</h3>
            <p className="text-xs text-gray-400 mt-2">{summary.total_kids_born} Total Kids Born to Date</p>
          </div>
          <div className="card p-6 border-l-4 border-green-500">
            <p className="text-sm font-semibold text-gray-500 uppercase">Financial Balance</p>
            <h3 className="text-3xl font-extrabold text-green-600 mt-1">{formatPKR(summary.net_profit)}</h3>
            <p className="text-xs text-gray-400 mt-2">Income: {formatPKR(summary.total_income)} | Expense: {formatPKR(summary.total_expenses)}</p>
          </div>
        </div>
      )}

      <div className="card p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-forest" /> Herd Breakdown
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div className="p-4 bg-gray-50 rounded-xl">
            <p className="text-sm text-gray-500">Ready for Breeding</p>
            <p className="text-2xl font-bold text-gray-800">{summary?.ready_for_breeding || 0}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-xl">
            <p className="text-sm text-gray-500">In Heat</p>
            <p className="text-2xl font-bold text-pink-600">{summary?.in_heat || 0}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-xl">
            <p className="text-sm text-gray-500">Healthy Kids</p>
            <p className="text-2xl font-bold text-blue-600">{summary?.healthy_kids || 0}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-xl">
            <p className="text-sm text-gray-500">Mortality</p>
            <p className="text-2xl font-bold text-red-600">{summary?.goat_mortality || 0}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
