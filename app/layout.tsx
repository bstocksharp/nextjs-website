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

export const metadata: Metadata = {
  title: "Bryce",
  description: "Bryce's apps — a garage tracker, the Miata Bible, and more.",
  icons: { icon: "/icon.svg" },
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Bryce" },
};

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
