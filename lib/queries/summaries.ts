import "server-only";
import { and, eq, isNotNull, or, sum } from "drizzle-orm";
import { db } from "@/lib/db";
import { maintenanceRecords, fuelLogs } from "@/lib/db/schema";

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

/** All next-due records across vehicles (for garage-grid badges). */
export function listAllDueRecords() {
  return db
    .select({
      vehicleId: maintenanceRecords.vehicleId,
      nextDueDate: maintenanceRecords.nextDueDate,
      nextDueMileage: maintenanceRecords.nextDueMileage,
    })
    .from(maintenanceRecords)
    .where(
      or(
        isNotNull(maintenanceRecords.nextDueDate),
        isNotNull(maintenanceRecords.nextDueMileage),
      ),
    );
}
