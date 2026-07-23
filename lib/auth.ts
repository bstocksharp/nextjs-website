// ─────────────────────────────────────────────────────────────────────────────
// AUTH — public to view, per-profile password to edit. No accounts, no logins.
//
// The model (see [[auth-single-login-no-roles]]): viewing & running are ALWAYS
// open. Editing is gated per profile. A profile MAY have an optional edit
// password; null = no password (anyone can edit it). "Edit mode" is turned on per
// profile and starts OFF — you unlock a profile (entering its password if it has
// one) and that profile joins the unlocked set carried in a signed cookie.
//
// Two gates:
//   • requireEditor()          — communal/shared writes: the ACTIVE profile must
//                                be in edit mode (the catalog, shared cars, …).
//   • requireEditorFor(owner)  — OWNED writes: the owning profile must be unlocked
//                                (your workouts, schedule, private cars, settings).
//
// This is NOT real security (cookie-based, single trusted household). It's a
// forgiving "hands off my stuff" lock, forward-looking to a multi-person hub.
// ─────────────────────────────────────────────────────────────────────────────

import "server-only";
import { cookies } from "next/headers";
import {
  createHmac,
  timingSafeEqual,
  randomBytes,
  scryptSync,
} from "node:crypto";
import { getActiveProfile } from "@/lib/profile";
import { getProfile } from "@/lib/queries/profiles";

// Signed list of unlocked profile IDs. (Renamed from the old single-token cookie;
// the old "garage_editor" cookie simply stops being read — everyone re-unlocks.)
const COOKIE_NAME = "hub_edit_unlocks";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function secret(): string {
  const s = process.env.COOKIE_SECRET;
  if (!s) throw new Error("COOKIE_SECRET is not set (check .env.local)");
  return s;
}

/** Constant-time equality for two hex strings. */
function safeEqualHex(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

// ── Password hashing (scrypt via node:crypto — no deps) ───────────────────────
/** Hash a plaintext edit password → "scrypt$<saltHex>$<hashHex>". */
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

// ── The unlocked-profiles cookie (signed) ─────────────────────────────────────
function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("hex");
}

/** Read + verify the cookie → the list of currently-unlocked profile IDs. */
async function readUnlocked(): Promise<number[]> {
  const raw = (await cookies()).get(COOKIE_NAME)?.value;
  if (!raw || !process.env.COOKIE_SECRET) return [];
  const dot = raw.lastIndexOf(".");
  if (dot < 0) return [];
  const payload = raw.slice(0, dot);
  if (!safeEqualHex(raw.slice(dot + 1), sign(payload))) return [];
  try {
    const ids = JSON.parse(Buffer.from(payload, "base64").toString("utf8"));
    return Array.isArray(ids) ? ids.filter((n) => Number.isInteger(n)) : [];
  } catch {
    return [];
  }
}

async function writeUnlocked(ids: number[]): Promise<void> {
  const payload = Buffer.from(JSON.stringify([...new Set(ids)])).toString(
    "base64",
  );
  (await cookies()).set(COOKIE_NAME, `${payload}.${sign(payload)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // allow http on localhost
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
}

// ── Queries ───────────────────────────────────────────────────────────────────
/** Is a specific profile currently unlocked (edit mode on for it)? */
export async function isProfileUnlocked(id: number): Promise<boolean> {
  return (await readUnlocked()).includes(id);
}

/**
 * Can we edit the resources OWNED by this profile? Rules (active-profile-centric):
 *   1. You must be in edit mode as the ACTIVE profile at all (preserves read-only).
 *   2. Your OWN (active) stuff → yes.
 *   3. Someone ELSE's stuff → only if that profile is OPEN (no password). A
 *      password-protected profile can only be edited while it's the active one
 *      (switch to it + unlock) — you can't reach into it from another profile.
 */
export async function canEditProfile(
  id: number | null | undefined,
): Promise<boolean> {
  if (id == null) return false;
  if (!(await isEditMode())) return false; // active not editing → nothing
  const active = await getActiveProfile();
  if (active && active.id === id) return true; // your own stuff
  const owner = await getProfile(id);
  return !!owner && !owner.editPasswordHash; // someone else's: only if open
}

/**
 * Is the ACTIVE profile editable right now? True if it has no password (open) or
 * it's been unlocked. Drives the header toggle + communal edits (catalog, shared
 * cars). getActiveProfile already carries editPasswordHash, so this is query-free
 * in the common path.
 */
export async function isEditMode(): Promise<boolean> {
  const active = await getActiveProfile();
  if (!active) return false;
  if (!active.editPasswordHash) return true; // no password → editing is open
  return isProfileUnlocked(active.id);
}

// Back-compat alias: existing callers read isEditor() to mean "am I editing now".
// Under the per-profile model that's "the active profile is in edit mode".
export const isEditor = isEditMode;

/** Guard for COMMUNAL writes (catalog, shared cars): active profile in edit mode. */
export async function requireEditor(): Promise<void> {
  if (!(await isEditMode())) {
    throw new Error("Not in edit mode — unlock editing first.");
  }
}

/** Guard for OWNED writes: the owning profile must be unlocked. */
export async function requireEditorFor(
  ownerId: number | null | undefined,
): Promise<void> {
  if (!(await canEditProfile(ownerId))) {
    throw new Error("Not authorized — unlock this profile to edit its stuff.");
  }
}

// ── Unlock / lock (mutations — call from Server Actions) ───────────────────────
export type UnlockResult = { ok: true } | { ok: false; error: string };

/** Turn edit mode ON for a profile (verifying its password if it has one). */
export async function unlockProfile(
  id: number,
  password?: string,
): Promise<UnlockResult> {
  const profile = await getProfile(id);
  if (!profile) return { ok: false, error: "Profile not found." };
  if (profile.editPasswordHash) {
    if (!password || !verifyPassword(password, profile.editPasswordHash)) {
      return { ok: false, error: "Incorrect password." };
    }
  }
  await writeUnlocked([...(await readUnlocked()), id]);
  return { ok: true };
}

/** Turn edit mode OFF for one profile. */
export async function lockProfile(id: number): Promise<void> {
  await writeUnlocked((await readUnlocked()).filter((x) => x !== id));
}

/**
 * Lock every profile (clear the unlocked set). Called when switching profiles so
 * an unlocked password-protected profile doesn't linger once you've stepped away.
 * Passwordless profiles stay editable (they're open regardless of the set).
 */
export async function lockAll(): Promise<void> {
  await writeUnlocked([]);
}
