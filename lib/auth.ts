// ─────────────────────────────────────────────────────────────────────────────
// AUTH — public to view, password to edit. No accounts, no third-party auth.
//
// Unlock: a form posts the password to a Server Action. If it matches
// EDIT_PASSWORD, we set an httpOnly cookie whose value is a keyed HMAC of the
// literal "editor" (so it can't be forged without COOKIE_SECRET). isEditor()
// recomputes that HMAC and constant-time compares. This generalizes to the whole
// hub, not just cars.
// ─────────────────────────────────────────────────────────────────────────────

import "server-only";
import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";

const COOKIE_NAME = "garage_editor";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

/** Constant-time equality for two strings (guards against timing attacks). */
function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

/** The unforgeable cookie value: HMAC-SHA256(COOKIE_SECRET, "editor"). */
function editorToken(): string {
  const secret = process.env.COOKIE_SECRET;
  if (!secret) throw new Error("COOKIE_SECRET is not set (check .env.local)");
  return createHmac("sha256", secret).update("editor").digest("hex");
}

/** True when the request carries a valid editor cookie. */
export async function isEditor(): Promise<boolean> {
  const value = (await cookies()).get(COOKIE_NAME)?.value;
  if (!value) return false;
  return safeEqual(value, editorToken());
}

/** Does the submitted password match EDIT_PASSWORD? */
export function checkPassword(input: string): boolean {
  const expected = process.env.EDIT_PASSWORD;
  if (!expected) throw new Error("EDIT_PASSWORD is not set (check .env.local)");
  return safeEqual(input, expected);
}

export async function setEditorCookie(): Promise<void> {
  (await cookies()).set(COOKIE_NAME, editorToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // allow http on localhost
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
}

export async function clearEditorCookie(): Promise<void> {
  (await cookies()).delete(COOKIE_NAME);
}

/**
 * Guard for mutating Server Actions. Call at the top of every write action:
 *   await requireEditor();
 * Throws if the caller isn't an unlocked editor.
 */
export async function requireEditor(): Promise<void> {
  if (!(await isEditor())) {
    throw new Error("Not authorized — unlock editing first.");
  }
}
