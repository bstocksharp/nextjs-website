import type { ComponentType } from "react";
import type { SvgIconProps } from "@mui/material/SvgIcon";
import GarageIcon from "@mui/icons-material/Garage";
import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";

// The registry of sub-apps in the hub. Add an app here (plus its route folder)
// and it shows up in the Hub launcher and the header app-switcher automatically.
export type AppNavLink = { label: string; href: string };

export type AppDef = {
  slug: string;
  name: string;
  tagline: string;
  href: string;
  Icon: ComponentType<SvgIconProps>;
  accent: string;
  /** In-app header links. Single source of truth — the header + AppSwitcher
   *  read these, so a layout never re-declares its own nav. */
  nav?: AppNavLink[];
};

export const APPS: AppDef[] = [
  {
    slug: "garage",
    name: "Garage",
    tagline: "Cars, maintenance & the Miata build",
    href: "/garage",
    Icon: GarageIcon,
    accent: "#4caf7d",
    nav: [{ label: "Bible", href: "/garage/bible" }],
  },
  {
    slug: "workout",
    name: "Workout",
    tagline: "Tonight's exercises, with timers",
    href: "/workout",
    Icon: FitnessCenterIcon,
    accent: "#e0864f",
    nav: [
      { label: "Today", href: "/workout/today" },
      { label: "Week", href: "/workout" },
      { label: "Catalog", href: "/workout/catalog" },
    ],
  },
];

export function getApp(slug: string): AppDef | undefined {
  return APPS.find((a) => a.slug === slug);
}

/**
 * The apps a profile should see, given the slugs they've hidden. Hiding is a
 * personal preference, not a permission (the hub has no roles). If a profile
 * somehow hid every app, we fall back to showing all of them so the hub is
 * never a dead end.
 */
export function visibleApps(hidden: string[] = []): AppDef[] {
  const shown = APPS.filter((a) => !hidden.includes(a.slug));
  return shown.length > 0 ? shown : APPS;
}
