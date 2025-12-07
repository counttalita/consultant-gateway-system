import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NotificationContainer from '../NotificationContainer';

describe('NotificationContainer Component', () => {
  const mockNotifications = [
    {
      id: 1,
      type: 'success',
      title: 'Success!',
      message: 'Operation completed successfully.',
    },
    {
      id: 2,
      type: 'error',
      title: 'Error!',
      message: 'Something went wrong.',
    },
    {
      id: 3,
      type: 'info',
      message: 'Just letting you know.', // No title
    }
  ];

  const mockOnClose = vi.fn();

  it('should render notifications', () => {
    render(
      <NotificationContainer 
        notifications={mockNotifications} 
        onClose={mockOnClose} 
      />
    );

    expect(screen.getByText('Success!')).toBeInTheDocument();
    expect(screen.getByText('Operation completed successfully.')).toBeInTheDocument();
    
    expect(screen.getByText('Error!')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong.')).toBeInTheDocument();
    
    expect(screen.getByText('Just letting you know.')).toBeInTheDocument();
  });

  it('should call onClose when close button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <NotificationContainer 
        notifications={[mockNotifications[0]]} 
        onClose={mockOnClose} 
      />
    );

    const closeButton = screen.getByLabelText('Close notification');
    await user.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledWith(1);
  });

  it('should render action button if provided', async () => {
    const mockAction = vi.fn();
    const notificationWithAction = {
      id: 4,
      type: 'warning',
      message: 'Warning with action',
      action: {
        label: 'Retry',
        onClick: mockAction
      }
    };

    const user = userEvent.setup();
    render(
      <NotificationContainer 
        notifications={[notificationWithAction]} 
        onClose={mockOnClose} 
      />
    );

    const actionButton = screen.getByText('Retry');
    expect(actionButton).toBeInTheDocument();

    await user.click(actionButton);
    expect(mockAction).toHaveBeenCalled();
  });

  it('should apply correct styles based on type', () => {
    const { rerender } = render(
      <NotificationContainer 
        notifications={[{ id: 1, type: 'success', message: 'test' }]} 
        onClose={mockOnClose} 
      />
    );
    
    // Check for success classes (bg-green-50)
    // Note: This relies on implementation details (class names)
    // Ideally we verify the visual aspect or accessible role, but testing classes is common for utility CSS.
    let alert = screen.getByRole('alert');
    expect(alert.className).toContain('bg-green-50');

    rerender(
      <NotificationContainer 
        notifications={[{ id: 1, type: 'error', message: 'test' }]} 
        onClose={mockOnClose} 
      />
    );
    alert = screen.getByRole('alert');
    expect(alert.className).toContain('bg-red-50');

    rerender(
      <NotificationContainer 
        notifications={[{ id: 1, type: 'warning', message: 'test' }]} 
        onClose={mockOnClose} 
      />
    );
    alert = screen.getByRole('alert');
    expect(alert.className).toContain('bg-yellow-50');

    rerender(
      <NotificationContainer 
        notifications={[{ id: 1, type: 'info', message: 'test' }]} 
        onClose={mockOnClose} 
      />
    );
    alert = screen.getByRole('alert');
    expect(alert.className).toContain('bg-blue-50');
  });
});
