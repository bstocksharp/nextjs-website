// ─────────────────────────────────────────────────────────────────────────────
// RESOURCE-AWARE EDIT GUARDS — map a resource to "who owns it", then apply the
// right gate from lib/auth. Keeps ownership logic in one place instead of every
// action re-deriving it. These gate WRITES only.
//
// TENANCY: both guards resolve their row through lib/queries (group-scoped), so
// a foreign group's id fails with "not found" before any ownership question —
// an action guarded here can never write across groups, even with a forged id.
//   • Workouts  → owned by their creator (only the owner, unlocked, may edit).
//   • Vehicles  → shared = communal (any active editor); private = owner only.
// ─────────────────────────────────────────────────────────────────────────────

import "server-only";
import {
  requireEditor,
  requireEditorFor,
  canEditProfile,
  isEditMode,
} from "@/lib/auth";
import { getVehicle } from "@/lib/queries/vehicles";
import { getWorkout } from "@/lib/queries/workout";

// ── Workouts ──────────────────────────────────────────────────────────────────
/** Guard a write to a workout (and its items): the creator must be unlocked. */
export async function requireWorkoutEditor(workoutId: number): Promise<void> {
  const workout = await getWorkout(workoutId); // group-scoped
  if (!workout) throw new Error("Workout not found.");
  await requireEditorFor(workout.createdByProfileId);
}

/** UI check: can the current user edit this workout? (owner unlocked) */
export function canEditWorkout(ownerProfileId: number): Promise<boolean> {
  return canEditProfile(ownerProfileId);
}

// ── Vehicles ──────────────────────────────────────────────────────────────────
/** Guard a write scoped to a vehicle: shared = communal, private = owner-only. */
export async function requireVehicleEditor(vehicleId: number): Promise<void> {
  const vehicle = await getVehicle(vehicleId); // group-scoped
  if (!vehicle) throw new Error("Vehicle not found.");
  if (vehicle.visibility === "private") await requireEditorFor(vehicle.profileId);
  else await requireEditor(); // shared → any active editor
}

/** UI check: can the current user edit this vehicle? */
export function canEditVehicle(v: {
  profileId: number | null;
  visibility: string;
}): Promise<boolean> {
  return v.visibility === "private" ? canEditProfile(v.profileId) : isEditMode();
}
