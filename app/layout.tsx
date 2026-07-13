import type { Metadata, Viewport } from "next";
import * as React from "react";
import { Inter, Space_Grotesk } from "next/font/google";
import InitColorSchemeScript from "@mui/material/InitColorSchemeScript";
import Providers from "./providers";
import SiteHeader from "@/components/SiteHeader";
import EditControl from "@/components/EditControl";

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
  title: "Bryce's Garage",
  description:
    "A garage tracker for the daily drivers and a build bible for the dream NA Miata.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${bodyFont.variable} ${displayFont.variable}`}
    >
      <body>
        <InitColorSchemeScript attribute="class" defaultMode="dark" />
        <Providers>
          <SiteHeader editControl={<EditControl />} />
          {children}
        </Providers>
      </body>
    </html>
  );
}
