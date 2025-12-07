import { useForm } from '../../hooks/useForm';
import { required, saIdNumber, saPhoneNumber } from '../../utils/validationRules';
import Input from '../shared/Input';
import Button from '../shared/Button';

const PersonalInfoStep = ({ data, onComplete, onBack, canGoBack }) => {
  const { values, errors, touched, handleChange, handleBlur, handleSubmit, isSubmitting } = useForm(
    data || {
      full_name: '',
      id_number: '',
      phone_number: '',
      city: '',
      country: 'South Africa'
    },
    {
      full_name: [required('Full name is required')],
      id_number: [required('ID number is required'), saIdNumber()],
      phone_number: [required('Phone number is required'), saPhoneNumber()],
      city: [required('City is required')],
      country: [required('Country is required')]
    },
    async (values) => {
      await onComplete('personal_info', values);
    }
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Personal Information</h2>
        <p className="text-gray-600">Please provide your basic contact information.</p>
      </div>

      <div className="space-y-4">
        <Input
          id="full_name"
          label="Full Name"
          type="text"
          required
          value={values.full_name}
          onChange={(e) => handleChange('full_name', e.target.value)}
          onBlur={() => handleBlur('full_name')}
          error={touched.full_name && errors.full_name}
          placeholder="John Doe"
        />

        <Input
          id="id_number"
          label="South African ID Number"
          type="text"
          required
          value={values.id_number}
          onChange={(e) => handleChange('id_number', e.target.value)}
          onBlur={() => handleBlur('id_number')}
          error={touched.id_number && errors.id_number}
          placeholder="9001015009087"
          helperText="13-digit South African ID number"
          maxLength={13}
        />

        <Input
          id="phone_number"
          label="Phone Number"
          type="tel"
          required
          value={values.phone_number}
          onChange={(e) => handleChange('phone_number', e.target.value)}
          onBlur={() => handleBlur('phone_number')}
          error={touched.phone_number && errors.phone_number}
          placeholder="+27821234567 or 0821234567"
          helperText="South African phone number"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            id="city"
            label="City"
            type="text"
            required
            value={values.city}
            onChange={(e) => handleChange('city', e.target.value)}
            onBlur={() => handleBlur('city')}
            error={touched.city && errors.city}
            placeholder="Cape Town"
          />

          <Input
            id="country"
            label="Country"
            type="text"
            required
            value={values.country}
            onChange={(e) => handleChange('country', e.target.value)}
            onBlur={() => handleBlur('country')}
            error={touched.country && errors.country}
            placeholder="South Africa"
          />
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

export default PersonalInfoStep;
