import { cn } from '../../utils/cn';
import LoadingSpinner from './LoadingSpinner';
import SkeletonLoader from './SkeletonLoader';
import useLoadingTimeout from '../../hooks/useLoadingTimeout';

/**
 * Component for handling async content with loading, error, and empty states
 * @param {boolean} loading - Loading state
 * @param {Error} error - Error object if request failed
 * @param {any} data - Data to check for empty state
 * @param {React.ReactNode} children - Content to render when data is loaded
 * @param {string} loaderType - Type of skeleton loader (card, table, list, etc.)
 * @param {React.ReactNode} customLoader - Custom loader component
 * @param {React.ReactNode} emptyState - Custom empty state component
 * @param {string} emptyMessage - Message to show when data is empty
 * @param {Function} onRetry - Retry function for error state
 * @param {number} timeout - Timeout for showing timeout message
 * @param {string} className - Additional CSS classes
 */
const AsyncContent = ({
  loading,
  error,
  data,
  children,
  loaderType = 'card',
  customLoader,
  emptyState,
  emptyMessage = 'No data available',
  onRetry,
  timeout = 5000,
  className,
}) => {
  const { showTimeout, timeoutMessage, elapsedTime } = useLoadingTimeout(loading, timeout);
  
  // Loading state
  if (loading) {
    return (
      <div className={cn('transition-opacity duration-300', className)}>
        {customLoader || (
          <div className="space-y-4">
            <SkeletonLoader type={loaderType} />
            {showTimeout && (
              <div className="text-center animate-fade-in p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-700 font-medium">{timeoutMessage}</p>
                <p className="text-xs text-yellow-600 mt-1">
                  Elapsed time: {elapsedTime}s
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className={cn('text-center py-12', className)}>
        <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
          <svg
            className="w-8 h-8 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Something went wrong
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          {error.message || 'An error occurred while loading the data'}
        </p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Try Again
          </button>
        )}
      </div>
    );
  }
  
  // Empty state
  const isEmpty = Array.isArray(data) ? data.length === 0 : !data;
  if (isEmpty) {
    return (
      <div className={cn('text-center py-12', className)}>
        {emptyState || (
          <>
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
              <svg
                className="w-8 h-8 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                />
              </svg>
            </div>
            <p className="text-gray-600">{emptyMessage}</p>
          </>
        )}
      </div>
    );
  }
  
  // Success state with fade-in animation
  return (
    <div className={cn('animate-fade-in-up', className)}>
      {children}
    </div>
  );
};

export default AsyncContent;
