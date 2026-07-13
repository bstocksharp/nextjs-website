// Drizzle client for the live Neon Postgres database.
// Uses the HTTP driver — each query is a one-shot HTTPS request, which is ideal
// for Vercel's serverless model. (If we ever need multi-statement transactions,
// switch to drizzle-orm/neon-serverless, the WebSocket driver.)
//
// Server-only: this reads secrets from the environment. Never import it into a
// Client Component.

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const connectionString = process.env.POSTGRES_URL;

if (!connectionString) {
  throw new Error(
    "POSTGRES_URL is not set. Check .env.local (Vercel/Neon integration).",
  );
}

const sql = neon(connectionString);

export const db = drizzle(sql, { schema });
export { schema };
