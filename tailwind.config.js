/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // UCF Colors
        'ucf-black': '#000000',
        'ucf-gold': '#FFCA06', // RGB 255, 202, 6
        'ucf-grey': '#6B7280',
        'ucf-white': '#FFFFFF',
        
        // Primary color scheme using UCF colors
        primary: {
          50: '#fff7e6',
          100: '#ffe8b3',
          200: '#ffd980',
          300: '#ffca4d',
          400: '#ffbb1a',
          500: '#ffca06', // UCF Gold
          600: '#e6b605',
          700: '#cc9f04',
          800: '#b38803',
          900: '#997102',
        },
        
        // Secondary colors
        secondary: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280', // UCF Grey
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
        },

        // Student portal ("au") palette. Status colors (green/blue/purple/red)
        // and text colors (navy/body/muted) intentionally reuse the standard
        // gray/green/blue/purple/red scales above/below since they match
        // exactly (e.g. navy #111827 === secondary-900, body #374151 ===
        // secondary-700). Only the gold accent and app background are new.
        au: {
          bg: '#f7f6f3',
          gold: '#ffb000',
          'gold-light': '#fff4dd',
          'gold-dark': '#995f00',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'bounce-in': 'bounceIn 0.6s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        bounceIn: {
          '0%': { transform: 'scale(0.3)', opacity: '0' },
          '50%': { transform: 'scale(1.05)' },
          '70%': { transform: 'scale(0.9)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
} 