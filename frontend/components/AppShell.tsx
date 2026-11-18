'use client';

import Sidebar from '@/components/Sidebar';
import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut, KeyRound, X, Menu } from 'lucide-react';
import { authApi } from '@/lib/api';

function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (newPassword.length < 3) {
      setError('New password is too short.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match.');
      return;
    }
    setSaving(true);
    try {
      await authApi.updatePassword({ current_password: currentPassword, new_password: newPassword });
      setSuccess('Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err.message || 'Failed to update password');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-sm w-full p-6 shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <X className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-bold text-forest mb-4 flex items-center gap-2">
          <KeyRound className="w-5 h-5" /> Change Password
        </h2>
        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-lg mb-4">{error}</div>}
        {success && <div className="bg-green-50 border border-green-200 text-green-700 text-sm p-3 rounded-lg mb-4">{success}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Current Password</label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest/50"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">New Password</label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest/50"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Confirm New Password</label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest/50"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="w-full bg-forest text-white py-2.5 rounded-lg font-bold hover:bg-forest/90 transition-colors"
          >
            {saving ? 'Saving...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // Static export with trailingSlash produces paths like "/login/".
  const route = pathname.replace(/\/+$/, '') || '/';
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [mounted, setMounted] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    setSidebarOpen(false);
    const userStr = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (!token && route !== '/login') {
      router.push('/login');
      return;
    }

    let parsedUser: any = null;
    if (userStr) {
      try {
        parsedUser = JSON.parse(userStr);
        setCurrentUser(parsedUser);
      } catch (e) {
        console.error(e);
      }
    }

    // Guard the admin-only User Management route from direct navigation.
    if (token && route === '/users' && parsedUser && parsedUser.role !== 'admin') {
      router.push('/dashboard');
    }
  }, [route, router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  if (!mounted) return null;

  if (route === '/login') {
    return <div className="min-h-screen">{children}</div>;
  }

  return (
    <div className="min-h-screen flex w-full">
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/40 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}
        <Sidebar
          role={currentUser?.role}
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        <div className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
          <header className="h-16 lg:h-20 bg-white border-b border-gray-100 flex items-center justify-between gap-3 px-4 sm:px-6 lg:px-10 shadow-sm z-10">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                aria-label="Open menu"
                className="lg:hidden p-2 -ml-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors shrink-0"
              >
                <Menu className="w-5 h-5" />
              </button>
              <h2 className="text-base sm:text-xl font-bold text-gray-800 tracking-tight truncate">
                My Goat — Farm Management
              </h2>
            </div>
            <div className="flex items-center gap-2 sm:gap-6 shrink-0">
              {currentUser && (
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu((v) => !v)}
                    className="flex items-center gap-3"
                  >
                    <div className="hidden sm:block text-right">
                      <p className="text-sm font-bold text-gray-800">{currentUser.full_name || currentUser.username}</p>
                      <span className="text-xs font-semibold text-forest uppercase tracking-wider bg-green-50 px-2 py-0.5 rounded-full">
                        {currentUser.role}
                      </span>
                    </div>
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-forest text-white flex items-center justify-center font-bold text-sm shadow-md">
                      {currentUser.username ? currentUser.username.substring(0, 2).toUpperCase() : 'AD'}
                    </div>
                  </button>
                  {showUserMenu && (
                    <div className="absolute right-0 top-14 bg-white border border-gray-100 shadow-xl rounded-xl p-2 w-48 z-20">
                      <button
                        onClick={() => { setShowUserMenu(false); setShowPasswordModal(true); }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg"
                      >
                        <KeyRound className="w-4 h-4" /> Change Password
                      </button>
                    </div>
                  )}
                </div>
              )}
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-2.5 sm:px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl text-xs font-bold transition-colors border border-red-200"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" /> <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </header>
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-10">
            {children}
          </main>
        </div>
        {showPasswordModal && <ChangePasswordModal onClose={() => setShowPasswordModal(false)} />}
    </div>
  );
}
