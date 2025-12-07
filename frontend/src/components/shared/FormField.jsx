import Input from './Input';
import TextArea from './TextArea';
import Select from './Select';
import Checkbox from './Checkbox';
import ValidationMessage from './ValidationMessage';

/**
 * FormField component that integrates with useForm hook
 * Automatically handles value, onChange, onBlur, and error props
 * Supports validation states, success messages, and accessibility
 * 
 * @example
 * const form = useForm(initialValues, validationRules);
 * 
 * <FormField
 *   name="email"
 *   label="Email"
 *   type="email"
 *   form={form}
 *   required
 *   successMessage="Email is valid"
 * />
 */
const FormField = ({
  name,
  form,
  component: Component,
  type = 'text',
  onChange: customOnChange,
  onBlur: customOnBlur,
  successMessage,
  warningMessage,
  showErrorOnlyWhenTouched = true,
  validateOnBlur: fieldValidateOnBlur = true,
  transform,
  normalize,
  ...props
}) => {
  const { 
    values, 
    errors, 
    touched, 
    handleChange, 
    handleBlur,
    shouldShowError,
    isFieldTouched,
    submitCount 
  } = form;

  // Determine which component to use
  let FieldComponent = Component;
  if (!FieldComponent) {
    if (type === 'textarea') {
      FieldComponent = TextArea;
    } else if (type === 'select') {
      FieldComponent = Select;
    } else if (type === 'checkbox') {
      FieldComponent = Checkbox;
    } else {
      FieldComponent = Input;
    }
  }

  // Handle change event
  const handleFieldChange = (e) => {
    let value = type === 'checkbox' ? e.target.checked : e.target.value;
    
    // Apply normalization if provided
    if (normalize) {
      value = normalize(value);
    }
    
    // Apply transformation if provided
    if (transform) {
      value = transform(value);
    }
    
    handleChange(name, value);
    
    if (customOnChange) {
      customOnChange(e, value);
    }
  };

  // Handle blur event
  const handleFieldBlur = (e) => {
    if (fieldValidateOnBlur !== false) {
      handleBlur(name);
    }
    
    if (customOnBlur) {
      customOnBlur(e);
    }
  };

  // Get field value
  const value = values[name] ?? (type === 'checkbox' ? false : '');

  // Get field error
  const fieldError = errors[name];
  const isTouched = isFieldTouched ? isFieldTouched(name) : touched[name];
  
  // Determine if error should be shown
  const showError = showErrorOnlyWhenTouched 
    ? (shouldShowError ? shouldShowError(name) : (isTouched || submitCount > 0) && fieldError)
    : fieldError;

  // Show success message if field is valid and touched
  const showSuccess = successMessage && isTouched && !fieldError;
  
  // Show warning message if provided and no error
  const showWarning = warningMessage && !fieldError;

  return (
    <div className="relative">
      <FieldComponent
        {...props}
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={handleFieldChange}
        onBlur={handleFieldBlur}
        error={showError ? fieldError : null}
        aria-invalid={showError ? 'true' : 'false'}
        aria-describedby={
          showError ? `${name}-error` : 
          showSuccess ? `${name}-success` : 
          showWarning ? `${name}-warning` : 
          undefined
        }
      />
      
      {showSuccess && (
        <ValidationMessage 
          type="success" 
          message={successMessage}
          id={`${name}-success`}
        />
      )}
      
      {showWarning && !showError && (
        <ValidationMessage 
          type="warning" 
          message={warningMessage}
          id={`${name}-warning`}
        />
      )}
    </div>
  );
};

export default FormField;
