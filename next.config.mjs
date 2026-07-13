import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Keep `next dev` (.next) and one-off verification builds in separate output
  // dirs so a production build never corrupts the dev server's cache.
  // Dev uses the default ".next"; verification builds run with
  // NEXT_DIST_DIR=.next-build.
  distDir: process.env.NEXT_DIST_DIR || ".next",

  // Resolve the "@/..." path alias at the bundler level so it does not depend
  // on tsconfig `baseUrl` (deprecated in TS 7). Keying on "@" only matches
  // "@" and "@/..." — it does NOT clobber scoped packages like "@mui/material".
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@": rootDir,
    };
    return config;
  },
};

export default nextConfig;
