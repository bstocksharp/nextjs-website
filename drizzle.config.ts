import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// drizzle-kit runs outside Next.js, so load .env.local ourselves.
config({ path: ".env.local" });

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    // Use the direct (non-pooled) URL for DDL/migrations to avoid pgBouncer quirks.
    url: process.env.POSTGRES_URL_NON_POOLING ?? process.env.POSTGRES_URL!,
  },
});
