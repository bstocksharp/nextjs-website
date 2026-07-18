"use client";

import * as React from "react";
import Link from "next/link";
import Button from "@mui/material/Button";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Divider from "@mui/material/Divider";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import AppsIcon from "@mui/icons-material/Apps";
import { APPS, getApp } from "@/lib/apps";

// The subtle app switcher: the current app's name is a button that opens a menu
// of all apps (plus a link back to the Hub).
export default function AppSwitcher({ current }: { current: string }) {
  const app = getApp(current);
  const [anchor, setAnchor] = React.useState<null | HTMLElement>(null);
  const close = () => setAnchor(null);
  const CurrentIcon = app?.Icon ?? AppsIcon;

  return (
    <>
      <Button
        color="inherit"
        onClick={(e) => setAnchor(e.currentTarget)}
        startIcon={<CurrentIcon sx={{ color: "primary.main" }} />}
        endIcon={<KeyboardArrowDownIcon />}
        sx={{
          textTransform: "none",
          fontWeight: 800,
          fontFamily: "var(--font-display)",
          letterSpacing: "-0.01em",
          fontSize: "1.05rem",
        }}
      >
        {app?.name ?? "Bryce"}
      </Button>
      <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={close}>
        {APPS.map((a) => (
          <MenuItem
            key={a.slug}
            component={Link}
            href={a.href}
            onClick={close}
            selected={a.slug === current}
          >
            <ListItemIcon>
              <a.Icon fontSize="small" />
            </ListItemIcon>
            <ListItemText>{a.name}</ListItemText>
          </MenuItem>
        ))}
        <Divider />
        <MenuItem component={Link} href="/" onClick={close}>
          <ListItemIcon>
            <AppsIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>All apps</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
}
