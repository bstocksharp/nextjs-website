import "server-only";
import { and, eq, isNotNull, sql } from "drizzle-orm";
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

export type SetCategoryResult = { merchant: string | null; affected: number };

/**
 * Set (or clear, with null) a transaction's spend-category. When `applyToMerchant`
 * and the row has a merchant, ALSO: (1) upsert an exact-merchant rule so future
 * txns from it inherit the category — the "learns from you" behavior — and
 * (2) sweep every existing discretionary txn from that merchant to match. The
 * exact-merchant pattern is the most specific, so longest-match lets it override
 * any broader group rule (e.g. a `WM SUPERCENTER #4279` override beats `WALMART`).
 */
export async function setSpendCategoryForGroup(
  groupId: number,
  txnId: number,
  category: string | null,
  applyToMerchant: boolean,
): Promise<SetCategoryResult> {
  const [txn] = await db
    .select({ merchant: transactions.merchant })
    .from(transactions)
    .where(and(eq(transactions.id, txnId), eq(transactions.groupId, groupId)))
    .limit(1);
  if (!txn) return { merchant: null, affected: 0 };

  // ALWAYS tag the tapped row first — whatever its engine category, and even
  // when the merchant sweep below matches nothing. (Bug fix: an income row's
  // "apply to all" swept only discretionary siblings and skipped the row itself.)
  await db
    .update(transactions)
    .set({ spendCategory: category })
    .where(and(eq(transactions.id, txnId), eq(transactions.groupId, groupId)));

  if (applyToMerchant && txn.merchant && category) {
    const [rule] = await db
      .select({ id: merchantCategories.id })
      .from(merchantCategories)
      .where(
        and(
          eq(merchantCategories.groupId, groupId),
          eq(merchantCategories.pattern, txn.merchant),
        ),
      )
      .limit(1);
    if (rule) {
      await db.update(merchantCategories).set({ category }).where(eq(merchantCategories.id, rule.id));
    } else {
      await db.insert(merchantCategories).values({ groupId, pattern: txn.merchant, category });
    }

    const scope = and(
      eq(transactions.groupId, groupId),
      eq(transactions.merchant, txn.merchant),
      eq(transactions.category, "discretionary"),
    );
    await db.update(transactions).set({ spendCategory: category }).where(scope);
    const [c] = await db.select({ n: sql<number>`count(*)::int` }).from(transactions).where(scope);
    return { merchant: txn.merchant, affected: c?.n ?? 1 };
  }

  return { merchant: txn.merchant, affected: 1 };
}
