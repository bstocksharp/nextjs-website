import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { maintenanceRecords } from "@/lib/db/schema";
import { requireGroupId } from "@/lib/session";
import { vehicleInGroup } from "./scope";

/** All service records for a vehicle, newest first. */
export async function listMaintenance(vehicleId: number) {
  const groupId = await requireGroupId();
  return db
    .select()
    .from(maintenanceRecords)
    .where(
      and(
        eq(maintenanceRecords.vehicleId, vehicleId),
        vehicleInGroup(maintenanceRecords.vehicleId, groupId),
      ),
    )
    .orderBy(desc(maintenanceRecords.serviceDate), desc(maintenanceRecords.id));
}

/** A single service record by id, or null — null too outside the group. */
export async function getMaintenanceRecord(id: number) {
  const groupId = await requireGroupId();
  const rows = await db
    .select()
    .from(maintenanceRecords)
    .where(
      and(
        eq(maintenanceRecords.id, id),
        vehicleInGroup(maintenanceRecords.vehicleId, groupId),
      ),
    )
    .limit(1);
  return rows[0] ?? null;
}

/** Distinct service names ever logged (this group's vehicles) for the picker. */
export async function listAllServiceTypes(): Promise<string[]> {
  const groupId = await requireGroupId();
  const rows = await db
    .selectDistinct({ serviceType: maintenanceRecords.serviceType })
    .from(maintenanceRecords)
    .where(vehicleInGroup(maintenanceRecords.vehicleId, groupId))
    .orderBy(maintenanceRecords.serviceType);
  return rows.map((r) => r.serviceType);
}
