import type { Metadata, Viewport } from "next";
import * as React from "react";
import { Inter, Space_Grotesk } from "next/font/google";
import InitColorSchemeScript from "@mui/material/InitColorSchemeScript";
import Providers from "./providers";
import { getActiveProfile } from "@/lib/profile";

const bodyFont = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-body",
});

const displayFont = Space_Grotesk({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-display",
});

export async function generateMetadata(): Promise<Metadata> {
  // The active profile's name is the app's identity — including the iOS
  // home-screen label (appleWebApp.title, snapshotted at "Add to Home Screen").
  const active = await getActiveProfile();
  const who = active?.name ?? "Hub";
  return {
    title: who,
    description:
      "A personal hub of small apps — a garage tracker, the Miata Bible, and a workout companion.",
    // Tab favicon follows the active profile too; ?v=<id> busts the browser's
    // aggressive favicon cache so it repaints on profile switch.
    icons: { icon: `/profile-icon?v=${active?.id ?? 0}` },
    appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: who },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0e1214" },
    { media: "(prefers-color-scheme: light)", color: "#f5f4ef" },
  ],
};

// App-agnostic root shell: fonts, color-scheme init, and providers only.
// Each sub-app supplies its own header (and, later, its own theme) in its layout.
export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // The active profile's picked color drives the app-wide primary accent. Read
  // it here (server) so it's baked into the theme's CSS vars on first paint.
  const active = await getActiveProfile();

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${bodyFont.variable} ${displayFont.variable}`}
    >
      <body>
        <InitColorSchemeScript attribute="class" defaultMode="dark" />
        <Providers accentColor={active?.color ?? null}>{children}</Providers>
      </body>
    </html>
  );
}
