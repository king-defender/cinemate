---
name: CineMate
colors:
  surface: '#0b1326'
  surface-dim: '#0b1326'
  surface-bright: '#31394d'
  surface-container-lowest: '#060e20'
  surface-container-low: '#131b2e'
  surface-container: '#171f33'
  surface-container-high: '#222a3d'
  surface-container-highest: '#2d3449'
  on-surface: '#dae2fd'
  on-surface-variant: '#e9bcb6'
  inverse-surface: '#dae2fd'
  inverse-on-surface: '#283044'
  outline: '#af8782'
  outline-variant: '#5e3f3b'
  surface-tint: '#ffb4aa'
  primary: '#ffb4aa'
  on-primary: '#690003'
  primary-container: '#e50914'
  on-primary-container: '#fff7f6'
  inverse-primary: '#c0000c'
  secondary: '#c0c1ff'
  on-secondary: '#1000a9'
  secondary-container: '#3131c0'
  on-secondary-container: '#b0b2ff'
  tertiary: '#4edea3'
  on-tertiary: '#003824'
  tertiary-container: '#00835a'
  on-tertiary-container: '#e8ffef'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffdad5'
  primary-fixed-dim: '#ffb4aa'
  on-primary-fixed: '#410001'
  on-primary-fixed-variant: '#930007'
  secondary-fixed: '#e1e0ff'
  secondary-fixed-dim: '#c0c1ff'
  on-secondary-fixed: '#07006c'
  on-secondary-fixed-variant: '#2f2ebe'
  tertiary-fixed: '#6ffbbe'
  tertiary-fixed-dim: '#4edea3'
  on-tertiary-fixed: '#002113'
  on-tertiary-fixed-variant: '#005236'
  background: '#0b1326'
  on-background: '#dae2fd'
  surface-variant: '#2d3449'
  cinema-red: '#E50914'
  neon-indigo: '#6366F1'
  slate-900: '#0F172A'
  slate-800: '#1E293B'
  glass-border: rgba(255, 255, 255, 0.1)
  success-green: '#10B981'
typography:
  display:
    fontFamily: Montserrat
    fontSize: 48px
    fontWeight: '800'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Montserrat
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
  headline-lg-mobile:
    fontFamily: Montserrat
    fontSize: 24px
    fontWeight: '700'
    lineHeight: '1.2'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  margin-page: 2rem
  gutter: 1.5rem
  container-max: 1280px
  interaction-gap: 0.75rem
  section-gap: 4rem
---

## Brand & Style
The design system for CineMate is built on a **Modern Cinematic** aesthetic, blending the high-fidelity polish of premium streaming platforms with the high-energy pulse of a social community hub. The brand personality is professional yet exciting, designed to fade into the background when content is playing while standing out during social discovery and matching.

The visual style utilizes **Glassmorphism** and **Minimalism** to create depth without clutter. By using deep charcoals as a base, we ensure a "lights-out" environment that prioritizes the media, while vibrant neon accents provide the necessary energy for social interactions. This system evokes a sense of "premium togetherness," making a remote movie night feel like a front-row event.

## Colors
The palette is dominated by **Slate 900** and **Slate 800** to maintain a cinematic, low-light environment. **Cinema Red** is the primary driver for high-priority actions (e.g., "Join Room," "Go Live"), while **Neon Indigo** serves as the secondary social accent for buddy matching, chat notifications, and community features.

Interactive elements use a "glass" approach: semi-transparent backgrounds with a subtle `1px` white border at 10% opacity. This allows the background (whether it's a movie poster or a subtle gradient) to peek through, adding texture and depth.

## Typography
We use **Montserrat** for all high-impact headings to convey authority and excitement. Its geometric build feels modern and aligns with the cinematic theme. For body text and metadata, **Inter** provides maximum legibility, especially in the compact Real-time Chat and Presence List areas.

For "Display" and "Headline" levels, we use tighter letter spacing to create a more compact, high-fidelity look. Labels and metadata use uppercase styling with increased letter spacing to ensure they remain distinct from body content.

## Layout & Spacing
The layout follows a **Fixed Grid** system for dashboards and landing pages to ensure content remains centered and readable on ultra-wide monitors. However, within the **Room** view, we transition to a **Fluid Grid** to maximize video real estate while pinning the Chat Panel to the right.

- **Desktop (1280px+):** 12-column grid with 24px gutters.
- **Tablet (768px - 1279px):** 8-column grid with 16px gutters; Chat Panel collapses into a bottom sheet or a toggle-able overlay.
- **Mobile (<768px):** 4-column grid with 16px margins.

We use a "Dual-Rhythm" spacing strategy: generous whitespace (`4rem+`) between major sections to let content breathe, but tight internal padding (`0.75rem`) for interaction areas like the chat input, buddy cards, and sync controls to keep the UI feeling focused and responsive.

## Elevation & Depth
In a dark-mode-first system, depth is created through **Tonal Layering** and **Backdrop Blurs**.
- **Surface 0 (Background):** Solid Slate 900.
- **Surface 1 (Cards/Panels):** Slate 800 with a subtle `1px` border.
- **Surface 2 (Popovers/Modals):** Glassmorphic surfaces with a 12px blur and a subtle 15% opacity Indigo or Red glow (Ambient Shadow) to signify active state.

Shadows should be large and highly diffused (e.g., `box-shadow: 0 20px 40px rgba(0,0,0,0.4)`) to avoid looking "muddy" against the dark background.

## Shapes
We use a **Rounded** (0.5rem) language to balance the "professional" and "social" aspects of the brand. Sharp corners feel too corporate, while full pills feel too casual for a cinematic app.
- **Standard UI Elements:** 0.5rem (Buttons, Inputs, Cards).
- **Large Containers:** 1rem (Modals, Room Player).
- **User Avatars:** Always circular to distinguish people from content.

## Components
- **Buttons:** Primary buttons use a linear gradient of `Cinema Red` to a slightly darker shade. Secondary buttons use the `Glass-border` style with a blur background.
- **BuddyRequestCard:** Features a split design—top half for user info, bottom half for "matching" tags. Use a subtle `Neon Indigo` glow when a request is "New."
- **ChatPanel:** Messages are compact. Use "Glass" styling for the input field. Self-messages are highlighted with a subtle Indigo background; others remain Slate 800.
- **Playback Controls:** Minimalist icons. The progress bar should use the `Cinema Red` for the "played" portion and a translucent white for the "buffered" portion.
- **Badges:** Small, circular icons with a metallic gradient finish. Each badge should have a tooltip explaining the "Rule" (e.g., "10 Rooms Hosted").
- **PresenceList:** Small circular avatars with a `Success Green` ring for "Online" and a `Cinema Red` pulse if the user is currently the "Host" of the room.