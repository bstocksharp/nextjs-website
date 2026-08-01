// One-time migration: copy each weight_goals row into weight_plans as the
// profile's active 'lose' plan (end_date = null). Plain JS + raw SQL on the Neon
// client — no build step. Idempotent: skips a profile that already has a plan, so
// re-running is safe. weight_goals is left untouched as a backup.

import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";

config({ path: ".env.local" });

const url = process.env.POSTGRES_URL ?? process.env.POSTGRES_URL_NON_POOLING;
if (!url) {
  console.error("POSTGRES_URL is not set — check .env.local");
  process.exit(1);
}
const sql = neon(url);

async function main() {
  const goals = await sql`
    SELECT profile_id, start_weight, start_date, goal_weight, per_week_pace
    FROM weight_goals
  `;

  let migrated = 0;
  let skipped = 0;
  for (const g of goals) {
    const [{ count }] = await sql`
      SELECT count(*)::int AS count FROM weight_plans WHERE profile_id = ${g.profile_id}
    `;
    if (count > 0) {
      skipped++;
      continue;
    }
    await sql`
      INSERT INTO weight_plans
        (profile_id, mode, start_weight, start_date, goal_weight, per_week_pace, range_lb, end_date, updated_at)
      VALUES
        (${g.profile_id}, 'lose', ${g.start_weight}, ${g.start_date}, ${g.goal_weight}, ${g.per_week_pace}, NULL, NULL, now())
    `;
    migrated++;
  }

  const [{ goalCount }] = await sql`SELECT count(*)::int AS "goalCount" FROM weight_goals`;
  const [{ planCount }] = await sql`SELECT count(*)::int AS "planCount" FROM weight_plans`;
  console.log(`✓ migrated ${migrated}, skipped ${skipped} (already had a plan)`);
  console.log(`weight_goals: ${goalCount} · weight_plans: ${planCount}`);
  console.log(await sql`SELECT profile_id, mode, start_weight, goal_weight, per_week_pace FROM weight_plans ORDER BY profile_id`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
