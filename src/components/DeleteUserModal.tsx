import React, { useEffect, useState } from 'react';
import type { User } from '../types/types';

interface DeleteUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => Promise<void> | void;
    user: User | null;
    companyName?: string;
    canDelete?: boolean;
    permissionMessage?: string;
}

export const DeleteUserModal: React.FC<DeleteUserModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    user,
    companyName,
    canDelete = true,
    permissionMessage,
}) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            // Clear stale state when opening/switching user; keep permission info if blocked.
            setError(null);
            setIsLoading(false);
        }
    }, [isOpen, user, canDelete, permissionMessage]);

    if (!isOpen || !user) return null;

    const handleConfirm = async () => {
        if (!canDelete) {
            setError(permissionMessage || 'You do not have permission to perform this action.');
            return;
        }
        try {
            setError(null);
            setIsLoading(true);
            await onConfirm();
        } catch (err: any) {
            setError(err?.message || 'Failed to delete user');
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        setError(null);
        setIsLoading(false);
        onClose();
    };

    const statusBadge = user.is_active
        ? 'bg-green-500/20 text-green-400 light:text-green-800'
        : 'bg-red-500/20 text-red-400 light:text-red-800';

    const roleColor = (role: string) => {
        switch (role) {
            case 'superadmin':
                return 'bg-purple-500/20 text-purple-300';
            case 'companyadmin':
                return 'bg-blue-500/20 text-blue-300';
            case 'manager':
                return 'bg-green-500/20 text-green-300';
            default:
                return 'bg-gray-500/20 text-gray-300 light:text-gray-700';
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
            <div className="w-full max-w-lg rounded-lg bg-gray-800 light:bg-white p-6 shadow-xl">
                <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-2xl font-bold text-white light:text-gray-900">Confirm User Deletion</h3>
                    <button
                        onClick={handleClose}
                        className="text-2xl text-gray-400 light:text-gray-500 hover:text-white light:hover:text-gray-900"
                        disabled={isLoading}
                    >
                        ×
                    </button>
                </div>

                {(error || (!canDelete && permissionMessage)) && (
                    <div className="mb-4 rounded border border-red-500 light:border-red-700 bg-red-500/10 p-3 text-red-200">{error || permissionMessage}</div>
                )}

                <div className="mb-6 space-y-3 rounded-lg bg-gray-700 light:bg-gray-100 p-4">
                    <div className="flex items-center justify-between">
                        <span className="text-gray-300 light:text-gray-700 light:text-gray-600">Username</span>
                        <span className="font-semibold text-white light:text-gray-900">{user.username}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-gray-300 light:text-gray-700 light:text-gray-600">Email</span>
                        <span className="text-white light:text-gray-900">{user.email}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-gray-300 light:text-gray-700 light:text-gray-600">Company</span>
                        <span className="text-white light:text-gray-900">{companyName || 'Unknown'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-gray-300 light:text-gray-700 light:text-gray-600">Role</span>
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${roleColor(user.role)}`}>
                            {user.role === 'superadmin' ? 'Super Admin' : user.role === 'companyadmin' ? 'Company Admin' : user.role === 'manager' ? 'Manager' : 'Viewer'}
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-gray-300 light:text-gray-700 light:text-gray-600">Activity</span>
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${statusBadge}`}>
                            {user.is_active ? 'Active' : 'Inactive'}
                        </span>
                    </div>
                </div>

                <p className="mb-4 text-center text-gray-300 light:text-gray-700 light:text-gray-600">Delete this user permanently? This action cannot be undone.</p>

                <div className="flex gap-3">
                    <button
                        onClick={handleClose}
                        className="flex-1 rounded-lg bg-gray-600 light:bg-gray-200 px-4 py-2 text-gray-100 hover:bg-gray-700 light:hover:bg-gray-200"
                        disabled={isLoading}
                    >
                        No, Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        className="flex-1 rounded-lg bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed"
                        disabled={isLoading || !canDelete}
                    >
                        {isLoading ? 'Deleting...' : 'Yes, Delete'}
                    </button>
                </div>
            </div>
        </div>
    );
};
