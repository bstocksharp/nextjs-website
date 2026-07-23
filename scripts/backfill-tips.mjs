// One-off (re-runnable) update that refreshes exercise tips on the LIVE database
// from the shared source of truth in scripts/exercise-tips.mjs.
//
// It does NOT wipe anything and does NOT touch any other column — it only sets
// `tips` on catalog rows matched by name. Idempotent: run it as many times as
// you like; running it again after editing exercise-tips.mjs just pushes the
// new text.
//
//   node scripts/backfill-tips.mjs
//
// Note: this OVERWRITES the tips on the named exercises with the shared set. If
// you've hand-edited tips for one of these in the app and want to keep that,
// fold your edit into exercise-tips.mjs first so it isn't lost.
import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";
import { TIPS_BY_NAME } from "./exercise-tips.mjs";

config({ path: ".env.local" });

const url = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL;
if (!url) {
  console.error("No POSTGRES_URL(_NON_POOLING) found in .env.local");
  process.exit(1);
}
const sql = neon(url);

async function main() {
  let updated = 0;
  let missing = 0;
  for (const [name, tips] of Object.entries(TIPS_BY_NAME)) {
    // Stored one tip per line — same format parseTips() reads in the app.
    const text = tips.join("\n");
    const rows = await sql`
      UPDATE exercises SET tips = ${text} WHERE name = ${name}
      RETURNING id`;
    if (rows.length) {
      updated += rows.length;
      console.log(`  ✓ ${name} — ${tips.length} tips`);
    } else {
      missing++;
      console.warn(`  (skipped "${name}" — not found in catalog)`);
    }
  }
  console.log(`• updated tips on ${updated} exercises${missing ? `, ${missing} not found` : ""}`);
  console.log("Done. Start a workout to see the new tips rotate.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
