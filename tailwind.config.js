/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['var(--font-display)', 'serif'],
        body: ['var(--font-body)', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      colors: {
        ink: {
          DEFAULT: '#0A0A0B',
          50: '#F5F5F5',
          100: '#E8E8E8',
          200: '#C8C8C8',
          300: '#A0A0A0',
          400: '#707070',
          500: '#404040',
          600: '#282828',
          700: '#1A1A1A',
          800: '#111111',
          900: '#0A0A0B',
        },
        lime: {
          DEFAULT: '#C8FF00',
          50: '#F7FFB3',
          100: '#EEFF80',
          200: '#DEFF40',
          300: '#C8FF00',
          400: '#A8D600',
          500: '#88AD00',
          600: '#688400',
          700: '#485B00',
        },
        coral: {
          DEFAULT: '#FF5C3A',
          light: '#FF8066',
          dark: '#D93E22',
        },
        slate: {
          glow: '#1C2940',
        }
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'slide-up': 'slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'fade-in': 'fadeIn 0.5s ease forwards',
        'spin-slow': 'spin 8s linear infinite',
        'marquee': 'marquee 20s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(200, 255, 0, 0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(200, 255, 0, 0.7)' },
        },
        slideUp: {
          from: { opacity: 0, transform: 'translateY(30px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: 0 },
          to: { opacity: 1 },
        },
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'noise': "url('/noise.svg')",
      },
    },
  },
  plugins: [],
}
