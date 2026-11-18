'use client';

import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Users, Heart, Baby, Banknote, BarChart3, AlertTriangle, Calendar as CalIcon } from 'lucide-react';
import { reportsApi } from '@/lib/api';
import { formatPKR } from '@/lib/currency';

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    reportsApi.summary()
      .then(res => setStats(res.data))
      .catch((err) => setError(err.message || 'Failed to load dashboard'));
  }, []);

  if (error) return <div className="p-8 text-red-600 font-medium">{error}</div>;
  if (!stats) return <div className="p-8">Loading dashboard...</div>;

  return (
    <div className="space-y-8">
      <h1 className="text-4xl font-extrabold text-forest tracking-tight">Dashboard Overview</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Goats', value: stats.total_goats, icon: Users, color: 'text-forest' },
          { label: 'Pregnant Goats', value: stats.pregnant_goats, icon: Heart, color: 'text-pink-600' },
          { label: 'Total Kids Born', value: stats.total_kids_born, icon: Baby, color: 'text-blue-600' },
          { label: 'Net Farm Profit', value: formatPKR(stats.net_profit), icon: Banknote, color: 'text-green-600' }
        ].map((item, i) => (
          <div key={i} className="stat-card flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium uppercase tracking-wider mb-1">{item.label}</p>
              <h3 className={`text-3xl font-bold ${item.color}`}>{item.value}</h3>
            </div>
            <item.icon className={`w-10 h-10 opacity-15 ${item.color}`} />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="card-header">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-amber-500" /> Critical Alerts
            </h2>
          </div>
          <div className="text-base text-gray-600">
            {stats.critical_alerts && stats.critical_alerts.length > 0 ? (
              <ul className="space-y-2">
                {stats.critical_alerts.map((alert: any, i: number) => (
                  <li key={i} className="flex items-center gap-2 text-amber-700 font-medium">
                    <span className="w-2 h-2 bg-amber-500 rounded-full"></span> {alert.message}
                  </li>
                ))}
              </ul>
            ) : (
              <p>No urgent medical alerts at this time. All systems are operating normally.</p>
            )}
          </div>
        </div>
        <div className="card">
          <div className="card-header">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-3">
              <CalIcon className="w-6 h-6 text-forest" /> Upcoming Events
            </h2>
          </div>
          <div className="text-base text-gray-600">
            {stats.upcoming_events && stats.upcoming_events.length > 0 ? (
              <ul className="space-y-2">
                {stats.upcoming_events.map((event: any, i: number) => (
                  <li key={i} className="flex items-center justify-between py-1 border-b border-gray-50 last:border-b-0">
                    <span className="font-medium text-gray-700">{event.title}</span>
                    <span className="text-sm text-forest font-semibold">{event.date}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No major upcoming events or deliveries scheduled.</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="card-header">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-3">
              <BarChart3 className="w-6 h-6 text-blue-500" /> Monthly Birth Statistics
            </h2>
          </div>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg border border-gray-200 text-gray-400/70 text-lg font-medium">
            <BarChart3 className="w-16 h-16 text-blue-300 opacity-40 mr-2" />
            <span>Chart Placeholder</span>
          </div>
        </div>
        <div className="card">
          <div className="card-header">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-3">
              <LayoutDashboard className="w-6 h-6 text-green-500" /> Recent Farm Activities
            </h2>
          </div>
          <ul className="space-y-3">
            {stats.recent_activities && stats.recent_activities.length > 0 ? (
              stats.recent_activities.map((activity: any, i: number) => (
                <li key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <span className="w-2 h-2 bg-forest rounded-full mt-2"></span>
                  <div>
                    <p className="font-medium text-gray-800">{activity.description}</p>
                    <p className="text-xs text-gray-500">{activity.date}</p>
                  </div>
                </li>
              ))
            ) : (
              <p className="text-base text-gray-600">No recent activities to display.</p>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}