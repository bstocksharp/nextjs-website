import "server-only";
import { desc, eq, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { vehicles } from "@/lib/db/schema";

/**
 * Vehicles visible to a profile, newest first: anything shared, plus the
 * profile's own (incl. private) cars. Visibility is organization, not security —
 * see ARCHITECTURE "Profiles, visibility & access".
 */
export function listVehicles(profileId: number) {
  return db
    .select()
    .from(vehicles)
    .where(or(eq(vehicles.visibility, "shared"), eq(vehicles.profileId, profileId)))
    .orderBy(desc(vehicles.createdAt));
}

/** A single vehicle by id, or null. */
export async function getVehicle(id: number) {
  const rows = await db
    .select()
    .from(vehicles)
    .where(eq(vehicles.id, id))
    .limit(1);
  return rows[0] ?? null;
}
