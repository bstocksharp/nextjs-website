"use client";

import * as React from "react";
import Link from "next/link";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import ColorModeToggle from "@/components/shared/ColorModeToggle";
import AppSwitcher from "@/components/shared/AppSwitcher";

// Shared header used by each sub-app. The app-switcher gives it identity + a way
// to hop between apps; `nav` holds app-specific links; `editControl` is the
// (server-rendered) lock/unlock control.
export default function AppHeader({
  current,
  nav = [],
  editControl,
}: {
  current: string;
  nav?: { label: string; href: string }[];
  editControl?: React.ReactNode;
}) {
  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        bgcolor: "background.paper",
        color: "text.primary",
        borderBottom: "1px solid",
        borderColor: "divider",
      }}
    >
      <Toolbar sx={{ gap: 0.5 }}>
        <AppSwitcher current={current} />
        {nav.map((n) => (
          <Button
            key={n.href}
            component={Link}
            href={n.href}
            color="inherit"
            size="small"
          >
            {n.label}
          </Button>
        ))}
        <Box sx={{ flexGrow: 1 }} />
        <ColorModeToggle />
        {editControl}
      </Toolbar>
    </AppBar>
  );
}
