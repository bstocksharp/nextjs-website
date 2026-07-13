import "server-only";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { parts } from "@/lib/db/schema";

/** All parts for a vehicle, most recently installed first. */
export function listParts(vehicleId: number) {
  return db
    .select()
    .from(parts)
    .where(eq(parts.vehicleId, vehicleId))
    .orderBy(desc(parts.installedDate), desc(parts.id));
}

/** A single part by id, or null. */
export async function getPart(id: number) {
  const rows = await db.select().from(parts).where(eq(parts.id, id)).limit(1);
  return rows[0] ?? null;
}
