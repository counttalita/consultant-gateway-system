import { cn } from '../../../utils/cn';

const TableLoader = ({ rows = 5, columns = 4, className }) => {
  return (
    <div className={cn('animate-pulse bg-white rounded-lg border border-gray-200 overflow-hidden', className)}>
      {/* Table header */}
      <div className="bg-gray-50 border-b border-gray-200 px-6 py-3">
        <div className="flex space-x-4">
          {[...Array(columns)].map((_, i) => (
            <div
              key={i}
              className="h-4 bg-gray-200 rounded"
              style={{ width: i === 0 ? '30%' : '20%' }}
            ></div>
          ))}
        </div>
      </div>
      
      {/* Table rows */}
      <div className="divide-y divide-gray-200">
        {[...Array(rows)].map((_, rowIndex) => (
          <div key={rowIndex} className="px-6 py-4">
            <div className="flex space-x-4">
              {[...Array(columns)].map((_, colIndex) => (
                <div
                  key={colIndex}
                  className="h-4 bg-gray-100 rounded"
                  style={{ width: colIndex === 0 ? '30%' : '20%' }}
                ></div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TableLoader;
