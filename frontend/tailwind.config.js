import plugin from 'tailwindcss/plugin.js';

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
        midnight: '#020617',
        'ocean-navy': '#0F172A',
        'research-blue': '#1E3A8A',
        'ice-cyan': '#38BDF8',
        'ice-tint': '#F0F9FF',
        'ice-light': '#F8FAFC',
        'slate-border': '#334155',
        'slate-light-border': '#CBD5E1',
        'route-safe': '#22C55E',
        'route-fuel': '#3B82F6',
        'route-short': '#F59E0B',
        'iceberg-red': '#F87171',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
      boxShadow: {
        'glow-cyan': '0 0 20px -3px rgba(56, 189, 248, 0.35)',
        'glow-blue': '0 0 25px -3px rgba(30, 58, 138, 0.45)',
      }
    },
  },
  plugins: [
    plugin(function({ addVariant }) {
      addVariant('light', ':is(.light, .light *) &');
    }),
  ],
}

