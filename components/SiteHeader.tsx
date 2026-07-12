"use client";

import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import GarageIcon from "@mui/icons-material/Garage";
import ColorModeToggle from "./ColorModeToggle";

export default function SiteHeader() {
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
      <Toolbar>
        <GarageIcon sx={{ mr: 1.5, color: "primary.main" }} />
        <Typography
          variant="h6"
          component="div"
          sx={{
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            letterSpacing: "-0.01em",
          }}
        >
          Bryce&apos;s Garage
        </Typography>
        <Box sx={{ flexGrow: 1 }} />
        <ColorModeToggle />
      </Toolbar>
    </AppBar>
  );
}
