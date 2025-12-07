import { useState, useEffect, useCallback } from 'react';
import { Download, FileSpreadsheet, Loader2 } from 'lucide-react';
import financeService from '../../services/finance.service';
import { useNotification } from '../../hooks/useNotification';
import { downloadFile } from '../../utils/formatters';
import {
  RevenueMetrics,
  OutstandingInvoices,
  ConsultantUtilization,
  ProjectProfitability,
  PeriodSelector,
} from '../../components/finance';
import Button from '../../components/shared/Button';
import MetricCard from '../../components/admin/MetricCard';
import { DollarSign, FileText, TrendingUp, Users } from 'lucide-react';
import { formatCurrency, formatPercentage } from '../../utils/formatters';

export default function FinanceDashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('current_month');
  const [exporting, setExporting] = useState(false);
  const { showSuccess, showError } = useNotification();

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await financeService.getDashboard();
      setDashboardData(data);
    } catch (err) {
      showError('Failed to fetch finance data');
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    fetchDashboardData();
  }, [selectedPeriod, fetchDashboardData]);

  const handleExport = async (format) => {
    setExporting(true);
    try {
      const blob = await financeService.exportData(format, selectedPeriod);
      const filename = `financial_data_${selectedPeriod}.${format}`;
      downloadFile(blob, filename);
      showSuccess(`Data exported successfully as ${format.toUpperCase()}`);
    } catch (err) {
      showError('Failed to export data');
      console.error('Export error:', err);
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const {
    current_month_revenue = 0,
    outstanding_invoices_total = 0,
    average_utilization = 0,
    active_consultants = 0,
    revenue_trend = 0,
    revenue_metrics = {},
    outstanding_invoices = {},
    consultant_utilization = {},
    project_profitability = {},
  } = dashboardData || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Finance Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            Monitor revenue, invoices, and consultant utilization
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <PeriodSelector value={selectedPeriod} onChange={setSelectedPeriod} />
          <Button
            onClick={() => handleExport('csv')}
            disabled={exporting}
            variant="outline"
            size="sm"
          >
            <Download className="h-4 w-4 mr-2" />
            CSV
          </Button>
          <Button
            onClick={() => handleExport('excel')}
            disabled={exporting}
            variant="outline"
            size="sm"
          >
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Excel
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Current Month Revenue"
          value={formatCurrency(current_month_revenue)}
          icon={DollarSign}
          trend={revenue_trend}
          status="success"
        />
        <MetricCard
          title="Outstanding Invoices"
          value={formatCurrency(outstanding_invoices_total)}
          icon={FileText}
          status="warning"
        />
        <MetricCard
          title="Avg. Utilization"
          value={formatPercentage(average_utilization, 1)}
          icon={TrendingUp}
          status="info"
        />
        <MetricCard
          title="Active Consultants"
          value={active_consultants}
          icon={Users}
          status="default"
        />
      </div>

      {/* Revenue and Invoices Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueMetrics data={revenue_metrics} loading={loading} />
        <OutstandingInvoices data={outstanding_invoices} loading={loading} />
      </div>

      {/* Consultant Utilization */}
      <ConsultantUtilization data={consultant_utilization} loading={loading} />

      {/* Project Profitability */}
      <ProjectProfitability data={project_profitability} loading={loading} />
    </div>
  );
}
