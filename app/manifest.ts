import type { MetadataRoute } from "next";

// Web app manifest → makes the hub installable ("Add to Home Screen") and run
// standalone (no browser chrome). Served at /manifest.webmanifest and linked
// automatically by Next.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Bryce",
    short_name: "Bryce",
    description:
      "Bryce's apps — a garage tracker, the Miata Bible, and a workout companion.",
    start_url: "/",
    display: "standalone",
    background_color: "#0e1214",
    theme_color: "#0e1214",
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
