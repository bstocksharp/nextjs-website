"use client";

import * as React from "react";
import Link from "next/link";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import BuildOutlinedIcon from "@mui/icons-material/BuildOutlined";
import LocalGasStationOutlinedIcon from "@mui/icons-material/LocalGasStationOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";

// Quick-actions menu that overlays the top-right of a vehicle card. Sits
// outside the card's link, and stops click propagation so opening the menu
// never triggers navigation to the vehicle.
export default function VehicleCardMenu({ vehicleId }: { vehicleId: number }) {
  const [anchor, setAnchor] = React.useState<null | HTMLElement>(null);

  const close = () => setAnchor(null);

  const actions = [
    {
      href: `/garage/${vehicleId}/maintenance/new`,
      label: "Add maintenance",
      icon: <BuildOutlinedIcon fontSize="small" />,
    },
    {
      href: `/garage/${vehicleId}/fuel/new`,
      label: "Add fuel",
      icon: <LocalGasStationOutlinedIcon fontSize="small" />,
    },
    {
      href: `/garage/${vehicleId}/edit`,
      label: "Edit vehicle",
      icon: <EditOutlinedIcon fontSize="small" />,
    },
  ];

  return (
    <>
      <IconButton
        aria-label="Quick actions"
        size="small"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setAnchor(e.currentTarget);
        }}
        sx={{ position: "absolute", top: 6, right: 6, zIndex: 2 }}
      >
        <MoreVertIcon fontSize="small" />
      </IconButton>
      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={close}
        onClick={(e) => e.stopPropagation()}
      >
        {actions.map((a) => (
          <MenuItem
            key={a.href}
            component={Link}
            href={a.href}
            onClick={close}
          >
            <ListItemIcon>{a.icon}</ListItemIcon>
            <ListItemText>{a.label}</ListItemText>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
