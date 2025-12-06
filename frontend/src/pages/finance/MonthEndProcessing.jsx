import { useState } from 'react';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';
import Select from '../../components/shared/Select';
import Modal from '../../components/shared/Modal';
import useNotification from '../../hooks/useNotification';
import financeService from '../../services/finance.service';

const MonthEndProcessing = () => {
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();

  const [selectedMonth, setSelectedMonth] = useState(currentMonth.toString());
  const [selectedYear, setSelectedYear] = useState(currentYear.toString());
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const { showSuccess, showError } = useNotification();

  // Generate month options
  const monthOptions = [
    { value: '1', label: 'January' },
    { value: '2', label: 'February' },
    { value: '3', label: 'March' },
    { value: '4', label: 'April' },
    { value: '5', label: 'May' },
    { value: '6', label: 'June' },
    { value: '7', label: 'July' },
    { value: '8', label: 'August' },
    { value: '9', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' },
  ];

  // Generate year options (current year and 2 years back)
  const yearOptions = Array.from({ length: 3 }, (_, i) => {
    const year = currentYear - i;
    return { value: year.toString(), label: year.toString() };
  });

  const handleTriggerClick = () => {
    setShowConfirmModal(true);
  };

  const handleConfirmTrigger = async () => {
    setShowConfirmModal(false);
    setProcessing(true);
    setResult(null);

    try {
      const data = await financeService.triggerMonthEnd(
        parseInt(selectedMonth),
        parseInt(selectedYear)
      );
      setResult(data);
      showSuccess('Month-end processing completed successfully');
    } catch (error) {
      const errorData = error.response?.data;
      setResult(errorData || { error: 'Processing failed' });
      showError(errorData?.error || 'Month-end processing failed');
    } finally {
      setProcessing(false);
    }
  };

  const getMonthName = (month) => {
    return monthOptions.find((m) => m.value === month)?.label || month;
  };

  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return 'R 0.00';
    return `R ${parseFloat(amount).toLocaleString('en-ZA', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Month-End Processing</h1>
        <p className="mt-1 text-sm text-gray-500">
          Generate invoices and bills for the selected period
        </p>
      </div>

      {/* Period Selection Card */}
      <Card title="Select Period">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              options={monthOptions}
              disabled={processing}
            />
            <Select
              label="Year"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              options={yearOptions}
              disabled={processing}
            />
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              <p>
                <strong>Selected Period:</strong> {getMonthName(selectedMonth)}{' '}
                {selectedYear}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                This will create invoices for clients and bills for consultants
              </p>
            </div>
            <Button
              onClick={handleTriggerClick}
              disabled={processing}
              loading={processing}
              variant="primary"
            >
              {processing ? 'Processing...' : 'Trigger Month-End'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Processing Progress */}
      {processing && (
        <Card title="Processing">
          <div className="flex items-center space-x-4">
            <div className="shrink-0">
              <svg
                className="animate-spin h-8 w-8 text-blue-600"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                Processing month-end for {getMonthName(selectedMonth)} {selectedYear}
              </p>
              <p className="text-sm text-gray-500">
                Please wait while we generate invoices and bills...
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Results Summary */}
      {result && !processing && (
        <>
          {result.error ? (
            <Card title="Processing Failed" className="border-red-300">
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <svg
                    className="h-6 w-6 text-red-600 shrink-0"
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
                  <div>
                    <p className="text-sm font-medium text-red-800">
                      {result.error}
                    </p>
                    {result.details && (
                      <p className="mt-1 text-sm text-red-700">{result.details}</p>
                    )}
                  </div>
                </div>

                {result.failed_records && result.failed_records.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">
                      Failed Records:
                    </h4>
                    <div className="bg-red-50 rounded-md p-3 space-y-2">
                      {result.failed_records.map((record, index) => (
                        <div
                          key={index}
                          className="text-sm text-red-800 border-l-2 border-red-400 pl-3"
                        >
                          <p className="font-medium">{record.type || 'Record'}</p>
                          <p className="text-xs">{record.error || record.message}</p>
                          {record.details && (
                            <p className="text-xs text-red-600 mt-1">
                              {record.details}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          ) : (
            <Card title="Processing Complete" className="border-green-300">
              <div className="space-y-6">
                {/* Success Message */}
                <div className="flex items-start space-x-3">
                  <svg
                    className="h-6 w-6 text-green-600 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-green-800">
                      Month-end processing completed successfully
                    </p>
                    <p className="mt-1 text-sm text-green-700">
                      All invoices and bills have been created
                    </p>
                  </div>
                </div>

                {/* Summary Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-blue-900">
                          Invoices Created
                        </p>
                        <p className="mt-1 text-2xl font-bold text-blue-600">
                          {result.invoices_created || 0}
                        </p>
                      </div>
                      <svg
                        className="h-8 w-8 text-blue-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </div>
                    {result.total_invoice_amount !== undefined && (
                      <p className="mt-2 text-sm text-blue-700">
                        Total: {formatCurrency(result.total_invoice_amount)}
                      </p>
                    )}
                  </div>

                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-green-900">
                          Bills Created
                        </p>
                        <p className="mt-1 text-2xl font-bold text-green-600">
                          {result.bills_created || 0}
                        </p>
                      </div>
                      <svg
                        className="h-8 w-8 text-green-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                        />
                      </svg>
                    </div>
                    {result.total_bill_amount !== undefined && (
                      <p className="mt-2 text-sm text-green-700">
                        Total: {formatCurrency(result.total_bill_amount)}
                      </p>
                    )}
                  </div>
                </div>

                {/* Xero Links */}
                {(result.xero_invoice_url || result.xero_bill_url) && (
                  <div className="border-t border-gray-200 pt-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">
                      Review in Xero:
                    </h4>
                    <div className="flex flex-wrap gap-3">
                      {result.xero_invoice_url && (
                        <a
                          href={result.xero_invoice_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-4 py-2 border border-blue-300 rounded-md text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
                        >
                          <svg
                            className="h-4 w-4 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                            />
                          </svg>
                          View Invoices in Xero
                        </a>
                      )}
                      {result.xero_bill_url && (
                        <a
                          href={result.xero_bill_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-4 py-2 border border-green-300 rounded-md text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 transition-colors"
                        >
                          <svg
                            className="h-4 w-4 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                            />
                          </svg>
                          View Bills in Xero
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* Additional Details */}
                {result.details && (
                  <div className="bg-gray-50 rounded-md p-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">
                      Processing Details:
                    </h4>
                    <div className="text-sm text-gray-700 space-y-1">
                      {Array.isArray(result.details) ? (
                        result.details.map((detail, index) => (
                          <p key={index}>• {detail}</p>
                        ))
                      ) : (
                        <p>{result.details}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}
        </>
      )}

      {/* Confirmation Modal */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title="Confirm Month-End Processing"
        footer={
          <div className="flex justify-end space-x-3">
            <Button
              variant="secondary"
              onClick={() => setShowConfirmModal(false)}
            >
              Cancel
            </Button>
            <Button variant="primary" onClick={handleConfirmTrigger}>
              Confirm & Process
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-700">
            You are about to trigger month-end processing for:
          </p>
          <div className="bg-blue-50 rounded-md p-4">
            <p className="text-lg font-semibold text-blue-900">
              {getMonthName(selectedMonth)} {selectedYear}
            </p>
          </div>
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <div className="flex">
              <svg
                className="h-5 w-5 text-yellow-400 shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  This will create invoices for clients and bills for consultants
                  based on tracked hours and project assignments.
                </p>
              </div>
            </div>
          </div>
          <p className="text-sm text-gray-600">
            Are you sure you want to proceed?
          </p>
        </div>
      </Modal>
    </div>
  );
};

export default MonthEndProcessing;
