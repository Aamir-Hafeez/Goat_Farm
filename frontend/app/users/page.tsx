'use client';

import React, { useState, useEffect } from 'react';
import { usersApi, getCurrentUser } from '@/lib/api';
import { UserCog, Plus, X, KeyRound, Trash2, Edit as EditIcon } from 'lucide-react';

const emptyForm = {
  username: '',
  password: '',
  full_name: '',
  email: '',
  phone: '',
  role: 'user',
};

export default function UserManagementPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<any>(emptyForm);
  const currentUser = getCurrentUser();

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await usersApi.list();
      setUsers(res.data);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const openAddModal = () => {
    setEditingId(null);
    setFormData(emptyForm);
    setShowModal(true);
  };

  const openEditModal = (u: any) => {
    setEditingId(u.id);
    setFormData({
      username: u.username,
      password: '',
      full_name: u.full_name || '',
      email: u.email || '',
      phone: u.phone || '',
      role: u.role,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        const payload: any = {
          full_name: formData.full_name,
          email: formData.email,
          phone: formData.phone,
          role: formData.role,
        };
        if (formData.password) payload.password = formData.password;
        await usersApi.update(editingId, payload);
      } else {
        await usersApi.create(formData);
      }
      setShowModal(false);
      setFormData(emptyForm);
      setEditingId(null);
      fetchUsers();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDelete = async (u: any) => {
    if (u.id === currentUser?.id) {
      alert('You cannot delete your own account while logged in.');
      return;
    }
    if (!confirm(`Delete user "${u.username}"? This cannot be undone.`)) return;
    try {
      await usersApi.remove(u.id);
      fetchUsers();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-forest">User Management</h1>
          <p className="text-gray-500 text-sm">Create accounts, assign roles, and control system access.</p>
        </div>
        <button
          onClick={openAddModal}
          className="bg-forest text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-forest/90 transition-colors"
        >
          <Plus className="w-4 h-4" /> Add New User
        </button>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-lg mb-4">{error}</div>}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b text-gray-500 text-xs uppercase tracking-wider">
              <th className="p-4">ID</th>
              <th className="p-4">Staff Member</th>
              <th className="p-4">Username</th>
              <th className="p-4">Role</th>
              <th className="p-4">Created</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {loading ? (
              <tr><td colSpan={6} className="p-6 text-center text-gray-400">Loading users...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={6} className="p-6 text-center text-gray-400">No users found.</td></tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50/50">
                  <td className="p-4 font-medium text-forest">USR-{u.id}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-forest/10 text-forest flex items-center justify-center font-bold text-xs">
                        {(u.full_name || u.username).substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">{u.full_name || u.username}</p>
                        <p className="text-xs text-gray-500">{u.email || 'No email on file'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 font-mono text-gray-600">{u.username}</td>
                  <td className="p-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="p-4 text-gray-500">{u.created_at}</td>
                  <td className="p-4 text-right space-x-3">
                    <button onClick={() => openEditModal(u)} className="text-blue-500 hover:text-blue-700" title="Edit user">
                      <EditIcon className="w-4 h-4 inline-block" />
                    </button>
                    <button onClick={() => handleDelete(u)} className="text-red-500 hover:text-red-700" title="Delete user">
                      <Trash2 className="w-4 h-4 inline-block" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl relative">
            <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold text-forest mb-4 flex items-center gap-2">
              <UserCog className="w-5 h-5" /> {editingId ? 'Edit User' : 'Create New User'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Username</label>
                <input
                  type="text"
                  required
                  disabled={!!editingId}
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest/50 disabled:bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1 flex items-center gap-1">
                  <KeyRound className="w-3 h-3" /> {editingId ? 'Reset Password (optional)' : 'Password'}
                </label>
                <input
                  type="password"
                  required={!editingId}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder={editingId ? 'Leave blank to keep current password' : ''}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest/50"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Full Name</label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest/50"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Phone</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest/50"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest/50"
                >
                  <option value="user">User (add &amp; update only, no delete, 1-day edit lock)</option>
                  <option value="admin">Admin (full control)</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-forest text-white rounded-lg text-sm hover:bg-forest/90">
                  {editingId ? 'Save Changes' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
