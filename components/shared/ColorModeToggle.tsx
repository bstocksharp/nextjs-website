"use client";

import * as React from "react";
import { useColorScheme } from "@mui/material/styles";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import DarkModeIcon from "@mui/icons-material/DarkModeOutlined";
import LightModeIcon from "@mui/icons-material/LightModeOutlined";

export default function ColorModeToggle() {
  const { mode, systemMode, setMode } = useColorScheme();
  const [mounted, setMounted] = React.useState(false);

  // useColorScheme() returns undefined values on the server / first paint;
  // wait for mount before rendering the resolved icon to avoid a hydration mismatch.
  React.useEffect(() => setMounted(true), []);

  const resolved = mode === "system" ? systemMode : mode;

  if (!mounted) {
    return (
      <IconButton size="small" disabled aria-label="Toggle color mode">
        <DarkModeIcon fontSize="small" />
      </IconButton>
    );
  }

  const isDark = resolved === "dark";
  return (
    <Tooltip title={isDark ? "Switch to light mode" : "Switch to dark mode"}>
      <IconButton
        size="small"
        color="inherit"
        aria-label="Toggle color mode"
        onClick={() => setMode(isDark ? "light" : "dark")}
      >
        {isDark ? (
          <LightModeIcon fontSize="small" />
        ) : (
          <DarkModeIcon fontSize="small" />
        )}
      </IconButton>
    </Tooltip>
  );
}
