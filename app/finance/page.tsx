import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import SavingsOutlinedIcon from "@mui/icons-material/SavingsOutlined";
import { isEditor } from "@/lib/auth";
import { getNetWorthDashboard } from "@/lib/queries/finance-networth";
import { formatMoney } from "@/lib/format";
import NetWorthActions from "@/components/finance/NetWorthActions";
import NetWorthTiles from "@/components/finance/NetWorthTiles";
import NetWorthChart from "@/components/finance/NetWorthChart";
import SnapshotHistoryTable from "@/components/finance/SnapshotHistoryTable";
import YearSwitcher from "@/components/finance/YearSwitcher";

export const metadata = { title: "Net Worth" };

// The Net Worth tab (F1 of the finance app): monthly per-account balances →
// derived totals/MoM/growth + the bank-saved-vs-goal line. Household data:
// everyone in the group sees it; edit mode gates the writes.
export default async function NetWorthPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const { year } = await searchParams;
  const [dash, editor] = await Promise.all([
    getNetWorthDashboard(year ? Number(year) : undefined),
    isEditor(),
  ]);

  // Current calendar month for the log dialog (server-computed, tz-shifted).
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  const currentMonth = now.toISOString().slice(0, 7);

  // Serializable slices for the client components.
  const snapshotAccounts = dash.allAccounts
    .filter((a) => !a.archivedAt && a.trackBalance)
    .map((a) => ({ id: a.id, name: a.name }));
  const managedAccounts = dash.allAccounts.map((a) => ({
    id: a.id,
    name: a.name,
    kind: a.kind,
    includeInBankSaved: a.includeInBankSaved,
    trackBalance: a.trackBalance,
    archived: a.archivedAt !== null,
    notes: a.notes,
  }));
  const gridAccounts = dash.accounts.map((a) => ({ id: a.id, name: a.name }));

  // "YYYY-MM" → { accountId: balance } for the dialog's per-month prefill, so
  // switching months (or backfilling a past one) always shows that month's data.
  const balancesByMonth: Record<string, Record<number, number | null>> = {};
  dash.months.forEach((m, i) => {
    balancesByMonth[m.slice(0, 7)] = Object.fromEntries(
      dash.accounts.map((a) => [a.id, dash.balances[a.id]?.[i] ?? null]),
    );
  });

  // Year dropdown: current year back through the oldest data (min 6 years back),
  // so backfilling an arbitrary past month is always possible.
  const cy = Number(currentMonth.slice(0, 4));
  const minYear = Math.min(cy - 5, ...(dash.availableYears.length ? dash.availableYears : [cy]));
  const yearOptions: number[] = [];
  for (let y = cy; y >= minYear; y--) yearOptions.push(y);

  const activeGoal = dash.activeGoal
    ? {
        monthlyGoal: Number(dash.activeGoal.monthlyGoal),
        startMonth: dash.activeGoal.startMonth,
      }
    : null;

  const hasData = dash.months.length > 0;

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
            Net Worth
          </Typography>
          <Typography variant="h6" component="p" color="text.secondary" fontWeight={400}>
            {activeGoal
              ? `Saving goal ${formatMoney(activeGoal.monthlyGoal)}/mo`
              : "Monthly balances & growth"}
          </Typography>
        </Stack>
        {editor ? (
          <NetWorthActions
            snapshotAccounts={snapshotAccounts}
            allAccounts={managedAccounts}
            defaultMonth={currentMonth}
            balancesByMonth={balancesByMonth}
            yearOptions={yearOptions}
            activeGoal={activeGoal}
          />
        ) : null}
      </Stack>

      {dash.availableYears.length > 1 ? (
        <Stack direction="row" sx={{ mb: 3 }}>
          <YearSwitcher years={dash.availableYears} current={dash.year} />
        </Stack>
      ) : null}

      {!hasData || !dash.stats ? (
        <Paper variant="outlined" sx={{ p: 5, textAlign: "center" }}>
          <SavingsOutlinedIcon sx={{ fontSize: 44, color: "text.disabled", mb: 1 }} />
          <Typography color="text.secondary">
            {snapshotAccounts.length === 0
              ? editor
                ? "Start with Accounts — add the places your money lives, then log your first month."
                : "No financial accounts set up yet."
              : editor
                ? "Accounts are ready — hit Log balances to record your first month."
                : "No balances logged yet."}
          </Typography>
        </Paper>
      ) : (
        <>
          <NetWorthTiles stats={dash.stats} activeGoal={activeGoal} editor={editor} />

          <Paper variant="outlined" sx={{ p: { xs: 1.5, sm: 2.5 }, mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 1.5, px: 1 }}>
              Where it lives
            </Typography>
            <NetWorthChart
              months={dash.months}
              accounts={gridAccounts}
              balances={dash.balances}
            />
          </Paper>

          <SnapshotHistoryTable
            months={dash.months}
            windowStart={dash.windowStart}
            accounts={gridAccounts}
            balances={dash.balances}
            totals={dash.totals}
            mom={dash.mom}
            balancesByMonth={balancesByMonth}
            yearOptions={yearOptions}
            editor={editor}
          />
        </>
      )}
    </Container>
  );
}
