import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import { AccessibilityStatus } from './components/shared';
import LoadingSpinner from './components/shared/LoadingSpinner';

// Eager load critical components
import Login from './pages/auth/Login';

// Lazy load layouts
const ConsultantLayout = lazy(() => import('./layouts/ConsultantLayout'));
const AdminLayout = lazy(() => import('./layouts/AdminLayout'));
const FinanceLayout = lazy(() => import('./layouts/FinanceLayout'));

// Lazy load consultant pages
const ConsultantDashboard = lazy(() => import('./pages/consultant/Dashboard'));
const ConsultantProfile = lazy(() => import('./pages/consultant/Profile'));
const Onboarding = lazy(() => import('./pages/consultant/Onboarding'));
const Availability = lazy(() => import('./pages/consultant/Availability'));

// Lazy load admin pages
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const Users = lazy(() => import('./pages/admin/Users'));
const UserDetails = lazy(() => import('./pages/admin/UserDetails'));
const Health = lazy(() => import('./pages/admin/Health'));
const TalentPool = lazy(() => import('./pages/admin/TalentPool'));
const Projects = lazy(() => import('./pages/admin/Projects'));
const ProjectDetails = lazy(() => import('./pages/admin/ProjectDetails'));
const Tenders = lazy(() => import('./pages/admin/Tenders'));
const TenderDetails = lazy(() => import('./pages/admin/TenderDetails'));
const AuditLogs = lazy(() => import('./pages/admin/AuditLogs'));
const SystemConfig = lazy(() => import('./pages/admin/SystemConfig'));

// Lazy load finance pages
const FinanceDashboard = lazy(() => import('./pages/finance/Dashboard'));
const MonthEndProcessing = lazy(() => import('./pages/finance/MonthEndProcessing'));
const SimplePayExport = lazy(() => import('./pages/finance/SimplePayExport'));

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
    <>
      <AccessibilityStatus />
      <Suspense fallback={
        <div className="flex justify-center items-center h-screen">
          <LoadingSpinner size="lg" />
        </div>
      }>
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
            <Route path="users/:id" element={<UserDetails />} />
            <Route path="talent-pool" element={<TalentPool />} />
            <Route path="projects" element={<Projects />} />
            <Route path="projects/:id" element={<ProjectDetails />} />
            <Route path="tenders" element={<Tenders />} />
            <Route path="tenders/:id" element={<TenderDetails />} />
            <Route path="audit-logs" element={<AuditLogs />} />
            <Route path="health" element={<Health />} />
            <Route path="config" element={<SystemConfig />} />
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
            <Route path="availability" element={<Availability />} />
            <Route path="onboarding" element={<Onboarding />} />
          </Route>

          {/* Finance routes - accessible by both finance and admin roles */}
          <Route path="/finance" element={
            <ProtectedRoute allowedRoles={['finance', 'admin']}>
              <FinanceLayout />
            </ProtectedRoute>
          }>
            <Route index element={<FinanceDashboard />} />
            <Route path="month-end" element={<MonthEndProcessing />} />
            <Route path="simplepay-export" element={<SimplePayExport />} />
            <Route path="invoices" element={<div className="p-6">Invoices Placeholder</div>} />
            <Route path="payments" element={<div className="p-6">Payments Placeholder</div>} />
          </Route>

          {/* Root redirect - sends users to their appropriate dashboard */}
          <Route path="/" element={<RootRedirect />} />
          
          {/* 404 - redirect to root which will handle authentication */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </>
  );
}

export default App;
