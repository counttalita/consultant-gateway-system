import { useState, memo } from 'react';
import Card from '../shared/Card';
import { CheckCircle, AlertCircle, XCircle, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '../../utils/cn';

const IntegrationHealth = memo(({ health, loading }) => {
  const [expandedIntegration, setExpandedIntegration] = useState(null);

  if (loading) {
    return (
      <Card title="Integration Health">
        <div className="animate-pulse space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </Card>
    );
  }

  if (!health || !health.integrations) {
    return (
      <Card title="Integration Health">
        <p className="text-gray-500 text-center py-8">No integration data available</p>
      </Card>
    );
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'warning':
      case 'degraded':
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      case 'error':
      case 'down':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'warning':
      case 'degraded':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'error':
      case 'down':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusBadge = (status) => {
    return (
      <span
        className={cn(
          'px-2 py-1 text-xs font-medium rounded-full capitalize border',
          getStatusColor(status)
        )}
      >
        {status}
      </span>
    );
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const toggleExpanded = (name) => {
    setExpandedIntegration(expandedIntegration === name ? null : name);
  };

  const integrations = Object.entries(health.integrations || {});

  return (
    <Card title="Integration Health" subtitle={`Overall Status: ${health.overall_status || 'Unknown'}`}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {integrations.map(([name, data]) => {
          const isExpanded = expandedIntegration === name;
          const hasDetails = data.error_message || data.error_count_24h > 0;

          return (
            <div
              key={name}
              className={cn(
                'border rounded-lg p-4 transition-all',
                hasDetails && 'cursor-pointer hover:shadow-md',
                isExpanded && 'ring-2 ring-blue-500'
              )}
              onClick={() => hasDetails && toggleExpanded(name)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(data.status)}
                  <span className="text-sm font-medium text-gray-900 capitalize">
                    {name.replace(/_/g, ' ')}
                  </span>
                </div>
                {hasDetails && (
                  isExpanded ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />
                )}
              </div>

              <div className="mb-3">
                {getStatusBadge(data.status)}
              </div>

              <div className="text-xs text-gray-500 space-y-1">
                {data.last_successful_sync && (
                  <p>
                    <span className="font-medium">Last sync:</span>{' '}
                    {formatTimestamp(data.last_successful_sync)}
                  </p>
                )}
                {data.last_successful_operation && (
                  <p>
                    <span className="font-medium">Last operation:</span>{' '}
                    {formatTimestamp(data.last_successful_operation)}
                  </p>
                )}
                {data.error_count_24h > 0 && (
                  <p className="text-red-600 font-medium">
                    {data.error_count_24h} errors (24h)
                  </p>
                )}
              </div>

              {isExpanded && data.error_message && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-xs font-medium text-gray-700 mb-1">Latest Error:</p>
                  <p className="text-xs text-red-600 wrap-break-word">{data.error_message}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {integrations.length === 0 && (
        <p className="text-gray-500 text-center py-8">No integrations configured</p>
      )}
    </Card>
  );
});

IntegrationHealth.displayName = 'IntegrationHealth';

export default IntegrationHealth;
