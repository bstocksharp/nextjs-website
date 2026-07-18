// Migration: profile soft-delete + safe hard-delete.
//   node scripts/migrate-profile-archive.mjs
//
// SAFE + IDEMPOTENT (guarded, re-runnable). Two changes:
//   1. profiles.archived_at  (nullable) — the "Deactivate" flag.
//   2. workouts.profile_id FK: ON DELETE CASCADE → RESTRICT, so deleting a profile
//      can't silently nuke the shared workouts it authored (deleteProfileForever()
//      reassigns them to an heir first).
// Reversible: DROP COLUMN archived_at; and re-add the FK with ON DELETE CASCADE.
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
  console.log("→ Migration: profile archive + safe delete\n");

  // 1. Soft-delete flag
  await sql`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS archived_at timestamptz`;
  console.log("✓ profiles.archived_at (nullable)");

  // 2. Swap the workouts → profiles FK to ON DELETE RESTRICT (name-agnostic).
  const existing = await sql`
    SELECT conname FROM pg_constraint
    WHERE conrelid = 'workouts'::regclass
      AND contype = 'f'
      AND confrelid = 'profiles'::regclass
    LIMIT 1`;
  if (existing[0]?.conname) {
    await sql.query(
      `ALTER TABLE workouts DROP CONSTRAINT "${existing[0].conname}"`,
    );
  }
  await sql`
    ALTER TABLE workouts
      ADD CONSTRAINT workouts_profile_id_profiles_id_fk
      FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE RESTRICT`;
  console.log("✓ workouts.profile_id FK → ON DELETE RESTRICT");

  console.log("\n✅ Done.");
}

main().catch((err) => {
  console.error("\n❌ Migration failed:", err.message);
  process.exit(1);
});
