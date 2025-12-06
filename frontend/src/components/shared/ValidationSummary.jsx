import { cn } from '../../utils/cn';
import { formatValidationError, hasErrors } from '../../utils/validationRules';

/**
 * ValidationSummary Component
 * 
 * Displays a summary of all validation errors in a form
 * Useful for showing all errors at the top of a form
 * 
 * @param {Object} errors - Object containing field errors
 * @param {string} title - Title for the error summary
 * @param {string} className - Additional CSS classes
 * @param {Function} onFieldClick - Callback when a field error is clicked (for scrolling to field)
 */
const ValidationSummary = ({ 
  errors, 
  title = 'Please fix the following errors:', 
  className,
  onFieldClick 
}) => {
  if (!hasErrors(errors)) return null;

  const errorEntries = Object.entries(errors)
    .filter(([, error]) => error)
    .map(([field, error]) => ({
      field,
      message: formatValidationError(error),
    }));

  if (errorEntries.length === 0) return null;

  const handleFieldClick = (field) => {
    if (onFieldClick) {
      onFieldClick(field);
    } else {
      // Default behavior: scroll to field
      const element = document.getElementById(field) || document.querySelector(`[name="${field}"]`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.focus();
      }
    }
  };

  return (
    <div 
      className={cn(
        'bg-red-50 border border-red-200 rounded-md p-4',
        className
      )}
      role="alert"
      aria-live="polite"
    >
      <div className="flex">
        <div className="shrink-0">
          <svg 
            className="h-5 w-5 text-red-400" 
            viewBox="0 0 20 20" 
            fill="currentColor"
            aria-hidden="true"
          >
            <path 
              fillRule="evenodd" 
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" 
              clipRule="evenodd" 
            />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-red-800">
            {title}
          </h3>
          <div className="mt-2 text-sm text-red-700">
            <ul className="list-disc list-inside space-y-1">
              {errorEntries.map(({ field, message }) => (
                <li key={field}>
                  <button
                    type="button"
                    onClick={() => handleFieldClick(field)}
                    className="hover:underline focus:outline-none focus:underline"
                  >
                    <span className="font-medium capitalize">
                      {field.replace(/_/g, ' ')}:
                    </span>{' '}
                    {message}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ValidationSummary;
