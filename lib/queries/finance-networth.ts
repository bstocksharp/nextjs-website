import "server-only";
import { asc, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  financialAccounts,
  accountSnapshots,
  savingsGoals,
  type FinancialAccount,
  type SavingsGoal,
} from "@/lib/db/schema";
import { requireGroupId } from "@/lib/session";

// ─────────────────────────────────────────────────────────────────────────────
// NET WORTH — reads + ALL derived metrics (nothing here is stored; same spirit
// as MPG/weight). The sheet this replaces: monthly per-account balances, total,
// MoM change, cumulative $/% growth vs a baseline month, and the "bank saved"
// subset (flagged accounts) tracked against an effective-dated monthly goal.
//
// Baseline semantics (matches the sheet): for a view year, the baseline is the
// LAST snapshot month before Jan 1 (his "Dec" row) — MoM/cumulative for January
// measure against it. First tracked year (no prior month): the window's first
// month is the anchor (its own MoM/cumulative are null/0).
// ─────────────────────────────────────────────────────────────────────────────

/** Does `month` (YYYY-MM-01) fall inside a goal segment? */
function segmentCovers(g: SavingsGoal, month: string): boolean {
  return g.startMonth <= month && (g.endMonth === null || month <= g.endMonth);
}

export type NetWorthStats = {
  currentMonth: string;
  currentTotal: number;
  mom: number | null;
  cumulative: number | null;
  cumulativePct: number | null;
  bankCumulative: number | null;
  bankGoalToDate: number | null;
  bankVsGoal: number | null; // cumulative − goalToDate (ahead/behind)
};

export type NetWorthDashboard = {
  year: number;
  availableYears: number[];
  /** Non-archived tracked accounts (snapshot dialog + column order), plus any
   *  archived/untracked ones that still have balances in the window (history). */
  accounts: FinancialAccount[];
  /** All the group's accounts incl. archived — for the accounts manager. */
  allAccounts: FinancialAccount[];
  /** Months in the window that have at least one snapshot, ascending, plus the
   *  baseline month prepended when one exists (the sheet's "Dec" row). */
  months: string[];
  /** Index into `months` where the viewed year starts (0 or 1 with baseline). */
  windowStart: number;
  /** Aligned to `months`; null = no snapshot for that account that month. */
  balances: Record<number, (number | null)[]>;
  totals: number[];
  mom: (number | null)[];
  cumulative: (number | null)[];
  cumulativePct: (number | null)[];
  bankSaved: {
    totals: number[]; // bank-flagged subset per month
    mom: (number | null)[];
    cumulative: (number | null)[];
    goal: (number | null)[]; // cumulative goal line; null before any segment
  };
  stats: NetWorthStats | null;
  activeGoal: SavingsGoal | null;
};

/** Every financial account of the group, display order, archived last. */
export async function listFinancialAccounts(): Promise<FinancialAccount[]> {
  const groupId = await requireGroupId();
  return db
    .select()
    .from(financialAccounts)
    .where(eq(financialAccounts.groupId, groupId))
    .orderBy(
      asc(financialAccounts.archivedAt),
      asc(financialAccounts.sortOrder),
      asc(financialAccounts.id),
    );
}

/** The whole Net Worth tab in one call (weight-dashboard shape). */
export async function getNetWorthDashboard(year?: number): Promise<NetWorthDashboard> {
  const groupId = await requireGroupId();

  const allAccounts = await db
    .select()
    .from(financialAccounts)
    .where(eq(financialAccounts.groupId, groupId))
    .orderBy(
      asc(financialAccounts.archivedAt),
      asc(financialAccounts.sortOrder),
      asc(financialAccounts.id),
    );

  const accountIds = allAccounts.map((a) => a.id);
  const snaps = accountIds.length
    ? await db
        .select()
        .from(accountSnapshots)
        .where(inArray(accountSnapshots.accountId, accountIds))
        .orderBy(asc(accountSnapshots.month))
    : [];

  const goals = await db
    .select()
    .from(savingsGoals)
    .where(eq(savingsGoals.groupId, groupId))
    .orderBy(asc(savingsGoals.startMonth), asc(savingsGoals.id));
  // Overlaps resolve latest-starting-wins (weightPlans convention).
  const goalFor = (month: string): SavingsGoal | null =>
    [...goals].reverse().find((g) => segmentCovers(g, month)) ?? null;
  const activeGoal = goals.findLast((g) => g.endMonth === null) ?? null;

  // month → accountId → balance
  const byMonth = new Map<string, Map<number, number>>();
  for (const s of snaps) {
    const m = byMonth.get(s.month) ?? new Map<number, number>();
    m.set(s.accountId, Number(s.balance));
    byMonth.set(s.month, m);
  }
  const allMonths = [...byMonth.keys()].sort();

  const availableYears = [...new Set(allMonths.map((m) => Number(m.slice(0, 4))))];
  const now = new Date();
  const viewYear =
    year && availableYears.includes(year)
      ? year
      : (availableYears.at(-1) ?? now.getUTCFullYear());

  const inWindow = allMonths.filter((m) => Number(m.slice(0, 4)) === viewYear);
  // The sheet's "Dec" row: last snapshot month before the window.
  const baseline = allMonths.filter((m) => m < `${viewYear}-01-01`).at(-1) ?? null;
  const months = baseline ? [baseline, ...inWindow] : inWindow;
  const windowStart = baseline ? 1 : 0;

  // Accounts shown in the grid/chart: active+tracked, plus anything with data
  // in these months (so an account archived mid-year keeps its history).
  const hasData = (a: FinancialAccount) =>
    months.some((m) => byMonth.get(m)?.has(a.id));
  const accounts = allAccounts.filter(
    (a) => (!a.archivedAt && a.trackBalance) || hasData(a),
  );

  const balances: Record<number, (number | null)[]> = {};
  for (const a of accounts) {
    balances[a.id] = months.map((m) => byMonth.get(m)?.get(a.id) ?? null);
  }

  const round2 = (n: number) => Math.round(n * 100) / 100;
  const totals = months.map((m) =>
    round2([...(byMonth.get(m)?.values() ?? [])].reduce((s, v) => s + v, 0)),
  );
  const bankIds = new Set(accounts.filter((a) => a.includeInBankSaved).map((a) => a.id));
  const bankTotals = months.map((m) => {
    let sum = 0;
    for (const [id, v] of byMonth.get(m) ?? []) if (bankIds.has(id)) sum += v;
    return round2(sum);
  });

  const momOf = (series: number[]) =>
    series.map((v, i) => (i === 0 ? null : round2(v - series[i - 1])));
  const mom = momOf(totals);
  const bankMom = momOf(bankTotals);

  // Cumulative vs the anchor (baseline month, or the window's first month).
  const cumOf = (series: number[]) =>
    series.map((v, i) => (i === 0 ? null : round2(v - series[0])));
  const cumulative = cumOf(totals);
  const bankCumulative = cumOf(bankTotals);
  const cumulativePct = cumulative.map((c) =>
    c === null || totals[0] === 0 ? null : round2((c / totals[0]) * 100),
  );

  // Goal line: accumulates the month's effective goal, starting AFTER the
  // anchor month (the sheet's Jan = 1×goal). Null until a segment exists.
  let running = 0;
  let seenSegment = false;
  const goal = months.map((m, i) => {
    if (i === 0) return null; // the anchor month has no goal yet
    const seg = goalFor(m);
    if (seg) {
      seenSegment = true;
      running = round2(running + Number(seg.monthlyGoal));
    }
    return seenSegment ? running : null;
  });

  const last = months.length - 1;
  const stats: NetWorthStats | null =
    last >= windowStart
      ? {
          currentMonth: months[last],
          currentTotal: totals[last],
          mom: mom[last],
          cumulative: cumulative[last],
          cumulativePct: cumulativePct[last],
          bankCumulative: bankCumulative[last],
          bankGoalToDate: goal[last],
          bankVsGoal:
            bankCumulative[last] !== null && goal[last] !== null
              ? round2(bankCumulative[last]! - goal[last]!)
              : null,
        }
      : null;

  return {
    year: viewYear,
    availableYears,
    accounts,
    allAccounts,
    months,
    windowStart,
    balances,
    totals,
    mom,
    cumulative,
    cumulativePct,
    bankSaved: { totals: bankTotals, mom: bankMom, cumulative: bankCumulative, goal },
    stats,
    activeGoal,
  };
}
