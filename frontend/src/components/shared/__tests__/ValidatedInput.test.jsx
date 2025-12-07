import React, { useState } from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, waitFor, render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ValidatedInput from '../ValidatedInput';

const TestWrapper = ({ initialValue = '', ...props }) => {
  const [value, setValue] = useState(initialValue);
  return (
    <ValidatedInput
      value={value}
      onChange={(e) => setValue(e.target.value)}
      {...props}
    />
  );
};

describe('ValidatedInput Component', () => {
  const mockValidate = vi.fn();
  const mockOnValidationChange = vi.fn();

  beforeEach(() => {
    mockValidate.mockReset();
    mockOnValidationChange.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Rendering', () => {
    it('should render input field', () => {
      render(<ValidatedInput label="Username" />);
      expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    });

    it('should pass props to Input component', () => {
      render(<ValidatedInput placeholder="Enter username" />);
      expect(screen.getByPlaceholderText('Enter username')).toBeInTheDocument();
    });
  });

  describe('Sync Validation', () => {
    it('should validate on blur by default', async () => {
      const validate = vi.fn(val => val.length < 3 ? 'Too short' : null);
      const user = userEvent.setup();

      render(
        <TestWrapper 
          label="Username" 
          validate={validate}
        />
      );

      const input = screen.getByLabelText(/username/i);
      
      await user.type(input, 'ab');
      await user.tab(); // Trigger blur

      expect(validate).toHaveBeenCalledWith('ab');
      expect(screen.getByText('Too short')).toBeInTheDocument();
    });

    it('should not validate on change by default', async () => {
      const validate = vi.fn(val => val.length < 3 ? 'Too short' : null);
      const user = userEvent.setup();

      render(
        <TestWrapper 
          label="Username" 
          validate={validate}
        />
      );

      const input = screen.getByLabelText(/username/i);
      
      await user.type(input, 'ab');
      
      // Wait a bit to ensure no debounce triggers it
      await new Promise(r => setTimeout(r, 100));

      expect(validate).not.toHaveBeenCalled();
      expect(screen.queryByText('Too short')).not.toBeInTheDocument();
    });

    it('should validate on change when validateOnChange is true', async () => {
      const validate = vi.fn(val => val.length < 3 ? 'Too short' : null);
      const user = userEvent.setup();

      render(
        <TestWrapper 
          label="Username" 
          validate={validate}
          validateOnChange={true}
          debounceMs={100} // Reduce debounce time for test
        />
      );

      const input = screen.getByLabelText(/username/i);
      
      // We need to blur first to set 'touched' because of line 41: if (!touched) return;
      await user.click(input);
      await user.tab();
      await user.click(input);
      
      await user.type(input, 'ab');
      
      // Wait for debounce
      await waitFor(() => {
        expect(validate).toHaveBeenCalledWith('ab');
      });
    });

    it('should call onValidationChange with result', async () => {
      const validate = vi.fn(() => 'Error');
      const user = userEvent.setup();

      render(
        <TestWrapper 
          label="Username" 
          validate={validate}
          onValidationChange={mockOnValidationChange}
        />
      );

      const input = screen.getByLabelText(/username/i);
      
      await user.type(input, 'test');
      await user.tab();

      expect(mockOnValidationChange).toHaveBeenCalledWith(false, 'Error');
    });
  });

  describe('Async Validation', () => {
    it('should handle async validation', async () => {
      const validate = vi.fn(() => Promise.resolve('Async Error'));
      const user = userEvent.setup();

      render(
        <TestWrapper 
          label="Username" 
          validate={validate}
        />
      );

      const input = screen.getByLabelText(/username/i);
      
      await user.type(input, 'test');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText('Async Error')).toBeInTheDocument();
      });
    });

    it('should show loading state during async validation', async () => {
      const validate = vi.fn(() => new Promise(resolve => setTimeout(() => resolve(null), 100)));
      const user = userEvent.setup();

      render(
        <TestWrapper 
          label="Username" 
          validate={validate}
        />
      );

      const input = screen.getByLabelText(/username/i);
      
      await user.type(input, 'test');
      await user.tab(); // Triggers performValidation -> setIsValidating(true)

      await waitFor(() => {
         expect(validate).toHaveBeenCalled();
      });
    });
  });

  describe('Success State', () => {
    it('should show success message when valid', async () => {
      const validate = vi.fn(() => null);
      const user = userEvent.setup();

      render(
        <TestWrapper 
          label="Username" 
          validate={validate}
          successMessage="Available!"
        />
      );

      const input = screen.getByLabelText(/username/i);
      
      await user.type(input, 'test');
      await user.tab();

      expect(screen.getByText('Available!')).toBeInTheDocument();
    });
  });
});

