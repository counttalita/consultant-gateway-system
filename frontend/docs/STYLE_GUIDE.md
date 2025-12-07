# Style Guide

Design system and styling guidelines for the Consultant Gateway Frontend.

## Table of Contents

- [Design Principles](#design-principles)
- [Color Palette](#color-palette)
- [Typography](#typography)
- [Spacing](#spacing)
- [Components](#components)
- [Responsive Design](#responsive-design)
- [Accessibility](#accessibility)

## Design Principles

### 1. Consistency

Maintain visual and functional consistency across all pages and components.

### 2. Clarity

Use clear, concise language and intuitive UI patterns.

### 3. Efficiency

Minimize clicks and cognitive load for common tasks.

### 4. Accessibility

Ensure all users can access and use the application.

### 5. Responsiveness

Provide optimal experience across all device sizes.

## Color Palette

### Primary Colors

```css
/* Blue - Primary actions, links */
--color-primary-50: #eff6ff;
--color-primary-100: #dbeafe;
--color-primary-200: #bfdbfe;
--color-primary-300: #93c5fd;
--color-primary-400: #60a5fa;
--color-primary-500: #3b82f6;  /* Main primary */
--color-primary-600: #2563eb;
--color-primary-700: #1d4ed8;
--color-primary-800: #1e40af;
--color-primary-900: #1e3a8a;
```

### Semantic Colors

```css
/* Success - Green */
--color-success: #10b981;
--color-success-light: #d1fae5;
--color-success-dark: #047857;

/* Warning - Yellow */
--color-warning: #f59e0b;
--color-warning-light: #fef3c7;
--color-warning-dark: #d97706;

/* Error - Red */
--color-error: #ef4444;
--color-error-light: #fee2e2;
--color-error-dark: #dc2626;

/* Info - Blue */
--color-info: #3b82f6;
--color-info-light: #dbeafe;
--color-info-dark: #1d4ed8;
```

### Neutral Colors

```css
/* Gray scale */
--color-gray-50: #f9fafb;
--color-gray-100: #f3f4f6;
--color-gray-200: #e5e7eb;
--color-gray-300: #d1d5db;
--color-gray-400: #9ca3af;
--color-gray-500: #6b7280;
--color-gray-600: #4b5563;
--color-gray-700: #374151;
--color-gray-800: #1f2937;
--color-gray-900: #111827;
```

### Usage Guidelines

**Primary Blue:**
- Primary buttons
- Active navigation items
- Links
- Focus states

**Success Green:**
- Success messages
- Positive status indicators
- Confirmation actions

**Warning Yellow:**
- Warning messages
- Caution indicators
- Pending states

**Error Red:**
- Error messages
- Destructive actions
- Validation errors

**Gray:**
- Text (700-900 for body, 500-600 for secondary)
- Borders (200-300)
- Backgrounds (50-100)
- Disabled states (300-400)

## Typography

### Font Family

```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 
             'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 
             'Helvetica Neue', sans-serif;
```

### Font Sizes

```css
/* Headings */
--text-xs: 0.75rem;     /* 12px */
--text-sm: 0.875rem;    /* 14px */
--text-base: 1rem;      /* 16px */
--text-lg: 1.125rem;    /* 18px */
--text-xl: 1.25rem;     /* 20px */
--text-2xl: 1.5rem;     /* 24px */
--text-3xl: 1.875rem;   /* 30px */
--text-4xl: 2.25rem;    /* 36px */
```

### Font Weights

```css
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
--font-extrabold: 800;
```

### Line Heights

```css
--leading-none: 1;
--leading-tight: 1.25;
--leading-snug: 1.375;
--leading-normal: 1.5;
--leading-relaxed: 1.625;
--leading-loose: 2;
```

### Typography Scale

```jsx
// H1 - Page titles
<h1 className="text-3xl font-bold text-gray-900">
  Page Title
</h1>

// H2 - Section headings
<h2 className="text-2xl font-semibold text-gray-900">
  Section Heading
</h2>

// H3 - Subsection headings
<h3 className="text-xl font-semibold text-gray-900">
  Subsection Heading
</h3>

// Body text
<p className="text-base text-gray-700">
  Body text content
</p>

// Small text
<span className="text-sm text-gray-600">
  Secondary information
</span>

// Extra small text
<span className="text-xs text-gray-500">
  Metadata or captions
</span>
```

## Spacing

### Spacing Scale

```css
--space-0: 0;
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.25rem;   /* 20px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
```

### Spacing Guidelines

**Component Padding:**
- Small: `p-2` or `p-3` (8-12px)
- Medium: `p-4` or `p-6` (16-24px)
- Large: `p-8` or `p-10` (32-40px)

**Component Margins:**
- Between related elements: `mb-2` or `mb-4` (8-16px)
- Between sections: `mb-6` or `mb-8` (24-32px)
- Between major sections: `mb-12` or `mb-16` (48-64px)

**Grid Gaps:**
- Tight: `gap-2` or `gap-3` (8-12px)
- Normal: `gap-4` or `gap-6` (16-24px)
- Loose: `gap-8` or `gap-10` (32-40px)

## Components

### Buttons

```jsx
// Primary button
<button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
  Primary Action
</button>

// Secondary button
<button className="px-4 py-2 bg-gray-200 text-gray-900 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2">
  Secondary Action
</button>

// Outline button
<button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
  Outline Action
</button>

// Danger button
<button className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2">
  Delete
</button>
```

### Form Inputs

```jsx
// Text input
<input
  type="text"
  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
/>

// Input with error
<input
  type="text"
  className="w-full px-3 py-2 border border-red-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
  aria-invalid="true"
/>

// Disabled input
<input
  type="text"
  disabled
  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-500 cursor-not-allowed"
/>
```

### Cards

```jsx
<div className="bg-white rounded-lg shadow-md p-6">
  <h3 className="text-lg font-semibold text-gray-900 mb-2">
    Card Title
  </h3>
  <p className="text-gray-600">
    Card content goes here
  </p>
</div>
```

### Badges

```jsx
// Success badge
<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
  Active
</span>

// Warning badge
<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
  Pending
</span>

// Error badge
<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
  Inactive
</span>
```

## Responsive Design

### Breakpoints

```css
/* Mobile first approach */
sm: 640px   /* Small devices (landscape phones) */
md: 768px   /* Medium devices (tablets) */
lg: 1024px  /* Large devices (desktops) */
xl: 1280px  /* Extra large devices (large desktops) */
2xl: 1536px /* 2X large devices (larger desktops) */
```

### Responsive Patterns

```jsx
// Responsive grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {items.map(item => <Card key={item.id} {...item} />)}
</div>

// Responsive text
<h1 className="text-2xl md:text-3xl lg:text-4xl font-bold">
  Responsive Heading
</h1>

// Responsive spacing
<div className="p-4 md:p-6 lg:p-8">
  Content
</div>

// Hide on mobile
<div className="hidden md:block">
  Desktop only content
</div>

// Show only on mobile
<div className="block md:hidden">
  Mobile only content
</div>
```

## Accessibility

### Color Contrast

Ensure WCAG AA compliance:
- Normal text: 4.5:1 contrast ratio
- Large text (18pt+): 3:1 contrast ratio
- UI components: 3:1 contrast ratio

### Focus States

Always provide visible focus indicators:

```jsx
<button className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
  Accessible Button
</button>
```

### ARIA Labels

Use appropriate ARIA attributes:

```jsx
<button aria-label="Close dialog">
  <CloseIcon />
</button>

<input
  type="text"
  aria-label="Search"
  aria-describedby="search-help"
/>
<span id="search-help" className="text-sm text-gray-500">
  Enter keywords to search
</span>
```

### Semantic HTML

Use semantic HTML elements:

```jsx
// Good
<nav>
  <ul>
    <li><a href="/">Home</a></li>
  </ul>
</nav>

// Avoid
<div className="nav">
  <div className="nav-item">
    <a href="/">Home</a>
  </div>
</div>
```

### Keyboard Navigation

Ensure all interactive elements are keyboard accessible:

```jsx
<div
  role="button"
  tabIndex={0}
  onClick={handleClick}
  onKeyPress={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleClick();
    }
  }}
>
  Custom Button
</div>
```

## Animation

### Transitions

Use subtle transitions for better UX:

```css
/* Button hover */
transition: background-color 150ms ease-in-out;

/* Modal entrance */
transition: opacity 200ms ease-in-out, transform 200ms ease-in-out;

/* Loading spinner */
animation: spin 1s linear infinite;
```

### Animation Guidelines

- Keep animations under 300ms for UI feedback
- Use `ease-in-out` for most transitions
- Respect `prefers-reduced-motion` media query
- Avoid animations that could trigger seizures

```jsx
// Respect reduced motion preference
<div className="transition-opacity duration-200 motion-reduce:transition-none">
  Content
</div>
```

## Best Practices

### 1. Use Tailwind Utilities

Prefer Tailwind utilities over custom CSS:

```jsx
// Good
<div className="flex items-center justify-between p-4 bg-white rounded-lg shadow">

// Avoid
<div style={{ display: 'flex', alignItems: 'center', ... }}>
```

### 2. Component Variants

Create reusable component variants:

```jsx
const buttonVariants = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700',
  secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300',
  danger: 'bg-red-600 text-white hover:bg-red-700'
};

<button className={cn('px-4 py-2 rounded-md', buttonVariants[variant])}>
  {children}
</button>
```

### 3. Consistent Spacing

Use consistent spacing throughout:

```jsx
// Section spacing
<section className="mb-8">

// Card spacing
<div className="p-6">

// Form field spacing
<div className="space-y-4">
```

### 4. Mobile First

Design for mobile first, then enhance for larger screens:

```jsx
<div className="w-full md:w-1/2 lg:w-1/3">
  Content
</div>
```
