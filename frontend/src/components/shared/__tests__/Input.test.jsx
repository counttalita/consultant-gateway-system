import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/utils/test-utils';
import Input from '../Input';

describe('Input Component', () => {
  describe('Rendering', () => {
    it('should render input field', () => {
      renderWithProviders(<Input />);
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('should render with label', () => {
      renderWithProviders(<Input label="Email" />);
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    });

    it('should show required indicator when required', () => {
      renderWithProviders(<Input label="Email" required />);
      expect(screen.getByText('*')).toBeInTheDocument();
    });

    it('should render with helper text', () => {
      renderWithProviders(<Input helperText="Enter your email address" />);
      expect(screen.getByText(/enter your email address/i)).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should display error message', () => {
      renderWithProviders(<Input error="This field is required" />);
      expect(screen.getByRole('alert')).toHaveTextContent('This field is required');
    });

    it('should have error styling when error is present', () => {
      renderWithProviders(<Input error="Error message" />);
      const input = screen.getByRole('textbox');
      
      expect(input).toHaveClass('border-red-300');
      expect(input).toHaveAttribute('aria-invalid', 'true');
    });

    it('should not show helper text when error is present', () => {
      renderWithProviders(
        <Input error="Error message" helperText="Helper text" />
      );
      
      expect(screen.getByText(/error message/i)).toBeInTheDocument();
      expect(screen.queryByText(/helper text/i)).not.toBeInTheDocument();
    });

    it('should link error message with input via aria-describedby', () => {
      renderWithProviders(<Input error="Error message" />);
      const input = screen.getByRole('textbox');
      const errorId = input.getAttribute('aria-describedby');
      
      expect(errorId).toBeTruthy();
      expect(screen.getByRole('alert')).toHaveAttribute('id', errorId);
    });
  });

  describe('User Interactions', () => {
    it('should handle text input', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Input />);
      const input = screen.getByRole('textbox');
      
      await user.type(input, 'test@example.com');
      expect(input).toHaveValue('test@example.com');
    });

    it('should call onChange handler', async () => {
      const handleChange = vi.fn();
      const user = userEvent.setup();
      
      renderWithProviders(<Input onChange={handleChange} />);
      const input = screen.getByRole('textbox');
      
      await user.type(input, 'a');
      expect(handleChange).toHaveBeenCalled();
    });

    it('should call onBlur handler', async () => {
      const handleBlur = vi.fn();
      const user = userEvent.setup();
      
      renderWithProviders(<Input onBlur={handleBlur} />);
      const input = screen.getByRole('textbox');
      
      await user.click(input);
      await user.tab();
      
      expect(handleBlur).toHaveBeenCalled();
    });

    it('should call onFocus handler', async () => {
      const handleFocus = vi.fn();
      const user = userEvent.setup();
      
      renderWithProviders(<Input onFocus={handleFocus} />);
      const input = screen.getByRole('textbox');
      
      await user.click(input);
      expect(handleFocus).toHaveBeenCalled();
    });
  });

  describe('Disabled State', () => {
    it('should be disabled when disabled prop is true', () => {
      renderWithProviders(<Input disabled />);
      const input = screen.getByRole('textbox');
      
      expect(input).toBeDisabled();
      expect(input).toHaveClass('disabled:bg-gray-100');
    });

    it('should not accept input when disabled', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Input disabled value="" />);
      const input = screen.getByRole('textbox');
      
      await user.type(input, 'test');
      expect(input).toHaveValue('');
    });
  });

  describe('Input Types', () => {
    it('should support different input types', () => {
      const { rerender } = renderWithProviders(<Input type="email" />);
      expect(screen.getByRole('textbox')).toHaveAttribute('type', 'email');

      rerender(<Input type="password" />);
      const passwordInput = document.querySelector('input[type="password"]');
      expect(passwordInput).toBeInTheDocument();

      rerender(<Input type="number" />);
      expect(screen.getByRole('spinbutton')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper aria-required attribute', () => {
      renderWithProviders(<Input required />);
      expect(screen.getByRole('textbox')).toHaveAttribute('aria-required', 'true');
    });

    it('should have proper aria-invalid attribute', () => {
      const { rerender } = renderWithProviders(<Input />);
      expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'false');

      rerender(<Input error="Error" />);
      expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
    });

    it('should link label with input', () => {
      renderWithProviders(<Input label="Email" />);
      const input = screen.getByRole('textbox');
      const label = screen.getByText(/email/i);
      
      expect(input).toHaveAttribute('id');
      expect(label).toHaveAttribute('for', input.getAttribute('id'));
    });

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup();
      renderWithProviders(
        <div>
          <Input label="First" />
          <Input label="Second" />
        </div>
      );
      
      const firstInput = screen.getByLabelText(/first/i);
      const secondInput = screen.getByLabelText(/second/i);
      
      firstInput.focus();
      expect(firstInput).toHaveFocus();
      
      await user.tab();
      expect(secondInput).toHaveFocus();
    });
  });

  describe('Custom Styling', () => {
    it('should accept custom className', () => {
      renderWithProviders(<Input className="custom-input" />);
      expect(screen.getByRole('textbox')).toHaveClass('custom-input');
    });

    it('should accept custom containerClassName', () => {
      renderWithProviders(<Input containerClassName="custom-container" />);
      const container = screen.getByRole('textbox').parentElement;
      expect(container).toHaveClass('custom-container');
    });
  });

  describe('Value Control', () => {
    it('should work as controlled component', async () => {
      const TestComponent = () => {
        const [value, setValue] = React.useState('');
        return (
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        );
      };

      const user = userEvent.setup();
      renderWithProviders(<TestComponent />);
      const input = screen.getByRole('textbox');
      
      await user.type(input, 'test');
      expect(input).toHaveValue('test');
    });

    it('should work as uncontrolled component', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Input defaultValue="initial" />);
      const input = screen.getByRole('textbox');
      
      expect(input).toHaveValue('initial');
      
      await user.clear(input);
      await user.type(input, 'new value');
      expect(input).toHaveValue('new value');
    });
  });
});
