import { useState, useCallback, useEffect, useRef } from 'react';
import { validateAllFields, validateField, hasValidationErrors } from '../utils/validationUtils';

/**
 * Custom hook for form state management with validation
 * 
 * @param {Object} initialValues - Initial form values
 * @param {Object} validationRules - Validation rules for each field
 * @param {Function} onSubmit - Submit handler function
 * @param {Object} options - Additional options
 * @param {string} options.formId - Unique form identifier
 * @param {boolean} options.validateOnChange - Validate on every change
 * @param {boolean} options.validateOnBlur - Validate on blur
 * @param {boolean} options.validateOnMount - Validate on mount
 * @param {Function} options.onValidationError - Callback for validation errors
 * @returns {Object} Form state and handlers
 * 
 * @example
 * const { values, errors, touched, handleChange, handleBlur, handleSubmit, isSubmitting } = useForm(
 *   { email: '', password: '' },
 *   {
 *     email: [required('Email is required'), email('Invalid email')],
 *     password: [required('Password is required'), minLength(8)]
 *   },
 *   async (values) => {
 *     await api.post('/login', values);
 *   },
 *   { formId: 'login-form', validateOnChange: false }
 * );
 */
export const useForm = (
  initialValues = {},
  validationRules = {},
  onSubmit,
  options = {}
) => {
  const {
    formId = `form-${Date.now()}`,
    validateOnChange = false,
    validateOnBlur = true,
    validateOnMount = false,
    onValidationError,
  } = options;
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitCount, setSubmitCount] = useState(0);
  const [isValidating, setIsValidating] = useState(false);

  // Use ref to track mounted state
  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Validate on mount if requested
  useEffect(() => {
    if (validateOnMount) {
      validateForm().then(newErrors => {
        if (isMounted.current) {
          setErrors(newErrors);
        }
      });
    }
  }, [validateOnMount]); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Validates a single field (supports async validation)
   */
  const validateSingleField = useCallback(async (fieldName, value, allValues = values) => {
    try {
      const error = await validateField(fieldName, value, validationRules, allValues);
      return error;
    } catch (err) {
      console.error(`Validation error for field ${fieldName}:`, err);
      if (onValidationError) {
        onValidationError(fieldName, err);
      }
      return 'Validation failed';
    }
  }, [validationRules, values, onValidationError]);

  /**
   * Validates all fields (supports async validation)
   */
  const validateForm = useCallback(async (valuesToValidate = values) => {
    setIsValidating(true);
    try {
      const newErrors = await validateAllFields(valuesToValidate, validationRules);
      return newErrors;
    } catch (err) {
      console.error('Form validation error:', err);
      return {};
    } finally {
      if (isMounted.current) {
        setIsValidating(false);
      }
    }
  }, [validationRules, values]);

  /**
   * Handles field value change (supports async validation)
   */
  const handleChange = useCallback((fieldName, value) => {
    setValues(prev => {
      const newValues = { ...prev, [fieldName]: value };

      // Validate on change if enabled and field has been touched or form has been submitted
      if ((validateOnChange && touched[fieldName]) || submitCount > 0) {
        validateSingleField(fieldName, value, newValues).then(error => {
          if (isMounted.current) {
            setErrors(prev => ({
              ...prev,
              [fieldName]: error
            }));
          }
        });
      } else if (!validateOnChange && errors[fieldName]) {
        // Clear error on change if not validating on change
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[fieldName];
          return newErrors;
        });
      }

      return newValues;
    });
  }, [touched, submitCount, validateOnChange, validateSingleField, errors]);

  /**
   * Handles field blur event (supports async validation)
   */
  const handleBlur = useCallback((fieldName) => {
    setTouched(prev => ({ ...prev, [fieldName]: true }));

    // Validate on blur if enabled
    if (validateOnBlur) {
      validateSingleField(fieldName, values[fieldName]).then(error => {
        if (isMounted.current) {
          setErrors(prev => ({
            ...prev,
            [fieldName]: error
          }));
        }
      });
    }
  }, [values, validateOnBlur, validateSingleField]);

  /**
   * Handles form submission (supports async validation)
   */
  const handleSubmit = useCallback(async (e) => {
    if (e) {
      e.preventDefault();
    }

    setIsSubmitting(true);
    setSubmitCount(prev => prev + 1);

    // Validate all fields (async)
    const newErrors = await validateForm();
    setErrors(newErrors);

    // Mark all fields as touched
    const allTouched = Object.keys(validationRules).reduce(
      (acc, key) => ({ ...acc, [key]: true }),
      {}
    );
    setTouched(allTouched);

    // If no errors, call onSubmit
    if (Object.keys(newErrors).length === 0) {
      if (onSubmit) {
        try {
          await Promise.resolve(onSubmit(values));
          setIsSubmitting(false);
        } catch (error) {
          setIsSubmitting(false);

          // Handle API validation errors
          if (error.response?.data?.errors) {
            setErrors(prev => ({
              ...prev,
              ...error.response.data.errors
            }));
          }
        }
      } else {
        setIsSubmitting(false);
      }
    } else {
      setIsSubmitting(false);
    }
  }, [values, validationRules, validateForm, onSubmit]);

  /**
   * Resets form to initial values
   */
  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
    setSubmitCount(0);
  }, [initialValues]);

  /**
   * Sets a specific field value
   */
  const setFieldValue = useCallback((fieldName, value) => {
    handleChange(fieldName, value);
  }, [handleChange]);

  /**
   * Sets a specific field error
   */
  const setFieldError = useCallback((fieldName, error) => {
    setErrors(prev => ({
      ...prev,
      [fieldName]: error
    }));
  }, []);

  /**
   * Sets multiple field errors (useful for API validation errors)
   */
  const setFieldErrors = useCallback((errorObject) => {
    setErrors(prev => ({
      ...prev,
      ...errorObject
    }));
  }, []);

  /**
   * Sets field as touched
   */
  const setFieldTouched = useCallback((fieldName, isTouched = true) => {
    setTouched(prev => ({
      ...prev,
      [fieldName]: isTouched
    }));
  }, []);

  /**
   * Checks if form is valid
   */
  const isValid = !hasValidationErrors(errors);

  /**
   * Checks if form has been modified
   */
  const isDirty = JSON.stringify(values) !== JSON.stringify(initialValues);

  /**
   * Gets error for a specific field
   */
  const getFieldError = useCallback((fieldName) => {
    return errors[fieldName];
  }, [errors]);

  /**
   * Checks if a field has been touched
   */
  const isFieldTouched = useCallback((fieldName) => {
    return touched[fieldName] || false;
  }, [touched]);

  /**
   * Checks if a field should show error
   */
  const shouldShowError = useCallback((fieldName) => {
    return (touched[fieldName] || submitCount > 0) && errors[fieldName];
  }, [touched, submitCount, errors]);

  return {
    // Form state
    values,
    errors,
    touched,
    isSubmitting,
    isValidating,
    isValid,
    isDirty,
    submitCount,
    formId,

    // Handlers
    handleChange,
    handleBlur,
    handleSubmit,
    resetForm,

    // Setters
    setFieldValue,
    setFieldError,
    setFieldErrors,
    setFieldTouched,
    setValues,

    // Validation
    validateField: validateSingleField,
    validateForm,

    // Getters
    getFieldError,
    isFieldTouched,
    shouldShowError,
  };
};

export default useForm;
