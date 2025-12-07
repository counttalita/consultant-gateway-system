import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/auth.service';

const AuthContext = createContext(null);

export const AuthProvider = ({ children, initialUser = null }) => {
    const [user, setUser] = useState(initialUser);
    const [loading, setLoading] = useState(true);
    const [sessionChecked, setSessionChecked] = useState(false);

    useEffect(() => {
        checkAuth();
    }, []);

    // Check authentication status on mount
    const checkAuth = async () => {
        // Only check if we haven't checked yet
        if (sessionChecked) return;

        try {
            const userData = await authService.getCurrentUser();
            setUser(userData);
        } catch (error) {
            // If error is 401, user is not authenticated
            // Clear any stale session data
            if (error.status === 401) {
                localStorage.removeItem('session_token');
            }
            setUser(null);
        } finally {
            setLoading(false);
            setSessionChecked(true);
        }
    };

    // Request OTP for email
    const requestOtp = async (email) => {
        try {
            const response = await authService.requestOtp(email);
            return response;
        } catch (error) {
            throw error;
        }
    };

    // Verify OTP and establish session
    const verifyOtp = async (email, otp) => {
        try {
            const response = await authService.validateOtp(email, otp);

            // Update user state with returned user data
            if (response.user) {
                setUser(response.user);
            } else {
                // If user not in response, fetch it
                await checkAuth();
            }

            return response;
        } catch (error) {
            throw error;
        }
    };

    // Logout and clear session
    const logout = useCallback(async () => {
        try {
            // Call logout endpoint to invalidate session on server
            await authService.logout();
        } catch (error) {
            console.error('Logout API call failed:', error);
            // Continue with client-side cleanup even if API call fails
        } finally {
            // Clear user state
            setUser(null);

            // Clear any local storage items
            localStorage.removeItem('session_token');

            // Clear session storage if used
            sessionStorage.clear();
        }
    }, []);

    // Refresh user data
    const refreshUser = useCallback(async () => {
        try {
            const userData = await authService.getCurrentUser();
            setUser(userData);
            return userData;
        } catch (error) {
            console.error('Failed to refresh user:', error);
            throw error;
        }
    }, []);

    // Check if user has specific role
    const hasRole = useCallback((role) => {
        if (!user || !user.roles) return false;
        return user.roles.includes(role);
    }, [user]);

    // Check if user has any of the specified roles
    const hasAnyRole = useCallback((roles) => {
        if (!user || !user.roles) return false;
        return roles.some(role => user.roles.includes(role));
    }, [user]);

    const value = {
        user,
        loading,
        requestOtp,
        verifyOtp,
        logout,
        refreshUser,
        hasRole,
        hasAnyRole,
        isAuthenticated: !!user,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};
