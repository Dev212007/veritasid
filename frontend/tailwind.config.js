/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        cyber: {
          50: "#f0fffe",
          100: "#ccfffe",
          200: "#99fffc",
          300: "#55fff8",
          400: "#00ffe7",
          500: "#00e5cf",
          600: "#00b8a9",
          700: "#009289",
          800: "#00736e",
          900: "#005f5b",
        },
        void: {
          900: "#020408",
          800: "#050d14",
          700: "#091420",
          600: "#0d1c2e",
          500: "#122438",
        },
      },
      fontFamily: {
        mono: ["'JetBrains Mono'", "monospace"],
        display: ["'Orbitron'", "sans-serif"],
        body: ["'Inter'", "sans-serif"],
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        float: "float 6s ease-in-out infinite",
        glow: "glow 2s ease-in-out infinite alternate",
        "scan-line": "scanLine 3s linear infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        glow: {
          from: { textShadow: "0 0 10px #00ffe7, 0 0 20px #00ffe7" },
          to: { textShadow: "0 0 20px #00ffe7, 0 0 40px #00ffe7, 0 0 60px #00ffe7" },
        },
        scanLine: {
          "0%": { top: "0%" },
          "100%": { top: "100%" },
        },
      },
      backgroundImage: {
        "grid-pattern": "linear-gradient(rgba(0,229,207,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,229,207,0.05) 1px, transparent 1px)",
        "radial-glow": "radial-gradient(ellipse at center, rgba(0,229,207,0.15) 0%, transparent 70%)",
      },
      backgroundSize: {
        grid: "50px 50px",
      },
      boxShadow: {
        cyber: "0 0 20px rgba(0,229,207,0.3), 0 0 40px rgba(0,229,207,0.1)",
        "cyber-sm": "0 0 10px rgba(0,229,207,0.2)",
        glass: "0 8px 32px rgba(0,0,0,0.4)",
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [],
};
