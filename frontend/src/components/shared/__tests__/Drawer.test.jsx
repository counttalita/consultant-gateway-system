import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Drawer from '../Drawer';

// Mock useFocusTrap hook
vi.mock('../../hooks/useFocusTrap', () => ({
  default: () => ({ current: null })
}));

// Mock accessibility utils
vi.mock('../../utils/accessibility', () => ({
  announceToScreenReader: vi.fn()
}));

describe('Drawer Component', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    mockOnClose.mockReset();
  });

  it('should render nothing when isOpen is false', () => {
    render(
      <Drawer isOpen={false} onClose={mockOnClose} title="Test Drawer">
        <div>Drawer Content</div>
      </Drawer>
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('should render content when isOpen is true', () => {
    render(
      <Drawer isOpen={true} onClose={mockOnClose} title="Test Drawer">
        <div>Drawer Content</div>
      </Drawer>
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Test Drawer')).toBeInTheDocument();
    expect(screen.getByText('Drawer Content')).toBeInTheDocument();
  });

  it('should close when overlay is clicked', async () => {
    const user = userEvent.setup();
    render(
      <Drawer isOpen={true} onClose={mockOnClose} title="Test Drawer">
        <div>Content</div>
      </Drawer>
    );

    const overlay = screen.getByRole('dialog');
    await user.click(overlay);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should not close when overlay is clicked if closeOnOverlayClick is false', async () => {
    const user = userEvent.setup();
    render(
      <Drawer 
        isOpen={true} 
        onClose={mockOnClose} 
        title="Test Drawer" 
        closeOnOverlayClick={false}
      >
        <div>Content</div>
      </Drawer>
    );

    const overlay = screen.getByRole('dialog');
    await user.click(overlay);

    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('should close when close button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <Drawer isOpen={true} onClose={mockOnClose} title="Test Drawer">
        <div>Content</div>
      </Drawer>
    );

    const closeButton = screen.getByLabelText('Close drawer');
    await user.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should close when Escape key is pressed', () => {
    render(
      <Drawer isOpen={true} onClose={mockOnClose} title="Test Drawer">
        <div>Content</div>
      </Drawer>
    );

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(mockOnClose).toHaveBeenCalled();
  });
});
