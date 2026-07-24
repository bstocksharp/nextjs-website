/** @type {import('next').NextConfig} */
const nextConfig = {
  // Keep `next dev` (.next) and one-off verification builds in separate output
  // dirs so a production build never corrupts the dev server's cache.
  // Dev uses the default ".next"; verification builds run with
  // NEXT_DIST_DIR=.next-build.
  distDir: process.env.NEXT_DIST_DIR || ".next",

  // Next 16 uses Turbopack by default. The "@/..." path alias is resolved
  // natively from tsconfig `paths` (Next applies tsconfig paths to Turbopack
  // resolution automatically), so no explicit bundler alias is needed. An
  // empty `turbopack` block also silences the "webpack config, no turbopack
  // config" error now that the webpack alias is gone.
  turbopack: {},
};

export default nextConfig;
