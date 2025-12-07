import { FileText, AlertCircle } from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { cn } from '../../utils/cn';

const OutstandingInvoices = ({ data, loading = false }) => {
  if (loading) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const {
    total_outstanding = 0,
    aging_breakdown = {},
    invoices = [],
  } = data || {};

  const agingCategories = [
    { key: 'current', label: 'Current (0-30 days)', color: 'bg-green-100 text-green-800' },
    { key: '30_60', label: '30-60 days', color: 'bg-yellow-100 text-yellow-800' },
    { key: '60_90', label: '60-90 days', color: 'bg-orange-100 text-orange-800' },
    { key: 'over_90', label: 'Over 90 days', color: 'bg-red-100 text-red-800' },
  ];

  const getAgingStatus = (daysOutstanding) => {
    if (daysOutstanding <= 30) return { label: 'Current', color: 'text-green-600 bg-green-50' };
    if (daysOutstanding <= 60) return { label: '30-60 days', color: 'text-yellow-600 bg-yellow-50' };
    if (daysOutstanding <= 90) return { label: '60-90 days', color: 'text-orange-600 bg-orange-50' };
    return { label: 'Over 90 days', color: 'text-red-600 bg-red-50' };
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Outstanding Invoices</h3>
        <div className="p-2 bg-yellow-50 rounded-lg">
          <FileText className="h-5 w-5 text-yellow-600" />
        </div>
      </div>

      {/* Total Outstanding */}
      <div className="mb-6">
        <p className="text-sm text-gray-500 mb-1">Total Outstanding</p>
        <p className="text-3xl font-bold text-gray-900">
          {formatCurrency(total_outstanding)}
        </p>
      </div>

      {/* Aging Breakdown */}
      <div className="mb-6">
        <p className="text-sm font-medium text-gray-700 mb-3">Aging Breakdown</p>
        <div className="grid grid-cols-2 gap-3">
          {agingCategories.map((category) => (
            <div
              key={category.key}
              className={cn(
                'p-3 rounded-lg',
                category.color
              )}
            >
              <p className="text-xs font-medium mb-1">{category.label}</p>
              <p className="text-lg font-bold">
                {formatCurrency(aging_breakdown[category.key] || 0)}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Outstanding Invoices */}
      {invoices && invoices.length > 0 && (
        <div>
          <p className="text-sm font-medium text-gray-700 mb-3">Recent Invoices</p>
          <div className="space-y-2">
            {invoices.slice(0, 5).map((invoice, index) => {
              const status = getAgingStatus(invoice.days_outstanding || 0);
              return (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-medium text-gray-900">
                        {invoice.invoice_number || `INV-${index + 1}`}
                      </p>
                      <span
                        className={cn(
                          'px-2 py-0.5 text-xs font-medium rounded-full',
                          status.color
                        )}
                      >
                        {status.label}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {invoice.client_name || 'Client'} • Due: {formatDate(invoice.due_date)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">
                      {formatCurrency(invoice.amount)}
                    </p>
                    {invoice.days_outstanding > 60 && (
                      <div className="flex items-center justify-end mt-1">
                        <AlertCircle className="h-3 w-3 text-red-500 mr-1" />
                        <p className="text-xs text-red-600">
                          {invoice.days_outstanding} days
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default OutstandingInvoices;
