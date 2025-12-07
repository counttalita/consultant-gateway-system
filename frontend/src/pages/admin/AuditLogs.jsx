import { useState, useEffect, useCallback } from 'react';
import Button from '../../components/shared/Button';
import Table from '../../components/shared/Table';
import Pagination from '../../components/shared/Pagination';
import Input from '../../components/shared/Input';
import Select from '../../components/shared/Select';
import { useNotification } from '../../hooks/useNotification';
import adminService from '../../services/admin.service';

const AuditLogs = () => {
  const { showSuccess, showError } = useNotification();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [pagination, setPagination] = useState({
    current_page: 1,
    total_pages: 1,
    total_count: 0,
    per_page: 20
  });
  const [filters, setFilters] = useState({
    user_id: '',
    action: '',
    start_date: '',
    end_date: '',
    search: ''
  });

  const actionTypes = [
    { value: '', label: 'All Actions' },
    { value: 'create', label: 'Create' },
    { value: 'update', label: 'Update' },
    { value: 'delete', label: 'Delete' },
    { value: 'login', label: 'Login' },
    { value: 'logout', label: 'Logout' },
    { value: 'view', label: 'View' },
    { value: 'export', label: 'Export' }
  ];

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        ...filters,
        page: pagination.current_page,
        per_page: pagination.per_page
      };

      // Remove empty filters
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === null || params[key] === undefined) {
          delete params[key];
        }
      });

      const data = await adminService.getAuditLogs(params);
      setLogs(data.audit_logs || data.logs || data);
      
      // Update pagination if provided
      if (data.pagination) {
        setPagination(data.pagination);
      }
    } catch (error) {
      showError(error.response?.data?.error || 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.current_page, pagination.per_page, showError]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPagination(prev => ({ ...prev, current_page: 1 }));
  };

  const handlePageChange = (page) => {
    setPagination(prev => ({ ...prev, current_page: page }));
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const params = { ...filters };
      
      // Remove empty filters
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === null || params[key] === undefined) {
          delete params[key];
        }
      });

      const blob = await adminService.exportAuditLogs(params);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `audit_logs_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      showSuccess('Audit logs exported successfully');
    } catch (error) {
      showError(error.response?.data?.error || 'Failed to export audit logs');
    } finally {
      setExporting(false);
    }
  };

  const handleClearFilters = () => {
    setFilters({
      user_id: '',
      action: '',
      start_date: '',
      end_date: '',
      search: ''
    });
    setPagination(prev => ({ ...prev, current_page: 1 }));
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getActionBadgeColor = (action) => {
    const colors = {
      create: 'bg-green-100 text-green-800',
      update: 'bg-blue-100 text-blue-800',
      delete: 'bg-red-100 text-red-800',
      login: 'bg-purple-100 text-purple-800',
      logout: 'bg-gray-100 text-gray-800',
      view: 'bg-yellow-100 text-yellow-800',
      export: 'bg-indigo-100 text-indigo-800'
    };
    return colors[action?.toLowerCase()] || 'bg-gray-100 text-gray-800';
  };

  const columns = [
    {
      key: 'created_at',
      label: 'Timestamp',
      render: (date) => (
        <span className="text-gray-900 font-medium">{formatDate(date)}</span>
      )
    },
    {
      key: 'user_email',
      label: 'User',
      render: (email, log) => (
        <div>
          <div className="text-gray-900">{email || log.user?.email || 'System'}</div>
          {log.user_id && (
            <div className="text-xs text-gray-500">ID: {log.user_id}</div>
          )}
        </div>
      )
    },
    {
      key: 'action',
      label: 'Action',
      render: (action) => (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getActionBadgeColor(action)}`}
        >
          {action}
        </span>
      )
    },
    {
      key: 'resource_type',
      label: 'Resource',
      render: (resourceType, log) => (
        <div>
          <div className="text-gray-900">{resourceType || 'N/A'}</div>
          {log.resource_id && (
            <div className="text-xs text-gray-500">ID: {log.resource_id}</div>
          )}
        </div>
      )
    },
    {
      key: 'details',
      label: 'Details',
      render: (details) => (
        <div className="max-w-xs truncate text-gray-600">
          {typeof details === 'object' ? JSON.stringify(details) : details || 'N/A'}
        </div>
      )
    },
    {
      key: 'ip_address',
      label: 'IP Address',
      render: (ip) => (
        <span className="text-gray-500 text-sm">{ip || 'N/A'}</span>
      )
    }
  ];

  const hasActiveFilters = Object.values(filters).some(value => value !== '');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
          <p className="mt-1 text-sm text-gray-500">
            Track system activity and user actions
          </p>
        </div>
        <Button
          onClick={handleExport}
          loading={exporting}
          disabled={exporting || loading}
        >
          {exporting ? 'Exporting...' : 'Export Logs'}
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Input
            label="Search"
            placeholder="Search logs..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
          />
          
          <Input
            label="User ID"
            placeholder="Filter by user ID"
            value={filters.user_id}
            onChange={(e) => handleFilterChange('user_id', e.target.value)}
          />
          
          <Select
            label="Action Type"
            value={filters.action}
            onChange={(e) => handleFilterChange('action', e.target.value)}
            options={actionTypes}
          />
          
          <div className="flex items-end">
            <Button
              variant="outline"
              onClick={handleClearFilters}
              disabled={!hasActiveFilters}
              className="w-full"
            >
              Clear Filters
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Start Date"
            type="date"
            value={filters.start_date}
            onChange={(e) => handleFilterChange('start_date', e.target.value)}
          />
          
          <Input
            label="End Date"
            type="date"
            value={filters.end_date}
            onChange={(e) => handleFilterChange('end_date', e.target.value)}
          />
        </div>
      </div>

      {/* Results count */}
      {!loading && (
        <div className="text-sm text-gray-700">
          Showing {logs.length} of {pagination.total_count || logs.length} logs
        </div>
      )}

      {/* Table */}
      <Table
        columns={columns}
        data={logs}
        loading={loading}
        emptyMessage="No audit logs found"
      />

      {/* Pagination */}
      {pagination.total_pages > 1 && (
        <Pagination
          currentPage={pagination.current_page}
          totalPages={pagination.total_pages}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
};

export default AuditLogs;
