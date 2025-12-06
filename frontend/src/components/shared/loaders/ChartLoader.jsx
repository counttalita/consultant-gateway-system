import { cn } from '../../../utils/cn';

// Pre-defined heights for consistent rendering
const BAR_HEIGHTS = [85, 65, 92, 78, 88, 70, 95];
const LINE_HEIGHTS = [60, 45, 75, 55, 70, 50, 80];

const ChartLoader = ({ className, type = 'bar' }) => {
  const barHeights = BAR_HEIGHTS;
  const lineHeights = LINE_HEIGHTS;
  
  if (type === 'line') {
    return (
      <div className={cn('animate-pulse p-6 bg-white rounded-lg border border-gray-200', className)}>
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-64 relative">
          {/* Y-axis labels */}
          <div className="absolute left-0 top-0 bottom-0 w-8 flex flex-col justify-between text-xs text-gray-400">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-3 bg-gray-200 rounded w-full"></div>
            ))}
          </div>
          {/* Chart area */}
          <div className="ml-10 h-full flex items-end justify-between space-x-2">
            {lineHeights.map((height, i) => (
              <div key={i} className="flex-1 h-full relative">
                <div
                  className="absolute bottom-0 w-full bg-gradient-to-t from-gray-200 to-gray-100 rounded-t"
                  style={{ height: `${height}%` }}
                ></div>
              </div>
            ))}
          </div>
        </div>
        {/* X-axis labels */}
        <div className="flex justify-between mt-2 ml-10">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="h-3 bg-gray-200 rounded w-12"></div>
          ))}
        </div>
      </div>
    );
  }
  
  // Bar chart (default)
  return (
    <div className={cn('animate-pulse p-6 bg-white rounded-lg border border-gray-200', className)}>
      <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
      <div className="h-64 flex items-end justify-between space-x-2">
        {barHeights.map((height, i) => (
          <div
            key={i}
            className="bg-gray-200 rounded-t w-full transition-all duration-300"
            style={{ height: `${height}%` }}
          ></div>
        ))}
      </div>
      <div className="flex justify-between mt-2">
        {[...Array(7)].map((_, i) => (
          <div key={i} className="h-3 bg-gray-200 rounded w-12"></div>
        ))}
      </div>
    </div>
  );
};

export default ChartLoader;
