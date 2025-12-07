import { memo, useMemo } from 'react';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { formatCurrency, formatPercentage } from '../../utils/formatters';
import { cn } from '../../utils/cn';

const RevenueMetrics = memo(({ data, loading = false }) => {
  if (loading) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-10 bg-gray-200 rounded w-1/2"></div>
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const {
    current_month_revenue = 0,
    previous_month_revenue = 0,
    revenue_by_project = [],
    revenue_trend = 0,
  } = data || {};

  const trendIcon = useMemo(() => {
    if (revenue_trend > 0) return <TrendingUp className="h-5 w-5 text-green-600" />;
    if (revenue_trend < 0) return <TrendingDown className="h-5 w-5 text-red-600" />;
    return null;
  }, [revenue_trend]);

  const trendColor = useMemo(() => {
    if (revenue_trend > 0) return 'text-green-600';
    if (revenue_trend < 0) return 'text-red-600';
    return 'text-gray-600';
  }, [revenue_trend]);

  const topProjects = useMemo(() => {
    return revenue_by_project.slice(0, 5);
  }, [revenue_by_project]);

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Revenue Metrics</h3>
        <div className="p-2 bg-green-50 rounded-lg">
          <DollarSign className="h-5 w-5 text-green-600" />
        </div>
      </div>

      {/* Current Month Revenue */}
      <div className="mb-6">
        <p className="text-sm text-gray-500 mb-1">Current Month Revenue</p>
        <div className="flex items-baseline space-x-2">
          <p className="text-3xl font-bold text-gray-900">
            {formatCurrency(current_month_revenue)}
          </p>
          {revenue_trend !== 0 && (
            <div className="flex items-center space-x-1">
              {trendIcon}
              <span className={cn('text-sm font-medium', trendColor)}>
                {formatPercentage(Math.abs(revenue_trend))}
              </span>
            </div>
          )}
        </div>
        <p className="text-sm text-gray-500 mt-1">
          Previous month: {formatCurrency(previous_month_revenue)}
        </p>
      </div>

      {/* Revenue by Project */}
      {revenue_by_project && revenue_by_project.length > 0 && (
        <div>
          <p className="text-sm font-medium text-gray-700 mb-3">Top Projects</p>
          <div className="space-y-3">
            {topProjects.map((project, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {project.project_name || `Project ${index + 1}`}
                  </p>
                  <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full transition-all"
                      style={{
                        width: `${Math.min(
                          (project.revenue / current_month_revenue) * 100,
                          100
                        )}%`,
                      }}
                    ></div>
                  </div>
                </div>
                <p className="ml-4 text-sm font-semibold text-gray-900">
                  {formatCurrency(project.revenue)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

RevenueMetrics.displayName = 'RevenueMetrics';

export default RevenueMetrics;
