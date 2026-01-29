'use client';
import { useState, useEffect } from 'react';
import { PlusIcon, PencilIcon, TrashIcon, XMarkIcon, CheckIcon, XCircleIcon } from '@heroicons/react/24/outline';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  isSuperAdmin: boolean;
  resellerId: string | null;
  createdAt: string;
  lastLogin: string | null;
}

interface UsersProps {
  currentUser: { id: string; isSuperAdmin: boolean } | null;
}

export default function Users({ currentUser }: UsersProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'ADMIN',
    isSuperAdmin: false,
    resellerId: ''
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      if (res.ok) setUsers(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingUser(null);
    setFormData({ email: '', password: '', name: '', role: 'ADMIN', isSuperAdmin: false, resellerId: '' });
    setError('');
    setShowModal(true);
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      password: '',
      name: user.name,
      role: user.role,
      isSuperAdmin: user.isSuperAdmin,
      resellerId: user.resellerId || ''
    });
    setError('');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      const url = editingUser ? `/api/users/${editingUser.id}` : '/api/users';
      const method = editingUser ? 'PATCH' : 'POST';
      
      const payload: any = {
        email: formData.email,
        name: formData.name,
        role: formData.role,
        isSuperAdmin: formData.isSuperAdmin,
        resellerId: formData.resellerId || null
      };

      // Only include password if provided
      if (formData.password) {
        payload.password = formData.password;
      } else if (!editingUser) {
        setError('Passord er påkrevd for nye brukere');
        setSaving(false);
        return;
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Noe gikk galt');
        setSaving(false);
        return;
      }

      setShowModal(false);
      fetchUsers();
    } catch (err) {
      setError('Kunne ikke lagre bruker');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (user: User) => {
    try {
      await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !user.isActive })
      });
      fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  const deleteUser = async (user: User) => {
    if (!confirm(`Er du sikker på at du vil slette ${user.name}?`)) return;
    
    try {
      await fetch(`/api/users/${user.id}`, { method: 'DELETE' });
      fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('nb-NO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin h-8 w-8 border-b-2 border-blue-600 rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Brukere</h1>
          <p className="text-gray-500">{users.length} brukere totalt</p>
        </div>
        <button onClick={openCreateModal} className="btn btn-primary flex items-center">
          <PlusIcon className="w-5 h-5 mr-2" />
          Ny bruker
        </button>
      </div>

      <div className="card">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Navn</th>
                <th>E-post</th>
                <th>Rolle</th>
                <th>Status</th>
                {currentUser?.isSuperAdmin && <th>Reseller</th>}
                <th>Siste innlogging</th>
                <th>Handlinger</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id}>
                  <td className="font-medium">
                    {user.name}
                    {user.isSuperAdmin && (
                      <span className="ml-2 px-2 py-0.5 text-xs bg-purple-100 text-purple-800 rounded">
                        SuperAdmin
                      </span>
                    )}
                  </td>
                  <td>{user.email}</td>
                  <td>
                    <span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-800">
                      {user.role}
                    </span>
                  </td>
                  <td>
                    <button
                      onClick={() => toggleActive(user)}
                      className={`flex items-center gap-1 px-2 py-1 text-xs rounded ${
                        user.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {user.isActive ? (
                        <>
                          <CheckIcon className="w-3 h-3" /> Aktiv
                        </>
                      ) : (
                        <>
                          <XCircleIcon className="w-3 h-3" /> Inaktiv
                        </>
                      )}
                    </button>
                  </td>
                  {currentUser?.isSuperAdmin && (
                    <td className="text-gray-600 text-sm">{user.resellerId || '-'}</td>
                  )}
                  <td className="text-gray-600 text-sm">{formatDate(user.lastLogin)}</td>
                  <td>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEditModal(user)}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                        title="Rediger"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      {user.id !== currentUser?.id && (
                        <button
                          onClick={() => deleteUser(user)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                          title="Slett"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                {editingUser ? 'Rediger bruker' : 'Ny bruker'}
              </h2>
              <button onClick={() => setShowModal(false)}>
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="form-label">Navn *</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="form-label">E-post *</label>
                <input
                  type="email"
                  className="form-input"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="form-label">
                  Passord {editingUser ? '(la tom for å beholde)' : '*'}
                </label>
                <input
                  type="password"
                  className="form-input"
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                  placeholder={editingUser ? '••••••••' : ''}
                />
              </div>

              <div>
                <label className="form-label">Rolle</label>
                <select
                  className="form-input"
                  value={formData.role}
                  onChange={e => setFormData({ ...formData, role: e.target.value })}
                >
                  <option value="ADMIN">Admin</option>
                  <option value="SALES">Salg</option>
                  <option value="SUPPORT">Support</option>
                </select>
              </div>

              {currentUser?.isSuperAdmin && (
                <>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isSuperAdmin"
                      checked={formData.isSuperAdmin}
                      onChange={e => setFormData({ ...formData, isSuperAdmin: e.target.checked })}
                      className="rounded border-gray-300"
                    />
                    <label htmlFor="isSuperAdmin" className="text-sm">
                      SuperAdmin (kan se resellere)
                    </label>
                  </div>

                  <div>
                    <label className="form-label">Reseller ID (valgfritt)</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.resellerId}
                      onChange={e => setFormData({ ...formData, resellerId: e.target.value })}
                      placeholder="F.eks. reseller-123"
                    />
                  </div>
                </>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn btn-secondary flex-1"
                >
                  Avbryt
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn btn-primary flex-1"
                >
                  {saving ? 'Lagrer...' : editingUser ? 'Lagre' : 'Opprett'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
