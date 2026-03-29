import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { changePassword } from '../services/apiService';
import type { ChangePasswordRequest } from '../types/types';

interface ChangePasswordModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ isOpen, onClose }) => {
    const [formData, setFormData] = useState<ChangePasswordRequest>({
        old_password: '',
        new_password: '',
        new_password_confirm: '',
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const [showOldPassword, setShowOldPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError(null);
        setSuccess(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        if (formData.new_password.length < 6) {
            setError("New password must be at least 6 characters long.");
            setLoading(false);
            return;
        }

        if (formData.new_password !== formData.new_password_confirm) {
            setError("New passwords do not match.");
            setLoading(false);
            return;
        }

        if (formData.new_password === formData.old_password) {
            setError("New password cannot be the same as the current password.");
            setLoading(false);
            return;
        }

        try {
            const response = await changePassword(formData);
            setSuccess(response.message || "Password changed successfully.");
            setFormData({
                old_password: '',
                new_password: '',
                new_password_confirm: '',
            });
            setShowOldPassword(false);
            setShowNewPassword(false);
            setShowConfirmPassword(false);
        } catch (err: any) {
            setError(err.message || 'Failed to change password.');
        } finally {
            setLoading(false);
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-gray-800 light:bg-white rounded-2xl shadow-2xl w-full max-w-md border border-gray-700 light:border-gray-200 overflow-hidden transform transition-all duration-300">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-white light:text-gray-900 flex items-center gap-2">
                            <div className="p-2 bg-cyan-500/10 light:bg-cyan-100 rounded-lg">
                                <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-cyan-400 light:text-cyan-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                                </svg>
                            </div>
                            Change Password
                        </h2>
                        <button
                            onClick={onClose}
                            className="p-2 text-gray-400 light:text-gray-500 hover:text-white light:hover:text-gray-900 hover:bg-gray-700 light:hover:bg-gray-100 rounded-lg transition-all"
                        >
                            <svg aria-hidden="true" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {error && (
                            <div className="p-3 bg-red-500/10 light:bg-red-50 border border-red-500 light:border-red-200 rounded-xl text-red-400 light:text-red-800 text-xs font-bold uppercase tracking-wide">
                                {error}
                            </div>
                        )}

                        {success && (
                            <div className="p-3 bg-green-500/10 light:bg-green-50 border border-green-500 light:border-green-200 rounded-xl text-green-400 light:text-green-800 text-xs font-bold uppercase tracking-wide">
                                {success}
                            </div>
                        )}

                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-gray-400 light:text-gray-600 uppercase tracking-widest ml-1">
                                Current Password
                            </label>
                            <div className="relative group">
                                <input
                                    type={showOldPassword ? "text" : "password"}
                                    name="old_password"
                                    value={formData.old_password}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-2.5 bg-gray-700/50 light:bg-gray-50 border border-gray-600 light:border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500 light:focus:ring-cyan-600 focus:border-transparent text-white light:text-gray-900 placeholder-gray-500 transition-all outline-none pr-10 font-medium"
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowOldPassword(!showOldPassword)}
                                    className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 light:text-gray-500 hover:text-cyan-400 light:hover:text-cyan-700 transition-colors"
                                >
                                    {showOldPassword ? (
                                        <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                    ) : (
                                        <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-gray-400 light:text-gray-600 uppercase tracking-widest ml-1">
                                New Password
                            </label>
                            <div className="relative group">
                                <input
                                    type={showNewPassword ? "text" : "password"}
                                    name="new_password"
                                    value={formData.new_password}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-2.5 bg-gray-700/50 light:bg-gray-50 border border-gray-600 light:border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500 light:focus:ring-cyan-600 focus:border-transparent text-white light:text-gray-900 placeholder-gray-500 transition-all outline-none pr-10 font-medium"
                                    placeholder="Minimum 6 characters"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                    className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 light:text-gray-500 hover:text-cyan-400 light:hover:text-cyan-700 transition-colors"
                                >
                                    {showNewPassword ? (
                                        <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                    ) : (
                                        <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-gray-400 light:text-gray-600 uppercase tracking-widest ml-1">
                                Confirm New Password
                            </label>
                            <div className="relative group">
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    name="new_password_confirm"
                                    value={formData.new_password_confirm}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-2.5 bg-gray-700/50 light:bg-gray-50 border border-gray-600 light:border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500 light:focus:ring-cyan-600 focus:border-transparent text-white light:text-gray-900 placeholder-gray-500 transition-all outline-none pr-10 font-medium"
                                    placeholder="Confirm new password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 light:text-gray-500 hover:text-cyan-400 light:hover:text-cyan-700 transition-colors"
                                >
                                    {showConfirmPassword ? (
                                        <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                    ) : (
                                        <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        <div className="flex space-x-3 mt-8">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-4 py-2.5 bg-gray-700 light:bg-gray-100 hover:bg-gray-600 light:hover:bg-gray-200 text-white light:text-gray-900 rounded-xl transition-all font-bold text-xs uppercase tracking-widest shadow-lg shadow-black/10"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 px-4 py-2.5 bg-cyan-600 light:bg-cyan-800 hover:bg-cyan-500 light:hover:bg-cyan-700 text-white rounded-xl transition-all font-bold text-xs uppercase tracking-widest flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-cyan-600/20 light:shadow-cyan-800/10"
                            >
                                {loading ? (
                                    <svg aria-hidden="true" className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                ) : (
                                    'Update Password'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>,
        document.body
    );
};
