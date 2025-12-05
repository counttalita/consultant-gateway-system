import React, { useState, useEffect } from 'react';
import { DollarSign, FileText, TrendingUp, Users, Loader2, Download } from 'lucide-react';
import financeService from '../../services/finance.service';

export default function FinanceDashboard() {
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const data = await financeService.getDashboard();
            setDashboardData(data);
        } catch (err) {
            // Fallback mock data for demo if API fails or isn't ready
            setDashboardData({
                total_revenue: 150000,
                outstanding_invoices: 45000,
                utilization_rate: 78,
                active_consultants: 12,
                monthly_revenue: [12000, 15000, 11000, 18000, 20000, 15000]
            });
            // setError('Failed to fetch finance data');
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async () => {
        try {
            await financeService.exportData();
            // Handle file download (blob)
        } catch (err) {
            console.error("Export failed");
        }
    };

    if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Finance Dashboard</h1>
                <button 
                    onClick={handleExport}
                    className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                    <Download className="w-4 h-4 mr-2" />
                    Export Report
                </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatsCard 
                    title="Total Revenue" 
                    value={`$${dashboardData?.total_revenue?.toLocaleString()}`} 
                    icon={DollarSign} 
                    color="bg-green-100 text-green-600"
                />
                <StatsCard 
                    title="Outstanding Invoices" 
                    value={`$${dashboardData?.outstanding_invoices?.toLocaleString()}`} 
                    icon={FileText} 
                    color="bg-yellow-100 text-yellow-600"
                />
                <StatsCard 
                    title="Avg. Utilization" 
                    value={`${dashboardData?.utilization_rate}%`} 
                    icon={TrendingUp} 
                    color="bg-blue-100 text-blue-600"
                />
                <StatsCard 
                    title="Active Consultants" 
                    value={dashboardData?.active_consultants} 
                    icon={Users} 
                    color="bg-purple-100 text-purple-600"
                />
            </div>

            {/* Charts Section (Placeholder for now) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Trend</h3>
                    <div className="h-64 flex items-end space-x-4">
                        {dashboardData?.monthly_revenue?.map((val, i) => (
                            <div key={i} className="flex-1 bg-indigo-500 rounded-t-md hover:bg-indigo-600 transition-all" 
                                 style={{ height: `${(val / 25000) * 100}%` }}></div>
                        ))}
                    </div>
                    <div className="flex justify-between mt-2 text-xs text-gray-500">
                        <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center">
                                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                                        <DollarSign className="w-4 h-4 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">Invoice Paid</p>
                                        <p className="text-xs text-gray-500">INV-2024-00{i}</p>
                                    </div>
                                </div>
                                <span className="text-sm font-semibold text-gray-900">+$4,500</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatsCard({ title, value, icon: Icon, color }) {
    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-500">{title}</h3>
                <div className={`p-2 rounded-lg ${color}`}>
                    <Icon className="w-5 h-5" />
                </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
    );
}
