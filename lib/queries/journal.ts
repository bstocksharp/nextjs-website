import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { journalEntries } from "@/lib/db/schema";
import { requireGroupId } from "@/lib/session";
import { vehicleInGroup } from "./scope";

/** Journal entries for a vehicle, newest first. */
export async function listJournal(vehicleId: number) {
  const groupId = await requireGroupId();
  return db
    .select()
    .from(journalEntries)
    .where(
      and(
        eq(journalEntries.vehicleId, vehicleId),
        vehicleInGroup(journalEntries.vehicleId, groupId),
      ),
    )
    .orderBy(desc(journalEntries.entryDate), desc(journalEntries.id));
}

/** A single journal entry by id, or null — null too outside the group. */
export async function getJournalEntry(id: number) {
  const groupId = await requireGroupId();
  const rows = await db
    .select()
    .from(journalEntries)
    .where(
      and(
        eq(journalEntries.id, id),
        vehicleInGroup(journalEntries.vehicleId, groupId),
      ),
    )
    .limit(1);
  return rows[0] ?? null;
}
