import { useState, useEffect } from 'react';
import Input from './Input';
import ValidationMessage from './ValidationMessage';

/**
 * ValidatedInput Component
 * 
 * Input component with built-in validation support
 * Handles sync and async validation with debouncing
 * 
 * @param {Function} validate - Validation function (can be sync or async)
 * @param {number} debounceMs - Debounce delay for async validation
 * @param {boolean} validateOnChange - Whether to validate on every change
 * @param {boolean} validateOnBlur - Whether to validate on blur
 * @param {string} successMessage - Message to show when validation passes
 * @param {Function} onValidationChange - Callback when validation state changes
 * @param {...props} - All other props passed to Input component
 */
const ValidatedInput = ({
  validate,
  debounceMs = 500,
  validateOnChange = false,
  validateOnBlur = true,
  successMessage,
  onValidationChange,
  value,
  onChange,
  onBlur,
  error: externalError,
  ...props
}) => {
  const [internalError, setInternalError] = useState(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isValid, setIsValid] = useState(false);
  const [touched, setTouched] = useState(false);

  const error = externalError || internalError;

  // Debounced validation
  useEffect(() => {
    if (!validate || !value || !validateOnChange || !touched) return;

    const performValidationAsync = async () => {
      setIsValidating(true);
      
      try {
        const result = validate(value);
        
        // Handle async validation
        if (result instanceof Promise) {
          const error = await result;
          setInternalError(error);
          setIsValid(!error);
          
          if (onValidationChange) {
            onValidationChange(!error, error);
          }
        } else {
          // Handle sync validation
          setInternalError(result);
          setIsValid(!result);
          
          if (onValidationChange) {
            onValidationChange(!result, result);
          }
        }
      } catch (err) {
        console.error('Validation error:', err);
        setInternalError('Validation failed');
        setIsValid(false);
        
        if (onValidationChange) {
          onValidationChange(false, 'Validation failed');
        }
      } finally {
        setIsValidating(false);
      }
    };

    const timeoutId = setTimeout(() => {
      performValidationAsync();
    }, debounceMs);

    return () => clearTimeout(timeoutId);
  }, [value, validate, validateOnChange, debounceMs, touched, onValidationChange]);

  const performValidation = async (val) => {
    if (!validate) return;

    setIsValidating(true);
    
    try {
      const result = validate(val);
      
      // Handle async validation
      if (result instanceof Promise) {
        const error = await result;
        setInternalError(error);
        setIsValid(!error);
        
        if (onValidationChange) {
          onValidationChange(!error, error);
        }
      } else {
        // Handle sync validation
        setInternalError(result);
        setIsValid(!result);
        
        if (onValidationChange) {
          onValidationChange(!result, result);
        }
      }
    } catch (err) {
      console.error('Validation error:', err);
      setInternalError('Validation failed');
      setIsValid(false);
      
      if (onValidationChange) {
        onValidationChange(false, 'Validation failed');
      }
    } finally {
      setIsValidating(false);
    }
  };

  const handleChange = (e) => {
    if (onChange) {
      onChange(e);
    }
    
    // Clear error on change if validateOnChange is false
    if (!validateOnChange && internalError) {
      setInternalError(null);
      setIsValid(false);
    }
  };

  const handleBlur = async (e) => {
    setTouched(true);
    
    if (onBlur) {
      onBlur(e);
    }
    
    if (validateOnBlur && validate) {
      await performValidation(value);
    }
  };

  return (
    <div className="relative">
      <Input
        {...props}
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        error={error}
      />
      
      {/* Validation indicator */}
      {isValidating && (
        <div className="absolute right-3 top-9">
          <svg 
            className="animate-spin h-5 w-5 text-gray-400" 
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
      )}
      
      {/* Success message */}
      {!error && isValid && successMessage && touched && (
        <ValidationMessage type="success" message={successMessage} />
      )}
    </div>
  );
};

export default ValidatedInput;
