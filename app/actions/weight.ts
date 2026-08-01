"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { weighIns, weightPlans } from "@/lib/db/schema";
import { requireEditorFor } from "@/lib/auth";
import { getActivePlan } from "@/lib/queries/weight";

// Whole weeks between two YYYY-MM-DD dates (≥1, so deadline math never divides by 0).
function weeksBetween(startISO: string, endISO: string): number {
  const ms = new Date(`${endISO}T12:00:00Z`).getTime() - new Date(`${startISO}T12:00:00Z`).getTime();
  return Math.max(1, Math.round(ms / (7 * 86_400_000)));
}

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

/**
 * Create or edit the ACTIVE plan. Lose plans can be defined two ways:
 *   • by pace  → perWeekPace, open-ended (endDate null)
 *   • by date  → a targetDate deadline; pace is derived and endDate = deadline
 * (Maintain mode + starting a fresh plan land in 2b-2/2b-3.)
 */
export async function savePlan(profileId: number, formData: FormData): Promise<void> {
  await requireEditorFor(profileId);

  const mode = str(formData, "mode") ?? "lose";
  const startWeight = str(formData, "startWeight");
  const startDate = str(formData, "startDate");
  const goalWeight = str(formData, "goalWeight");
  if (!startWeight || !startDate || !goalWeight) {
    throw new Error("Start weight, start date, and goal weight are required.");
  }

  let perWeekPace = str(formData, "perWeekPace");
  let endDate: string | null = null;

  if (mode === "lose") {
    const paceMode = str(formData, "paceMode") ?? "pace";
    if (paceMode === "date") {
      const targetDate = str(formData, "targetDate");
      if (!targetDate) throw new Error("Target date is required.");
      const lbs = Number(startWeight) - Number(goalWeight);
      perWeekPace = (lbs / weeksBetween(startDate, targetDate)).toFixed(3);
      endDate = targetDate;
    } else if (!perWeekPace) {
      throw new Error("Pace is required.");
    }
  }

  const values = {
    profileId,
    mode,
    startWeight,
    startDate,
    goalWeight,
    perWeekPace: perWeekPace ?? "0",
    rangeLb: str(formData, "rangeLb"),
    endDate,
  };

  const active = await getActivePlan(profileId);
  if (active) {
    await db
      .update(weightPlans)
      .set({ ...values, updatedAt: new Date() })
      .where(and(eq(weightPlans.id, active.id), eq(weightPlans.profileId, profileId)));
  } else {
    await db.insert(weightPlans).values(values);
  }

  revalidatePath("/weight");
  revalidatePath("/weight/history");
}
