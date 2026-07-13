"use client";

import { createTheme } from "@mui/material/styles";
import { color, font, radius, spacing } from "./tokens";

// The theme is built entirely from tokens (app/tokens.ts). It carries no
// literal colors of its own — the one `var(--mui-palette-divider)` below is a
// token MUI generates from color.darkDivider / color.lightDivider.
const theme = createTheme({
  cssVariables: { colorSchemeSelector: "class" },
  spacing: spacing.unit,
  shape: { borderRadius: radius.base },
  colorSchemes: {
    dark: {
      palette: {
        primary: { main: color.brandGreen },
        secondary: { main: color.brandTan },
        background: { default: color.darkBg, paper: color.darkSurface },
        divider: color.darkDivider,
      },
    },
    light: {
      palette: {
        primary: { main: color.brandGreenDeep },
        secondary: { main: color.brandTanDeep },
        background: { default: color.lightBg, paper: color.lightSurface },
        divider: color.lightDivider,
      },
    },
  },
  typography: {
    fontFamily: font.body,
    h1: { fontFamily: font.display, fontWeight: 700, letterSpacing: "-0.02em" },
    h2: { fontFamily: font.display, fontWeight: 700, letterSpacing: "-0.02em" },
    h3: { fontFamily: font.display, fontWeight: 700, letterSpacing: "-0.02em" },
    h4: { fontFamily: font.display, fontWeight: 600, letterSpacing: "-0.01em" },
    h5: { fontFamily: font.display, fontWeight: 600 },
    h6: { fontFamily: font.display, fontWeight: 600 },
    button: { textTransform: "none", fontWeight: 600 },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        a: { color: "inherit", textDecoration: "none" },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { borderRadius: radius.button, paddingInline: 18, paddingBlock: 8 },
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
