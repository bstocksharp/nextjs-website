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
};

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
    </Paper>
  );
}
