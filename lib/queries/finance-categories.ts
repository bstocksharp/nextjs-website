import "server-only";
import { and, eq, isNotNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { merchantCategories, transactions } from "@/lib/db/schema";
import { requireGroupId } from "@/lib/session";
import type { SpendRule } from "@/lib/finance/categorize";

// Discretionary starters offered in the tag dropdown even before any exist; the
// group's actually-used categories (incl. inherited bill categories) get merged
// in. Kept short + generic so a new household grows its own from here.
export const STARTER_SPEND_CATEGORIES = [
  "Groceries",
  "Dining",
  "Gas",
  "Shopping",
  "Home",
  "Health",
  "Kids",
  "Car",
  "Entertainment",
];

/** A group's merchant → spend-category rules, for ingest + the backfill. */
export async function spendRulesFor(groupId: number): Promise<SpendRule[]> {
  return db
    .select({ pattern: merchantCategories.pattern, category: merchantCategories.category })
    .from(merchantCategories)
    .where(eq(merchantCategories.groupId, groupId));
}

/** Categories in use on this group's transactions, plus the starters, sorted. */
export async function listSpendCategoriesForGroup(groupId: number): Promise<string[]> {
  const rows = await db
    .selectDistinct({ c: transactions.spendCategory })
    .from(transactions)
    .where(and(eq(transactions.groupId, groupId), isNotNull(transactions.spendCategory)));
  const set = new Set<string>(STARTER_SPEND_CATEGORIES);
  for (const r of rows) if (r.c) set.add(r.c);
  return [...set].sort();
}

export async function listSpendCategories(): Promise<string[]> {
  return listSpendCategoriesForGroup(await requireGroupId());
}
