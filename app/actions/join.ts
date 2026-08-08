"use server";

import { redirect } from "next/navigation";
import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { accounts, groups, invites, profiles } from "@/lib/db/schema";
import { hashPassword } from "@/lib/auth";
import { createSession } from "@/lib/session";
import { setActiveProfileCookie } from "@/lib/profile";
import { getJoinableInvite } from "@/lib/queries/invites";

// Invite redemption (Phase E) — the ONE signup path, and the one action that
// deliberately runs with NO session: the visitor doesn't have a login yet, the
// unguessable invite token is their credential (the proxy allowlists /join/*).
// Everything is re-validated server-side; the token in the form is checked
// against the live-invite rules on every submit, so a revoked/expired link
// fails here even if the page was already open.

export type JoinState = { error: string } | null;

// Same spirit as create-account.mjs (lowercase, ≥3 chars) plus a tight charset —
// usernames end up in UI chips and greetings, keep them boring.
const USERNAME_RE = /^[a-z0-9][a-z0-9._-]{2,79}$/;

export async function redeemInviteAction(
  _prev: JoinState,
  formData: FormData,
): Promise<JoinState> {
  const token = String(formData.get("token") ?? "");
  const username = String(formData.get("username") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (!USERNAME_RE.test(username)) {
    return {
      error:
        "Username must be at least 3 characters — lowercase letters, numbers, dots, dashes.",
    };
  }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }
  if (password !== confirm) {
    return { error: "Passwords don't match." };
  }

  // Re-validate the invite NOW (not when the page rendered).
  const invite = await getJoinableInvite(token);
  if (!invite) {
    return { error: "This invite link is no longer valid — ask for a fresh one." };
  }

  // Resolve the destination group. Household: it must still exist and never be
  // the demo group (wiped on every tour). Own hub: mint a fresh empty group.
  let groupId: number;
  if (invite.groupId !== null) {
    const [group] = await db
      .select({ id: groups.id, isDemo: groups.isDemo })
      .from(groups)
      .where(eq(groups.id, invite.groupId))
      .limit(1);
    if (!group || group.isDemo) {
      return { error: "This invite link is no longer valid — ask for a fresh one." };
    }
    groupId = group.id;
  } else {
    const [group] = await db
      .insert(groups)
      .values({ name: `${username}'s hub` })
      .returning({ id: groups.id });
    groupId = group.id;
  }

  // Create the login. The unique index on username is the real arbiter — the
  // catch turns a taken name (including a race) into a friendly form error.
  let accountId: number;
  try {
    const [account] = await db
      .insert(accounts)
      .values({ username, passwordHash: hashPassword(password), groupId })
      .returning({ id: accounts.id });
    accountId = account.id;
  } catch {
    return { error: "That username is taken — try another." };
  }

  // A fresh own hub would be a ghost town (zero people, nothing to claim, no
  // owner), so finish furnishing it: they OWN it (can invite their own people),
  // and they get a profile named after them, pre-claimed — the hub works
  // immediately. Household joiners claim an EXISTING person at /group instead.
  let ownProfileId: number | null = null;
  if (invite.groupId === null) {
    await db
      .update(groups)
      .set({ ownerAccountId: accountId })
      .where(eq(groups.id, groupId));
    const display = username.charAt(0).toUpperCase() + username.slice(1);
    const [profile] = await db
      .insert(profiles)
      .values({ groupId, name: display })
      .returning({ id: profiles.id });
    ownProfileId = profile.id;
    await db
      .update(accounts)
      .set({ profileId: profile.id })
      .where(eq(accounts.id, accountId));
  }

  // Burn the use AFTER the account exists — a failed signup never eats a
  // single-use link. (New account first, increment second: the harmless order.)
  await db
    .update(invites)
    .set({ usedCount: sql`${invites.usedCount} + 1` })
    .where(eq(invites.id, invite.id));

  await createSession(accountId, groupId);
  if (ownProfileId !== null) await setActiveProfileCookie(ownProfileId);

  // Household joiners land on /group to claim their person; own-hub owners on
  // their fresh (empty but working) hub.
  redirect(invite.groupId !== null ? "/group" : "/");
}
