import type { Config } from "tailwindcss";

// Tailwind v4 reads most theme values from the @theme block in app/globals.css.
// This file exists for editor tooling and dark-mode strategy only.
const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./hooks/**/*.{ts,tsx}"],
};

export default config;
