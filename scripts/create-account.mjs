// Create (or password-reset) a GLOBAL LOGIN account — the only way accounts are
// made until Phase E's invite links; there's deliberately no signup UI. Plain JS
// + raw SQL on the Neon HTTP client, same zero-build-step pattern as the seeds.
//
//   node scripts/create-account.mjs <username>              new login + ITS OWN new group
//   node scripts/create-account.mjs <username> --join <id>  new login INTO an existing group
//   node scripts/create-account.mjs <username> --reset      change an existing password
//
// The group decides what they see: their own group = a fresh empty hub (a
// friend like Val); --join = full member of that household (sees its data,
// claims a profile at /group). Run without --join when in doubt — joining can't
// be undone from the app yet.
//
// The password is prompted with echo muted (never on the command line — shell
// history is forever). Hash format matches lib/auth.ts: "scrypt$salt$hash".

import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";
import { randomBytes, scryptSync } from "node:crypto";
import readline from "node:readline";

config({ path: ".env.local" });

const url = process.env.POSTGRES_URL ?? process.env.POSTGRES_URL_NON_POOLING;
if (!url) {
  console.error("POSTGRES_URL is not set — check .env.local");
  process.exit(1);
}
const sql = neon(url);

const args = process.argv.slice(2);
const reset = args.includes("--reset");
const joinIndex = args.indexOf("--join");
const joinGroupId = joinIndex >= 0 ? Number(args[joinIndex + 1]) : null;
const username = args
  .filter((a, i) => !a.startsWith("--") && (joinIndex < 0 || i !== joinIndex + 1))[0]
  ?.trim()
  .toLowerCase();

if (!username || (joinIndex >= 0 && !Number.isInteger(joinGroupId))) {
  console.error(
    "Usage: node scripts/create-account.mjs <username> [--join <groupId>] [--reset]",
  );
  process.exit(1);
}

// Hidden-input prompts. ONE readline interface, created lazily at the first
// prompt (created earlier, a piped stdin's EOF could close it while the DB
// lookup is in flight). Lines are captured into a queue rather than via
// rl.question() — question() drops lines that arrive between questions (piped
// input delivers both answers at once). Echo is muted so passwords never appear
// on screen (readline runs the TTY in raw mode and we swallow its output). EOF
// before an answer (Ctrl-D, closed pipe) is a hard error — never a silent exit.
let rl = null;
const bufferedLines = [];
let waiter = null; // {resolve, reject} of the prompt currently awaiting a line

function getRl() {
  if (!rl) {
    rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl._writeToOutput = () => {}; // mute echo; prompts are written directly below
    rl.on("line", (line) => {
      if (waiter) {
        const w = waiter;
        waiter = null;
        w.resolve(line);
      } else {
        bufferedLines.push(line);
      }
    });
    rl.on("close", () => {
      if (waiter) {
        const w = waiter;
        waiter = null;
        w.reject(new Error("Input closed before a password was entered."));
      }
    });
  }
  return rl;
}

function promptHidden(question) {
  getRl();
  process.stdout.write(question);
  if (bufferedLines.length > 0) {
    process.stdout.write("\n");
    return Promise.resolve(bufferedLines.shift());
  }
  return new Promise((resolve, reject) => {
    waiter = {
      resolve: (line) => {
        process.stdout.write("\n");
        resolve(line);
      },
      reject,
    };
  });
}

function hashPassword(plain) {
  const salt = randomBytes(16);
  const hash = scryptSync(plain, salt, 64);
  return `scrypt$${salt.toString("hex")}$${hash.toString("hex")}`;
}

async function main() {
  const [existing] = await sql`SELECT id FROM accounts WHERE username = ${username}`;

  if (existing && !reset) {
    console.error(
      `Account "${username}" already exists. Use --reset to change its password.`,
    );
    process.exit(1);
  }
  if (!existing && reset) {
    console.error(`Account "${username}" doesn't exist — nothing to reset.`);
    process.exit(1);
  }

  // Resolve the group BEFORE prompting — a bad --join should fail fast, not
  // after someone has typed a password twice. --join puts the login INSIDE an
  // existing household (they see its data); default is a brand-new empty group.
  let group = null;
  if (!existing) {
    if (joinGroupId !== null) {
      [group] = await sql`SELECT id, name, is_demo FROM groups WHERE id = ${joinGroupId}`;
      if (!group) {
        const all = await sql`SELECT id, name FROM groups WHERE is_demo = false ORDER BY id`;
        console.error(
          `No group #${joinGroupId}. Existing: ${all.map((g) => `#${g.id} "${g.name}"`).join(", ")}`,
        );
        process.exit(1);
      }
      if (group.is_demo) {
        console.error(
          "Refusing to add a real login to the demo group (it gets wiped on every demo sign-in).",
        );
        process.exit(1);
      }
    }
  }

  const password = await promptHidden(
    `${reset ? "New" : ""} password for "${username}" (typing is hidden): `.trimStart(),
  );
  if (password.length < 8) {
    console.error("Password must be at least 8 characters.");
    process.exit(1);
  }
  const confirm = await promptHidden("Confirm password: ");
  if (password !== confirm) {
    console.error("Passwords don't match — nothing saved.");
    process.exit(1);
  }

  rl?.close();

  const passwordHash = hashPassword(password);
  if (existing) {
    await sql`UPDATE accounts SET password_hash = ${passwordHash} WHERE id = ${existing.id}`;
    console.log(`Password updated for "${username}".`);
    return;
  }

  if (!group) {
    [group] = await sql`INSERT INTO groups (name) VALUES (${`${username}'s hub`}) RETURNING id, name`;
  }

  await sql`INSERT INTO accounts (username, password_hash, group_id)
            VALUES (${username}, ${passwordHash}, ${group.id})`;
  console.log(
    `Account "${username}" created in group #${group.id} "${group.name}"${joinGroupId === null ? " (new)" : ""}. Sign in at /login.`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
