"use client";

import * as React from "react";
import Link from "next/link";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import GarageIcon from "@mui/icons-material/Garage";
import ColorModeToggle from "./ColorModeToggle";

export default function SiteHeader({
  editControl,
}: {
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
      <Toolbar sx={{ gap: 1 }}>
        <Box
          component={Link}
          href="/"
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            color: "inherit",
            textDecoration: "none",
            "&:hover": { opacity: 0.85 },
          }}
        >
          <GarageIcon sx={{ color: "primary.main" }} />
          <Typography
            variant="h6"
            component="span"
            sx={{ fontWeight: 700, letterSpacing: "-0.01em" }}
          >
            Bryce&apos;s Garage
          </Typography>
        </Box>
        <Button
          component={Link}
          href="/bible"
          color="inherit"
          size="small"
          sx={{ ml: 0.5 }}
        >
          Bible
        </Button>
        <Box sx={{ flexGrow: 1 }} />
        <ColorModeToggle />
        {editControl}
      </Toolbar>
    </AppBar>
  );
}
