import { useState } from 'react';
import { useForm } from '../../hooks/useForm';
import FormField from './FormField';
import Button from './Button';
import ValidationSummary from './ValidationSummary';
import Card from './Card';
import {
  required,
  email,
  minLength,
  saIdNumber,
  saPhoneNumber,
  saAccountNumber,
  saBranchCode,
  matches,
  dateAfter,
  compose,
  percentage,
  futureDate,
  requiredWhen,
} from '../../utils/validationRules';

/**
 * EnhancedValidationExample Component
 * 
 * Demonstrates the enhanced validation system with:
 * - Basic validation rules
 * - South African specific validation
 * - Cross-field validation
 * - Async validation
 * - Conditional validation
 * - Custom error messages
 */
const EnhancedValidationExample = () => {
  const [submitResult, setSubmitResult] = useState(null);

  // Define validation rules
  const validationRules = {
    // Basic validation
    full_name: compose(
      required('Full name is required'),
      minLength(3, 'Name must be at least 3 characters')
    ),
    
    email: compose(
      required('Email is required'),
      email('Please enter a valid email address')
    ),
    
    // South African ID validation
    id_number: compose(
      required('ID number is required'),
      saIdNumber('Please enter a valid South African ID number')
    ),
    
    // South African phone validation
    phone: compose(
      required('Phone number is required'),
      saPhoneNumber('Please enter a valid South African phone number')
    ),
    
    // Banking details
    account_number: compose(
      required('Account number is required'),
      saAccountNumber('Account number must be 10-11 digits')
    ),
    
    branch_code: compose(
      required('Branch code is required'),
      saBranchCode('Branch code must be 6 digits')
    ),
    
    // Password with confirmation
    password: compose(
      required('Password is required'),
      minLength(8, 'Password must be at least 8 characters')
    ),
    
    password_confirmation: compose(
      required('Please confirm your password'),
      matches('password', 'Passwords must match')
    ),
    
    // Date validation
    start_date: required('Start date is required'),
    
    end_date: compose(
      required('End date is required'),
      dateAfter('start_date', 'End date must be after start date')
    ),
    
    // Percentage validation
    completion: compose(
      required('Completion percentage is required'),
      percentage('Must be between 0 and 100')
    ),
    
    // Future date validation
    deadline: compose(
      required('Deadline is required'),
      futureDate('Deadline must be in the future')
    ),
    
    // Conditional validation
    other_reason: requiredWhen(
      'reason',
      'other',
      'Please specify the reason'
    ),
  };

  // Initialize form
  const form = useForm(
    {
      full_name: '',
      email: '',
      id_number: '',
      phone: '',
      account_number: '',
      branch_code: '',
      password: '',
      password_confirmation: '',
      start_date: '',
      end_date: '',
      completion: '',
      deadline: '',
      reason: '',
      other_reason: '',
    },
    validationRules,
    async (values) => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSubmitResult({
        success: true,
        message: 'Form submitted successfully!',
        data: values,
      });
    },
    {
      formId: 'enhanced-validation-example',
      validateOnChange: false,
      validateOnBlur: true,
    }
  );

  const {
    values,
    errors,
    handleSubmit,
    isSubmitting,
    isValid,
    isDirty,
    resetForm,
  } = form;

  const handleReset = () => {
    resetForm();
    setSubmitResult(null);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card title="Enhanced Validation System Demo">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Validation Summary */}
          <ValidationSummary errors={errors} />

          {/* Basic Fields */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
            
            <FormField
              name="full_name"
              label="Full Name"
              form={form}
              required
              successMessage="Name looks good!"
            />
            
            <FormField
              name="email"
              label="Email Address"
              type="email"
              form={form}
              required
              successMessage="Valid email address"
            />
          </div>

          {/* South African Specific Fields */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">South African Details</h3>
            
            <FormField
              name="id_number"
              label="ID Number"
              form={form}
              required
              placeholder="9001015009087"
              successMessage="Valid SA ID number"
            />
            
            <FormField
              name="phone"
              label="Phone Number"
              form={form}
              required
              placeholder="+27821234567 or 0821234567"
              successMessage="Valid phone number"
            />
          </div>

          {/* Banking Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Banking Details</h3>
            
            <FormField
              name="account_number"
              label="Account Number"
              form={form}
              required
              placeholder="1234567890"
              successMessage="Valid account number"
            />
            
            <FormField
              name="branch_code"
              label="Branch Code"
              form={form}
              required
              placeholder="051001"
              successMessage="Valid branch code"
            />
          </div>

          {/* Password Fields */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Password</h3>
            
            <FormField
              name="password"
              label="Password"
              type="password"
              form={form}
              required
              successMessage="Strong password"
            />
            
            <FormField
              name="password_confirmation"
              label="Confirm Password"
              type="password"
              form={form}
              required
              successMessage="Passwords match"
            />
          </div>

          {/* Date Fields */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Dates</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                name="start_date"
                label="Start Date"
                type="date"
                form={form}
                required
              />
              
              <FormField
                name="end_date"
                label="End Date"
                type="date"
                form={form}
                required
              />
            </div>
            
            <FormField
              name="deadline"
              label="Deadline"
              type="date"
              form={form}
              required
            />
          </div>

          {/* Percentage Field */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Progress</h3>
            
            <FormField
              name="completion"
              label="Completion Percentage"
              type="number"
              form={form}
              required
              placeholder="0-100"
            />
          </div>

          {/* Conditional Field */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Additional Information</h3>
            
            <FormField
              name="reason"
              label="Reason"
              component="select"
              form={form}
              options={[
                { value: '', label: 'Select a reason' },
                { value: 'business', label: 'Business' },
                { value: 'personal', label: 'Personal' },
                { value: 'other', label: 'Other' },
              ]}
            />
            
            {values.reason === 'other' && (
              <FormField
                name="other_reason"
                label="Please Specify"
                form={form}
                required
              />
            )}
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-between pt-6 border-t">
            <div className="text-sm text-gray-600">
              {isDirty && <span className="text-yellow-600">• Unsaved changes</span>}
              {isValid && <span className="text-green-600 ml-2">• Form is valid</span>}
            </div>
            
            <div className="flex space-x-3">
              <Button
                type="button"
                variant="secondary"
                onClick={handleReset}
                disabled={isSubmitting}
              >
                Reset
              </Button>
              
              <Button
                type="submit"
                loading={isSubmitting}
                disabled={!isDirty}
              >
                Submit Form
              </Button>
            </div>
          </div>

          {/* Submit Result */}
          {submitResult && (
            <div className={`p-4 rounded-md ${
              submitResult.success 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-red-50 border border-red-200'
            }`}>
              <p className={`font-medium ${
                submitResult.success ? 'text-green-800' : 'text-red-800'
              }`}>
                {submitResult.message}
              </p>
              {submitResult.data && (
                <pre className="mt-2 text-xs text-gray-600 overflow-auto">
                  {JSON.stringify(submitResult.data, null, 2)}
                </pre>
              )}
            </div>
          )}
        </form>
      </Card>

      {/* Feature List */}
      <Card title="Validation Features" className="mt-6">
        <ul className="space-y-2 text-sm text-gray-700">
          <li>✓ Basic validation (required, email, length)</li>
          <li>✓ South African specific validation (ID, phone, banking)</li>
          <li>✓ Cross-field validation (password confirmation, date ranges)</li>
          <li>✓ Conditional validation (required when)</li>
          <li>✓ Custom error messages</li>
          <li>✓ Success messages</li>
          <li>✓ Validation on blur</li>
          <li>✓ Form-level validation summary</li>
          <li>✓ Async validation support</li>
          <li>✓ Accessibility features (ARIA labels)</li>
        </ul>
      </Card>
    </div>
  );
};

export default EnhancedValidationExample;
