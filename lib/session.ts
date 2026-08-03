// ─────────────────────────────────────────────────────────────────────────────
// SESSION (server side) — the global-login cookie, read/written via next/headers.
//
// This is the REAL security boundary of the hub (unlike the per-profile edit
// locks, which are a social "hands off my stuff" layer behind it — see lib/auth).
// proxy.ts does the page-level redirect using the same token via
// lib/session-core; these helpers are for Server Actions and data-layer guards.
// Writes (createSession/destroySession) must be called from a Server Action or
// Route Handler — Next.js forbids setting cookies during rendering.
// ─────────────────────────────────────────────────────────────────────────────

import "server-only";
import { cookies } from "next/headers";
import {
  SESSION_COOKIE,
  SESSION_TTL_SECONDS,
  mintSessionToken,
  readSessionToken,
} from "@/lib/session-core";

function secret(): string {
  const s = process.env.COOKIE_SECRET;
  if (!s) throw new Error("COOKIE_SECRET is not set (check .env.local)");
  return s;
}

/** Start a session for an account (call from the login action). */
export async function createSession(accountId: number): Promise<void> {
  const exp = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  const token = await mintSessionToken({ accountId, exp }, secret());
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // allow http on localhost
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

/** End the session (sign out). */
export async function destroySession(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
}

/** The signed-in account id, or null. Pure cookie check — no DB query. */
export async function getSessionAccountId(): Promise<number | null> {
  if (!process.env.COOKIE_SECRET) return null;
  const raw = (await cookies()).get(SESSION_COOKIE)?.value;
  const session = await readSessionToken(raw, secret());
  return session?.accountId ?? null;
}

/** Data-layer guard: throw unless signed in. Belt to the proxy's suspenders. */
export async function requireSession(): Promise<number> {
  const accountId = await getSessionAccountId();
  if (accountId === null) throw new Error("Not signed in.");
  return accountId;
}
