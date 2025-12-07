import { cn } from '../../utils/cn';

const Table = ({
  columns = [],
  data = [],
  loading = false,
  emptyMessage = 'No data available',
  className,
  mobileCardView = true,
  ...props
}) => {
  if (loading) {
    return (
      <div className="w-full">
        <div className="animate-pulse space-y-2">
          <div className="h-12 bg-gray-200 rounded"></div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 rounded"></div>
          ))}
        </div>
      </div>
    );
  }
  
  if (data.length === 0) {
    return (
      <div className="w-full text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
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
        <p className="mt-2 text-sm text-gray-500">{emptyMessage}</p>
      </div>
    );
  }
  
  return (
    <>
      {/* Desktop Table View */}
      <div className={cn('hidden md:block w-full overflow-x-auto', !mobileCardView && 'block')}>
        <table
          className={cn('min-w-full divide-y divide-gray-200', className)}
          role="table"
          aria-label={props['aria-label'] || 'Data table'}
          {...props}
        >
          <thead className="bg-gray-50">
            <tr role="row">
              {columns.map((column, index) => (
                <th
                  key={column.key || index}
                  scope="col"
                  role="columnheader"
                  className={cn(
                    'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider',
                    column.headerClassName
                  )}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((row, rowIndex) => (
              <tr
                key={row.id || rowIndex}
                role="row"
                className="hover:bg-gray-50 transition-colors"
              >
                {columns.map((column, colIndex) => (
                  <td
                    key={column.key || colIndex}
                    role="cell"
                    className={cn(
                      'px-6 py-4 whitespace-nowrap text-sm text-gray-900',
                      column.cellClassName
                    )}
                  >
                    {column.render
                      ? column.render(row[column.key], row, rowIndex)
                      : row[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Mobile Card View */}
      {mobileCardView && (
        <div className="md:hidden space-y-4" role="list" aria-label="Data items">
          {data.map((row, rowIndex) => (
            <div
              key={row.id || rowIndex}
              role="listitem"
              className="bg-white rounded-lg shadow border border-gray-200 p-4 space-y-3"
            >
              {columns.map((column, colIndex) => {
                // Skip columns marked as hideOnMobile
                if (column.hideOnMobile) return null;
                
                const value = column.render
                  ? column.render(row[column.key], row, rowIndex)
                  : row[column.key];
                
                return (
                  <div key={column.key || colIndex} className="flex justify-between items-start">
                    <span className="text-sm font-medium text-gray-500 shrink-0 mr-4" id={`label-${rowIndex}-${colIndex}`}>
                      {column.label}
                    </span>
                    <span className="text-sm text-gray-900 text-right flex-1" aria-labelledby={`label-${rowIndex}-${colIndex}`}>
                      {value}
                    </span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </>
  );
};

export default Table;
