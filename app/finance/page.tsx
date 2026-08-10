import Link from "@/components/shared/AppLink";
import { redirect } from "next/navigation";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import { getSession } from "@/lib/session";
import { isEditor } from "@/lib/auth";
import {
  getBudgetMonth,
  listMonthTransactionsForSession,
  listBudgetMonths,
  listBillsForMonth,
  listRecentMonths,
  listMerchantSuggestions,
} from "@/lib/queries/finance-budget";
import { listFinancialAccounts } from "@/lib/queries/finance-networth";
import { listProfiles } from "@/lib/queries/profiles";
import { currentMonthISO } from "@/lib/finance/parse";
import { formatMonth } from "@/lib/format";
import AtlasMonthSwitcher from "@/components/finance/AtlasMonthSwitcher";
import BudgetSummary from "@/components/finance/BudgetSummary";
import BudgetAnalytics from "@/components/finance/BudgetAnalytics";
import TransactionsTable from "@/components/finance/TransactionsTable";
import FundsPanel from "@/components/finance/FundsPanel";
import type { TxnRowData } from "@/components/finance/TransactionRow";

export const metadata = { title: "Budget" };

const d = (c: number) => Math.round(c) / 100;

// The Budget tab (F3): this month's transactions + the discretionary pace,
// computed live from the ledger. Past months render frozen once closed (CP4b).
export default async function BudgetPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  if ((await getSession()) === null) redirect("/login");

  const { month: monthParam } = await searchParams;
  const currentMonth = currentMonthISO();
  const month =
    monthParam && /^\d{4}-\d{2}/.test(monthParam)
      ? `${monthParam.slice(0, 7)}-01`
      : currentMonth;

  const [view, txns, accounts, monthsWithData, bills, groupProfiles, recentMonths, suggest, editor] =
    await Promise.all([
      getBudgetMonth(month),
      listMonthTransactionsForSession(month),
      listFinancialAccounts(),
      listBudgetMonths(),
      listBillsForMonth(month),
      listProfiles(),
      listRecentMonths(3),
      listMerchantSuggestions(),
      isEditor(),
    ]);
  const c = view.computation;
  const disc = c.discretionary;

  const rows: TxnRowData[] = txns.map((t) => ({
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
  }));

  const fundPicks = c.funds.map((f) => ({ id: f.id, name: f.name }));
  const fundViews = c.funds.map((f) => ({
    id: f.id,
    name: f.name,
    ownerName: f.ownerName,
    balance: d(f.balanceC),
    drawnThisMonth: d(f.drawnThisMonthC),
  }));
  const accountPicks = accounts
    .filter((a) => !a.archivedAt)
    .map((a) => ({ id: a.id, name: a.name }));
  const ownerPicks = groupProfiles.map((p) => ({ id: p.id, name: p.name }));
  const earliestMonth = monthsWithData[0] ?? null;

  // Highlights computed from the month's real rows (not the engine — these are
  // display flourishes). "Spend" = money that left, excluding credits/income.
  const SPEND_CATS = new Set(["discretionary", "fixed", "amortized", "savings", "fund"]);
  const spendRows = rows.filter((r) => SPEND_CATS.has(r.category) && r.amount > 0);
  const biggest = spendRows.reduce<TxnRowData | null>(
    (best, r) => (best === null || r.amount > best.amount ? r : best),
    null,
  );
  const merchantTotals = new Map<string, number>();
  for (const r of rows) {
    if (r.category !== "discretionary" || !r.merchant) continue;
    merchantTotals.set(r.merchant, (merchantTotals.get(r.merchant) ?? 0) + r.amount);
  }
  const topMerchantEntry = [...merchantTotals.entries()].sort((a, b) => b[1] - a[1])[0];

  // Income this month, grouped by source (the merchant field on income rows).
  // Only true income rows — the fund top-up an income entry may spawn is a
  // separate "fund" row and never counts here.
  const incomeRows = rows.filter((r) => r.category === "income");
  const incomeTotal = incomeRows.reduce((s, r) => s + r.amount, 0);
  const incomeSourceTotals = new Map<string, number>();
  for (const r of incomeRows) {
    const k = r.merchant || "—";
    incomeSourceTotals.set(k, (incomeSourceTotals.get(k) ?? 0) + r.amount);
  }
  const incomeBySource = [...incomeSourceTotals.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([source, amount]) => ({ source, amount }));

  return (
    <Container maxWidth="md" sx={{ py: { xs: 4, md: 6 } }}>
      <Stack
        direction="row"
        alignItems="flex-start"
        justifyContent="space-between"
        spacing={2}
        sx={{ mb: 3, flexWrap: "wrap", rowGap: 2 }}
      >
        <Stack spacing={0.5}>
          <Typography variant="h3" component="h1">
            Budget
          </Typography>
          <Typography variant="h6" component="p" color="text.secondary" fontWeight={400}>
            {month === currentMonth ? "This month's spending, live" : formatMonth(month)}
          </Typography>
        </Stack>
        <Stack direction="row" spacing={1} alignItems="center">
          <AtlasMonthSwitcher
            month={month}
            earliestMonth={earliestMonth}
            currentMonth={currentMonth}
            basePath="/finance"
          />
          {editor ? (
            <Button
              component={Link}
              href="/finance/settings"
              size="small"
              color="inherit"
              startIcon={<SettingsOutlinedIcon />}
            >
              Connections
            </Button>
          ) : null}
        </Stack>
      </Stack>

      {!view.hasIncome ? (
        <Alert severity="info" sx={{ mb: 3 }}>
          No income is set for {formatMonth(month)}, so there&apos;s no spending
          budget to compute — only the bills that were active then.
          {editor
            ? " Back-date compensation in ATLAS if you want to budget this month."
            : ""}
        </Alert>
      ) : (
        <BudgetSummary
          isCurrentMonth={month === currentMonth}
          d={{
            budget: d(disc.budgetC),
            netSpent: d(disc.netSpentC),
            remaining: d(disc.remainingC),
            perDay: d(disc.perDayC),
            paceDelta: d(disc.paceDeltaC),
            allowedSoFar: d(disc.allowedSoFarC),
            dayOfMonth: c.dayOfMonth,
            daysInMonth: c.daysInMonth,
          }}
        />
      )}

      {disc.estimateAdjustmentC !== 0 ? (
        <Alert severity="info" variant="outlined" sx={{ mb: 3 }}>
          Budget adjusted {formatMonth(month)} by{" "}
          {d(disc.estimateAdjustmentC) >= 0 ? "+" : "−"}$
          {Math.abs(d(disc.estimateAdjustmentC)).toFixed(2)} — a variable bill
          posted differently than its estimate.
        </Alert>
      ) : null}

      <TransactionsTable
        txns={rows}
        funds={fundPicks}
        bills={bills}
        accounts={accountPicks}
        merchants={suggest.merchants}
        sources={suggest.sources}
        editable={editor}
      />

      {c.needsReviewCount > 0 && editor ? (
        <Box sx={{ mt: 2 }}>
          <Typography variant="caption" color="text.secondary">
            Tip: the ⚠ rows couldn&apos;t be read automatically — open the ⋮ menu
            to set their details.
          </Typography>
        </Box>
      ) : null}

      <BudgetAnalytics
        d={{
          isCurrentMonth: month === currentMonth,
          totalSpent: d(c.totalOutflowC),
          totalPlan: d(disc.budgetC + c.fixed.expectedC + c.amortized.reservedMonthlyC),
          discretionary: { spent: d(disc.netSpentC), budget: d(disc.budgetC) },
          fixed: { actual: d(c.fixed.actualC), expected: d(c.fixed.expectedC) },
          amortized: { paid: d(c.amortized.paidThisMonthC), reserved: d(c.amortized.reservedMonthlyC) },
          reimbursed: d(disc.reimbursedC),
          savings: d(c.savingsC),
          income: { total: incomeTotal, bySource: incomeBySource },
          paceDelta: d(disc.paceDeltaC),
          daysToCatchUp: c.analytics.daysToCatchUp,
          daysLeft: c.analytics.daysLeft,
          today: d(c.analytics.todayC),
          yesterday: d(c.analytics.yesterdayC),
          last7: d(c.analytics.last7C),
          biggest: biggest ? { merchant: biggest.merchant ?? "—", amount: biggest.amount } : null,
          topMerchant: topMerchantEntry
            ? { merchant: topMerchantEntry[0], total: topMerchantEntry[1] }
            : null,
          recentMonths: recentMonths.filter((m) => m.month !== month),
        }}
      />

      <FundsPanel funds={fundViews} owners={ownerPicks} editable={editor} />
    </Container>
  );
}
