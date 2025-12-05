import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { Users, Server, AlertTriangle, Activity, Database, TrendingUp } from 'lucide-react';

export default function AdminDashboard() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [dashboardData, setDashboardData] = useState(null);
    const [activityTrends, setActivityTrends] = useState(null);
    const [errorData, setErrorData] = useState(null);

    const fetchDashboardData = useCallback(async () => {
        try {
            const response = await api.get('/api/v1/admin/dashboard');
            setDashboardData(response.data);
            setLoading(false);
        } catch (err) {
            setError(err.message);
            setLoading(false);
        }
    }, []);

    const fetchActivityTrends = useCallback(async () => {
        try {
            const response = await api.get('/api/v1/admin/dashboard/activity_trends', {
                params: {
                    start_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    end_date: new Date().toISOString().split('T')[0],
                    granularity: 'day'
                }
            });
            setActivityTrends(response.data);
        } catch (err) {
            console.error('Error fetching activity trends:', err);
        }
    }, []);

    const fetchErrorData = useCallback(async () => {
        try {
            const response = await api.get('/api/v1/admin/dashboard/errors', {
                params: {
                    limit: 5
                }
            });
            setErrorData(response.data);
        } catch (err) {
            console.error('Error fetching error data:', err);
        }
    }, []);

    useEffect(() => {
        // Fetch initial dashboard data on mount
        const loadDashboard = async () => {
            await Promise.all([
                fetchDashboardData(),
                fetchActivityTrends(),
                fetchErrorData()
            ]);
        };
        
        loadDashboard();
    }, [fetchDashboardData, fetchActivityTrends, fetchErrorData]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-gray-500">Loading dashboard...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800">Error loading dashboard: {error}</p>
            </div>
        );
    }

    const { active_users, integration_health, data_quality } = dashboardData || {};

    const getStatusColor = (status) => {
        switch (status) {
            case 'healthy': return 'green';
            case 'warning': return 'yellow';
            case 'error': return 'red';
            default: return 'gray';
        }
    };

    const getStatusBadge = (status) => {
        const color = getStatusColor(status);
        const bgColor = `bg-${color}-100`;
        const textColor = `text-${color}-800`;
        return `px-2 py-1 text-xs font-medium ${bgColor} ${textColor} rounded-full capitalize`;
    };

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>

            {/* Active Users Section */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Active Users</p>
                            <p className="mt-2 text-3xl font-bold text-gray-900">{active_users?.active_count || 0}</p>
                        </div>
                        <div className="p-3 bg-blue-50 rounded-lg">
                            <Users className="h-6 w-6 text-blue-600" />
                        </div>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                        {active_users?.total_users || 0} total users
                    </p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Recent Logins</p>
                            <p className="mt-2 text-3xl font-bold text-gray-900">{active_users?.recent_logins || 0}</p>
                        </div>
                        <div className="p-3 bg-green-50 rounded-lg">
                            <Activity className="h-6 w-6 text-green-600" />
                        </div>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                        Last {active_users?.period_hours || 24} hours
                    </p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">System Status</p>
                            <p className={`mt-2 text-2xl font-bold capitalize text-${getStatusColor(integration_health?.overall_status)}-600`}>
                                {integration_health?.overall_status || 'unknown'}
                            </p>
                        </div>
                        <div className="p-3 bg-purple-50 rounded-lg">
                            <Server className="h-6 w-6 text-purple-600" />
                        </div>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">Integration health</p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Data Quality</p>
                            <p className="mt-2 text-3xl font-bold text-gray-900">
                                {data_quality?.overall_score?.toFixed(0) || 0}%
                            </p>
                        </div>
                        <div className="p-3 bg-indigo-50 rounded-lg">
                            <Database className="h-6 w-6 text-indigo-600" />
                        </div>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                        {data_quality?.total_issues || 0} issues found
                    </p>
                </div>
            </div>

            {/* Integration Health Section */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Integration Health</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {integration_health?.integrations && Object.entries(integration_health.integrations).map(([name, health]) => (
                        <div key={name} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-gray-900 capitalize">{name}</span>
                                <span className={getStatusBadge(health.status)}>{health.status}</span>
                            </div>
                            <div className="text-xs text-gray-500 space-y-1">
                                {health.last_successful_sync && (
                                    <p>Last sync: {new Date(health.last_successful_sync).toLocaleString()}</p>
                                )}
                                {health.last_successful_operation && (
                                    <p>Last operation: {new Date(health.last_successful_operation).toLocaleString()}</p>
                                )}
                                {health.error_message && (
                                    <p className="text-red-600">Error: {health.error_message}</p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Activity Trends and Errors */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Activity Trends */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Activity Trends (Last 7 Days)</h2>
                    {activityTrends && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                                <span className="text-sm font-medium text-gray-700">Total Logins</span>
                                <span className="text-lg font-bold text-blue-600">{activityTrends.summary?.total_logins || 0}</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                                <span className="text-sm font-medium text-gray-700">Profile Updates</span>
                                <span className="text-lg font-bold text-green-600">{activityTrends.summary?.total_profile_updates || 0}</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                                <span className="text-sm font-medium text-gray-700">Onboarding Completions</span>
                                <span className="text-lg font-bold text-purple-600">{activityTrends.summary?.total_onboarding_completions || 0}</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Recent Errors */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Errors</h2>
                    {errorData && (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-sm text-gray-600">Total Errors</span>
                                <span className="text-2xl font-bold text-red-600">{errorData.total_errors || 0}</span>
                            </div>
                            {errorData.errors_by_type?.slice(0, 5).map((error, index) => (
                                <div key={index} className="flex items-center justify-between py-2 border-b last:border-0">
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-900 capitalize">{error.type}</p>
                                        <p className="text-xs text-gray-500">{error.count} occurrences ({error.percentage}%)</p>
                                    </div>
                                    <AlertTriangle className="h-4 w-4 text-red-500" />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Data Quality Issues */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Data Quality Issues</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="border border-gray-200 rounded-lg p-4">
                        <h3 className="text-sm font-medium text-gray-700 mb-2">Incomplete Profiles</h3>
                        <p className="text-2xl font-bold text-gray-900">{data_quality?.incomplete_profiles?.count || 0}</p>
                        <p className="text-xs text-gray-500 mt-1">
                            {data_quality?.incomplete_profiles?.percentage?.toFixed(1) || 0}% of consultants
                        </p>
                    </div>
                    <div className="border border-gray-200 rounded-lg p-4">
                        <h3 className="text-sm font-medium text-gray-700 mb-2">Pending Onboarding</h3>
                        <p className="text-2xl font-bold text-gray-900">{data_quality?.pending_onboarding?.count || 0}</p>
                        <p className="text-xs text-gray-500 mt-1">Consultants in progress</p>
                    </div>
                    <div className="border border-gray-200 rounded-lg p-4">
                        <h3 className="text-sm font-medium text-gray-700 mb-2">Missing Integrations</h3>
                        <p className="text-2xl font-bold text-gray-900">{data_quality?.missing_integrations?.count || 0}</p>
                        <p className="text-xs text-gray-500 mt-1">Sync issues detected</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
