import type { MetadataRoute } from "next";
import { getActiveProfile } from "@/lib/profile";

// Web app manifest → makes the hub installable ("Add to Home Screen") and run
// standalone. Name + accent follow the ACTIVE profile, so an install is
// personalized (captured at install time, like the icon — not live).
export const dynamic = "force-dynamic";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const active = await getActiveProfile();
  const who = active?.name ?? "Hub";

  return {
    name: who,
    short_name: who,
    description:
      "A personal hub of small apps — a garage tracker, the Miata Bible, and a workout companion.",
    start_url: "/",
    display: "standalone",
    background_color: "#0e1214",
    theme_color: active?.color ?? "#4caf7d",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
