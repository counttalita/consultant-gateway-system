import { useState, memo } from 'react';
import Card from '../shared/Card';
import { AlertTriangle, ChevronDown, ChevronUp, XCircle, AlertCircle, Info } from 'lucide-react';
import { cn } from '../../utils/cn';

const ErrorSummary = memo(({ errors, loading, onDrillDown }) => {
  const [expandedError, setExpandedError] = useState(null);

  if (loading) {
    return (
      <Card title="Error Summary">
        <div className="animate-pulse space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 rounded"></div>
          ))}
        </div>
      </Card>
    );
  }

  if (!errors || errors.total_errors === 0) {
    return (
      <Card title="Error Summary">
        <div className="text-center py-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 mb-3">
            <AlertCircle className="h-6 w-6 text-green-600" />
          </div>
          <p className="text-gray-600">No errors in the last 24 hours</p>
          <p className="text-sm text-gray-500 mt-1">System is running smoothly</p>
        </div>
      </Card>
    );
  }

  const getSeverityIcon = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical':
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'info':
        return <Info className="h-4 w-4 text-blue-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical':
      case 'error':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'info':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const toggleExpanded = (type) => {
    setExpandedError(expandedError === type ? null : type);
  };

  const errorsByType = errors.errors_by_type || [];
  const errorsBySeverity = errors.errors_by_severity || [];

  return (
    <Card 
      title="Error Summary" 
      subtitle={`${errors.total_errors} errors in the last 24 hours`}
    >
      <div className="space-y-4">
        {/* Total errors indicator */}
        <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="h-6 w-6 text-red-600" />
            <div>
              <p className="text-sm font-medium text-red-900">Total Errors</p>
              <p className="text-xs text-red-700">Last 24 hours</p>
            </div>
          </div>
          <span className="text-2xl font-bold text-red-600">{errors.total_errors}</span>
        </div>

        {/* Errors by severity */}
        {errorsBySeverity.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">By Severity</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {errorsBySeverity.map((error) => (
                <div
                  key={error.severity}
                  className={cn(
                    'p-3 rounded-lg border text-center',
                    getSeverityColor(error.severity)
                  )}
                >
                  <p className="text-xs font-medium capitalize">{error.severity}</p>
                  <p className="text-lg font-bold mt-1">{error.count}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Errors by type with drill-down */}
        {errorsByType.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">By Type</h4>
            <div className="space-y-2">
              {errorsByType.slice(0, 5).map((error) => {
                const isExpanded = expandedError === error.type;
                const hasDetails = error.recent_messages && error.recent_messages.length > 0;

                return (
                  <div
                    key={error.type}
                    className={cn(
                      'border rounded-lg transition-all',
                      hasDetails && 'cursor-pointer hover:shadow-md',
                      isExpanded && 'ring-2 ring-blue-500'
                    )}
                  >
                    <div
                      className="flex items-center justify-between p-3"
                      onClick={() => hasDetails && toggleExpanded(error.type)}
                    >
                      <div className="flex-1 flex items-center space-x-3">
                        {getSeverityIcon(error.severity)}
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 capitalize">
                            {error.type.replace(/_/g, ' ')}
                          </p>
                          <p className="text-xs text-gray-500">
                            {error.count} occurrences ({error.percentage}%)
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-bold text-gray-900">{error.count}</span>
                        {hasDetails && (
                          isExpanded ? 
                            <ChevronUp className="h-4 w-4 text-gray-400" /> : 
                            <ChevronDown className="h-4 w-4 text-gray-400" />
                        )}
                      </div>
                    </div>

                    {isExpanded && hasDetails && (
                      <div className="px-3 pb-3 border-t border-gray-200 pt-3">
                        <p className="text-xs font-medium text-gray-700 mb-2">Recent Messages:</p>
                        <div className="space-y-2">
                          {error.recent_messages.slice(0, 3).map((msg, idx) => (
                            <div key={idx} className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                              <p className="wrap-break-word">{msg.message || msg}</p>
                              {msg.timestamp && (
                                <p className="text-gray-400 mt-1">
                                  {new Date(msg.timestamp).toLocaleString()}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                        {onDrillDown && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDrillDown(error.type);
                            }}
                            className="mt-2 text-xs text-blue-600 hover:text-blue-800 font-medium"
                          >
                            View all {error.count} errors →
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {errorsByType.length === 0 && errorsBySeverity.length === 0 && (
          <p className="text-gray-500 text-center py-4">No error details available</p>
        )}
      </div>
    </Card>
  );
});

ErrorSummary.displayName = 'ErrorSummary';

export default ErrorSummary;
