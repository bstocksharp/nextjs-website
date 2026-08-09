import "server-only";
import { and, eq, exists } from "drizzle-orm";
import type { AnyPgColumn } from "drizzle-orm/pg-core";
import { db } from "@/lib/db";
import { vehicles, profiles, financialAccounts } from "@/lib/db/schema";

// ─────────────────────────────────────────────────────────────────────────────
// TENANCY FRAGMENTS — reusable WHERE conditions that tie a child row to the
// session's group through its owning row. Tables without their own group_id
// (maintenance, fuel, parts, builds, wishlist, journal → vehicle; workouts &
// weight → profile) append one of these so EVERY query is group-checked even
// when the id came straight from a URL.
// ─────────────────────────────────────────────────────────────────────────────

/** WHERE-fragment: the row's vehicle belongs to this group. */
export function vehicleInGroup(vehicleIdCol: AnyPgColumn, groupId: number) {
  return exists(
    db
      .select({ one: vehicles.id })
      .from(vehicles)
      .where(and(eq(vehicles.id, vehicleIdCol), eq(vehicles.groupId, groupId))),
  );
}

/** WHERE-fragment: the row's profile belongs to this group. */
export function profileInGroup(profileIdCol: AnyPgColumn, groupId: number) {
  return exists(
    db
      .select({ one: profiles.id })
      .from(profiles)
      .where(and(eq(profiles.id, profileIdCol), eq(profiles.groupId, groupId))),
  );
}

/** WHERE-fragment: the row's financial account belongs to this group. */
export function financialAccountInGroup(accountIdCol: AnyPgColumn, groupId: number) {
  return exists(
    db
      .select({ one: financialAccounts.id })
      .from(financialAccounts)
      .where(
        and(
          eq(financialAccounts.id, accountIdCol),
          eq(financialAccounts.groupId, groupId),
        ),
      ),
  );
}
