import { cn } from '../../utils/cn';

const Checkbox = ({
  label,
  error,
  helperText,
  checked,
  onChange,
  disabled = false,
  className,
  containerClassName,
  id,
  ...props
}) => {
  // Generate a unique ID if not provided
  const checkboxId = id || `checkbox-${Math.random().toString(36).substr(2, 9)}`;
  
  return (
    <div className={cn('flex items-start', containerClassName)}>
      <div className="flex items-center h-5">
        <input
          id={checkboxId}
          type="checkbox"
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          className={cn(
            'w-4 h-4 text-blue-600 border-gray-300 rounded',
            'focus:ring-2 focus:ring-blue-500',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            error && 'border-red-300',
            className
          )}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${checkboxId}-error` : helperText ? `${checkboxId}-helper` : undefined}
          {...props}
        />
      </div>
      
      {label && (
        <div className="ml-3">
          <label htmlFor={checkboxId} className="text-sm font-medium text-gray-700">
            {label}
          </label>
          
          {error && (
            <p
              id={`${checkboxId}-error`}
              className="mt-1 text-sm text-red-600"
              role="alert"
              aria-live="polite"
            >
              {error}
            </p>
          )}
          
          {!error && helperText && (
            <p
              id={`${checkboxId}-helper`}
              className="mt-1 text-sm text-gray-500"
            >
              {helperText}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default Checkbox;
