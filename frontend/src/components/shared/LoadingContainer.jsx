import { cn } from '../../utils/cn';
import LoadingSpinner from './LoadingSpinner';
import useLoadingTimeout from '../../hooks/useLoadingTimeout';

/**
 * Container component that handles loading states with smooth transitions
 * @param {boolean} loading - Loading state
 * @param {React.ReactNode} children - Content to show when loaded
 * @param {React.ReactNode} loader - Custom loader component
 * @param {string} loadingMessage - Message to show while loading
 * @param {number} timeout - Timeout for showing timeout message (ms)
 * @param {string} timeoutMessage - Message to show after timeout
 * @param {boolean} fadeIn - Enable fade-in animation for content
 * @param {string} className - Additional CSS classes
 */
const LoadingContainer = ({
  loading,
  children,
  loader,
  loadingMessage = 'Loading...',
  timeout = 5000,
  timeoutMessage = 'This is taking longer than expected. Please wait...',
  fadeIn = true,
  className,
}) => {
  const { showTimeout, elapsedTime } = useLoadingTimeout(loading, timeout, timeoutMessage);
  
  if (loading) {
    return (
      <div className={cn('flex flex-col items-center justify-center py-12', className)}>
        {loader || (
          <>
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-sm text-gray-600">{loadingMessage}</p>
            {showTimeout && (
              <div className="mt-4 text-center animate-fade-in">
                <p className="text-sm text-yellow-600 font-medium">{timeoutMessage}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Elapsed time: {elapsedTime}s
                </p>
              </div>
            )}
          </>
        )}
      </div>
    );
  }
  
  return (
    <div
      className={cn(
        fadeIn && 'animate-fade-in',
        className
      )}
    >
      {children}
    </div>
  );
};

export default LoadingContainer;
