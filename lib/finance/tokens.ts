// API-token mint + hash for the finance machine endpoints (ingest/widget).
// Only sha256(token) is ever stored — the raw `fin_…` secret is shown ONCE at
// mint and lives in the user's Shortcut/Scriptable config. sha256 (not scrypt)
// is right here: 24 random bytes have full entropy, so slow hashing adds
// nothing, and the ingest path runs on every card swipe.

import { createHash, randomBytes } from "node:crypto";

export const TOKEN_PREFIX = "fin_";

export function mintApiToken(): { token: string; tokenHash: string } {
  const token = TOKEN_PREFIX + randomBytes(24).toString("base64url");
  return { token, tokenHash: hashApiToken(token) };
}

export function hashApiToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Cheap shape check before hitting the DB (wrong-prefix junk → fast reject). */
export function looksLikeApiToken(raw: string | null | undefined): raw is string {
  return typeof raw === "string" && raw.startsWith(TOKEN_PREFIX) && raw.length > 20;
}
