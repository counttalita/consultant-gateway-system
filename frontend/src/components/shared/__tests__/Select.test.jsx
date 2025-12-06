import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/utils/test-utils';
import Select from '../Select';

describe('Select Component', () => {
  const options = [
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' },
    { value: 'option3', label: 'Option 3' },
  ];

  describe('Rendering', () => {
    it('should render select element', () => {
      renderWithProviders(<Select options={options} />);
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('should render with label', () => {
      renderWithProviders(<Select label="Choose option" options={options} />);
      expect(screen.getByLabelText(/choose option/i)).toBeInTheDocument();
    });

    it('should show required indicator when required', () => {
      renderWithProviders(<Select label="Choose" options={options} required />);
      expect(screen.getByText('*')).toBeInTheDocument();
    });

    it('should render all options', () => {
      renderWithProviders(<Select options={options} />);
      const select = screen.getByRole('combobox');
      const optionElements = select.querySelectorAll('option');
      expect(optionElements).toHaveLength(options.length + 1); // +1 for placeholder
    });

    it('should render placeholder option', () => {
      renderWithProviders(<Select options={options} placeholder="Select..." />);
      expect(screen.getByText('Select...')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should display error message', () => {
      renderWithProviders(<Select options={options} error="This field is required" />);
      expect(screen.getByRole('alert')).toHaveTextContent('This field is required');
    });

    it('should have error styling when error is present', () => {
      renderWithProviders(<Select options={options} error="Error message" />);
      const select = screen.getByRole('combobox');
      
      expect(select).toHaveClass('border-red-300');
      expect(select).toHaveAttribute('aria-invalid', 'true');
    });
  });

  describe('User Interactions', () => {
    it('should handle selection change', async () => {
      const handleChange = vi.fn();
      const user = userEvent.setup();
      
      renderWithProviders(<Select options={options} onChange={handleChange} />);
      const select = screen.getByRole('combobox');
      
      await user.selectOptions(select, 'option2');
      expect(handleChange).toHaveBeenCalled();
      expect(select).toHaveValue('option2');
    });

    it('should call onBlur handler', async () => {
      const handleBlur = vi.fn();
      const user = userEvent.setup();
      
      renderWithProviders(<Select options={options} onBlur={handleBlur} />);
      const select = screen.getByRole('combobox');
      
      await user.click(select);
      await user.tab();
      
      expect(handleBlur).toHaveBeenCalled();
    });
  });

  describe('Disabled State', () => {
    it('should be disabled when disabled prop is true', () => {
      renderWithProviders(<Select options={options} disabled />);
      const select = screen.getByRole('combobox');
      
      expect(select).toBeDisabled();
    });

    it('should not accept selection when disabled', async () => {
      const handleChange = vi.fn();
      const user = userEvent.setup();
      
      renderWithProviders(<Select options={options} disabled onChange={handleChange} />);
      const select = screen.getByRole('combobox');
      
      await user.selectOptions(select, 'option2');
      expect(handleChange).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper aria-required attribute', () => {
      renderWithProviders(<Select options={options} required />);
      expect(screen.getByRole('combobox')).toHaveAttribute('aria-required', 'true');
    });

    it('should have proper aria-invalid attribute', () => {
      const { rerender } = renderWithProviders(<Select options={options} />);
      expect(screen.getByRole('combobox')).toHaveAttribute('aria-invalid', 'false');

      rerender(<Select options={options} error="Error" />);
      expect(screen.getByRole('combobox')).toHaveAttribute('aria-invalid', 'true');
    });

    it('should link label with select', () => {
      renderWithProviders(<Select label="Country" options={options} />);
      const select = screen.getByRole('combobox');
      const label = screen.getByText(/country/i);
      
      expect(select).toHaveAttribute('id');
      expect(label).toHaveAttribute('for', select.getAttribute('id'));
    });
  });

  describe('Value Control', () => {
    it('should work as controlled component', async () => {
      const TestComponent = () => {
        const [value, setValue] = React.useState('');
        return (
          <Select
            options={options}
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        );
      };

      const user = userEvent.setup();
      renderWithProviders(<TestComponent />);
      const select = screen.getByRole('combobox');
      
      await user.selectOptions(select, 'option2');
      expect(select).toHaveValue('option2');
    });
  });
});
