// One-time Phase C backfill: create the household's group and claim every
// existing row for it. Idempotent — re-running finds the group by name and
// only touches rows whose group_id is still NULL. After this runs clean, flip
// the schema's group_id columns to .notNull() and `npm run db:push` again.
//
//   node scripts/migrate-groups.mjs "Stock household"   (name optional, default "Home")

import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";

config({ path: ".env.local" });

const url = process.env.POSTGRES_URL ?? process.env.POSTGRES_URL_NON_POOLING;
if (!url) {
  console.error("POSTGRES_URL is not set — check .env.local");
  process.exit(1);
}
const sql = neon(url);

const name = process.argv[2]?.trim() || "Home";

// Tables that carry group_id directly (everything else inherits by FK).
const TABLES = ["accounts", "profiles", "vehicles", "exercises", "resources", "checklists"];

async function main() {
  let [group] = await sql`SELECT id, name FROM groups WHERE is_demo = false ORDER BY id LIMIT 1`;
  if (!group) {
    [group] = await sql`INSERT INTO groups (name) VALUES (${name}) RETURNING id, name`;
    console.log(`Created group #${group.id} "${group.name}"`);
  } else {
    console.log(`Using existing group #${group.id} "${group.name}"`);
  }

  for (const table of TABLES) {
    const rows = await sql.query(
      `UPDATE ${table} SET group_id = $1 WHERE group_id IS NULL RETURNING id`,
      [group.id],
    );
    console.log(`${table}: claimed ${rows.length} row(s)`);
  }

  const orphans = [];
  for (const table of TABLES) {
    const [{ n }] = await sql.query(
      `SELECT count(*)::int AS n FROM ${table} WHERE group_id IS NULL`,
    );
    if (n > 0) orphans.push(`${table}(${n})`);
  }
  if (orphans.length) {
    console.error(`STILL NULL after backfill: ${orphans.join(", ")}`);
    process.exit(1);
  }
  console.log("All rows claimed — safe to flip group_id columns to NOT NULL.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
