import "server-only";
import { and, eq, inArray, isNotNull, isNull, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { merchantCategories, transactions } from "@/lib/db/schema";
import { requireGroupId } from "@/lib/session";
import { longestMatchingRule, type SpendRule } from "@/lib/finance/categorize";

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
      // New inline rule starts as its own group (name = the merchant).
      await db.insert(merchantCategories).values({
        groupId,
        pattern: txn.merchant,
        category,
        groupName: txn.merchant,
      });
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

// ── The Categories management page (F4d): named merchant GROUPS ───────────────
// A group = a name + a shared category + several match-name patterns. Several
// rules (WM SUPERCENTER, WAL-MART, WALMART.COM) can share one group_name
// ("Walmart"). Categorization is unchanged (longest pattern wins → its
// category); group_name is purely how the page organizes them.

export type MerchantGroup = {
  name: string;
  category: string;
  names: { ruleId: number; pattern: string }[]; // the match-name patterns
  merchants: { merchant: string; count: number }[];
  txns: number;
};
export type MerchantGroupsView = {
  groups: MerchantGroup[];
  ungrouped: { merchant: string; count: number }[];
  categories: string[];
};

// A group is identified by its name; be defensive about legacy null group_name
// rows (fall back to the pattern being the name).
function groupMatch(name: string) {
  return or(
    eq(merchantCategories.groupName, name),
    and(isNull(merchantCategories.groupName), eq(merchantCategories.pattern, name)),
  );
}

async function allRules(groupId: number) {
  const rows = await db
    .select({
      id: merchantCategories.id,
      pattern: merchantCategories.pattern,
      category: merchantCategories.category,
      groupName: merchantCategories.groupName,
    })
    .from(merchantCategories)
    .where(eq(merchantCategories.groupId, groupId));
  return rows.map((r) => ({ ...r, groupName: r.groupName ?? r.pattern }));
}

// Re-tag only the discretionary transactions whose merchant is touched by the
// given patterns — recompute each via longest-match over ALL current rules, and
// update the ones that changed. Scoped so unrelated (incl. manual) tags are left
// alone; longest-match-aware so a more-specific override still wins.
async function sweepForPatterns(groupId: number, patterns: string[]): Promise<void> {
  const lows = patterns.map((p) => p.toLowerCase()).filter(Boolean);
  if (!lows.length) return;
  const rules = await allRules(groupId);
  const txns = await db
    .select({
      id: transactions.id,
      merchant: transactions.merchant,
      spendCategory: transactions.spendCategory,
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.groupId, groupId),
        eq(transactions.category, "discretionary"),
        isNotNull(transactions.merchant),
      ),
    );

  const byCat = new Map<string | null, number[]>();
  for (const t of txns) {
    if (!t.merchant) continue;
    const m = t.merchant.toLowerCase();
    if (!lows.some((p) => m.includes(p))) continue;
    const cat = longestMatchingRule(t.merchant, rules)?.category ?? null;
    if (cat !== t.spendCategory) {
      const arr = byCat.get(cat) ?? [];
      arr.push(t.id);
      byCat.set(cat, arr);
    }
  }
  for (const [cat, ids] of byCat) {
    if (ids.length) await db.update(transactions).set({ spendCategory: cat }).where(inArray(transactions.id, ids));
  }
}

/** Groups that actually catch a merchant, biggest first, + the ungrouped tail. */
export async function getMerchantGroupsForGroup(groupId: number): Promise<MerchantGroupsView> {
  const rules = await allRules(groupId);
  const merchants = await db
    .select({ merchant: transactions.merchant, n: sql<number>`count(*)::int` })
    .from(transactions)
    .where(
      and(
        eq(transactions.groupId, groupId),
        eq(transactions.category, "discretionary"),
        isNotNull(transactions.merchant),
      ),
    )
    .groupBy(transactions.merchant);

  const groupMap = new Map<string, MerchantGroup>();
  for (const r of rules) {
    let g = groupMap.get(r.groupName);
    if (!g) {
      g = { name: r.groupName, category: r.category, names: [], merchants: [], txns: 0 };
      groupMap.set(r.groupName, g);
    }
    g.names.push({ ruleId: r.id, pattern: r.pattern });
  }

  const ungrouped: { merchant: string; count: number }[] = [];
  for (const m of merchants) {
    if (!m.merchant) continue;
    const rule = longestMatchingRule(m.merchant, rules);
    if (rule) {
      const g = groupMap.get(rule.groupName);
      if (g) {
        g.merchants.push({ merchant: m.merchant, count: m.n });
        g.txns += m.n;
      }
    } else {
      ungrouped.push({ merchant: m.merchant, count: m.n });
    }
  }

  const groups = [...groupMap.values()]
    .filter((g) => g.merchants.length > 0)
    .sort((a, b) => b.txns - a.txns);
  for (const g of groups) g.merchants.sort((a, b) => b.count - a.count);
  ungrouped.sort((a, b) => b.count - a.count);

  return { groups, ungrouped, categories: await listSpendCategoriesForGroup(groupId) };
}

/** Retag a whole group (all its names) and sweep its merchants. */
export async function retagGroupForGroup(groupId: number, name: string, category: string): Promise<void> {
  const cat = category.trim().slice(0, 40);
  if (!cat) return;
  const rows = await db
    .select({ pattern: merchantCategories.pattern })
    .from(merchantCategories)
    .where(and(eq(merchantCategories.groupId, groupId), groupMatch(name)));
  await db
    .update(merchantCategories)
    .set({ category: cat })
    .where(and(eq(merchantCategories.groupId, groupId), groupMatch(name)));
  await sweepForPatterns(groupId, rows.map((r) => r.pattern));
}

/** Add/move a match-name into a group (also: adopt a merchant, or create a
 *  group when `name` is new). Upserts by pattern, then sweeps that pattern. */
export async function upsertNameForGroup(
  groupId: number,
  name: string,
  category: string,
  pattern: string,
): Promise<void> {
  const pat = pattern.trim().slice(0, 100);
  const nm = name.trim().slice(0, 60);
  const cat = category.trim().slice(0, 40);
  if (!pat || !nm || !cat) return;
  const [existing] = await db
    .select({ id: merchantCategories.id })
    .from(merchantCategories)
    .where(and(eq(merchantCategories.groupId, groupId), eq(merchantCategories.pattern, pat)))
    .limit(1);
  if (existing) {
    await db
      .update(merchantCategories)
      .set({ groupName: nm, category: cat })
      .where(eq(merchantCategories.id, existing.id));
  } else {
    await db.insert(merchantCategories).values({ groupId, pattern: pat, category: cat, groupName: nm });
  }
  await sweepForPatterns(groupId, [pat]);
}

/** Remove a single match-name; its merchants re-fall to whatever now matches. */
export async function removeNameForGroup(groupId: number, ruleId: number): Promise<void> {
  const [rule] = await db
    .select({ pattern: merchantCategories.pattern })
    .from(merchantCategories)
    .where(and(eq(merchantCategories.id, ruleId), eq(merchantCategories.groupId, groupId)))
    .limit(1);
  if (!rule) return;
  await db
    .delete(merchantCategories)
    .where(and(eq(merchantCategories.id, ruleId), eq(merchantCategories.groupId, groupId)));
  await sweepForPatterns(groupId, [rule.pattern]);
}

/** Rename a group. If `newName` already exists, the two MERGE (moved names adopt
 *  the target's category, which sweeps their merchants). */
export async function renameGroupForGroup(groupId: number, oldName: string, newName: string): Promise<void> {
  const nm = newName.trim().slice(0, 60);
  if (!nm || nm === oldName) return;
  const [target] = await db
    .select({ category: merchantCategories.category })
    .from(merchantCategories)
    .where(and(eq(merchantCategories.groupId, groupId), groupMatch(nm)))
    .limit(1);
  const rows = await db
    .select({ pattern: merchantCategories.pattern })
    .from(merchantCategories)
    .where(and(eq(merchantCategories.groupId, groupId), groupMatch(oldName)));
  await db
    .update(merchantCategories)
    .set(target ? { groupName: nm, category: target.category } : { groupName: nm })
    .where(and(eq(merchantCategories.groupId, groupId), groupMatch(oldName)));
  if (target) await sweepForPatterns(groupId, rows.map((r) => r.pattern));
}

/** Delete a whole group (all its names); its merchants re-fall or go ungrouped. */
export async function deleteGroupForGroup(groupId: number, name: string): Promise<void> {
  const rows = await db
    .select({ pattern: merchantCategories.pattern })
    .from(merchantCategories)
    .where(and(eq(merchantCategories.groupId, groupId), groupMatch(name)));
  await db
    .delete(merchantCategories)
    .where(and(eq(merchantCategories.groupId, groupId), groupMatch(name)));
  await sweepForPatterns(groupId, rows.map((r) => r.pattern));
}
