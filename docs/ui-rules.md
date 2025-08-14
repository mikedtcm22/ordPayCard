# SatSpray Membership Card – UI Design Rules

**Project Name:** SatSpray Membership Card  
**Version:** 0.2 (Proof‑of‑Concept)  
**Document Type:** UI Design Guidelines  
**Date:** 11 July 2025  

---

## Design Philosophy

### Core Principles
1. **Trust Through Clarity** - Financial interactions require immediate understanding of status and actions
2. **Brand Authenticity** - Street art aesthetic balanced with professional Bitcoin application standards
3. **Progressive Enhancement** - Works without JavaScript, enhanced with wallet connections
4. **Accessibility First** - WCAG AA compliance across all design layers
5. **Performance Conscious** - Visual effects must not compromise real-time balance updates

### Design System Layers
- **Base Layer**: Minimalist dark-mode crypto modern (navigation, layout, content)
- **Brand Layer**: Graffiti/street-art accents (hero sections, backgrounds, decorative elements)
- **Component Layer**: Cyberpunk neon orange (modals, interactive elements, highlights)
- **Card Layer**: Neumorphic styling (on-chain SVG membership cards)

---

## Layout & Hierarchy

### Information Architecture
```
┌─ Header (Brand Layer) ─────────────────────────────────┐
│  SatSpray Logo + Wallet Connection Status             │
├─ Main Content (Base Layer) ───────────────────────────┤
│  ┌─ Primary Action Area ─────────────────────────────┐ │
│  │  Status Badge + Primary CTA                      │ │
│  └───────────────────────────────────────────────────┘ │
│  ┌─ Secondary Content ────────────────────────────────┐ │
│  │  Balance Details + Top-up Options                 │ │
│  └───────────────────────────────────────────────────┘ │
├─ Modal Layer (Component Layer) ────────────────────────┤
│  Wallet Connection, Top-up, Authentication Modals     │
└─ Footer (Base Layer) ─────────────────────────────────┘
```

### Spacing System
- **Micro**: 4px (0.25rem) - Icon padding, border radius
- **Small**: 8px (0.5rem) - Button padding, form spacing
- **Medium**: 16px (1rem) - Component margins, card padding
- **Large**: 24px (1.5rem) - Section spacing, modal padding
- **XL**: 32px (2rem) - Page margins, major section breaks
- **XXL**: 48px (3rem) - Hero sections, major layout breaks

### Grid System
- **Mobile**: Single column, 16px margins
- **Tablet**: 2-column layout, 24px margins
- **Desktop**: 3-column layout, 32px margins
- **Wide**: Max-width 1200px, centered with flexible margins

---

## Typography

### Font Hierarchy
```css
/* Primary Font: Inter (Base Layer) */
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

/* Secondary Font: Space Grotesk (Brand Layer) */
font-family: 'Space Grotesk', 'Inter', sans-serif;

/* Monospace Font: JetBrains Mono (Data Display) */
font-family: 'JetBrains Mono', 'Consolas', monospace;
```

### Type Scale
- **Display**: 48px/1.1, Space Grotesk, 700 weight (Hero headings)
- **H1**: 32px/1.2, Space Grotesk, 600 weight (Page titles)
- **H2**: 24px/1.3, Space Grotesk, 600 weight (Section headings)
- **H3**: 20px/1.4, Space Grotesk, 500 weight (Subsection headings)
- **Body Large**: 18px/1.5, Inter, 400 weight (Primary content)
- **Body**: 16px/1.5, Inter, 400 weight (Standard text)
- **Body Small**: 14px/1.4, Inter, 400 weight (Secondary text)
- **Caption**: 12px/1.3, Inter, 400 weight (Labels, captions)
- **Code**: 14px/1.4, JetBrains Mono, 400 weight (Addresses, IDs)

### Text Usage Guidelines
- **Headlines**: Use Space Grotesk for brand personality
- **Body Text**: Use Inter for readability and accessibility
- **Data Display**: Use JetBrains Mono for addresses, transaction IDs, amounts
- **Interactive Elements**: Use Inter with appropriate weights for clarity

---

## Color Usage

### Semantic Color Application
- **Primary Actions**: Orange gradient buttons, active states
- **Status Indicators**: Green (active), Red (expired), Yellow (pending)
- **Background Hierarchy**: Dark base, subtle graffiti textures, bright modal overlays
- **Text Contrast**: High contrast white/light text on dark backgrounds
- **Interactive States**: Orange hover effects, subtle neon glows

### Accessibility Requirements
- **Contrast Ratio**: Minimum 4.5:1 for normal text, 3:1 for large text
- **Color Independence**: Never rely solely on color for information
- **Focus Indicators**: Visible focus rings with high contrast
- **Error States**: Combine color with icons and clear messaging

---

## Component Design Rules

### Buttons

#### Primary Buttons (Cyberpunk Neon Orange)
```css
/* Base Style */
background: linear-gradient(135deg, #FF6B35 0%, #FF8E53 100%);
border: 2px solid #FF6B35;
border-radius: 8px;
padding: 12px 24px;
font-weight: 600;
transition: all 0.2s ease;

/* Hover State */
background: linear-gradient(135deg, #FF8E53 0%, #FFB07A 100%);
box-shadow: 0 0 20px rgba(255, 107, 53, 0.4);
transform: translateY(-2px);

/* Active State */
background: linear-gradient(135deg, #E55A2B 0%, #FF6B35 100%);
transform: translateY(0);

/* Focus State */
outline: 3px solid rgba(255, 107, 53, 0.3);
outline-offset: 2px;
```

#### Secondary Buttons (Base Layer)
```css
/* Base Style */
background: rgba(255, 255, 255, 0.1);
border: 1px solid rgba(255, 255, 255, 0.2);
border-radius: 8px;
padding: 12px 24px;
font-weight: 500;
color: #FFFFFF;

/* Hover State */
background: rgba(255, 255, 255, 0.15);
border-color: rgba(255, 255, 255, 0.3);
```

#### Destructive Buttons
```css
/* Base Style */
background: linear-gradient(135deg, #DC2626 0%, #EF4444 100%);
border: 2px solid #DC2626;
```

### Form Elements

#### Input Fields
```css
/* Base Style */
background: rgba(255, 255, 255, 0.05);
border: 1px solid rgba(255, 255, 255, 0.1);
border-radius: 6px;
padding: 12px 16px;
color: #FFFFFF;
font-family: 'Inter', sans-serif;

/* Focus State */
border-color: #FF6B35;
box-shadow: 0 0 0 3px rgba(255, 107, 53, 0.1);
outline: none;

/* Error State */
border-color: #EF4444;
box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
```

#### Labels
```css
font-size: 14px;
font-weight: 500;
color: #D1D5DB;
margin-bottom: 6px;
```

### Cards

#### Base Cards (Base Layer)
```css
background: rgba(255, 255, 255, 0.05);
border: 1px solid rgba(255, 255, 255, 0.1);
border-radius: 12px;
padding: 24px;
backdrop-filter: blur(10px);
```

#### Membership Cards (Neumorphic Layer)
```css
/* Container */
background: linear-gradient(145deg, #2D3748 0%, #1A202C 100%);
border-radius: 16px;
padding: 2px;
box-shadow: 
  20px 20px 40px rgba(0, 0, 0, 0.4),
  -20px -20px 40px rgba(255, 255, 255, 0.02);

/* Inner Card */
background: linear-gradient(145deg, #1A202C 0%, #2D3748 100%);
border-radius: 14px;
padding: 24px;
box-shadow: 
  inset 8px 8px 16px rgba(0, 0, 0, 0.3),
  inset -8px -8px 16px rgba(255, 255, 255, 0.02);
```

### Status Badges

#### Active Status
```css
background: linear-gradient(135deg, #059669 0%, #10B981 100%);
color: #FFFFFF;
border-radius: 20px;
padding: 4px 12px;
font-size: 12px;
font-weight: 600;
text-transform: uppercase;
letter-spacing: 0.5px;
```

#### Expired Status
```css
background: linear-gradient(135deg, #DC2626 0%, #EF4444 100%);
color: #FFFFFF;
/* ... same styling as active */
```

#### Pending Status
```css
background: linear-gradient(135deg, #D97706 0%, #F59E0B 100%);
color: #FFFFFF;
/* ... same styling as active */
```

### Modals (Cyberpunk Neon Orange)

#### Modal Overlay
```css
background: rgba(0, 0, 0, 0.8);
backdrop-filter: blur(8px);
```

#### Modal Container
```css
background: linear-gradient(145deg, #1A202C 0%, #2D3748 100%);
border: 2px solid #FF6B35;
border-radius: 16px;
box-shadow: 
  0 0 40px rgba(255, 107, 53, 0.3),
  0 20px 40px rgba(0, 0, 0, 0.4);
max-width: 500px;
width: 90%;
padding: 32px;
```

#### Modal Header
```css
border-bottom: 1px solid rgba(255, 107, 53, 0.2);
padding-bottom: 16px;
margin-bottom: 24px;
```

---

## Animation & Transitions

### Timing Functions
```css
/* Standard Easing */
transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);

/* Bounce In */
transition-timing-function: cubic-bezier(0.68, -0.55, 0.265, 1.55);

/* Smooth Out */
transition-timing-function: cubic-bezier(0.23, 1, 0.32, 1);
```

### Duration Guidelines
- **Micro Interactions**: 150ms (button hover, focus states)
- **Component Transitions**: 250ms (modal open/close, tab switching)
- **Page Transitions**: 400ms (route changes, major state changes)
- **Loading States**: 600ms (balance updates, transaction confirmations)

### Performance Rules
- **GPU Acceleration**: Use transform and opacity for animations
- **Avoid Layout Thrashing**: No animating width, height, or position
- **Respect Accessibility**: Honor `prefers-reduced-motion`
- **Loading Priority**: Never animate while fetching critical data

### Animation Patterns

#### Button Interactions
```css
/* Hover */
transform: translateY(-2px);
box-shadow: 0 4px 12px rgba(255, 107, 53, 0.3);

/* Active */
transform: translateY(0);
box-shadow: 0 2px 8px rgba(255, 107, 53, 0.2);
```

#### Modal Entrance
```css
/* From */
opacity: 0;
transform: scale(0.9) translateY(-10px);

/* To */
opacity: 1;
transform: scale(1) translateY(0);
```

#### Status Badge Pulse (Active)
```css
@keyframes pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
  50% { box-shadow: 0 0 0 8px rgba(16, 185, 129, 0); }
}
```

---

## Bitcoin-Specific UI Patterns

### Address Display
```css
/* Address Container */
background: rgba(0, 0, 0, 0.3);
border: 1px solid rgba(255, 255, 255, 0.1);
border-radius: 8px;
padding: 12px;
font-family: 'JetBrains Mono', monospace;
font-size: 14px;
word-break: break-all;

/* Copy Button */
position: absolute;
right: 8px;
top: 8px;
background: rgba(255, 107, 53, 0.1);
border: 1px solid rgba(255, 107, 53, 0.3);
```

### Transaction Status
```css
/* Pending */
.tx-pending {
  background: linear-gradient(90deg, #D97706 0%, #F59E0B 100%);
  animation: pulse 2s infinite;
}

/* Confirmed */
.tx-confirmed {
  background: linear-gradient(90deg, #059669 0%, #10B981 100%);
}

/* Failed */
.tx-failed {
  background: linear-gradient(90deg, #DC2626 0%, #EF4444 100%);
}
```

### Balance Display
```css
/* Primary Balance */
font-size: 32px;
font-weight: 700;
font-family: 'Space Grotesk', sans-serif;
color: #FFFFFF;
text-align: center;

/* Secondary Balance Info */
font-size: 14px;
font-weight: 400;
color: #9CA3AF;
text-align: center;
margin-top: 8px;
```

### Wallet Connection States
```css
/* Connected */
.wallet-connected {
  background: linear-gradient(135deg, #059669 0%, #10B981 100%);
  border: 2px solid #10B981;
}

/* Disconnected */
.wallet-disconnected {
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.2);
}

/* Connecting */
.wallet-connecting {
  background: linear-gradient(135deg, #D97706 0%, #F59E0B 100%);
  border: 2px solid #F59E0B;
  animation: pulse 1.5s infinite;
}
```

---

## Error Handling & Feedback

### Error Message Design
```css
/* Error Container */
background: rgba(239, 68, 68, 0.1);
border: 1px solid rgba(239, 68, 68, 0.3);
border-radius: 8px;
padding: 16px;
margin: 16px 0;

/* Error Icon */
color: #EF4444;
margin-right: 12px;
```

### Success Message Design
```css
/* Success Container */
background: rgba(16, 185, 129, 0.1);
border: 1px solid rgba(16, 185, 129, 0.3);
border-radius: 8px;
padding: 16px;
margin: 16px 0;

/* Success Icon */
color: #10B981;
margin-right: 12px;
```

### Loading States
```css
/* Skeleton Loading */
@keyframes skeleton {
  0% { background-position: -200px 0; }
  100% { background-position: calc(200px + 100%) 0; }
}

.skeleton {
  background: linear-gradient(90deg, 
    rgba(255, 255, 255, 0.05) 0%, 
    rgba(255, 255, 255, 0.1) 20%, 
    rgba(255, 255, 255, 0.05) 40%, 
    rgba(255, 255, 255, 0.05) 100%);
  background-size: 200px 100%;
  animation: skeleton 1.5s infinite;
}
```

---

## Accessibility Guidelines

### Focus Management
- **Focus Rings**: 3px orange outline with 2px offset
- **Skip Links**: Hidden until focused, styled consistently
- **Tab Order**: Logical flow following visual hierarchy
- **Keyboard Navigation**: All interactive elements accessible

### Screen Reader Support
- **ARIA Labels**: Descriptive labels for complex components
- **Live Regions**: For dynamic content updates (balance changes)
- **Semantic HTML**: Proper heading hierarchy and landmark roles
- **Alt Text**: Descriptive alternative text for all images

### Color Accessibility
- **High Contrast**: Minimum 4.5:1 for normal text
- **Color Independence**: Icons and text alongside color coding
- **Focus Indicators**: Visible focus states for all interactive elements
- **Error States**: Clear messaging beyond color alone

### Motion Accessibility
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Responsive Design Rules

### Breakpoints
```css
/* Mobile First */
/* Base styles: 320px+ */

/* Small Mobile */
@media (min-width: 375px) { /* iPhone SE */ }

/* Large Mobile */
@media (min-width: 414px) { /* iPhone Plus */ }

/* Tablet */
@media (min-width: 768px) { /* iPad */ }

/* Desktop */
@media (min-width: 1024px) { /* Desktop */ }

/* Large Desktop */
@media (min-width: 1440px) { /* Large Desktop */ }
```

### Component Scaling
- **Touch Targets**: Minimum 44x44px on mobile
- **Text Scaling**: Responsive font sizes with clamp()
- **Spacing**: Proportional scaling with viewport units
- **Images**: Always include responsive image sets

### Mobile-Specific Considerations
- **Wallet Integration**: Optimize for mobile wallet apps
- **Form Inputs**: Large touch targets, proper input types
- **Navigation**: Collapsible navigation for small screens
- **Performance**: Optimize for slower mobile connections

---

## Brand Integration Guidelines

### Graffiti/Street Art Accents
- **Usage**: Hero backgrounds, section dividers, decorative elements
- **Subtlety**: Should enhance, not overwhelm the interface
- **Performance**: Optimize images and use CSS effects where possible
- **Accessibility**: Ensure sufficient contrast over decorative elements

### Bitcoin Branding
- **Orange Usage**: Primary actions, active states, brand moments
- **Logo Integration**: Consistent sizing and spacing
- **Color Harmony**: Orange complements the dark theme
- **Professional Balance**: Street art aesthetic with fintech reliability

### Consistency Rules
- **Component Library**: All components follow the same design system
- **Pattern Reuse**: Consistent patterns across all user flows
- **Brand Voice**: Visual style matches the brand personality
- **Cross-Platform**: Consistent experience across devices

---

## Performance Considerations

### CSS Optimization
- **Critical CSS**: Above-the-fold styles inlined
- **Unused CSS**: Purge unused Tailwind classes
- **CSS Loading**: Non-critical styles loaded asynchronously
- **Minification**: All CSS minified in production

### Animation Performance
- **Hardware Acceleration**: Use transform and opacity
- **Composite Layers**: Isolate animated elements
- **Frame Rate**: Target 60fps for smooth animations
- **Battery Impact**: Minimize continuous animations

### Image Optimization
- **Format Selection**: WebP with fallbacks
- **Compression**: Optimize file sizes without quality loss
- **Lazy Loading**: Load images below the fold on demand
- **Responsive Images**: Serve appropriate sizes for device

---

*This UI design guide provides comprehensive rules for creating a consistent, accessible, and performant user interface that aligns with the SatSpray brand while maintaining the highest standards for Bitcoin application design.* 