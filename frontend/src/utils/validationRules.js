/**
 * Validation Rules Library
 * 
 * Provides reusable validation functions for form fields.
 * Each rule returns null if valid, or an error message string if invalid.
 * 
 * Async validators return a Promise that resolves to null or error message.
 */

// ============================================================================
// Basic Validation Rules
// ============================================================================

/**
 * Validates that a field is not empty
 */
export const required = (message = 'This field is required') => (value) => {
  if (value === null || value === undefined || value === '') {
    return message;
  }
  if (typeof value === 'string' && value.trim() === '') {
    return message;
  }
  if (Array.isArray(value) && value.length === 0) {
    return message;
  }
  return null;
};

/**
 * Validates minimum length
 */
export const minLength = (min, message) => (value) => {
  if (!value) return null; // Skip if empty (use required for that)
  const length = typeof value === 'string' ? value.length : value.toString().length;
  if (length < min) {
    return message || `Must be at least ${min} characters`;
  }
  return null;
};

/**
 * Validates maximum length
 */
export const maxLength = (max, message) => (value) => {
  if (!value) return null;
  const length = typeof value === 'string' ? value.length : value.toString().length;
  if (length > max) {
    return message || `Must be no more than ${max} characters`;
  }
  return null;
};

/**
 * Validates minimum value for numbers
 */
export const minValue = (min, message) => (value) => {
  if (!value && value !== 0) return null;
  const num = typeof value === 'number' ? value : parseFloat(value);
  if (isNaN(num) || num < min) {
    return message || `Must be at least ${min}`;
  }
  return null;
};

/**
 * Validates maximum value for numbers
 */
export const maxValue = (max, message) => (value) => {
  if (!value && value !== 0) return null;
  const num = typeof value === 'number' ? value : parseFloat(value);
  if (isNaN(num) || num > max) {
    return message || `Must be no more than ${max}`;
  }
  return null;
};

/**
 * Validates that value matches a regex pattern
 */
export const pattern = (regex, message = 'Invalid format') => (value) => {
  if (!value) return null;
  if (!regex.test(value)) {
    return message;
  }
  return null;
};

// ============================================================================
// Email Validation
// ============================================================================

/**
 * Validates email format
 */
export const email = (message = 'Invalid email address') => (value) => {
  if (!value) return null;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(value)) {
    return message;
  }
  return null;
};

// ============================================================================
// South African Specific Validations
// ============================================================================

/**
 * Validates South African ID number (13 digits with checksum)
 * Implements Luhn algorithm for ID validation
 */
export const saIdNumber = (message = 'Invalid South African ID number') => (value) => {
  if (!value) return null;
  
  // Remove any spaces or dashes
  const cleanValue = value.replace(/[\s-]/g, '');
  
  // Check format (13 digits)
  const idRegex = /^\d{13}$/;
  if (!idRegex.test(cleanValue)) {
    return message;
  }
  
  // Validate checksum using Luhn algorithm
  const digits = cleanValue.split('').map(Number);
  let sum = 0;
  
  for (let i = 0; i < 12; i++) {
    if (i % 2 === 0) {
      // Odd positions (1st, 3rd, 5th, etc.) - multiply by 1
      sum += digits[i];
    } else {
      // Even positions (2nd, 4th, 6th, etc.) - multiply by 2
      const doubled = digits[i] * 2;
      sum += doubled > 9 ? doubled - 9 : doubled;
    }
  }
  
  const checkDigit = (10 - (sum % 10)) % 10;
  
  if (checkDigit !== digits[12]) {
    return 'Invalid ID number checksum';
  }
  
  return null;
};

/**
 * Validates South African phone number
 * Accepts formats: +27XXXXXXXXX, 0XXXXXXXXX, with optional spaces/dashes
 */
export const saPhoneNumber = (message = 'Invalid South African phone number') => (value) => {
  if (!value) return null;
  
  // Remove spaces, dashes, and parentheses
  const cleanValue = value.replace(/[\s\-()]/g, '');
  
  // Check format: +27 followed by 9 digits OR 0 followed by 9 digits
  const phoneRegex = /^(\+27|0)[0-9]{9}$/;
  if (!phoneRegex.test(cleanValue)) {
    return message;
  }
  
  // Validate that it starts with valid mobile/landline prefix
  const prefix = cleanValue.startsWith('+27') 
    ? cleanValue.substring(3, 5) 
    : cleanValue.substring(1, 3);
  
  // Valid SA prefixes: mobile (60-89), landline (10-59)
  const prefixNum = parseInt(prefix, 10);
  if (prefixNum < 10 || prefixNum > 89) {
    return 'Invalid phone number prefix';
  }
  
  return null;
};

/**
 * Validates South African bank account number (10-11 digits)
 */
export const saAccountNumber = (message = 'Invalid account number (must be 10-11 digits)') => (value) => {
  if (!value) return null;
  const accountRegex = /^\d{10,11}$/;
  if (!accountRegex.test(value)) {
    return message;
  }
  return null;
};

/**
 * Validates South African branch code (6 digits)
 */
export const saBranchCode = (message = 'Invalid branch code (must be 6 digits)') => (value) => {
  if (!value) return null;
  const branchRegex = /^\d{6}$/;
  if (!branchRegex.test(value)) {
    return message;
  }
  return null;
};

/**
 * Validates South African tax number (10 digits)
 */
export const saTaxNumber = (message = 'Invalid tax number (must be 10 digits)') => (value) => {
  if (!value) return null;
  const taxRegex = /^\d{10}$/;
  if (!taxRegex.test(value)) {
    return message;
  }
  return null;
};

/**
 * Validates South African VAT number (10 digits starting with 4)
 */
export const saVatNumber = (message = 'Invalid VAT number (must be 10 digits starting with 4)') => (value) => {
  if (!value) return null;
  const vatRegex = /^4\d{9}$/;
  if (!vatRegex.test(value)) {
    return message;
  }
  return null;
};

/**
 * Validates South African postal code (4 digits)
 */
export const saPostalCode = (message = 'Invalid postal code (must be 4 digits)') => (value) => {
  if (!value) return null;
  const postalRegex = /^\d{4}$/;
  if (!postalRegex.test(value)) {
    return message;
  }
  return null;
};

// ============================================================================
// Conditional Validation
// ============================================================================

/**
 * Validates field only if condition is met
 */
export const requiredIf = (condition, message = 'This field is required') => (value, allValues) => {
  const shouldValidate = typeof condition === 'function' ? condition(allValues) : condition;
  if (shouldValidate) {
    return required(message)(value);
  }
  return null;
};

/**
 * Validates that two fields match (e.g., password confirmation)
 */
export const matches = (fieldName, message) => (value, allValues) => {
  if (!value) return null;
  if (value !== allValues[fieldName]) {
    return message || `Must match ${fieldName}`;
  }
  return null;
};

// ============================================================================
// Cross-Field Validation
// ============================================================================

/**
 * Validates that a date field is before another date field
 */
export const dateBefore = (otherFieldName, message) => (value, allValues) => {
  if (!value || !allValues[otherFieldName]) return null;
  
  const date1 = new Date(value);
  const date2 = new Date(allValues[otherFieldName]);
  
  if (date1 >= date2) {
    return message || `Must be before ${otherFieldName}`;
  }
  return null;
};

/**
 * Validates that a date field is after another date field
 */
export const dateAfter = (otherFieldName, message) => (value, allValues) => {
  if (!value || !allValues[otherFieldName]) return null;
  
  const date1 = new Date(value);
  const date2 = new Date(allValues[otherFieldName]);
  
  if (date1 <= date2) {
    return message || `Must be after ${otherFieldName}`;
  }
  return null;
};

/**
 * Validates that a numeric field is less than another field
 */
export const lessThan = (otherFieldName, message) => (value, allValues) => {
  if (!value && value !== 0) return null;
  if (!allValues[otherFieldName] && allValues[otherFieldName] !== 0) return null;
  
  const num1 = parseFloat(value);
  const num2 = parseFloat(allValues[otherFieldName]);
  
  if (isNaN(num1) || isNaN(num2)) return null;
  
  if (num1 >= num2) {
    return message || `Must be less than ${otherFieldName}`;
  }
  return null;
};

/**
 * Validates that a numeric field is greater than another field
 */
export const greaterThan = (otherFieldName, message) => (value, allValues) => {
  if (!value && value !== 0) return null;
  if (!allValues[otherFieldName] && allValues[otherFieldName] !== 0) return null;
  
  const num1 = parseFloat(value);
  const num2 = parseFloat(allValues[otherFieldName]);
  
  if (isNaN(num1) || isNaN(num2)) return null;
  
  if (num1 <= num2) {
    return message || `Must be greater than ${otherFieldName}`;
  }
  return null;
};

/**
 * Validates that at least one of the specified fields has a value
 */
export const requireOneOf = (fieldNames, message) => (value, allValues) => {
  const hasValue = fieldNames.some(fieldName => {
    const fieldValue = allValues[fieldName];
    return fieldValue !== null && fieldValue !== undefined && fieldValue !== '';
  });
  
  if (!hasValue) {
    return message || `At least one of ${fieldNames.join(', ')} is required`;
  }
  return null;
};

/**
 * Validates that all specified fields have values if any one has a value
 */
export const requireAllOrNone = (fieldNames, message) => (value, allValues) => {
  const filledFields = fieldNames.filter(fieldName => {
    const fieldValue = allValues[fieldName];
    return fieldValue !== null && fieldValue !== undefined && fieldValue !== '';
  });
  
  // Either all filled or none filled
  if (filledFields.length > 0 && filledFields.length < fieldNames.length) {
    return message || `Either all or none of ${fieldNames.join(', ')} must be filled`;
  }
  return null;
};

/**
 * Validates that a field is required when another field has a specific value
 */
export const requiredWhen = (otherField, otherValue, message) => (value, allValues) => {
  const shouldBeRequired = allValues[otherField] === otherValue;
  if (shouldBeRequired) {
    return required(message || `This field is required when ${otherField} is ${otherValue}`)(value);
  }
  return null;
};

/**
 * Validates that a field is not equal to another field
 */
export const notEqual = (otherField, message) => (value, allValues) => {
  if (!value) return null;
  if (value === allValues[otherField]) {
    return message || `Must not be the same as ${otherField}`;
  }
  return null;
};

/**
 * Validates that the sum of multiple fields equals a target value
 */
export const sumEquals = (fieldNames, targetValue, message) => (value, allValues) => {
  const sum = fieldNames.reduce((acc, fieldName) => {
    const fieldValue = parseFloat(allValues[fieldName]) || 0;
    return acc + fieldValue;
  }, 0);
  
  if (sum !== targetValue) {
    return message || `Sum of ${fieldNames.join(', ')} must equal ${targetValue}`;
  }
  return null;
};

/**
 * Validates that a percentage field is between 0 and 100
 */
export const percentage = (message = 'Must be between 0 and 100') => (value) => {
  if (!value && value !== 0) return null;
  const num = parseFloat(value);
  if (isNaN(num) || num < 0 || num > 100) {
    return message;
  }
  return null;
};

/**
 * Validates that a field contains only alphanumeric characters
 */
export const alphanumeric = (message = 'Must contain only letters and numbers') => (value) => {
  if (!value) return null;
  if (!/^[a-zA-Z0-9]+$/.test(value)) {
    return message;
  }
  return null;
};

/**
 * Validates that a field contains only alphabetic characters
 */
export const alpha = (message = 'Must contain only letters') => (value) => {
  if (!value) return null;
  if (!/^[a-zA-Z]+$/.test(value)) {
    return message;
  }
  return null;
};

/**
 * Validates that a field contains only numeric characters
 */
export const numeric = (message = 'Must contain only numbers') => (value) => {
  if (!value) return null;
  if (!/^\d+$/.test(value)) {
    return message;
  }
  return null;
};

/**
 * Validates that a field is a valid integer
 */
export const integer = (message = 'Must be a whole number') => (value) => {
  if (!value && value !== 0) return null;
  const num = parseFloat(value);
  if (isNaN(num) || !Number.isInteger(num)) {
    return message;
  }
  return null;
};

/**
 * Validates that a field is a valid decimal number
 */
export const decimal = (decimalPlaces, message) => (value) => {
  if (!value && value !== 0) return null;
  const num = parseFloat(value);
  if (isNaN(num)) {
    return message || 'Must be a valid number';
  }
  
  if (decimalPlaces !== undefined) {
    const parts = value.toString().split('.');
    if (parts[1] && parts[1].length > decimalPlaces) {
      return message || `Must have at most ${decimalPlaces} decimal places`;
    }
  }
  return null;
};

/**
 * Validates that a date is in the future
 */
export const futureDate = (message = 'Must be a future date') => (value) => {
  if (!value) return null;
  const date = new Date(value);
  const now = new Date();
  if (date <= now) {
    return message;
  }
  return null;
};

/**
 * Validates that a date is in the past
 */
export const pastDate = (message = 'Must be a past date') => (value) => {
  if (!value) return null;
  const date = new Date(value);
  const now = new Date();
  if (date >= now) {
    return message;
  }
  return null;
};

/**
 * Validates that a date is within a range
 */
export const dateRange = (minDate, maxDate, message) => (value) => {
  if (!value) return null;
  const date = new Date(value);
  const min = minDate ? new Date(minDate) : null;
  const max = maxDate ? new Date(maxDate) : null;
  
  if (min && date < min) {
    return message || `Must be after ${min.toLocaleDateString()}`;
  }
  if (max && date > max) {
    return message || `Must be before ${max.toLocaleDateString()}`;
  }
  return null;
};

// ============================================================================
// Async Validation
// ============================================================================

/**
 * Creates an async validator that checks email uniqueness via API
 */
export const uniqueEmail = (apiCall, message = 'Email already exists') => async (value) => {
  if (!value) return null;
  
  try {
    const result = await apiCall(value);
    return result.exists ? message : null;
  } catch (error) {
    // If API call fails, don't block the form
    console.error('Email uniqueness check failed:', error);
    return null;
  }
};

/**
 * Creates an async validator for any API-based validation
 */
export const asyncValidate = (apiCall, errorMessage = 'Validation failed') => async (value) => {
  if (!value) return null;
  
  try {
    const result = await apiCall(value);
    return result.valid ? null : (result.message || errorMessage);
  } catch (error) {
    console.error('Async validation failed:', error);
    return null;
  }
};

/**
 * Debounced async validation to avoid excessive API calls
 */
export const debouncedAsyncValidate = (apiCall, delay = 500, errorMessage = 'Validation failed') => {
  let timeoutId;
  let abortController;
  
  return async (value) => {
    if (!value) return null;
    
    // Clear previous timeout and abort previous request
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    if (abortController) {
      abortController.abort();
    }
    
    // Create new abort controller for this request
    abortController = new AbortController();
    
    // Return a promise that resolves after delay
    return new Promise((resolve) => {
      timeoutId = setTimeout(async () => {
        try {
          const result = await apiCall(value, { signal: abortController.signal });
          resolve(result.valid ? null : (result.message || errorMessage));
        } catch (error) {
          // Don't treat aborted requests as errors
          if (error.name === 'AbortError') {
            resolve(null);
          } else {
            console.error('Debounced async validation failed:', error);
            resolve(null);
          }
        }
      }, delay);
    });
  };
};

/**
 * Creates a cached async validator to avoid redundant API calls
 */
export const cachedAsyncValidate = (apiCall, cacheTime = 60000, errorMessage = 'Validation failed') => {
  const cache = new Map();
  
  return async (value) => {
    if (!value) return null;
    
    // Check cache
    const cached = cache.get(value);
    if (cached && Date.now() - cached.timestamp < cacheTime) {
      return cached.result;
    }
    
    try {
      const result = await apiCall(value);
      const validationResult = result.valid ? null : (result.message || errorMessage);
      
      // Store in cache
      cache.set(value, {
        result: validationResult,
        timestamp: Date.now()
      });
      
      return validationResult;
    } catch (error) {
      console.error('Cached async validation failed:', error);
      return null;
    }
  };
};

// ============================================================================
// Composite Validation
// ============================================================================

/**
 * Combines multiple validation rules
 * Returns the first error encountered, or null if all pass
 */
export const compose = (...rules) => (value, allValues) => {
  for (const rule of rules) {
    const error = rule(value, allValues);
    if (error) return error;
  }
  return null;
};

// ============================================================================
// Validation Error Formatting
// ============================================================================

/**
 * Formats validation errors for display
 */
export const formatValidationError = (error) => {
  if (!error) return null;
  if (typeof error === 'string') return error;
  if (error.message) return error.message;
  return 'Validation error';
};

/**
 * Formats multiple validation errors into a single message
 */
export const formatValidationErrors = (errors) => {
  if (!errors || typeof errors !== 'object') return null;
  
  const errorMessages = Object.entries(errors)
    .filter(([_, error]) => error)
    .map(([field, error]) => `${field}: ${formatValidationError(error)}`);
  
  return errorMessages.length > 0 ? errorMessages.join(', ') : null;
};

/**
 * Checks if an error object has any errors
 */
export const hasErrors = (errors) => {
  if (!errors || typeof errors !== 'object') return false;
  return Object.values(errors).some(error => error !== null && error !== undefined);
};

/**
 * Gets the first error from an error object
 */
export const getFirstError = (errors) => {
  if (!errors || typeof errors !== 'object') return null;
  const firstError = Object.values(errors).find(error => error !== null && error !== undefined);
  return formatValidationError(firstError);
};

// ============================================================================
// Common Field Validators
// ============================================================================

/**
 * Common validators for specific field types
 */
export const validators = {
  // Email field
  email: compose(
    required('Email is required'),
    email('Invalid email address')
  ),

  // Password field
  password: compose(
    required('Password is required'),
    minLength(8, 'Password must be at least 8 characters')
  ),

  // South African ID
  saId: compose(
    required('ID number is required'),
    saIdNumber()
  ),

  // South African phone
  saPhone: compose(
    required('Phone number is required'),
    saPhoneNumber()
  ),

  // Bank account
  bankAccount: compose(
    required('Account number is required'),
    saAccountNumber()
  ),

  // Branch code
  branchCode: compose(
    required('Branch code is required'),
    saBranchCode()
  ),
  
  // Tax number
  taxNumber: saTaxNumber(),
  
  // VAT number
  vatNumber: saVatNumber(),
  
  // Postal code
  postalCode: saPostalCode(),

  // Bio/description with max length
  bio: maxLength(1000, 'Bio must be less than 1000 characters'),

  // Required text field
  requiredText: required('This field is required'),

  // Optional text with max length
  optionalText: (max = 500) => maxLength(max),
  
  // URL validation
  url: pattern(
    /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
    'Invalid URL format'
  ),
  
  // LinkedIn URL
  linkedinUrl: pattern(
    /^https?:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9-]+\/?$/,
    'Invalid LinkedIn profile URL'
  ),
};

export default validators;
