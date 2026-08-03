// Create (or password-reset) a GLOBAL LOGIN account — the only way accounts are
// made; there's deliberately no signup UI. Plain JS + raw SQL on the Neon HTTP
// client, same zero-build-step pattern as the seed scripts.
//
//   node scripts/create-account.mjs <username>            create (prompts for password)
//   node scripts/create-account.mjs <username> --reset    change an existing password
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
const username = args.find((a) => !a.startsWith("--"))?.trim().toLowerCase();

if (!username) {
  console.error("Usage: node scripts/create-account.mjs <username> [--reset]");
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
  } else {
    await sql`INSERT INTO accounts (username, password_hash) VALUES (${username}, ${passwordHash})`;
    console.log(`Account "${username}" created. Sign in at /login.`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
