// ─────────────────────────────────────────────────────────────────────────────
// WEBAUTHN PLUMBING (server-only) — the two things every passkey flow needs:
//
// 1. The RELYING PARTY identity (rpID + origin), derived from the request's
//    Host headers rather than an env var, so localhost dev and the deployed
//    domain both Just Work. A passkey is bound to the rpID it was created on —
//    one registered on the production domain won't exist on localhost and vice
//    versa (that's WebAuthn working as designed, not a bug).
//
// 2. The CHALLENGE COOKIE: WebAuthn is a two-step dance (server issues a random
//    challenge → authenticator signs it → server verifies). The challenge has
//    to survive between the two server actions, so it rides in a short-lived
//    signed cookie (same HMAC tokens as the session — lib/session-core), tagged
//    with its purpose so a registration challenge can't be replayed at login.
// ─────────────────────────────────────────────────────────────────────────────

import "server-only";
import { cookies, headers } from "next/headers";
import { mintToken, readToken } from "@/lib/session-core";

const CHALLENGE_COOKIE = "hub_webauthn";
const CHALLENGE_TTL_SECONDS = 60 * 5; // plenty for one Face ID prompt

function secret(): string {
  const s = process.env.COOKIE_SECRET;
  if (!s) throw new Error("COOKIE_SECRET is not set (check .env.local)");
  return s;
}

/** rpID + origin + display name for this request's host (proxy-aware). */
export async function relyingParty(): Promise<{
  rpID: string;
  origin: string;
  rpName: string;
}> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (!host) throw new Error("No Host header — can't derive the WebAuthn rpID.");
  const rpID = host.split(":")[0]; // hostname only, no port
  const proto =
    h.get("x-forwarded-proto") ??
    (rpID === "localhost" || rpID === "127.0.0.1" ? "http" : "https");
  return { rpID, origin: `${proto}://${host}`, rpName: "Hub" };
}

type ChallengePurpose = "registration" | "authentication";

type ChallengePayload = {
  challenge: string;
  purpose: ChallengePurpose;
  accountId: number | null; // set for registration (must match the session)
  exp: number;
};

/** Stash the pending challenge (called by the start-* actions). */
export async function storeChallenge(
  challenge: string,
  purpose: ChallengePurpose,
  accountId: number | null = null,
): Promise<void> {
  const exp = Math.floor(Date.now() / 1000) + CHALLENGE_TTL_SECONDS;
  const token = await mintToken({ challenge, purpose, accountId, exp }, secret());
  (await cookies()).set(CHALLENGE_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: CHALLENGE_TTL_SECONDS,
  });
}

/**
 * Retrieve AND CLEAR the pending challenge (called by the finish-* actions).
 * One-shot on purpose: a challenge that verified once must never verify twice.
 * Returns null if missing/expired/tampered or minted for a different purpose.
 */
export async function takeChallenge(
  purpose: ChallengePurpose,
): Promise<{ challenge: string; accountId: number | null } | null> {
  const jar = await cookies();
  const raw = jar.get(CHALLENGE_COOKIE)?.value;
  jar.delete(CHALLENGE_COOKIE);
  const payload = await readToken<ChallengePayload>(raw, secret());
  if (!payload || payload.purpose !== purpose) return null;
  return { challenge: payload.challenge, accountId: payload.accountId };
}
