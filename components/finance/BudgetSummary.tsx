import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { formatMoney, formatMoneySigned } from "@/lib/format";

// The at-a-glance budget header, mirroring the Scriptable widget: how much
// discretionary is LEFT, and whether you're ahead of or behind the daily pace.
// A progress bar shows spend vs budget with a tick at "where you should be
// today" (the same plannedTick the widget draws).
export type BudgetSummaryData = {
  budget: number;
  netSpent: number;
  remaining: number;
  perDay: number;
  paceDelta: number; // + = under pace (can spend), − = over
  allowedSoFar: number;
  dayOfMonth: number;
  daysInMonth: number;
  // The other two spend lanes, shown small beneath the discretionary hero bar —
  // known/less-actionable at a glance, so they're subordinate, not their own card.
  fixed: { actual: number; expected: number };
  amortized: { paid: number; reserved: number };
};

// A compact secondary lane (Fixed / Amortized): label + actual/plan + a thin,
// muted bar. Deliberately quieter than the discretionary hero bar above.
function MiniLane({ label, spent, budget }: { label: string; spent: number; budget: number }) {
  const pct = budget > 0 ? Math.min(100, (spent / budget) * 100) : 0;
  const over = spent > budget + 0.005;
  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.25 }}>
        <Typography variant="caption" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {formatMoney(spent)} / {formatMoney(budget)}
        </Typography>
      </Stack>
      <Box sx={{ height: 5, borderRadius: 3, bgcolor: "action.hover", overflow: "hidden" }}>
        <Box
          sx={{
            height: "100%",
            width: `${pct}%`,
            bgcolor: over ? "warning.main" : "text.disabled",
          }}
        />
      </Box>
    </Box>
  );
}

function Stat({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string;
  sub?: string;
  color?: string;
}) {
  return (
    <Box>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ textTransform: "uppercase", letterSpacing: "0.04em" }}
      >
        {label}
      </Typography>
      <Typography variant="h5" component="div" sx={{ lineHeight: 1.25, color }}>
        {value}
      </Typography>
      {sub ? (
        <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
          {sub}
        </Typography>
      ) : null}
    </Box>
  );
}

export default function BudgetSummary({
  d,
  isCurrentMonth,
}: {
  d: BudgetSummaryData;
  isCurrentMonth: boolean;
}) {
  const overBudget = d.remaining < 0;
  const behind = d.paceDelta < 0;

  // Bar: spent vs budget, clamped; the tick (current month only) marks where
  // you "should be" today.
  const pctSpent = d.budget > 0 ? Math.min(100, (d.netSpent / d.budget) * 100) : 0;
  const pctTick = d.budget > 0 ? Math.min(100, (d.allowedSoFar / d.budget) * 100) : 0;

  return (
    <Paper variant="outlined" sx={{ p: { xs: 2, sm: 2.5 }, mb: 3 }}>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(3, 1fr)" },
          gap: 2,
          mb: 2,
        }}
      >
        <Stat
          label={overBudget ? "Over budget" : "Left to spend"}
          value={formatMoney(d.remaining)}
          color={overBudget ? "warning.main" : "success.main"}
          sub={`of ${formatMoney(d.budget)}${isCurrentMonth ? " this month" : ""}`}
        />
        <Stat
          label="Spent"
          value={formatMoney(d.netSpent)}
          sub={isCurrentMonth ? `day ${d.dayOfMonth} of ${d.daysInMonth}` : "for the month"}
        />
        {isCurrentMonth ? (
          <Stat
            label={behind ? "Over pace by" : "Can spend today"}
            value={
              behind ? formatMoney(Math.abs(d.paceDelta)) : formatMoney(Math.max(0, d.paceDelta))
            }
            color={behind ? "warning.main" : "success.main"}
            sub={`~${formatMoney(d.perDay)}/day`}
          />
        ) : (
          <Stat
            label="Result"
            value={overBudget ? "Over" : "Under"}
            color={overBudget ? "warning.main" : "success.main"}
            sub="month is closed"
          />
        )}
      </Box>

      {/* Spend-vs-budget bar; the on-pace tick only makes sense mid-month. */}
      <Box
        sx={{
          position: "relative",
          height: 12,
          borderRadius: 6,
          bgcolor: "action.hover",
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            width: `${pctSpent}%`,
            bgcolor: overBudget ? "warning.main" : "success.main",
            transition: "width 200ms",
          }}
        />
        {isCurrentMonth ? (
          <Box
            sx={{
              position: "absolute",
              top: -2,
              bottom: -2,
              left: `${pctTick}%`,
              width: "2px",
              bgcolor: "text.primary",
              opacity: 0.7,
            }}
          />
        ) : null}
      </Box>
      <Stack direction="row" justifyContent="space-between" sx={{ mt: 0.5 }}>
        <Typography variant="caption" color="text.secondary">
          {formatMoneySigned(-d.netSpent)} spent
        </Typography>
        {isCurrentMonth ? (
          <Typography variant="caption" color="text.secondary">
            tick = on-pace ({formatMoney(d.allowedSoFar)})
          </Typography>
        ) : null}
      </Stack>

      {/* The quieter lanes — fixed bills & amortized set-asides — folded up here
          so "Details" isn't a separate card just to hold two bars. */}
      {d.fixed.expected > 0 || d.amortized.reserved > 0 ? (
        <Box
          sx={{
            mt: 2,
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
            gap: 1.5,
          }}
        >
          {d.fixed.expected > 0 ? (
            <MiniLane label="Fixed bills" spent={d.fixed.actual} budget={d.fixed.expected} />
          ) : null}
          {d.amortized.reserved > 0 ? (
            <MiniLane
              label="Amortized (reserved)"
              spent={d.amortized.paid}
              budget={d.amortized.reserved}
            />
          ) : null}
        </Box>
      ) : null}
    </Paper>
  );
}
