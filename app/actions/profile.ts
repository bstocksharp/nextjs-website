"use server";

import { revalidatePath } from "next/cache";
import { and, eq, isNull, ne } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  profiles,
  vehicles,
  workouts,
  workoutAssignments,
} from "@/lib/db/schema";
import { requireEditor } from "@/lib/auth";
import { getActiveProfile, setActiveProfileCookie } from "@/lib/profile";

/** First active profile other than `exceptId`, or null. */
async function otherActiveProfile(exceptId: number) {
  const rows = await db
    .select({ id: profiles.id })
    .from(profiles)
    .where(and(isNull(profiles.archivedAt), ne(profiles.id, exceptId)))
    .orderBy(profiles.sortOrder, profiles.id)
    .limit(1);
  return rows[0] ?? null;
}

// Switching who we are is harmless (it only changes whose data you view), so it's
// open to anyone. Adding a person is a mutation — editor-gated.

/** Make `id` the active profile and refresh every server-rendered page. */
export async function switchProfile(id: number): Promise<void> {
  await setActiveProfileCookie(id);
  revalidatePath("/", "layout");
}

/** Create a new person and switch to them. */
export async function addPerson(formData: FormData): Promise<void> {
  await requireEditor();

  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Name is required.");
  const color = String(formData.get("color") ?? "").trim() || null;

  const [created] = await db
    .insert(profiles)
    .values({ name, color })
    .returning();

  if (created) await setActiveProfileCookie(created.id);
  revalidatePath("/", "layout");
}

/**
 * Deactivate (soft-delete): hide from the switcher + stop it being active, but keep
 * ALL their data. Reversible via reactivateProfile. Can't leave zero active
 * profiles; if the archived one is currently active, switch to another first.
 */
export async function deactivateProfile(id: number): Promise<void> {
  await requireEditor();

  const activeCount = await db.$count(profiles, isNull(profiles.archivedAt));
  if (activeCount <= 1) {
    throw new Error("Can't deactivate the only active profile.");
  }

  const current = await getActiveProfile();
  if (current?.id === id) {
    const other = await otherActiveProfile(id);
    if (other) await setActiveProfileCookie(other.id);
  }

  await db
    .update(profiles)
    .set({ archivedAt: new Date() })
    .where(eq(profiles.id, id));

  revalidatePath("/", "layout");
}

/** Restore an archived profile. */
export async function reactivateProfile(id: number): Promise<void> {
  await requireEditor();
  await db.update(profiles).set({ archivedAt: null }).where(eq(profiles.id, id));
  revalidatePath("/", "layout");
}

/**
 * Permanently delete a profile (irreversible). Shared cars + the workouts they
 * authored transfer to `heirId` so nothing shared is lost; their PRIVATE cars (and
 * that history) plus their weekly schedule are deleted with them.
 */
export async function deleteProfileForever(
  id: number,
  heirId: number,
): Promise<void> {
  await requireEditor();

  if (heirId === id) throw new Error("Pick a different profile to inherit.");
  const [heir] = await db
    .select({ id: profiles.id })
    .from(profiles)
    .where(and(eq(profiles.id, heirId), isNull(profiles.archivedAt)))
    .limit(1);
  if (!heir) throw new Error("Heir profile not found.");

  const wasActive = (await getActiveProfile())?.id === id;

  // Hand off shared belongings so the remaining people keep them.
  await db
    .update(vehicles)
    .set({ profileId: heirId })
    .where(and(eq(vehicles.profileId, id), eq(vehicles.visibility, "shared")));
  await db
    .update(workouts)
    .set({ createdByProfileId: heirId })
    .where(eq(workouts.createdByProfileId, id));

  // Delete what's solely theirs (private cars cascade their maintenance/fuel/etc.).
  await db
    .delete(vehicles)
    .where(and(eq(vehicles.profileId, id), eq(vehicles.visibility, "private")));
  await db.delete(workoutAssignments).where(eq(workoutAssignments.profileId, id));

  await db.delete(profiles).where(eq(profiles.id, id));

  if (wasActive) await setActiveProfileCookie(heirId);
  revalidatePath("/", "layout");
}
