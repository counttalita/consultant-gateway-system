import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Mail, Lock, ArrowRight, Loader2, CheckCircle } from 'lucide-react';

export default function Login() {
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [step, setStep] = useState('email'); // 'email' or 'otp'
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const { requestOtp, verifyOtp, user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Redirect if already logged in
    useEffect(() => {
        if (user) {
            const from = location.state?.from?.pathname || getRoleBasedRoute(user);
            navigate(from, { replace: true });
        }
    }, [user, navigate, location]);

    // Helper function to determine redirect route based on user role
    const getRoleBasedRoute = (userData) => {
        const userRoles = userData.roles || [];
        
        // Priority: admin > finance > consultant
        if (userRoles.includes('admin')) return '/admin';
        if (userRoles.includes('finance')) return '/finance';
        return '/consultant';
    };

    const handleEmailSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccessMessage('');
        
        try {
            await requestOtp(email);
            setStep('otp');
            setSuccessMessage('Verification code sent to your email');
        } catch (err) {
            const errorMessage = err.message || 'Failed to send OTP. Please check your email and try again.';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleOtpSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccessMessage('');
        
        try {
            const data = await verifyOtp(email, otp);
            const userData = data.user || data;
            
            // Show success message briefly before redirect
            setSuccessMessage('Login successful! Redirecting...');
            
            // Redirect based on role
            const redirectPath = getRoleBasedRoute(userData);
            
            // Small delay to show success message
            setTimeout(() => {
                navigate(redirectPath, { replace: true });
            }, 500);
        } catch (err) {
            const errorMessage = err.message || 'Invalid OTP. Please try again.';
            setError(errorMessage);
            setOtp(''); // Clear OTP field on error
        } finally {
            setLoading(false);
        }
    };

    const handleChangeEmail = () => {
        setStep('email');
        setOtp('');
        setError('');
        setSuccessMessage('');
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        Consultant Gateway
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        {step === 'email' ? 'Sign in with your email' : 'Enter the verification code'}
                    </p>
                </div>

                {error && (
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
                        <p className="text-sm text-red-700">{error}</p>
                    </div>
                )}

                {successMessage && (
                    <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded flex items-center">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                        <p className="text-sm text-green-700">{successMessage}</p>
                    </div>
                )}

                {step === 'email' ? (
                    <form className="mt-8 space-y-6" onSubmit={handleEmailSubmit}>
                        <div className="rounded-md shadow-sm -space-y-px">
                            <div className="relative">
                                <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                <input
                                    type="email"
                                    required
                                    className="appearance-none rounded-md relative block w-full px-10 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                                    placeholder="Email address"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                            >
                                {loading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Send Code'}
                                {!loading && <ArrowRight className="ml-2 h-5 w-5" />}
                            </button>
                        </div>
                    </form>
                ) : (
                    <form className="mt-8 space-y-6" onSubmit={handleOtpSubmit}>
                        <div className="rounded-md shadow-sm -space-y-px">
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                <input
                                    type="text"
                                    required
                                    className="appearance-none rounded-md relative block w-full px-10 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm tracking-widest"
                                    placeholder="Enter 6-digit code"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    maxLength={6}
                                />
                            </div>
                        </div>

                        <div className="flex justify-between items-center">
                            <button
                                type="button"
                                onClick={handleChangeEmail}
                                className="text-sm text-indigo-600 hover:text-indigo-500"
                                disabled={loading}
                            >
                                Change email
                            </button>
                            <span className="text-xs text-gray-500">
                                Sent to: {email}
                            </span>
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                            >
                                {loading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Verify & Login'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
