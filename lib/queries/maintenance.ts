import "server-only";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { maintenanceRecords } from "@/lib/db/schema";

/** All service records for a vehicle, newest first. */
export function listMaintenance(vehicleId: number) {
  return db
    .select()
    .from(maintenanceRecords)
    .where(eq(maintenanceRecords.vehicleId, vehicleId))
    .orderBy(desc(maintenanceRecords.serviceDate), desc(maintenanceRecords.id));
}

/** A single service record by id, or null. */
export async function getMaintenanceRecord(id: number) {
  const rows = await db
    .select()
    .from(maintenanceRecords)
    .where(eq(maintenanceRecords.id, id))
    .limit(1);
  return rows[0] ?? null;
}

/** Distinct service names ever logged (across all vehicles) for the picker. */
export async function listAllServiceTypes(): Promise<string[]> {
  const rows = await db
    .selectDistinct({ serviceType: maintenanceRecords.serviceType })
    .from(maintenanceRecords)
    .orderBy(maintenanceRecords.serviceType);
  return rows.map((r) => r.serviceType);
}
