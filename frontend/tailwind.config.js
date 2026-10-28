/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Warm-white surface
        surface: {
          DEFAULT: '#fafaf9',
          1: '#f5f5f4',
          2: '#e7e5e4',
        },
        // Charcoal text
        ink: {
          DEFAULT: '#1c1917',
          light: '#44403c',
          muted: '#78716c',
          faint: '#a8a29e',
        },
        // Indigo accent
        accent: {
          DEFAULT: '#4f46e5',
          light: '#6366f1',
          subtle: '#e0e7ff',
          muted: '#c7d2fe',
        },
        // Status
        status: {
          todo: '#78716c',
          in_progress: '#2563eb',
          submitted: '#7c3aed',
          in_review: '#d97706',
          revision: '#dc2626',
          approved: '#16a34a',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      fontSize: {
        '2xs': '0.625rem',
        xs: '0.75rem',
        sm: '0.8125rem',
        base: '0.875rem',
        md: '0.9375rem',
        lg: '1rem',
        xl: '1.125rem',
        '2xl': '1.25rem',
        '3xl': '1.5rem',
      },
      spacing: {
        sidebar: '220px',
      },
      boxShadow: {
        sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.08), 0 1px 2px -1px rgb(0 0 0 / 0.06)',
        md: '0 4px 6px -1px rgb(0 0 0 / 0.07), 0 2px 4px -2px rgb(0 0 0 / 0.05)',
        none: 'none',
      },
      borderRadius: {
        sm: '3px',
        DEFAULT: '4px',
        md: '6px',
        lg: '8px',
        xl: '12px',
      },
    },
  },
  plugins: [],
};
