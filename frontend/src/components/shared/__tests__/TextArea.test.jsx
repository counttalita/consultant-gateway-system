import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/utils/test-utils';
import TextArea from '../TextArea';

describe('TextArea Component', () => {
  describe('Rendering', () => {
    it('should render textarea element', () => {
      renderWithProviders(<TextArea onChange={vi.fn()} />);
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('should render with label', () => {
      renderWithProviders(<TextArea label="Description" onChange={vi.fn()} />);
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    });

    it('should show required indicator when required', () => {
      renderWithProviders(<TextArea label="Description" required onChange={vi.fn()} />);
      expect(screen.getByText('*')).toBeInTheDocument();
    });

    it('should render with placeholder', () => {
      renderWithProviders(<TextArea placeholder="Enter description..." onChange={vi.fn()} />);
      expect(screen.getByPlaceholderText(/enter description/i)).toBeInTheDocument();
    });

    it('should render with helper text', () => {
      renderWithProviders(<TextArea helperText="Maximum 500 characters" onChange={vi.fn()} />);
      expect(screen.getByText(/maximum 500 characters/i)).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should display error message', () => {
      renderWithProviders(<TextArea error="This field is required" onChange={vi.fn()} />);
      expect(screen.getByRole('alert')).toHaveTextContent('This field is required');
    });

    it('should have error styling when error is present', () => {
      renderWithProviders(<TextArea error="Error message" onChange={vi.fn()} />);
      const textarea = screen.getByRole('textbox');

      expect(textarea).toHaveClass('border-red-300');
      expect(textarea).toHaveAttribute('aria-invalid', 'true');
    });

    it('should not show helper text when error is present', () => {
      renderWithProviders(
        <TextArea error="Error message" helperText="Helper text" onChange={vi.fn()} />
      );

      expect(screen.getByText(/error message/i)).toBeInTheDocument();
      expect(screen.queryByText(/helper text/i)).not.toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should handle text input', async () => {
      const user = userEvent.setup();
      renderWithProviders(<TextArea defaultValue="" />);
      const textarea = screen.getByRole('textbox');

      await user.type(textarea, 'This is a test description');
      expect(textarea).toHaveValue('This is a test description');
    });

    it('should call onChange handler', async () => {
      const handleChange = vi.fn();
      const user = userEvent.setup();

      renderWithProviders(<TextArea onChange={handleChange} />);
      const textarea = screen.getByRole('textbox');

      await user.type(textarea, 'a');
      expect(handleChange).toHaveBeenCalled();
    });

    it('should call onBlur handler', async () => {
      const handleBlur = vi.fn();
      const user = userEvent.setup();

      renderWithProviders(<TextArea onBlur={handleBlur} />);
      const textarea = screen.getByRole('textbox');

      await user.click(textarea);
      await user.tab();

      expect(handleBlur).toHaveBeenCalled();
    });

    it('should handle multiline input', async () => {
      const user = userEvent.setup();
      renderWithProviders(<TextArea defaultValue="" />);
      const textarea = screen.getByRole('textbox');

      await user.type(textarea, 'Line 1{Enter}Line 2{Enter}Line 3');
      expect(textarea).toHaveValue('Line 1\nLine 2\nLine 3');
    });
  });

  describe('Disabled State', () => {
    it('should be disabled when disabled prop is true', () => {
      renderWithProviders(<TextArea disabled onChange={vi.fn()} />);
      const textarea = screen.getByRole('textbox');

      expect(textarea).toBeDisabled();
    });

    it('should not accept input when disabled', async () => {
      const user = userEvent.setup();
      renderWithProviders(<TextArea disabled value="" onChange={vi.fn()} />);
      const textarea = screen.getByRole('textbox');

      await user.type(textarea, 'test');
      expect(textarea).toHaveValue('');
    });
  });

  describe('Rows Configuration', () => {
    it('should apply rows attribute', () => {
      renderWithProviders(<TextArea rows={5} onChange={vi.fn()} />);
      const textarea = screen.getByRole('textbox');

      expect(textarea).toHaveAttribute('rows', '5');
    });

    it('should have default rows', () => {
      renderWithProviders(<TextArea onChange={vi.fn()} />);
      const textarea = screen.getByRole('textbox');

      expect(textarea).toHaveAttribute('rows');
    });
  });

  describe('Max Length', () => {
    it('should apply maxLength attribute', () => {
      renderWithProviders(<TextArea maxLength={100} onChange={vi.fn()} />);
      const textarea = screen.getByRole('textbox');

      expect(textarea).toHaveAttribute('maxLength', '100');
    });

    it('should enforce maxLength', async () => {
      const user = userEvent.setup();
      renderWithProviders(<TextArea maxLength={10} onChange={vi.fn()} />);
      const textarea = screen.getByRole('textbox');

      await user.type(textarea, 'This is a very long text that exceeds the limit');
      expect(textarea.value.length).toBeLessThanOrEqual(10);
    });
  });

  describe('Accessibility', () => {
    it('should have proper aria-required attribute', () => {
      renderWithProviders(<TextArea required onChange={vi.fn()} />);
      expect(screen.getByRole('textbox')).toHaveAttribute('aria-required', 'true');
    });

    it('should have proper aria-invalid attribute', () => {
      const { rerender } = renderWithProviders(<TextArea onChange={vi.fn()} />);
      expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'false');

      rerender(<TextArea error="Error" onChange={vi.fn()} />);
      expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
    });

    it('should link label with textarea', () => {
      renderWithProviders(<TextArea label="Bio" onChange={vi.fn()} />);
      const textarea = screen.getByRole('textbox');
      const label = screen.getByText(/bio/i);

      expect(textarea).toHaveAttribute('id');
      expect(label).toHaveAttribute('for', textarea.getAttribute('id'));
    });

    it('should link error message with textarea via aria-describedby', () => {
      renderWithProviders(<TextArea error="Error message" onChange={vi.fn()} />);
      const textarea = screen.getByRole('textbox');
      const errorId = textarea.getAttribute('aria-describedby');

      expect(errorId).toBeTruthy();
      expect(screen.getByRole('alert')).toHaveAttribute('id', errorId);
    });
  });

  describe('Value Control', () => {
    it('should work as controlled component', async () => {
      const TestComponent = () => {
        const [value, setValue] = React.useState('');
        return (
          <TextArea
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        );
      };

      const user = userEvent.setup();
      renderWithProviders(<TestComponent />);
      const textarea = screen.getByRole('textbox');

      await user.type(textarea, 'test');
      expect(textarea).toHaveValue('test');
    });

    it('should work as uncontrolled component', async () => {
      const user = userEvent.setup();
      const { container } = renderWithProviders(<TextArea defaultValue="initial" />);
      const textarea = screen.getByRole('textbox');

      expect(textarea).toHaveValue('initial');

      await user.clear(textarea);
      await user.type(textarea, 'new value');
      expect(textarea).toHaveValue('new value');
    });
  });
});
