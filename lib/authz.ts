// ─────────────────────────────────────────────────────────────────────────────
// RESOURCE-AWARE EDIT GUARDS — map a resource to "who owns it", then apply the
// right gate from lib/auth. Keeps ownership logic in one place instead of every
// action re-deriving it. Viewing/running is always open; these gate WRITES only.
//   • Workouts  → owned by their creator (only the owner, unlocked, may edit).
//   • Vehicles  → shared = communal (any active editor); private = owner only.
// ─────────────────────────────────────────────────────────────────────────────

import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { workouts, vehicles } from "@/lib/db/schema";
import {
  requireEditor,
  requireEditorFor,
  canEditProfile,
  isEditMode,
} from "@/lib/auth";

// ── Workouts ──────────────────────────────────────────────────────────────────
/** Guard a write to a workout (and its items): the creator must be unlocked. */
export async function requireWorkoutEditor(workoutId: number): Promise<void> {
  const [row] = await db
    .select({ owner: workouts.createdByProfileId })
    .from(workouts)
    .where(eq(workouts.id, workoutId))
    .limit(1);
  if (!row) throw new Error("Workout not found.");
  await requireEditorFor(row.owner);
}

/** UI check: can the current user edit this workout? (owner unlocked) */
export function canEditWorkout(ownerProfileId: number): Promise<boolean> {
  return canEditProfile(ownerProfileId);
}

// ── Vehicles ──────────────────────────────────────────────────────────────────
/** Guard a write scoped to a vehicle: shared = communal, private = owner-only. */
export async function requireVehicleEditor(vehicleId: number): Promise<void> {
  const [row] = await db
    .select({ owner: vehicles.profileId, visibility: vehicles.visibility })
    .from(vehicles)
    .where(eq(vehicles.id, vehicleId))
    .limit(1);
  if (!row) throw new Error("Vehicle not found.");
  if (row.visibility === "private") await requireEditorFor(row.owner);
  else await requireEditor(); // shared → any active editor
}

/** UI check: can the current user edit this vehicle? */
export function canEditVehicle(v: {
  profileId: number | null;
  visibility: string;
}): Promise<boolean> {
  return v.visibility === "private" ? canEditProfile(v.profileId) : isEditMode();
}
