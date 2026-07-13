// ─────────────────────────────────────────────────────────────────────────────
// DESIGN TOKENS — the single source of truth for the app's look.
//
// Change a value here and it flows into the MUI theme (app/theme.ts), which
// generates the CSS variables (--mui-palette-*) used by every component.
// Nothing elsewhere should hardcode a color / font / radius — reference these.
// ─────────────────────────────────────────────────────────────────────────────

export const color = {
  // Brand
  brandGreen: "#4caf7d", // British Racing Green-inspired — primary (dark mode)
  brandGreenDeep: "#2e7d55", // deeper green for light-mode contrast
  brandTan: "#d8b384", // secondary (dark mode)
  brandTanDeep: "#a97c43", // deeper tan for light mode

  // Dark color scheme
  darkBg: "#0e1214",
  darkSurface: "#161b1e",
  darkDivider: "rgba(255, 255, 255, 0.09)",

  // Light color scheme
  lightBg: "#f5f4ef",
  lightSurface: "#ffffff",
  lightDivider: "rgba(0, 0, 0, 0.10)",
} as const;

export const font = {
  // The --font-* variables are provided by next/font in app/layout.tsx.
  display: "var(--font-display), system-ui, sans-serif",
  body: "var(--font-body), system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
} as const;

export const radius = {
  base: 12, // theme.shape.borderRadius — cards, paper, inputs
  button: 10,
} as const;

export const spacing = {
  unit: 8, // theme.spacing(1) === 8px; gaps/margins derive from this
} as const;
