import "server-only";
import { and, asc, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import { requireGroupId } from "@/lib/session";

// Hub-wide people — see ARCHITECTURE "Profiles, visibility & access". Profiles
// began in the workout app but are now shared across the hub (the active-profile
// cookie, vehicle owners, …), so their reads live in their own module rather than
// inside any one app's query file.
//
// TENANCY: every read scopes to the session's group (requireGroupId) — a page
// can't forget to filter because the filter lives here. Signed-out callers must
// never reach these (getActiveProfile guards; the proxy keeps public routes out).

/** Active profiles (not archived), in display order — the default everywhere. */
export async function listProfiles() {
  const groupId = await requireGroupId();
  return db
    .select()
    .from(profiles)
    .where(and(eq(profiles.groupId, groupId), isNull(profiles.archivedAt)))
    .orderBy(asc(profiles.sortOrder), asc(profiles.id));
}

/** Every profile incl. archived — for the "Manage people" screen only. */
export async function listAllProfiles() {
  const groupId = await requireGroupId();
  return db
    .select()
    .from(profiles)
    .where(eq(profiles.groupId, groupId))
    .orderBy(asc(profiles.archivedAt), asc(profiles.sortOrder), asc(profiles.id));
}

/** A single profile by id, or null — null too for another group's profile. */
export async function getProfile(id: number) {
  const groupId = await requireGroupId();
  const rows = await db
    .select()
    .from(profiles)
    .where(and(eq(profiles.id, id), eq(profiles.groupId, groupId)))
    .limit(1);
  return rows[0] ?? null;
}
