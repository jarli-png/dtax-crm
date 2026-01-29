/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        dtax: {
          primary: '#2563eb',
          secondary: '#1e40af',
          accent: '#3b82f6',
          success: '#22c55e',
          warning: '#f59e0b',
          danger: '#ef4444',
          dark: '#1e293b',
          light: '#f8fafc',
        },
      },
    },
  },
  plugins: [],
}
