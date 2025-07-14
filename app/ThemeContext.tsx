import { ThemeProvider, createTheme } from "@mui/material/styles";

const lightColors = {
  main: "#668a4a",
  accent: "#d9767d",
  altAccent: "#034c3c",
  background: "#f2f4f6",
  text: "#170c1d",
};

const darkColors = {
  main: "#668a4a",
  accent: "#034c3c",
  altAccent: "#d9767d",
  background: "#170c1d",
  text: "#f2f4f6",
};

export default function MuiThemeProvider({
  children,
  darkMode,
}: {
  children: React.ReactNode;
  darkMode: boolean;
}) {
  const colors = darkMode ? darkColors : lightColors;

  const theme = createTheme({
    palette: {
      mode: darkMode ? "dark" : "light",
      primary: { main: colors.main },
      secondary: { main: colors.accent },
      background: {
        default: colors.background,
      },
      text: {
        primary: colors.text,
        secondary: colors.accent,
      },
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: "12px",
            fontWeight: "bold",
            padding: "12px 32px",
            textTransform: "none",
            backgroundColor: colors.accent,
            color: colors.text,
          },
        },
      },
    },
  });

  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
}
