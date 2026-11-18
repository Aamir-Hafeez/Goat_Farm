'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { goatApi, genealogyApi } from '@/lib/api';
import GoatSearchSelect from '@/components/GoatSearchSelect';

export default function GenealogyPage() {
  const searchParams = useSearchParams();
  const [goats, setGoats] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [tree, setTree] = useState<any>(null);

  useEffect(() => {
    goatApi.list()
      .then(res => setGoats(res.data || []))
      .catch(console.error);
  }, []);

  const handleSelect = async (id: string) => {
    setSelectedId(id);
    if (!id) { setTree(null); return; }
    try {
      const data = await genealogyApi.tree(id);
      setTree(data.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    const preselect = searchParams.get('goat');
    if (preselect) handleSelect(preselect);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-forest">Goat Family Tree & Genealogy</h1>
        <p className="text-gray-500 text-sm">Visual multi-generation bloodline and pedigree tree.</p>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
        <label className="text-xs font-semibold text-gray-600 uppercase">Select Goat:</label>
        <GoatSearchSelect goats={goats} value={selectedId} onChange={handleSelect} placeholder="Choose a goat" />
      </div>

      {tree && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-150 space-y-8">
          <div className="text-center">
            <h2 className="text-xl font-bold text-forest">{tree.name}</h2>
            <p className="text-xs text-gray-500 flex items-center justify-center gap-2 mt-1">
              <span className="font-mono text-[10px] font-semibold bg-forest/10 text-forest px-1.5 py-0.5 rounded">GOAT-{tree.id}</span>
              <span>{tree.breed} · {tree.gender}</span>
            </p>
          </div>
          <div className="grid grid-cols-2 gap-8 border-t pt-6">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="text-xs font-semibold uppercase text-gray-500 mb-2">Sire (Father)</h3>
              {tree.father ? (
                <p className="font-medium text-gray-800 flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="font-mono text-[10px] font-semibold bg-forest/10 text-forest px-1.5 py-0.5 rounded">GOAT-{tree.father.id}</span>
                  <span>{tree.father.name}</span>
                  {tree.father.breed && <span className="text-xs font-normal text-gray-400">({tree.father.breed})</span>}
                </p>
              ) : <p className="text-sm text-gray-400">Unknown / Not Recorded</p>}
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="text-xs font-semibold uppercase text-gray-500 mb-2">Dam (Mother)</h3>
              {tree.mother ? (
                <p className="font-medium text-gray-800 flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="font-mono text-[10px] font-semibold bg-forest/10 text-forest px-1.5 py-0.5 rounded">GOAT-{tree.mother.id}</span>
                  <span>{tree.mother.name}</span>
                  {tree.mother.breed && <span className="text-xs font-normal text-gray-400">({tree.mother.breed})</span>}
                </p>
              ) : <p className="text-sm text-gray-400">Unknown / Not Recorded</p>}
            </div>
          </div>
          <div>
            <h3 className="text-xs font-semibold uppercase text-gray-500 mb-2">Offspring ({tree.children?.length || 0})</h3>
            <div className="flex gap-3 flex-wrap">
              {tree.children?.length > 0 ? tree.children.map((c: any) => (
                <div key={c.id} className="p-3 bg-green-50 rounded-lg border border-green-100 text-sm">
                  <span className="font-mono text-[10px] font-semibold bg-white/70 text-green-800 px-1.5 py-0.5 rounded border border-green-200">GOAT-{c.id}</span>
                  <p className="font-semibold text-green-900 mt-1">{c.name}</p>
                  <p className="text-xs text-green-700">{c.breed} · {c.gender}</p>
                </div>
              )) : <p className="text-sm text-gray-400">No registered offspring.</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}