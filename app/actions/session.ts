"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { accounts } from "@/lib/db/schema";
import { hashPassword, verifyPassword } from "@/lib/auth";
import { createSession, destroySession } from "@/lib/session";

// The global login/logout. Accounts are created only via
// scripts/create-account.mjs (no signup UI by design — see the schema notes).

export type LoginState = { error: string } | null;

// Verified against when the username doesn't exist, so "no such user" costs the
// same scrypt work as "wrong password" — no timing tell for username guessing.
const DUMMY_HASH = hashPassword("dummy-timing-equalizer");

/** Login form action (useActionState). On success: session cookie + redirect. */
export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const username = String(formData.get("username") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  const from = String(formData.get("from") ?? "");

  if (!username || !password) {
    return { error: "Enter a username and password." };
  }

  const [account] = await db
    .select()
    .from(accounts)
    .where(eq(accounts.username, username))
    .limit(1);

  const ok = account
    ? verifyPassword(password, account.passwordHash)
    : (verifyPassword(password, DUMMY_HASH), false);
  if (!ok || !account) {
    return { error: "Incorrect username or password." };
  }

  await createSession(account.id);
  // Only same-site paths — never a full URL (open-redirect guard).
  redirect(from.startsWith("/") && !from.startsWith("//") ? from : "/");
}

/** Sign out: drop the session cookie and land on the login page. */
export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/login");
}
