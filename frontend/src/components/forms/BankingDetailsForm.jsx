import { useForm } from '../../hooks/useForm';
import { required, saAccountNumber, saBranchCode } from '../../utils/validationRules';
import FormField from '../shared/FormField';
import Button from '../shared/Button';
import Card from '../shared/Card';
import { useNotification } from '../../hooks/useNotification';

/**
 * Banking Details Form Component
 * Example form for collecting South African banking information
 */
const BankingDetailsForm = ({ bankingDetails, onSave }) => {
  const { showSuccess, showError } = useNotification();

  // Initial values
  const initialValues = {
    bank_name: bankingDetails?.bank_name || '',
    account_holder_name: bankingDetails?.account_holder_name || '',
    account_number: bankingDetails?.account_number || '',
    account_type: bankingDetails?.account_type || '',
    branch_code: bankingDetails?.branch_code || '',
  };

  // Validation rules
  const validationRules = {
    bank_name: required('Bank name is required'),
    account_holder_name: required('Account holder name is required'),
    account_number: [
      required('Account number is required'),
      saAccountNumber(),
    ],
    account_type: required('Account type is required'),
    branch_code: [
      required('Branch code is required'),
      saBranchCode(),
    ],
  };

  // Initialize form first
  const form = useForm(initialValues, validationRules);

  // Handle form submission
  const handleSubmit = async (values) => {
    try {
      await onSave(values);
      showSuccess('Banking details updated successfully!');
    } catch (error) {
      showError(error.message || 'Failed to update banking details');
      
      // Handle API validation errors
      if (error.response?.data?.errors) {
        form.setFieldErrors(error.response.data.errors);
      }
      
      throw error;
    }
  };

  // Bank options (common South African banks)
  const bankOptions = [
    { value: 'ABSA', label: 'ABSA' },
    { value: 'Standard Bank', label: 'Standard Bank' },
    { value: 'FNB', label: 'First National Bank (FNB)' },
    { value: 'Nedbank', label: 'Nedbank' },
    { value: 'Capitec', label: 'Capitec Bank' },
    { value: 'Discovery Bank', label: 'Discovery Bank' },
    { value: 'TymeBank', label: 'TymeBank' },
    { value: 'African Bank', label: 'African Bank' },
    { value: 'Investec', label: 'Investec' },
    { value: 'Other', label: 'Other' },
  ];

  // Account type options
  const accountTypeOptions = [
    { value: 'current', label: 'Current Account' },
    { value: 'savings', label: 'Savings Account' },
    { value: 'cheque', label: 'Cheque Account' },
  ];

  return (
    <Card 
      title="Banking Details" 
      subtitle="Enter your South African bank account information for payments"
    >
      <form onSubmit={(e) => { e.preventDefault(); handleSubmit(form.values); }} className="space-y-6">
        {/* Bank Name */}
        <FormField
          name="bank_name"
          label="Bank Name"
          type="select"
          form={form}
          required
          options={bankOptions}
          placeholder="Select your bank"
        />

        {/* Account Holder Name */}
        <FormField
          name="account_holder_name"
          label="Account Holder Name"
          type="text"
          form={form}
          required
          placeholder="Full name as it appears on your account"
          helperText="Must match the name on your bank account"
        />

        {/* Account Number */}
        <FormField
          name="account_number"
          label="Account Number"
          type="text"
          form={form}
          required
          placeholder="10 or 11 digit account number"
          helperText="Your bank account number (10-11 digits)"
        />

        {/* Account Type */}
        <FormField
          name="account_type"
          label="Account Type"
          type="select"
          form={form}
          required
          options={accountTypeOptions}
          placeholder="Select account type"
        />

        {/* Branch Code */}
        <FormField
          name="branch_code"
          label="Branch Code"
          type="text"
          form={form}
          required
          placeholder="6 digit branch code"
          helperText="Your bank branch code (6 digits)"
        />

        {/* Security Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <div className="flex">
            <div className="shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Your information is secure
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>
                  Your banking details are encrypted and stored securely. We will only use this information for payment processing.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm">
            {form.isDirty && !form.isValid && (
              <span className="text-red-600">Please fix the errors above</span>
            )}
            {form.isDirty && form.isValid && (
              <span className="text-green-600">Ready to save</span>
            )}
            {!form.isDirty && (
              <span className="text-gray-500">No changes</span>
            )}
          </div>

          <div className="flex space-x-3">
            <Button
              type="button"
              variant="secondary"
              onClick={form.resetForm}
              disabled={!form.isDirty || form.isSubmitting}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              variant="primary"
              loading={form.isSubmitting}
              disabled={!form.isDirty || form.isSubmitting}
            >
              {form.isSubmitting ? 'Saving...' : 'Save Banking Details'}
            </Button>
          </div>
        </div>
      </form>
    </Card>
  );
};

export default BankingDetailsForm;
