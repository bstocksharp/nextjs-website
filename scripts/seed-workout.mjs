// Seed the Workout app: profiles + exercise catalog + Bryce's four weekly
// workouts. Idempotent — skips if the catalog already has rows.
//
//   node scripts/seed-workout.mjs           → seed (skip if already seeded)
//   node scripts/seed-workout.mjs --reset   → wipe workout tables, then seed
//
// Built from Bryce's real routine so the app is runnable the moment it exists.
// `tips` holds one tip per line — the live runner shows a random one.
import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";

config({ path: ".env.local" });

const url = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL;
if (!url) {
  console.error("No POSTGRES_URL(_NON_POOLING) found in .env.local");
  process.exit(1);
}
const sql = neon(url);

// ── The exercise catalog (recommended defaults, description + tips) ────────────
// mode: "reps" | "timed". reps/weight are text on purpose ("10-12", "15s").
// duration/rest are seconds. sets defaults to 3 (2 for Hammer Curls).
// sides: 2 = performed per side (runner plays the set once per side with a short
// switch between) — put the PER-SIDE amount in reps ("8", not "8 each leg").
// description = the "how to" (shown behind an ⓘ). tips = one per line (runner
// shows a random one live).
const CATALOG = [
  // Warmup / cardio
  { name: "Warmup Walk", category: "warmup", mode: "timed", sets: 1, duration: 300,
    description: "Easy walk to raise the heart rate and loosen up before your workout.",
    tips: [
      "Keep it light — you're warming up, not working out.",
      "Get the blood moving; a light sweat is perfect.",
      "Roll the shoulders and swing the arms as you go.",
    ] },
  { name: "Treadmill Cooldown", category: "cardio", mode: "timed", sets: 1, duration: 600,
    description: "Easy treadmill walk to cool down after the session.",
    tips: [
      "Bring the heart rate down slowly.",
      "Easy pace — you should be able to hold a conversation.",
      "Finish with a little stretching while you're warm.",
    ] },
  { name: "Treadmill", category: "cardio", mode: "timed", sets: 1, duration: 1800,
    description: "Steady treadmill walk or run at a sustainable pace.",
    tips: [
      "Pick a pace you can hold for the whole time.",
      "Steady beats starting out too hot.",
      "Good time to put on a podcast or playlist.",
    ] },

  // Legs
  { name: "Goblet Squats", category: "legs", mode: "reps", sets: 3, reps: "10-12", weight: "25 lb", rest: 45,
    description: "Hold a dumbbell at your chest and squat down, elbows inside your knees.",
    tips: [
      "Chest up, drive through the heels.",
      "Elbows stay inside the knees at the bottom.",
      "Go for full depth — thighs at least parallel.",
    ] },
  { name: "Bulgarian Split Squats", category: "legs", mode: "reps", sets: 3, reps: "8", sides: 2, weight: "15 lb", rest: 45,
    description: "Rear foot on a couch/chair, drop straight down on the front leg.",
    tips: [
      "One foot on a couch/chair. Holy crap these work.",
      "Keep most of your weight on the front leg.",
      "Drop straight down — don't lunge forward.",
    ] },
  { name: "Reverse Lunges", category: "legs", mode: "reps", sets: 3, reps: "10", weight: "15s", rest: 45,
    description: "Step backward into a lunge, then drive back up. Alternate legs.",
    tips: [
      "Controlled — don't let the front knee cave in.",
      "Step back far enough that the front shin stays vertical.",
      "Easier on the knees than forward lunges.",
    ] },
  { name: "Romanian Deadlift", category: "legs", mode: "reps", sets: 3, reps: "12", weight: "25 lb", rest: 60,
    description: "Hinge at the hips with a soft knee, lowering the weights down your shins.",
    tips: [
      "Slow. Stretch the hamstrings.",
      "Soft knees, push the hips back — it's a hinge, not a squat.",
      "Flat back; feel it in the hamstrings, not the low back.",
    ] },
  { name: "Glute Bridge", category: "legs", mode: "reps", sets: 3, reps: "20", weight: "bodyweight", rest: 30,
    description: "Lie on your back, drive your hips up, squeeze the glutes at the top.",
    tips: [
      "Easy. Awesome. Protects your back.",
      "Squeeze the glutes hard at the top and pause.",
      "Drive through the heels, not the toes.",
    ] },

  // Push
  { name: "Dumbbell Floor Press", category: "push", mode: "reps", sets: 3, reps: "10-15", weight: "15s", rest: 45,
    description: "Lie on the floor and press dumbbells up; elbows stop at the floor.",
    tips: [
      "The floor limits the range — great and shoulder-friendly.",
      "Let the elbows rest a beat on the floor between reps.",
      "Keep the wrists stacked over the elbows.",
    ] },
  { name: "Shoulder Press", category: "push", mode: "reps", sets: 3, reps: "8-12", weight: "15s", rest: 45,
    description: "Press dumbbells overhead from shoulder height until arms lock out.",
    tips: [
      "Don't arch the lower back — brace your core.",
      "Press up and slightly back, not straight forward.",
      "Control the weights down; don't just drop them.",
    ] },
  { name: "Pushups", category: "push", mode: "reps", sets: 3, reps: "to near failure", weight: "bodyweight", rest: 45,
    description: "Standard pushups, chest to the floor, body in a straight line.",
    tips: [
      "Stop 1-2 reps before failure.",
      "Body in one straight line — no sagging hips.",
      "Elbows about 45° from the body, not flared out.",
    ] },
  { name: "Arnold Press", category: "push", mode: "reps", sets: 3, reps: "10", weight: "15s", rest: 45,
    description: "Shoulder press that rotates the palms from facing you to facing out.",
    tips: [
      "Smooth rotation — hits all three delt heads.",
      "Start with palms facing you, finish facing forward.",
      "Go lighter than a normal press; the rotation is the point.",
    ] },
  { name: "Lateral Raises", category: "push", mode: "reps", sets: 3, reps: "15", weight: "5 or 8s", rest: 30,
    description: "Raise dumbbells out to the sides to shoulder height, slight bend in the elbow.",
    tips: [
      "These absolutely torch shoulders. Go light.",
      "Lead with the elbows, slight bend in the arm.",
      "Stop at shoulder height — no higher.",
    ] },
  { name: "Tricep Overhead Extension", category: "push", mode: "reps", sets: 3, reps: "12", weight: "25 lb", rest: 45,
    description: "Hold one dumbbell overhead with both hands, lower behind your head, extend.",
    tips: [
      "Both hands. Keep the elbows tucked in.",
      "Only the forearms move; upper arms stay still.",
      "Get a full stretch at the bottom.",
    ] },

  // Pull
  { name: "One Arm Row", category: "pull", mode: "reps", sets: 3, reps: "12", sides: 2, weight: "25 lb", rest: 45,
    description: "Braced on a bench/couch, row a dumbbell to your hip. One side, then the other.",
    tips: [
      "Pull with the back, not the arm. Squeeze the shoulder blade.",
      "Row the dumbbell to your hip, not your chest.",
      "Keep a flat back and don't twist.",
    ] },
  { name: "Bicep Curls", category: "pull", mode: "reps", sets: 3, reps: "12", weight: "15s", rest: 45,
    description: "Curl dumbbells up with palms facing forward; control the way down.",
    tips: [
      "You're gonna love these. No swinging.",
      "Keep the elbows pinned to your sides.",
      "Control the way down — that's half the work.",
    ] },
  { name: "Hammer Curls", category: "pull", mode: "reps", sets: 2, reps: "10", weight: "15s", rest: 45,
    description: "Curl with palms facing each other (neutral grip).",
    tips: [
      "Builds forearms too.",
      "Palms face each other the whole time.",
      "No swinging — let the arms do the work.",
    ] },
  { name: "Bent Over Reverse Fly", category: "pull", mode: "reps", sets: 3, reps: "15", weight: "8s", rest: 30,
    description: "Hinge forward and raise dumbbells out to the sides, squeezing the rear delts.",
    tips: [
      "Rear shoulders + posture. Light weight, slow.",
      "Squeeze the shoulder blades together at the top.",
      "Slight bend in the elbows, lead with the pinkies.",
    ] },

  // Core
  { name: "Plank", category: "core", mode: "timed", sets: 3, duration: 60, rest: 30,
    description: "Forearms and toes, body in a straight rigid line. Hold.",
    tips: [
      "Squeeze glutes and core; don't let the hips sag.",
      "Stack the elbows under the shoulders.",
      "Breathe — don't hold your breath.",
    ] },
  { name: "Superman Holds", category: "core", mode: "timed", sets: 3, duration: 20, rest: 30,
    description: "Lay on your stomach and lift your chest and legs off the floor. Hold.",
    tips: [
      "Fantastic for your lower back.",
      "Lift chest and legs together and hold.",
      "Look down to keep your neck neutral.",
    ] },
  { name: "Bird Dogs", category: "core", mode: "reps", sets: 3, reps: "10", sides: 2, weight: "bodyweight", rest: 30,
    description: "On all fours, extend the opposite arm and leg, hold, return. Alternate.",
    tips: [
      "Boring — but one of the best core stability moves there is.",
      "Extend opposite arm and leg; keep the hips level.",
      "Move slow and don't let your back rotate.",
    ] },
  { name: "Dead Bug", category: "core", mode: "reps", sets: 3, reps: "10", sides: 2, weight: "bodyweight", rest: 30,
    description: "On your back, extend the opposite arm and leg while keeping your low back flat.",
    tips: [
      "Better than endless crunches — it teaches core control.",
      "Press your low back flat into the floor the whole time.",
      "Move the opposite arm and leg slowly.",
    ] },
  { name: "Situps", category: "core", mode: "reps", sets: 3, reps: "20", weight: "bodyweight", rest: 30,
    description: "Full situps, controlled up and down.",
    tips: [
      "Slow and controlled beats fast and sloppy.",
      "Don't yank on your neck — hands light behind the ears.",
      "Exhale on the way up.",
    ] },

  // Carries
  { name: "Farmer Carry", category: "carry", mode: "timed", sets: 3, duration: 45, sides: 2, weight: "25 lb one hand", rest: 30,
    description: "Hold a dumbbell in one hand and walk around the house. Switch hands, repeat.",
    tips: [
      "Secretly one of the best core exercises ever.",
      "Stand tall — shoulders back, don't hunch.",
      "Grip hard and brace the core the whole walk.",
    ] },
  { name: "Suitcase Carry", category: "carry", mode: "timed", sets: 3, duration: 45, sides: 2, weight: "25 lb", rest: 30,
    description: "Like a farmer carry but one side only — walk tall, don't lean. Switch hands.",
    tips: [
      "Amazing for core, obliques, and lower back.",
      "Don't lean toward the weight — stay perfectly upright.",
      "Match the time on each side.",
    ] },
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

  // Catalog → name→id map. tips[] is stored one per line.
  const byName = {};
  for (const e of CATALOG) {
    const tips = Array.isArray(e.tips) ? e.tips.join("\n") : (e.tips ?? null);
    const [row] = await sql`
      INSERT INTO exercises
        (name, category, default_reps, default_duration, default_weight, sides, description, tips)
      VALUES
        (${e.name}, ${e.category}, ${e.reps ?? null},
         ${e.duration ?? null}, ${e.weight ?? null}, ${e.sides ?? 1},
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
