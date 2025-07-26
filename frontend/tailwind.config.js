/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["Inter", "sans-serif"],
      },
      colors: {
        primary: '#3B82F6',
        secondary: '#A78BFA', 
        success: '#22C55E',
        danger: '#F43F5E',
        ai: '#10b981',
        cancel: '#808080',
        background: '#F9FAFB',
        surface: '#FFFFFF',
        'text-main': '#22223B',
        'text-subtle': '#64748B',
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(to right, #3b82f6, #2563eb)',
        'gradient-success': 'linear-gradient(to right, #16a34a, #15803d)',
        'gradient-add': 'linear-gradient(to right, #22c55e, #16a34a)',
        'gradient-danger': 'linear-gradient(to right, #f43f5e, #dc2626)',
        'gradient-ai': 'linear-gradient(to right, #10b981, #059669)',
        'gradient-cancel': 'linear-gradient(to right, #6b7280, #4b5563)',
      }
    },
  },
  plugins: [],
}
