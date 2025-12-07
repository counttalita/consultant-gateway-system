import { useForm } from '../../hooks/useForm';
import { required, saAccountNumber, saBranchCode } from '../../utils/validationRules';
import Input from '../shared/Input';
import Select from '../shared/Select';
import Button from '../shared/Button';

const BankingStep = ({ data, onComplete, onBack, canGoBack }) => {
  const { values, errors, touched, handleChange, handleBlur, handleSubmit, isSubmitting } = useForm(
    data || {
      bank_name: '',
      account_number: '',
      branch_code: '',
      account_type: '',
      account_holder_name: '',
      tax_number: '',
      vat_number: ''
    },
    {
      bank_name: [required('Bank name is required')],
      account_number: [required('Account number is required'), saAccountNumber()],
      branch_code: [required('Branch code is required'), saBranchCode()],
      account_type: [required('Account type is required')],
      account_holder_name: [required('Account holder name is required')]
      // tax_number and vat_number are optional
    },
    async (values) => {
      await onComplete('banking_details', values);
    }
  );

  const accountTypeOptions = [
    { value: 'checking', label: 'Checking' },
    { value: 'savings', label: 'Savings' },
    { value: 'current', label: 'Current' }
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Banking Details</h2>
        <p className="text-gray-600">Required for payment processing.</p>
      </div>

      <div className="space-y-4">
        <Input
          id="bank_name"
          label="Bank Name"
          type="text"
          required
          value={values.bank_name}
          onChange={(e) => handleChange('bank_name', e.target.value)}
          onBlur={() => handleBlur('bank_name')}
          error={touched.bank_name && errors.bank_name}
          placeholder="Standard Bank"
        />

        <Input
          id="account_holder_name"
          label="Account Holder Name"
          type="text"
          required
          value={values.account_holder_name}
          onChange={(e) => handleChange('account_holder_name', e.target.value)}
          onBlur={() => handleBlur('account_holder_name')}
          error={touched.account_holder_name && errors.account_holder_name}
          placeholder="John Doe"
          helperText="Name as it appears on your bank account"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            id="account_number"
            label="Account Number"
            type="text"
            required
            value={values.account_number}
            onChange={(e) => handleChange('account_number', e.target.value)}
            onBlur={() => handleBlur('account_number')}
            error={touched.account_number && errors.account_number}
            placeholder="1234567890"
            helperText="10-11 digits"
            maxLength={11}
          />

          <Input
            id="branch_code"
            label="Branch Code"
            type="text"
            required
            value={values.branch_code}
            onChange={(e) => handleChange('branch_code', e.target.value)}
            onBlur={() => handleBlur('branch_code')}
            error={touched.branch_code && errors.branch_code}
            placeholder="051001"
            helperText="6 digits"
            maxLength={6}
          />
        </div>

        <Select
          id="account_type"
          label="Account Type"
          required
          value={values.account_type}
          onChange={(e) => handleChange('account_type', e.target.value)}
          onBlur={() => handleBlur('account_type')}
          error={touched.account_type && errors.account_type}
          options={accountTypeOptions}
          placeholder="Select account type"
        />

        <div className="border-t pt-4 mt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Tax Information (Optional)</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              id="tax_number"
              label="Tax Number"
              type="text"
              value={values.tax_number}
              onChange={(e) => handleChange('tax_number', e.target.value)}
              onBlur={() => handleBlur('tax_number')}
              error={touched.tax_number && errors.tax_number}
              placeholder="9876543210"
              helperText="Optional"
            />

            <Input
              id="vat_number"
              label="VAT Number"
              type="text"
              value={values.vat_number}
              onChange={(e) => handleChange('vat_number', e.target.value)}
              onBlur={() => handleBlur('vat_number')}
              error={touched.vat_number && errors.vat_number}
              placeholder="4123456789"
              helperText="Optional"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-between pt-6 border-t">
        {canGoBack ? (
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            disabled={isSubmitting}
          >
            Back
          </Button>
        ) : (
          <div />
        )}

        <Button
          type="submit"
          loading={isSubmitting}
          disabled={isSubmitting}
        >
          Continue
        </Button>
      </div>
    </form>
  );
};

export default BankingStep;
