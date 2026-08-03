import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { fuelLogs } from "@/lib/db/schema";
import { requireGroupId } from "@/lib/session";
import { vehicleInGroup } from "./scope";

/** All fuel fill-ups for a vehicle, newest first. */
export async function listFuel(vehicleId: number) {
  const groupId = await requireGroupId();
  return db
    .select()
    .from(fuelLogs)
    .where(
      and(eq(fuelLogs.vehicleId, vehicleId), vehicleInGroup(fuelLogs.vehicleId, groupId)),
    )
    .orderBy(desc(fuelLogs.fillDate), desc(fuelLogs.odometer), desc(fuelLogs.id));
}

/** A single fuel log by id, or null — null too outside the group. */
export async function getFuelLog(id: number) {
  const groupId = await requireGroupId();
  const rows = await db
    .select()
    .from(fuelLogs)
    .where(and(eq(fuelLogs.id, id), vehicleInGroup(fuelLogs.vehicleId, groupId)))
    .limit(1);
  return rows[0] ?? null;
}
