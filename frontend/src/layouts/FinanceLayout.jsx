import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LayoutDashboard, FileText, DollarSign, Calendar, Download, Menu } from 'lucide-react';
import clsx from 'clsx';
import { Drawer, Breadcrumbs, UserMenu } from '../components/shared';
import SkipNavigation from '../components/shared/SkipNavigation';

const navItems = [
    { name: 'Dashboard', path: '/finance', icon: LayoutDashboard },
    { name: 'Month-End', path: '/finance/month-end', icon: Calendar },
    { name: 'SimplePay Export', path: '/finance/simplepay-export', icon: Download },
    { name: 'Invoices', path: '/finance/invoices', icon: FileText },
    { name: 'Payments', path: '/finance/payments', icon: DollarSign },
];

function NavContent({ onItemClick, isMobile = false, user, location }) {
    return (
        <>
            <div className={clsx(
                'p-6 border-b',
                isMobile ? 'border-gray-200' : 'border-emerald-800'
            )}>
                <h1 className={clsx(
                    'text-xl font-bold',
                    isMobile ? 'text-emerald-900' : 'text-white'
                )}>Finance Portal</h1>
                <p className={clsx(
                    'text-sm mt-1',
                    isMobile ? 'text-gray-500' : 'text-emerald-300'
                )}>{user?.email}</p>
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
                                'focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2',
                                isMobile ? (
                                    isActive
                                        ? 'bg-emerald-50 text-emerald-700'
                                        : 'text-gray-600 hover:bg-gray-50'
                                ) : (
                                    isActive
                                        ? 'bg-emerald-700 text-white'
                                        : 'text-emerald-100 hover:bg-emerald-800 hover:text-white'
                                )
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

export default function FinanceLayout() {
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
            <div className="md:hidden bg-emerald-900 text-white shadow-sm sticky top-0 z-40">
                <div className="flex items-center justify-between p-4">
                    <button
                        onClick={() => setMobileMenuOpen(true)}
                        className="p-2 rounded-lg hover:bg-emerald-800 transition-colors"
                        aria-label="Open menu"
                    >
                        <Menu className="h-6 w-6 text-white" />
                    </button>
                    <h1 className="text-lg font-bold text-white">Finance Portal</h1>
                    <div className="w-10" /> {/* Spacer for centering */}
                </div>
            </div>

            {/* Desktop Sidebar */}
            <div className="hidden md:flex w-64 bg-emerald-900 text-white flex-col">
                <NavContent onItemClick={() => {}} isMobile={false} user={user} location={location} />
                <div className="p-4 border-t border-emerald-800">
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
                <NavContent onItemClick={() => setMobileMenuOpen(false)} isMobile={true} user={user} location={location} />
                <div className="p-4 border-t">
                    <UserMenu user={user} onLogout={handleLogout} className="w-full" />
                </div>
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
