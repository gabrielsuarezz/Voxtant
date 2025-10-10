/**
 * Design tokens for Voxtant
 * Centralized theme configuration for consistent visual design
 */

export const tokens = {
  colors: {
    primary: {
      50: 'hsl(222, 47%, 95%)',
      100: 'hsl(222, 47%, 90%)',
      500: 'hsl(222, 47%, 11%)',
      600: 'hsl(222, 47%, 9%)',
      700: 'hsl(222, 47%, 7%)',
    },
    surface: {
      base: 'hsl(0, 0%, 100%)',
      elevated: 'hsl(0, 0%, 98%)',
      hover: 'hsl(210, 40%, 96%)',
    },
    accent: {
      blue: 'hsl(217, 91%, 60%)',
      green: 'hsl(142, 71%, 45%)',
      purple: 'hsl(262, 83%, 58%)',
      orange: 'hsl(25, 95%, 53%)',
    },
    success: 'hsl(142, 71%, 45%)',
    warning: 'hsl(38, 92%, 50%)',
    error: 'hsl(0, 84%, 60%)',
  },
  spacing: {
    xs: '0.25rem',   // 4px
    sm: '0.5rem',    // 8px
    md: '1rem',      // 16px
    lg: '1.5rem',    // 24px
    xl: '2rem',      // 32px
    '2xl': '3rem',   // 48px
    '3xl': '4rem',   // 64px
  },
  radius: {
    sm: '0.25rem',   // 4px
    md: '0.5rem',    // 8px
    lg: '0.75rem',   // 12px
    xl: '1rem',      // 16px
    full: '9999px',
  },
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  },
  transitions: {
    fast: '150ms ease',
    base: '200ms ease',
    slow: '300ms ease',
  },
} as const;
