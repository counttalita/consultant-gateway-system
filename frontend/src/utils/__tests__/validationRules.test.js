import { describe, it, expect } from 'vitest';
import {
  required,
  email,
  minLength,
  maxLength,
  pattern,
  minValue,
  maxValue,
  matches,
  saPhoneNumber,
  saIdNumber,
  saAccountNumber,
  saBranchCode,
} from '../validationRules';

describe('Validation Rules', () => {
  describe('required', () => {
    it('should return error for empty string', () => {
      const validator = required('Field is required');
      expect(validator('')).toBe('Field is required');
    });

    it('should return error for null', () => {
      const validator = required('Field is required');
      expect(validator(null)).toBe('Field is required');
    });

    it('should return error for undefined', () => {
      const validator = required('Field is required');
      expect(validator(undefined)).toBe('Field is required');
    });

    it('should return error for whitespace only', () => {
      const validator = required('Field is required');
      expect(validator('   ')).toBe('Field is required');
    });

    it('should pass for non-empty string', () => {
      const validator = required('Field is required');
      expect(validator('value')).toBeNull();
    });

    it('should pass for number 0', () => {
      const validator = required('Field is required');
      expect(validator(0)).toBeNull();
    });

    it('should use default message when not provided', () => {
      const validator = required();
      expect(validator('')).toBe('This field is required');
    });
  });

  describe('email', () => {
    it('should return error for invalid email', () => {
      const validator = email('Invalid email');
      expect(validator('invalid')).toBe('Invalid email');
    });

    it('should return error for email without @', () => {
      const validator = email('Invalid email');
      expect(validator('test.com')).toBe('Invalid email');
    });

    it('should return error for email without domain', () => {
      const validator = email('Invalid email');
      expect(validator('test@')).toBe('Invalid email');
    });

    it('should pass for valid email', () => {
      const validator = email('Invalid email');
      expect(validator('test@example.com')).toBeNull();
    });

    it('should pass for email with subdomain', () => {
      const validator = email('Invalid email');
      expect(validator('test@mail.example.com')).toBeNull();
    });

    it('should pass for email with plus sign', () => {
      const validator = email('Invalid email');
      expect(validator('test+tag@example.com')).toBeNull();
    });

    it('should skip validation for empty value', () => {
      const validator = email('Invalid email');
      expect(validator('')).toBeNull();
    });
  });

  describe('minLength', () => {
    it('should return error for string shorter than minimum', () => {
      const validator = minLength(5, 'Too short');
      expect(validator('abc')).toBe('Too short');
    });

    it('should pass for string equal to minimum', () => {
      const validator = minLength(5, 'Too short');
      expect(validator('abcde')).toBeNull();
    });

    it('should pass for string longer than minimum', () => {
      const validator = minLength(5, 'Too short');
      expect(validator('abcdef')).toBeNull();
    });

    it('should skip validation for empty value', () => {
      const validator = minLength(5, 'Too short');
      expect(validator('')).toBeNull();
    });

    it('should use default message when not provided', () => {
      const validator = minLength(5);
      expect(validator('abc')).toBe('Must be at least 5 characters');
    });
  });

  describe('maxLength', () => {
    it('should return error for string longer than maximum', () => {
      const validator = maxLength(5, 'Too long');
      expect(validator('abcdef')).toBe('Too long');
    });

    it('should pass for string equal to maximum', () => {
      const validator = maxLength(5, 'Too long');
      expect(validator('abcde')).toBeNull();
    });

    it('should pass for string shorter than maximum', () => {
      const validator = maxLength(5, 'Too long');
      expect(validator('abc')).toBeNull();
    });

    it('should skip validation for empty value', () => {
      const validator = maxLength(5, 'Too long');
      expect(validator('')).toBeNull();
    });
  });

  describe('pattern', () => {
    it('should return error for non-matching pattern', () => {
      const validator = pattern(/^\d+$/, 'Must be numbers only');
      expect(validator('abc')).toBe('Must be numbers only');
    });

    it('should pass for matching pattern', () => {
      const validator = pattern(/^\d+$/, 'Must be numbers only');
      expect(validator('123')).toBeNull();
    });

    it('should skip validation for empty value', () => {
      const validator = pattern(/^\d+$/, 'Must be numbers only');
      expect(validator('')).toBeNull();
    });
  });

  describe('minValue', () => {
    it('should return error for number less than minimum', () => {
      const validator = minValue(10, 'Too small');
      expect(validator(5)).toBe('Too small');
    });

    it('should pass for number equal to minimum', () => {
      const validator = minValue(10, 'Too small');
      expect(validator(10)).toBeNull();
    });

    it('should pass for number greater than minimum', () => {
      const validator = minValue(10, 'Too small');
      expect(validator(15)).toBeNull();
    });

    it('should skip validation for empty value', () => {
      const validator = minValue(10, 'Too small');
      expect(validator('')).toBeNull();
    });
  });

  describe('maxValue', () => {
    it('should return error for number greater than maximum', () => {
      const validator = maxValue(10, 'Too large');
      expect(validator(15)).toBe('Too large');
    });

    it('should pass for number equal to maximum', () => {
      const validator = maxValue(10, 'Too large');
      expect(validator(10)).toBeNull();
    });

    it('should pass for number less than maximum', () => {
      const validator = maxValue(10, 'Too large');
      expect(validator(5)).toBeNull();
    });

    it('should skip validation for empty value', () => {
      const validator = maxValue(10, 'Too large');
      expect(validator('')).toBeNull();
    });
  });

  describe('matches', () => {
    it('should return error when values do not match', () => {
      const validator = matches('password', 'Passwords must match');
      expect(validator('different', { password: 'original' })).toBe('Passwords must match');
    });

    it('should pass when values match', () => {
      const validator = matches('password', 'Passwords must match');
      expect(validator('same', { password: 'same' })).toBeNull();
    });

    it('should skip validation for empty value', () => {
      const validator = matches('password', 'Passwords must match');
      expect(validator('', { password: 'original' })).toBeNull();
    });
  });

  describe('saPhoneNumber', () => {
    it('should return error for invalid phone number', () => {
      const validator = saPhoneNumber('Invalid phone');
      expect(validator('abc')).toBe('Invalid phone');
    });

    it('should pass for valid phone number', () => {
      const validator = saPhoneNumber('Invalid phone');
      expect(validator('0821234567')).toBeNull();
    });

    it('should pass for phone with country code', () => {
      const validator = saPhoneNumber('Invalid phone');
      expect(validator('+27821234567')).toBeNull();
    });

    it('should skip validation for empty value', () => {
      const validator = saPhoneNumber('Invalid phone');
      expect(validator('')).toBeNull();
    });
  });

  describe('saIdNumber', () => {
    it('should return error for invalid SA ID number', () => {
      const validator = saIdNumber('Invalid ID');
      expect(validator('123')).toBe('Invalid ID');
    });

    it('should return error for non-13-digit number', () => {
      const validator = saIdNumber('Invalid ID');
      expect(validator('12345678901')).toBe('Invalid ID');
    });

    it('should pass for valid 13-digit SA ID', () => {
      const validator = saIdNumber('Invalid ID');
      expect(validator('8001015009087')).toBeNull();
    });

    it('should skip validation for empty value', () => {
      const validator = saIdNumber('Invalid ID');
      expect(validator('')).toBeNull();
    });
  });

  describe('saAccountNumber', () => {
    it('should return error for invalid account number', () => {
      const validator = saAccountNumber('Invalid account');
      expect(validator('123')).toBe('Invalid account');
    });

    it('should pass for 10-digit account number', () => {
      const validator = saAccountNumber('Invalid account');
      expect(validator('1234567890')).toBeNull();
    });

    it('should pass for 11-digit account number', () => {
      const validator = saAccountNumber('Invalid account');
      expect(validator('12345678901')).toBeNull();
    });

    it('should skip validation for empty value', () => {
      const validator = saAccountNumber('Invalid account');
      expect(validator('')).toBeNull();
    });
  });

  describe('saBranchCode', () => {
    it('should return error for invalid branch code', () => {
      const validator = saBranchCode('Invalid branch code');
      expect(validator('123')).toBe('Invalid branch code');
    });

    it('should pass for 6-digit branch code', () => {
      const validator = saBranchCode('Invalid branch code');
      expect(validator('123456')).toBeNull();
    });

    it('should skip validation for empty value', () => {
      const validator = saBranchCode('Invalid branch code');
      expect(validator('')).toBeNull();
    });
  });

  describe('Chaining Validators', () => {
    it('should work with multiple validators', () => {
      const validators = [required('Required'), minLength(5, 'Too short'), email('Invalid email')];
      
      // Test empty value
      expect(validators[0]('')).toBe('Required');
      
      // Test short value
      expect(validators[1]('abc')).toBe('Too short');
      
      // Test invalid email
      expect(validators[2]('notanemail')).toBe('Invalid email');
      
      // Test valid value
      const value = 'test@example.com';
      expect(validators[0](value)).toBeNull();
      expect(validators[1](value)).toBeNull();
      expect(validators[2](value)).toBeNull();
    });
  });
});
