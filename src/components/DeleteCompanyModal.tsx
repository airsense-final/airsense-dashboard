import React, { useEffect, useState } from 'react';
import type { Company, User } from '../types/types';

interface DeleteCompanyModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => Promise<void> | void;
    company: Company | null;
    canDelete?: boolean;
    permissionMessage?: string;
    companyAdmins?: User[];
    adminsLoading?: boolean;
}

export const DeleteCompanyModal: React.FC<DeleteCompanyModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    company,
    canDelete = true,
    permissionMessage,
    companyAdmins = [],
    adminsLoading = false,
}) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            setError(null);
            setIsLoading(false);
        }
    }, [isOpen, company, canDelete, permissionMessage]);

    if (!isOpen || !company) return null;

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
            setError(err?.message || 'Failed to delete company');
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        setError(null);
        setIsLoading(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
            <div className="w-full max-w-lg rounded-lg bg-gray-800 p-6 shadow-xl">
                <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-2xl font-bold text-white">Confirm Company Deletion</h3>
                    <button
                        onClick={handleClose}
                        className="text-2xl text-gray-400 hover:text-white"
                        disabled={isLoading}
                    >
                        ×
                    </button>
                </div>

                {(error || (!canDelete && permissionMessage)) && (
                    <div className="mb-4 rounded border border-red-500 bg-red-500/10 p-3 text-red-200">
                        {error || permissionMessage}
                    </div>
                )}

                <div className="mb-6 space-y-3 rounded-lg bg-gray-700 p-4">
                    <div className="flex items-center justify-between">
                        <span className="text-gray-300">Company ID</span>
                        <span className="font-mono text-sm text-white">{company._id}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-gray-300">Company Name</span>
                        <span className="font-semibold text-white">{company.name}</span>
                    </div>
                    <div className="pt-3 border-t border-gray-600">
                        <div className="text-gray-300 mb-2 font-medium">Company Admins</div>
                        {adminsLoading ? (
                            <div className="text-sm text-gray-400">Loading admins...</div>
                        ) : companyAdmins.length > 0 ? (
                            <ul className="space-y-2">
                                {companyAdmins.map((admin) => (
                                    <li key={admin._id} className="flex items-center justify-between rounded bg-gray-800/60 px-3 py-2">
                                        <div className="text-sm text-white">{admin.username}</div>
                                        <div className="text-xs text-gray-400">{admin.email}</div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="text-sm text-gray-400">No company admins found.</div>
                        )}
                    </div>
                </div>

                <div className="mb-6 rounded-lg border border-yellow-500/50 bg-yellow-500/10 p-4">
                    <div className="flex items-start gap-3">
                        <svg aria-hidden="true" className="h-6 w-6 flex-shrink-0 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <div>
                            <h4 className="font-semibold text-yellow-400 mb-1">Warning</h4>
                            <p className="text-sm text-yellow-200">
                                This will permanently delete the company and all associated data, including users and sensors. This action cannot be undone.
                            </p>
                        </div>
                    </div>
                </div>

                <p className="mb-4 text-center text-gray-300">Are you sure you want to proceed?</p>

                <div className="flex gap-3">
                    <button
                        onClick={handleClose}
                        className="flex-1 rounded-lg bg-gray-600 px-4 py-2 text-gray-100 hover:bg-gray-700"
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
