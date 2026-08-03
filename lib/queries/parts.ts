import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { parts } from "@/lib/db/schema";
import { requireGroupId } from "@/lib/session";
import { vehicleInGroup } from "./scope";

/** All parts for a vehicle, most recently installed first. */
export async function listParts(vehicleId: number) {
  const groupId = await requireGroupId();
  return db
    .select()
    .from(parts)
    .where(and(eq(parts.vehicleId, vehicleId), vehicleInGroup(parts.vehicleId, groupId)))
    .orderBy(desc(parts.installedDate), desc(parts.id));
}

/** A single part by id, or null — null too outside the group. */
export async function getPart(id: number) {
  const groupId = await requireGroupId();
  const rows = await db
    .select()
    .from(parts)
    .where(and(eq(parts.id, id), vehicleInGroup(parts.vehicleId, groupId)))
    .limit(1);
  return rows[0] ?? null;
}
