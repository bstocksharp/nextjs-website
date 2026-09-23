// One-time: add merchant_categories.flow — "out" (spending-tag rules, the
// Categories tab's original kind) or "in" (income-tag rules: Paycheck,
// Interest…). Additive and defaulted, so every existing rule stays a spending
// rule. Idempotent — safe to re-run.
//
//   node scripts/migrate-rule-flow.mjs

import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";

config({ path: ".env.local" });

const url = process.env.POSTGRES_URL_NON_POOLING ?? process.env.POSTGRES_URL;
if (!url) {
  console.error("POSTGRES_URL is not set — check .env.local");
  process.exit(1);
}
const sql = neon(url);

async function main() {
  await sql`ALTER TABLE merchant_categories ADD COLUMN IF NOT EXISTS flow varchar(3) NOT NULL DEFAULT 'out'`;
  const counts = await sql`SELECT flow, count(*)::int AS n FROM merchant_categories GROUP BY flow ORDER BY flow`;
  console.log("merchant_categories by flow:", counts.map((r) => `${r.flow}=${r.n}`).join(", "));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
