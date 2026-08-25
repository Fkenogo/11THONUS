---
name: Premium Verification System
colors:
  surface: '#f9f9fa'
  surface-dim: '#dadadb'
  surface-bright: '#f9f9fa'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f3f4'
  surface-container: '#eeeeef'
  surface-container-high: '#e8e8e9'
  surface-container-highest: '#e2e2e3'
  on-surface: '#1a1c1d'
  on-surface-variant: '#444748'
  inverse-surface: '#2f3132'
  inverse-on-surface: '#f0f1f2'
  outline: '#747878'
  outline-variant: '#c4c7c7'
  surface-tint: '#5f5e5e'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#1c1b1b'
  on-primary-container: '#858383'
  inverse-primary: '#c8c6c5'
  secondary: '#ab2e00'
  on-secondary: '#ffffff'
  secondary-container: '#d63c00'
  on-secondary-container: '#fffbff'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#271900'
  on-tertiary-container: '#ab7b00'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e5e2e1'
  primary-fixed-dim: '#c8c6c5'
  on-primary-fixed: '#1c1b1b'
  on-primary-fixed-variant: '#474646'
  secondary-fixed: '#ffdbd1'
  secondary-fixed-dim: '#ffb59f'
  on-secondary-fixed: '#3b0a00'
  on-secondary-fixed-variant: '#862200'
  tertiary-fixed: '#ffdea6'
  tertiary-fixed-dim: '#fcbc2f'
  on-tertiary-fixed: '#271900'
  on-tertiary-fixed-variant: '#5e4200'
  background: '#f9f9fa'
  on-background: '#1a1c1d'
  surface-variant: '#e2e2e3'
typography:
  headline-xl:
    fontFamily: Hanken Grotesk
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Hanken Grotesk
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-sm:
    fontFamily: Hanken Grotesk
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  headline-lg-mobile:
    fontFamily: Hanken Grotesk
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 34px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  space-unit: 8px
  container-padding-mobile: 20px
  container-padding-desktop: 40px
  gutter: 16px
  stack-sm: 8px
  stack-md: 24px
  stack-lg: 48px
---

## Brand & Style

This design system is built on the pillars of **Confidence, Clarity, and Reward**. It draws from the functional elegance of utility-first tools like Apple Wallet and Stripe, stripping away unnecessary decoration to focus on the user's progress toward a goal.

The aesthetic is **High-End Minimalism**. It utilizes a "light-first" approach, where vast white spaces create a sense of premium quality and calm. The visual narrative follows a specific functional transition:
- **Trust (Black):** Heavy, grounded elements used for institutional reliability and core navigation.
- **Progress (Orange):** High-energy accents that guide the eye toward active tasks and accumulation.
- **Reward (Gold):** Refined, celebratory hits used exclusively for achievement and redemption.

The overall mood is professional and utilitarian, avoiding any "gamified" or childish visual tropes in favor of a sophisticated, editorial-grade interface.

## Colors

The palette is intentionally restrained to maintain a premium feel. 

- **Foundation:** The interface is dominated by `#FFFFFF` (Pure White) for the main canvas, supported by `#F7F7F8` (Off-white) and `#F2F2F7` (Light Gray) for structural sectioning and background containers.
- **Trust:** `#121212` is used for primary text, main action buttons, and critical iconography. It provides the necessary "weight" to signify security.
- **Action/Progress:** `#FF4F11` (International Orange) is used for active states, progress bars, and "Next" actions. It is a high-visibility color that demands focus without being "playful."
- **Status/Reward:** `#F4B528` (Warm Gold) is reserved for the "11th" bonus state, premium tier indicators, and successfully completed milestones.

## Typography

The typography system relies on **Hanken Grotesk** for high-impact, confident headings and **Inter** for resilient, high-legibility body copy.

Headlines should be set with tight letter-spacing to appear "bolted" and authoritative. Large-scale headings (XL and LG) should be used generously to introduce sections, creating an editorial feel that mirrors premium lifestyle apps. 

Labels use an uppercase treatment with slight tracking (letter-spacing) to differentiate secondary metadata from primary body content. All numerical data—especially progress counts—should utilize the headline font for a bold, data-driven appearance.

## Layout & Spacing

This design system follows a **Fluid Grid** model with strict vertical rhythm based on an 8px base unit. 

- **Safe Margins:** Use a minimum of 20px padding on mobile to ensure content doesn't feel cramped. On desktop, expand this to 40px+ to embrace whitespace.
- **Task Focus:** Layouts should prioritize a single primary action per view. Use `stack-lg` (48px) to separate distinct functional groups, and `stack-md` (24px) for related elements within a card or section.
- **Vertical Hierarchy:** Information flows from top to bottom. Summary data (The "Status") sits at the top, followed by the active task, followed by secondary history or details.

## Elevation & Depth

To maintain a minimalist profile, the design system avoids heavy shadows. Instead, it uses **Surface-on-Surface** depth and **Micro-Shadows**.

1.  **Base Layer:** White (#FFFFFF).
2.  **Surface Layer:** Light Gray (#F7F7F8) containers used to group related information (e.g., a "Current Progress" card).
3.  **Elevated Layer:** Pure white cards sitting on top of light gray backgrounds, utilizing a very soft, highly diffused shadow: `0px 4px 20px rgba(0, 0, 0, 0.04)`.
4.  **Borders:** Subtle 1px borders (#E5E5E7) are used in place of shadows for input fields and list items to maintain a crisp, Stripe-like aesthetic.

## Shapes

The shape language is **Refined and Structured**. 

A standard radius of `0.5rem (8px)` is applied to primary UI elements like buttons and cards. This provides a modern, approachable feel without the "softness" of fully rounded pill shapes. 

Large containers or hero sections may use `rounded-xl (1.5rem)` to create a more distinct, app-like "pocket" for content. Icons should follow a consistent geometric weight—avoiding thin lines in favor of medium-weight paths that match the visual density of the Inter typeface.

## Components

- **Primary Buttons:** High-contrast Black (#121212) with White text for "Trust" actions (Sign In, Verify). Use Orange (#FF4F11) for "Progress" actions (Scan, Continue).
- **Cards:** White background, 1px subtle border, and 8px corner radius. Cards are the primary vehicle for "loyalty stamps" or progress tracking.
- **Progress Indicators:** Use thick, horizontal bars rather than circular loaders. The unfilled state is a light gray (#E5E5E7), and the filled state is the brand Orange (#FF4F11).
- **Chips/Badges:** Small, low-saturation backgrounds with high-contrast text. For example, a "Verified" badge might have a very light gray background with black text and a small gold dot icon.
- **Inputs:** Minimalist fields with 1px borders that darken on focus. Avoid floating labels; use clear, static labels above the field in `label-md` style.
- **Verification View:** A high-focus screen with a single, clear QR code or alpha-numeric code, framed by generous whitespace to signify importance.