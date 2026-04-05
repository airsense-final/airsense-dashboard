import React, { useState } from 'react';
import { GoogleLogin, type CredentialResponse } from '@react-oauth/google';
import { googleLogin, login } from '../services/apiService';

interface LoginPageProps {
    onLoginSuccess: () => void;
    isDarkMode: boolean;
}

const EyeIcon = () => (
    <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-400 light:text-gray-500">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

const EyeSlashIcon = () => (
    <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-400 light:text-gray-500">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
    </svg>
);

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess, isDarkMode }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await login({ email, password }); // token is saved inside apiService
            onLoginSuccess();
        } catch (err) {
            console.error(err);
            const errorMessage = err instanceof Error ? err.message : 'Login failed. Please check your credentials.';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleInvalid = (e: React.FormEvent<HTMLInputElement>, message: string) => {
        (e.target as HTMLInputElement).setCustomValidity(message);
    };

    const handleInput = (e: React.FormEvent<HTMLInputElement>) => {
        (e.target as HTMLInputElement).setCustomValidity('');
    };

    const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
        if (!credentialResponse.credential) {
            setError('Google sign-in did not return a valid credential.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            await googleLogin({ id_token: credentialResponse.credential });
            onLoginSuccess();
        } catch (err) {
            console.error(err);
            const errorMessage = err instanceof Error ? err.message : 'Google login failed. Please try again.';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 light:bg-gray-50 flex items-center justify-center p-4">
            <div className="bg-gray-800 light:bg-white rounded-lg shadow-xl p-8 w-full max-w-md border border-gray-700 light:border-gray-200">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-cyan-400 light:text-cyan-800">AirSense Dashboard</h1>
                    <p className="text-gray-400 light:text-gray-500 mt-2">Sign in to your account</p>
                </div>

                {error && (
                    <div className="bg-red-500/20 light:bg-red-50 border border-red-500 light:border-red-700 text-red-100 light:text-red-900 px-4 py-3 rounded mb-6 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-300 light:text-gray-700 mb-2">Email Address</label>
                        <input
                            id="email"
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            onInvalid={(e) => handleInvalid(e, 'Please enter your email address.')}
                            onInput={handleInput}
                            className="w-full bg-gray-700 light:bg-gray-100 border border-gray-600 light:border-gray-300 rounded-lg px-4 py-2 text-white light:text-gray-900 focus:outline-none focus:border-cyan-500 light:focus:border-cyan-700 focus:ring-1 focus:ring-cyan-500 light:focus:ring-cyan-700"
                            placeholder="you@example.com"
                            autoComplete="username"
                        />
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-300 light:text-gray-700 mb-2">Password</label>
                        <div className="relative">
                            <input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                onInvalid={(e) => handleInvalid(e, 'Please enter your password.')}
                                onInput={handleInput}
                                className="w-full bg-gray-700 light:bg-gray-100 border border-gray-600 light:border-gray-300 rounded-lg px-4 py-2 pr-10 text-white light:text-gray-900 focus:outline-none focus:border-cyan-500 light:border-cyan-700 focus:ring-1 focus:ring-cyan-500 light:focus:ring-cyan-700"
                                placeholder="••••••••"
                                autoComplete="current-password"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer focus:outline-none"
                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                            >
                                {showPassword ? <EyeSlashIcon aria-hidden="true" /> : <EyeIcon aria-hidden="true" />}
                            </button>
                        </div>
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-cyan-600 light:bg-cyan-800 hover:bg-cyan-700 light:hover:bg-cyan-900 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 shadow-lg shadow-cyan-600/20"
                    >
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>

                <div className="my-6 flex items-center gap-3 text-gray-400 light:text-gray-500">
                    <span className="h-px flex-1 bg-gray-700 light:bg-gray-300" />
                    <span className="text-xs uppercase tracking-[0.2em]">or</span>
                    <span className="h-px flex-1 bg-gray-700 light:bg-gray-300" />
                </div>

                {googleClientId ? (
                    <div className="flex justify-center">
                        <GoogleLogin
                            onSuccess={handleGoogleSuccess}
                            onError={() => setError('Google sign-in failed. Please try again.')}
                            theme={isDarkMode ? 'filled_blue' : 'outline'}
                            size="large"
                            width={320}
                            text="signin_with"
                            shape="rectangular"
                        />
                    </div>
                ) : (
                    <div className="rounded-lg border border-dashed border-gray-600 light:border-gray-300 px-4 py-3 text-center text-sm text-gray-400 light:text-gray-500">
                        Google sign-in is disabled until <span className="font-medium">VITE_GOOGLE_CLIENT_ID</span> is configured.
                    </div>
                )}

                <div className="mt-6 text-center text-sm text-gray-400 light:text-gray-500">
                    Don&apos;t have an account?{' '}
                    <a href="#/register" className="text-cyan-400 light:text-cyan-800 hover:text-cyan-300 light:hover:text-cyan-900 font-medium">
                        Register here
                    </a>
                </div>
            </div>
        </div>
    );
};
