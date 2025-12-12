import React, { useState, useEffect } from 'react';
import { register, getInstitutions } from '../services/apiService';
import type { Institution } from '../types/types';

export const RegisterPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [institutionId, setInstitutionId] = useState<number | ''>('');
    const [institutions, setInstitutions] = useState<Institution[]>([]);
    
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchInst = async () => {
            try {
                const data = await getInstitutions();
                setInstitutions(data);
                if (data.length > 0) setInstitutionId(data[0].id);
            } catch (err) {
                console.error("Failed to load institutions", err);
                setError("Could not load institutions list.");
            }
        };
        fetchInst();
    }, []);

    const validateEmail = (email: string) => {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (!validateEmail(email)) {
            setError("Please enter a valid email address format.");
            setLoading(false);
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            setLoading(false);
            return;
        }

        if (!institutionId) {
            setError("Please select an institution.");
            setLoading(false);
            return;
        }

        try {
            await register({
                email,
                password,
                full_name: fullName,
                institution_id: Number(institutionId)
            });
            setSuccess(true);
        } catch (err) {
            console.error(err);
            const errorMessage = err instanceof Error ? err.message : 'Registration failed.';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleInvalid = (e: React.FormEvent<HTMLInputElement | HTMLSelectElement>, message: string) => {
        (e.target as HTMLInputElement).setCustomValidity(message);
    };

    const handleInput = (e: React.FormEvent<HTMLInputElement | HTMLSelectElement>) => {
        (e.target as HTMLInputElement).setCustomValidity('');
    };

    if (success) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
                 <div className="bg-gray-800 rounded-lg shadow-xl p-8 w-full max-w-md border border-green-500 text-center">
                    <h2 className="text-2xl font-bold text-white mb-2">Registration Successful!</h2>
                    <p className="text-gray-300 mb-6">
                        Your account has been created successfully. It is currently pending approval.
                    </p>
                    <a href="#/login" className="inline-block bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-6 rounded-lg transition-colors">
                        Return to Login
                    </a>
                 </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
            <div className="bg-gray-800 rounded-lg shadow-xl p-8 w-full max-w-md border border-gray-700">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-cyan-400">Create Account</h1>
                    <p className="text-gray-400 mt-2">Join AirSense Dashboard</p>
                </div>

                {error && (
                    <div className="bg-red-500/20 border border-red-500 text-red-100 px-4 py-3 rounded mb-6 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Full Name</label>
                        <input
                            type="text"
                            required
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            onInvalid={(e) => handleInvalid(e, 'Please enter your full name.')}
                            onInput={handleInput}
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Email Address</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            onInvalid={(e) => handleInvalid(e, 'Please enter a valid email address.')}
                            onInput={handleInput}
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Password</label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            onInvalid={(e) => handleInvalid(e, 'Please choose a password.')}
                            onInput={handleInput}
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Confirm Password</label>
                        <input
                            type="password"
                            required
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            onInvalid={(e) => handleInvalid(e, 'Please confirm your password.')}
                            onInput={handleInput}
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Institution</label>
                        <select
                            required
                            value={institutionId}
                            onChange={(e) => setInstitutionId(Number(e.target.value))}
                            onInvalid={(e) => handleInvalid(e, 'Please select an institution.')}
                            onInput={handleInput}
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-500"
                        >
                            {institutions.length === 0 && <option value="">Loading institutions...</option>}
                            {institutions.map(inst => (
                                <option key={inst.id} value={inst.id}>{inst.name}</option>
                            ))}
                        </select>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded-lg transition-colors mt-4 disabled:opacity-50"
                    >
                        {loading ? 'Registering...' : 'Register'}
                    </button>
                </form>
                
                <div className="mt-6 text-center text-sm text-gray-400">
                    Already have an account?{' '}
                    <a href="#/login" className="text-cyan-400 hover:text-cyan-300">
                        Login here
                    </a>
                </div>
            </div>
        </div>
    );
};