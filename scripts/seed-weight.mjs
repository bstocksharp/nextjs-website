// One-time seed of the weight tracker with Bryce & Lauren's real history from
// the Google Sheet (weekly weigh-ins Jan 5 – Jul 27, 2026, plus each person's
// goal/pace plan). Plain JS + raw SQL on the Neon HTTP client so it needs no
// build step (no tsx/esbuild) — run with `npm run db:seed`.
//
// Idempotent: weigh-ins upsert on (profile_id, measured_on) and goals upsert on
// profile_id, so re-running just refreshes values instead of duplicating.

import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";

config({ path: ".env.local" });

const url = process.env.POSTGRES_URL ?? process.env.POSTGRES_URL_NON_POOLING;
if (!url) {
  console.error("POSTGRES_URL is not set — check .env.local");
  process.exit(1);
}
const sql = neon(url);

// ── The data (from the sheet) ────────────────────────────────────────────────
// [measured_on, weight]; weeks 0–29, weekly on Mondays in 2026.
const BRYCE = [
  ["2026-01-05", 230], ["2026-01-12", 229], ["2026-01-19", 227],
  ["2026-01-26", 226], ["2026-02-02", 226], ["2026-02-09", 224.6],
  ["2026-02-16", 221.8], ["2026-02-23", 222.3], ["2026-03-02", 220.8],
  ["2026-03-09", 220.8], ["2026-03-16", 220], ["2026-03-23", 218.3],
  ["2026-03-30", 217.5], ["2026-04-06", 220.2], ["2026-04-13", 219.9],
  ["2026-04-20", 219.7], ["2026-04-27", 215.4], ["2026-05-04", 218.4],
  ["2026-05-11", 216.8], ["2026-05-18", 219.8], ["2026-05-25", 219.1],
  ["2026-06-01", 218.2], ["2026-06-08", 218.2], ["2026-06-15", 221],
  ["2026-06-22", 220.3], ["2026-06-29", 220.5], ["2026-07-06", 220],
  ["2026-07-13", 219.2], ["2026-07-20", 217.2], ["2026-07-27", 215.6],
];
const LAUREN = [
  ["2026-01-05", 181], ["2026-01-12", 180], ["2026-01-19", 179],
  ["2026-01-26", 176], ["2026-02-02", 173.2], ["2026-02-09", 173.5],
  ["2026-02-16", 170.7], ["2026-02-23", 172.4], ["2026-03-02", 171.3],
  ["2026-03-09", 171], ["2026-03-16", 169.8], ["2026-03-23", 173.3],
  ["2026-03-30", 170.7], ["2026-04-06", 173.8], ["2026-04-13", 172.3],
  ["2026-04-20", 174.6], ["2026-04-27", 174.1], ["2026-05-04", 173.8],
  ["2026-05-11", 175.8], ["2026-05-18", 176.3], ["2026-05-25", 176.8],
  ["2026-06-01", 177.4], ["2026-06-08", 177.4], ["2026-06-15", 179],
  ["2026-06-22", 180.9], ["2026-06-29", 177.1], ["2026-07-06", 180.4],
  ["2026-07-13", 181.1], ["2026-07-20", 177.4], ["2026-07-27", 177.3],
];

// Goal plans — pace = (start − goal) / 52 weeks, matching the sheet's target line.
const GOALS = {
  bryce: { startWeight: 230, startDate: "2026-01-05", goalWeight: 200, perWeekPace: 0.577 },
  lauren: { startWeight: 181, startDate: "2026-01-05", goalWeight: 150, perWeekPace: 0.596 },
};

async function main() {
  // Resolve profile ids by name (case-insensitive).
  const profiles = await sql`SELECT id, name FROM profiles`;
  const byName = (want) =>
    profiles.find((p) => p.name.trim().toLowerCase() === want)?.id ?? null;

  const bryceId = byName("bryce");
  const laurenId = byName("lauren");

  const missing = [];
  if (!bryceId) missing.push("Bryce");
  if (!laurenId) missing.push("Lauren");
  if (missing.length) {
    console.error(
      `Could not find profile(s): ${missing.join(", ")}. ` +
        `Existing profiles: ${profiles.map((p) => p.name).join(", ") || "(none)"}`,
    );
    process.exit(1);
  }

  const people = [
    { id: bryceId, key: "bryce", rows: BRYCE },
    { id: laurenId, key: "lauren", rows: LAUREN },
  ];

  for (const person of people) {
    const g = GOALS[person.key];
    await sql`
      INSERT INTO weight_goals
        (profile_id, start_weight, start_date, goal_weight, per_week_pace, updated_at)
      VALUES
        (${person.id}, ${g.startWeight}, ${g.startDate}, ${g.goalWeight}, ${g.perWeekPace}, now())
      ON CONFLICT (profile_id) DO UPDATE SET
        start_weight = EXCLUDED.start_weight,
        start_date   = EXCLUDED.start_date,
        goal_weight  = EXCLUDED.goal_weight,
        per_week_pace = EXCLUDED.per_week_pace,
        updated_at   = now()
    `;

    for (const [measuredOn, weight] of person.rows) {
      await sql`
        INSERT INTO weigh_ins (profile_id, measured_on, weight)
        VALUES (${person.id}, ${measuredOn}, ${weight})
        ON CONFLICT (profile_id, measured_on) DO UPDATE SET
          weight = EXCLUDED.weight
      `;
    }

    const [{ count }] = await sql`
      SELECT count(*)::int AS count FROM weigh_ins WHERE profile_id = ${person.id}
    `;
    console.log(
      `✓ ${person.key}: goal set (${g.startWeight}→${g.goalWeight} @ ${g.perWeekPace}/wk), ${count} weigh-ins`,
    );
  }

  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
