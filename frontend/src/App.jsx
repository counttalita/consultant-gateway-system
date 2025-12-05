import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/auth/Login';
import ConsultantLayout from './layouts/ConsultantLayout';
import ConsultantDashboard from './pages/consultant/Dashboard';
import ConsultantProfile from './pages/consultant/Profile';
import Onboarding from './pages/consultant/Onboarding';

import AdminLayout from './layouts/AdminLayout';
import AdminDashboard from './pages/admin/Dashboard';
import Users from './pages/admin/Users';
import Health from './pages/admin/Health';
import TalentPool from './pages/admin/TalentPool';

import FinanceLayout from './layouts/FinanceLayout';
import FinanceDashboard from './pages/finance/Dashboard';

/**
 * Root redirect component that sends users to their role-appropriate dashboard
 */
const RootRedirect = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Redirect based on user roles
  const userRoles = user.roles || [];
  
  if (userRoles.includes('admin')) {
    return <Navigate to="/admin" replace />;
  }
  
  if (userRoles.includes('finance')) {
    return <Navigate to="/finance" replace />;
  }
  
  if (userRoles.includes('consultant')) {
    return <Navigate to="/consultant" replace />;
  }

  // Fallback to login if no recognized role
  return <Navigate to="/login" replace />;
};

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />

      {/* Admin routes */}
      <Route path="/admin" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminLayout />
        </ProtectedRoute>
      }>
        <Route index element={<AdminDashboard />} />
        <Route path="users" element={<Users />} />
        <Route path="talent-pool" element={<TalentPool />} />
        <Route path="health" element={<Health />} />
        <Route path="settings" element={<div className="p-6">Settings Placeholder</div>} />
      </Route>

      {/* Consultant routes */}
      <Route path="/consultant" element={
        <ProtectedRoute allowedRoles={['consultant']}>
          <ConsultantLayout />
        </ProtectedRoute>
      }>
        <Route index element={<ConsultantDashboard />} />
        <Route path="profile" element={<ConsultantProfile />} />
        <Route path="onboarding" element={<Onboarding />} />
      </Route>

      {/* Finance routes - accessible by both finance and admin roles */}
      <Route path="/finance" element={
        <ProtectedRoute allowedRoles={['finance', 'admin']}>
          <FinanceLayout />
        </ProtectedRoute>
      }>
        <Route index element={<FinanceDashboard />} />
        <Route path="invoices" element={<div className="p-6">Invoices Placeholder</div>} />
        <Route path="payments" element={<div className="p-6">Payments Placeholder</div>} />
      </Route>

      {/* Root redirect - sends users to their appropriate dashboard */}
      <Route path="/" element={<RootRedirect />} />
      
      {/* 404 - redirect to root which will handle authentication */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
