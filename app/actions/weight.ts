"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { weighIns, weightGoals } from "@/lib/db/schema";
import { requireEditorFor } from "@/lib/auth";

// Weigh-ins & goals are OWNED by a profile (Bryce's ≠ Lauren's), so every write
// goes through requireEditorFor(profileId) — the same owner-gate workouts use.
// Viewing the dashboard is always open; only logging/editing needs edit mode.

const str = (formData: FormData, k: string) => {
  const v = String(formData.get(k) ?? "").trim();
  return v === "" ? null : v;
};

/** Log (or overwrite) a weigh-in for a day. Unique (profile, day) → idempotent. */
export async function logWeight(profileId: number, formData: FormData): Promise<void> {
  await requireEditorFor(profileId);

  const measuredOn = str(formData, "measuredOn");
  const weight = str(formData, "weight");
  const note = str(formData, "note");
  if (!measuredOn) throw new Error("Date is required.");
  if (!weight) throw new Error("Weight is required.");

  await db
    .insert(weighIns)
    .values({ profileId, measuredOn, weight, note })
    .onConflictDoUpdate({
      target: [weighIns.profileId, weighIns.measuredOn],
      set: { weight, note },
    });

  revalidatePath("/weight");
  revalidatePath("/weight/history");
}

/** Edit an existing weigh-in by id (can change its date/weight/note). */
export async function updateWeighIn(
  id: number,
  profileId: number,
  formData: FormData,
): Promise<void> {
  await requireEditorFor(profileId);

  const measuredOn = str(formData, "measuredOn");
  const weight = str(formData, "weight");
  const note = str(formData, "note");
  if (!measuredOn) throw new Error("Date is required.");
  if (!weight) throw new Error("Weight is required.");

  await db
    .update(weighIns)
    .set({ measuredOn, weight, note })
    .where(and(eq(weighIns.id, id), eq(weighIns.profileId, profileId)));

  revalidatePath("/weight");
  revalidatePath("/weight/history");
}

/** Remove a weigh-in (scoped to the profile so you can't delete another's). */
export async function deleteWeighIn(
  id: number,
  profileId: number,
  _formData: FormData,
): Promise<void> {
  await requireEditorFor(profileId);

  await db
    .delete(weighIns)
    .where(and(eq(weighIns.id, id), eq(weighIns.profileId, profileId)));

  revalidatePath("/weight");
  revalidatePath("/weight/history");
}

/** Create or re-plan the goal (one row per profile; overwrite on re-plan). */
export async function setGoal(profileId: number, formData: FormData): Promise<void> {
  await requireEditorFor(profileId);

  const startWeight = str(formData, "startWeight");
  const startDate = str(formData, "startDate");
  const goalWeight = str(formData, "goalWeight");
  const perWeekPace = str(formData, "perWeekPace");
  if (!startWeight || !startDate || !goalWeight || !perWeekPace) {
    throw new Error("Start weight, start date, goal weight, and pace are all required.");
  }

  await db
    .insert(weightGoals)
    .values({ profileId, startWeight, startDate, goalWeight, perWeekPace })
    .onConflictDoUpdate({
      target: weightGoals.profileId,
      set: { startWeight, startDate, goalWeight, perWeekPace, updatedAt: new Date() },
    });

  revalidatePath("/weight");
  revalidatePath("/weight/history");
}
