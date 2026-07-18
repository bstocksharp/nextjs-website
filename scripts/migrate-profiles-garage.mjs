// One-off migration: rename workout_profiles → profiles, and make garage vehicles
// per-profile (owner + visibility).
//
//   node scripts/migrate-profiles-garage.mjs
//
// SAFE + IDEMPOTENT: every step is guarded (IF EXISTS / IF NOT EXISTS), so re-running
// is a no-op. No table/column drops. Reversible by hand if ever needed:
//   ALTER TABLE profiles RENAME TO workout_profiles;
//   ALTER SEQUENCE profiles_id_seq RENAME TO workout_profiles_id_seq;
//   ALTER TABLE vehicles DROP COLUMN profile_id, DROP COLUMN visibility;
import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";

config({ path: ".env.local" });

const url = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL;
if (!url) {
  console.error("No POSTGRES_URL(_NON_POOLING) found in .env.local");
  process.exit(1);
}
const sql = neon(url);

async function main() {
  console.log("→ Migration: profiles rename + per-profile garage\n");

  // ── 1. Rename workout_profiles → profiles (+ its sequence) ──────────────────
  await sql`ALTER TABLE IF EXISTS workout_profiles RENAME TO profiles`;
  await sql`ALTER SEQUENCE IF EXISTS workout_profiles_id_seq RENAME TO profiles_id_seq`;
  console.log("✓ table workout_profiles → profiles (data, FKs preserved)");

  // ── 2. Vehicles get an owner + visibility ───────────────────────────────────
  await sql`ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS profile_id integer REFERENCES profiles(id) ON DELETE SET NULL`;
  await sql`ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS visibility varchar(20) NOT NULL DEFAULT 'shared'`;
  console.log("✓ vehicles.profile_id + vehicles.visibility (default 'shared')");

  // ── 3. Backfill existing vehicles to Bryce ──────────────────────────────────
  const people =
    await sql`SELECT id, name, sort_order FROM profiles ORDER BY sort_order NULLS LAST, id`;
  if (people.length === 0) throw new Error("No profiles found — cannot backfill.");
  const owner =
    people.find((p) => String(p.name).toLowerCase() === "bryce") ?? people[0];

  const [{ n: unowned }] =
    await sql`SELECT count(*)::int AS n FROM vehicles WHERE profile_id IS NULL`;
  await sql`UPDATE vehicles SET profile_id = ${owner.id} WHERE profile_id IS NULL`;
  console.log(
    `✓ assigned ${unowned} existing vehicle(s) to "${owner.name}" (id ${owner.id})`,
  );

  // ── Summary ─────────────────────────────────────────────────────────────────
  const byVis =
    await sql`SELECT visibility, count(*)::int AS n FROM vehicles GROUP BY visibility ORDER BY visibility`;
  console.log("\nProfiles:", people.map((p) => `${p.name}#${p.id}`).join(", "));
  console.log(
    "Vehicles by visibility:",
    byVis.map((r) => `${r.visibility}=${r.n}`).join(", ") || "(none)",
  );
  console.log("\n✅ Done.");
}

main().catch((err) => {
  console.error("\n❌ Migration failed:", err.message);
  process.exit(1);
});
