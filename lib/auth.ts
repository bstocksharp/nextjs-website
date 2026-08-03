// ─────────────────────────────────────────────────────────────────────────────
// AUTH LAYER 2 — edit mode + "claim is the lock" (behind the global login).
//
// The hub's real security boundary is the login + group tenancy (lib/session,
// proxy.ts, lib/queries). Behind it, WRITES are gated by two things:
//
//   1. EDIT MODE — a passwordless per-device toggle (the profile menu's
//      "Enter edit mode"). Starts OFF so browsing never edits by accident; a
//      plain preference cookie, deliberately unsigned — it grants nothing by
//      itself, every guard also checks the session and the claim.
//   2. THE CLAIM — an account may claim a profile (accounts.profileId, managed
//      at /group). A CLAIMED profile's stuff is editable only by its claiming
//      account; an UNCLAIMED profile (a kid) is open to the whole group.
//
// Phase D retired the per-profile edit passwords: the login already proves who
// you are, so the claim replaces the password. hashPassword/verifyPassword
// remain here for ACCOUNT passwords (login + scripts/create-account.mjs).
//
// Two gates, same names as always (every write action calls one):
//   • requireEditor()          — communal writes (catalog, shared cars, …).
//   • requireEditorFor(owner)  — owned writes (workouts, private cars, weight).
// ─────────────────────────────────────────────────────────────────────────────

import "server-only";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { db } from "@/lib/db";
import { accounts } from "@/lib/db/schema";
import { getSession, requireSession } from "@/lib/session";
import { getProfile } from "@/lib/queries/profiles";

// ── Password hashing (scrypt via node:crypto — no deps). ACCOUNT passwords. ───
/** Hash a plaintext password → "scrypt$<saltHex>$<hashHex>". */
export function hashPassword(plain: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(plain, salt, 64);
  return `scrypt$${salt.toString("hex")}$${hash.toString("hex")}`;
}

/** Verify a plaintext against a stored hash. A null hash means "no password set". */
export function verifyPassword(plain: string, stored: string | null): boolean {
  if (!stored) return true; // no password → always passes (open)
  const [scheme, saltHex, hashHex] = stored.split("$");
  if (scheme !== "scrypt" || !saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, "hex");
  const actual = scryptSync(plain, Buffer.from(saltHex, "hex"), expected.length);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

// ── Edit mode (per-device toggle) ─────────────────────────────────────────────
const EDIT_MODE_COOKIE = "hub_edit_mode";
const EDIT_MODE_MAX_AGE = 60 * 60 * 24 * 30; // re-flip once a month, tops

/** Is this device in edit mode? (Signed-out is never editing.) */
export async function isEditMode(): Promise<boolean> {
  if ((await getSession()) === null) return false;
  return (await cookies()).get(EDIT_MODE_COOKIE)?.value === "1";
}

// Back-compat alias: existing pages read isEditor() to mean "am I editing now".
export const isEditor = isEditMode;

/** Flip edit mode on (call from a Server Action). */
export async function enterEditMode(): Promise<void> {
  (await cookies()).set(EDIT_MODE_COOKIE, "1", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: EDIT_MODE_MAX_AGE,
  });
}

/** Flip edit mode off. */
export async function exitEditMode(): Promise<void> {
  (await cookies()).delete(EDIT_MODE_COOKIE);
}

// ── Claims ────────────────────────────────────────────────────────────────────
/** The account id claiming this profile, or null if unclaimed. */
export async function claimedBy(profileId: number): Promise<number | null> {
  const [row] = await db
    .select({ id: accounts.id })
    .from(accounts)
    .where(eq(accounts.profileId, profileId))
    .limit(1);
  return row?.id ?? null;
}

/**
 * Can the signed-in account edit the resources OWNED by this profile?
 *   1. Must be in edit mode at all (keeps browsing read-only).
 *   2. Profile must exist IN OUR GROUP (scoped getProfile — foreign ids fail).
 *   3. Unclaimed profile → open to everyone in the group (the kid case).
 *      Claimed profile → only its claiming account ("claim is the lock").
 */
export async function canEditProfile(
  id: number | null | undefined,
): Promise<boolean> {
  if (id == null) return false;
  const session = await getSession();
  if (!session) return false;
  if (!(await isEditMode())) return false;
  if (!(await getProfile(id))) return false; // not ours → not editable
  const owner = await claimedBy(id);
  return owner === null || owner === session.accountId;
}

// ── Guards (call from Server Actions) ─────────────────────────────────────────
/** Guard for COMMUNAL writes (catalog, shared cars): signed in + edit mode. */
export async function requireEditor(): Promise<void> {
  await requireSession();
  if (!(await isEditMode())) {
    throw new Error("Not in edit mode — turn on editing first.");
  }
}

/** Guard for OWNED writes: unclaimed-or-yours, in edit mode. */
export async function requireEditorFor(
  ownerId: number | null | undefined,
): Promise<void> {
  if (!(await canEditProfile(ownerId))) {
    throw new Error(
      "Not authorized — this profile is claimed by another account.",
    );
  }
}
