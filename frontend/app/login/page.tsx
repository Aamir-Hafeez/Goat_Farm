'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, User, ShieldCheck, Server } from 'lucide-react';
import { authApi, getApiBaseUrl, setApiBaseUrl } from '@/lib/api';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showServerSettings, setShowServerSettings] = useState(false);
  const [serverUrl, setServerUrl] = useState('');
  const [serverMessage, setServerMessage] = useState('');
  const router = useRouter();

  useEffect(() => {
    setServerUrl(getApiBaseUrl());
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await authApi.login(username, password);
      localStorage.setItem('token', data.data.token);
      localStorage.setItem('user', JSON.stringify(data.data.user));
      router.push('/dashboard');
    } catch (err: any) {
      const message = err?.message === 'Failed to fetch'
        ? 'Cannot reach the server. Check the Server connection setting and make sure the backend is running.'
        : err.message || 'Invalid username or password';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveServer = () => {
    const saved = setApiBaseUrl(serverUrl);
    setServerUrl(saved);
    setServerMessage(saved ? 'Server address saved on this device.' : 'Server address reset to default.');
  };

  const handleResetServer = () => {
    setApiBaseUrl('');
    setServerUrl(getApiBaseUrl());
    setServerMessage('Server address reset to default.');
  };

  const fillDemo = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
  };

  return (
    <div className="min-h-screen bg-softGray flex items-center justify-center p-4 sm:p-6">
      <div className="max-w-md w-full min-w-0 bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sm:p-8 space-y-8">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-forest/10 rounded-full flex items-center justify-center mx-auto text-forest">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-extrabold text-forest tracking-tight">My Goat</h1>
          <p className="text-sm text-gray-500">Sign in to manage your farm records</p>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 text-red-700 text-sm rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Username</label>
            <div className="relative">
              <User className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username (admin, user1, user2)"
                className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
            <div className="relative">
              <Lock className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-forest text-white py-3.5 rounded-xl font-bold hover:bg-forest/90 transition-colors shadow-lg shadow-forest/20 flex items-center justify-center gap-2"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <button
            type="button"
            onClick={() => {
              setShowServerSettings((visible) => !visible);
              setServerMessage('');
            }}
            className="w-full flex flex-col items-start gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-3 text-left"
          >
            <span className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <Server className="w-4 h-4 text-forest" />
              Server connection
            </span>
            <span className="text-xs text-gray-500 break-all sm:max-w-[180px] sm:truncate">
              {serverUrl || 'Default'}
            </span>
          </button>

          {showServerSettings && (
            <div className="mt-4 space-y-3">
              <input
                type="text"
                value={serverUrl}
                onChange={(e) => setServerUrl(e.target.value)}
                placeholder="http://192.168.1.10:3001/api"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest text-sm bg-white"
              />
              <p className="text-xs text-gray-500 leading-relaxed">
                On your phone, enter your computer&apos;s Wi-Fi address shown in the backend
                terminal, or your hosted HTTPS address. Leave the default when using the web app.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleSaveServer}
                  className="flex-1 bg-forest text-white py-2 rounded-lg text-sm font-semibold hover:bg-forest/90 transition-colors"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={handleResetServer}
                  className="px-3 py-2 rounded-lg text-sm font-semibold border border-gray-300 text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  Reset
                </button>
              </div>
              {serverMessage && <p className="text-xs font-medium text-forest">{serverMessage}</p>}
            </div>
          )}
        </div>

        <div className="border-t border-gray-100 pt-6 space-y-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Quick Demo Accounts (Click to fill)</p>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => fillDemo('admin', 'admin')}
              className="p-2.5 bg-green-50 hover:bg-green-100 rounded-lg text-xs font-bold text-forest border border-green-200 transition-colors"
            >
              Admin<br/><span className="text-[10px] font-normal text-gray-600">admin / admin</span>
            </button>
            <button
              type="button"
              onClick={() => fillDemo('user1', 'user1')}
              className="p-2.5 bg-blue-50 hover:bg-blue-100 rounded-lg text-xs font-bold text-blue-800 border border-blue-200 transition-colors"
            >
              User 1<br/><span className="text-[10px] font-normal text-gray-600">user1 / user1</span>
            </button>
            <button
              type="button"
              onClick={() => fillDemo('user2', 'user2')}
              className="p-2.5 bg-purple-50 hover:bg-purple-100 rounded-lg text-xs font-bold text-purple-800 border border-purple-200 transition-colors"
            >
              User 2<br/><span className="text-[10px] font-normal text-gray-600">user2 / user2</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
