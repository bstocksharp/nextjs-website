import type { ComponentType } from "react";
import type { SvgIconProps } from "@mui/material/SvgIcon";
import GarageIcon from "@mui/icons-material/Garage";
import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";

// The registry of sub-apps in the hub. Add an app here (plus its route folder)
// and it shows up in the Hub launcher and the header app-switcher automatically.
export type AppDef = {
  slug: string;
  name: string;
  tagline: string;
  href: string;
  Icon: ComponentType<SvgIconProps>;
  accent: string;
};

export const APPS: AppDef[] = [
  {
    slug: "garage",
    name: "Bryce's Garage",
    tagline: "Cars, maintenance & the Miata build",
    href: "/garage",
    Icon: GarageIcon,
    accent: "#4caf7d",
  },
  {
    slug: "workout",
    name: "Workout",
    tagline: "Tonight's exercises, with timers",
    href: "/workout",
    Icon: FitnessCenterIcon,
    accent: "#e0864f",
  },
];

export function getApp(slug: string): AppDef | undefined {
  return APPS.find((a) => a.slug === slug);
}
