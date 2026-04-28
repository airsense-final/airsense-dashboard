import React, { useState, useEffect } from 'react';
import { getCompanies, createCompanyWithAdmin, deleteCompany, getCurrentUser, getUsers, updateCompanyTier } from '../services/apiService';
import type { Company, User } from '../types/types';
import { DeleteCompanyModal } from '../components/DeleteCompanyModal';

export function AdminCompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [newCompanyTier, setNewCompanyTier] = useState<'starter' | 'mid' | 'enterprise'>('starter');
  const [adminUsername, setAdminUsername] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [updatingTierId, setUpdatingTierId] = useState<string | null>(null);
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

  const handleTierChange = async (companyId: string, newTier: string) => {
    try {
      setUpdatingTierId(companyId);
      setError(null);
      await updateCompanyTier(companyId, newTier);
      
      setCompanies(prev => prev.map(c => 
        c._id === companyId ? { ...c, tier: newTier as any } : c
      ));
      
      setSuccessMessage('Subscription tier updated successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update tier');
    } finally {
      setUpdatingTierId(null);
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

      // Single transactional API call - now with tier
      await createCompanyWithAdmin({
        company_name: newCompanyName.trim(),
        admin_username: adminUsername.trim(),
        admin_email: adminEmail.trim(),
        admin_password: adminPassword,
        tier: newCompanyTier
      });

      setSuccessMessage('Company and admin created successfully');
      setTimeout(() => setSuccessMessage(null), 3000);

      // Reset form
      setNewCompanyName('');
      setNewCompanyTier('starter');
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
      <div className="min-h-screen bg-gray-900 light:bg-gray-50 text-white light:text-gray-900 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-xl">Loading companies...</div>
        </div>
      </div>
    );
  }

  // --- NEW: Calculate Summary Stats ---
  const stats = {
    total: companies.length,
    business: companies.filter(c => c.tier === 'enterprise').length,
    pro: companies.filter(c => c.tier === 'mid').length,
    starter: companies.filter(c => !c.tier || c.tier === 'starter').length
  };

  return (
    <div className="min-h-screen bg-gray-900 light:bg-gray-50 text-white light:text-gray-900 p-3 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* NEW: Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-800/50 light:bg-white border border-gray-700 light:border-gray-200 p-4 rounded-2xl shadow-lg">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Total Orgs</p>
            <p className="text-2xl font-black text-white light:text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-emerald-500/5 light:bg-emerald-50 border border-emerald-500/20 p-4 rounded-2xl shadow-lg">
            <p className="text-[10px] font-bold text-emerald-500/60 uppercase tracking-widest mb-1">Business</p>
            <p className="text-2xl font-black text-emerald-400 light:text-emerald-700">{stats.business}</p>
          </div>
          <div className="bg-cyan-500/5 light:bg-cyan-50 border border-cyan-500/20 p-4 rounded-2xl shadow-lg">
            <p className="text-[10px] font-bold text-cyan-500/60 uppercase tracking-widest mb-1">Pro</p>
            <p className="text-2xl font-black text-cyan-400 light:text-cyan-700">{stats.pro}</p>
          </div>
          <div className="bg-gray-500/5 light:bg-gray-100 border border-gray-500/20 p-4 rounded-2xl shadow-lg">
            <p className="text-[10px] font-bold text-gray-500/60 uppercase tracking-widest mb-1">Starter</p>
            <p className="text-2xl font-black text-gray-400 light:text-gray-600">{stats.starter}</p>
          </div>
        </div>

        <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">Company Management</h1>
            <p className="text-gray-400 light:text-gray-500 text-xs sm:text-sm">Manage companies and their subscription tiers</p>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="w-full sm:w-auto px-5 py-2.5 bg-cyan-600 light:bg-cyan-800 hover:bg-cyan-700 text-white rounded-xl transition-all shadow-lg shadow-cyan-900/20 active:scale-95 text-xs sm:text-sm font-semibold"
          >
            {showAddForm ? 'Cancel' : '+ Add Company'}
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-500/10 border border-red-500 light:border-red-700 rounded-lg text-red-500">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-4 bg-green-500/10 border border-green-500 light:border-green-700 rounded-lg text-green-500">
            {successMessage}
          </div>
        )}

        {showAddForm && (
          <div className="mb-6 bg-gray-800 light:bg-white p-6 rounded-lg border border-gray-700 light:border-gray-200 shadow-2xl">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2 text-cyan-400 light:text-cyan-700">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                New Company Setup
            </h2>
            <form onSubmit={handleCreateCompany} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-300 light:text-gray-700 mb-2">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    value={newCompanyName}
                    onChange={(e) => setNewCompanyName(e.target.value)}
                    placeholder="e.g. Acme Corporation"
                    className="w-full px-4 py-3 bg-gray-700 light:bg-gray-100 border border-gray-600 light:border-gray-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-all"
                    disabled={submitting}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-300 light:text-gray-700 mb-2">
                    Subscription Tier *
                  </label>
                  <select
                    value={newCompanyTier}
                    onChange={(e) => setNewCompanyTier(e.target.value as any)}
                    className="w-full px-4 py-3 bg-gray-700 light:bg-gray-100 border border-gray-600 light:border-gray-300 rounded-xl focus:ring-2 focus:ring-cyan-500 outline-none transition-all"
                    disabled={submitting}
                  >
                    <option value="starter">Starter (1 Device, 10 Users)</option>
                    <option value="mid">Pro (10 Devices, 25 Users)</option>
                    <option value="enterprise">Business (No Limit, Digital Twin)</option>
                  </select>
                </div>
              </div>

              <div className="bg-gray-900/50 light:bg-gray-50 p-6 rounded-2xl border border-gray-700 light:border-gray-200">
                <h3 className="text-md font-bold mb-4 text-gray-200 light:text-gray-800 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Primary Administrator
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider font-bold text-gray-500 mb-1.5 ml-1">
                      Username
                    </label>
                    <input
                      type="text"
                      value={adminUsername}
                      onChange={(e) => setAdminUsername(e.target.value)}
                      placeholder="admin.john"
                      className="w-full px-4 py-2.5 bg-gray-800 light:bg-white border border-gray-600 light:border-gray-300 rounded-lg focus:border-cyan-500 outline-none"
                      disabled={submitting}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-wider font-bold text-gray-500 mb-1.5 ml-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      placeholder="admin@company.com"
                      className="w-full px-4 py-2.5 bg-gray-800 light:bg-white border border-gray-600 light:border-gray-300 rounded-lg focus:border-cyan-500 outline-none"
                      disabled={submitting}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-wider font-bold text-gray-500 mb-1.5 ml-1">
                      Password
                    </label>
                    <input
                      type="password"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-4 py-2.5 bg-gray-800 light:bg-white border border-gray-600 light:border-gray-300 rounded-lg focus:border-cyan-500 outline-none"
                      disabled={submitting}
                      required
                      minLength={6}
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-cyan-900/20 active:scale-[0.98] disabled:opacity-50"
                >
                  {submitting ? 'Setting up...' : 'Provision Company & Admin'}
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
                  className="px-8 py-3 bg-gray-700 light:bg-gray-200 hover:bg-gray-600 light:hover:bg-gray-300 rounded-xl transition-all font-semibold"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-gray-800 light:bg-white rounded-2xl overflow-hidden border border-gray-700 light:border-gray-200 shadow-xl">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-900/50 light:bg-gray-50/50 border-b border-gray-700 light:border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 light:text-gray-500 uppercase tracking-widest">Company</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 light:text-gray-500 uppercase tracking-widest">Subscription Tier</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 light:text-gray-500 uppercase tracking-widest text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700 light:divide-gray-200">
                {companies.map((company) => (
                  <tr key={company._id} className="group hover:bg-gray-700/30 light:hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-white light:text-gray-900">{company.name}</div>
                      <div className="text-[10px] text-gray-500 font-mono mt-0.5">{company._id}</div>
                    </td>
                    <td className="px-6 py-4">
                      {updatingTierId === company._id ? (
                        <div className="flex items-center gap-2">
                           <div className="w-4 h-4 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                           <span className="text-xs text-cyan-400">Updating...</span>
                        </div>
                      ) : (
                        <select
                          value={company.tier || 'starter'}
                          onChange={(e) => handleTierChange(company._id, e.target.value)}
                          disabled={updatingTierId !== null}
                          className={`bg-transparent border rounded px-2 py-1 text-xs font-bold cursor-pointer outline-none transition-all ${
                            company.tier === 'enterprise' 
                              ? 'text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10' 
                              : company.tier === 'mid'
                                ? 'text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/10'
                                : 'text-gray-400 border-gray-500/30 hover:bg-gray-500/10'
                          }`}
                        >
                          <option value="starter" className="bg-gray-800 text-white">Starter</option>
                          <option value="mid" className="bg-gray-800 text-white">Pro</option>
                          <option value="enterprise" className="bg-gray-800 text-white">Business</option>
                        </select>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center">
                        <button
                          onClick={() => handleDeleteCompany(company._id)}
                          className="px-4 py-1.5 text-red-500 hover:bg-red-500/10 rounded-lg text-xs font-bold transition-all opacity-0 group-hover:opacity-100"
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

          {/* Mobile Card View */}
          <div className="md:hidden divide-y divide-gray-700 light:divide-gray-200">
            {companies.map((company) => (
              <div key={company._id} className="p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                        <div className="text-sm font-bold text-white light:text-gray-900 tracking-tight">{company.name}</div>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold uppercase ${
                            company.tier === 'enterprise' ? 'bg-emerald-500/20 text-emerald-400' :
                            company.tier === 'mid' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-gray-500/20 text-gray-400'
                        }`}>
                            {company.tier === 'enterprise' ? 'Business' : company.tier === 'mid' ? 'Pro' : 'Starter'}
                        </span>
                    </div>
                    <div className="text-[10px] text-gray-500 font-mono mt-1">{company._id}</div>
                  </div>
                  <button
                    onClick={() => handleDeleteCompany(company._id)}
                    className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {companies.length === 0 && !loading && (
          <div className="text-center py-20 bg-gray-800/50 light:bg-white rounded-2xl border-2 border-dashed border-gray-700 light:border-gray-200">
            <svg className="w-12 h-12 mx-auto text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <p className="text-gray-400 light:text-gray-500 font-medium text-lg">No companies provisioned yet.</p>
            <p className="text-gray-500 light:text-gray-400 text-sm mt-1">Start by adding your first organization.</p>
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
