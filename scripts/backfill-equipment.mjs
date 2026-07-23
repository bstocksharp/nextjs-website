// One-off migration for the equipment feature (Step 1). Safe to run against the
// LIVE database — it does NOT wipe anything:
//
//   1. Adds exercises.equipment (jsonb, default []) if it's not there yet.
//   2. Backfills equipment tags onto the existing catalog — but ONLY on rows still
//      at the default [] , so it never clobbers a tag you've since edited by hand.
//   3. Inserts the pull-up-bar progression, skipping any that already exist by name.
//
// Idempotent: run it as many times as you like.
//   node scripts/backfill-equipment.mjs
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

// name → required equipment slugs (must match lib/workout EQUIPMENT values).
const EQUIPMENT_BY_NAME = {
  "Warmup Walk": [],
  "Treadmill Cooldown": ["treadmill"],
  Treadmill: ["treadmill"],
  "Goblet Squats": ["dumbbells"],
  "Bulgarian Split Squats": ["dumbbells", "bench"],
  "Reverse Lunges": ["dumbbells"],
  "Romanian Deadlift": ["dumbbells"],
  "Glute Bridge": [],
  "Dumbbell Floor Press": ["dumbbells"],
  "Shoulder Press": ["dumbbells"],
  Pushups: [],
  "Arnold Press": ["dumbbells"],
  "Lateral Raises": ["dumbbells"],
  "Tricep Overhead Extension": ["dumbbells"],
  "One Arm Row": ["dumbbells", "bench"],
  "Bicep Curls": ["dumbbells"],
  "Hammer Curls": ["dumbbells"],
  "Bent Over Reverse Fly": ["dumbbells"],
  Plank: [],
  "Superman Holds": [],
  "Bird Dogs": [],
  "Dead Bug": [],
  Situps: [],
  "Farmer Carry": ["dumbbells"],
  "Suitcase Carry": ["dumbbells"],
};

// The pull-up-bar progression (all need the bar). Inserted only if missing.
// Tips come from TIPS_BY_NAME (scripts/exercise-tips.mjs), matched by name.
const NEW_EXERCISES = [
  { name: "Dead Hang", category: "pull", duration: 30, weight: null, equipment: ["pullup-bar"],
    description: "Hang from the bar with straight arms and a full grip. Just hang and breathe." },
  { name: "Scapular Pulls", category: "pull", reps: "8-10", weight: "bodyweight", equipment: ["pullup-bar"],
    description: "Hang with straight arms, then pull your shoulder blades down and back without bending the arms. This is the first inch of a pull-up." },
  { name: "Flexed-Arm Hang", category: "pull", duration: 15, weight: null, equipment: ["pullup-bar"],
    description: "Get your chin over the bar (step or jump up to it) and hold there as long as you can." },
  { name: "Negative Pull-ups", category: "pull", reps: "3-5", weight: "bodyweight", equipment: ["pullup-bar"],
    description: "Step or jump to the top (chin over bar), then lower yourself as slowly as you possibly can." },
  { name: "Hanging Knee Raises", category: "core", reps: "10-12", weight: "bodyweight", equipment: ["pullup-bar"],
    description: "Hang from the bar and raise your knees toward your chest, then lower with control." },
  { name: "Chin-ups", category: "pull", reps: "work up to 1", weight: "bodyweight", equipment: ["pullup-bar"],
    description: "Underhand grip (palms facing you), pull your chin over the bar. Usually your first pull-up win." },
  { name: "Pull-ups", category: "pull", reps: "work up to 1", weight: "bodyweight", equipment: ["pullup-bar"],
    description: "Overhand grip (palms facing away), pull your chin over the bar with a straight body." },
];

async function main() {
  // 1. Add the columns if they aren't there yet (schema.ts already declares them,
  //    so a future `npm run db:push` sees no change — same pattern as prior ALTERs).
  //    exercises.equipment = gear a move needs; profiles.equipment = gear a person owns.
  await sql`ALTER TABLE exercises ADD COLUMN IF NOT EXISTS equipment jsonb NOT NULL DEFAULT '[]'::jsonb`;
  await sql`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS equipment jsonb NOT NULL DEFAULT '[]'::jsonb`;
  console.log("• ensured exercises.equipment + profiles.equipment columns exist");

  // 2. Backfill tags — only on rows still at the default [], so hand edits stick.
  let tagged = 0;
  for (const [name, equipment] of Object.entries(EQUIPMENT_BY_NAME)) {
    if (equipment.length === 0) continue; // already [] by default; nothing to set
    const rows = await sql`
      UPDATE exercises
         SET equipment = ${JSON.stringify(equipment)}::jsonb
       WHERE name = ${name} AND equipment = '[]'::jsonb
      RETURNING id`;
    if (rows.length) tagged += rows.length;
    else console.warn(`  (skipped "${name}" — not found or already tagged)`);
  }
  console.log(`• tagged ${tagged} existing exercises with equipment`);

  // 3. Insert the pull-up progression, skipping any that already exist by name.
  let added = 0;
  for (const e of NEW_EXERCISES) {
    const existing = await sql`SELECT id FROM exercises WHERE name = ${e.name} LIMIT 1`;
    if (existing.length) {
      console.log(`  (skipped "${e.name}" — already in catalog)`);
      continue;
    }
    const tips = (TIPS_BY_NAME[e.name] ?? []).join("\n") || null;
    await sql`
      INSERT INTO exercises
        (name, category, default_reps, default_duration, default_weight, equipment, description, tips)
      VALUES
        (${e.name}, ${e.category}, ${e.reps ?? null}, ${e.duration ?? null},
         ${e.weight ?? null}, ${JSON.stringify(e.equipment)}::jsonb,
         ${e.description}, ${tips})`;
    added++;
  }
  console.log(`• added ${added} pull-up-bar exercises`);

  console.log("Done. Open /workout/catalog to review the tags + new moves.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
