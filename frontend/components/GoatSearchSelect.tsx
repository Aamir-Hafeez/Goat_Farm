'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';

export interface GoatOption {
  id: number | string;
  name: string;
  breed?: string | null;
  gender?: string | null;
}

interface GoatSearchSelectProps {
  goats: GoatOption[];
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
}

export default function GoatSearchSelect({
  goats,
  value,
  onChange,
  placeholder = 'Select a goat',
}: GoatSearchSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = useMemo(
    () => goats.find((g) => String(g.id) === String(value)) || null,
    [goats, value]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return goats;
    return goats.filter((g) => {
      const id = String(g.id).toLowerCase();
      return (
        String(g.name || '').toLowerCase().includes(q) ||
        id.includes(q) ||
        `goat-${id}`.includes(q) ||
        String(g.breed || '').toLowerCase().includes(q)
      );
    });
  }, [goats, query]);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
    } else {
      setQuery('');
    }
  }, [open]);

  const choose = (id: string) => {
    onChange(id);
    setOpen(false);
  };

  return (
    <div ref={wrapRef} className="relative w-full sm:w-auto sm:min-w-[320px]">
      <button
        type="button"
        onClick={() => setOpen((visible) => !visible)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-3 border border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-white text-left focus:outline-none focus:ring-2 focus:ring-forest/50"
      >
        {selected ? (
          <span className="flex items-center gap-2 flex-wrap min-w-0">
            <span className="font-mono text-[10px] font-semibold bg-forest/10 text-forest px-1.5 py-0.5 rounded shrink-0">
              GOAT-{selected.id}
            </span>
            <span className="font-medium text-gray-900 truncate">{selected.name}</span>
            {selected.breed && <span className="text-xs text-gray-500">{selected.breed}</span>}
          </span>
        ) : (
          <span className="text-gray-400">{placeholder}</span>
        )}
        <ChevronDown
          className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="absolute z-30 mt-2 w-full rounded-xl border border-gray-200 bg-white shadow-xl overflow-hidden">
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by name, GOAT ID or breed..."
                className="w-full pl-8 pr-8 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest/40"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  aria-label="Clear search"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          <ul role="listbox" className="max-h-60 overflow-y-auto py-1">
            {filtered.length === 0 && (
              <li className="px-3 py-6 text-center text-sm text-gray-400">
                No goats match &ldquo;{query}&rdquo;.
              </li>
            )}
            {filtered.map((goat) => {
              const isSelected = String(goat.id) === String(value);
              return (
                <li key={goat.id} role="option" aria-selected={isSelected}>
                  <button
                    type="button"
                    onClick={() => choose(String(goat.id))}
                    className={`w-full text-left px-3 py-2.5 flex items-center gap-2 hover:bg-green-50 transition-colors ${
                      isSelected ? 'bg-green-50' : ''
                    }`}
                  >
                    <span className="font-mono text-[10px] font-semibold bg-forest/10 text-forest px-1.5 py-0.5 rounded shrink-0">
                      GOAT-{goat.id}
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm font-medium text-gray-800 truncate">
                        {goat.name}
                      </span>
                      {goat.breed && (
                        <span className="block text-xs text-gray-500">{goat.breed}</span>
                      )}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
