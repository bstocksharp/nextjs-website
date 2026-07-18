import "server-only";
import { asc, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";

// Hub-wide people — see ARCHITECTURE "Profiles, visibility & access". Profiles
// began in the workout app but are now shared across the hub (the active-profile
// cookie, vehicle owners, …), so their reads live in their own module rather than
// inside any one app's query file.

/** Active profiles (not archived), in display order — the default everywhere. */
export function listProfiles() {
  return db
    .select()
    .from(profiles)
    .where(isNull(profiles.archivedAt))
    .orderBy(asc(profiles.sortOrder), asc(profiles.id));
}

/** Every profile incl. archived — for the "Manage people" screen only. */
export function listAllProfiles() {
  return db
    .select()
    .from(profiles)
    .orderBy(asc(profiles.archivedAt), asc(profiles.sortOrder), asc(profiles.id));
}

/** A single profile by id, or null. */
export async function getProfile(id: number) {
  const rows = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, id))
    .limit(1);
  return rows[0] ?? null;
}
