import { cn } from '../../../utils/cn';

const CardLoader = ({ count = 1, variant = 'default', className }) => {
  const variants = {
    default: (
      <div className="animate-pulse p-6 bg-white rounded-lg border border-gray-200 space-y-4">
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 rounded"></div>
        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
      </div>
    ),
    
    metric: (
      <div className="animate-pulse p-6 bg-white rounded-lg border border-gray-200">
        <div className="flex items-center justify-between">
          <div className="space-y-3 flex-1">
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-8 bg-gray-200 rounded w-3/4"></div>
            <div className="h-3 bg-gray-200 rounded w-1/3"></div>
          </div>
          <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
        </div>
      </div>
    ),
    
    profile: (
      <div className="animate-pulse p-6 bg-white rounded-lg border border-gray-200">
        <div className="flex items-center space-x-4 mb-4">
          <div className="h-16 w-16 bg-gray-200 rounded-full"></div>
          <div className="flex-1 space-y-2">
            <div className="h-5 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          </div>
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-100 rounded"></div>
          <div className="h-4 bg-gray-100 rounded w-5/6"></div>
        </div>
      </div>
    ),
    
    project: (
      <div className="animate-pulse p-6 bg-white rounded-lg border border-gray-200 space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-2">
            <div className="h-5 bg-gray-200 rounded w-2/3"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
          <div className="h-6 w-20 bg-gray-200 rounded-full"></div>
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-100 rounded"></div>
          <div className="h-4 bg-gray-100 rounded w-4/5"></div>
        </div>
        <div className="flex space-x-2">
          <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
          <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
          <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
        </div>
      </div>
    ),
  };
  
  const cards = [...Array(count)].map((_, i) => (
    <div key={i} className={className}>
      {variants[variant]}
    </div>
  ));
  
  return count === 1 ? cards[0] : <div className="space-y-4">{cards}</div>;
};

export default CardLoader;
