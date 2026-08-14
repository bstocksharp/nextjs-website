import "server-only";
import { and, desc, eq, gte, ilike, lt, lte, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { transactions } from "@/lib/db/schema";
import { requireGroupId } from "@/lib/session";
import type { TxnRowData } from "@/components/finance/TransactionRow";

// ─────────────────────────────────────────────────────────────────────────────
// TRANSACTIONS EXPLORER (F4b) — an all-time, filterable search over the ledger
// ("when did I spend at Walmart?"). Keyset-paginated for smooth infinite scroll;
// group-scoped via requireGroupId so a filter can never reach another household.
// Read-only: editing still happens on the budget month view.
// ─────────────────────────────────────────────────────────────────────────────

export type TxnFilters = {
  q?: string; // merchant substring (case-insensitive)
  min?: number; // amount >=
  max?: number; // amount <=
  from?: string; // postedOn >= YYYY-MM-DD
  to?: string; // postedOn <= YYYY-MM-DD
};

export type TxnPage = {
  rows: TxnRowData[];
  /** "YYYY-MM-DD:id" of the last row; pass back to fetch the next page. Null = done. */
  nextCursor: string | null;
};

export type TxnSummary = { count: number; total: number };

export const EXPLORER_PAGE_SIZE = 50;

// Rows are ordered (postedOn desc, id desc). A "date:id" cursor fetches strictly
// older rows — the id tiebreak keeps same-day rows from overlapping or skipping.
function cursorCond(cursor: string | null) {
  if (!cursor) return undefined;
  const idx = cursor.lastIndexOf(":");
  if (idx < 0) return undefined;
  const d = cursor.slice(0, idx);
  const id = Number(cursor.slice(idx + 1));
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d) || !Number.isInteger(id)) return undefined;
  return or(
    lt(transactions.postedOn, d),
    and(eq(transactions.postedOn, d), lt(transactions.id, id)),
  );
}

function whereFor(groupId: number, f: TxnFilters, cursor: string | null) {
  const conds = [eq(transactions.groupId, groupId)];
  if (f.q) conds.push(ilike(transactions.merchant, `%${f.q}%`));
  if (f.min != null) conds.push(gte(transactions.amount, String(f.min)));
  if (f.max != null) conds.push(lte(transactions.amount, String(f.max)));
  if (f.from) conds.push(gte(transactions.postedOn, f.from));
  if (f.to) conds.push(lte(transactions.postedOn, f.to));
  const cc = cursorCond(cursor);
  if (cc) conds.push(cc);
  return and(...conds);
}

function toRow(t: typeof transactions.$inferSelect): TxnRowData {
  return {
    id: t.id,
    postedOn: t.postedOn,
    merchant: t.merchant,
    amount: Number(t.amount),
    originalAmount: Number(t.originalAmount),
    category: t.category,
    fundId: t.fundId,
    recurringExpenseId: t.recurringExpenseId,
    needsReview: t.needsReview,
    note: t.note,
    source: t.source,
  };
}

export async function searchTransactionsForGroup(
  groupId: number,
  f: TxnFilters,
  cursor: string | null,
  limit = EXPLORER_PAGE_SIZE,
): Promise<TxnPage> {
  // Fetch one extra to know whether another page exists without a second query.
  const rows = await db
    .select()
    .from(transactions)
    .where(whereFor(groupId, f, cursor))
    .orderBy(desc(transactions.postedOn), desc(transactions.id))
    .limit(limit + 1);
  const hasMore = rows.length > limit;
  const page = rows.slice(0, limit);
  const last = page[page.length - 1];
  const nextCursor = hasMore && last ? `${last.postedOn}:${last.id}` : null;
  return { rows: page.map(toRow), nextCursor };
}

export async function summarizeTransactionsForGroup(
  groupId: number,
  f: TxnFilters,
): Promise<TxnSummary> {
  const [row] = await db
    .select({
      count: sql<number>`count(*)::int`,
      total: sql<string>`coalesce(sum(${transactions.amount}), 0)`,
    })
    .from(transactions)
    .where(whereFor(groupId, f, null));
  return { count: Number(row?.count ?? 0), total: Number(row?.total ?? 0) };
}

// ── Session wrappers ──────────────────────────────────────────────────────────
export async function searchTransactions(
  f: TxnFilters,
  cursor: string | null,
): Promise<TxnPage> {
  return searchTransactionsForGroup(await requireGroupId(), f, cursor);
}

export async function summarizeTransactions(f: TxnFilters): Promise<TxnSummary> {
  return summarizeTransactionsForGroup(await requireGroupId(), f);
}
