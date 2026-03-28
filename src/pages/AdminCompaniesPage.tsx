import React, { useState, useEffect } from 'react';
import { getCompanies, createCompanyWithAdmin, deleteCompany, getCurrentUser, getUsers } from '../services/apiService';
import type { Company, User } from '../types/types';
import { DeleteCompanyModal } from '../components/DeleteCompanyModal';

export function AdminCompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [adminUsername, setAdminUsername] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Company | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [companyAdmins, setCompanyAdmins] = useState<User[]>([]);
  const [adminsLoading, setAdminsLoading] = useState(false);

  useEffect(() => {
    loadCurrentUser();
    loadCompanies();
  }, []);

  const loadCurrentUser = async () => {
    try {
      const user = await getCurrentUser();
      setCurrentUser(user);
    } catch (err) {
      console.error('Failed to load current user:', err);
    }
  };

  const loadCompanies = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getCompanies();
      setCompanies(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load companies');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newCompanyName.trim()) {
      setError('Company name is required');
      return;
    }

    if (!adminUsername.trim() || !adminEmail.trim() || !adminPassword.trim()) {
      setError('All admin fields are required');
      return;
    }

    if (adminPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      // Single transactional API call - both company and admin created atomically
      await createCompanyWithAdmin({
        company_name: newCompanyName.trim(),
        admin_username: adminUsername.trim(),
        admin_email: adminEmail.trim(),
        admin_password: adminPassword,
      });

      setSuccessMessage('Company and admin created successfully');
      setTimeout(() => setSuccessMessage(null), 3000);

      // Reset form
      setNewCompanyName('');
      setAdminUsername('');
      setAdminEmail('');
      setAdminPassword('');
      setShowAddForm(false);

      await loadCompanies();

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create company and admin');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCompany = async (companyId: string) => {
    const company = companies.find(c => c._id === companyId);
    if (!company) return;

    setDeleteTarget(company);
    setCompanyAdmins([]);
    setAdminsLoading(true);

    try {
      const users = await getUsers();
      const admins = users.filter((u) => u.role === 'companyadmin' && u.company_id === companyId);
      setCompanyAdmins(admins);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load company admins');
    } finally {
      setAdminsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-xl">Loading companies...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-3 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">Company Management</h1>
            <p className="text-gray-400 text-xs sm:text-sm">Manage companies and their access</p>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="w-full sm:w-auto px-3 py-2 sm:px-4 sm:py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors text-xs sm:text-sm font-medium"
          >
            {showAddForm ? 'Cancel' : '+ Add Company'}
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-500/10 border border-red-500 rounded-lg text-red-500">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-4 bg-green-500/10 border border-green-500 rounded-lg text-green-500">
            {successMessage}
          </div>
        )}

        {showAddForm && (
          <div className="mb-6 bg-gray-800 p-6 rounded-lg border border-gray-700">
            <h2 className="text-xl font-semibold mb-4">Add New Company & Admin</h2>
            <form onSubmit={handleCreateCompany} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Company Name *
                </label>
                <input
                  type="text"
                  value={newCompanyName}
                  onChange={(e) => setNewCompanyName(e.target.value)}
                  placeholder="e.g. Acme Corporation"
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500"
                  disabled={submitting}
                  required
                />
              </div>

              <div className="border-t border-gray-700 pt-4 mt-4">
                <h3 className="text-lg font-medium mb-3 text-gray-300">Company Admin Details</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Admin Username *
                    </label>
                    <input
                      type="text"
                      value={adminUsername}
                      onChange={(e) => setAdminUsername(e.target.value)}
                      placeholder="admin.john"
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500"
                      disabled={submitting}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Admin Email *
                    </label>
                    <input
                      type="email"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      placeholder="admin@company.com"
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500"
                      disabled={submitting}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Admin Password *
                    </label>
                    <input
                      type="password"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      placeholder="Min. 6 characters"
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500"
                      disabled={submitting}
                      required
                      minLength={6}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Creating...' : 'Create Company & Admin'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setNewCompanyName('');
                    setAdminUsername('');
                    setAdminEmail('');
                    setAdminPassword('');
                    setError(null);
                  }}
                  disabled={submitting}
                  className="px-6 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700 shadow-lg">
          {/* Desktop Table View - ORIGINAL */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Company ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Company Name
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {companies.map((company) => (
                  <tr key={company._id} className="hover:bg-gray-750">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-400 font-mono">{company._id}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium">{company.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex justify-center">
                        <button
                          onClick={() => handleDeleteCompany(company._id)}
                          className="px-4 py-1.5 bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500 hover:text-white rounded-lg text-xs font-semibold transition-all"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View - NEW */}
          <div className="md:hidden divide-y divide-gray-700">
            {companies.map((company) => (
              <div key={company._id} className="p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-sm font-bold text-white tracking-tight">{company.name}</div>
                    <div className="text-[10px] text-gray-500 font-mono mt-1">{company._id}</div>
                  </div>
                  <button
                    onClick={() => handleDeleteCompany(company._id)}
                    className="p-2 bg-red-600/10 text-red-500 rounded-lg border border-red-500/20 active:scale-90 transition-transform"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {companies.length === 0 && !loading && (
          <div className="text-center py-12 text-gray-400">
            No companies found. Click "Add Company" to create one.
          </div>
        )}
      </div>

      <DeleteCompanyModal
        isOpen={!!deleteTarget}
        company={deleteTarget}
        canDelete={
          currentUser?.role === 'superadmin' &&
          deleteTarget?._id !== currentUser?.company_id
        }
        permissionMessage={
          currentUser?.role !== 'superadmin'
            ? 'Only superadmin can delete companies.'
            : deleteTarget?._id === currentUser?.company_id
              ? 'You cannot delete your own company.'
              : ''
        }
        companyAdmins={companyAdmins}
        adminsLoading={adminsLoading}
        onClose={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (!deleteTarget) return;
          await deleteCompany(deleteTarget._id);
          setSuccessMessage(`Company "${deleteTarget.name}" has been permanently deleted`);
          setTimeout(() => setSuccessMessage(null), 3000);
          setDeleteTarget(null);
          await loadCompanies();
        }}
      />
    </div>
  );
}
