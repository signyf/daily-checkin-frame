# Design Guidelines: Farcaster Daily Check-in Mini App

## Design Approach
**Utility-Focused Web3 Application** - Drawing inspiration from modern crypto apps like Rainbow Wallet, Uniswap, and Frame.xyz. Prioritizing clarity, trust signals, and seamless wallet interaction over decorative elements.

## Core Design Principles
1. **Dark-First Interface**: Deep navy background creates focus and reduces eye strain
2. **Status Clarity**: Every interaction state must be immediately recognizable
3. **Trust Through Simplicity**: Minimal UI reduces cognitive load during blockchain transactions
4. **Celebratory Micro-moments**: Subtle feedback for successful check-ins

## Typography System
- **Primary Font**: Inter or DM Sans via Google Fonts CDN
- **Headline (Streak Counter)**: 72px (4.5rem), font-black (900 weight)
- **Sub-label**: 20px (1.25rem), medium weight, muted color
- **Title**: 24px (1.5rem), bold (700 weight)
- **Button Text**: 18px (1.125rem), bold (700 weight)
- **Body/Status**: 16px (1rem), medium weight

## Layout & Spacing
**Vertical Rhythm**: Use Tailwind units of 2, 4, 8, and 16 exclusively
- Container: `max-w-md` centered with `p-8` padding
- Section gaps: `space-y-8` for major sections, `space-y-4` for related elements
- Button padding: `py-4 px-6`
- Icon-to-text gap: `gap-2`

**Single-Column Centered Layout**: All content stacked vertically, centered alignment throughout

## Component Library

### Primary CTA Button
- Full width within container (`w-full max-w-xs`)
- Large touch target: minimum 64px height (`py-4`)
- Rounded corners: `rounded-xl` (12px)
- States:
  - **Active/Ready**: Bright emerald background with white text
  - **Disabled/Waiting**: Muted gray background with lighter gray text
  - **Processing**: Same as active but with subtle opacity shift
- No hover effects (Frame environment constraint)

### Streak Display
- Centered numeric display with icon header
- Icon + text combination using Lucide icons
- Large numeral with small unit label beside it
- Emerald accent color for active elements

### Status Indicators
- Inline countdown timer when check-in unavailable
- Loading state with "Mining..." text
- Success feedback (3-second duration before reset)

### Header Section
- Icon + title pairing centered
- Emerald-tinted icon for brand consistency
- Generous top padding (`pt-12` minimum)

## Visual Treatment
**Background**: Solid deep navy (`#0f172a` equivalent)
**Primary Accent**: Emerald (`#10b981`)
**Text Hierarchy**:
- Primary: White (`#ffffff`)
- Secondary: Light gray (`#94a3b8`)
- Muted: Medium gray (`#64748b`)

**Surfaces**: No cards or containers - flat hierarchy against dark background

## Icons
Use Lucide React via npm:
- CalendarCheck: Header/title icon
- Clock: Time-based status indicators
- Additional icons from provided list as contextually appropriate
- Icon size: 24px (1.5rem) standard, 32px (2rem) for header

## Animations
**Minimal Motion**:
- Button state transitions: 150ms ease
- Success state: Brief scale pulse (1.0 to 1.02) on streak number only
- No page transitions or scroll effects

## Accessibility
- Maintain AAA contrast ratios on dark background
- Large touch targets (minimum 44px)
- Clear disabled states with color AND text changes
- Focus indicators on interactive elements using emerald outline

## Images
**No hero images** - This is a utility app, not a marketing page. The interface opens directly to the functional UI. The only imagery is the app icon referenced in the Farcaster configuration.

## Mobile-First Constraints
- Single column layout works across all viewports
- No responsive breakpoints needed
- Fixed max-width prevents over-stretching on desktop
- Assumes Frame environment: no navigation, footers, or auxiliary UI