---
name: Warm & Whimsical Bakery
colors:
  surface: '#fff8f5'
  surface-dim: '#e9d7c8'
  surface-bright: '#fff8f5'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#fff1e8'
  surface-container: '#feeadc'
  surface-container-high: '#f8e5d6'
  surface-container-highest: '#f2dfd1'
  on-surface: '#231a11'
  on-surface-variant: '#59413c'
  inverse-surface: '#392e25'
  inverse-on-surface: '#ffeee1'
  outline: '#8d716a'
  outline-variant: '#e1bfb8'
  surface-tint: '#ae3115'
  primary: '#ae3115'
  on-primary: '#ffffff'
  primary-container: '#ff6b4a'
  on-primary-container: '#661000'
  inverse-primary: '#ffb4a3'
  secondary: '#775a00'
  on-secondary: '#ffffff'
  secondary-container: '#fdc73a'
  on-secondary-container: '#6f5400'
  tertiary: '#bc054a'
  on-tertiary: '#ffffff'
  tertiary-container: '#ff6586'
  on-tertiary-container: '#6a0026'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdad2'
  primary-fixed-dim: '#ffb4a3'
  on-primary-fixed: '#3d0600'
  on-primary-fixed-variant: '#8c1900'
  secondary-fixed: '#ffdf9a'
  secondary-fixed-dim: '#f4bf32'
  on-secondary-fixed: '#251a00'
  on-secondary-fixed-variant: '#5a4300'
  tertiary-fixed: '#ffd9dd'
  tertiary-fixed-dim: '#ffb2bd'
  on-tertiary-fixed: '#400013'
  on-tertiary-fixed-variant: '#900036'
  background: '#fff8f5'
  on-background: '#231a11'
  surface-variant: '#f2dfd1'
  background-cream: '#FFF8F0'
  success-mint: '#2EC4B6'
  error-red: '#E63946'
  surface-white: '#FFFFFF'
typography:
  display:
    fontFamily: Fredoka
    fontSize: 56px
    fontWeight: '600'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Fredoka
    fontSize: 40px
    fontWeight: '600'
    lineHeight: '1.2'
  headline-lg-mobile:
    fontFamily: Fredoka
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Fredoka
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '500'
    lineHeight: '1.6'
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  label-bold:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  container-max: 1280px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 48px
---

## Brand & Style

The design system embodies a vibrant, energetic, and slightly "silly" personality, moving away from typical minimalist cafe aesthetics toward a celebratory, hand-crafted feel. It centers on the concept of a "moment of delight," using tactile elements and playful illustrations to create a welcoming digital environment.

The visual style is a blend of **High-Contrast Bold** and **Tactile** design. It utilizes heavy "espresso" blacks to anchor bright citrus and berry tones. The aesthetic is defined by large, friendly rounded corners, expressive geometric typography, and hand-drawn doodle motifs (sprinkles, stars, and pastries) that serve as functional decorative breaks and emotional cues.

## Colors

The palette is built on a base of warm cream (`#FFF8F0`) to avoid the clinical feel of pure white, while using "Espresso Brown" (`#2B2118`) for high-contrast typography and structural borders.

**Key Palette Usage:**
- **Primary (Tangerine Coral):** Used for main CTAs, active navigation states, and large brand blocks. 
- **Secondary (Butter Yellow):** Applied to highlights, secondary actions, and hover states to add warmth.
- **Tertiary (Berry Pink):** Reserved for moments of high emphasis, such as celebratory "confetti" bursts and interactive accents.
- **Success/Error:** Mint Teal provides a fresh contrast for "confirmed" states, while a vibrant Red handles critical error feedback.

**Contrast Rule:** To ensure WCAG AA compliance, always pair Tangerine Coral or Butter Yellow with Espresso Brown for text. White text should only be used over Tangerine Coral for high-impact buttons.

## Typography

The typography strategy pairs the soft, rounded geometry of **Fredoka** for headings with the crisp, modern legibility of **Plus Jakarta Sans** for functional text. 

- **Headlines:** Use Fredoka for all display and section titles. It should feel chunky and friendly. For hero sections, use slightly tighter letter spacing to emphasize the "bold" look.
- **Body:** Plus Jakarta Sans provides a clean counterpoint to the playful headings, ensuring that menu descriptions and reservation details remain highly readable.
- **Labels:** Use the uppercase `label-bold` style for navigation, dietary tags, and small badges to create a distinct visual hierarchy against body paragraphs.

## Layout & Spacing

This design system utilizes a **Fluid Grid** with generous internal padding to create a sense of "airiness" despite the bold colors. 

- **Grid Model:** A 12-column system for desktop, collapsing to 2 columns for tablets and 1 column for mobile.
- **Rhythm:** An 8px base unit drives all spacing. Use 24px (3 units) for standard gutters and 48px-64px for vertical section spacing to allow the hand-drawn doodles space to "breathe" between blocks.
- **Safe Areas:** On mobile, margins reduce to 16px to maximize screen real estate for menu item cards, while desktop retains a wide 48px margin for a premium, boutique feel.

## Elevation & Depth

Hierarchy is established through **Tonal Layering** and **Tactile Shadows** rather than traditional material elevation.

- **Soft Tonal Shadows:** Instead of neutral grays, shadows are tinted with the primary coral color (`#FF6B4A`) at very low opacity (5-10%). This creates a glow-like effect that feels warm and integrated with the background.
- **Hard Outlines:** For high-impact elements like primary buttons or "featured" cards, use a 2px "Espresso" border combined with a slight offset (3px) to simulate a physical, sticker-like quality.
- **Layering:** Card surfaces are strictly white (`#FFFFFF`) to pop against the Cream background, providing a clean canvas for content and imagery.

## Shapes

The shape language is dominated by large, friendly radii. Elements should feel "squishy" and approachable.

- **Containers & Cards:** Use a 20px (`rounded-xl`) radius for all major components like menu cards, gallery items, and reservation modals.
- **Inputs & Small UI:** Use a 12px (`rounded-lg`) radius for form fields and search bars to maintain consistency with the larger containers while remaining functional.
- **Interactive Pills:** Buttons, dietary badges (Vegan, Gluten-Free), and testimonial avatars use a fully rounded (`rounded-full`) style to contrast against the more structured card shapes.

## Components

### Buttons
Primary buttons use the Tangerine Coral fill with white text and a subtle 2px Espresso bottom-border for a tactile "pressable" feel. Hover states should trigger a slight scale-up (1.05x) and an increase in the soft coral shadow.

### Cards
Cards (Menu, Blog, Testimonial) use the 20px roundedness and a white background. Menu cards should feature a prominent "secondary" yellow badge for pricing or dietary tags.

### Inputs & Date Pickers
Forms use the Cream background with a 2px Espresso border when focused. The Date/Time picker for reservations should highlight available dates in Butter Yellow and use Coral for the selected state.

### Toasts & Notifications
Success toasts are a brand signature—on booking completion, they should trigger a micro-burst animation of confetti (stars and dots in Coral and Pink) around the success icon.

### Illustrated Dividers
Frequent use of hand-drawn doodle illustrations (croissants, coffee trails) should be used as section dividers or background "floaters" to reinforce the energetic and silly brand feel.