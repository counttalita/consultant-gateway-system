import { useState } from 'react';
import Button from './Button';
import ProgressBar from './ProgressBar';
import SkeletonLoader from './SkeletonLoader';
import LoadingSpinner from './LoadingSpinner';
import LoadingContainer from './LoadingContainer';
import AsyncContent from './AsyncContent';
import ChartLoader from './loaders/ChartLoader';
import TableLoader from './loaders/TableLoader';
import CardLoader from './loaders/CardLoader';

/**
 * Demo component showcasing all loading states and specialized loaders
 * This is for development/documentation purposes
 */
const LoadingStatesDemo = () => {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [asyncState, setAsyncState] = useState({ loading: false, error: null, data: null });
  
  const simulateLoading = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 3000);
  };
  
  const simulateProgress = () => {
    setProgress(0);
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 500);
  };
  
  const simulateAsyncSuccess = () => {
    setAsyncState({ loading: true, error: null, data: null });
    setTimeout(() => {
      setAsyncState({ loading: false, error: null, data: { message: 'Data loaded successfully!' } });
    }, 2000);
  };
  
  const simulateAsyncError = () => {
    setAsyncState({ loading: true, error: null, data: null });
    setTimeout(() => {
      setAsyncState({ loading: false, error: new Error('Failed to load data'), data: null });
    }, 2000);
  };
  
  const simulateAsyncEmpty = () => {
    setAsyncState({ loading: true, error: null, data: null });
    setTimeout(() => {
      setAsyncState({ loading: false, error: null, data: [] });
    }, 2000);
  };
  
  return (
    <div className="p-8 space-y-12 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold mb-2">Loading States Demo</h1>
        <p className="text-gray-600">Comprehensive showcase of all loading components</p>
      </div>
      
      {/* Button Loading States */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Button Loading States</h2>
        <div className="flex flex-wrap gap-4">
          <Button loading={loading} onClick={simulateLoading}>
            Primary Button
          </Button>
          <Button variant="secondary" loading={loading} onClick={simulateLoading}>
            Secondary Button
          </Button>
          <Button variant="success" loading={loading} onClick={simulateLoading}>
            Success Button
          </Button>
          <Button variant="danger" loading={loading} onClick={simulateLoading}>
            Danger Button
          </Button>
        </div>
      </section>
      
      {/* Progress Bars */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Progress Bars</h2>
        <Button onClick={simulateProgress}>Start Progress</Button>
        <div className="space-y-4">
          <ProgressBar value={progress} showLabel label="Upload Progress" />
          <ProgressBar value={progress} variant="success" showLabel label="Processing" />
          <ProgressBar value={progress} variant="warning" size="lg" showLabel />
          <ProgressBar value={progress} variant="danger" striped animated />
        </div>
      </section>
      
      {/* Loading Spinners */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Loading Spinners</h2>
        <div className="flex items-center gap-8">
          <LoadingSpinner size="sm" />
          <LoadingSpinner size="md" />
          <LoadingSpinner size="lg" />
          <LoadingSpinner size="xl" />
          <LoadingSpinner size="md" color="green" showLabel label="Loading data..." />
        </div>
      </section>
      
      {/* Skeleton Loaders */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Skeleton Loaders</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium mb-2">Card Skeleton</h3>
            <SkeletonLoader type="card" />
          </div>
          <div>
            <h3 className="text-lg font-medium mb-2">Metric Skeleton</h3>
            <SkeletonLoader type="metric" />
          </div>
          <div>
            <h3 className="text-lg font-medium mb-2">List Skeleton</h3>
            <SkeletonLoader type="list" count={3} />
          </div>
          <div>
            <h3 className="text-lg font-medium mb-2">Form Skeleton</h3>
            <SkeletonLoader type="form" count={4} />
          </div>
        </div>
      </section>
      
      {/* Specialized Loaders */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Specialized Loaders</h2>
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-2">Chart Loader (Bar)</h3>
            <ChartLoader type="bar" />
          </div>
          <div>
            <h3 className="text-lg font-medium mb-2">Chart Loader (Line)</h3>
            <ChartLoader type="line" />
          </div>
          <div>
            <h3 className="text-lg font-medium mb-2">Table Loader</h3>
            <TableLoader rows={5} columns={4} />
          </div>
          <div>
            <h3 className="text-lg font-medium mb-2">Card Loaders</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <CardLoader variant="default" />
              <CardLoader variant="metric" />
              <CardLoader variant="profile" />
            </div>
          </div>
        </div>
      </section>
      
      {/* Loading Container */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Loading Container</h2>
        <Button onClick={simulateLoading}>Toggle Loading</Button>
        <LoadingContainer
          loading={loading}
          loadingMessage="Fetching data..."
          timeout={2000}
          timeoutMessage="Still loading, please be patient..."
        >
          <div className="p-6 bg-white rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold mb-2">Content Loaded!</h3>
            <p className="text-gray-600">
              This content appears with a smooth fade-in animation after loading completes.
            </p>
          </div>
        </LoadingContainer>
      </section>
      
      {/* Async Content */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Async Content Component</h2>
        <div className="flex gap-2">
          <Button onClick={simulateAsyncSuccess}>Load Success</Button>
          <Button variant="danger" onClick={simulateAsyncError}>Load Error</Button>
          <Button variant="secondary" onClick={simulateAsyncEmpty}>Load Empty</Button>
        </div>
        <AsyncContent
          loading={asyncState.loading}
          error={asyncState.error}
          data={asyncState.data}
          loaderType="card"
          emptyMessage="No data found"
          onRetry={simulateAsyncSuccess}
        >
          <div className="p-6 bg-green-50 border border-green-200 rounded-lg">
            <h3 className="text-lg font-semibold text-green-900 mb-2">Success!</h3>
            <p className="text-green-700">{asyncState.data?.message}</p>
          </div>
        </AsyncContent>
      </section>
      
      {/* Dashboard Skeleton */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Dashboard Skeleton</h2>
        <SkeletonLoader type="dashboard" />
      </section>
    </div>
  );
};

export default LoadingStatesDemo;
