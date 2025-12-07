import { cn } from '../../utils/cn';

const Select = ({
  label,
  error,
  helperText,
  required = false,
  options = [],
  placeholder = 'Select an option',
  className,
  containerClassName,
  id,
  ...props
}) => {
  // Generate a unique ID if not provided
  const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`;
  
  return (
    <div className={cn('w-full', containerClassName)}>
      {label && (
        <label htmlFor={selectId} className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1" aria-label="required">*</span>}
        </label>
      )}
      
      <select
        id={selectId}
        className={cn(
          'w-full px-3 py-2 border rounded-md shadow-sm transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
          'disabled:bg-gray-100 disabled:cursor-not-allowed',
          error
            ? 'border-red-300 focus:ring-red-500'
            : 'border-gray-300',
          className
        )}
        aria-invalid={error ? 'true' : 'false'}
        aria-required={required}
        aria-describedby={error ? `${selectId}-error` : helperText ? `${selectId}-helper` : undefined}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option
            key={typeof option === 'object' ? option.value : option}
            value={typeof option === 'object' ? option.value : option}
            disabled={typeof option === 'object' ? option.disabled : false}
          >
            {typeof option === 'object' ? option.label : option}
          </option>
        ))}
      </select>
      
      {error && (
        <p
          id={`${selectId}-error`}
          className="mt-1 text-sm text-red-600"
          role="alert"
          aria-live="polite"
        >
          {error}
        </p>
      )}
      
      {!error && helperText && (
        <p
          id={`${selectId}-helper`}
          className="mt-1 text-sm text-gray-500"
        >
          {helperText}
        </p>
      )}
    </div>
  );
};

export default Select;
