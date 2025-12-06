import { TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';
import { formatCurrency, formatPercentage } from '../../utils/formatters';
import { cn } from '../../utils/cn';

const ProjectProfitability = ({ data, loading = false }) => {
  if (loading) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const { projects = [], total_profit = 0, average_margin = 0 } = data || {};

  const getProfitabilityColor = (margin) => {
    if (margin >= 30) return 'text-green-600';
    if (margin >= 15) return 'text-blue-600';
    if (margin >= 5) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getProfitabilityIcon = (margin) => {
    if (margin >= 15) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (margin < 5) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return null;
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Project Profitability</h3>
          <p className="text-sm text-gray-500 mt-1">
            Average Margin: {formatPercentage(average_margin, 1)}
          </p>
        </div>
        <div className="p-2 bg-purple-50 rounded-lg">
          <BarChart3 className="h-5 w-5 text-purple-600" />
        </div>
      </div>

      {/* Total Profit */}
      <div className="mb-6 p-4 bg-purple-50 rounded-lg border border-purple-100">
        <p className="text-sm text-gray-600 mb-1">Total Profit</p>
        <p className="text-2xl font-bold text-gray-900">
          {formatCurrency(total_profit)}
        </p>
      </div>

      {/* Project List */}
      {projects && projects.length > 0 ? (
        <div className="space-y-3">
          {projects.map((project, index) => {
            const margin = project.profit_margin || 0;
            const profit = project.profit || 0;
            const revenue = project.revenue || 0;
            const cost = project.cost || 0;

            return (
              <div
                key={index}
                className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <p className="font-medium text-gray-900">
                        {project.project_name || `Project ${index + 1}`}
                      </p>
                      {getProfitabilityIcon(margin)}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {project.client_name || 'Client'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">
                      {formatCurrency(profit)}
                    </p>
                    <p
                      className={cn(
                        'text-xs font-medium mt-1',
                        getProfitabilityColor(margin)
                      )}
                    >
                      {formatPercentage(margin, 1)} margin
                    </p>
                  </div>
                </div>

                {/* Revenue vs Cost Bar */}
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                    <span>Revenue: {formatCurrency(revenue)}</span>
                    <span>Cost: {formatCurrency(cost)}</span>
                  </div>
                  <div className="relative w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="absolute top-0 left-0 bg-green-600 h-2 rounded-full"
                      style={{ width: '100%' }}
                    ></div>
                    <div
                      className="absolute top-0 left-0 bg-red-600 h-2 rounded-full"
                      style={{
                        width: `${revenue > 0 ? (cost / revenue) * 100 : 0}%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <BarChart3 className="h-12 w-12 mx-auto mb-2 text-gray-400" />
          <p className="text-sm">No project profitability data available</p>
        </div>
      )}
    </div>
  );
};

export default ProjectProfitability;
