// One-time: fill EMPTY tags now that every counted row is taggable. Mirrors
// lib/finance/categorize.ts — fixed/amortized take their linked bill's
// category; everything else takes the longest matching rule of its own flow
// (spending rules for money out, income rules for money in). Never overwrites
// an existing tag; Excluded and unreadable rows are skipped.
//
//   node scripts/backfill-tags.mjs            dry run (prints what would change)
//   node scripts/backfill-tags.mjs --apply    write it

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

const OUT = ["discretionary", "fixed", "amortized", "savings", "fund"];
const IN = ["income", "reimbursement"];

function longestMatch(merchant, rules) {
  const m = merchant.toLowerCase();
  let best = null;
  for (const r of rules) {
    if (r.pattern && m.includes(r.pattern.toLowerCase())) {
      if (!best || r.pattern.length > best.pattern.length) best = r;
    }
  }
  return best;
}

async function main() {
  const groups = await sql`SELECT DISTINCT group_id FROM transactions`;
  for (const { group_id: groupId } of groups) {
    const rules = await sql`SELECT pattern, category, flow FROM merchant_categories WHERE group_id = ${groupId}`;
    const bills = new Map(
      (await sql`SELECT id, category FROM recurring_expenses WHERE group_id = ${groupId}`).map((b) => [
        b.id,
        b.category,
      ]),
    );
    const rows = await sql`
      SELECT id, merchant, category, recurring_expense_id
      FROM transactions
      WHERE group_id = ${groupId} AND spend_category IS NULL AND NOT needs_review`;

    const byTag = new Map();
    const tally = new Map();
    const examples = [];
    for (const r of rows) {
      const flow = OUT.includes(r.category) ? "out" : IN.includes(r.category) ? "in" : null;
      if (!flow) continue;
      let tag = null;
      if ((r.category === "fixed" || r.category === "amortized") && r.recurring_expense_id != null) {
        tag = bills.get(r.recurring_expense_id) ?? null;
      }
      if (!tag && r.merchant) {
        tag = longestMatch(r.merchant, rules.filter((x) => (x.flow ?? "out") === flow))?.category ?? null;
      }
      if (!tag) continue;
      if (!byTag.has(tag)) byTag.set(tag, []);
      byTag.get(tag).push(r.id);
      tally.set(r.category, (tally.get(r.category) ?? 0) + 1);
      if (examples.length < 12) examples.push(`${r.merchant ?? "—"} (${r.category}) → ${tag}`);
    }

    const total = [...byTag.values()].reduce((s, ids) => s + ids.length, 0);
    console.log(`group #${groupId}: ${total} row(s) to tag`, Object.fromEntries(tally));
    for (const e of examples) console.log(`  ${e}`);

    if (apply) {
      for (const [tag, ids] of byTag) {
        await sql`UPDATE transactions SET spend_category = ${tag} WHERE id = ANY(${ids}) AND spend_category IS NULL`;
      }
      console.log(`  applied.`);
    }
  }
  if (!apply) console.log("Dry run — re-run with --apply to write.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
