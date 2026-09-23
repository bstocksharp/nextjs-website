// One-time: retire a legacy "Savings" ATLAS line item now that the budget
// subtracts the savings goal itself. The line is end-dated the day before the
// group's first goal starts, so every month keeps the same discretionary
// budget: before the goal, the line reserves it; from the goal on, the goal
// does. Run it AFTER the code that subtracts the goal is deployed — until then
// the old code would count neither. Idempotent.
//
//   node scripts/migrate-savings-goal.mjs            dry run
//   node scripts/migrate-savings-goal.mjs --apply    write it

import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";

config({ path: ".env.local" });

const url = process.env.POSTGRES_URL_NON_POOLING ?? process.env.POSTGRES_URL;
if (!url) {
  console.error("POSTGRES_URL is not set — check .env.local");
  process.exit(1);
}
const sql = neon(url);
const apply = process.argv.includes("--apply");

function dayBefore(iso) {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

async function main() {
  const firstGoals = await sql`
    SELECT group_id, min(start_month)::text AS start FROM savings_goals GROUP BY group_id`;
  for (const { group_id: groupId, start } of firstGoals) {
    const end = dayBefore(start);
    const lines = await sql`
      SELECT id, name, amount, start_date::text AS s, end_date::text AS e
      FROM recurring_expenses
      WHERE group_id = ${groupId} AND lower(trim(name)) = 'savings' AND payments_per_year = 12
        AND start_date <= ${end} AND (end_date IS NULL OR end_date > ${end})`;
    for (const l of lines) {
      console.log(`group #${groupId}: "${l.name}" $${l.amount}/mo ${l.s}..${l.e ?? "open"} → end ${end} (goal starts ${start})`);
      if (apply) await sql`UPDATE recurring_expenses SET end_date = ${end} WHERE id = ${l.id}`;
    }
    if (!lines.length) console.log(`group #${groupId}: nothing to retire`);
  }
  if (!apply) console.log("Dry run — re-run with --apply to write.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
