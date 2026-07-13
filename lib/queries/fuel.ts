import "server-only";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { fuelLogs } from "@/lib/db/schema";

/** All fuel fill-ups for a vehicle, newest first. */
export function listFuel(vehicleId: number) {
  return db
    .select()
    .from(fuelLogs)
    .where(eq(fuelLogs.vehicleId, vehicleId))
    .orderBy(desc(fuelLogs.fillDate), desc(fuelLogs.odometer), desc(fuelLogs.id));
}

/** A single fuel log by id, or null. */
export async function getFuelLog(id: number) {
  const rows = await db
    .select()
    .from(fuelLogs)
    .where(eq(fuelLogs.id, id))
    .limit(1);
  return rows[0] ?? null;
}
