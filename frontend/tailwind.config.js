/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        command: {
          950: "#060816",
          900: "#0b1020",
          850: "#11182b",
          800: "#172033",
          700: "#22324a",
        },
      },
      boxShadow: {
        panel: "0 20px 45px rgba(2, 6, 23, 0.45)",
      },
    },
  },
  plugins: [],
};
