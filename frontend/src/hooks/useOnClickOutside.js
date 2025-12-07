import { useEffect, useRef } from 'react';

/**
 * useOnClickOutside - Hook to detect clicks outside of a component
 * 
 * Useful for closing modals, dropdowns, and other overlay components
 * when clicking outside of them.
 * 
 * @param {Function} handler - Callback function to execute on outside click
 * @returns {React.RefObject} - Ref to attach to the component
 * 
 * @example
 * const Modal = ({ onClose }) => {
 *   const modalRef = useOnClickOutside(onClose);
 *   
 *   return (
 *     <div className="modal-overlay">
 *       <div ref={modalRef} className="modal-content">
 *         <h2>Modal Content</h2>
 *       </div>
 *     </div>
 *   );
 * };
 * 
 * @example
 * // With custom ref
 * const Dropdown = ({ onClose }) => {
 *   const dropdownRef = useRef(null);
 *   useOnClickOutside(onClose, dropdownRef);
 *   
 *   return (
 *     <div ref={dropdownRef}>
 *       Dropdown content
 *     </div>
 *   );
 * };
 */
export const useOnClickOutside = (handler, customRef = null) => {
  const ref = useRef(null);
  const refToUse = customRef || ref;

  useEffect(() => {
    const listener = (event) => {
      // Do nothing if clicking ref's element or descendent elements
      if (!refToUse.current || refToUse.current.contains(event.target)) {
        return;
      }

      handler(event);
    };

    // Use mousedown and touchstart for better mobile support
    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);

    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [handler, refToUse]);

  return refToUse;
};

export default useOnClickOutside;
