import "server-only";
import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { buildTasks } from "@/lib/db/schema";

/** All build tasks for a vehicle, ordered by phase then sort order. */
export function listBuildTasks(vehicleId: number) {
  return db
    .select()
    .from(buildTasks)
    .where(eq(buildTasks.vehicleId, vehicleId))
    .orderBy(asc(buildTasks.phase), asc(buildTasks.sortOrder), asc(buildTasks.id));
}

/** A single build task by id, or null. */
export async function getBuildTask(id: number) {
  const rows = await db
    .select()
    .from(buildTasks)
    .where(eq(buildTasks.id, id))
    .limit(1);
  return rows[0] ?? null;
}
