// One-time setup for the DEMO tenant: a group flagged is_demo + the demo/demo
// account. The group starts EMPTY on purpose — the reseed hook in the login
// action (lib/demo.ts) plants the tour data on the demo account's first (and
// every) sign-in, so this script never needs the app's TypeScript code.
//
//   node scripts/seed-demo.mjs
//
// Idempotent: re-running finds the existing demo group/account and leaves them.
// The password is intentionally trivial ("demo") — it's a semi-public tour
// account whose group gets wiped on every login; there is nothing to protect.

import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";
import { randomBytes, scryptSync } from "node:crypto";

config({ path: ".env.local" });

const url = process.env.POSTGRES_URL ?? process.env.POSTGRES_URL_NON_POOLING;
if (!url) {
  console.error("POSTGRES_URL is not set — check .env.local");
  process.exit(1);
}
const sql = neon(url);

function hashPassword(plain) {
  const salt = randomBytes(16);
  const hash = scryptSync(plain, salt, 64);
  return `scrypt$${salt.toString("hex")}$${hash.toString("hex")}`;
}

async function main() {
  let [group] = await sql`SELECT id FROM groups WHERE is_demo = true LIMIT 1`;
  if (!group) {
    [group] = await sql`INSERT INTO groups (name, is_demo) VALUES ('Demo', true) RETURNING id`;
    console.log(`Created demo group #${group.id}`);
  } else {
    console.log(`Demo group #${group.id} already exists`);
  }

  const [account] = await sql`SELECT id FROM accounts WHERE username = 'demo'`;
  if (!account) {
    await sql`INSERT INTO accounts (username, password_hash, group_id)
              VALUES ('demo', ${hashPassword("demo")}, ${group.id})`;
    console.log('Created account "demo" (password: demo)');
  } else {
    console.log('Account "demo" already exists');
  }

  console.log("Done — sign in as demo/demo and the tour data plants itself.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
