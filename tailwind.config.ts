import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        amber: { glow: '#ffb454', dim: '#5a4020' },
        night: { 950: '#0a0b12', 900: '#12141f', 800: '#1b1e2d' },
      },
      keyframes: {
        breathe: {
          '0%, 100%': { opacity: '0.85', filter: 'brightness(1)' },
          '50%': { opacity: '1', filter: 'brightness(1.15)' },
        },
        fog: {
          '0%, 100%': { opacity: '0.3' },
          '50%': { opacity: '0.7' },
        },
        drift: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        rainfall: {
          '0%': { backgroundPosition: '0 0' },
          '100%': { backgroundPosition: '0 200px' },
        },
      },
      animation: {
        breathe: 'breathe 4s ease-in-out infinite',
        fog: 'fog 2.2s ease-in-out infinite',
        drift: 'drift 40s linear infinite',
        driftSlow: 'drift 90s linear infinite',
        rain: 'rainfall 0.6s linear infinite',
      },
    },
  },
  plugins: [],
};
export default config;
