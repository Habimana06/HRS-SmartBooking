/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#e6f0ff',
          100: '#b3d1ff',
          200: '#80b3ff',
          300: '#4d94ff',
          400: '#1a75ff',
          500: '#3366FF', // Royal Blue
          600: '#2952cc',
          700: '#1f3d99',
          800: '#142966',
          900: '#0a1433',
        },
        secondary: {
          50: '#f3f4f6',
          100: '#e5e7eb',
          200: '#d1d5db',
          300: '#9ca3af',
          400: '#6b7280',
          500: '#1F2937', // Neutral Dark
          600: '#111827',
          700: '#0f172a',
          800: '#0a0e1a',
          900: '#05070d',
        },
        accent: {
          50: '#d1fae5',
          100: '#a7f3d0',
          200: '#6ee7b7',
          300: '#34d399',
          400: '#10B981', // Green
          500: '#059669',
          600: '#047857',
          700: '#065f46',
          800: '#064e3b',
          900: '#022c22',
        },
        background: {
          light: '#F9FAFB',
          dark: '#111827',
        },
        text: {
          light: '#1F2937',
          dark: '#F3F4F6',
        },
      },
      fontFamily: {
        sans: ['Poppins', 'Inter', 'Nunito', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'xl': '14px',
        '2xl': '20px',
      },
      transitionDuration: {
        '300': '300ms',
      },
    },
  },
  plugins: [],
}
