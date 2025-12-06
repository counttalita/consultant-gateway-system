/**
 * Validation Schemas
 * 
 * Centralized validation schemas for all forms in the application.
 * Each schema defines the validation rules for a specific form.
 */

import {
  required,
  email,
  minLength,
  maxLength,
  saIdNumber,
  saPhoneNumber,
  saAccountNumber,
  saBranchCode,
  saTaxNumber,
  saVatNumber,
  pattern,
  compose,
  requiredIf,
  matches,
} from './validationRules';

// ============================================================================
// Authentication Schemas
// ============================================================================

/**
 * Login form validation schema
 */
export const loginSchema = {
  email: compose(
    required('Email is required'),
    email('Invalid email address')
  ),
};

/**
 * OTP verification schema
 */
export const otpSchema = {
  otp: compose(
    required('OTP is required'),
    pattern(/^\d{6}$/, 'OTP must be 6 digits')
  ),
};

// ============================================================================
// Profile Schemas
// ============================================================================

/**
 * Personal information schema
 */
export const personalInfoSchema = {
  full_name: required('Full name is required'),
  id_number: compose(
    required('ID number is required'),
    saIdNumber()
  ),
  phone_number: compose(
    required('Phone number is required'),
    saPhoneNumber()
  ),
  city: required('City is required'),
  country: required('Country is required'),
};

/**
 * Profile update schema
 */
export const profileSchema = {
  full_name: required('Full name is required'),
  phone: compose(
    required('Phone number is required'),
    saPhoneNumber()
  ),
  bio: maxLength(1000, 'Bio must be less than 1000 characters'),
  skills: required('Please enter at least one skill'),
  linkedin_url: (value) => {
    if (!value) return null;
    const linkedinRegex = /^https?:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9-]+\/?$/;
    if (!linkedinRegex.test(value)) {
      return 'Please enter a valid LinkedIn profile URL';
    }
    return null;
  },
};

/**
 * Skills update schema
 */
export const skillsSchema = {
  skills: compose(
    required('At least one skill is required'),
    (value) => {
      if (!value) return null;
      const skillsArray = Array.isArray(value) ? value : value.split(',').map(s => s.trim());
      if (skillsArray.length === 0) {
        return 'At least one skill is required';
      }
      return null;
    }
  ),
  experience_years: compose(
    required('Years of experience is required'),
    (value) => {
      const num = parseFloat(value);
      if (isNaN(num) || num < 0) {
        return 'Must be a positive number';
      }
      if (num > 50) {
        return 'Must be less than 50 years';
      }
      return null;
    }
  ),
};

// ============================================================================
// Banking Schemas
// ============================================================================

/**
 * Banking details schema
 */
export const bankingDetailsSchema = {
  bank_name: required('Bank name is required'),
  account_holder_name: required('Account holder name is required'),
  account_number: compose(
    required('Account number is required'),
    saAccountNumber()
  ),
  account_type: required('Account type is required'),
  branch_code: compose(
    required('Branch code is required'),
    saBranchCode()
  ),
  tax_number: saTaxNumber(),
  vat_number: saVatNumber(),
};

// ============================================================================
// Onboarding Schemas
// ============================================================================

/**
 * Onboarding personal info step schema
 */
export const onboardingPersonalInfoSchema = {
  full_name: required('Full name is required'),
  id_number: compose(
    required('ID number is required'),
    saIdNumber()
  ),
  phone_number: compose(
    required('Phone number is required'),
    saPhoneNumber()
  ),
  city: required('City is required'),
  country: required('Country is required'),
};

/**
 * Onboarding banking step schema
 */
export const onboardingBankingSchema = {
  bank_name: required('Bank name is required'),
  account_holder_name: required('Account holder name is required'),
  account_number: compose(
    required('Account number is required'),
    saAccountNumber()
  ),
  account_type: required('Account type is required'),
  branch_code: compose(
    required('Branch code is required'),
    saBranchCode()
  ),
  tax_number: saTaxNumber(),
  vat_number: saVatNumber(),
};

/**
 * Onboarding skills step schema
 */
export const onboardingSkillsSchema = {
  skills: required('At least one skill is required'),
  experience_years: compose(
    required('Years of experience is required'),
    (value) => {
      const num = parseFloat(value);
      if (isNaN(num) || num < 0) {
        return 'Must be a positive number';
      }
      return null;
    }
  ),
};

// ============================================================================
// Admin Schemas
// ============================================================================

/**
 * User creation schema
 */
export const userCreationSchema = {
  email: compose(
    required('Email is required'),
    email('Invalid email address')
  ),
  role: required('Role is required'),
  full_name: required('Full name is required'),
};

/**
 * User update schema
 */
export const userUpdateSchema = {
  full_name: required('Full name is required'),
  roles: (value) => {
    if (!value || (Array.isArray(value) && value.length === 0)) {
      return 'At least one role is required';
    }
    return null;
  },
};

/**
 * Project creation schema
 */
export const projectSchema = {
  name: required('Project name is required'),
  client_name: required('Client name is required'),
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
  budget: (value) => {
    if (!value) return null;
    const num = parseFloat(value);
    if (isNaN(num) || num < 0) {
      return 'Budget must be a positive number';
    }
    return null;
  },
};

/**
 * Tender creation schema
 */
export const tenderSchema = {
  title: required('Title is required'),
  description: required('Description is required'),
  deadline: compose(
    required('Deadline is required'),
    (value) => {
      if (!value) return null;
      const deadline = new Date(value);
      const now = new Date();
      if (deadline <= now) {
        return 'Deadline must be in the future';
      }
      return null;
    }
  ),
  budget: (value) => {
    if (!value) return null;
    const num = parseFloat(value);
    if (isNaN(num) || num < 0) {
      return 'Budget must be a positive number';
    }
    return null;
  },
};

// ============================================================================
// Finance Schemas
// ============================================================================

/**
 * Month-end processing schema
 */
export const monthEndSchema = {
  month: compose(
    required('Month is required'),
    (value) => {
      const month = parseInt(value, 10);
      if (isNaN(month) || month < 1 || month > 12) {
        return 'Invalid month (must be 1-12)';
      }
      return null;
    }
  ),
  year: compose(
    required('Year is required'),
    (value) => {
      const year = parseInt(value, 10);
      if (isNaN(year) || year < 2020 || year > 2100) {
        return 'Invalid year';
      }
      return null;
    }
  ),
};

/**
 * SimplePay export schema
 */
export const simplePayExportSchema = {
  period: compose(
    required('Period is required'),
    pattern(/^\d{4}-\d{2}$/, 'Period must be in YYYY-MM format')
  ),
};

/**
 * Invoice creation schema
 */
export const invoiceSchema = {
  consultant_id: required('Consultant is required'),
  project_id: required('Project is required'),
  amount: compose(
    required('Amount is required'),
    (value) => {
      const num = parseFloat(value);
      if (isNaN(num) || num <= 0) {
        return 'Amount must be greater than 0';
      }
      return null;
    }
  ),
  hours: compose(
    required('Hours is required'),
    (value) => {
      const num = parseFloat(value);
      if (isNaN(num) || num <= 0) {
        return 'Hours must be greater than 0';
      }
      if (num > 744) { // Max hours in a month (31 days * 24 hours)
        return 'Hours cannot exceed 744 (max hours in a month)';
      }
      return null;
    }
  ),
  description: maxLength(500, 'Description must be less than 500 characters'),
};

// ============================================================================
// Availability Schema
// ============================================================================

/**
 * Availability update schema
 */
export const availabilitySchema = {
  status: compose(
    required('Status is required'),
    (value) => {
      const validStatuses = ['available', 'partially_available', 'unavailable'];
      if (!validStatuses.includes(value)) {
        return 'Invalid status';
      }
      return null;
    }
  ),
  available_hours: (value, allValues) => {
    if (allValues.status === 'unavailable') return null;
    if (!value && value !== 0) {
      return 'Available hours is required';
    }
    const num = parseFloat(value);
    if (isNaN(num) || num < 0) {
      return 'Must be a positive number';
    }
    if (num > 160) { // Reasonable max hours per month
      return 'Cannot exceed 160 hours per month';
    }
    return null;
  },
};

// ============================================================================
// Export all schemas
// ============================================================================

export default {
  // Auth
  loginSchema,
  otpSchema,
  
  // Profile
  personalInfoSchema,
  profileSchema,
  skillsSchema,
  
  // Banking
  bankingDetailsSchema,
  
  // Onboarding
  onboardingPersonalInfoSchema,
  onboardingBankingSchema,
  onboardingSkillsSchema,
  
  // Admin
  userCreationSchema,
  userUpdateSchema,
  projectSchema,
  tenderSchema,
  
  // Finance
  monthEndSchema,
  simplePayExportSchema,
  invoiceSchema,
  
  // Availability
  availabilitySchema,
};
