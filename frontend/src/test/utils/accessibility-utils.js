/**
 * Default axe configuration for accessibility testing
 * This follows WCAG 2.1 AA standards
 */
export const defaultAxeConfig = {
  rules: {
    // Ensure color contrast meets WCAG AA
    'color-contrast': { enabled: true },
    // Ensure all interactive elements are keyboard accessible
    'keyboard': { enabled: true },
    // Ensure proper heading hierarchy
    'heading-order': { enabled: true },
    // Ensure images have alt text
    'image-alt': { enabled: true },
    // Ensure form labels are associated
    'label': { enabled: true },
    // Ensure links have discernible text
    'link-name': { enabled: true },
    // Ensure buttons have accessible names
    'button-name': { enabled: true },
  },
};

/**
 * Run accessibility tests on a rendered component
 * @param {HTMLElement} container - The container element to test
 * @param {Object} options - Axe configuration options
 * @returns {Promise<Object>} Axe results
 */
export async function runAxeTest(container, options = {}) {
  const axeCore = await import('axe-core');
  
  const results = await axeCore.default.run(container, {
    rules: {
      // WCAG 2.1 Level A & AA rules
      'color-contrast': { enabled: true },
      'keyboard': { enabled: true },
      'heading-order': { enabled: true },
      'image-alt': { enabled: true },
      'label': { enabled: true },
      'link-name': { enabled: true },
      'button-name': { enabled: true },
      'aria-allowed-attr': { enabled: true },
      'aria-required-attr': { enabled: true },
      'aria-valid-attr': { enabled: true },
      'aria-valid-attr-value': { enabled: true },
      'duplicate-id': { enabled: true },
      'form-field-multiple-labels': { enabled: true },
      'frame-title': { enabled: true },
      'html-has-lang': { enabled: true },
      'html-lang-valid': { enabled: true },
      'input-image-alt': { enabled: true },
      'label-title-only': { enabled: true },
      'list': { enabled: true },
      'listitem': { enabled: true },
      'meta-refresh': { enabled: true },
      'meta-viewport': { enabled: true },
      'region': { enabled: true },
      'scope-attr-valid': { enabled: true },
      'tabindex': { enabled: true },
      'valid-lang': { enabled: true },
      ...options.rules,
    },
    ...options,
  });

  return results;
}

/**
 * Assert that there are no accessibility violations
 * @param {HTMLElement} container - The container element to test
 * @param {Object} options - Axe configuration options
 */
export async function expectNoA11yViolations(container, options = {}) {
  const results = await runAxeTest(container, options);
  
  if (results.violations.length > 0) {
    const violationMessages = results.violations.map((violation) => {
      const nodes = violation.nodes.map((node) => node.html).join('\n');
      return `${violation.id}: ${violation.description}\n${violation.helpUrl}\nAffected nodes:\n${nodes}`;
    });
    
    throw new Error(
      `Accessibility violations found:\n\n${violationMessages.join('\n\n')}`
    );
  }
}

/**
 * Check if element is keyboard accessible
 * @param {HTMLElement} element - Element to check
 * @returns {boolean} True if keyboard accessible
 */
export function isKeyboardAccessible(element) {
  const tabIndex = element.getAttribute('tabindex');
  const isInteractive = ['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA'].includes(
    element.tagName
  );
  
  return (
    isInteractive ||
    (tabIndex !== null && parseInt(tabIndex, 10) >= 0) ||
    element.hasAttribute('role')
  );
}

/**
 * Check if element has accessible name
 * @param {HTMLElement} element - Element to check
 * @returns {boolean} True if has accessible name
 */
export function hasAccessibleName(element) {
  const ariaLabel = element.getAttribute('aria-label');
  const ariaLabelledBy = element.getAttribute('aria-labelledby');
  const title = element.getAttribute('title');
  const textContent = element.textContent?.trim();
  
  return !!(ariaLabel || ariaLabelledBy || title || textContent);
}

/**
 * Check if form field has associated label
 * @param {HTMLElement} input - Input element to check
 * @returns {boolean} True if has label
 */
export function hasAssociatedLabel(input) {
  const id = input.getAttribute('id');
  const ariaLabel = input.getAttribute('aria-label');
  const ariaLabelledBy = input.getAttribute('aria-labelledby');
  
  if (ariaLabel || ariaLabelledBy) {
    return true;
  }
  
  if (id) {
    const label = document.querySelector(`label[for="${id}"]`);
    if (label) {
      return true;
    }
  }
  
  // Check if input is wrapped in a label
  const parentLabel = input.closest('label');
  return !!parentLabel;
}

/**
 * Simulate keyboard navigation
 * @param {HTMLElement} element - Starting element
 * @param {string} key - Key to press (Tab, Enter, Space, etc.)
 */
export async function simulateKeyboardNavigation(element, key = 'Tab') {
  const { userEvent } = await import('@testing-library/user-event');
  const user = userEvent.setup();
  
  element.focus();
  
  switch (key) {
    case 'Tab':
      await user.tab();
      break;
    case 'Enter':
      await user.keyboard('{Enter}');
      break;
    case 'Space':
      await user.keyboard(' ');
      break;
    case 'Escape':
      await user.keyboard('{Escape}');
      break;
    case 'ArrowDown':
      await user.keyboard('{ArrowDown}');
      break;
    case 'ArrowUp':
      await user.keyboard('{ArrowUp}');
      break;
    default:
      await user.keyboard(`{${key}}`);
  }
}

/**
 * Get all focusable elements in container
 * @param {HTMLElement} container - Container to search
 * @returns {HTMLElement[]} Array of focusable elements
 */
export function getFocusableElements(container) {
  const selector = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable="true"]',
  ].join(',');
  
  return Array.from(container.querySelectorAll(selector));
}

/**
 * Test focus trap functionality
 * @param {HTMLElement} container - Container with focus trap
 * @param {Object} expect - Vitest expect function
 */
export async function testFocusTrap(container, expect) {
  const focusableElements = getFocusableElements(container);
  
  if (focusableElements.length === 0) {
    throw new Error('No focusable elements found in container');
  }
  
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];
  
  // Focus first element
  firstElement.focus();
  expect(document.activeElement).toBe(firstElement);
  
  // Tab through all elements
  const { userEvent } = await import('@testing-library/user-event');
  const user = userEvent.setup();
  
  for (let i = 1; i < focusableElements.length; i++) {
    await user.tab();
    expect(document.activeElement).toBe(focusableElements[i]);
  }
  
  // Tab from last element should go to first (focus trap)
  await user.tab();
  expect(document.activeElement).toBe(firstElement);
  
  // Shift+Tab from first should go to last
  await user.tab({ shift: true });
  expect(document.activeElement).toBe(lastElement);
}

/**
 * Check if element meets color contrast requirements
 * @param {HTMLElement} element - Element to check
 * @returns {Promise<boolean>} True if meets WCAG AA contrast
 */
export async function meetsContrastRequirements(element) {
  const axeCore = await import('axe-core');
  
  const results = await axeCore.default.run(element, {
    rules: {
      'color-contrast': { enabled: true },
    },
  });
  
  return results.violations.length === 0;
}

/**
 * Create a custom matcher for accessibility testing
 */
export function toHaveNoA11yViolations() {
  return {
    async compare(container) {
      try {
        await expectNoA11yViolations(container);
        return {
          pass: true,
          message: () => 'Expected element to have accessibility violations',
        };
      } catch (error) {
        return {
          pass: false,
          message: () => error.message,
        };
      }
    },
  };
}
