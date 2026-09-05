import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#201826",
        paper: "#fbf7f1",
        porcelain: "#fffdf9",
        morada: "#61248f",
        grape: "#4b176f",
        sage: "#9aa58f",
        clay: "#b77f64"
      },
      fontFamily: {
        display: ["'Neue Haas Grotesk Display Pro'", "'Neue Haas Grotesk Display'", "'Haas Grot Text R Web'", "'Helvetica Neue'", "Arial", "ui-sans-serif", "system-ui", "sans-serif"],
        sans: ["'Neue Haas Grotesk Text Pro'", "'Neue Haas Grotesk Text'", "'Haas Grot Text R Web'", "'Helvetica Neue'", "Arial", "ui-sans-serif", "system-ui", "sans-serif"]
      },
      boxShadow: {
        soft: "0 18px 55px rgba(39, 24, 50, 0.10)"
      }
    }
  },
  plugins: []
} satisfies Config;
