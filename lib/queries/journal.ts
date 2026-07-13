import "server-only";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { journalEntries } from "@/lib/db/schema";

/** Journal entries for a vehicle, newest first. */
export function listJournal(vehicleId: number) {
  return db
    .select()
    .from(journalEntries)
    .where(eq(journalEntries.vehicleId, vehicleId))
    .orderBy(desc(journalEntries.entryDate), desc(journalEntries.id));
}

/** A single journal entry by id, or null. */
export async function getJournalEntry(id: number) {
  const rows = await db
    .select()
    .from(journalEntries)
    .where(eq(journalEntries.id, id))
    .limit(1);
  return rows[0] ?? null;
}
