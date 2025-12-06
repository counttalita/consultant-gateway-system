import { memo, useMemo, useCallback } from 'react';
import { Users } from 'lucide-react';
import { formatPercentage } from '../../utils/formatters';
import { cn } from '../../utils/cn';
import Table from '../shared/Table';

const ConsultantUtilization = memo(({ data, loading = false }) => {
  if (loading) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 bg-gray-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const { consultants = [], average_utilization = 0 } = data || {};

  const getUtilizationColor = useCallback((utilization) => {
    if (utilization >= 80) return 'text-green-600 bg-green-50';
    if (utilization >= 60) return 'text-blue-600 bg-blue-50';
    if (utilization >= 40) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  }, []);

  const getUtilizationBarColor = useCallback((utilization) => {
    if (utilization >= 80) return 'bg-green-600';
    if (utilization >= 60) return 'bg-blue-600';
    if (utilization >= 40) return 'bg-yellow-600';
    return 'bg-red-600';
  }, []);

  const columns = useMemo(() => [
    {
      key: 'name',
      label: 'Consultant',
      render: (value, row) => (
        <div>
          <p className="font-medium text-gray-900">{value || 'Unknown'}</p>
          <p className="text-xs text-gray-500">{row.email || ''}</p>
        </div>
      ),
    },
    {
      key: 'billable_hours',
      label: 'Billable Hours',
      render: (value) => (
        <span className="text-gray-900">{value || 0}h</span>
      ),
    },
    {
      key: 'total_hours',
      label: 'Total Hours',
      render: (value) => (
        <span className="text-gray-500">{value || 0}h</span>
      ),
    },
    {
      key: 'utilization',
      label: 'Utilization',
      render: (value) => {
        const utilization = value || 0;
        return (
          <div className="flex items-center space-x-3">
            <div className="flex-1">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={cn(
                    'h-2 rounded-full transition-all',
                    getUtilizationBarColor(utilization)
                  )}
                  style={{ width: `${Math.min(utilization, 100)}%` }}
                ></div>
              </div>
            </div>
            <span
              className={cn(
                'px-2 py-1 text-xs font-semibold rounded-full',
                getUtilizationColor(utilization)
              )}
            >
              {formatPercentage(utilization, 0)}
            </span>
          </div>
        );
      },
    },
    {
      key: 'projects',
      label: 'Active Projects',
      render: (value) => (
        <span className="text-gray-900">{value || 0}</span>
      ),
    },
  ], [getUtilizationColor, getUtilizationBarColor]);

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Consultant Utilization</h3>
          <p className="text-sm text-gray-500 mt-1">
            Average: {formatPercentage(average_utilization, 1)}
          </p>
        </div>
        <div className="p-2 bg-blue-50 rounded-lg">
          <Users className="h-5 w-5 text-blue-600" />
        </div>
      </div>

      <Table
        columns={columns}
        data={consultants}
        loading={loading}
        emptyMessage="No consultant data available"
      />
    </div>
  );
});

ConsultantUtilization.displayName = 'ConsultantUtilization';

export default ConsultantUtilization;
