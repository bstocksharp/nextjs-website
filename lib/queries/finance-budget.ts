import "server-only";
import { and, asc, desc, eq, gte, lt, lte, isNull, isNotNull, ne, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  transactions,
  recurringExpenses,
  funds,
  profiles,
  type Transaction,
} from "@/lib/db/schema";
import { computeBudgetMonth, type EngineTxn, type BudgetComputation } from "@/lib/finance/budget-engine";
import { getAtlasViewForGroup } from "@/lib/queries/finance-atlas";
import { lastDayOfMonth, todayISO, currentMonthISO } from "@/lib/finance/parse";
import { requireGroupId } from "@/lib/session";
import { getGroupTimezone } from "@/lib/queries/group";
import { formatMonth } from "@/lib/format";

// ─────────────────────────────────────────────────────────────────────────────
// BUDGET reads. The engine (lib/finance/budget-engine) is pure; this layer
// gathers a month's inputs — ATLAS discretion-left, effective recurring bills,
// the month's transactions, and fund draw-history — and runs it. Group-scoped
// via an explicit groupId so BOTH the session page and the token-authed widget
// route can call it (the widget has no session, same split as the ATLAS core).
// ─────────────────────────────────────────────────────────────────────────────

const cents = (v: string | number | null | undefined): number =>
  v == null ? 0 : Math.round(Number(v) * 100);

function monthBounds(month: string): { start: string; end: string } {
  return { start: `${month.slice(0, 7)}-01`, end: lastDayOfMonth(month) };
}

export type BudgetView = {
  computation: BudgetComputation;
  month: string;
  /** Is any compensation effective this month? False → budget is "unconfigured"
   *  (income 0 − bills = a misleading negative), so the page shows a note. */
  hasIncome: boolean;
};

/**
 * Compute a month for a group — ALWAYS live. There's no freeze/snapshot: config
 * is effective-dated, so a past month already reads the pay & bills that were
 * true then, and a later raise can't rewrite it. That also means every month
 * stays freely editable (backfill a forgotten charge anytime). `today` is the
 * pace anchor (only meaningful for the current month).
 */
export async function getBudgetMonthForGroup(
  groupId: number,
  month: string,
  today: string,
): Promise<BudgetView> {
  const { start, end } = monthBounds(month);

  // ATLAS discretion-left for this month's effective config (the budget base).
  // Pass `today` so its point-in-time asOf uses the household's zone, not UTC.
  const atlas = await getAtlasViewForGroup(groupId, month, today);
  const discretionaryBudgetC = cents(atlas.totals.discretionLeft);
  const hasIncome = atlas.totals.monthlyNet > 0;

  // Effective recurring bills + their last matched payment BEFORE this month.
  const bills = await db
    .select()
    .from(recurringExpenses)
    .where(
      and(
        eq(recurringExpenses.groupId, groupId),
        lte(recurringExpenses.startDate, end),
        or(isNull(recurringExpenses.endDate), gte(recurringExpenses.endDate, start)),
      ),
    );

  const priorPaid = await db
    .select({
      recurringExpenseId: transactions.recurringExpenseId,
      postedOn: transactions.postedOn,
    })
    .from(transactions)
    .where(
      and(eq(transactions.groupId, groupId), lt(transactions.postedOn, start)),
    )
    .orderBy(desc(transactions.postedOn));
  const lastPaidBy = new Map<number, string>();
  for (const p of priorPaid) {
    if (p.recurringExpenseId != null && !lastPaidBy.has(p.recurringExpenseId)) {
      lastPaidBy.set(p.recurringExpenseId, p.postedOn);
    }
  }
  const viewedMonthNum = Number(month.slice(5, 7));

  const recurring = bills.map((b) => {
    const perOccurrenceC = cents(b.amount);
    return {
      id: b.id,
      name: b.name,
      perOccurrenceC,
      monthlyC: Math.round((perOccurrenceC * b.paymentsPerYear) / 12),
      paymentsPerYear: b.paymentsPerYear,
      isEstimate: b.isEstimate,
      dueThisMonth:
        b.paymentsPerYear === 12 ||
        (b.dueMonths?.includes(viewedMonthNum) ?? false),
      lastActualOn: lastPaidBy.get(b.id) ?? null,
      startDate: b.startDate,
    };
  });

  // This month's transactions.
  const monthTxns = await db
    .select()
    .from(transactions)
    .where(
      and(
        eq(transactions.groupId, groupId),
        gte(transactions.postedOn, start),
        lte(transactions.postedOn, end),
      ),
    )
    .orderBy(asc(transactions.postedOn), asc(transactions.id));
  const engineTxns: EngineTxn[] = monthTxns.map((t) => ({
    id: t.id,
    postedOn: t.postedOn,
    amountC: cents(t.amount),
    category: t.category as EngineTxn["category"],
    recurringExpenseId: t.recurringExpenseId,
    fundId: t.fundId,
    needsReview: t.needsReview,
  }));

  // Funds + draws before this month.
  const groupFunds = await db
    .select({
      id: funds.id,
      name: funds.name,
      startingBalance: funds.startingBalance,
      ownerName: profiles.name,
    })
    .from(funds)
    .leftJoin(profiles, eq(funds.ownerProfileId, profiles.id))
    .where(and(eq(funds.groupId, groupId), isNull(funds.closedAt)));

  const priorFundDraws = await db
    .select({ fundId: transactions.fundId, amount: transactions.amount })
    .from(transactions)
    .where(
      and(
        eq(transactions.groupId, groupId),
        eq(transactions.category, "fund"),
        lt(transactions.postedOn, start),
      ),
    );
  const drawnBefore = new Map<number, number>();
  for (const d of priorFundDraws) {
    if (d.fundId != null) {
      drawnBefore.set(d.fundId, (drawnBefore.get(d.fundId) ?? 0) + cents(d.amount));
    }
  }

  const engineFunds = groupFunds.map((f) => ({
    id: f.id,
    name: f.name,
    ownerName: f.ownerName,
    startingBalanceC: cents(f.startingBalance),
    drawnBeforeC: drawnBefore.get(f.id) ?? 0,
  }));

  const computation = computeBudgetMonth({
    month: start,
    today,
    discretionaryBudgetC,
    recurring,
    txns: engineTxns,
    funds: engineFunds,
  });

  return { computation, month: start, hasIncome };
}

// ── Session wrappers (the budget page; the API routes use the …ForGroup core) ─
export async function getBudgetMonth(month: string): Promise<BudgetView> {
  const groupId = await requireGroupId();
  return getBudgetMonthForGroup(groupId, month, todayISO(await getGroupTimezone(groupId)));
}

export async function listMonthTransactionsForSession(
  month: string,
): Promise<Transaction[]> {
  return listMonthTransactions(await requireGroupId(), month);
}

export type RecentMonth = {
  month: string; // YYYY-MM-01
  spent: number; // discretionary net, dollars
  budget: number; // discretionary budget, dollars
  remaining: number;
};

/**
 * The last few COMPLETED months (before the current one), each computed the
 * same way the page does — closed months from their snapshot, open ones live —
 * so history shows up immediately without having to close anything first.
 */
export async function listRecentMonths(limit = 3): Promise<RecentMonth[]> {
  const groupId = await requireGroupId();
  const tz = await getGroupTimezone(groupId);
  const current = currentMonthISO(tz);
  const past = (await listBudgetMonths()).filter((m) => m < current);
  const recent = past.slice(-limit).reverse(); // newest first
  const dl = (c: number) => Math.round(c) / 100;

  const out: RecentMonth[] = [];
  for (const m of recent) {
    const v = await getBudgetMonthForGroup(groupId, m, todayISO(tz));
    out.push({
      month: m,
      spent: dl(v.computation.discretionary.netSpentC),
      budget: dl(v.computation.discretionary.budgetC),
      remaining: dl(v.computation.discretionary.remainingC),
    });
  }
  return out;
}

/** Recurring bills effective in a month, for the txn detail bill-picker. */
export async function listBillsForMonth(
  month: string,
): Promise<{ id: number; name: string; paymentsPerYear: number }[]> {
  const groupId = await requireGroupId();
  const { start, end } = monthBounds(month);
  return db
    .select({
      id: recurringExpenses.id,
      name: recurringExpenses.name,
      paymentsPerYear: recurringExpenses.paymentsPerYear,
    })
    .from(recurringExpenses)
    .where(
      and(
        eq(recurringExpenses.groupId, groupId),
        lte(recurringExpenses.startDate, end),
        or(isNull(recurringExpenses.endDate), gte(recurringExpenses.endDate, start)),
      ),
    )
    .orderBy(asc(recurringExpenses.name));
}

/**
 * Distinct merchant labels used before, most-used first, for the add/edit
 * type-ahead: expense MERCHANTS and income SOURCES kept separate so grandma
 * never suggests while logging gas. Free typing still adds anything new.
 */
export async function listMerchantSuggestions(): Promise<{
  merchants: string[];
  sources: string[];
}> {
  const groupId = await requireGroupId();
  const grab = async (income: boolean, limit: number) => {
    const rows = await db
      .select({ merchant: transactions.merchant })
      .from(transactions)
      .where(
        and(
          eq(transactions.groupId, groupId),
          isNotNull(transactions.merchant),
          income
            ? eq(transactions.category, "income")
            : ne(transactions.category, "income"),
        ),
      )
      .groupBy(transactions.merchant)
      .orderBy(desc(sql`count(*)`))
      .limit(limit);
    return rows.map((r) => r.merchant).filter((m): m is string => !!m);
  };
  const [merchants, sources] = await Promise.all([grab(false, 500), grab(true, 100)]);
  return { merchants, sources };
}

/** Months that have transactions — session-less core (for the token endpoint). */
export async function listBudgetMonthsForGroup(groupId: number): Promise<string[]> {
  const txnMonths = await db
    .selectDistinct({ m: transactions.postedOn })
    .from(transactions)
    .where(eq(transactions.groupId, groupId));
  const set = new Set<string>();
  for (const r of txnMonths) set.add(`${r.m.slice(0, 7)}-01`);
  return [...set].sort();
}

/** Months that have transactions (drives the month switcher). */
export async function listBudgetMonths(): Promise<string[]> {
  return listBudgetMonthsForGroup(await requireGroupId());
}

export type RecentMonthBar = { month: string; spent: number; budget: number };

/**
 * The last few completed months as DISCRETIONARY spent-vs-budget — the widget's
 * "Recent Months" list. Discretionary (not whole-household) so it's coherent
 * with the widget's "left to spend" framing. Session-less for the token route.
 */
export async function listRecentMonthsForGroup(
  groupId: number,
  limit: number,
  today: string,
): Promise<RecentMonthBar[]> {
  const current = `${today.slice(0, 7)}-01`;
  const past = (await listBudgetMonthsForGroup(groupId)).filter((m) => m < current);
  const recent = past.slice(-limit).reverse(); // newest first
  const dl = (c: number) => Math.round(c) / 100;
  const out: RecentMonthBar[] = [];
  for (const m of recent) {
    const { computation: c } = await getBudgetMonthForGroup(groupId, m, today);
    out.push({
      month: m,
      spent: dl(c.discretionary.netSpentC),
      budget: dl(c.discretionary.budgetC),
    });
  }
  return out;
}

export type SpendTrend = {
  days: number[]; // 1..daysInViewedMonth (shared x-axis)
  thisMonth: (number | null)[]; // cumulative discretionary net; null after today
  lastMonth: (number | null)[]; // cumulative discretionary net for the prior month
  thisLabel: string;
  lastLabel: string;
};

/**
 * Cumulative DISCRETIONARY net spend by day-of-month for the viewed month and
 * the one before it — the "how am I tracking vs last month" curve. Net = spend
 * minus reimbursements (matches the pace headline). The current month's line
 * stops at today (nulls after) so the gap is read at the same day-of-month.
 */
export async function getSpendTrend(month: string): Promise<SpendTrend> {
  const groupId = await requireGroupId();
  const tz = await getGroupTimezone(groupId);
  const today = todayISO(tz);

  const cur = `${month.slice(0, 7)}-01`;
  const y = Number(cur.slice(0, 4));
  const mo = Number(cur.slice(5, 7));
  const prev = `${mo === 1 ? y - 1 : y}-${String(mo === 1 ? 12 : mo - 1).padStart(2, "0")}-01`;
  const curDays = Number(lastDayOfMonth(cur).slice(8, 10));
  const prevDays = Number(lastDayOfMonth(prev).slice(8, 10));
  const curPrefix = cur.slice(0, 7);
  const prevPrefix = prev.slice(0, 7);

  const rows = await db
    .select({
      postedOn: transactions.postedOn,
      amount: transactions.amount,
      category: transactions.category,
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.groupId, groupId),
        gte(transactions.postedOn, prev),
        lte(transactions.postedOn, lastDayOfMonth(cur)),
        or(
          eq(transactions.category, "discretionary"),
          eq(transactions.category, "reimbursement"),
        ),
      ),
    );

  // Per-day net cents; reimbursements pull the running total back down.
  const curDaily = new Array<number>(curDays + 1).fill(0);
  const prevDaily = new Array<number>(prevDays + 1).fill(0);
  for (const r of rows) {
    const day = Number(r.postedOn.slice(8, 10));
    const signed = r.category === "reimbursement" ? -cents(r.amount) : cents(r.amount);
    const prefix = r.postedOn.slice(0, 7);
    if (prefix === curPrefix && day >= 1 && day <= curDays) curDaily[day] += signed;
    else if (prefix === prevPrefix && day >= 1 && day <= prevDays) prevDaily[day] += signed;
  }

  // Only cap at "today" when the viewed month IS the current one.
  const capDay = today.slice(0, 7) === curPrefix ? Number(today.slice(8, 10)) : curDays;
  const dl = (c: number) => Math.round(c) / 100;

  const days: number[] = [];
  const thisMonth: (number | null)[] = [];
  const lastMonth: (number | null)[] = [];
  let runCur = 0;
  let runPrev = 0;
  for (let dnum = 1; dnum <= curDays; dnum++) {
    days.push(dnum);
    runCur += curDaily[dnum];
    thisMonth.push(dnum <= capDay ? dl(runCur) : null);
    if (dnum <= prevDays) {
      runPrev += prevDaily[dnum];
      lastMonth.push(dl(runPrev));
    } else {
      lastMonth.push(null);
    }
  }

  return { days, thisMonth, lastMonth, thisLabel: formatMonth(cur), lastLabel: formatMonth(prev) };
}

/** Raw transaction rows for a month (the editable table). */
export async function listMonthTransactions(
  groupId: number,
  month: string,
): Promise<Transaction[]> {
  const { start, end } = monthBounds(month);
  return db
    .select()
    .from(transactions)
    .where(
      and(
        eq(transactions.groupId, groupId),
        gte(transactions.postedOn, start),
        lte(transactions.postedOn, end),
      ),
    )
    .orderBy(desc(transactions.postedOn), desc(transactions.id));
}
