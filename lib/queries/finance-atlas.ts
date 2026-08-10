import "server-only";
import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  compensationPlans,
  incomeDeductions,
  recurringExpenses,
  financialAccounts,
  type CompensationPlan,
  type IncomeDeduction,
  type RecurringExpense,
} from "@/lib/db/schema";
import { requireGroupId } from "@/lib/session";
import { profileInGroup } from "./scope";
import { listProfiles } from "./profiles";
import { currentMonthISO, lastDayOfMonth, todayISO } from "@/lib/finance/parse";

// ─────────────────────────────────────────────────────────────────────────────
// ATLAS — reads + ALL derived income/spend math (nothing stored; the effective-
// dated config rows ARE the history). `getAtlasView(month?)` renders any month
// with the config that was true then: rows are filtered to those effective "as
// of" a single point in time — the last day of a past month, or today for the
// current one — so a mid-month raise shows up the month it lands and past
// months never move.
//
// Money math runs in integer CENTS and converts out at the edges (numeric
// columns arrive as strings; float summing drifts).
// ─────────────────────────────────────────────────────────────────────────────

const cents = (v: string | number | null | undefined): number =>
  v == null ? 0 : Math.round(Number(v) * 100);
const dollars = (c: number): number => Math.round(c) / 100;

const PAYCHECKS_PER_YEAR: Record<string, number> = {
  weekly: 52,
  biweekly: 26,
  semimonthly: 24,
  monthly: 12,
};

type Dated = { startDate: string; endDate: string | null };
const effectiveAt = <T extends Dated>(rows: T[], asOf: string): T[] =>
  rows.filter((r) => r.startDate <= asOf && (r.endDate === null || r.endDate >= asOf));

export type AtlasDeductionRow = IncomeDeduction & {
  /** The row's $ per paycheck: the flat amount, or (for %-based rows) the
   *  percent applied to the effective gross — so raises flow through. */
  effectivePerPaycheck: number;
  /** Per-month equivalent (effective × paychecks/yr ÷ 12), dollars. */
  monthly: number;
  /** Share of gross, percent (defined % for percent rows, computed for flat). */
  pctOfGross: number | null;
  /** Defined as a % of gross (vs a flat $). */
  isPercent: boolean;
};

export type AtlasProfileView = {
  profileId: number;
  name: string;
  color: string | null;
  plan: CompensationPlan;
  paychecksPerYear: number;
  deductions: AtlasDeductionRow[];
  /** All dollars. */
  grossPerPaycheck: number;
  payrollDeductionsPerPaycheck: number;
  employerPerPaycheck: number;
  netPerPaycheck: number;
  monthlyNet: number;
  yearlyNet: number;
  hourly: number | null; // baseSalary / 2080
  tcv: number | null; // base + shares × price
  /** 401k/HSA-style wealth building, annualized: payroll retirement+health
   *  deductions + every employer contribution. */
  investingPerYear: number;
};

export type AtlasExpenseRow = RecurringExpense & {
  monthly: number; // amount × paymentsPerYear ÷ 12, dollars
  paidFromName: string | null;
  paidFromKind: string | null;
};

export type AtlasView = {
  /** YYYY-MM-01 being viewed + whether it's the live current month. */
  month: string;
  isCurrentMonth: boolean;
  /** Earliest config month — bounds the time-travel switcher. */
  earliestMonth: string | null;
  people: AtlasProfileView[];
  expenses: AtlasExpenseRow[];
  /** Existing category labels (for the freeform autocomplete). */
  categoryOptions: string[];
  /** Every category ever used + how many expense rows carry it (all segments) —
   *  drives the category manager (rename / merge). */
  categoryUsage: { category: string; count: number }[];
  totals: {
    monthlyNet: number; // all people combined
    fixedMonthly: number; // all recurring expenses, monthly-normalized
    byCategory: { category: string; monthly: number }[];
    byNecessity: { necessity: string; monthly: number }[];
    byAccount: { name: string; kind: string | null; monthly: number }[];
    discretionLeft: number; // monthlyNet − fixedMonthly
    /**
     * Planned monthly outflow per source: each account's fixed bills, with the
     * discretionary allocation added to the spending card (F3 makes that an
     * explicit flag; today = the first credit_card account). The one carrying
     * discretion IS the budget envelope; the others are the "already
     * guaranteed" outflows. Sums to monthlyNet when nothing is over-committed.
     */
    expectedOutflows: {
      name: string;
      kind: string | null;
      monthly: number;
      includesDiscretion: boolean;
    }[];
  };
};

export async function getAtlasView(monthParam?: string): Promise<AtlasView> {
  const groupId = await requireGroupId();

  const currentMonth = currentMonthISO();
  const month =
    monthParam && /^\d{4}-\d{2}/.test(monthParam)
      ? `${monthParam.slice(0, 7)}-01`
      : currentMonth;
  const isCurrentMonth = month === currentMonth;
  // Point-in-time semantics: past months read as of their last day; the
  // current month reads as of today (a raise landing Aug 15 shows from Aug 15).
  const asOf = isCurrentMonth ? todayISO() : lastDayOfMonth(month);

  const [profiles, allPlans, allDeductions, allExpenses, accounts] =
    await Promise.all([
      listProfiles(),
      db
        .select()
        .from(compensationPlans)
        .where(profileInGroup(compensationPlans.profileId, groupId))
        .orderBy(asc(compensationPlans.startDate), asc(compensationPlans.id)),
      db
        .select()
        .from(incomeDeductions)
        .where(profileInGroup(incomeDeductions.profileId, groupId))
        .orderBy(asc(incomeDeductions.startDate), asc(incomeDeductions.id)),
      db
        .select()
        .from(recurringExpenses)
        .where(eq(recurringExpenses.groupId, groupId))
        .orderBy(asc(recurringExpenses.name), asc(recurringExpenses.startDate)),
      db
        .select({
          id: financialAccounts.id,
          name: financialAccounts.name,
          kind: financialAccounts.kind,
        })
        .from(financialAccounts)
        .where(eq(financialAccounts.groupId, groupId)),
    ]);
  const accountById = new Map(accounts.map((a) => [a.id, a]));

  const earliest = [...allPlans, ...allDeductions, ...allExpenses]
    .map((r) => r.startDate)
    .sort()[0];

  // ── Per-person income ────────────────────────────────────────────────────────
  const people: AtlasProfileView[] = [];
  for (const p of profiles) {
    // Latest-starting effective plan wins (overlaps happen mid-transition).
    const plan = effectiveAt(
      allPlans.filter((r) => r.profileId === p.id),
      asOf,
    ).at(-1);
    if (!plan) continue;

    const ppy = PAYCHECKS_PER_YEAR[plan.payFrequency] ?? 24;
    const deductions = effectiveAt(
      allDeductions.filter((r) => r.profileId === p.id),
      asOf,
    );

    const grossC = cents(plan.grossPerPaycheck);
    // A row's per-paycheck cents: flat $, or % of the effective gross (percent
    // rows ride along with raises automatically).
    const perCheckC = (d: IncomeDeduction): number =>
      d.percentOfGross != null
        ? Math.round((grossC * Number(d.percentOfGross)) / 100)
        : cents(d.amountPerPaycheck);

    const payrollC = deductions
      .filter((d) => d.source === "payroll")
      .reduce((s, d) => s + perCheckC(d), 0);
    const employerC = deductions
      .filter((d) => d.source === "employer")
      .reduce((s, d) => s + perCheckC(d), 0);
    const netC = grossC - payrollC;
    const investC =
      deductions
        .filter(
          (d) =>
            d.source === "employer" ||
            d.type === "retirement" ||
            d.type === "health",
        )
        .reduce((s, d) => s + perCheckC(d), 0) * ppy;

    const baseC = plan.baseSalary != null ? cents(plan.baseSalary) : null;
    const tcvC =
      baseC != null
        ? baseC +
          (plan.shares != null && plan.sharePrice != null
            ? Math.round(plan.shares * Number(plan.sharePrice) * 100)
            : 0)
        : null;

    people.push({
      profileId: p.id,
      name: p.name,
      color: p.color,
      plan,
      paychecksPerYear: ppy,
      deductions: deductions.map((d) => ({
        ...d,
        effectivePerPaycheck: dollars(perCheckC(d)),
        monthly: dollars((perCheckC(d) * ppy) / 12),
        // Every row gets a % relative to gross — for payroll rows it's "share
        // of the paycheck", for employer rows it's "worth X% of a check".
        // isPercent marks rows DEFINED as a percent (they follow raises).
        pctOfGross:
          d.percentOfGross != null
            ? Number(d.percentOfGross)
            : grossC > 0
              ? Math.round((perCheckC(d) / grossC) * 1000) / 10
              : null,
        isPercent: d.percentOfGross != null,
      })),
      grossPerPaycheck: dollars(grossC),
      payrollDeductionsPerPaycheck: dollars(payrollC),
      employerPerPaycheck: dollars(employerC),
      netPerPaycheck: dollars(netC),
      monthlyNet: dollars((netC * ppy) / 12),
      yearlyNet: dollars(netC * ppy),
      hourly: baseC != null ? dollars(baseC / 2080) : null,
      tcv: tcvC != null ? dollars(tcvC) : null,
      investingPerYear: dollars(investC),
    });
  }

  // ── Household recurring spend ────────────────────────────────────────────────
  const expenses: AtlasExpenseRow[] = effectiveAt(allExpenses, asOf).map((e) => {
    const acct = e.paidFromAccountId != null ? accountById.get(e.paidFromAccountId) : null;
    return {
      ...e,
      monthly: dollars((cents(e.amount) * e.paymentsPerYear) / 12),
      paidFromName: acct?.name ?? null,
      paidFromKind: acct?.kind ?? null,
    };
  });

  const sumMonthlyC = (rows: AtlasExpenseRow[]) =>
    rows.reduce((s, e) => s + Math.round(e.monthly * 100), 0);

  const groupBy = (key: (e: AtlasExpenseRow) => string) => {
    const m = new Map<string, number>();
    for (const e of expenses) {
      const k = key(e);
      m.set(k, (m.get(k) ?? 0) + Math.round(e.monthly * 100));
    }
    return [...m.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([k, c]) => ({ key: k, monthly: dollars(c) }));
  };

  const monthlyNetC = people.reduce((s, p) => s + Math.round(p.monthlyNet * 100), 0);
  const fixedC = sumMonthlyC(expenses);
  const discretionC = monthlyNetC - fixedC;

  // Per-source planned outflow; discretion rides on the spending card (first
  // credit_card until F3's explicit flag).
  const byAccountRaw = groupBy((e) => e.paidFromName ?? "Unassigned").map(
    ({ key, monthly }) => ({
      name: key,
      kind:
        expenses.find((e) => (e.paidFromName ?? "Unassigned") === key)
          ?.paidFromKind ?? null,
      monthly,
    }),
  );
  const expectedOutflows = byAccountRaw.map((a) => ({
    ...a,
    includesDiscretion: false,
  }));
  const cardIdx = expectedOutflows.findIndex((a) => a.kind === "credit_card");
  if (cardIdx >= 0 && discretionC > 0) {
    expectedOutflows[cardIdx] = {
      ...expectedOutflows[cardIdx],
      monthly: dollars(
        Math.round(expectedOutflows[cardIdx].monthly * 100) + discretionC,
      ),
      includesDiscretion: true,
    };
  }
  expectedOutflows.sort((a, b) => b.monthly - a.monthly);

  // Freeform-category suggestions + usage counts over ALL rows (rename/merge
  // affects every segment, not just the effective ones).
  const usageMap = new Map<string, number>();
  for (const e of allExpenses) {
    if (e.category) usageMap.set(e.category, (usageMap.get(e.category) ?? 0) + 1);
  }
  const categoryOptions = [...usageMap.keys()].sort();
  const categoryUsage = [...usageMap.entries()]
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count || a.category.localeCompare(b.category));

  return {
    month,
    isCurrentMonth,
    earliestMonth: earliest ? `${earliest.slice(0, 7)}-01` : null,
    people,
    expenses,
    categoryOptions,
    categoryUsage,
    totals: {
      monthlyNet: dollars(monthlyNetC),
      fixedMonthly: dollars(fixedC),
      byCategory: groupBy((e) => e.category ?? "Uncategorized").map(
        ({ key, monthly }) => ({ category: key, monthly }),
      ),
      byNecessity: groupBy((e) => e.necessity).map(({ key, monthly }) => ({
        necessity: key,
        monthly,
      })),
      byAccount: byAccountRaw,
      discretionLeft: dollars(discretionC),
      expectedOutflows,
    },
  };
}
