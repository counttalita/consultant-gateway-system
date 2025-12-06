import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LayoutDashboard, User, FileText, Calendar, Menu } from 'lucide-react';
import clsx from 'clsx';
import { Drawer, Breadcrumbs, UserMenu } from '../components/shared';
import SkipNavigation from '../components/shared/SkipNavigation';

const navItems = [
    { name: 'Dashboard', path: '/consultant', icon: LayoutDashboard },
    { name: 'My Profile', path: '/consultant/profile', icon: User },
    { name: 'Availability', path: '/consultant/availability', icon: Calendar },
    { name: 'Onboarding', path: '/consultant/onboarding', icon: FileText },
];

function NavContent({ onItemClick, user, location }) {
    return (
        <>
            <div className="p-6 border-b">
                <h1 className="text-xl font-bold text-indigo-600">Consultant Gateway</h1>
                <p className="text-sm text-gray-500 mt-1">{user?.email}</p>
            </div>

            <nav className="flex-1 p-4 space-y-2" aria-label="Main navigation">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            onClick={onItemClick}
                            aria-current={isActive ? 'page' : undefined}
                            className={clsx(
                                'flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors',
                                'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2',
                                isActive
                                    ? 'bg-indigo-50 text-indigo-600'
                                    : 'text-gray-600 hover:bg-gray-50'
                            )}
                        >
                            <Icon className="h-5 w-5" aria-hidden="true" />
                            <span className="font-medium">{item.name}</span>
                        </Link>
                    );
                })}
            </nav>
        </>
    );
}

export default function ConsultantLayout() {
    const { logout, user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login', { replace: true });
        } catch (error) {
            console.error('Logout error:', error);
            navigate('/login', { replace: true });
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col md:flex-row">
            <SkipNavigation />
            {/* Mobile Header */}
            <div className="md:hidden bg-white shadow-sm border-b sticky top-0 z-40">
                <div className="flex items-center justify-between p-4">
                    <button
                        onClick={() => setMobileMenuOpen(true)}
                        className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                        aria-label="Open menu"
                    >
                        <Menu className="h-6 w-6 text-gray-600" />
                    </button>
                    <h1 className="text-lg font-bold text-indigo-600">Consultant Gateway</h1>
                    <UserMenu user={user} onLogout={handleLogout} />
                </div>
            </div>

            {/* Desktop Sidebar */}
            <div className="hidden md:flex w-64 bg-white shadow-lg flex-col">
                <NavContent onItemClick={() => {}} user={user} location={location} />
                <div className="p-4 border-t">
                    <UserMenu user={user} onLogout={handleLogout} className="w-full" />
                </div>
            </div>

            {/* Mobile Drawer */}
            <Drawer
                isOpen={mobileMenuOpen}
                onClose={() => setMobileMenuOpen(false)}
                position="left"
                size="sm"
            >
                <NavContent onItemClick={() => setMobileMenuOpen(false)} user={user} location={location} />
            </Drawer>

            {/* Main Content */}
            <div className="flex-1 overflow-auto">
                <div className="p-4 md:p-8">
                    <Breadcrumbs className="mb-6" />
                    <main id="main-content" tabIndex="-1" className="focus:outline-none">
                        <Outlet />
                    </main>
                </div>
            </div>
        </div>
    );
}
