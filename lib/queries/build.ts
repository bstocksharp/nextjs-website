import "server-only";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { buildTasks } from "@/lib/db/schema";
import { requireGroupId } from "@/lib/session";
import { vehicleInGroup } from "./scope";

/** All build tasks for a vehicle, ordered by phase then sort order. */
export async function listBuildTasks(vehicleId: number) {
  const groupId = await requireGroupId();
  return db
    .select()
    .from(buildTasks)
    .where(
      and(
        eq(buildTasks.vehicleId, vehicleId),
        vehicleInGroup(buildTasks.vehicleId, groupId),
      ),
    )
    .orderBy(asc(buildTasks.phase), asc(buildTasks.sortOrder), asc(buildTasks.id));
}

/** A single build task by id, or null — null too outside the group. */
export async function getBuildTask(id: number) {
  const groupId = await requireGroupId();
  const rows = await db
    .select()
    .from(buildTasks)
    .where(and(eq(buildTasks.id, id), vehicleInGroup(buildTasks.vehicleId, groupId)))
    .limit(1);
  return rows[0] ?? null;
}
