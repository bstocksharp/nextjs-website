// Seed the Workout app: profiles + exercise catalog + Bryce's four weekly
// workouts. Idempotent — skips if the catalog already has rows.
//
//   node scripts/seed-workout.mjs           → seed (skip if already seeded)
//   node scripts/seed-workout.mjs --reset   → wipe workout tables, then seed
//
// Built from Bryce's real routine so the app is runnable the moment it exists.
// Tips live in scripts/exercise-tips.mjs (one source of truth, shared with the
// backfill scripts) and are stored one per line — the live runner shows a
// random one and rotates through them.
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

// ── The exercise catalog (recommended defaults + description) ──────────────────
// mode: "reps" | "timed". reps/weight are text on purpose ("10-12", "15s").
// duration/rest are seconds. sets defaults to 3 (2 for Hammer Curls).
// sides: 2 = performed per side (runner plays the set once per side with a short
// switch between) — put the PER-SIDE amount in reps ("8", not "8 each leg").
// equipment: gear the move REQUIRES (slugs from lib/workout EQUIPMENT). Omit /
// empty = bodyweight (always doable). A profile only sees moves whose gear it owns.
// description = the "how to" (shown behind an ⓘ). Tips come from TIPS_BY_NAME in
// scripts/exercise-tips.mjs, matched by name.
const CATALOG = [
  // Warmup / cardio
  { name: "Warmup Walk", category: "warmup", mode: "timed", sets: 1, duration: 300, equipment: [],
    description: "Easy walk to raise the heart rate and loosen up before your workout." },
  { name: "Treadmill Cooldown", category: "cardio", mode: "timed", sets: 1, duration: 600, equipment: ["treadmill"],
    description: "Easy treadmill walk to cool down after the session." },
  { name: "Treadmill", category: "cardio", mode: "timed", sets: 1, duration: 1800, equipment: ["treadmill"],
    description: "Steady treadmill walk or run at a sustainable pace." },

  // Legs
  { name: "Goblet Squats", category: "legs", mode: "reps", sets: 3, reps: "10-12", weight: "25 lb", rest: 45, equipment: ["dumbbells"],
    description: "Hold a dumbbell at your chest and squat down, elbows inside your knees." },
  { name: "Bulgarian Split Squats", category: "legs", mode: "reps", sets: 3, reps: "8", sides: 2, weight: "15 lb", rest: 45, equipment: ["dumbbells", "bench"],
    description: "Rear foot on a couch/chair, drop straight down on the front leg." },
  { name: "Reverse Lunges", category: "legs", mode: "reps", sets: 3, reps: "10", weight: "15s", rest: 45, equipment: ["dumbbells"],
    description: "Step backward into a lunge, then drive back up. Alternate legs." },
  { name: "Romanian Deadlift", category: "legs", mode: "reps", sets: 3, reps: "12", weight: "25 lb", rest: 60, equipment: ["dumbbells"],
    description: "Hinge at the hips with a soft knee, lowering the weights down your shins." },
  { name: "Glute Bridge", category: "legs", mode: "reps", sets: 3, reps: "20", weight: "bodyweight", rest: 30, equipment: [],
    description: "Lie on your back, drive your hips up, squeeze the glutes at the top." },

  // Push
  { name: "Dumbbell Floor Press", category: "push", mode: "reps", sets: 3, reps: "10-15", weight: "15s", rest: 45, equipment: ["dumbbells"],
    description: "Lie on the floor and press dumbbells up; elbows stop at the floor." },
  { name: "Shoulder Press", category: "push", mode: "reps", sets: 3, reps: "8-12", weight: "15s", rest: 45, equipment: ["dumbbells"],
    description: "Press dumbbells overhead from shoulder height until arms lock out." },
  { name: "Pushups", category: "push", mode: "reps", sets: 3, reps: "to near failure", weight: "bodyweight", rest: 45, equipment: [],
    description: "Standard pushups, chest to the floor, body in a straight line." },
  { name: "Arnold Press", category: "push", mode: "reps", sets: 3, reps: "10", weight: "15s", rest: 45, equipment: ["dumbbells"],
    description: "Shoulder press that rotates the palms from facing you to facing out." },
  { name: "Lateral Raises", category: "push", mode: "reps", sets: 3, reps: "15", weight: "5 or 8s", rest: 30, equipment: ["dumbbells"],
    description: "Raise dumbbells out to the sides to shoulder height, slight bend in the elbow." },
  { name: "Tricep Overhead Extension", category: "push", mode: "reps", sets: 3, reps: "12", weight: "25 lb", rest: 45, equipment: ["dumbbells"],
    description: "Hold one dumbbell overhead with both hands, lower behind your head, extend." },

  // Pull
  { name: "One Arm Row", category: "pull", mode: "reps", sets: 3, reps: "12", sides: 2, weight: "25 lb", rest: 45, equipment: ["dumbbells", "bench"],
    description: "Braced on a bench/couch, row a dumbbell to your hip. One side, then the other." },
  { name: "Bicep Curls", category: "pull", mode: "reps", sets: 3, reps: "12", weight: "15s", rest: 45, equipment: ["dumbbells"],
    description: "Curl dumbbells up with palms facing forward; control the way down." },
  { name: "Hammer Curls", category: "pull", mode: "reps", sets: 2, reps: "10", weight: "15s", rest: 45, equipment: ["dumbbells"],
    description: "Curl with palms facing each other (neutral grip)." },
  { name: "Bent Over Reverse Fly", category: "pull", mode: "reps", sets: 3, reps: "15", weight: "8s", rest: 30, equipment: ["dumbbells"],
    description: "Hinge forward and raise dumbbells out to the sides, squeezing the rear delts." },

  // Pull-up bar — a progression from "can't do one yet" up to the real thing.
  { name: "Dead Hang", category: "pull", mode: "timed", sets: 3, duration: 30, equipment: ["pullup-bar"],
    description: "Hang from the bar with straight arms and a full grip. Just hang and breathe." },
  { name: "Scapular Pulls", category: "pull", mode: "reps", sets: 3, reps: "8-10", weight: "bodyweight", rest: 45, equipment: ["pullup-bar"],
    description: "Hang with straight arms, then pull your shoulder blades down and back without bending the arms. This is the first inch of a pull-up." },
  { name: "Flexed-Arm Hang", category: "pull", mode: "timed", sets: 3, duration: 15, equipment: ["pullup-bar"],
    description: "Get your chin over the bar (step or jump up to it) and hold there as long as you can." },
  { name: "Negative Pull-ups", category: "pull", mode: "reps", sets: 3, reps: "3-5", weight: "bodyweight", rest: 60, equipment: ["pullup-bar"],
    description: "Step or jump to the top (chin over bar), then lower yourself as slowly as you possibly can." },
  { name: "Hanging Knee Raises", category: "core", mode: "reps", sets: 3, reps: "10-12", weight: "bodyweight", rest: 45, equipment: ["pullup-bar"],
    description: "Hang from the bar and raise your knees toward your chest, then lower with control." },
  { name: "Chin-ups", category: "pull", mode: "reps", sets: 3, reps: "work up to 1", weight: "bodyweight", rest: 90, equipment: ["pullup-bar"],
    description: "Underhand grip (palms facing you), pull your chin over the bar. Usually your first pull-up win." },
  { name: "Pull-ups", category: "pull", mode: "reps", sets: 3, reps: "work up to 1", weight: "bodyweight", rest: 90, equipment: ["pullup-bar"],
    description: "Overhand grip (palms facing away), pull your chin over the bar with a straight body." },

  // Core
  { name: "Plank", category: "core", mode: "timed", sets: 3, duration: 60, rest: 30, equipment: [],
    description: "Forearms and toes, body in a straight rigid line. Hold." },
  { name: "Superman Holds", category: "core", mode: "timed", sets: 3, duration: 20, rest: 30, equipment: [],
    description: "Lay on your stomach and lift your chest and legs off the floor. Hold." },
  { name: "Bird Dogs", category: "core", mode: "reps", sets: 3, reps: "10", sides: 2, weight: "bodyweight", rest: 30, equipment: [],
    description: "On all fours, extend the opposite arm and leg, hold, return. Alternate." },
  { name: "Dead Bug", category: "core", mode: "reps", sets: 3, reps: "10", sides: 2, weight: "bodyweight", rest: 30, equipment: [],
    description: "On your back, extend the opposite arm and leg while keeping your low back flat." },
  { name: "Situps", category: "core", mode: "reps", sets: 3, reps: "20", weight: "bodyweight", rest: 30, equipment: [],
    description: "Full situps, controlled up and down." },

  // Carries
  { name: "Farmer Carry", category: "carry", mode: "timed", sets: 3, duration: 45, sides: 2, weight: "25 lb one hand", rest: 30, equipment: ["dumbbells"],
    description: "Hold a dumbbell in one hand and walk around the house. Switch hands, repeat." },
  { name: "Suitcase Carry", category: "carry", mode: "timed", sets: 3, duration: 45, sides: 2, weight: "25 lb", rest: 30, equipment: ["dumbbells"],
    description: "Like a farmer carry but one side only — walk tall, don't lean. Switch hands." },
];

// ── The workouts (exercise names must match the catalog above) ────────────────
// weekday: 0=Sun … 6=Sat. `rounds` = how many times to rotate the MAIN circuit
// (warmup + cooldown run once). Items are tagged with a section.
// W(name, section, overrides?) — overrides set per-item columns (mode, reps,
// duration, weight, rest, note) that win over the catalog default. Keeps the
// catalog generic while a workout carries its own specifics.
const W = (name, section = "main", overrides = {}) => ({ name, section, ...overrides });
// Generic names — the day comes from ASSIGNMENTS below, so any profile can reuse
// a workout on any day.
const WORKOUTS = [
  { key: "push-legs", name: "Push + Legs", rounds: 3, items: [
    W("Warmup Walk", "warmup"),
    W("Goblet Squats"), W("Dumbbell Floor Press"), W("Bulgarian Split Squats"),
    W("Shoulder Press"), W("Pushups"), W("Plank"),
    W("Treadmill Cooldown", "cooldown"),
  ] },
  { key: "pull-back", name: "Pull + Back", rounds: 3, items: [
    W("Warmup Walk", "warmup"),
    W("Romanian Deadlift"), W("One Arm Row"), W("Reverse Lunges"),
    W("Bicep Curls"), W("Hammer Curls"), W("Superman Holds"), W("Bird Dogs"),
    W("Treadmill Cooldown", "cooldown"),
  ] },
  { key: "arms", name: "Arms + Conditioning", rounds: 3, items: [
    W("Warmup Walk", "warmup"),
    W("Arnold Press"), W("Lateral Raises"), W("Bent Over Reverse Fly"),
    W("Goblet Squats"), W("Farmer Carry"), W("Tricep Overhead Extension"), W("Situps"),
    W("Treadmill Cooldown", "cooldown"),
  ] },
  // Bryce runs 45 min — override the item's duration; the catalog stays generic.
  { key: "treadmill", name: "Treadmill", rounds: 1, items: [W("Treadmill", "main", { duration: 2700 })] },
];

// Bryce's weekly schedule (0=Sun … 6=Sat → workout key). Lauren starts empty.
const ASSIGNMENTS = [
  { weekday: 1, key: "push-legs" }, // Monday
  { weekday: 2, key: "treadmill" }, // Tuesday
  { weekday: 3, key: "pull-back" }, // Wednesday
  { weekday: 4, key: "treadmill" }, // Thursday
  { weekday: 5, key: "arms" }, // Friday
];

async function main() {
  if (process.argv.includes("--reset")) {
    // FK order: assignments/items → workouts → exercises, profiles.
    await sql`DELETE FROM workout_assignments`;
    await sql`DELETE FROM workout_items`;
    await sql`DELETE FROM workouts`;
    await sql`DELETE FROM exercises`;
    await sql`DELETE FROM profiles`;
    console.log("• reset: cleared workout tables");
  }

  const existing = await sql`SELECT count(*)::int AS n FROM exercises`;
  if (existing[0].n > 0) {
    console.log(
      `Catalog already has ${existing[0].n} exercises — nothing to do. ` +
        "Use --reset to wipe and reseed.",
    );
    return;
  }

  // Profiles
  const [bryce] = await sql`
    INSERT INTO profiles (name, color, sort_order)
    VALUES ('Bryce', '#4caf7d', 0) RETURNING id`;
  await sql`
    INSERT INTO profiles (name, color, sort_order)
    VALUES ('Lauren', '#d8b384', 1) RETURNING id`;
  console.log("• seeded 2 profiles (Bryce, Lauren)");

  // Catalog → name→id map. tips[] (from exercise-tips.mjs) is stored one per line.
  const byName = {};
  for (const e of CATALOG) {
    const tipList = TIPS_BY_NAME[e.name] ?? [];
    const tips = tipList.length ? tipList.join("\n") : null;
    const [row] = await sql`
      INSERT INTO exercises
        (name, category, default_reps, default_duration, default_weight, sides, equipment, description, tips)
      VALUES
        (${e.name}, ${e.category}, ${e.reps ?? null},
         ${e.duration ?? null}, ${e.weight ?? null}, ${e.sides ?? 1},
         ${JSON.stringify(e.equipment ?? [])}::jsonb,
         ${e.description ?? null}, ${tips})
      RETURNING id`;
    byName[e.name] = row.id;
  }
  console.log(`• seeded ${CATALOG.length} exercises`);

  // Workouts + items (shared library, all created by Bryce). Build key → id map.
  const workoutId = {};
  for (let w = 0; w < WORKOUTS.length; w++) {
    const def = WORKOUTS[w];
    const [workout] = await sql`
      INSERT INTO workouts (profile_id, name, rounds, sort_order)
      VALUES (${bryce.id}, ${def.name}, ${def.rounds ?? 1}, ${w})
      RETURNING id`;
    workoutId[def.key] = workout.id;
    for (let i = 0; i < def.items.length; i++) {
      const it = def.items[i];
      const exId = byName[it.name];
      if (!exId) throw new Error(`Unknown exercise "${it.name}" in ${def.name}`);
      await sql`
        INSERT INTO workout_items
          (workout_id, exercise_id, section, reps, duration, weight, note, sort_order)
        VALUES
          (${workout.id}, ${exId}, ${it.section}, ${it.reps ?? null},
           ${it.duration ?? null}, ${it.weight ?? null}, ${it.note ?? null}, ${i})`;
    }
    console.log(`• seeded workout "${def.name}" (${def.items.length} items)`);
  }

  // Bryce's weekly assignments (Lauren starts with an empty week).
  for (const a of ASSIGNMENTS) {
    await sql`
      INSERT INTO workout_assignments (profile_id, weekday, workout_id)
      VALUES (${bryce.id}, ${a.weekday}, ${workoutId[a.key]})`;
  }
  console.log(`• seeded ${ASSIGNMENTS.length} assignments for Bryce`);

  console.log("Done. Open /workout to see it.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
