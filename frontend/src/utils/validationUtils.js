/**
 * Validation Utilities
 * 
 * Helper functions for working with validation in forms
 */

/**
 * Runs validation rules and returns the first error
 * Supports both sync and async validators
 * 
 * @param {Array|Function} rules - Validation rule(s) to run
 * @param {*} value - Value to validate
 * @param {Object} allValues - All form values (for cross-field validation)
 * @returns {Promise<string|null>} Error message or null
 */
export const runValidation = async (rules, value, allValues = {}) => {
  if (!rules) return null;

  // Handle single rule
  if (typeof rules === 'function') {
    const result = rules(value, allValues);
    return result instanceof Promise ? await result : result;
  }

  // Handle array of rules
  if (Array.isArray(rules)) {
    for (const rule of rules) {
      const result = rule(value, allValues);
      const error = result instanceof Promise ? await result : result;
      if (error) return error;
    }
  }

  return null;
};

/**
 * Validates all fields in a form
 * 
 * @param {Object} values - Form values
 * @param {Object} validationRules - Validation rules for each field
 * @returns {Promise<Object>} Object with field errors
 */
export const validateAllFields = async (values, validationRules) => {
  const errors = {};
  
  const validationPromises = Object.keys(validationRules).map(async (fieldName) => {
    const error = await runValidation(
      validationRules[fieldName],
      values[fieldName],
      values
    );
    if (error) {
      errors[fieldName] = error;
    }
  });

  await Promise.all(validationPromises);
  
  return errors;
};

/**
 * Checks if a form has any errors
 * 
 * @param {Object} errors - Error object
 * @returns {boolean} True if there are errors
 */
export const hasValidationErrors = (errors) => {
  if (!errors || typeof errors !== 'object') return false;
  return Object.values(errors).some(error => error !== null && error !== undefined && error !== '');
};

/**
 * Gets the count of errors in a form
 * 
 * @param {Object} errors - Error object
 * @returns {number} Number of errors
 */
export const getErrorCount = (errors) => {
  if (!errors || typeof errors !== 'object') return 0;
  return Object.values(errors).filter(error => error !== null && error !== undefined && error !== '').length;
};

/**
 * Formats field name for display (converts snake_case to Title Case)
 * 
 * @param {string} fieldName - Field name to format
 * @returns {string} Formatted field name
 */
export const formatFieldName = (fieldName) => {
  return fieldName
    .replace(/_/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase());
};

/**
 * Creates a validation rule that combines multiple rules with AND logic
 * All rules must pass for validation to succeed
 * 
 * @param {...Function} rules - Validation rules to combine
 * @returns {Function} Combined validation rule
 */
export const combineValidators = (...rules) => {
  return async (value, allValues) => {
    for (const rule of rules) {
      const result = rule(value, allValues);
      const error = result instanceof Promise ? await result : result;
      if (error) return error;
    }
    return null;
  };
};

/**
 * Creates a validation rule that combines multiple rules with OR logic
 * At least one rule must pass for validation to succeed
 * 
 * @param {...Function} rules - Validation rules to combine
 * @param {string} message - Error message if all rules fail
 * @returns {Function} Combined validation rule
 */
export const anyValidator = (rules, message = 'Validation failed') => {
  return async (value, allValues) => {
    for (const rule of rules) {
      const result = rule(value, allValues);
      const error = result instanceof Promise ? await result : result;
      if (!error) return null; // At least one passed
    }
    return message; // All failed
  };
};

/**
 * Creates a conditional validator that only runs if condition is met
 * 
 * @param {Function|boolean} condition - Condition to check
 * @param {Function} validator - Validator to run if condition is true
 * @returns {Function} Conditional validator
 */
export const conditionalValidator = (condition, validator) => {
  return async (value, allValues) => {
    const shouldValidate = typeof condition === 'function' 
      ? condition(allValues) 
      : condition;
    
    if (!shouldValidate) return null;
    
    const result = validator(value, allValues);
    return result instanceof Promise ? await result : result;
  };
};

/**
 * Debounces a validation function
 * 
 * @param {Function} validator - Validator to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced validator
 */
export const debounceValidator = (validator, delay = 500) => {
  let timeoutId;
  
  return async (value, allValues) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    return new Promise((resolve) => {
      timeoutId = setTimeout(async () => {
        const result = validator(value, allValues);
        const error = result instanceof Promise ? await result : result;
        resolve(error);
      }, delay);
    });
  };
};

/**
 * Throttles a validation function
 * 
 * @param {Function} validator - Validator to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function} Throttled validator
 */
export const throttleValidator = (validator, limit = 500) => {
  let inThrottle;
  let lastResult = null;
  
  return async (value, allValues) => {
    if (!inThrottle) {
      const result = validator(value, allValues);
      lastResult = result instanceof Promise ? await result : result;
      inThrottle = true;
      
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
    
    return lastResult;
  };
};

/**
 * Creates a validator that memoizes results
 * 
 * @param {Function} validator - Validator to memoize
 * @returns {Function} Memoized validator
 */
export const memoizeValidator = (validator) => {
  const cache = new Map();
  
  return async (value, allValues) => {
    const cacheKey = JSON.stringify({ value, allValues });
    
    if (cache.has(cacheKey)) {
      return cache.get(cacheKey);
    }
    
    const result = validator(value, allValues);
    const error = result instanceof Promise ? await result : result;
    
    cache.set(cacheKey, error);
    
    return error;
  };
};

/**
 * Transforms validation errors into a flat array of messages
 * 
 * @param {Object} errors - Error object
 * @returns {Array<string>} Array of error messages
 */
export const flattenErrors = (errors) => {
  if (!errors || typeof errors !== 'object') return [];
  
  return Object.entries(errors)
    .filter(([, error]) => error)
    .map(([field, error]) => `${formatFieldName(field)}: ${error}`);
};

/**
 * Groups errors by field prefix (useful for nested forms)
 * 
 * @param {Object} errors - Error object
 * @param {string} separator - Separator character (default: '.')
 * @returns {Object} Grouped errors
 */
export const groupErrors = (errors, separator = '.') => {
  if (!errors || typeof errors !== 'object') return {};
  
  const grouped = {};
  
  Object.entries(errors).forEach(([field, error]) => {
    if (!error) return;
    
    const parts = field.split(separator);
    const prefix = parts[0];
    
    if (!grouped[prefix]) {
      grouped[prefix] = {};
    }
    
    grouped[prefix][field] = error;
  });
  
  return grouped;
};

/**
 * Filters errors to only include touched fields
 * 
 * @param {Object} errors - Error object
 * @param {Object} touched - Touched fields object
 * @returns {Object} Filtered errors
 */
export const filterTouchedErrors = (errors, touched) => {
  if (!errors || typeof errors !== 'object') return {};
  if (!touched || typeof touched !== 'object') return {};
  
  const filtered = {};
  
  Object.keys(errors).forEach(field => {
    if (touched[field] && errors[field]) {
      filtered[field] = errors[field];
    }
  });
  
  return filtered;
};

/**
 * Merges multiple error objects
 * 
 * @param {...Object} errorObjects - Error objects to merge
 * @returns {Object} Merged errors
 */
export const mergeErrors = (...errorObjects) => {
  return errorObjects.reduce((acc, errors) => {
    if (!errors || typeof errors !== 'object') return acc;
    return { ...acc, ...errors };
  }, {});
};

/**
 * Clears errors for specific fields
 * 
 * @param {Object} errors - Error object
 * @param {Array<string>} fields - Fields to clear
 * @returns {Object} Errors with specified fields cleared
 */
export const clearFieldErrors = (errors, fields) => {
  if (!errors || typeof errors !== 'object') return {};
  
  const cleared = { ...errors };
  fields.forEach(field => {
    delete cleared[field];
  });
  
  return cleared;
};

/**
 * Sets errors for specific fields
 * 
 * @param {Object} errors - Existing error object
 * @param {Object} newErrors - New errors to set
 * @returns {Object} Updated errors
 */
export const setFieldErrors = (errors, newErrors) => {
  return { ...errors, ...newErrors };
};

/**
 * Validates a single field and returns a promise
 * 
 * @param {string} fieldName - Field name
 * @param {*} value - Field value
 * @param {Object} validationRules - Validation rules
 * @param {Object} allValues - All form values
 * @returns {Promise<string|null>} Error message or null
 */
export const validateField = async (fieldName, value, validationRules, allValues = {}) => {
  const rules = validationRules[fieldName];
  if (!rules) return null;
  
  return await runValidation(rules, value, allValues);
};

/**
 * Creates a validation schema from a simpler object format
 * 
 * @param {Object} schema - Simple schema object
 * @returns {Object} Validation rules object
 * 
 * @example
 * const schema = createValidationSchema({
 *   email: { required: true, email: true },
 *   password: { required: true, minLength: 8 }
 * });
 */
export const createValidationSchema = (schema) => {
  // This would need to be implemented based on your validation rule structure
  // For now, return the schema as-is
  return schema;
};

/**
 * Checks if a value is empty (null, undefined, empty string, empty array)
 * 
 * @param {*} value - Value to check
 * @returns {boolean} True if empty
 */
export const isEmpty = (value) => {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string' && value.trim() === '') return true;
  if (Array.isArray(value) && value.length === 0) return true;
  if (typeof value === 'object' && Object.keys(value).length === 0) return true;
  return false;
};

/**
 * Sanitizes a value for validation (trims strings, etc.)
 * 
 * @param {*} value - Value to sanitize
 * @returns {*} Sanitized value
 */
export const sanitizeValue = (value) => {
  if (typeof value === 'string') {
    return value.trim();
  }
  return value;
};

/**
 * Normalizes phone number for validation
 * 
 * @param {string} phone - Phone number
 * @returns {string} Normalized phone number
 */
export const normalizePhone = (phone) => {
  if (!phone) return '';
  return phone.replace(/[\s\-()]/g, '');
};

/**
 * Normalizes ID number for validation
 * 
 * @param {string} id - ID number
 * @returns {string} Normalized ID number
 */
export const normalizeId = (id) => {
  if (!id) return '';
  return id.replace(/[\s\-]/g, '');
};

export default {
  runValidation,
  validateAllFields,
  validateField,
  hasValidationErrors,
  getErrorCount,
  formatFieldName,
  combineValidators,
  anyValidator,
  conditionalValidator,
  debounceValidator,
  throttleValidator,
  memoizeValidator,
  flattenErrors,
  groupErrors,
  filterTouchedErrors,
  mergeErrors,
  clearFieldErrors,
  setFieldErrors,
  createValidationSchema,
  isEmpty,
  sanitizeValue,
  normalizePhone,
  normalizeId,
};
