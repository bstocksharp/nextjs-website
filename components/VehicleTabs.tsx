"use client";

import Link from "next/link";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";

// URL-driven tabs: each tab is a link to a query param on the vehicle page, so
// switching tabs is a server navigation that loads only that tab's data and is
// bookmarkable. `active` comes from the server (searchParams).
export default function VehicleTabs({
  vehicleId,
  active,
}: {
  vehicleId: number;
  active: string;
}) {
  const base = `/garage/${vehicleId}`;

  return (
    <Tabs
      value={active}
      variant="scrollable"
      scrollButtons="auto"
      allowScrollButtonsMobile
      sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}
    >
      <Tab label="Overview" value="overview" component={Link} href={base} />
      <Tab
        label="Maintenance"
        value="maintenance"
        component={Link}
        href={`${base}?tab=maintenance`}
      />
      <Tab
        label="Fuel"
        value="fuel"
        component={Link}
        href={`${base}?tab=fuel`}
      />
      <Tab
        label="Parts"
        value="parts"
        component={Link}
        href={`${base}?tab=parts`}
      />
      <Tab
        label="Build"
        value="build"
        component={Link}
        href={`${base}?tab=build`}
      />
    </Tabs>
  );
}
