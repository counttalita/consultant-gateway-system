import { createContext, useContext, useState, useCallback } from 'react';

/**
 * ValidationContext
 * 
 * Provides global validation configuration and state management
 * Allows forms to share validation settings and coordinate validation
 */

const ValidationContext = createContext(null);

export const useValidation = () => {
  const context = useContext(ValidationContext);
  if (!context) {
    throw new Error('useValidation must be used within a ValidationProvider');
  }
  return context;
};

/**
 * ValidationProvider Component
 * 
 * Wraps the application to provide validation configuration
 * 
 * @param {Object} config - Global validation configuration
 * @param {boolean} config.validateOnChange - Default validate on change behavior
 * @param {boolean} config.validateOnBlur - Default validate on blur behavior
 * @param {number} config.asyncDebounceMs - Default debounce time for async validation
 * @param {boolean} config.showErrorsOnSubmit - Show all errors on submit attempt
 * @param {Function} config.onValidationError - Global validation error handler
 */
export const ValidationProvider = ({ 
  children, 
  config = {} 
}) => {
  const [globalConfig] = useState({
    validateOnChange: false,
    validateOnBlur: true,
    asyncDebounceMs: 500,
    showErrorsOnSubmit: true,
    scrollToFirstError: true,
    focusFirstError: true,
    ...config
  });

  const [validationState, setValidationState] = useState({
    // Track which forms are currently validating
    validatingForms: new Set(),
    // Track form-level errors
    formErrors: {},
  });

  /**
   * Register a form for validation tracking
   */
  const registerForm = useCallback((formId) => {
    setValidationState(prev => ({
      ...prev,
      formErrors: {
        ...prev.formErrors,
        [formId]: {}
      }
    }));
  }, []);

  /**
   * Unregister a form
   */
  const unregisterForm = useCallback((formId) => {
    setValidationState(prev => {
      const newFormErrors = { ...prev.formErrors };
      delete newFormErrors[formId];
      
      const newValidatingForms = new Set(prev.validatingForms);
      newValidatingForms.delete(formId);
      
      return {
        ...prev,
        formErrors: newFormErrors,
        validatingForms: newValidatingForms
      };
    });
  }, []);

  /**
   * Set validation state for a form
   */
  const setFormValidating = useCallback((formId, isValidating) => {
    setValidationState(prev => {
      const newValidatingForms = new Set(prev.validatingForms);
      if (isValidating) {
        newValidatingForms.add(formId);
      } else {
        newValidatingForms.delete(formId);
      }
      
      return {
        ...prev,
        validatingForms: newValidatingForms
      };
    });
  }, []);

  /**
   * Set errors for a form
   */
  const setFormErrors = useCallback((formId, errors) => {
    setValidationState(prev => ({
      ...prev,
      formErrors: {
        ...prev.formErrors,
        [formId]: errors
      }
    }));
  }, []);

  /**
   * Get errors for a form
   */
  const getFormErrors = useCallback((formId) => {
    return validationState.formErrors[formId] || {};
  }, [validationState.formErrors]);

  /**
   * Check if any form is validating
   */
  const isAnyFormValidating = useCallback(() => {
    return validationState.validatingForms.size > 0;
  }, [validationState.validatingForms]);

  /**
   * Check if a specific form is validating
   */
  const isFormValidating = useCallback((formId) => {
    return validationState.validatingForms.has(formId);
  }, [validationState.validatingForms]);

  /**
   * Scroll to first error in a form
   */
  const scrollToFirstError = useCallback((formId, errors) => {
    if (!globalConfig.scrollToFirstError) return;
    
    const errorFields = Object.keys(errors).filter(key => errors[key]);
    if (errorFields.length === 0) return;
    
    const firstErrorField = errorFields[0];
    const element = document.getElementById(firstErrorField) || 
                   document.querySelector(`[name="${firstErrorField}"]`);
    
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      if (globalConfig.focusFirstError) {
        setTimeout(() => element.focus(), 300);
      }
    }
  }, [globalConfig.scrollToFirstError, globalConfig.focusFirstError]);

  /**
   * Handle validation error globally
   */
  const handleValidationError = useCallback((formId, fieldName, error) => {
    if (globalConfig.onValidationError) {
      globalConfig.onValidationError(formId, fieldName, error);
    }
  }, [globalConfig]);

  const value = {
    // Configuration
    config: globalConfig,
    
    // Form registration
    registerForm,
    unregisterForm,
    
    // Validation state
    setFormValidating,
    isFormValidating,
    isAnyFormValidating,
    
    // Error management
    setFormErrors,
    getFormErrors,
    scrollToFirstError,
    handleValidationError,
  };

  return (
    <ValidationContext.Provider value={value}>
      {children}
    </ValidationContext.Provider>
  );
};

export default ValidationContext;
