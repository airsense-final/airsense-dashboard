import React, { useEffect, useState } from 'react';
import { GoogleLogin, type CredentialResponse } from '@react-oauth/google';
import { getCompanies, googleRegister, register } from '../services/apiService';
import type { Company } from '../types/types';

interface RegisterPageProps {
    isDarkMode: boolean;
}

const decodeGooglePayload = (token: string): { email?: string; name?: string; picture?: string } => {
    const parts = token.split('.');
    if (parts.length !== 3) {
        throw new Error('Invalid Google credential.');
    }

    const rawPayload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const paddedPayload = rawPayload + '='.repeat((4 - (rawPayload.length % 4)) % 4);
    return JSON.parse(atob(paddedPayload));
};

export const RegisterPage: React.FC<RegisterPageProps> = ({ isDarkMode }) => {
    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [username, setUsername] = useState('');
    const [companyName, setCompanyName] = useState<string | ''>('');
    const [companies, setCompanies] = useState<Company[]>([]);
    const [googleMode, setGoogleMode] = useState(false);
    const [googleToken, setGoogleToken] = useState('');
    const [googleName, setGoogleName] = useState('');
    const [googlePicture, setGooglePicture] = useState('');
    const [googleNotice, setGoogleNotice] = useState('');

    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchInst = async () => {
            try {
                const data = await getCompanies();
                setCompanies(data);
                if (data.length > 0) setCompanyName(data[0].name);
            } catch (err) {
                console.error("Failed to load companies", err);
                setError("Could not load companies list.");
            }
        };
        fetchInst();
    }, []);

    const validateEmail = (candidate: string) => {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(candidate);
    };

    const inferUsername = (name?: string, candidateEmail?: string) => {
        const source = (name || candidateEmail?.split('@')[0] || 'google_user').toString().toLowerCase();
        return source
            .replace(/[^a-z0-9_.]/g, '_')
            .replace(/\.+/g, '_')
            .replace(/^_+|_+$/g, '') || 'google_user';
    };

    const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
        if (!credentialResponse.credential) {
            setError('Google sign-in did not return a valid credential.');
            return;
        }

        try {
            const payload = decodeGooglePayload(credentialResponse.credential);
            setGoogleMode(true);
            setGoogleToken(credentialResponse.credential);
            setGoogleName(payload.name || '');
            setGooglePicture(payload.picture || '');
            setEmail(payload.email || '');
            setUsername(inferUsername(payload.name, payload.email));
            setGoogleNotice(payload.email ? 'Google bilgileri alındı. Şimdi şirket seçip kaydı tamamla.' : 'Google hesabından e-posta alınamadı.');
            setError('');
        } catch (err) {
            console.error(err);
            setGoogleNotice('');
            setError('Google bilgileri okunamadı. Lütfen tekrar dene.');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setGoogleNotice('');

        if (!companyName) {
            setError("Please select a company.");
            setLoading(false);
            return;
        }

        try {
            if (googleMode) {
                await googleRegister({
                    id_token: googleToken,
                    company_name: companyName,
                });
            } else {
                if (username.trim().length < 3) {
                    setError('Username must be at least 3 characters long.');
                    setLoading(false);
                    return;
                }

                if (!validateEmail(email)) {
                    setError('Please enter a valid email address format.');
                    setLoading(false);
                    return;
                }

                if (password !== confirmPassword) {
                    setError('Passwords do not match.');
                    setLoading(false);
                    return;
                }

                if (password.length < 6) {
                    setError('Password must be at least 6 characters long.');
                    setLoading(false);
                    return;
                }

                await register({
                    username: username.trim(),
                    email: email.trim(),
                    password,
                    password_confirm: confirmPassword,
                    company_name: companyName,
                });
            }
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
            <div className="min-h-screen bg-gray-900 light:bg-gray-50 flex items-center justify-center p-4">
                <div className="bg-gray-800 light:bg-white rounded-lg shadow-xl p-8 w-full max-w-md border border-green-500 light:border-green-700 text-center">
                    <h2 className="text-2xl font-bold text-white light:text-gray-900 mb-2">Registration Successful!</h2>
                    <p className="text-gray-300 light:text-gray-600 mb-6">
                        Your account has been created successfully. It is currently pending approval by admin.
                    </p>
                    <a href="#/login" className="inline-block bg-cyan-600 light:bg-cyan-800 hover:bg-cyan-700 text-white font-bold py-2 px-6 rounded-lg transition-colors shadow-lg shadow-cyan-600/20">
                        Return to Login
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 light:bg-gray-50 flex items-center justify-center p-4">
            <div className="bg-gray-800 light:bg-white rounded-lg shadow-xl p-8 w-full max-w-md border border-gray-700 light:border-gray-200">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-cyan-400 light:text-cyan-800">Create Account</h1>
                    <p className="text-gray-400 light:text-gray-500 mt-2">Join AirSense Dashboard</p>
                </div>

                {error && (
                    <div className="bg-red-500/20 light:bg-red-50 border border-red-500 light:border-red-700 text-red-100 light:text-red-900 px-4 py-3 rounded mb-6 text-sm font-medium">
                        {error}
                    </div>
                )}

                {googleNotice && (
                    <div className="bg-emerald-500/15 light:bg-emerald-50 border border-emerald-500 light:border-emerald-700 text-emerald-100 light:text-emerald-900 px-4 py-3 rounded mb-6 text-sm font-medium">
                        {googleNotice}
                    </div>
                )}

                {googleClientId ? (
                    <div className="mb-6">
                        <div className="flex items-center gap-3 text-gray-400 light:text-gray-500 mb-4">
                            <span className="h-px flex-1 bg-gray-700 light:bg-gray-300" />
                            <span className="text-xs uppercase tracking-[0.2em]">Google ile devam et</span>
                            <span className="h-px flex-1 bg-gray-700 light:bg-gray-300" />
                        </div>
                        <div className="flex justify-center">
                            <GoogleLogin
                                onSuccess={handleGoogleSuccess}
                                onError={() => setError('Google sign-in failed. Please try again.')}
                                theme={isDarkMode ? 'filled_blue' : 'outline'}
                                size="large"
                                width={320}
                                text="signup_with"
                                shape="rectangular"
                            />
                        </div>
                    </div>
                ) : null}

                {googleMode && (
                    <div className="mb-6 rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-4 py-4 text-sm text-cyan-100 light:text-cyan-900 light:bg-cyan-50 light:border-cyan-700/40">
                        <div className="flex items-center gap-3">
                            {googlePicture ? (
                                <img src={googlePicture} alt={googleName || 'Google user'} className="h-10 w-10 rounded-full border border-cyan-400/50" />
                            ) : null}
                            <div>
                                <div className="font-semibold">{googleName || 'Google kullanıcısı'}</div>
                                <div>{email}</div>
                            </div>
                        </div>
                        <div className="mt-3">Google bilgileri alındı. Sadece şirket seçip kaydı tamamla.</div>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {!googleMode && (
                        <>
                            <div>
                                <label htmlFor="username" className="block text-sm font-medium text-gray-300 light:text-gray-700 mb-1">Username</label>
                                <input
                                    id="username"
                                    type="text"
                                    required
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    onInvalid={(e) => handleInvalid(e, 'Please enter a username.')}
                                    onInput={handleInput}
                                    className="w-full bg-gray-700 light:bg-gray-100 border border-gray-600 light:border-gray-300 rounded-lg px-4 py-2 text-white light:text-gray-900 focus:outline-none focus:border-cyan-500 light:focus:border-cyan-700 focus:ring-1 focus:ring-cyan-500 light:focus:ring-cyan-700"
                                    placeholder="your_username"
                                    autoComplete="username"
                                />
                            </div>
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-300 light:text-gray-700 mb-1">Email Address</label>
                                <input
                                    id="email"
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    onInvalid={(e) => handleInvalid(e, 'Please enter a valid email address.')}
                                    onInput={handleInput}
                                    className="w-full bg-gray-700 light:bg-gray-100 border border-gray-600 light:border-gray-300 rounded-lg px-4 py-2 text-white light:text-gray-900 focus:outline-none focus:border-cyan-500 light:focus:border-cyan-700 focus:ring-1 focus:ring-cyan-500 light:focus:ring-cyan-700"
                                    placeholder="you@example.com"
                                    autoComplete="email"
                                />
                            </div>
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-300 light:text-gray-700 mb-1">Password</label>
                                <input
                                    id="password"
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    onInvalid={(e) => handleInvalid(e, 'Please choose a password.')}
                                    onInput={handleInput}
                                    className="w-full bg-gray-700 light:bg-gray-100 border border-gray-600 light:border-gray-300 rounded-lg px-4 py-2 text-white light:text-gray-900 focus:outline-none focus:border-cyan-500 light:focus:border-cyan-700 focus:ring-1 focus:ring-cyan-500 light:focus:ring-cyan-700"
                                    placeholder="••••••••"
                                    autoComplete="new-password"
                                />
                            </div>
                            <div>
                                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 light:text-gray-700 mb-1">Confirm Password</label>
                                <input
                                    id="confirmPassword"
                                    type="password"
                                    required
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    onInvalid={(e) => handleInvalid(e, 'Please confirm your password.')}
                                    onInput={handleInput}
                                    className="w-full bg-gray-700 light:bg-gray-100 border border-gray-600 light:border-gray-300 rounded-lg px-4 py-2 text-white light:text-gray-900 focus:outline-none focus:border-cyan-500 light:focus:border-cyan-700 focus:ring-1 focus:ring-cyan-500 light:focus:ring-cyan-700"
                                    placeholder="••••••••"
                                    autoComplete="new-password"
                                />
                            </div>
                        </>
                    )}

                    {googleMode && (
                        <>
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-300 light:text-gray-700 mb-1">Email Address</label>
                                <input
                                    id="email"
                                    type="email"
                                    required
                                    value={email}
                                    readOnly
                                    className="w-full bg-gray-700 light:bg-gray-100 border border-gray-600 light:border-gray-300 rounded-lg px-4 py-2 text-white light:text-gray-900 opacity-90"
                                />
                            </div>
                            <div>
                                <label htmlFor="username" className="block text-sm font-medium text-gray-300 light:text-gray-700 mb-1">Username</label>
                                <input
                                    id="username"
                                    type="text"
                                    required
                                    value={username}
                                    readOnly
                                    className="w-full bg-gray-700 light:bg-gray-100 border border-gray-600 light:border-gray-300 rounded-lg px-4 py-2 text-white light:text-gray-900 opacity-90"
                                />
                            </div>
                        </>
                    )}
                    <div>
                        <label htmlFor="company" className="block text-sm font-medium text-gray-300 light:text-gray-700 mb-1">Company</label>
                        <select
                            id="company"
                            required
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            onInvalid={(e) => handleInvalid(e, 'Please select a company.')}
                            onInput={handleInput}
                            className="w-full bg-gray-700 light:bg-gray-100 border border-gray-600 light:border-gray-300 rounded-lg px-4 py-2 text-white light:text-gray-900 focus:outline-none focus:border-cyan-500 light:focus:border-cyan-700 focus:ring-1 focus:ring-cyan-500 light:focus:ring-cyan-700"
                        >
                            {companies.length === 0 && <option value="">Loading companies...</option>}
                            {companies.map((company) => (
                                <option key={company._id} value={company.name}>
                                    {company.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-cyan-600 light:bg-cyan-800 hover:bg-cyan-700 light:hover:bg-cyan-900 text-white font-bold py-2 px-4 rounded-lg transition-colors mt-4 disabled:opacity-50 shadow-lg shadow-cyan-600/20"
                    >
                        {loading ? 'Registering...' : (googleMode ? 'Create account with Google' : 'Register')}
                    </button>
                </form>

                <div className="mt-6 text-center text-sm text-gray-400 light:text-gray-500 font-medium">
                    Already have an account?{' '}
                    <a href="#/login" className="text-cyan-400 light:text-cyan-800 hover:text-cyan-300 light:hover:text-cyan-900">
                        Login here
                    </a>
                </div>
            </div>
        </div>
    );
};
