"use client";

import * as React from "react";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { createAppTheme } from "./theme";

// The active profile's accent color arrives from the (server) root layout, so
// the theme is built with it during SSR — no flash of the default color — and
// rebuilt whenever it changes (e.g. switching profiles revalidates the layout).
export default function Providers({
  accentColor,
  children,
}: {
  accentColor?: string | null;
  children: React.ReactNode;
}) {
  const theme = React.useMemo(() => createAppTheme(accentColor), [accentColor]);

  return (
    <AppRouterCacheProvider options={{ key: "mui" }}>
      <ThemeProvider theme={theme} defaultMode="dark">
        <CssBaseline />
        {children}
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
}
