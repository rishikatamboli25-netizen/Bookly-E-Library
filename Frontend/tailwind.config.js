/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],

  theme: {
    extend: {
      fontFamily: {
        sans: ["Plus Jakarta Sans", "sans-serif"],
      },

      colors: {
        // Brand
        brand: {
          DEFAULT: "#7C3AED",
          hover: "#6D28D9",
          light: "#f2e5ff ",
        },

        // Backgrounds
        background: {
          main: "#F8FAFC",
          card: "#FFFFFF",
          dark: "#0F172A",
        },

        // Cards
        card: {
          dark: "#1E293B",
        },

        // Hover
        hover: {
          dark: "#334155",
        },

        // Borders
        border: {
          light: "#E2E8F0",
        },

        // Text
        text: {
          primary: "#0F172A",
          secondary: "#64748B",
          white: "#F8FAFC",
        },

        // Status
        success: "#22C55E",
        info: "#2563EB",
        warning: "#F59E0B",
        danger: "#EF4444",

        // Notes
        notes: "#EAB308",

        
      },
    },
  },

  plugins: [
        function ({ addUtilities }) {
      addUtilities({
        ".scrollbar-hide": {
          "-ms-overflow-style": "none",
          "scrollbar-width": "none",
        },

        ".scrollbar-hide::-webkit-scrollbar": {
          display: "none",
        },
      });
    },
  ],
};