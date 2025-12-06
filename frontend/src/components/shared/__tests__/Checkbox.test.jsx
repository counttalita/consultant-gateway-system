import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/utils/test-utils';
import Checkbox from '../Checkbox';

describe('Checkbox Component', () => {
  describe('Rendering', () => {
    it('should render checkbox', () => {
      renderWithProviders(<Checkbox label="Accept terms" />);
      expect(screen.getByRole('checkbox')).toBeInTheDocument();
    });

    it('should render with label', () => {
      renderWithProviders(<Checkbox label="Accept terms" />);
      expect(screen.getByLabelText(/accept terms/i)).toBeInTheDocument();
    });

    it('should render without label', () => {
      renderWithProviders(<Checkbox />);
      expect(screen.getByRole('checkbox')).toBeInTheDocument();
    });
  });

  describe('Checked State', () => {
    it('should be unchecked by default', () => {
      renderWithProviders(<Checkbox label="Test" />);
      expect(screen.getByRole('checkbox')).not.toBeChecked();
    });

    it('should be checked when checked prop is true', () => {
      renderWithProviders(<Checkbox label="Test" checked onChange={vi.fn()} />);
      expect(screen.getByRole('checkbox')).toBeChecked();
    });

    it('should toggle checked state on click', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Checkbox label="Test" />);
      const checkbox = screen.getByRole('checkbox');

      expect(checkbox).not.toBeChecked();

      await user.click(checkbox);
      expect(checkbox).toBeChecked();

      await user.click(checkbox);
      expect(checkbox).not.toBeChecked();
    });
  });

  describe('User Interactions', () => {
    it('should call onChange handler when clicked', async () => {
      const handleChange = vi.fn();
      const user = userEvent.setup();

      renderWithProviders(<Checkbox label="Test" onChange={handleChange} />);
      const checkbox = screen.getByRole('checkbox');

      await user.click(checkbox);
      expect(handleChange).toHaveBeenCalledTimes(1);
    });

    it('should pass checked state to onChange', async () => {
      const handleChange = vi.fn();
      const user = userEvent.setup();

      renderWithProviders(<Checkbox label="Test" onChange={handleChange} />);
      const checkbox = screen.getByRole('checkbox');

      await user.click(checkbox);
      expect(handleChange).toHaveBeenCalledWith(expect.objectContaining({
        target: expect.objectContaining({ checked: true })
      }));
    });

    it('should be keyboard accessible', async () => {
      const handleChange = vi.fn();
      const user = userEvent.setup();

      renderWithProviders(<Checkbox label="Test" onChange={handleChange} />);
      const checkbox = screen.getByRole('checkbox');

      checkbox.focus();
      await user.keyboard(' ');

      expect(handleChange).toHaveBeenCalled();
    });
  });

  describe('Disabled State', () => {
    it('should be disabled when disabled prop is true', () => {
      renderWithProviders(<Checkbox label="Test" disabled />);
      const checkbox = screen.getByRole('checkbox');

      expect(checkbox).toBeDisabled();
    });

    it('should not call onChange when disabled', async () => {
      const handleChange = vi.fn();
      const user = userEvent.setup();

      renderWithProviders(<Checkbox label="Test" disabled onChange={handleChange} />);
      const checkbox = screen.getByRole('checkbox');

      await user.click(checkbox);
      expect(handleChange).not.toHaveBeenCalled();
    });

    it('should have disabled styling', () => {
      renderWithProviders(<Checkbox label="Test" disabled />);
      const checkbox = screen.getByRole('checkbox');

      expect(checkbox).toHaveClass('disabled:opacity-50');
    });
  });

  describe('Error Handling', () => {
    it('should display error message', () => {
      renderWithProviders(<Checkbox label="Test" error="This field is required" />);
      expect(screen.getByRole('alert')).toHaveTextContent('This field is required');
    });

    it('should have error styling when error is present', () => {
      renderWithProviders(<Checkbox label="Test" error="Error message" />);
      const checkbox = screen.getByRole('checkbox');

      expect(checkbox).toHaveClass('border-red-300');
      expect(checkbox).toHaveAttribute('aria-invalid', 'true');
    });
  });

  describe('Accessibility', () => {
    it('should link label with checkbox', () => {
      renderWithProviders(<Checkbox label="Accept" />);
      const checkbox = screen.getByRole('checkbox');
      const label = screen.getByText(/accept/i);

      expect(checkbox).toHaveAttribute('id');
      expect(label).toHaveAttribute('for', checkbox.getAttribute('id'));
    });

    it('should have proper aria-invalid attribute', () => {
      const { rerender } = renderWithProviders(<Checkbox label="Test" />);
      expect(screen.getByRole('checkbox')).toHaveAttribute('aria-invalid', 'false');

      rerender(<Checkbox label="Test" error="Error" />);
      expect(screen.getByRole('checkbox')).toHaveAttribute('aria-invalid', 'true');
    });

    it('should be focusable', () => {
      renderWithProviders(<Checkbox label="Test" />);
      const checkbox = screen.getByRole('checkbox');

      checkbox.focus();
      expect(checkbox).toHaveFocus();
    });
  });

  describe('Custom Styling', () => {
    it('should accept custom className', () => {
      renderWithProviders(<Checkbox label="Test" className="custom-checkbox" />);
      expect(screen.getByRole('checkbox')).toHaveClass('custom-checkbox');
    });
  });
});
