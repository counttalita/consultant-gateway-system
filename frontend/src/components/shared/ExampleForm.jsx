import { useForm } from '../../hooks/useForm';
import { validators, required, email, minLength, maxLength, saPhoneNumber, saIdNumber } from '../../utils/validationRules';
import FormField from './FormField';
import Button from './Button';
import { useNotification } from '../../hooks/useNotification';

/**
 * Example form demonstrating the validation system
 * This component shows how to use useForm hook with validation rules
 */
const ExampleForm = ({ initialData = {}, onSuccess }) => {
  const { showSuccess, showError } = useNotification();

  // Define initial values
  const initialValues = {
    email: initialData.email || '',
    password: initialData.password || '',
    full_name: initialData.full_name || '',
    phone: initialData.phone || '',
    id_number: initialData.id_number || '',
    bio: initialData.bio || '',
    terms: initialData.terms || false,
  };

  // Define validation rules
  const validationRules = {
    email: validators.email,
    password: validators.password,
    full_name: required('Full name is required'),
    phone: validators.saPhone,
    id_number: validators.saId,
    bio: maxLength(1000, 'Bio must be less than 1000 characters'),
    terms: (value) => !value ? 'You must accept the terms and conditions' : null,
  };

  // Handle form submission
  const handleSubmit = async (values) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('Form submitted:', values);
      showSuccess('Form submitted successfully!');
      
      if (onSuccess) {
        onSuccess(values);
      }
    } catch (error) {
      showError('Failed to submit form');
      throw error;
    }
  };

  // Initialize form
  const form = useForm(initialValues, validationRules, handleSubmit);

  return (
    <form onSubmit={form.handleSubmit} className="space-y-6 max-w-2xl">
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-900">Example Form</h2>
        <p className="text-sm text-gray-600">
          This form demonstrates real-time validation with the useForm hook.
        </p>
      </div>

      {/* Email field */}
      <FormField
        name="email"
        label="Email Address"
        type="email"
        form={form}
        required
        placeholder="you@example.com"
        helperText="We'll never share your email with anyone else."
      />

      {/* Password field */}
      <FormField
        name="password"
        label="Password"
        type="password"
        form={form}
        required
        placeholder="Enter your password"
        helperText="Must be at least 8 characters long."
      />

      {/* Full name field */}
      <FormField
        name="full_name"
        label="Full Name"
        type="text"
        form={form}
        required
        placeholder="John Doe"
      />

      {/* Phone field */}
      <FormField
        name="phone"
        label="Phone Number"
        type="tel"
        form={form}
        required
        placeholder="+27123456789 or 0123456789"
        helperText="South African phone number format"
      />

      {/* ID number field */}
      <FormField
        name="id_number"
        label="ID Number"
        type="text"
        form={form}
        required
        placeholder="13 digit ID number"
        helperText="South African ID number (13 digits)"
      />

      {/* Bio field (textarea) */}
      <FormField
        name="bio"
        label="Bio"
        type="textarea"
        form={form}
        placeholder="Tell us about yourself..."
        rows={4}
        maxLength={1000}
        showCount
        helperText="Optional. Maximum 1000 characters."
      />

      {/* Terms checkbox */}
      <FormField
        name="terms"
        label="I accept the terms and conditions"
        type="checkbox"
        form={form}
        required
      />

      {/* Form actions */}
      <div className="flex items-center justify-between pt-4 border-t">
        <div className="text-sm text-gray-600">
          {form.isDirty && !form.isValid && (
            <span className="text-red-600">Please fix the errors above</span>
          )}
          {form.isDirty && form.isValid && (
            <span className="text-green-600">Form is valid</span>
          )}
        </div>
        
        <div className="flex space-x-3">
          <Button
            type="button"
            variant="secondary"
            onClick={form.resetForm}
            disabled={!form.isDirty || form.isSubmitting}
          >
            Reset
          </Button>
          
          <Button
            type="submit"
            loading={form.isSubmitting}
            disabled={form.isSubmitting}
          >
            {form.isSubmitting ? 'Submitting...' : 'Submit'}
          </Button>
        </div>
      </div>

      {/* Debug info (remove in production) */}
      {process.env.NODE_ENV === 'development' && (
        <details className="mt-8 p-4 bg-gray-50 rounded-md">
          <summary className="cursor-pointer font-medium text-gray-700">
            Debug Info (Development Only)
          </summary>
          <div className="mt-4 space-y-2 text-xs">
            <div>
              <strong>Values:</strong>
              <pre className="mt-1 p-2 bg-white rounded overflow-auto">
                {JSON.stringify(form.values, null, 2)}
              </pre>
            </div>
            <div>
              <strong>Errors:</strong>
              <pre className="mt-1 p-2 bg-white rounded overflow-auto">
                {JSON.stringify(form.errors, null, 2)}
              </pre>
            </div>
            <div>
              <strong>Touched:</strong>
              <pre className="mt-1 p-2 bg-white rounded overflow-auto">
                {JSON.stringify(form.touched, null, 2)}
              </pre>
            </div>
            <div className="flex space-x-4">
              <span>Is Valid: {form.isValid ? '✅' : '❌'}</span>
              <span>Is Dirty: {form.isDirty ? '✅' : '❌'}</span>
              <span>Is Submitting: {form.isSubmitting ? '✅' : '❌'}</span>
            </div>
          </div>
        </details>
      )}
    </form>
  );
};

export default ExampleForm;
