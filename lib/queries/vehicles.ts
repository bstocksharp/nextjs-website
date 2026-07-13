import "server-only";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { vehicles } from "@/lib/db/schema";

/** All vehicles, newest first. */
export function listVehicles() {
  return db.select().from(vehicles).orderBy(desc(vehicles.createdAt));
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
