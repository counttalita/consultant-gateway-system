import { describe, it, expect, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useForm } from '../useForm';
import { required, email, minLength } from '@/utils/validationRules';

describe('useForm Hook', () => {
  describe('Initialization', () => {
    it('should initialize with default values', () => {
      const { result } = renderHook(() =>
        useForm({ email: '', password: '' }, {})
      );

      expect(result.current.values).toEqual({ email: '', password: '' });
      expect(result.current.errors).toEqual({});
      expect(result.current.touched).toEqual({});
      expect(result.current.isSubmitting).toBe(false);
    });

    it('should initialize with validation rules', () => {
      const validationRules = {
        email: [required('Email required'), email()],
        password: [required('Password required')],
      };

      const { result } = renderHook(() =>
        useForm({ email: '', password: '' }, validationRules)
      );

      expect(result.current.values).toEqual({ email: '', password: '' });
    });
  });

  describe('Field Changes', () => {
    it('should update field value on change', () => {
      const { result } = renderHook(() =>
        useForm({ email: '' }, {})
      );

      act(() => {
        result.current.handleChange('email', 'test@example.com');
      });

      expect(result.current.values.email).toBe('test@example.com');
    });

    it('should mark field as touched on blur', () => {
      const { result } = renderHook(() =>
        useForm({ email: '' }, {})
      );

      act(() => {
        result.current.handleBlur('email');
      });

      expect(result.current.touched.email).toBe(true);
    });

    it('should validate on blur when validateOnBlur is true', async () => {
      const { result } = renderHook(() =>
        useForm(
          { email: '' },
          { email: [required('Email required')] },
          null,
          { validateOnBlur: true }
        )
      );

      act(() => {
        result.current.handleBlur('email');
      });

      await waitFor(() => {
        expect(result.current.errors.email).toBe('Email required');
      });
    });

    it('should not validate on blur when validateOnBlur is false', async () => {
      const { result } = renderHook(() =>
        useForm(
          { email: '' },
          { email: [required('Email required')] },
          null,
          { validateOnBlur: false }
        )
      );

      act(() => {
        result.current.handleBlur('email');
      });

      await waitFor(() => {
        expect(result.current.errors.email).toBeUndefined();
      });
    });
  });

  describe('Validation', () => {
    it('should validate required fields', async () => {
      const { result } = renderHook(() =>
        useForm(
          { email: '' },
          { email: [required('Email is required')] }
        )
      );

      await act(async () => {
        const errors = await result.current.validateForm();
        expect(errors.email).toBe('Email is required');
      });
    });

    it('should validate email format', async () => {
      const { result } = renderHook(() =>
        useForm(
          { email: 'invalid-email' },
          { email: [email('Invalid email')] }
        )
      );

      await act(async () => {
        const errors = await result.current.validateForm();
        expect(errors.email).toBe('Invalid email');
      });
    });

    it('should validate minimum length', async () => {
      const { result } = renderHook(() =>
        useForm(
          { password: '123' },
          { password: [minLength(8, 'Too short')] }
        )
      );

      await act(async () => {
        const errors = await result.current.validateForm();
        expect(errors.password).toBe('Too short');
      });
    });

    it('should pass validation when all rules pass', async () => {
      const { result } = renderHook(() =>
        useForm(
          { email: 'test@example.com', password: 'password123' },
          {
            email: [required(), email()],
            password: [required(), minLength(8)],
          }
        )
      );

      await act(async () => {
        const errors = await result.current.validateForm();
        expect(Object.keys(errors)).toHaveLength(0);
      });
    });

    it('should validate single field', async () => {
      const { result } = renderHook(() =>
        useForm(
          { email: '' },
          { email: [required('Email required')] }
        )
      );

      await act(async () => {
        const error = await result.current.validateField('email', '');
        expect(error).toBe('Email required');
      });
    });

    it('should clear error when field becomes valid', async () => {
      const { result } = renderHook(() =>
        useForm(
          { email: '' },
          { email: [required('Email required')] }
        )
      );

      // First, trigger validation to set error
      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(result.current.errors.email).toBe('Email required');

      // Then update with valid value
      act(() => {
        result.current.handleChange('email', 'test@example.com');
      });

      await waitFor(() => {
        expect(result.current.errors.email).toBeFalsy();
      });
    });
  });

  describe('Form Submission', () => {
    it('should call onSubmit when form is valid', async () => {
      const onSubmit = vi.fn();
      const { result } = renderHook(() =>
        useForm(
          { email: 'test@example.com' },
          { email: [required(), email()] },
          onSubmit
        )
      );

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(onSubmit).toHaveBeenCalledWith({ email: 'test@example.com' });
    });

    it('should not call onSubmit when form is invalid', async () => {
      const onSubmit = vi.fn();
      const { result } = renderHook(() =>
        useForm(
          { email: '' },
          { email: [required('Email required')] },
          onSubmit
        )
      );

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('should set isSubmitting during submission', async () => {
      const onSubmit = vi.fn(() => new Promise(resolve => setTimeout(resolve, 100)));
      const { result } = renderHook(() =>
        useForm(
          { email: 'test@example.com' },
          { email: [required()] },
          onSubmit
        )
      );

      let submitPromise;
      await act(async () => {
        submitPromise = result.current.handleSubmit();
      });

      expect(result.current.isSubmitting).toBe(true);

      await act(async () => {
        await submitPromise;
      });

      expect(result.current.isSubmitting).toBe(false);
    });

    it('should mark all fields as touched on submit', async () => {
      const { result } = renderHook(() =>
        useForm(
          { email: '', password: '' },
          {
            email: [required()],
            password: [required()],
          }
        )
      );

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(result.current.touched.email).toBe(true);
      expect(result.current.touched.password).toBe(true);
    });

    it('should increment submit count on each submission', async () => {
      const { result } = renderHook(() =>
        useForm({ email: '' }, { email: [required()] })
      );

      expect(result.current.submitCount).toBe(0);

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(result.current.submitCount).toBe(1);

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(result.current.submitCount).toBe(2);
    });
  });

  describe('Form Reset', () => {
    it('should reset form to initial values', () => {
      const initialValues = { email: '', password: '' };
      const { result } = renderHook(() =>
        useForm(initialValues, {})
      );

      act(() => {
        result.current.handleChange('email', 'test@example.com');
        result.current.handleChange('password', 'password123');
      });

      expect(result.current.values).toEqual({
        email: 'test@example.com',
        password: 'password123',
      });

      act(() => {
        result.current.resetForm();
      });

      expect(result.current.values).toEqual(initialValues);
      expect(result.current.errors).toEqual({});
      expect(result.current.touched).toEqual({});
    });
  });

  describe('Field Setters', () => {
    it('should set field value', () => {
      const { result } = renderHook(() =>
        useForm({ email: '' }, {})
      );

      act(() => {
        result.current.setFieldValue('email', 'new@example.com');
      });

      expect(result.current.values.email).toBe('new@example.com');
    });

    it('should set field error', () => {
      const { result } = renderHook(() =>
        useForm({ email: '' }, {})
      );

      act(() => {
        result.current.setFieldError('email', 'Custom error');
      });

      expect(result.current.errors.email).toBe('Custom error');
    });

    it('should set multiple field errors', () => {
      const { result } = renderHook(() =>
        useForm({ email: '', password: '' }, {})
      );

      act(() => {
        result.current.setFieldErrors({
          email: 'Email error',
          password: 'Password error',
        });
      });

      expect(result.current.errors.email).toBe('Email error');
      expect(result.current.errors.password).toBe('Password error');
    });

    it('should set field touched', () => {
      const { result } = renderHook(() =>
        useForm({ email: '' }, {})
      );

      act(() => {
        result.current.setFieldTouched('email', true);
      });

      expect(result.current.touched.email).toBe(true);
    });
  });

  describe('Form State', () => {
    it('should track isValid state', async () => {
      const { result } = renderHook(() =>
        useForm(
          { email: '' },
          { email: [required('Email required')] }
        )
      );

      expect(result.current.isValid).toBe(true); // No errors initially

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(result.current.isValid).toBe(false);

      act(() => {
        result.current.handleChange('email', 'test@example.com');
      });

      await waitFor(() => {
        expect(result.current.isValid).toBe(true);
      });
    });

    it('should track isDirty state', () => {
      const { result } = renderHook(() =>
        useForm({ email: '' }, {})
      );

      expect(result.current.isDirty).toBe(false);

      act(() => {
        result.current.handleChange('email', 'test@example.com');
      });

      expect(result.current.isDirty).toBe(true);
    });

    it('should provide shouldShowError helper', async () => {
      const { result } = renderHook(() =>
        useForm(
          { email: '' },
          { email: [required('Email required')] }
        )
      );

      expect(result.current.shouldShowError('email')).toBeFalsy();

      act(() => {
        result.current.handleBlur('email');
      });

      await waitFor(() => {
        expect(result.current.shouldShowError('email')).toBeTruthy();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle API validation errors', async () => {
      const onSubmit = vi.fn().mockRejectedValue({
        response: {
          data: {
            errors: {
              email: 'Email already exists',
            },
          },
        },
      });

      const { result } = renderHook(() =>
        useForm(
          { email: 'test@example.com' },
          { email: [required()] },
          onSubmit
        )
      );

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(result.current.errors.email).toBe('Email already exists');
    });

    it('should handle submission errors gracefully', async () => {
      const onSubmit = vi.fn().mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() =>
        useForm(
          { email: 'test@example.com' },
          { email: [required()] },
          onSubmit
        )
      );

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(result.current.isSubmitting).toBe(false);
    });
  });
});
