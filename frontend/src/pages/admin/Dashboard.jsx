import { useState, useEffect, useCallback } from 'react';
import { Users, Activity, Server, Database, RefreshCw } from 'lucide-react';
import adminService from '../../services/admin.service';
import MetricCard from '../../components/admin/MetricCard';
import IntegrationHealth from '../../components/admin/IntegrationHealth';
import ActivityTrends from '../../components/admin/ActivityTrends';
import ErrorSummary from '../../components/admin/ErrorSummary';
import DataQuality from '../../components/admin/DataQuality';
import SkeletonLoader from '../../components/shared/SkeletonLoader';
import Button from '../../components/shared/Button';
import { useNotification } from '../../hooks/useNotification';

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [activityTrends, setActivityTrends] = useState(null);
  const [errorData, setErrorData] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const { showError, showNotification } = useNotification();

  const fetchDashboardData = useCallback(async () => {
    try {
      const response = await adminService.getDashboard();
      setDashboardData(response);
      setLastRefresh(new Date());
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      showError('Failed to load dashboard data');
    }
  }, [showError]);

  const fetchActivityTrends = useCallback(async () => {
    try {
      const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const endDate = new Date().toISOString().split('T')[0];
      
      // Using the base API since there's no specific service method
      const response = await adminService.get('/admin/dashboard/activity_trends', {
        params: {
          start_date: startDate,
          end_date: endDate,
          granularity: 'day'
        }
      });
      setActivityTrends(response);
    } catch (err) {
      console.error('Error fetching activity trends:', err);
    }
  }, []);

  const fetchErrorData = useCallback(async () => {
    try {
      const response = await adminService.get('/admin/dashboard/errors', {
        params: { limit: 5 }
      });
      setErrorData(response);
    } catch (err) {
      console.error('Error fetching error data:', err);
    }
  }, []);

  const loadAllData = useCallback(async (showLoading = true) => {
    if (showLoading) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    try {
      await Promise.all([
        fetchDashboardData(),
        fetchActivityTrends(),
        fetchErrorData()
      ]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [fetchDashboardData, fetchActivityTrends, fetchErrorData]);

  const handleManualRefresh = () => {
    loadAllData(false);
  };

  // Initial load
  useEffect(() => {
    loadAllData(true);
  }, [loadAllData]);

  // Auto-refresh every 60 seconds
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      loadAllData(false);
    }, 60000); // 60 seconds

    return () => clearInterval(interval);
  }, [autoRefresh, loadAllData]);

  const handleErrorDrillDown = (errorType) => {
    showNotification({
      type: 'info',
      title: 'Coming Soon',
      message: `Detailed view for ${errorType} errors is under development.`
    });
  };

  const handleDataQualityDetails = (issueType) => {
    showNotification({
      type: 'info',
      title: 'Coming Soon',
      message: `Data quality details for ${issueType} are coming soon.`
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        </div>
        <SkeletonLoader type="dashboard" />
      </div>
    );
  }

  const { active_users, integration_health, data_quality } = dashboardData || {};

  return (
    <div className="space-y-6">
      {/* Header with refresh controls */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          {lastRefresh && (
            <p className="text-sm text-gray-500 mt-1">
              Last updated: {lastRefresh.toLocaleTimeString()}
            </p>
          )}
        </div>
        <div className="flex items-center space-x-3">
          <label className="flex items-center space-x-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span>Auto-refresh</span>
          </label>
          <Button
            variant="outline"
            size="sm"
            onClick={handleManualRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Active Users"
          value={active_users?.active_count || 0}
          subtitle={`${active_users?.total_users || 0} total users`}
          icon={Users}
          status="info"
        />
        <MetricCard
          title="Recent Logins"
          value={active_users?.recent_logins || 0}
          subtitle={`Last ${active_users?.period_hours || 24} hours`}
          icon={Activity}
          status="success"
        />
        <MetricCard
          title="System Status"
          value={integration_health?.overall_status || 'unknown'}
          subtitle="Integration health"
          icon={Server}
          status={
            integration_health?.overall_status === 'healthy' ? 'success' :
            integration_health?.overall_status === 'warning' ? 'warning' : 'error'
          }
        />
        <MetricCard
          title="Data Quality"
          value={`${data_quality?.overall_score?.toFixed(0) || 0}%`}
          subtitle={`${data_quality?.total_issues || 0} issues found`}
          icon={Database}
          status={
            (data_quality?.overall_score || 0) >= 90 ? 'success' :
            (data_quality?.overall_score || 0) >= 70 ? 'warning' : 'error'
          }
        />
      </div>

      {/* Integration Health */}
      <IntegrationHealth health={integration_health} loading={false} />

      {/* Activity Trends and Error Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ActivityTrends trends={activityTrends} loading={false} />
        <ErrorSummary 
          errors={errorData} 
          loading={false}
          onDrillDown={handleErrorDrillDown}
        />
      </div>

      {/* Data Quality */}
      <DataQuality 
        quality={data_quality} 
        loading={false}
        onViewDetails={handleDataQualityDetails}
      />
    </div>
  );
}
