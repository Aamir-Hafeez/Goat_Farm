'use client';

import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Award, Users, Search } from 'lucide-react';
import { analyticsApi, goatApi } from '@/lib/api';

export default function BreedingAnalyticsPage() {
  const [farm, setFarm] = useState<any>(null);
  const [males, setMales] = useState<any[]>([]);
  const [females, setFemales] = useState<any[]>([]);
  const [goats, setGoats] = useState<any[]>([]);
  const [selectedGoatId, setSelectedGoatId] = useState('');
  const [scorecard, setScorecard] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      analyticsApi.farm(),
      analyticsApi.malePerformance(),
      analyticsApi.femaleFertility(),
      goatApi.list(),
    ])
      .then(([farmRes, maleRes, femaleRes, goatsRes]) => {
        setFarm(farmRes.data);
        setMales(maleRes.data || []);
        setFemales(femaleRes.data || []);
        setGoats(goatsRes.data || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleScorecardLookup = async (id: string) => {
    setSelectedGoatId(id);
    if (!id) { setScorecard(null); return; }
    try {
      const res = await analyticsApi.goatScorecard(id);
      setScorecard(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="p-8">Loading analytics...</div>;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-forest">Breeding Analytics &amp; Scorecards</h1>
        <p className="text-gray-500 text-sm">Evaluate individual goat scorecards and farm-level breeding success rates.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Pregnancy Success Rate</p>
            <h3 className="text-2xl font-bold text-forest">{farm?.pregnancy_success_rate ?? 0}%</h3>
          </div>
          <TrendingUp className="w-8 h-8 text-lightGreen" />
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Average Litter Size</p>
            <h3 className="text-2xl font-bold text-forest">{farm?.avg_litter_size ?? 0} Kids</h3>
          </div>
          <Award className="w-8 h-8 text-lightGreen" />
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Mortality Rate</p>
            <h3 className="text-2xl font-bold text-forest">{farm?.mortality_rate ?? 0}%</h3>
          </div>
          <Users className="w-8 h-8 text-lightGreen" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 overflow-x-auto">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Male Breeding Performance</h2>
          <table className="w-full text-left text-sm">
            <thead><tr className="text-gray-500 text-xs uppercase border-b"><th className="py-2">Buck</th><th>Matings</th><th>Pregnancies</th><th>Kids</th></tr></thead>
            <tbody className="divide-y">
              {males.length === 0 ? <tr><td colSpan={4} className="py-4 text-center text-gray-400">No data yet.</td></tr> : males.map((m) => (
                <tr key={m.id}><td className="py-2 font-medium">{m.name}</td><td>{m.matings}</td><td>{m.pregnancies}</td><td>{m.kids}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 overflow-x-auto">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Female Fertility Comparison</h2>
          <table className="w-full text-left text-sm">
            <thead><tr className="text-gray-500 text-xs uppercase border-b"><th className="py-2">Doe</th><th>Matings</th><th>Deliveries</th><th>Kids</th></tr></thead>
            <tbody className="divide-y">
              {females.length === 0 ? <tr><td colSpan={4} className="py-4 text-center text-gray-400">No data yet.</td></tr> : females.map((f) => (
                <tr key={f.id}><td className="py-2 font-medium">{f.name}</td><td>{f.matings}</td><td>{f.deliveries}</td><td>{f.kids}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 overflow-x-auto">
        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Search className="w-5 h-5 text-forest" /> Individual Goat Scorecard
        </h2>
        <select value={selectedGoatId} onChange={(e) => handleScorecardLookup(e.target.value)} className="border rounded-lg px-3 py-2 text-sm mb-4 min-w-[260px]">
          <option value="">-- Select a goat --</option>
          {goats.map((g) => <option key={g.id} value={g.id}>{g.name} (ID: {g.id})</option>)}
        </select>
        {scorecard && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div className="p-4 bg-gray-50 rounded-xl"><p className="text-sm text-gray-500">Mating Attempts</p><p className="text-2xl font-bold text-gray-800">{scorecard.total_mating_attempts}</p></div>
            <div className="p-4 bg-gray-50 rounded-xl"><p className="text-sm text-gray-500">Successful Matings</p><p className="text-2xl font-bold text-green-600">{scorecard.successful_matings}</p></div>
            <div className="p-4 bg-gray-50 rounded-xl"><p className="text-sm text-gray-500">Total Kids Born</p><p className="text-2xl font-bold text-blue-600">{scorecard.total_kids_born}</p></div>
            <div className="p-4 bg-gray-50 rounded-xl"><p className="text-sm text-gray-500">Kid Survival Rate</p><p className="text-2xl font-bold text-forest">{scorecard.kid_survival_rate}%</p></div>
          </div>
        )}
      </div>
    </div>
  );
}
