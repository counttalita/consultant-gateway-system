import { useState } from 'react';
import { useApiError } from '../../hooks/useApiError';
import { useNotification } from '../../hooks/useNotification';
import Button from './Button';
import Card from './Card';

/**
 * Example component demonstrating error handling patterns
 * This is for development/testing purposes only
 */
const ErrorHandlingExample = () => {
  const { handleApiError, isValidationError, handleValidationErrors } = useApiError();
  const { showSuccess, showError, showWarning, showInfo } = useNotification();
  const [loading, setLoading] = useState(false);

  // Simulate different types of errors
  const simulateError = async (errorType) => {
    setLoading(true);
    
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Create different error scenarios
      let error;
      switch (errorType) {
        case '400':
          error = {
            response: {
              status: 400,
              data: { error: 'Bad request - invalid data format' }
            }
          };
          break;
        case '403':
          error = {
            response: {
              status: 403,
              data: { error: 'Access denied' }
            }
          };
          break;
        case '404':
          error = {
            response: {
              status: 404,
              data: { error: 'Resource not found' }
            }
          };
          break;
        case '422':
          error = {
            response: {
              status: 422,
              data: {
                errors: {
                  email: ['Email is required', 'Email must be valid'],
                  password: ['Password is too short']
                }
              }
            }
          };
          break;
        case '500':
          error = {
            response: {
              status: 500,
              data: { error: 'Internal server error' }
            }
          };
          break;
        case 'network':
          error = {
            request: {},
            message: 'Network Error'
          };
          break;
        default:
          error = new Error('Unknown error');
      }
      
      throw error;
    } catch (error) {
      if (isValidationError(error)) {
        const validationErrors = handleValidationErrors(error);
        console.log('Validation errors:', validationErrors);
        showError('Please fix the validation errors');
      } else {
        handleApiError(error);
      }
    } finally {
      setLoading(false);
    }
  };

  // Test notifications directly
  const testNotification = (type) => {
    switch (type) {
      case 'success':
        showSuccess('Operation completed successfully!');
        break;
      case 'error':
        showError('Something went wrong!');
        break;
      case 'warning':
        showWarning('Please be careful with this action');
        break;
      case 'info':
        showInfo('Here is some useful information');
        break;
      default:
        break;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <Card title="Error Handling Examples">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">Test API Errors</h3>
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => simulateError('400')}
                disabled={loading}
                size="sm"
              >
                400 Bad Request
              </Button>
              <Button
                onClick={() => simulateError('403')}
                disabled={loading}
                size="sm"
              >
                403 Forbidden
              </Button>
              <Button
                onClick={() => simulateError('404')}
                disabled={loading}
                size="sm"
              >
                404 Not Found
              </Button>
              <Button
                onClick={() => simulateError('422')}
                disabled={loading}
                size="sm"
              >
                422 Validation Error
              </Button>
              <Button
                onClick={() => simulateError('500')}
                disabled={loading}
                size="sm"
              >
                500 Server Error
              </Button>
              <Button
                onClick={() => simulateError('network')}
                disabled={loading}
                size="sm"
              >
                Network Error
              </Button>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Test Notifications</h3>
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => testNotification('success')}
                variant="success"
                size="sm"
              >
                Success
              </Button>
              <Button
                onClick={() => testNotification('error')}
                variant="danger"
                size="sm"
              >
                Error
              </Button>
              <Button
                onClick={() => testNotification('warning')}
                variant="warning"
                size="sm"
              >
                Warning
              </Button>
              <Button
                onClick={() => testNotification('info')}
                size="sm"
              >
                Info
              </Button>
            </div>
          </div>

          <div className="mt-4 p-4 bg-gray-50 rounded">
            <h4 className="font-semibold mb-2">Usage Example:</h4>
            <pre className="text-xs bg-white p-2 rounded overflow-x-auto">
{`const { handleApiError } = useApiError();

try {
  await api.post('/endpoint', data);
} catch (error) {
  handleApiError(error, 'Custom error message');
}`}
            </pre>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ErrorHandlingExample;
