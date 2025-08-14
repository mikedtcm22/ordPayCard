# SatSpray Membership Card – Theme Rules

**Project Name:** SatSpray Membership Card  
**Version:** 0.2 (Proof‑of‑Concept)  
**Document Type:** Theme Specification  
**Date:** 11 July 2025  

---

## Color Palette

### Primary Colors
```css
:root {
  /* Orange (Bitcoin/Primary) */
  --color-orange-50: #FFF7ED;
  --color-orange-100: #FFEDD5;
  --color-orange-200: #FED7AA;
  --color-orange-300: #FDBA74;
  --color-orange-400: #FB923C;
  --color-orange-500: #F97316;  /* Primary Orange */
  --color-orange-600: #FF6B35;  /* Main Brand Orange */
  --color-orange-700: #E55A2B;
  --color-orange-800: #C2410C;
  --color-orange-900: #9A3412;
  
  /* Cyberpunk Neon Orange */
  --color-neon-orange-light: #FFB07A;
  --color-neon-orange: #FF8E53;
  --color-neon-orange-dark: #E55A2B;
  --color-neon-orange-glow: rgba(255, 107, 53, 0.4);
}
```

### Base Dark Theme Colors
```css
:root {
  /* Dark Background Scale */
  --color-gray-50: #F9FAFB;
  --color-gray-100: #F3F4F6;
  --color-gray-200: #E5E7EB;
  --color-gray-300: #D1D5DB;
  --color-gray-400: #9CA3AF;
  --color-gray-500: #6B7280;
  --color-gray-600: #4B5563;
  --color-gray-700: #374151;
  --color-gray-800: #1F2937;
  --color-gray-900: #111827;
  
  /* Dark Theme Backgrounds */
  --color-dark-50: #3D4852;
  --color-dark-100: #2D3748;
  --color-dark-200: #1A202C;
  --color-dark-300: #171923;
  --color-dark-400: #0F1419;
  --color-dark-500: #000000;
  
  /* Base Theme Colors */
  --color-background: var(--color-dark-200);    /* #1A202C */
  --color-surface: var(--color-dark-100);       /* #2D3748 */
  --color-surface-light: var(--color-dark-50);  /* #3D4852 */
  --color-surface-dark: var(--color-dark-300);  /* #171923 */
}
```

### Status Colors
```css
:root {
  /* Success/Active (Green) */
  --color-success-50: #F0FDF4;
  --color-success-100: #DCFCE7;
  --color-success-200: #BBF7D0;
  --color-success-300: #86EFAC;
  --color-success-400: #4ADE80;
  --color-success-500: #22C55E;
  --color-success-600: #10B981;  /* Primary Success */
  --color-success-700: #059669;
  --color-success-800: #047857;
  --color-success-900: #064E3B;
  
  /* Error/Expired (Red) */
  --color-error-50: #FEF2F2;
  --color-error-100: #FEE2E2;
  --color-error-200: #FECACA;
  --color-error-300: #FCA5A5;
  --color-error-400: #F87171;
  --color-error-500: #EF4444;  /* Primary Error */
  --color-error-600: #DC2626;
  --color-error-700: #B91C1C;
  --color-error-800: #991B1B;
  --color-error-900: #7F1D1D;
  
  /* Warning/Pending (Yellow) */
  --color-warning-50: #FFFBEB;
  --color-warning-100: #FEF3C7;
  --color-warning-200: #FDE68A;
  --color-warning-300: #FCD34D;
  --color-warning-400: #FBBF24;
  --color-warning-500: #F59E0B;  /* Primary Warning */
  --color-warning-600: #D97706;
  --color-warning-700: #B45309;
  --color-warning-800: #92400E;
  --color-warning-900: #78350F;
}
```

### Text Colors
```css
:root {
  /* Text Colors */
  --color-text-primary: #FFFFFF;
  --color-text-secondary: #D1D5DB;
  --color-text-muted: #9CA3AF;
  --color-text-disabled: #6B7280;
  --color-text-inverse: #111827;
  
  /* Text on Color Backgrounds */
  --color-text-on-orange: #FFFFFF;
  --color-text-on-success: #FFFFFF;
  --color-text-on-error: #FFFFFF;
  --color-text-on-warning: #111827;
}
```

### Border & Overlay Colors
```css
:root {
  /* Border Colors */
  --color-border-primary: rgba(255, 255, 255, 0.1);
  --color-border-secondary: rgba(255, 255, 255, 0.05);
  --color-border-focus: var(--color-orange-600);
  --color-border-error: var(--color-error-500);
  --color-border-success: var(--color-success-600);
  
  /* Overlay Colors */
  --color-overlay-light: rgba(255, 255, 255, 0.05);
  --color-overlay-medium: rgba(255, 255, 255, 0.1);
  --color-overlay-heavy: rgba(255, 255, 255, 0.2);
  --color-overlay-modal: rgba(0, 0, 0, 0.8);
  
  /* Shadow Colors */
  --color-shadow-light: rgba(0, 0, 0, 0.1);
  --color-shadow-medium: rgba(0, 0, 0, 0.2);
  --color-shadow-heavy: rgba(0, 0, 0, 0.4);
  --color-shadow-neon: rgba(255, 107, 53, 0.3);
}
```

---

## Typography System

### Font Stacks
```css
:root {
  /* Font Families */
  --font-primary: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-brand: 'Space Grotesk', 'Inter', sans-serif;
  --font-mono: 'JetBrains Mono', 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', 'Courier New', monospace;
  
  /* Font Weights */
  --font-weight-light: 300;
  --font-weight-regular: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;
  --font-weight-black: 900;
}
```

### Font Sizes & Line Heights
```css
:root {
  /* Font Sizes */
  --font-size-xs: 0.75rem;    /* 12px */
  --font-size-sm: 0.875rem;   /* 14px */
  --font-size-base: 1rem;     /* 16px */
  --font-size-lg: 1.125rem;   /* 18px */
  --font-size-xl: 1.25rem;    /* 20px */
  --font-size-2xl: 1.5rem;    /* 24px */
  --font-size-3xl: 1.875rem;  /* 30px */
  --font-size-4xl: 2rem;      /* 32px */
  --font-size-5xl: 3rem;      /* 48px */
  
  /* Line Heights */
  --line-height-tight: 1.1;
  --line-height-snug: 1.2;
  --line-height-normal: 1.3;
  --line-height-relaxed: 1.4;
  --line-height-loose: 1.5;
  
  /* Letter Spacing */
  --letter-spacing-tight: -0.025em;
  --letter-spacing-normal: 0;
  --letter-spacing-wide: 0.025em;
  --letter-spacing-wider: 0.05em;
  --letter-spacing-widest: 0.1em;
}
```

---

## Component Theme Tokens

### Buttons
```css
:root {
  /* Primary Button */
  --btn-primary-bg: linear-gradient(135deg, var(--color-orange-600) 0%, var(--color-neon-orange) 100%);
  --btn-primary-bg-hover: linear-gradient(135deg, var(--color-neon-orange) 0%, var(--color-neon-orange-light) 100%);
  --btn-primary-bg-active: linear-gradient(135deg, var(--color-neon-orange-dark) 0%, var(--color-orange-600) 100%);
  --btn-primary-border: var(--color-orange-600);
  --btn-primary-text: var(--color-text-on-orange);
  --btn-primary-shadow: 0 0 20px var(--color-neon-orange-glow);
  --btn-primary-shadow-hover: 0 4px 12px var(--color-neon-orange-glow);
  
  /* Secondary Button */
  --btn-secondary-bg: var(--color-overlay-medium);
  --btn-secondary-bg-hover: var(--color-overlay-heavy);
  --btn-secondary-border: var(--color-border-primary);
  --btn-secondary-border-hover: var(--color-border-secondary);
  --btn-secondary-text: var(--color-text-primary);
  
  /* Destructive Button */
  --btn-destructive-bg: linear-gradient(135deg, var(--color-error-600) 0%, var(--color-error-500) 100%);
  --btn-destructive-border: var(--color-error-600);
  --btn-destructive-text: var(--color-text-on-error);
  
  /* Button Sizing */
  --btn-padding-sm: 8px 16px;
  --btn-padding-md: 12px 24px;
  --btn-padding-lg: 16px 32px;
  --btn-radius: 8px;
  --btn-font-weight: var(--font-weight-semibold);
}
```

### Form Elements
```css
:root {
  /* Input Fields */
  --input-bg: rgba(255, 255, 255, 0.05);
  --input-bg-focus: rgba(255, 255, 255, 0.08);
  --input-border: var(--color-border-secondary);
  --input-border-focus: var(--color-border-focus);
  --input-border-error: var(--color-border-error);
  --input-text: var(--color-text-primary);
  --input-placeholder: var(--color-text-muted);
  --input-padding: 12px 16px;
  --input-radius: 6px;
  --input-shadow-focus: 0 0 0 3px rgba(255, 107, 53, 0.1);
  --input-shadow-error: 0 0 0 3px rgba(239, 68, 68, 0.1);
  
  /* Labels */
  --label-text: var(--color-text-secondary);
  --label-font-size: var(--font-size-sm);
  --label-font-weight: var(--font-weight-medium);
  --label-margin-bottom: 6px;
}
```

### Cards
```css
:root {
  /* Base Cards */
  --card-bg: var(--color-overlay-light);
  --card-border: var(--color-border-primary);
  --card-radius: 12px;
  --card-padding: 24px;
  --card-shadow: 0 4px 6px var(--color-shadow-light);
  --card-backdrop-filter: blur(10px);
  
  /* Neumorphic Cards */
  --card-neumorphic-bg-outer: linear-gradient(145deg, var(--color-surface) 0%, var(--color-background) 100%);
  --card-neumorphic-bg-inner: linear-gradient(145deg, var(--color-background) 0%, var(--color-surface) 100%);
  --card-neumorphic-shadow-outer: 
    20px 20px 40px var(--color-shadow-heavy),
    -20px -20px 40px rgba(255, 255, 255, 0.02);
  --card-neumorphic-shadow-inner: 
    inset 8px 8px 16px rgba(0, 0, 0, 0.3),
    inset -8px -8px 16px rgba(255, 255, 255, 0.02);
  --card-neumorphic-radius: 16px;
  --card-neumorphic-padding: 2px;
}
```

### Status Badges
```css
:root {
  /* Active Status */
  --badge-active-bg: linear-gradient(135deg, var(--color-success-700) 0%, var(--color-success-600) 100%);
  --badge-active-text: var(--color-text-on-success);
  --badge-active-pulse: 0 0 0 0 rgba(16, 185, 129, 0.4);
  
  /* Expired Status */
  --badge-expired-bg: linear-gradient(135deg, var(--color-error-600) 0%, var(--color-error-500) 100%);
  --badge-expired-text: var(--color-text-on-error);
  
  /* Pending Status */
  --badge-pending-bg: linear-gradient(135deg, var(--color-warning-600) 0%, var(--color-warning-500) 100%);
  --badge-pending-text: var(--color-text-on-warning);
  
  /* Badge Styling */
  --badge-radius: 20px;
  --badge-padding: 4px 12px;
  --badge-font-size: var(--font-size-xs);
  --badge-font-weight: var(--font-weight-semibold);
  --badge-text-transform: uppercase;
  --badge-letter-spacing: var(--letter-spacing-wide);
}
```

### Modals
```css
:root {
  /* Modal Overlay */
  --modal-overlay-bg: var(--color-overlay-modal);
  --modal-overlay-backdrop-filter: blur(8px);
  
  /* Modal Container */
  --modal-bg: linear-gradient(145deg, var(--color-background) 0%, var(--color-surface) 100%);
  --modal-border: 2px solid var(--color-orange-600);
  --modal-radius: 16px;
  --modal-padding: 32px;
  --modal-max-width: 500px;
  --modal-width: 90%;
  --modal-shadow: 
    0 0 40px var(--color-shadow-neon),
    0 20px 40px var(--color-shadow-heavy);
  
  /* Modal Header */
  --modal-header-border: 1px solid rgba(255, 107, 53, 0.2);
  --modal-header-padding-bottom: 16px;
  --modal-header-margin-bottom: 24px;
}
```

---

## Animations & Transitions

### Transition Tokens
```css
:root {
  /* Timing Functions */
  --ease-standard: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
  --ease-smooth: cubic-bezier(0.23, 1, 0.32, 1);
  
  /* Durations */
  --duration-fast: 150ms;
  --duration-medium: 250ms;
  --duration-slow: 400ms;
  --duration-loading: 600ms;
  
  /* Combined Transitions */
  --transition-standard: all var(--duration-fast) var(--ease-standard);
  --transition-bounce: all var(--duration-medium) var(--ease-bounce);
  --transition-smooth: all var(--duration-medium) var(--ease-smooth);
}
```

### Animation Keyframes
```css
@keyframes pulse {
  0%, 100% { 
    box-shadow: 0 0 0 0 var(--badge-active-pulse);
  }
  50% { 
    box-shadow: 0 0 0 8px transparent;
  }
}

@keyframes skeleton {
  0% { 
    background-position: -200px 0;
  }
  100% { 
    background-position: calc(200px + 100%) 0;
  }
}

@keyframes modalEnter {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(-10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

@keyframes buttonHover {
  from {
    transform: translateY(0);
    box-shadow: 0 2px 8px var(--color-shadow-medium);
  }
  to {
    transform: translateY(-2px);
    box-shadow: var(--btn-primary-shadow-hover);
  }
}
```

---

## Spacing System

### Spacing Tokens
```css
:root {
  /* Spacing Scale */
  --space-0: 0;
  --space-px: 1px;
  --space-0_5: 0.125rem;  /* 2px */
  --space-1: 0.25rem;     /* 4px */
  --space-1_5: 0.375rem;  /* 6px */
  --space-2: 0.5rem;      /* 8px */
  --space-2_5: 0.625rem;  /* 10px */
  --space-3: 0.75rem;     /* 12px */
  --space-3_5: 0.875rem;  /* 14px */
  --space-4: 1rem;        /* 16px */
  --space-5: 1.25rem;     /* 20px */
  --space-6: 1.5rem;      /* 24px */
  --space-7: 1.75rem;     /* 28px */
  --space-8: 2rem;        /* 32px */
  --space-9: 2.25rem;     /* 36px */
  --space-10: 2.5rem;     /* 40px */
  --space-11: 2.75rem;    /* 44px */
  --space-12: 3rem;       /* 48px */
  --space-14: 3.5rem;     /* 56px */
  --space-16: 4rem;       /* 64px */
  --space-20: 5rem;       /* 80px */
  --space-24: 6rem;       /* 96px */
  --space-28: 7rem;       /* 112px */
  --space-32: 8rem;       /* 128px */
  
  /* Semantic Spacing */
  --space-micro: var(--space-1);     /* 4px */
  --space-small: var(--space-2);     /* 8px */
  --space-medium: var(--space-4);    /* 16px */
  --space-large: var(--space-6);     /* 24px */
  --space-xl: var(--space-8);        /* 32px */
  --space-xxl: var(--space-12);      /* 48px */
}
```

### Border Radius
```css
:root {
  /* Border Radius */
  --radius-none: 0;
  --radius-sm: 4px;
  --radius-md: 6px;
  --radius-lg: 8px;
  --radius-xl: 12px;
  --radius-2xl: 16px;
  --radius-3xl: 24px;
  --radius-full: 9999px;
  
  /* Component Radius */
  --radius-button: var(--radius-lg);
  --radius-input: var(--radius-md);
  --radius-card: var(--radius-xl);
  --radius-modal: var(--radius-2xl);
  --radius-badge: var(--radius-full);
}
```

---

## Tailwind CSS Configuration

### Custom Tailwind Config
```javascript
// tailwind.config.js
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Orange Scale
        'orange': {
          50: '#FFF7ED',
          100: '#FFEDD5',
          200: '#FED7AA',
          300: '#FDBA74',
          400: '#FB923C',
          500: '#F97316',
          600: '#FF6B35',  // Brand Orange
          700: '#E55A2B',
          800: '#C2410C',
          900: '#9A3412',
        },
        // Neon Orange
        'neon-orange': {
          light: '#FFB07A',
          DEFAULT: '#FF8E53',
          dark: '#E55A2B',
        },
        // Dark Scale
        'dark': {
          50: '#3D4852',
          100: '#2D3748',
          200: '#1A202C',
          300: '#171923',
          400: '#0F1419',
          500: '#000000',
        },
        // Semantic Colors
        'success': {
          50: '#F0FDF4',
          100: '#DCFCE7',
          200: '#BBF7D0',
          300: '#86EFAC',
          400: '#4ADE80',
          500: '#22C55E',
          600: '#10B981',
          700: '#059669',
          800: '#047857',
          900: '#064E3B',
        },
        'error': {
          50: '#FEF2F2',
          100: '#FEE2E2',
          200: '#FECACA',
          300: '#FCA5A5',
          400: '#F87171',
          500: '#EF4444',
          600: '#DC2626',
          700: '#B91C1C',
          800: '#991B1B',
          900: '#7F1D1D',
        },
        'warning': {
          50: '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#FBBF24',
          500: '#F59E0B',
          600: '#D97706',
          700: '#B45309',
          800: '#92400E',
          900: '#78350F',
        },
      },
      fontFamily: {
        'primary': ['Inter', 'sans-serif'],
        'brand': ['Space Grotesk', 'Inter', 'sans-serif'],
        'mono': ['JetBrains Mono', 'monospace'],
      },
      fontSize: {
        'display': ['3rem', { lineHeight: '1.1', letterSpacing: '-0.025em' }],
        'h1': ['2rem', { lineHeight: '1.2', letterSpacing: '-0.025em' }],
        'h2': ['1.5rem', { lineHeight: '1.3' }],
        'h3': ['1.25rem', { lineHeight: '1.4' }],
        'body-lg': ['1.125rem', { lineHeight: '1.5' }],
        'body': ['1rem', { lineHeight: '1.5' }],
        'body-sm': ['0.875rem', { lineHeight: '1.4' }],
        'caption': ['0.75rem', { lineHeight: '1.3' }],
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '26': '6.5rem',
        '30': '7.5rem',
      },
      boxShadow: {
        'neon': '0 0 20px rgba(255, 107, 53, 0.4)',
        'neon-hover': '0 4px 12px rgba(255, 107, 53, 0.3)',
        'neumorphic-outer': '20px 20px 40px rgba(0, 0, 0, 0.4), -20px -20px 40px rgba(255, 255, 255, 0.02)',
        'neumorphic-inner': 'inset 8px 8px 16px rgba(0, 0, 0, 0.3), inset -8px -8px 16px rgba(255, 255, 255, 0.02)',
        'modal': '0 0 40px rgba(255, 107, 53, 0.3), 0 20px 40px rgba(0, 0, 0, 0.4)',
      },
      animation: {
        'pulse-slow': 'pulse 2s infinite',
        'skeleton': 'skeleton 1.5s infinite',
        'modal-enter': 'modalEnter 250ms cubic-bezier(0.4, 0, 0.2, 1)',
        'button-hover': 'buttonHover 150ms cubic-bezier(0.4, 0, 0.2, 1)',
      },
      transitionTimingFunction: {
        'bounce': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'smooth': 'cubic-bezier(0.23, 1, 0.32, 1)',
      },
      backdropFilter: {
        'xs': 'blur(2px)',
        'sm': 'blur(4px)',
        'md': 'blur(8px)',
        'lg': 'blur(16px)',
        'xl': 'blur(24px)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    require('@tailwindcss/aspect-ratio'),
  ],
}
```

---

## Component Classes

### Button Classes
```css
/* Primary Button */
.btn-primary {
  @apply bg-gradient-to-br from-orange-600 to-neon-orange;
  @apply border-2 border-orange-600;
  @apply text-white font-semibold;
  @apply px-6 py-3 rounded-lg;
  @apply transition-all duration-150 ease-standard;
  @apply focus:outline-none focus:ring-3 focus:ring-orange-600/30 focus:ring-offset-2 focus:ring-offset-dark-200;
}

.btn-primary:hover {
  @apply bg-gradient-to-br from-neon-orange to-neon-orange-light;
  @apply shadow-neon-hover;
  @apply transform -translate-y-0.5;
}

.btn-primary:active {
  @apply bg-gradient-to-br from-neon-orange-dark to-orange-600;
  @apply transform translate-y-0;
}

/* Secondary Button */
.btn-secondary {
  @apply bg-white/10 border border-white/20;
  @apply text-white font-medium;
  @apply px-6 py-3 rounded-lg;
  @apply transition-all duration-150 ease-standard;
  @apply hover:bg-white/15 hover:border-white/30;
  @apply focus:outline-none focus:ring-3 focus:ring-white/20 focus:ring-offset-2 focus:ring-offset-dark-200;
}

/* Destructive Button */
.btn-destructive {
  @apply bg-gradient-to-br from-error-600 to-error-500;
  @apply border-2 border-error-600;
  @apply text-white font-semibold;
  @apply px-6 py-3 rounded-lg;
  @apply transition-all duration-150 ease-standard;
  @apply hover:bg-gradient-to-br hover:from-error-700 hover:to-error-600;
  @apply focus:outline-none focus:ring-3 focus:ring-error-500/30 focus:ring-offset-2 focus:ring-offset-dark-200;
}
```

### Card Classes
```css
/* Base Card */
.card {
  @apply bg-white/5 border border-white/10;
  @apply rounded-xl p-6;
  @apply backdrop-blur-md;
  @apply shadow-lg;
}

/* Neumorphic Card */
.card-neumorphic {
  @apply bg-gradient-to-br from-dark-100 to-dark-200;
  @apply rounded-2xl p-0.5;
  @apply shadow-neumorphic-outer;
}

.card-neumorphic-inner {
  @apply bg-gradient-to-br from-dark-200 to-dark-100;
  @apply rounded-xl p-6;
  @apply shadow-neumorphic-inner;
}

/* Membership Card */
.membership-card {
  @apply card-neumorphic;
  @apply w-full max-w-sm mx-auto;
  @apply transition-all duration-300 ease-smooth;
  @apply hover:shadow-lg hover:shadow-neon/20;
}
```

### Form Classes
```css
/* Input Field */
.input {
  @apply bg-white/5 border border-white/10;
  @apply rounded-md px-4 py-3;
  @apply text-white placeholder-gray-400;
  @apply font-primary;
  @apply transition-all duration-150 ease-standard;
  @apply focus:outline-none focus:border-orange-600 focus:ring-3 focus:ring-orange-600/10;
}

.input.error {
  @apply border-error-500 ring-3 ring-error-500/10;
}

/* Label */
.label {
  @apply block text-sm font-medium text-gray-300 mb-1.5;
}

/* Form Group */
.form-group {
  @apply space-y-1.5;
}

/* Fieldset */
.fieldset {
  @apply space-y-6;
}
```

### Status Classes
```css
/* Status Badges */
.badge {
  @apply inline-flex items-center px-3 py-1;
  @apply text-xs font-semibold uppercase tracking-wider;
  @apply rounded-full;
}

.badge-active {
  @apply badge;
  @apply bg-gradient-to-r from-success-700 to-success-600;
  @apply text-white;
  @apply animate-pulse-slow;
}

.badge-expired {
  @apply badge;
  @apply bg-gradient-to-r from-error-600 to-error-500;
  @apply text-white;
}

.badge-pending {
  @apply badge;
  @apply bg-gradient-to-r from-warning-600 to-warning-500;
  @apply text-gray-900;
}

/* Wallet Connection States */
.wallet-connected {
  @apply bg-gradient-to-r from-success-700 to-success-600;
  @apply border-2 border-success-600;
  @apply text-white;
}

.wallet-disconnected {
  @apply bg-white/10 border-2 border-white/20;
  @apply text-white;
}

.wallet-connecting {
  @apply bg-gradient-to-r from-warning-600 to-warning-500;
  @apply border-2 border-warning-500;
  @apply text-gray-900;
  @apply animate-pulse;
}
```

### Modal Classes
```css
/* Modal Overlay */
.modal-overlay {
  @apply fixed inset-0 z-50;
  @apply bg-black/80 backdrop-blur-md;
  @apply flex items-center justify-center;
  @apply p-4;
}

/* Modal Container */
.modal {
  @apply bg-gradient-to-br from-dark-200 to-dark-100;
  @apply border-2 border-orange-600;
  @apply rounded-2xl p-8;
  @apply shadow-modal;
  @apply max-w-md w-full;
  @apply animate-modal-enter;
}

/* Modal Header */
.modal-header {
  @apply border-b border-orange-600/20;
  @apply pb-4 mb-6;
}

.modal-title {
  @apply text-xl font-semibold text-white;
  @apply font-brand;
}

/* Modal Body */
.modal-body {
  @apply space-y-4;
}

/* Modal Footer */
.modal-footer {
  @apply flex justify-end space-x-3;
  @apply pt-6 mt-6;
  @apply border-t border-white/10;
}
```

### Utility Classes
```css
/* Loading States */
.loading-skeleton {
  @apply animate-skeleton;
  @apply bg-gradient-to-r from-white/5 via-white/10 to-white/5;
  @apply bg-[length:200px_100%];
  @apply rounded;
}

/* Focus Styles */
.focus-ring {
  @apply focus:outline-none focus:ring-3 focus:ring-orange-600/30 focus:ring-offset-2 focus:ring-offset-dark-200;
}

/* Text Styles */
.text-gradient {
  @apply bg-gradient-to-r from-orange-400 to-orange-600;
  @apply bg-clip-text text-transparent;
}

/* Layout Helpers */
.container-app {
  @apply max-w-6xl mx-auto px-4 sm:px-6 lg:px-8;
}

.section-padding {
  @apply py-12 sm:py-16 lg:py-20;
}

/* Responsive Show/Hide */
.show-mobile {
  @apply block sm:hidden;
}

.show-desktop {
  @apply hidden sm:block;
}
```

---

## Responsive Design Tokens

### Breakpoints
```css
:root {
  /* Responsive Breakpoints */
  --breakpoint-sm: 640px;
  --breakpoint-md: 768px;
  --breakpoint-lg: 1024px;
  --breakpoint-xl: 1280px;
  --breakpoint-2xl: 1536px;
}
```

### Responsive Typography
```css
/* Responsive Font Sizes */
.text-display {
  @apply text-4xl sm:text-5xl lg:text-6xl;
  @apply font-bold font-brand;
  @apply leading-tight;
}

.text-h1 {
  @apply text-2xl sm:text-3xl lg:text-4xl;
  @apply font-semibold font-brand;
  @apply leading-snug;
}

.text-h2 {
  @apply text-xl sm:text-2xl lg:text-3xl;
  @apply font-semibold font-brand;
  @apply leading-normal;
}

.text-body {
  @apply text-base sm:text-lg;
  @apply font-primary;
  @apply leading-relaxed;
}
```

---

## Dark Mode Support

### CSS Variables for Theme Switching
```css
:root {
  /* Light Mode (Future Enhancement) */
  --color-scheme: dark;
}

[data-theme="dark"] {
  --color-scheme: dark;
  --color-background: var(--color-dark-200);
  --color-surface: var(--color-dark-100);
  --color-text-primary: #FFFFFF;
  --color-text-secondary: #D1D5DB;
  --color-text-muted: #9CA3AF;
}

/* System Preference Detection */
@media (prefers-color-scheme: dark) {
  :root {
    --color-scheme: dark;
  }
}

/* Accessibility: Reduced Motion */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Performance Optimizations

### Critical CSS Classes
```css
/* Critical Above-the-fold Styles */
.critical-header {
  @apply bg-dark-200 border-b border-white/10;
  @apply px-4 py-4;
}

.critical-hero {
  @apply bg-dark-200 text-white;
  @apply py-12 px-4;
  @apply text-center;
}

.critical-button {
  @apply bg-orange-600 text-white;
  @apply px-6 py-3 rounded-lg;
  @apply font-semibold;
}
```

### Non-Critical Enhancements
```css
/* Non-critical animations and effects */
.enhanced-glow {
  @apply hover:shadow-neon;
  @apply transition-shadow duration-300;
}

.enhanced-backdrop {
  @apply backdrop-blur-md;
  @apply bg-gradient-to-br from-dark-200/90 to-dark-100/90;
}
```

---

*This theme specification provides complete color palettes, typography systems, component styling, and implementation guidelines for consistent theming across the SatSpray Membership Card application.* 