import { cn } from '../../utils/cn';

const TextArea = ({
  label,
  error,
  helperText,
  required = false,
  className,
  containerClassName,
  maxLength,
  showCount = false,
  rows = 4,
  value,
  id,
  ...props
}) => {
  const textareaId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`;
  const currentLength = value?.length || 0;
  const showCharCount = showCount && maxLength;

  return (
    <div className={cn('w-full', containerClassName)}>
      {label && (
        <div className="flex justify-between items-center mb-1">
          <label htmlFor={textareaId} className="block text-sm font-medium text-gray-700">
            {label}
            {required && <span className="text-red-500 ml-1" aria-label="required">*</span>}
          </label>
          {showCharCount && (
            <span
              className={cn(
                'text-xs',
                currentLength > maxLength ? 'text-red-600' : 'text-gray-500'
              )}
              aria-live="polite"
              aria-atomic="true"
            >
              {currentLength}/{maxLength}
            </span>
          )}
        </div>
      )}

      <textarea
        id={textareaId}
        className={cn(
          'w-full px-3 py-2 border rounded-md shadow-sm transition-colors resize-y',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
          'disabled:bg-gray-100 disabled:cursor-not-allowed',
          error
            ? 'border-red-300 focus:ring-red-500'
            : 'border-gray-300',
          className
        )}
        rows={rows}
        maxLength={maxLength}
        value={value}
        aria-invalid={error ? 'true' : 'false'}
        aria-required={required}
        aria-describedby={error ? `${textareaId}-error` : helperText ? `${textareaId}-helper` : undefined}
        {...props}
      />

      {error && (
        <p
          id={`${textareaId}-error`}
          className="mt-1 text-sm text-red-600"
          role="alert"
          aria-live="polite"
        >
          {error}
        </p>
      )}

      {!error && helperText && (
        <p
          id={`${textareaId}-helper`}
          className="mt-1 text-sm text-gray-500"
        >
          {helperText}
        </p>
      )}
    </div>
  );
};

export default TextArea;
