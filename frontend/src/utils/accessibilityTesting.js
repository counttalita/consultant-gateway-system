/**
 * Accessibility Testing Utilities
 * Tools for testing and validating WCAG 2.1 AA compliance
 */

import { getContrastRatio, meetsWCAGAA } from './accessibility';

/**
 * Test color contrast for all text elements on the page
 * @returns {Array} - Array of contrast issues
 */
export const testPageContrast = () => {
  const issues = [];
  const textElements = document.querySelectorAll('p, span, a, button, h1, h2, h3, h4, h5, h6, label, li');
  
  textElements.forEach((element) => {
    const styles = window.getComputedStyle(element);
    const color = rgbToHex(styles.color);
    const backgroundColor = rgbToHex(styles.backgroundColor);
    
    // Skip if background is transparent
    if (backgroundColor === '#00000000' || backgroundColor === 'transparent') {
      return;
    }
    
    const fontSize = parseFloat(styles.fontSize);
    const fontWeight = parseInt(styles.fontWeight);
    const isLargeText = fontSize >= 18 || (fontSize >= 14 && fontWeight >= 700);
    
    const ratio = getContrastRatio(color, backgroundColor);
    const passes = meetsWCAGAA(color, backgroundColor, isLargeText);
    
    if (!passes) {
      issues.push({
        element: element.tagName,
        text: element.textContent.substring(0, 50),
        color,
        backgroundColor,
        ratio: ratio.toFixed(2),
        required: isLargeText ? 3 : 4.5,
        isLargeText,
      });
    }
  });
  
  return issues;
};

/**
 * Convert RGB color to hex
 * @param {string} rgb - RGB color string
 * @returns {string} - Hex color
 */
const rgbToHex = (rgb) => {
  if (rgb === 'transparent' || rgb === 'rgba(0, 0, 0, 0)') {
    return '#00000000';
  }
  
  const match = rgb.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)$/);
  if (!match) return rgb;
  
  const r = parseInt(match[1]);
  const g = parseInt(match[2]);
  const b = parseInt(match[3]);
  
  return '#' + [r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
};

/**
 * Test keyboard navigation for interactive elements
 * @returns {Array} - Array of keyboard navigation issues
 */
export const testKeyboardNavigation = () => {
  const issues = [];
  const interactiveElements = document.querySelectorAll(
    'a, button, input, select, textarea, [role="button"], [role="link"], [tabindex]'
  );
  
  interactiveElements.forEach((element) => {
    // Check if element is focusable
    const tabIndex = element.getAttribute('tabindex');
    const isDisabled = element.disabled || element.getAttribute('aria-disabled') === 'true';
    
    if (tabIndex === '-1' && !isDisabled) {
      // Element is not keyboard accessible
      issues.push({
        element: element.tagName,
        issue: 'Not keyboard accessible (tabindex="-1")',
        text: element.textContent?.substring(0, 50) || element.getAttribute('aria-label'),
      });
    }
    
    // Check for missing accessible name
    const hasAccessibleName = 
      element.textContent?.trim() ||
      element.getAttribute('aria-label') ||
      element.getAttribute('aria-labelledby') ||
      element.getAttribute('title') ||
      (element.tagName === 'INPUT' && element.labels?.length > 0);
    
    if (!hasAccessibleName && !isDisabled) {
      issues.push({
        element: element.tagName,
        issue: 'Missing accessible name',
        html: element.outerHTML.substring(0, 100),
      });
    }
  });
  
  return issues;
};

/**
 * Test ARIA attributes for validity
 * @returns {Array} - Array of ARIA issues
 */
export const testARIAAttributes = () => {
  const issues = [];
  const elementsWithARIA = document.querySelectorAll('[role], [aria-label], [aria-labelledby], [aria-describedby]');
  
  elementsWithARIA.forEach((element) => {
    // Check aria-labelledby references
    const labelledBy = element.getAttribute('aria-labelledby');
    if (labelledBy) {
      const ids = labelledBy.split(' ');
      ids.forEach(id => {
        if (!document.getElementById(id)) {
          issues.push({
            element: element.tagName,
            issue: `aria-labelledby references non-existent ID: ${id}`,
            html: element.outerHTML.substring(0, 100),
          });
        }
      });
    }
    
    // Check aria-describedby references
    const describedBy = element.getAttribute('aria-describedby');
    if (describedBy) {
      const ids = describedBy.split(' ');
      ids.forEach(id => {
        if (!document.getElementById(id)) {
          issues.push({
            element: element.tagName,
            issue: `aria-describedby references non-existent ID: ${id}`,
            html: element.outerHTML.substring(0, 100),
          });
        }
      });
    }
    
    // Check for empty aria-label
    const ariaLabel = element.getAttribute('aria-label');
    if (ariaLabel !== null && ariaLabel.trim() === '') {
      issues.push({
        element: element.tagName,
        issue: 'Empty aria-label attribute',
        html: element.outerHTML.substring(0, 100),
      });
    }
  });
  
  return issues;
};

/**
 * Test for proper heading hierarchy
 * @returns {Array} - Array of heading hierarchy issues
 */
export const testHeadingHierarchy = () => {
  const issues = [];
  const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
  let previousLevel = 0;
  
  headings.forEach((heading) => {
    const level = parseInt(heading.tagName.substring(1));
    
    if (previousLevel > 0 && level > previousLevel + 1) {
      issues.push({
        element: heading.tagName,
        issue: `Skipped heading level (from h${previousLevel} to h${level})`,
        text: heading.textContent.substring(0, 50),
      });
    }
    
    previousLevel = level;
  });
  
  return issues;
};

/**
 * Test for images without alt text
 * @returns {Array} - Array of image accessibility issues
 */
export const testImageAccessibility = () => {
  const issues = [];
  const images = document.querySelectorAll('img');
  
  images.forEach((img) => {
    const alt = img.getAttribute('alt');
    const role = img.getAttribute('role');
    
    // Decorative images should have empty alt or role="presentation"
    if (alt === null && role !== 'presentation') {
      issues.push({
        element: 'IMG',
        issue: 'Missing alt attribute',
        src: img.src,
      });
    }
  });
  
  return issues;
};

/**
 * Test for form accessibility
 * @returns {Array} - Array of form accessibility issues
 */
export const testFormAccessibility = () => {
  const issues = [];
  const formControls = document.querySelectorAll('input, select, textarea');
  
  formControls.forEach((control) => {
    const type = control.type;
    
    // Skip hidden inputs
    if (type === 'hidden') return;
    
    // Check for associated label
    const id = control.id;
    const hasLabel = 
      (id && document.querySelector(`label[for="${id}"]`)) ||
      control.closest('label') ||
      control.getAttribute('aria-label') ||
      control.getAttribute('aria-labelledby');
    
    if (!hasLabel) {
      issues.push({
        element: control.tagName,
        type: type,
        issue: 'Form control without associated label',
        name: control.name || 'unnamed',
      });
    }
    
    // Check for required field indication
    if (control.required && !control.getAttribute('aria-required')) {
      issues.push({
        element: control.tagName,
        type: type,
        issue: 'Required field without aria-required attribute',
        name: control.name || 'unnamed',
      });
    }
  });
  
  return issues;
};

/**
 * Run all accessibility tests
 * @returns {Object} - Object containing all test results
 */
export const runAllAccessibilityTests = () => {
  return {
    contrast: testPageContrast(),
    keyboard: testKeyboardNavigation(),
    aria: testARIAAttributes(),
    headings: testHeadingHierarchy(),
    images: testImageAccessibility(),
    forms: testFormAccessibility(),
  };
};

/**
 * Log accessibility test results to console
 * @param {Object} results - Test results from runAllAccessibilityTests
 */
export const logAccessibilityResults = (results) => {
  console.group('🔍 Accessibility Test Results');
  
  Object.entries(results).forEach(([category, issues]) => {
    if (issues.length > 0) {
      console.group(`❌ ${category.toUpperCase()} (${issues.length} issues)`);
      issues.forEach((issue, index) => {
        console.log(`${index + 1}.`, issue);
      });
      console.groupEnd();
    } else {
      console.log(`✅ ${category.toUpperCase()} - No issues found`);
    }
  });
  
  console.groupEnd();
};

/**
 * Enable accessibility testing in development
 * Adds a keyboard shortcut (Ctrl+Shift+A) to run tests
 */
export const enableAccessibilityTesting = () => {
  if (process.env.NODE_ENV !== 'development') return;
  
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'A') {
      e.preventDefault();
      const results = runAllAccessibilityTests();
      logAccessibilityResults(results);
    }
  });
  
  console.log('♿ Accessibility testing enabled. Press Ctrl+Shift+A to run tests.');
};
