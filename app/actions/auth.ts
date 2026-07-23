"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { unlockProfile, lockProfile, type UnlockResult } from "@/lib/auth";
import { getActiveProfile } from "@/lib/profile";

// Edit mode is per-profile now: these all act on whoever's ACTIVE. Switch profile
// first (that's open to everyone), then unlock that person to edit their stuff.

export type UnlockState = UnlockResult | null;

/**
 * Inline unlock — the profile-menu password dialog. Unlocks the active profile;
 * returns a result so the dialog can show an error in place, and revalidates on
 * success so edit permissions refresh without navigating away.
 */
export async function unlockInlineAction(
  _prev: UnlockState,
  formData: FormData,
): Promise<UnlockState> {
  const active = await getActiveProfile();
  if (!active) return { ok: false, error: "No active profile to unlock." };

  const result = await unlockProfile(active.id, String(formData.get("password") ?? ""));
  if (result.ok) revalidatePath("/", "layout");
  return result;
}

/**
 * Enter edit mode for a PASSWORDLESS active profile — one click, no dialog. (If
 * the profile actually has a password, unlockProfile refuses and nothing changes.)
 */
export async function enterEditModeAction(): Promise<void> {
  const active = await getActiveProfile();
  if (!active) return;
  const result = await unlockProfile(active.id);
  if (result.ok) revalidatePath("/", "layout");
}

/**
 * Full-page unlock — the `/unlock` fallback route. Unlocks the active profile; on
 * success, home.
 */
export async function unlockAction(formData: FormData): Promise<void> {
  const active = await getActiveProfile();
  if (!active) redirect("/");

  const result = await unlockProfile(active.id, String(formData.get("password") ?? ""));
  if (!result.ok) redirect("/unlock?error=1");

  revalidatePath("/", "layout");
  redirect("/");
}

/** Leave edit mode for the active profile, and refresh in place. */
export async function lockAction(): Promise<void> {
  const active = await getActiveProfile();
  if (active) await lockProfile(active.id);
  revalidatePath("/", "layout");
}
