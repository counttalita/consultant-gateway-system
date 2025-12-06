import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/utils/test-utils';
import Modal from '../Modal';

describe('Modal Component', () => {
  let originalOverflow;

  beforeEach(() => {
    originalOverflow = document.body.style.overflow;
  });

  afterEach(() => {
    document.body.style.overflow = originalOverflow;
  });

  describe('Rendering', () => {
    it('should not render when isOpen is false', () => {
      renderWithProviders(
        <Modal isOpen={false} onClose={vi.fn()} title="Test Modal">
          Content
        </Modal>
      );

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should render when isOpen is true', () => {
      renderWithProviders(
        <Modal isOpen={true} onClose={vi.fn()} title="Test Modal">
          Content
        </Modal>
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should render title', () => {
      renderWithProviders(
        <Modal isOpen={true} onClose={vi.fn()} title="Test Modal">
          Content
        </Modal>
      );

      expect(screen.getByText('Test Modal')).toBeInTheDocument();
    });

    it('should render children content', () => {
      renderWithProviders(
        <Modal isOpen={true} onClose={vi.fn()} title="Test Modal">
          <p>Modal content here</p>
        </Modal>
      );

      expect(screen.getByText('Modal content here')).toBeInTheDocument();
    });

    it('should render footer when provided', () => {
      renderWithProviders(
        <Modal
          isOpen={true}
          onClose={vi.fn()}
          title="Test Modal"
          footer={<button>Footer Button</button>}
        >
          Content
        </Modal>
      );

      expect(screen.getByText('Footer Button')).toBeInTheDocument();
    });

    it('should render close button by default', () => {
      renderWithProviders(
        <Modal isOpen={true} onClose={vi.fn()} title="Test Modal">
          Content
        </Modal>
      );

      expect(screen.getByLabelText(/close modal/i)).toBeInTheDocument();
    });

    it('should not render close button when showCloseButton is false', () => {
      renderWithProviders(
        <Modal isOpen={true} onClose={vi.fn()} title="Test Modal" showCloseButton={false}>
          Content
        </Modal>
      );

      expect(screen.queryByLabelText(/close modal/i)).not.toBeInTheDocument();
    });
  });

  describe('Modal Sizes', () => {
    it('should apply correct size classes', () => {
      const { rerender } = renderWithProviders(
        <Modal isOpen={true} onClose={vi.fn()} size="sm">
          Content
        </Modal>
      );

      let modalContent = screen.getByRole('document');
      expect(modalContent).toHaveClass('max-w-md');

      rerender(
        <Modal isOpen={true} onClose={vi.fn()} size="lg">
          Content
        </Modal>
      );
      modalContent = screen.getByRole('document');
      expect(modalContent).toHaveClass('max-w-2xl');
    });
  });

  describe('Closing Behavior', () => {
    it('should call onClose when close button is clicked', async () => {
      const handleClose = vi.fn();
      const user = userEvent.setup();

      renderWithProviders(
        <Modal isOpen={true} onClose={handleClose} title="Test Modal">
          Content
        </Modal>
      );

      const closeButton = screen.getByLabelText(/close modal/i);
      await user.click(closeButton);

      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when Escape key is pressed', async () => {
      const handleClose = vi.fn();
      const user = userEvent.setup();

      renderWithProviders(
        <Modal isOpen={true} onClose={handleClose} title="Test Modal">
          Content
        </Modal>
      );

      await user.keyboard('{Escape}');
      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when overlay is clicked', async () => {
      const handleClose = vi.fn();
      const user = userEvent.setup();

      renderWithProviders(
        <Modal isOpen={true} onClose={handleClose} title="Test Modal">
          Content
        </Modal>
      );

      const overlay = screen.getByRole('dialog');
      await user.click(overlay);

      expect(handleClose).toHaveBeenCalled();
    });

    it('should not close when overlay is clicked if closeOnOverlayClick is false', async () => {
      const handleClose = vi.fn();
      const user = userEvent.setup();

      renderWithProviders(
        <Modal isOpen={true} onClose={handleClose} title="Test Modal" closeOnOverlayClick={false}>
          Content
        </Modal>
      );

      const overlay = screen.getByRole('dialog');
      await user.click(overlay);

      expect(handleClose).not.toHaveBeenCalled();
    });

    it('should not close when clicking inside modal content', async () => {
      const handleClose = vi.fn();
      const user = userEvent.setup();

      renderWithProviders(
        <Modal isOpen={true} onClose={handleClose} title="Test Modal">
          <button>Inside Button</button>
        </Modal>
      );

      const insideButton = screen.getByText('Inside Button');
      await user.click(insideButton);

      expect(handleClose).not.toHaveBeenCalled();
    });
  });

  describe('Body Scroll Lock', () => {
    it('should lock body scroll when modal opens', () => {
      renderWithProviders(
        <Modal isOpen={true} onClose={vi.fn()} title="Test Modal">
          Content
        </Modal>
      );

      expect(document.body.style.overflow).toBe('hidden');
    });

    it('should restore body scroll when modal closes', () => {
      const { rerender } = renderWithProviders(
        <Modal isOpen={true} onClose={vi.fn()} title="Test Modal">
          Content
        </Modal>
      );

      expect(document.body.style.overflow).toBe('hidden');

      rerender(
        <Modal isOpen={false} onClose={vi.fn()} title="Test Modal">
          Content
        </Modal>
      );

      expect(document.body.style.overflow).toBe('unset');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      renderWithProviders(
        <Modal isOpen={true} onClose={vi.fn()} title="Test Modal">
          Content
        </Modal>
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-labelledby');
    });

    it('should link title with dialog via aria-labelledby', () => {
      renderWithProviders(
        <Modal isOpen={true} onClose={vi.fn()} title="Test Modal">
          Content
        </Modal>
      );

      const dialog = screen.getByRole('dialog');
      const titleId = dialog.getAttribute('aria-labelledby');
      const title = screen.getByText('Test Modal');

      expect(title).toHaveAttribute('id', titleId);
    });

    it('should have role="document" for modal content', () => {
      renderWithProviders(
        <Modal isOpen={true} onClose={vi.fn()} title="Test Modal">
          Content
        </Modal>
      );

      expect(screen.getByRole('document')).toBeInTheDocument();
    });

    it('should trap focus within modal', async () => {
      const user = userEvent.setup();

      renderWithProviders(
        <Modal isOpen={true} onClose={vi.fn()} title="Test Modal">
          <button>First Button</button>
          <button>Second Button</button>
        </Modal>
      );

      const firstButton = screen.getByText('First Button');
      const secondButton = screen.getByText('Second Button');
      const closeButton = screen.getByLabelText(/close modal/i);

      // Focus should start within modal
      firstButton.focus();
      expect(firstButton).toHaveFocus();

      // Tab should move to next element
      await user.tab();
      expect(secondButton).toHaveFocus();

      // Tab should move to close button
      await user.tab();
      expect(closeButton).toHaveFocus();
    });
  });

  describe('Keyboard Navigation', () => {
    it('should close on Escape key', async () => {
      const handleClose = vi.fn();
      const user = userEvent.setup();

      renderWithProviders(
        <Modal isOpen={true} onClose={handleClose} title="Test Modal">
          Content
        </Modal>
      );

      await user.keyboard('{Escape}');
      expect(handleClose).toHaveBeenCalled();
    });

    it('should not close on other keys', async () => {
      const handleClose = vi.fn();
      const user = userEvent.setup();

      renderWithProviders(
        <Modal isOpen={true} onClose={handleClose} title="Test Modal">
          Content
        </Modal>
      );

      await user.keyboard('{Tab}');
      await user.keyboard('a');

      expect(handleClose).not.toHaveBeenCalled();
    });
  });
});
