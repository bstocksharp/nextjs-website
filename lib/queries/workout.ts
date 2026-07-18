import "server-only";
import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  workoutProfiles,
  exercises,
  workouts,
  workoutItems,
  workoutAssignments,
} from "@/lib/db/schema";
import type { Workout, WorkoutItem, Exercise } from "@/lib/db/schema";
import { resolveItem, type ResolvedItem } from "@/lib/workout";

// ── Profiles ──────────────────────────────────────────────────────────────────
export function listProfiles() {
  return db
    .select()
    .from(workoutProfiles)
    .orderBy(asc(workoutProfiles.sortOrder), asc(workoutProfiles.id));
}

export async function getProfile(id: number) {
  const rows = await db
    .select()
    .from(workoutProfiles)
    .where(eq(workoutProfiles.id, id))
    .limit(1);
  return rows[0] ?? null;
}

// ── Exercise catalog ──────────────────────────────────────────────────────────
export function listExercises() {
  return db
    .select()
    .from(exercises)
    .orderBy(asc(exercises.category), asc(exercises.name));
}

export async function getExercise(id: number) {
  const rows = await db
    .select()
    .from(exercises)
    .where(eq(exercises.id, id))
    .limit(1);
  return rows[0] ?? null;
}

/** How many workout items reference an exercise (guards catalog deletes). */
export function countExerciseUsage(id: number): Promise<number> {
  return db.$count(workoutItems, eq(workoutItems.exerciseId, id));
}

// ── Workouts (shared library) ─────────────────────────────────────────────────
export type WorkoutListRow = {
  id: number;
  name: string;
  rounds: number;
  createdByProfileId: number;
  createdByName: string | null;
};

/** Every workout in the shared library, tagged with who saved it. */
export function listWorkoutsWithCreator(): Promise<WorkoutListRow[]> {
  return db
    .select({
      id: workouts.id,
      name: workouts.name,
      rounds: workouts.rounds,
      createdByProfileId: workouts.createdByProfileId,
      createdByName: workoutProfiles.name,
    })
    .from(workouts)
    .leftJoin(
      workoutProfiles,
      eq(workouts.createdByProfileId, workoutProfiles.id),
    )
    .orderBy(asc(workouts.sortOrder), asc(workouts.id));
}

export async function getWorkout(id: number) {
  const rows = await db
    .select()
    .from(workouts)
    .where(eq(workouts.id, id))
    .limit(1);
  return rows[0] ?? null;
}

export type WorkoutWithItems = {
  workout: Workout;
  creatorName: string | null;
  items: ResolvedItem[];
};

/** A workout plus its items resolved against the catalog defaults, in order. */
export async function getWorkoutWithItems(
  id: number,
): Promise<WorkoutWithItems | null> {
  const workout = await getWorkout(id);
  if (!workout) return null;

  const creator = await getProfile(workout.createdByProfileId);

  const rows = await db
    .select({ item: workoutItems, exercise: exercises })
    .from(workoutItems)
    .innerJoin(exercises, eq(workoutItems.exerciseId, exercises.id))
    .where(eq(workoutItems.workoutId, id))
    .orderBy(asc(workoutItems.sortOrder), asc(workoutItems.id));

  return {
    workout,
    creatorName: creator?.name ?? null,
    items: rows.map((r) => resolveItem(r.item, r.exercise)),
  };
}

/** A single workout item with its catalog exercise (for the override editor). */
export async function getWorkoutItemWithExercise(
  itemId: number,
): Promise<{ item: WorkoutItem; exercise: Exercise } | null> {
  const rows = await db
    .select({ item: workoutItems, exercise: exercises })
    .from(workoutItems)
    .innerJoin(exercises, eq(workoutItems.exerciseId, exercises.id))
    .where(eq(workoutItems.id, itemId))
    .limit(1);
  return rows[0] ?? null;
}

// ── Scheduling (per-profile weekday → workout) ────────────────────────────────
export type AssignmentRow = {
  weekday: number;
  workoutId: number;
  workoutName: string;
  rounds: number;
};

/** A profile's assigned days (only weekdays that have a workout). */
export function getAssignments(profileId: number): Promise<AssignmentRow[]> {
  return db
    .select({
      weekday: workoutAssignments.weekday,
      workoutId: workouts.id,
      workoutName: workouts.name,
      rounds: workouts.rounds,
    })
    .from(workoutAssignments)
    .innerJoin(workouts, eq(workoutAssignments.workoutId, workouts.id))
    .where(eq(workoutAssignments.profileId, profileId))
    .orderBy(asc(workoutAssignments.weekday));
}
