import { useState } from 'react';
import { useForm } from '../../hooks/useForm';
import {
  required,
  email,
  minLength,
  saIdNumber,
  saPhoneNumber,
  matches,
  asyncValidate,
  compose,
} from '../../utils/validationRules';
import { loginSchema } from '../../utils/validationSchemas';
import Input from './Input';
import Button from './Button';
import Card from './Card';
import ValidationSummary from './ValidationSummary';
import ValidatedInput from './ValidatedInput';
import ValidationMessage from './ValidationMessage';

/**
 * ValidationExample Component
 * 
 * Demonstrates the enhanced validation system with:
 * - Sync validation
 * - Async validation
 * - Cross-field validation
 * - Validation schemas
 * - Validation components
 */
const ValidationExample = () => {
  const [activeExample, setActiveExample] = useState('basic');

  return (
    <div className="space-y-8 p-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Validation System Examples
        </h1>
        <p className="text-gray-600">
          Comprehensive examples of the validation layer features
        </p>
      </div>

      {/* Example selector */}
      <div className="flex space-x-2 border-b">
        {[
          { id: 'basic', label: 'Basic Validation' },
          { id: 'async', label: 'Async Validation' },
          { id: 'cross-field', label: 'Cross-Field Validation' },
          { id: 'schema', label: 'Validation Schemas' },
        ].map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setActiveExample(id)}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeExample === id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Examples */}
      <div>
        {activeExample === 'basic' && <BasicValidationExample />}
        {activeExample === 'async' && <AsyncValidationExample />}
        {activeExample === 'cross-field' && <CrossFieldValidationExample />}
        {activeExample === 'schema' && <SchemaValidationExample />}
      </div>
    </div>
  );
};

/**
 * Basic Validation Example
 */
const BasicValidationExample = () => {
  const form = useForm(
    {
      name: '',
      email: '',
      phone: '',
      id_number: '',
    },
    {
      name: required('Name is required'),
      email: compose(
        required('Email is required'),
        email('Invalid email address')
      ),
      phone: compose(
        required('Phone is required'),
        saPhoneNumber()
      ),
      id_number: compose(
        required('ID number is required'),
        saIdNumber()
      ),
    },
    async (values) => {
      console.log('Form submitted:', values);
      alert('Form submitted successfully!');
    }
  );

  return (
    <Card title="Basic Validation" subtitle="Standard sync validation with South African formats">
      <form onSubmit={form.handleSubmit} className="space-y-4">
        <ValidationSummary errors={form.errors} />

        <Input
          id="name"
          label="Full Name"
          value={form.values.name}
          onChange={(e) => form.handleChange('name', e.target.value)}
          onBlur={() => form.handleBlur('name')}
          error={form.touched.name && form.errors.name}
          required
        />

        <Input
          id="email"
          label="Email"
          type="email"
          value={form.values.email}
          onChange={(e) => form.handleChange('email', e.target.value)}
          onBlur={() => form.handleBlur('email')}
          error={form.touched.email && form.errors.email}
          required
        />

        <Input
          id="phone"
          label="Phone Number"
          type="tel"
          value={form.values.phone}
          onChange={(e) => form.handleChange('phone', e.target.value)}
          onBlur={() => form.handleBlur('phone')}
          error={form.touched.phone && form.errors.phone}
          helperText="Format: +27XXXXXXXXX or 0XXXXXXXXX"
          required
        />

        <Input
          id="id_number"
          label="SA ID Number"
          value={form.values.id_number}
          onChange={(e) => form.handleChange('id_number', e.target.value)}
          onBlur={() => form.handleBlur('id_number')}
          error={form.touched.id_number && form.errors.id_number}
          helperText="13-digit South African ID with checksum validation"
          maxLength={13}
          required
        />

        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="secondary" onClick={form.resetForm}>
            Reset
          </Button>
          <Button type="submit" loading={form.isSubmitting}>
            Submit
          </Button>
        </div>
      </form>
    </Card>
  );
};

/**
 * Async Validation Example
 */
const AsyncValidationExample = () => {
  // Simulate API call for email uniqueness check
  const checkEmailUniqueness = async (email) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    const existingEmails = ['test@example.com', 'admin@example.com'];
    return {
      valid: !existingEmails.includes(email),
      message: 'Email already exists',
    };
  };

  const [email, setEmail] = useState('');

  return (
    <Card 
      title="Async Validation" 
      subtitle="Validation with API calls (debounced)"
    >
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          Try entering: test@example.com or admin@example.com (these will fail validation)
        </p>

        <ValidatedInput
          id="async-email"
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          validate={asyncValidate(checkEmailUniqueness, 'Email already exists')}
          validateOnChange={true}
          debounceMs={1000}
          successMessage="Email is available!"
          placeholder="Enter email to check availability"
        />

        <ValidationMessage 
          type="info" 
          message="Validation will trigger 1 second after you stop typing"
        />
      </div>
    </Card>
  );
};

/**
 * Cross-Field Validation Example
 */
const CrossFieldValidationExample = () => {
  const form = useForm(
    {
      password: '',
      confirm_password: '',
      start_date: '',
      end_date: '',
    },
    {
      password: compose(
        required('Password is required'),
        minLength(8, 'Password must be at least 8 characters')
      ),
      confirm_password: compose(
        required('Please confirm your password'),
        matches('password', 'Passwords must match')
      ),
      start_date: required('Start date is required'),
      end_date: compose(
        required('End date is required'),
        (value, allValues) => {
          if (!value || !allValues.start_date) return null;
          const start = new Date(allValues.start_date);
          const end = new Date(value);
          if (end <= start) {
            return 'End date must be after start date';
          }
          return null;
        }
      ),
    },
    async (values) => {
      console.log('Form submitted:', values);
      alert('Form submitted successfully!');
    }
  );

  return (
    <Card 
      title="Cross-Field Validation" 
      subtitle="Validation that depends on multiple fields"
    >
      <form onSubmit={form.handleSubmit} className="space-y-4">
        <ValidationSummary errors={form.errors} />

        <div className="space-y-4 p-4 bg-gray-50 rounded-md">
          <h3 className="font-medium text-gray-900">Password Matching</h3>
          
          <Input
            id="password"
            label="Password"
            type="password"
            value={form.values.password}
            onChange={(e) => form.handleChange('password', e.target.value)}
            onBlur={() => form.handleBlur('password')}
            error={form.touched.password && form.errors.password}
            required
          />

          <Input
            id="confirm_password"
            label="Confirm Password"
            type="password"
            value={form.values.confirm_password}
            onChange={(e) => form.handleChange('confirm_password', e.target.value)}
            onBlur={() => form.handleBlur('confirm_password')}
            error={form.touched.confirm_password && form.errors.confirm_password}
            required
          />
        </div>

        <div className="space-y-4 p-4 bg-gray-50 rounded-md">
          <h3 className="font-medium text-gray-900">Date Range Validation</h3>
          
          <Input
            id="start_date"
            label="Start Date"
            type="date"
            value={form.values.start_date}
            onChange={(e) => form.handleChange('start_date', e.target.value)}
            onBlur={() => form.handleBlur('start_date')}
            error={form.touched.start_date && form.errors.start_date}
            required
          />

          <Input
            id="end_date"
            label="End Date"
            type="date"
            value={form.values.end_date}
            onChange={(e) => form.handleChange('end_date', e.target.value)}
            onBlur={() => form.handleBlur('end_date')}
            error={form.touched.end_date && form.errors.end_date}
            required
          />
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="secondary" onClick={form.resetForm}>
            Reset
          </Button>
          <Button type="submit" loading={form.isSubmitting}>
            Submit
          </Button>
        </div>
      </form>
    </Card>
  );
};

/**
 * Schema Validation Example
 */
const SchemaValidationExample = () => {
  const form = useForm(
    {
      email: '',
    },
    loginSchema,
    async (values) => {
      console.log('Login submitted:', values);
      alert('Login form submitted!');
    }
  );

  return (
    <Card 
      title="Validation Schemas" 
      subtitle="Using predefined validation schemas"
    >
      <form onSubmit={form.handleSubmit} className="space-y-4">
        <p className="text-sm text-gray-600">
          This form uses the <code className="bg-gray-100 px-1 py-0.5 rounded">loginSchema</code> from validationSchemas.js
        </p>

        <Input
          id="email"
          label="Email"
          type="email"
          value={form.values.email}
          onChange={(e) => form.handleChange('email', e.target.value)}
          onBlur={() => form.handleBlur('email')}
          error={form.touched.email && form.errors.email}
          required
        />

        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <h4 className="font-medium text-blue-900 mb-2">Available Schemas:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• loginSchema</li>
            <li>• personalInfoSchema</li>
            <li>• bankingDetailsSchema</li>
            <li>• profileSchema</li>
            <li>• And many more...</li>
          </ul>
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="secondary" onClick={form.resetForm}>
            Reset
          </Button>
          <Button type="submit" loading={form.isSubmitting}>
            Submit
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default ValidationExample;
