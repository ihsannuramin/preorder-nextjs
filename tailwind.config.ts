import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Brand Guideline v1.1 §12.2 — Opsi B: POHub Blue sebagai identitas UI.
        // Rasio: 60% putih/netral, 25% biru, 10% teal, 5% orange.
        primary: {
          DEFAULT: "#2563EB",
          foreground: "#FFFFFF",
          "50": "#EFF6FF",
          "100": "#DBEAFE",
          "200": "#BFDBFE",
          "300": "#93C5FD",
          "400": "#60A5FA",
          "500": "#3B82F6",
          "600": "#2563EB",
          "700": "#1D4ED8",
          "800": "#1E40AF",
          "900": "#1E3A8A",
        },
        secondary: {
          DEFAULT: "#111827",
          foreground: "#FFFFFF",
        },
        neutral: {
          DEFAULT: "#6B7280",
        },
        surface: {
          DEFAULT: "#FFFFFF",
          muted: "#F9FAFB",
        },
        // Teal = beres / lunas / untung. Teks di atas teal solid pakai charcoal.
        success: {
          DEFAULT: "#14B8A6",
          foreground: "#111827",
          "50": "#F0FDFA",
          "100": "#CCFBF1",
          "200": "#99F6E4",
          "700": "#0F766E",
        },
        // Orange = perlu perhatian. Jangan dipakai untuk hal positif.
        warning: {
          DEFAULT: "#F59E0B",
          foreground: "#111827",
          "50": "#FFFBEB",
          "100": "#FEF3C7",
          "200": "#FDE68A",
          "700": "#B45309",
        },
        // Merah sistem (bukan warna brand) = ditolak / gagal / rugi.
        error: {
          DEFAULT: "#DC2626",
          foreground: "#FFFFFF",
          "50": "#FEF2F2",
          "100": "#FEE2E2",
          "200": "#FECACA",
          "700": "#B91C1C",
        },
        info: { DEFAULT: "#2563EB", foreground: "#FFFFFF" },
        background: "#FFFFFF",
        card: { DEFAULT: "#FFFFFF", foreground: "#111827" },
        border: "#E5E7EB",
        "border-strong": "#D1D5DB",
        input: "#E5E7EB",
        ring: "#2563EB",
        foreground: "#111827",
        muted: { DEFAULT: "#F3F4F6", foreground: "#6B7280" },
        destructive: { DEFAULT: "#DC2626", foreground: "#FFFFFF" },
        accent: { DEFAULT: "#EFF6FF", foreground: "#1D4ED8" },
        popover: { DEFAULT: "#FFFFFF", foreground: "#111827" },
      },
      fontFamily: {
        sans: ["var(--font-plus-jakarta-sans)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        button: "9999px",
        input: "9999px",
        card: "12px",
        chip: "9999px",
        modal: "24px",
        drawer: "24px",
        lg: "16px",
        md: "8px",
        sm: "4px",
      },
      maxWidth: {
        landing: "1280px",
        dashboard: "1440px",
        form: "720px",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.95)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        "bounce-in": {
          "0%": { opacity: "0", transform: "scale(0.85)" },
          "60%": { transform: "scale(1.04)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        wiggle: {
          "0%, 100%": { transform: "rotate(-2deg)" },
          "50%": { transform: "rotate(2deg)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.2s ease-out",
        "slide-up": "slide-up 0.2s ease-out",
        "scale-in": "scale-in 0.15s ease-out",
        "bounce-in": "bounce-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
        wiggle: "wiggle 0.3s ease-in-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
