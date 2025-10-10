/**
 * Design tokens for Voxtant
 * Space grey theme with vibrant accents for 2025
 */

export const tokens = {
  colors: {
    // Space grey background palette
    space: {
      900: 'hsl(220, 13%, 9%)',     // Darkest - main background #13151a
      800: 'hsl(220, 12%, 12%)',    // Card background #1a1d24
      700: 'hsl(220, 11%, 18%)',    // Elevated surfaces #282c36
      600: 'hsl(220, 10%, 25%)',    // Hover states
      500: 'hsl(220, 9%, 35%)',     // Borders
    },
    // Electric blue accent - pops against dark background
    primary: {
      50: 'hsl(210, 100%, 95%)',
      100: 'hsl(210, 100%, 90%)',
      400: 'hsl(210, 100%, 60%)',
      500: 'hsl(210, 100%, 55%)',  // Main accent - #0a84ff
      600: 'hsl(210, 100%, 50%)',
      700: 'hsl(210, 100%, 45%)',
    },
    // Vibrant teal for tech/voice elements
    teal: {
      400: 'hsl(175, 80%, 50%)',
      500: 'hsl(175, 85%, 45%)',   // #0abab5
      600: 'hsl(175, 90%, 40%)',
    },
    // Vibrant purple for creativity
    purple: {
      400: 'hsl(270, 75%, 65%)',
      500: 'hsl(270, 80%, 60%)',   // #a855f7
      600: 'hsl(270, 85%, 55%)',
    },
    // Neutral greys for text
    neutral: {
      50: 'hsl(220, 20%, 98%)',    // Almost white text
      100: 'hsl(220, 15%, 92%)',   // Light text
      200: 'hsl(220, 13%, 85%)',   // Muted text
      300: 'hsl(220, 12%, 70%)',
      400: 'hsl(220, 11%, 55%)',
      500: 'hsl(220, 10%, 40%)',
      600: 'hsl(220, 11%, 30%)',
      700: 'hsl(220, 12%, 20%)',
      800: 'hsl(220, 12%, 15%)',
      900: 'hsl(220, 13%, 10%)',
    },
    // Surface colors for glassmorphism on dark background
    surface: {
      base: 'rgba(26, 29, 36, 0.95)',       // Dark glass
      glass: 'rgba(26, 29, 36, 0.6)',       // More transparent
      glassBorder: 'rgba(255, 255, 255, 0.08)',  // Subtle border
      elevated: 'rgba(40, 44, 54, 0.9)',    // Elevated surface
      hover: 'rgba(40, 44, 54, 0.7)',
    },
    // Semantic colors adjusted for dark theme
    success: 'hsl(142, 70%, 50%)',
    warning: 'hsl(38, 92%, 55%)',
    error: 'hsl(0, 80%, 65%)',
  },
  spacing: {
    xs: '0.25rem',   // 4px
    sm: '0.5rem',    // 8px
    md: '1rem',      // 16px
    lg: '1.5rem',    // 24px
    xl: '2rem',      // 32px
    '2xl': '3rem',   // 48px
    '3xl': '4rem',   // 64px
    '4xl': '6rem',   // 96px
  },
  radius: {
    sm: '0.5rem',    // 8px - Apple style rounded
    md: '0.75rem',   // 12px
    lg: '1rem',      // 16px
    xl: '1.25rem',   // 20px
    '2xl': '1.5rem', // 24px
    full: '9999px',
  },
  shadows: {
    sm: '0 1px 3px 0 rgb(0 0 0 / 0.05), 0 1px 2px 0 rgb(0 0 0 / 0.03)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.07), 0 2px 4px -1px rgb(0 0 0 / 0.04)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.08), 0 4px 6px -2px rgb(0 0 0 / 0.03)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.08), 0 10px 10px -5px rgb(0 0 0 / 0.02)',
    glass: '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
  },
  transitions: {
    fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
    base: '250ms cubic-bezier(0.4, 0, 0.2, 1)',
    slow: '400ms cubic-bezier(0.4, 0, 0.2, 1)',
  },
  blur: {
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
  },
} as const;
