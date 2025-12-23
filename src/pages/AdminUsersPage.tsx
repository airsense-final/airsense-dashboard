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
        return 'bg-purple-500';
      case 'companyadmin':
        return 'bg-blue-500';
      case 'manager':
        return 'bg-green-500';
      case 'viewer':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
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
      <div className="min-h-screen bg-gray-900 text-white p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-xl">Loading users...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">User Management</h1>
          <p className="text-gray-400">Manage user roles and access permissions</p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6 flex gap-2">
          <button
            onClick={() => setActiveTab('active')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${activeTab === 'active'
              ? 'bg-cyan-600 text-white'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
          >
            Active Users ({users.length})
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors relative ${activeTab === 'pending'
              ? 'bg-cyan-600 text-white'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
          >
            Pending Approvals ({pendingUsers.length})
            {pendingUsers.length > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
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
              <div className="mb-6 flex items-center gap-4">
                <label className="text-sm font-medium text-gray-300">Filter by Company:</label>
                <select
                  value={selectedCompany}
                  onChange={(e) => setSelectedCompany(e.target.value)}
                  className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="all">All Companies ({users.length} users)</option>
                  {companies.map((company) => (
                    <option key={company._id} value={company._id}>
                      {company.name} ({usersByCompany[company._id] || 0} users)
                    </option>
                  ))}
                </select>
                {selectedCompany !== 'all' && (
                  <button
                    onClick={() => setSelectedCompany('all')}
                    className="text-sm text-blue-400 hover:text-blue-300 underline"
                  >
                    Clear filter
                  </button>
                )}
              </div>
            )}

            {/* Company info display for non-superadmin */}
            {currentUser && currentUser.role !== 'superadmin' && (
              <div className="mb-6 p-4 bg-gray-800 rounded-lg border border-gray-700">
                <span className="text-gray-400">Viewing users from: </span>
                <span className="text-cyan-400 font-semibold">{getCompanyName(currentUser.company_id, currentUser.company_name)}</span>
              </div>
            )}

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

            <div className="bg-gray-800 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Username
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Company
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {filteredUsers.map((user) => (
                      <tr key={user._id} className="hover:bg-gray-750">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium">{user.username}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-400">{user.email}</div>
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
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${user.is_active
                              ? 'bg-green-500/20 text-green-500'
                              : 'bg-red-500/20 text-red-500'
                              }`}
                          >
                            {user.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleStatusToggle(user._id, user.is_active)}
                              className={`px-4 py-2 rounded ${user.is_active
                                ? 'bg-red-600 hover:bg-red-700'
                                : 'bg-green-600 hover:bg-green-700'
                                } transition-colors`}
                            >
                              {user.is_active ? 'Deactivate' : 'Activate'}
                            </button>
                            {currentUser && (
                              (currentUser.role === 'superadmin') ||
                              (currentUser.role === 'companyadmin' && currentUser.company_id === user.company_id)
                            ) && currentUser._id !== user._id && (
                                <button
                                  onClick={() => setDeleteTarget(user)}
                                  className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded transition-colors"
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
            </div>

            {filteredUsers.length === 0 && !loading && (
              <div className="text-center py-12 text-gray-400">
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
              <div className="mb-6 p-4 bg-gray-800 rounded-lg border border-gray-700">
                <span className="text-gray-400">Viewing pending users from: </span>
                <span className="text-cyan-400 font-semibold">{getCompanyName(currentUser.company_id, currentUser.company_name)}</span>
              </div>
            )}

            <div className="bg-gray-800 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Username
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Company
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {pendingUsers.map((user) => (
                      <tr key={user._id} className="hover:bg-gray-750">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium">{user.username}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-400">{user.email}</div>
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
            </div>

            {pendingUsers.length === 0 && !loading && (
              <div className="text-center py-12 text-gray-400">
                <svg className="mx-auto h-12 w-12 text-gray-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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

