import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
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

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) return <div className="flex justify-center items-center h-screen">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/" />;

  return children;
};

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

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

      <Route path="/consultant" element={
        <ProtectedRoute allowedRoles={['consultant']}>
          <ConsultantLayout />
        </ProtectedRoute>
      }>
        <Route index element={<ConsultantDashboard />} />
        <Route path="profile" element={<ConsultantProfile />} />
        <Route path="onboarding" element={<Onboarding />} />
      </Route>

      <Route path="/finance" element={
        <ProtectedRoute allowedRoles={['finance', 'admin']}>
          <FinanceLayout />
        </ProtectedRoute>
      }>
        <Route index element={<FinanceDashboard />} />
        <Route path="invoices" element={<div className="p-6">Invoices Placeholder</div>} />
        <Route path="payments" element={<div className="p-6">Payments Placeholder</div>} />
      </Route>

      <Route path="/" element={<Navigate to="/login" />} />
    </Routes>
  );
}

export default App;
