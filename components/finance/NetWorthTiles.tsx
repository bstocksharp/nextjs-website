import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import LinearProgress from "@mui/material/LinearProgress";
import {
  formatMoney,
  formatMoneySigned,
  formatMonth,
} from "@/lib/format";
import type { NetWorthStats } from "@/lib/queries/finance-networth";

// Server component — the top-of-page stat grid (weight-app Tile composition).
function Tile({
  label,
  value,
  sub,
  color,
  children,
}: {
  label: string;
  value?: string;
  sub?: string;
  color?: string;
  children?: React.ReactNode;
}) {
  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ textTransform: "uppercase", letterSpacing: "0.04em" }}
      >
        {label}
      </Typography>
      {value != null ? (
        <Typography variant="h5" component="div" sx={{ mt: 0.5, color }}>
          {value}
        </Typography>
      ) : null}
      {sub ? (
        <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
          {sub}
        </Typography>
      ) : null}
      {children}
    </Paper>
  );
}

const deltaColor = (n: number | null) =>
  n == null || n === 0 ? undefined : n > 0 ? "success.main" : "warning.main";

export default function NetWorthTiles({ stats }: { stats: NetWorthStats }) {
  const goalPct =
    stats.bankCumulative != null && stats.bankGoalToDate != null && stats.bankGoalToDate > 0
      ? (stats.bankCumulative / stats.bankGoalToDate) * 100
      : null;

  return (
    <Box
      sx={{
        display: "grid",
        gap: 1.5,
        gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" },
        mb: 3,
      }}
    >
      <Tile
        label="Net worth"
        value={formatMoney(stats.currentTotal)}
        sub={`as of ${formatMonth(stats.currentMonth)}`}
      />
      <Tile
        label="Month over month"
        value={stats.mom == null ? "—" : formatMoneySigned(stats.mom)}
        color={deltaColor(stats.mom)}
      />
      <Tile
        label="This year"
        value={stats.cumulative == null ? "—" : formatMoneySigned(stats.cumulative)}
        color={deltaColor(stats.cumulative)}
        sub={
          stats.cumulativePct != null
            ? `${stats.cumulativePct >= 0 ? "+" : "−"}${Math.abs(stats.cumulativePct).toFixed(1)}% since baseline`
            : undefined
        }
      />
      <Tile
        label="Bank saved vs goal"
        value={
          stats.bankCumulative == null ? "—" : formatMoneySigned(stats.bankCumulative)
        }
        color={
          stats.bankVsGoal == null
            ? undefined
            : stats.bankVsGoal >= 0
              ? "success.main"
              : "warning.main"
        }
        sub={
          stats.bankGoalToDate != null && stats.bankVsGoal != null
            ? `goal ${formatMoney(stats.bankGoalToDate)} · ${formatMoneySigned(stats.bankVsGoal)} vs plan`
            : "no savings goal yet"
        }
      >
        {goalPct != null ? (
          <LinearProgress
            variant="determinate"
            value={Math.max(0, Math.min(100, goalPct))}
            color={goalPct >= 100 ? "success" : "primary"}
            sx={{ mt: 1.5, height: 8, borderRadius: 4 }}
          />
        ) : null}
      </Tile>
    </Box>
  );
}
