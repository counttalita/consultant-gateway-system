import { cn } from '../../utils/cn';

const SkeletonLoader = ({ type = 'card', count = 1, className, rows = 5 }) => {
  const skeletons = {
    card: (
      <div className={cn('animate-pulse space-y-4 p-4 bg-white rounded-lg border border-gray-200', className)}>
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 rounded"></div>
        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
      </div>
    ),
    
    table: (
      <div className={cn('animate-pulse space-y-2', className)}>
        {/* Table header */}
        <div className="h-12 bg-gray-200 rounded"></div>
        {/* Table rows */}
        {[...Array(rows)].map((_, i) => (
          <div key={i} className="h-16 bg-gray-100 rounded"></div>
        ))}
      </div>
    ),
    
    list: (
      <div className={cn('animate-pulse space-y-3', className)}>
        {[...Array(count)].map((_, i) => (
          <div key={i} className="flex space-x-4">
            <div className="h-12 w-12 bg-gray-200 rounded-full shrink-0"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    ),
    
    dashboard: (
      <div className={cn('animate-pulse space-y-6', className)}>
        {/* Metric cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
        
        {/* Chart area */}
        <div className="h-64 bg-gray-200 rounded-lg"></div>
        
        {/* Table area */}
        <div className="space-y-2">
          <div className="h-12 bg-gray-200 rounded"></div>
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 rounded"></div>
          ))}
        </div>
      </div>
    ),
    
    form: (
      <div className={cn('animate-pulse space-y-4', className)}>
        {[...Array(count)].map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    ),
    
    text: (
      <div className={cn('animate-pulse space-y-2', className)}>
        {[...Array(count)].map((_, i) => (
          <div key={i} className="h-4 bg-gray-200 rounded"></div>
        ))}
      </div>
    ),
    
    avatar: (
      <div className={cn('animate-pulse', className)}>
        <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
      </div>
    ),
    
    button: (
      <div className={cn('animate-pulse', className)}>
        <div className="h-10 w-24 bg-gray-200 rounded"></div>
      </div>
    ),
    
    // New specialized loaders
    chart: (
      <div className={cn('animate-pulse space-y-4 p-4', className)}>
        {/* Chart title */}
        <div className="h-6 bg-gray-200 rounded w-1/3"></div>
        {/* Chart area with bars */}
        <div className="h-64 flex items-end justify-between space-x-2">
          {[...Array(7)].map((_, i) => (
            <div
              key={i}
              className="bg-gray-200 rounded-t w-full"
              style={{ height: `${Math.random() * 60 + 40}%` }}
            ></div>
          ))}
        </div>
        {/* Legend */}
        <div className="flex space-x-4">
          <div className="h-3 bg-gray-200 rounded w-20"></div>
          <div className="h-3 bg-gray-200 rounded w-20"></div>
        </div>
      </div>
    ),
    
    metric: (
      <div className={cn('animate-pulse p-6 bg-white rounded-lg border border-gray-200', className)}>
        <div className="flex items-center justify-between">
          <div className="space-y-2 flex-1">
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-8 bg-gray-200 rounded w-3/4"></div>
          </div>
          <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
        </div>
      </div>
    ),
    
    profile: (
      <div className={cn('animate-pulse space-y-6', className)}>
        {/* Header with avatar */}
        <div className="flex items-center space-x-4">
          <div className="h-20 w-20 bg-gray-200 rounded-full"></div>
          <div className="flex-1 space-y-2">
            <div className="h-6 bg-gray-200 rounded w-1/3"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
        {/* Content sections */}
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-20 bg-gray-100 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    ),
    
    grid: (
      <div className={cn('animate-pulse grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4', className)}>
        {[...Array(count)].map((_, i) => (
          <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
        ))}
      </div>
    ),
  };
  
  return skeletons[type] || skeletons.card;
};

export default SkeletonLoader;
