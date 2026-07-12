"use client";

import { createTheme } from "@mui/material/styles";

// Font CSS variables are provided by next/font in app/layout.tsx.
const display = "var(--font-display), system-ui, sans-serif";
const body =
  "var(--font-body), system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";

// Brand tokens — British Racing Green + tan, tuned per color scheme for contrast.
const brand = {
  greenDark: "#4caf7d",
  greenLight: "#2e7d55",
  tanDark: "#d8b384",
  tanLight: "#a97c43",
};

const theme = createTheme({
  cssVariables: { colorSchemeSelector: "class" },
  colorSchemes: {
    dark: {
      palette: {
        primary: { main: brand.greenDark },
        secondary: { main: brand.tanDark },
        background: { default: "#0e1214", paper: "#161b1e" },
        divider: "rgba(255,255,255,0.09)",
      },
    },
    light: {
      palette: {
        primary: { main: brand.greenLight },
        secondary: { main: brand.tanLight },
        background: { default: "#f5f4ef", paper: "#ffffff" },
        divider: "rgba(0,0,0,0.10)",
      },
    },
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: body,
    h1: { fontFamily: display, fontWeight: 700, letterSpacing: "-0.02em" },
    h2: { fontFamily: display, fontWeight: 700, letterSpacing: "-0.02em" },
    h3: { fontFamily: display, fontWeight: 700, letterSpacing: "-0.02em" },
    h4: { fontFamily: display, fontWeight: 600, letterSpacing: "-0.01em" },
    h5: { fontFamily: display, fontWeight: 600 },
    h6: { fontFamily: display, fontWeight: 600 },
    button: { textTransform: "none", fontWeight: 600 },
  },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { borderRadius: 10, paddingInline: 18, paddingBlock: 8 },
      },
    },
    MuiPaper: {
      styleOverrides: { root: { backgroundImage: "none" } },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          border: "1px solid var(--mui-palette-divider)",
        },
      },
    },
    MuiAppBar: {
      defaultProps: { elevation: 0 },
    },
  },
});

export default theme;
