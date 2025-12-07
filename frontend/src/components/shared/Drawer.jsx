import { useEffect } from 'react';
import { cn } from '../../utils/cn';
import useFocusTrap from '../../hooks/useFocusTrap';
import { announceToScreenReader } from '../../utils/accessibility';

const Drawer = ({
  isOpen,
  onClose,
  title,
  children,
  position = 'right',
  size = 'md',
  closeOnOverlayClick = true,
  showCloseButton = true,
}) => {
  const focusTrapRef = useFocusTrap(isOpen);
  
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      // Announce drawer opening to screen readers
      if (title) {
        announceToScreenReader(`${title} panel opened`, 'polite');
      }
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, title]);
  
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);
  
  if (!isOpen) return null;
  
  const sizes = {
    sm: 'max-w-xs',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  };
  
  const positions = {
    left: 'left-0 top-0 h-full',
    right: 'right-0 top-0 h-full',
    top: 'top-0 left-0 w-full',
    bottom: 'bottom-0 left-0 w-full',
  };
  
  const animations = {
    left: 'animate-slide-in-left',
    right: 'animate-slide-in-right',
    top: 'animate-slide-in-top',
    bottom: 'animate-slide-in-bottom',
  };
  
  const handleOverlayClick = (e) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose();
    }
  };
  
  return (
    <div
      className="fixed inset-0 z-50 bg-black bg-opacity-50 animate-fade-in"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'drawer-title' : undefined}
      aria-describedby="drawer-content"
    >
      <div
        ref={focusTrapRef}
        className={cn(
          'fixed bg-white shadow-xl flex flex-col',
          positions[position],
          (position === 'left' || position === 'right') && sizes[size],
          animations[position]
        )}
        role="document"
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            {title && (
              <h2 id="drawer-title" className="text-xl font-semibold text-gray-900">
                {title}
              </h2>
            )}
            {showCloseButton && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Close drawer"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>
        )}
        
        {/* Body */}
        <div id="drawer-content" className="flex-1 px-6 py-4 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Drawer;
