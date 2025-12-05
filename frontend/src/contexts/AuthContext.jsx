import React, { createContext, useState, useContext, useEffect } from 'react';
import authService from '../services/auth.service';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            const userData = await authService.getCurrentUser();
            setUser(userData);
        } catch (error) {
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    const requestOtp = async (email) => {
        await authService.requestOtp(email);
    };

    const verifyOtp = async (email, otp) => {
        const response = await authService.validateOtp(email, otp);
        // Assuming response contains user or token. If session based, we might need to fetch user again.
        // Based on backend, validateOtp likely returns { success: true, user: ... }
        if (response.user) {
            setUser(response.user);
        } else {
            // If not returned, fetch it
            await checkAuth();
        }
        return response;
    };

    const logout = async () => {
        try {
            await authService.logout();
            setUser(null);
        } catch (error) {
            console.error('Logout failed', error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, requestOtp, verifyOtp, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
