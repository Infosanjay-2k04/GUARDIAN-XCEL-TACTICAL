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
        void: '#02050b',
        tactical: {
          darkest: '#040914',
          dark: '#081226',
          card: '#0d1d3a',
          cardHover: '#13284f',
          border: '#1a3a6c',
          borderActive: '#26549c',
          cyan: '#00f0ff',
          emerald: '#00ff9d',
          amber: '#ffb700',
          crimson: '#ff2255',
          muted: '#5c769d'
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Share Tech Mono', 'Courier New', 'monospace'],
        display: ['Chakra Petch', 'Orbitron', 'sans-serif']
      },
      boxShadow: {
        'cyan-glow': '0 0 15px rgba(0, 240, 255, 0.35)',
        'emerald-glow': '0 0 15px rgba(0, 255, 157, 0.35)',
        'crimson-glow': '0 0 15px rgba(255, 34, 85, 0.45)',
        'amber-glow': '0 0 15px rgba(255, 183, 0, 0.35)'
      },
      animation: {
        'radar-sweep': 'radarSweep 4s linear infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'scanline': 'scanline 8s linear infinite'
      },
      keyframes: {
        radarSweep: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' }
        },
        pulseGlow: {
          '0%, 100%': { opacity: '1', filter: 'drop-shadow(0 0 8px rgba(0, 240, 255, 0.6))' },
          '50%': { opacity: '0.6', filter: 'drop-shadow(0 0 2px rgba(0, 240, 255, 0.2))' }
        },
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(1000%)' }
        }
      }
    },
  },
  plugins: [],
}
