import "server-only";
import { and, eq, isNotNull, or, sum } from "drizzle-orm";
import { db } from "@/lib/db";
import { maintenanceRecords, fuelLogs, vehicles } from "@/lib/db/schema";

/** Total spend for a vehicle, split maintenance vs fuel. */
export async function vehicleSpend(vehicleId: number) {
  const [m] = await db
    .select({ total: sum(maintenanceRecords.cost) })
    .from(maintenanceRecords)
    .where(eq(maintenanceRecords.vehicleId, vehicleId));
  const [f] = await db
    .select({ total: sum(fuelLogs.totalCost) })
    .from(fuelLogs)
    .where(eq(fuelLogs.vehicleId, vehicleId));

  const maintenance = Number(m?.total ?? 0);
  const fuel = Number(f?.total ?? 0);
  return { maintenance, fuel, total: maintenance + fuel };
}

/** Service records for one vehicle that carry a next-due reminder. */
export function listVehicleDueRecords(vehicleId: number) {
  return db
    .select({
      id: maintenanceRecords.id,
      serviceType: maintenanceRecords.serviceType,
      nextDueDate: maintenanceRecords.nextDueDate,
      nextDueMileage: maintenanceRecords.nextDueMileage,
    })
    .from(maintenanceRecords)
    .where(
      and(
        eq(maintenanceRecords.vehicleId, vehicleId),
        or(
          isNotNull(maintenanceRecords.nextDueDate),
          isNotNull(maintenanceRecords.nextDueMileage),
        ),
      ),
    );
}

/**
 * Next-due records for the vehicles a profile can see (for garage-grid badges).
 * Joins vehicles so badges match the same shared-OR-owned scope as the grid.
 */
export function listAllDueRecords(profileId: number) {
  return db
    .select({
      vehicleId: maintenanceRecords.vehicleId,
      nextDueDate: maintenanceRecords.nextDueDate,
      nextDueMileage: maintenanceRecords.nextDueMileage,
    })
    .from(maintenanceRecords)
    .innerJoin(vehicles, eq(maintenanceRecords.vehicleId, vehicles.id))
    .where(
      and(
        or(eq(vehicles.visibility, "shared"), eq(vehicles.profileId, profileId)),
        or(
          isNotNull(maintenanceRecords.nextDueDate),
          isNotNull(maintenanceRecords.nextDueMileage),
        ),
      ),
    );
}
