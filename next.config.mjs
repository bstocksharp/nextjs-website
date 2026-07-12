import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
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
