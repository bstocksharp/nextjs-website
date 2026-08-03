import "server-only";
import { and, desc, eq, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { vehicles } from "@/lib/db/schema";
import { requireGroupId } from "@/lib/session";

/**
 * Vehicles visible to a profile, newest first: anything shared, plus the
 * profile's own (incl. private) cars. Visibility is organization, not security —
 * the group filter is the security. See ARCHITECTURE "Profiles, visibility & access".
 */
export async function listVehicles(profileId: number) {
  const groupId = await requireGroupId();
  return db
    .select()
    .from(vehicles)
    .where(
      and(
        eq(vehicles.groupId, groupId),
        or(eq(vehicles.visibility, "shared"), eq(vehicles.profileId, profileId)),
      ),
    )
    .orderBy(desc(vehicles.createdAt));
}

/** A single vehicle by id, or null — null too for another group's vehicle. */
export async function getVehicle(id: number) {
  const groupId = await requireGroupId();
  const rows = await db
    .select()
    .from(vehicles)
    .where(and(eq(vehicles.id, id), eq(vehicles.groupId, groupId)))
    .limit(1);
  return rows[0] ?? null;
}
