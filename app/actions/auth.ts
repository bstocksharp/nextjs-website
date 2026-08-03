"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { enterEditMode, exitEditMode } from "@/lib/auth";

// Edit mode is a passwordless per-device toggle (Phase D — the old per-profile
// unlock passwords are gone; a CLAIMED profile is protected by its claim, see
// lib/auth). These just flip the cookie and refresh in place.

/** Turn editing on and refresh in place (profile-menu toggle). */
export async function enterEditModeAction(): Promise<void> {
  await enterEditMode();
  revalidatePath("/", "layout");
}

/** Turn editing off and refresh in place. */
export async function exitEditModeAction(): Promise<void> {
  await exitEditMode();
  revalidatePath("/", "layout");
}

/**
 * The `/unlock` screen's button — edit-gated pages still redirect there when
 * you're in view mode; one click turns editing on and heads home.
 */
export async function unlockScreenAction(): Promise<void> {
  await enterEditMode();
  revalidatePath("/", "layout");
  redirect("/");
}
