// Dev utility: list the public tables in the Neon database.
//   node scripts/inspect-db.mjs                → list tables
//   node scripts/inspect-db.mjs --drop-legacy  → drop the old dinner_table first
import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";

config({ path: ".env.local" });

const url = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL;
if (!url) {
  console.error("No POSTGRES_URL(_NON_POOLING) found in .env.local");
  process.exit(1);
}

const sql = neon(url);

if (process.argv.includes("--drop-legacy")) {
  await sql`DROP TABLE IF EXISTS dinner_table`;
  console.log("• dropped dinner_table (if it existed)");
}

const rows = await sql`
  SELECT table_name
  FROM information_schema.tables
  WHERE table_schema = 'public'
  ORDER BY table_name
`;

console.log(`public tables (${rows.length}):`);
for (const r of rows) console.log("  - " + r.table_name);
