"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { accounts, groups } from "@/lib/db/schema";
import { requireSession } from "@/lib/session";
import { claimedBy, requireEditor } from "@/lib/auth";
import { getProfile } from "@/lib/queries/profiles";

// Claims are SELF-service: an account claims a profile for itself ("I am this
// person") — nobody claims on someone else's behalf. Kicking members / invites
// / a group owner (groups.ownerAccountId) arrive with Phase E; until then the
// create-account script is effectively the admin.

/** Claim a profile as the signed-in account ("this login is this person"). */
export async function claimProfileAction(
  profileId: number,
  _formData: FormData,
): Promise<void> {
  const { accountId } = await requireSession();

  const profile = await getProfile(profileId); // group-scoped
  if (!profile) throw new Error("Profile not found.");
  const owner = await claimedBy(profileId);
  if (owner !== null && owner !== accountId) {
    throw new Error("That profile is already claimed by another account.");
  }

  // Re-claiming moves YOUR claim (an account claims at most one profile).
  await db
    .update(accounts)
    .set({ profileId })
    .where(eq(accounts.id, accountId));

  revalidatePath("/group");
  revalidatePath("/", "layout");
}

/** Release the signed-in account's claim (the profile becomes open again). */
export async function releaseClaimAction(_formData: FormData): Promise<void> {
  const { accountId } = await requireSession();
  await db
    .update(accounts)
    .set({ profileId: null })
    .where(and(eq(accounts.id, accountId)));

  revalidatePath("/group");
  revalidatePath("/", "layout");
}

/** Rename the household (shown on /group and, someday, in invites). */
export async function renameGroupAction(formData: FormData): Promise<void> {
  await requireEditor();
  const { groupId } = await requireSession();
  const name = String(formData.get("name") ?? "").trim().slice(0, 120);
  if (!name) throw new Error("Group name is required.");

  await db.update(groups).set({ name }).where(eq(groups.id, groupId));
  revalidatePath("/group");
}
