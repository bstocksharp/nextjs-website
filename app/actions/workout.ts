"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq, and, asc } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  exercises,
  workouts,
  workoutItems,
  workoutAssignments,
} from "@/lib/db/schema";
import { requireEditor } from "@/lib/auth";
import { countExerciseUsage } from "@/lib/queries/workout";

const CATALOG = "/workout/catalog";

// Empty string → null; keeps optional columns clean.
function str(formData: FormData, k: string): string | null {
  const v = String(formData.get(k) ?? "").trim();
  return v === "" ? null : v;
}
function int(formData: FormData, k: string): number | null {
  const v = str(formData, k);
  if (v === null) return null;
  const n = Number.parseInt(v, 10);
  return Number.isNaN(n) ? null : n;
}

function parseExercise(formData: FormData) {
  return {
    name: String(formData.get("name") ?? "").trim(),
    category: str(formData, "category"),
    defaultReps: str(formData, "defaultReps"),
    defaultDuration: int(formData, "defaultDuration"),
    defaultWeight: str(formData, "defaultWeight"),
    holdLast: formData.get("holdLast") != null, // checkbox present = on
    description: str(formData, "description"),
    tips: str(formData, "tips"), // textarea, one tip per line
  };
}

export async function addExercise(formData: FormData): Promise<void> {
  await requireEditor();
  const data = parseExercise(formData);
  if (!data.name) throw new Error("Exercise name is required.");

  await db.insert(exercises).values({ ...data, name: data.name });

  revalidatePath(CATALOG);
  redirect(CATALOG);
}

export async function updateExercise(
  id: number,
  formData: FormData,
): Promise<void> {
  await requireEditor();
  const data = parseExercise(formData);
  if (!data.name) throw new Error("Exercise name is required.");

  await db.update(exercises).set({ ...data, name: data.name }).where(eq(exercises.id, id));

  revalidatePath(CATALOG);
  redirect(CATALOG);
}

export async function deleteExercise(
  id: number,
  _formData: FormData,
): Promise<void> {
  await requireEditor();

  // Guard: don't orphan workout items. Send back with a message instead of
  // silently deleting (or crashing on the FK).
  const uses = await countExerciseUsage(id);
  if (uses > 0) {
    redirect(`${CATALOG}?blocked=${id}&uses=${uses}`);
  }

  await db.delete(exercises).where(eq(exercises.id, id));

  revalidatePath(CATALOG);
  redirect(CATALOG);
}

// ─────────────────────────────────────────────────────────────────────────────
// WORKOUTS (the shared library) + their items — the builder's write side.
// ─────────────────────────────────────────────────────────────────────────────

const builderPath = (id: number) => `/workout/${id}/edit`;

function parseWorkout(formData: FormData) {
  return {
    name: String(formData.get("name") ?? "").trim(),
    rounds: Math.max(1, int(formData, "rounds") ?? 1),
    restBetweenRounds: Math.max(0, int(formData, "restBetweenRounds") ?? 60),
    createdByProfileId: int(formData, "createdByProfileId"),
  };
}

export async function addWorkout(formData: FormData): Promise<void> {
  await requireEditor();
  const { name, rounds, restBetweenRounds, createdByProfileId } =
    parseWorkout(formData);
  if (!name) throw new Error("Workout name is required.");
  if (!createdByProfileId) throw new Error("Choose who's saving this workout.");

  const [row] = await db
    .insert(workouts)
    .values({ name, rounds, restBetweenRounds, createdByProfileId })
    .returning({ id: workouts.id });

  // "Build a workout for this day" flow: auto-assign it to that weekday.
  const assignWeekday = int(formData, "assignWeekday");
  if (assignWeekday != null) {
    await db
      .insert(workoutAssignments)
      .values({ profileId: createdByProfileId, weekday: assignWeekday, workoutId: row.id })
      .onConflictDoUpdate({
        target: [workoutAssignments.profileId, workoutAssignments.weekday],
        set: { workoutId: row.id },
      });
  }

  revalidatePath("/workout");
  redirect(builderPath(row.id)); // straight into the builder to add exercises
}

export async function updateWorkout(
  id: number,
  formData: FormData,
): Promise<void> {
  await requireEditor();
  const { name, rounds, restBetweenRounds, createdByProfileId } =
    parseWorkout(formData);
  if (!name) throw new Error("Workout name is required.");

  await db
    .update(workouts)
    .set({
      name,
      rounds,
      restBetweenRounds,
      ...(createdByProfileId ? { createdByProfileId } : {}),
    })
    .where(eq(workouts.id, id));

  // Auto-save: revalidate in place, stay in the builder (no navigation).
  revalidatePath("/workout");
  revalidatePath(`/workout/${id}`);
  revalidatePath(`/workout/${id}/edit`);
}

export async function deleteWorkout(
  id: number,
  _formData: FormData,
): Promise<void> {
  await requireEditor();
  // Cascades to workout_items and workout_assignments (FK onDelete: cascade).
  await db.delete(workouts).where(eq(workouts.id, id));

  revalidatePath("/workout");
  redirect("/workout");
}

// ── Workout items ─────────────────────────────────────────────────────────────

/** Next free sortOrder for a workout (append to the end). */
async function nextSort(workoutId: number): Promise<number> {
  const rows = await db
    .select({ s: workoutItems.sortOrder })
    .from(workoutItems)
    .where(eq(workoutItems.workoutId, workoutId));
  return rows.reduce((m, r) => Math.max(m, r.s ?? 0), -1) + 1;
}

export async function addWorkoutItem(
  workoutId: number,
  formData: FormData,
): Promise<void> {
  await requireEditor();
  const exerciseId = int(formData, "exerciseId");
  const section = str(formData, "section") ?? "main";
  if (!exerciseId) throw new Error("Pick an exercise to add.");

  // New items inherit the catalog defaults (all overrides null).
  await db.insert(workoutItems).values({
    workoutId,
    exerciseId,
    section,
    sortOrder: await nextSort(workoutId),
  });

  // No redirect — revalidate in place so the builder doesn't jump to the top.
  revalidatePath(`/workout/${workoutId}`);
  revalidatePath(builderPath(workoutId));
}

function parseItemOverrides(formData: FormData) {
  return {
    section: str(formData, "section") ?? "main",
    reps: str(formData, "reps"),
    duration: int(formData, "duration"),
    weight: str(formData, "weight"),
    holdLast: formData.get("holdLast") != null, // checkbox present = on
    note: str(formData, "note"),
  };
}

export async function updateWorkoutItem(
  itemId: number,
  workoutId: number,
  formData: FormData,
): Promise<void> {
  await requireEditor();
  await db
    .update(workoutItems)
    .set(parseItemOverrides(formData))
    .where(eq(workoutItems.id, itemId));

  revalidatePath(`/workout/${workoutId}`);
  revalidatePath(builderPath(workoutId));
}

export async function removeWorkoutItem(
  itemId: number,
  workoutId: number,
  _formData: FormData,
): Promise<void> {
  await requireEditor();
  await db.delete(workoutItems).where(eq(workoutItems.id, itemId));

  revalidatePath(`/workout/${workoutId}`);
  revalidatePath(builderPath(workoutId));
}

/** Move an item up/down within its own section (swap sortOrder with neighbor). */
export async function moveWorkoutItem(
  itemId: number,
  workoutId: number,
  dir: "up" | "down",
): Promise<void> {
  await requireEditor();
  const rows = await db
    .select()
    .from(workoutItems)
    .where(eq(workoutItems.workoutId, workoutId))
    .orderBy(asc(workoutItems.sortOrder), asc(workoutItems.id));

  const target = rows.find((r) => r.id === itemId);
  if (!target) return;
  const section = rows.filter((r) => r.section === target.section);
  const idx = section.findIndex((r) => r.id === itemId);
  const nIdx = dir === "up" ? idx - 1 : idx + 1;
  if (nIdx < 0 || nIdx >= section.length) return;

  const neighbor = section[nIdx];
  await db
    .update(workoutItems)
    .set({ sortOrder: neighbor.sortOrder })
    .where(eq(workoutItems.id, target.id));
  await db
    .update(workoutItems)
    .set({ sortOrder: target.sortOrder })
    .where(eq(workoutItems.id, neighbor.id));

  revalidatePath(`/workout/${workoutId}`);
}

// ── Scheduling — assign/clear a workout for a profile's weekday ────────────────

/** Set (or clear, when workoutId is empty) a profile's workout for one weekday. */
export async function setAssignment(
  profileId: number,
  weekday: number,
  formData: FormData,
): Promise<void> {
  await requireEditor();
  const workoutId = int(formData, "workoutId");

  if (!workoutId) {
    await db
      .delete(workoutAssignments)
      .where(
        and(
          eq(workoutAssignments.profileId, profileId),
          eq(workoutAssignments.weekday, weekday),
        ),
      );
  } else {
    await db
      .insert(workoutAssignments)
      .values({ profileId, weekday, workoutId })
      .onConflictDoUpdate({
        target: [workoutAssignments.profileId, workoutAssignments.weekday],
        set: { workoutId },
      });
  }

  revalidatePath("/workout");
  redirect(`/workout/schedule?profile=${profileId}`);
}
