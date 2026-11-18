'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  GitMerge,
  Calendar,
  Heart,
  Baby,
  Users,
  Network,
  Activity,
  Utensils,
  BarChart3,
  Banknote,
  FileText,
  UserCog,
  Settings,
  Stethoscope,
  X
} from 'lucide-react';

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Goat Management', href: '/goats', icon: Users },
  { name: 'Breeding Management', href: '/breeding', icon: GitMerge },
  { name: 'Breeding Calendar', href: '/calendar', icon: Calendar },
  { name: 'Pregnancy Tracking', href: '/pregnancy', icon: Heart },
  { name: 'Kidding & Deliveries', href: '/kiddings', icon: Baby },
  { name: 'Goat Family Tree', href: '/genealogy', icon: Network },
  { name: 'Health & Vaccination', href: '/health', icon: Stethoscope },
  { name: 'Feeding Management', href: '/feeding', icon: Utensils },
  { name: 'Breeding Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Financial Management', href: '/finance', icon: Banknote },
  { name: 'Reports', href: '/reports', icon: FileText },
  { name: 'User Management', href: '/users', icon: UserCog, adminOnly: true },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export default function Sidebar({
  role,
  open,
  onClose,
}: {
  role?: string;
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const route = pathname.replace(/\/+$/, '') || '/';
  const items = navItems.filter((item) => !item.adminOnly || role === 'admin');

  return (
    <aside
      className={`w-72 bg-forest text-white flex flex-col h-full lg:h-screen overflow-y-auto shadow-xl fixed inset-y-0 left-0 z-40 transform transition-transform duration-200 lg:static lg:translate-x-0 lg:z-auto ${
        open ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div className="p-8 border-b border-forest-dark flex items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-extrabold tracking-tight">My Goat</h1>
          <p className="text-lightGreen text-sm uppercase tracking-widest font-medium">Farm Management</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close menu"
          className="lg:hidden p-1.5 -mr-1 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      <nav className="flex-1 px-6 py-6 space-y-2">
        {items.map((item) => {
          const active = route === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              prefetch={false}
              onClick={onClose}
              className={`flex items-center gap-4 px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-200 ${
                active ? 'bg-white/15' : 'hover:bg-white/5 active:bg-white/10'
              }`}
            >
              <item.icon className="w-6 h-6 text-lightGreen" />
              {item.name}
            </Link>
          );
        })}
      </nav>
      <div className="p-6 border-t border-forest-dark text-xs text-white/50 text-center">
        © 2026 My Goat. All rights reserved.
      </div>
    </aside>
  );
}