import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * ProtectedRoute component that guards routes requiring authentication
 * and optionally checks for specific roles
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components to render if authorized
 * @param {string[]} props.allowedRoles - Array of roles allowed to access this route
 * @param {string} props.redirectTo - Custom redirect path (defaults to /login)
 */
const ProtectedRoute = ({ children, allowedRoles, redirectTo = '/login' }) => {
    const { user, loading } = useAuth();
    const location = useLocation();

    // Show loading state while checking authentication
    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    // Redirect to login if not authenticated
    if (!user) {
        // Save the location they were trying to access
        return <Navigate to={redirectTo} state={{ from: location }} replace />;
    }

    // Check role-based access if allowedRoles is specified
    if (allowedRoles && allowedRoles.length > 0) {
        const userRoles = user.roles || [];
        const hasRequiredRole = allowedRoles.some(role => userRoles.includes(role));

        if (!hasRequiredRole) {
            // User doesn't have required role - redirect to their default dashboard
            const defaultRoute = getDefaultRouteForUser(user);
            return <Navigate to={defaultRoute} replace />;
        }
    }

    // User is authenticated and authorized
    return children;
};

/**
 * Helper function to determine default route based on user roles
 */
const getDefaultRouteForUser = (user) => {
    const userRoles = user.roles || [];
    
    // Priority: admin > finance > consultant
    if (userRoles.includes('admin')) return '/admin';
    if (userRoles.includes('finance')) return '/finance';
    if (userRoles.includes('consultant')) return '/consultant';
    
    // Fallback to login if no recognized role
    return '/login';
};

export default ProtectedRoute;
