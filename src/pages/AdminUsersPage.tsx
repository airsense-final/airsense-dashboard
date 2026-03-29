import { useState, useEffect } from 'react';
import { getUsers, getPendingUsers, updateUserRole, updateUserStatus, deleteUser, getCompanies, getCurrentUser } from '../services/apiService';
import { DeleteUserModal } from '../components/DeleteUserModal';
import type { User, Company } from '../types/types';

export function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<string>('all');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'active' | 'pending'>('active');
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [usersData, pendingUsersData, companiesData, userData] = await Promise.all([
        getUsers(),
        getPendingUsers(),
        getCompanies(),
        getCurrentUser()
      ]);
      setCurrentUser(userData);
      setUsers(usersData);
      setPendingUsers(pendingUsersData);
      setCompanies(companiesData);

      // Auto-select company for companyadmin and manager
      if (userData.role === 'companyadmin' || userData.role === 'manager') {
        setSelectedCompany(userData.company_id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      setError(null);
      const data = await getUsers();
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      setError(null);
      await updateUserRole(userId, newRole);
      setSuccessMessage('User role updated successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user role');
    }
  };

  const handleStatusToggle = async (userId: string, currentStatus: boolean) => {
    try {
      setError(null);
      await updateUserStatus(userId, !currentStatus);
      setSuccessMessage(`User ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
      setTimeout(() => setSuccessMessage(null), 3000);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user status');
    }
  };

  // Deletion is handled via DeleteUserModal's onConfirm

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'superadmin':
        return 'bg-purple-500/10 text-purple-400 light:text-purple-800 border border-purple-500 light:border-purple-700/20';
      case 'companyadmin':
        return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
      case 'manager':
        return 'bg-green-500/10 text-green-400 light:text-green-800 border border-green-500 light:border-green-700/20';
      case 'viewer':
        return 'bg-gray-500/10 text-gray-400 border border-gray-500/20';
      default:
        return 'bg-gray-500/10 text-gray-400 border border-gray-500/20';
    }
  };

  const getCompanyName = (companyId: string, fallbackName?: string) => {
    const company = companies.find(c => c._id === companyId);
    if (company) return company.name;
    if (fallbackName && fallbackName.trim()) return fallbackName;
    return 'Unknown';
  };

  const filteredUsers = selectedCompany === 'all'
    ? users
    : users.filter(user => user.company_id === selectedCompany);

  const usersByCompany = companies.reduce((acc, company) => {
    acc[company._id] = users.filter(u => u.company_id === company._id).length;
    return acc;
  }, {} as Record<string, number>);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 light:bg-gray-50 text-white light:text-gray-900 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-xl">Loading users...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 light:bg-gray-50 text-white light:text-gray-900 p-3 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-4 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">User Management</h1>
          <p className="text-gray-400 light:text-gray-500 text-xs sm:text-sm">Manage user roles and access permissions</p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6 flex gap-2">
          <button
            onClick={() => setActiveTab('active')}
            className={`flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-lg active:scale-95 ${activeTab === 'active'
              ? 'bg-cyan-600 light:bg-cyan-800 text-white shadow-cyan-900/20'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700 light:bg-gray-100 light:text-gray-500 light:hover:bg-gray-200'
              }`}
          >
            Active ({users.length})
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            className={`flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-lg active:scale-95 relative ${activeTab === 'pending'
              ? 'bg-cyan-600 light:bg-cyan-800 text-white shadow-cyan-900/20'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700 light:bg-gray-100 light:text-gray-500 light:hover:bg-gray-200'
              }`}
          >
            Pending ({pendingUsers.length})
            {pendingUsers.length > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 sm:h-5 sm:w-5 items-center justify-center rounded-full bg-red-500 text-[10px] sm:text-xs text-white">
                {pendingUsers.length}
              </span>
            )}
          </button>
        </div>

        {/* Active Users Tab */}
        {activeTab === 'active' && (
          <>
            {/* Company Filter - only for superadmin */}
            {currentUser && currentUser.role === 'superadmin' && (
              <div className="mb-6 bg-gray-800/40 backdrop-blur-md p-4 rounded-2xl border border-gray-700/50 shadow-xl flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">Filter Context</label>
                <select
                  value={selectedCompany}
                  onChange={(e) => setSelectedCompany(e.target.value)}
                  className="flex-1 max-w-md px-4 py-2.5 bg-gray-900 light:bg-gray-50 border border-gray-700 light:border-gray-200 rounded-xl text-white light:text-gray-900 text-xs font-bold outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all appearance-none cursor-pointer"
                >
                  <option value="all">ALL COMPANIES ({users.length})</option>
                  {companies.map((company) => (
                    <option key={company._id} value={company._id}>
                      {company.name.toUpperCase()} ({usersByCompany[company._id] || 0})
                    </option>
                  ))}
                </select>
                {selectedCompany !== 'all' && (
                  <button
                    onClick={() => setSelectedCompany('all')}
                    className="text-xs font-bold text-cyan-400 light:text-cyan-800 hover:text-cyan-300 uppercase tracking-widest ml-2"
                  >
                    Clear filter
                  </button>
                )}
              </div>
            )}

            {/* Company info display for non-superadmin */}
            {currentUser && currentUser.role !== 'superadmin' && (
              <div className="mb-6 p-4 bg-gray-800 light:bg-white rounded-lg border border-gray-700 light:border-gray-200">
                <span className="text-gray-400 light:text-gray-500">Viewing users from: </span>
                <span className="text-cyan-400 light:text-cyan-800 font-semibold">{getCompanyName(currentUser.company_id, currentUser.company_name)}</span>
              </div>
            )}

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

            <div className="bg-gray-800 light:bg-white rounded-lg overflow-hidden border border-gray-700 light:border-gray-200 shadow-lg">
              {/* Desktop Table View - ORIGINAL */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-700 light:bg-gray-100">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 light:text-gray-700 light:text-gray-600 uppercase tracking-wider">
                        Username
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 light:text-gray-700 light:text-gray-600 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 light:text-gray-700 light:text-gray-600 uppercase tracking-wider">
                        Company
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 light:text-gray-700 light:text-gray-600 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 light:text-gray-700 light:text-gray-600 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 light:text-gray-700 light:text-gray-600 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700 light:divide-gray-200">
                    {filteredUsers.map((user) => (
                      <tr key={user._id} className="hover:bg-gray-750">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium">{user.username}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-400 light:text-gray-500">{user.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-3 py-1 bg-indigo-500/20 text-indigo-400 rounded-full text-xs font-semibold">
                            {getCompanyName(user.company_id, user.company_name)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <select
                            value={user.role}
                            onChange={(e) => handleRoleChange(user._id, e.target.value)}
                            className={`${getRoleBadgeColor(user.role)} px-3 py-1 rounded-full text-xs font-semibold`}
                          >
                            <option value="superadmin">Super Admin</option>
                            <option value="companyadmin">Company Admin</option>
                            <option value="manager">Manager</option>
                            <option value="viewer">Viewer</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold border ${user.is_active
                              ? 'bg-green-500/10 text-green-500 light:bg-green-100 light:text-green-800 light:border-green-200'
                              : 'bg-red-500/10 text-red-500 light:bg-red-100 light:text-red-800 light:border-red-200'
                              }`}
                          >
                            {user.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                          <div className="flex justify-center gap-3">
                            <button
                              onClick={() => handleStatusToggle(user._id, user.is_active)}
                              className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all border ${user.is_active
                                ? 'bg-red-500/10 text-red-400 light:text-red-800 border-red-500 light:border-red-700/20 hover:bg-red-500 hover:text-white'
                                : 'bg-green-500/10 text-green-400 light:text-green-800 border-green-500 light:border-green-700/20 hover:bg-green-500 hover:text-white'
                                } light:hover:text-gray-900`}
                            >
                              {user.is_active ? 'Deactivate' : 'Activate'}
                            </button>
                            {currentUser && (
                              (currentUser.role === 'superadmin') ||
                              (currentUser.role === 'companyadmin' && currentUser.company_id === user.company_id)
                            ) && currentUser._id !== user._id && (
                                <button
                                  onClick={() => setDeleteTarget(user)}
                                  className="px-4 py-1.5 bg-gray-800 light:bg-white text-gray-400 light:text-gray-500 hover:bg-red-600 hover:text-white light:hover:text-gray-900 border border-gray-700 light:border-gray-200 hover:border-red-600 rounded-xl text-xs font-semibold transition-all"
                                >
                                  Delete
                                </button>
                              )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View - NEW */}
              <div className="md:hidden divide-y divide-gray-700 light:divide-gray-200">
                {filteredUsers.map((user) => (
                  <div key={user._id} className="p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-sm font-bold text-white light:text-gray-900 tracking-tight">{user.username}</div>
                        <div className="text-[10px] text-gray-500 mt-0.5">{user.email}</div>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase border ${user.is_active ? 'bg-green-500/10 text-green-500 light:bg-green-100 light:text-green-800 light:border-green-200' : 'bg-red-500/10 text-red-400 light:text-red-800 light:border-red-700/20'}`}>
                        {user.is_active ? 'ACTIVE' : 'OFF'}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-bold text-cyan-400 light:text-cyan-800 uppercase tracking-widest bg-cyan-400/5 light:bg-cyan-100 px-2 py-0.5 rounded">
                        {getCompanyName(user.company_id, user.company_name)}
                      </span>
                      <select 
                        value={user.role} 
                        onChange={(e) => handleRoleChange(user._id, e.target.value)} 
                        className="bg-gray-900 light:bg-gray-50 text-white light:text-gray-900 text-[10px] px-2 py-1 rounded border border-gray-700 light:border-gray-200 outline-none"
                      >
                        <option value="superadmin">SUPER</option>
                        <option value="companyadmin">ADMIN</option>
                        <option value="manager">MGR</option>
                        <option value="viewer">VIEW</option>
                      </select>
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button onClick={() => handleStatusToggle(user._id, user.is_active)} className={`flex-1 py-2 rounded-lg text-[10px] font-black transition-all ${user.is_active ? 'bg-red-600/10 text-red-500 light:text-red-800 border border-red-500 light:border-red-700/20' : 'bg-green-600/10 text-green-500 light:text-green-800 border border-green-500 light:border-green-700/20'}`}>
                        {user.is_active ? 'DEACTIVATE' : 'ACTIVATE'}
                      </button>
                      {currentUser && ((currentUser.role === 'superadmin') || (currentUser.role === 'companyadmin' && currentUser.company_id === user.company_id)) && currentUser._id !== user._id && (
                        <button onClick={() => setDeleteTarget(user)} className="px-3 py-2 bg-gray-900 light:bg-gray-50 border border-gray-700 light:border-gray-200 text-red-500 rounded-lg">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {filteredUsers.length === 0 && !loading && (
              <div className="text-center py-12 text-gray-400 light:text-gray-500">
                {selectedCompany === 'all' ? 'No users found.' : 'No users found for this company.'}
              </div>
            )}
          </>
        )}

        {/* Pending Users Tab */}
        {activeTab === 'pending' && (
          <>
            {/* Company info display */}
            {currentUser && currentUser.role !== 'superadmin' && (
              <div className="mb-6 p-4 bg-gray-800 light:bg-white rounded-lg border border-gray-700 light:border-gray-200">
                <span className="text-gray-400 light:text-gray-500">Viewing pending users from: </span>
                <span className="text-cyan-400 light:text-cyan-800 font-semibold">{getCompanyName(currentUser.company_id, currentUser.company_name)}</span>
              </div>
            )}

            <div className="bg-gray-800 light:bg-white rounded-lg overflow-hidden border border-gray-700 light:border-gray-200 shadow-lg">
              {/* Desktop Table View - ORIGINAL */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-700 light:bg-gray-100">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 light:text-gray-700 light:text-gray-600 uppercase tracking-wider">
                        Username
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 light:text-gray-700 light:text-gray-600 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 light:text-gray-700 light:text-gray-600 uppercase tracking-wider">
                        Company
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 light:text-gray-700 light:text-gray-600 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700 light:divide-gray-200">
                    {pendingUsers.map((user) => (
                      <tr key={user._id} className="hover:bg-gray-750">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium">{user.username}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-400 light:text-gray-500">{user.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-3 py-1 bg-indigo-500/20 text-indigo-400 rounded-full text-xs font-semibold">
                            {getCompanyName(user.company_id, user.company_name)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleStatusToggle(user._id, user.is_active)}
                              className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded transition-colors"
                            >
                              ✓ Approve
                            </button>
                            <button
                              onClick={() => setDeleteTarget(user)}
                              className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded transition-colors"
                            >
                              ✗ Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View - NEW */}
              <div className="md:hidden divide-y divide-gray-700 light:divide-gray-200">
                {pendingUsers.map((user) => (
                  <div key={user._id} className="p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-sm font-bold text-white light:text-gray-900 tracking-tight">{user.username}</div>
                        <div className="text-[10px] text-gray-500 mt-0.5">{user.email}</div>
                      </div>
                      <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded text-[9px] font-black uppercase">PENDING</span>
                    </div>
                    <div className="text-[10px] font-bold text-cyan-400 light:text-cyan-800 uppercase tracking-widest bg-cyan-400/5 px-2 py-0.5 rounded inline-block">
                      {getCompanyName(user.company_id, user.company_name)}
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button onClick={() => handleStatusToggle(user._id, user.is_active)} className={`flex-1 py-2 bg-green-600 text-white rounded-lg text-[10px] font-bold shadow-lg shadow-green-900/20 overflow-hidden`}>APPROVE</button>
                      <button onClick={() => setDeleteTarget(user)} className="px-4 py-2 bg-gray-900 light:bg-gray-50 border border-gray-700 light:border-gray-200 text-red-500 rounded-lg text-[10px] font-bold">REJECT</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {pendingUsers.length === 0 && !loading && (
              <div className="text-center py-12 text-gray-400 light:text-gray-500">
                <svg aria-hidden="true" className="mx-auto h-12 w-12 text-gray-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p>No pending approvals</p>
              </div>
            )}
          </>
        )}
      </div>
      <DeleteUserModal
        isOpen={!!deleteTarget}
        user={deleteTarget}
        companyName={deleteTarget ? getCompanyName(deleteTarget.company_id, deleteTarget.company_name) : undefined}
        onClose={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (!deleteTarget) return;
          await deleteUser(deleteTarget._id);
          setSuccessMessage(`User "${deleteTarget.username}" has been permanently deleted`);
          setTimeout(() => setSuccessMessage(null), 3000);
          setDeleteTarget(null);
          await loadData();
        }}
      />
    </div>
  );
}
