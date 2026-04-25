/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Nunito", "sans-serif"],
      },
      colors: {
        primary: {
          DEFAULT: "#10B981",
          50: "#ECFDF5",
          100: "#D1FAE5",
          500: "#10B981",
          600: "#059669",
          700: "#047857",
        },
        secondary: {
          DEFAULT: "#3B82F6",
          50: "#EFF6FF",
          500: "#3B82F6",
          600: "#2563EB",
        },
        background: "#F8FAFC",
        card: "#FFFFFF",
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)",
        "card-hover": "0 4px 12px rgba(0,0,0,0.10), 0 2px 4px rgba(0,0,0,0.06)",
        glass: "0 8px 32px rgba(31,38,135,0.08)",
      },
      backgroundImage: {
        "brand-gradient": "linear-gradient(135deg, #10B981 0%, #3B82F6 100%)",
      },
    },
  },
  plugins: [],
};
