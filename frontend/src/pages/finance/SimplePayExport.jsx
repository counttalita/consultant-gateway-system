import { useState } from 'react';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';
import Input from '../../components/shared/Input';
import useNotification from '../../hooks/useNotification';
import financeService from '../../services/finance.service';

const SimplePayExport = () => {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = (currentDate.getMonth() + 1).toString().padStart(2, '0');
  const defaultPeriod = `${currentYear}-${currentMonth}`;

  const [period, setPeriod] = useState(defaultPeriod);
  const [exporting, setExporting] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);
  const [exportSuccess, setExportSuccess] = useState(false);
  const { showSuccess, showError } = useNotification();

  const validatePeriod = (value) => {
    // Validate YYYY-MM format
    const periodRegex = /^\d{4}-(0[1-9]|1[0-2])$/;
    if (!periodRegex.test(value)) {
      return 'Period must be in YYYY-MM format (e.g., 2025-01)';
    }

    // Validate year is reasonable (not too far in past or future)
    const [year] = value.split('-').map(Number);
    const minYear = 2020;
    const maxYear = currentYear + 1;
    
    if (year < minYear || year > maxYear) {
      return `Year must be between ${minYear} and ${maxYear}`;
    }

    return null;
  };

  const handlePeriodChange = (e) => {
    const value = e.target.value;
    setPeriod(value);
    setValidationErrors([]);
    setExportSuccess(false);
  };

  const handleExport = async () => {
    // Clear previous state
    setValidationErrors([]);
    setExportSuccess(false);

    // Validate period format
    const validationError = validatePeriod(period);
    if (validationError) {
      setValidationErrors([{ field: 'period', message: validationError }]);
      showError(validationError);
      return;
    }

    setExporting(true);

    try {
      const blob = await financeService.generateSimplePayExport(period);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `simplepay_${period}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setExportSuccess(true);
      showSuccess('SimplePay export generated successfully');
    } catch (error) {
      const errorData = error.response?.data;
      
      // Handle validation errors from backend
      if (errorData?.validation_errors && Array.isArray(errorData.validation_errors)) {
        setValidationErrors(errorData.validation_errors);
        showError('Export validation failed. Please review the errors below.');
      } else if (errorData?.error) {
        showError(errorData.error);
      } else {
        showError('Failed to generate SimplePay export');
      }
    } finally {
      setExporting(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !exporting) {
      handleExport();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">SimplePay Export</h1>
        <p className="mt-1 text-sm text-gray-500">
          Generate payroll export file for SimplePay
        </p>
      </div>

      {/* Export Form Card */}
      <Card title="Generate Export">
        <div className="space-y-4">
          <div className="max-w-md">
            <Input
              label="Period"
              type="text"
              value={period}
              onChange={handlePeriodChange}
              onKeyPress={handleKeyPress}
              placeholder="YYYY-MM (e.g., 2025-01)"
              disabled={exporting}
              error={validationErrors.find(e => e.field === 'period')?.message}
              helpText="Enter the period in YYYY-MM format"
            />
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              <p>
                <strong>Selected Period:</strong> {period}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                This will generate a CSV file for SimplePay import
              </p>
            </div>
            <Button
              onClick={handleExport}
              disabled={exporting || !period}
              loading={exporting}
              variant="primary"
            >
              {exporting ? 'Generating...' : 'Generate Export'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Export Progress */}
      {exporting && (
        <Card title="Generating Export">
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
                Generating SimplePay export for {period}
              </p>
              <p className="text-sm text-gray-500">
                Please wait while we prepare your export file...
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Success Confirmation */}
      {exportSuccess && !exporting && (
        <Card title="Export Complete" className="border-green-300">
          <div className="space-y-4">
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
                  SimplePay export generated successfully
                </p>
                <p className="mt-1 text-sm text-green-700">
                  The CSV file has been downloaded to your computer
                </p>
              </div>
            </div>

            <div className="bg-green-50 rounded-md p-4">
              <h4 className="text-sm font-medium text-green-900 mb-2">
                Next Steps:
              </h4>
              <ol className="text-sm text-green-800 space-y-1 list-decimal list-inside">
                <li>Locate the downloaded file: simplepay_{period}.csv</li>
                <li>Log in to your SimplePay account</li>
                <li>Navigate to the payroll import section</li>
                <li>Upload the CSV file</li>
                <li>Review and process the payroll</li>
              </ol>
            </div>

            <div className="bg-blue-50 rounded-md p-4">
              <div className="flex">
                <svg
                  className="h-5 w-5 text-blue-400 shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div className="ml-3">
                  <p className="text-sm text-blue-700">
                    Bills have been marked as queued for payment in the system
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Validation Errors */}
      {validationErrors.length > 0 && !exporting && (
        <Card title="Validation Errors" className="border-red-300">
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
                  Export validation failed
                </p>
                <p className="mt-1 text-sm text-red-700">
                  Please fix the following issues and try again
                </p>
              </div>
            </div>

            <div className="bg-red-50 rounded-md p-4">
              <h4 className="text-sm font-medium text-red-900 mb-3">
                Issues Found:
              </h4>
              <div className="space-y-2">
                {validationErrors.map((error, index) => (
                  <div
                    key={index}
                    className="text-sm text-red-800 border-l-2 border-red-400 pl-3"
                  >
                    {error.field && (
                      <p className="font-medium capitalize">
                        {error.field.replace(/_/g, ' ')}:
                      </p>
                    )}
                    <p className="text-xs">{error.message || error.error}</p>
                    {error.details && (
                      <p className="text-xs text-red-600 mt-1">{error.details}</p>
                    )}
                  </div>
                ))}
              </div>
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
                    Common issues include missing consultant banking details or
                    incomplete timesheet data for the selected period.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Information Card */}
      <Card title="About SimplePay Export">
        <div className="space-y-3 text-sm text-gray-700">
          <p>
            The SimplePay export generates a CSV file containing payroll data for
            all consultants with billable hours in the selected period.
          </p>
          <div className="bg-gray-50 rounded-md p-4">
            <h4 className="font-medium text-gray-900 mb-2">Export includes:</h4>
            <ul className="space-y-1 list-disc list-inside text-gray-700">
              <li>Consultant identification details</li>
              <li>Banking information</li>
              <li>Billable hours and amounts</li>
              <li>Tax and deduction information</li>
            </ul>
          </div>
          <div className="bg-blue-50 rounded-md p-4">
            <h4 className="font-medium text-blue-900 mb-2">Requirements:</h4>
            <ul className="space-y-1 list-disc list-inside text-blue-800">
              <li>All consultants must have complete banking details</li>
              <li>Timesheet data must be approved for the period</li>
              <li>Bills must be in "pending" status</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default SimplePayExport;
