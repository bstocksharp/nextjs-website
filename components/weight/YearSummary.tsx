import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import type { YearSummary } from "@/lib/queries/weight";

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <Box sx={{ minWidth: 78 }}>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ textTransform: "uppercase", letterSpacing: "0.04em", display: "block" }}
      >
        {label}
      </Typography>
      <Typography variant="h6" component="div" sx={{ color }}>
        {value}
      </Typography>
    </Box>
  );
}

// The year-in-review card. For the current year it's a running recap; a fresh
// chart each January (with last year ghosted) makes this the "new year reset".
export default function YearSummaryCard({ summary: s }: { summary: YearSummary }) {
  const lost = s.totalChange; // + = lost this year
  const vsLast = s.lastYearAtNow != null ? Math.round((s.lastYearAtNow - s.currentWeight) * 10) / 10 : null;

  return (
    <Paper variant="outlined" sx={{ p: { xs: 2, sm: 2.5 }, mt: 3 }}>
      <Typography variant="h6" sx={{ mb: 1.5 }}>
        {s.year} in review
      </Typography>
      <Stack direction="row" flexWrap="wrap" useFlexGap sx={{ gap: 3 }}>
        <Stat label="Start" value={`${s.startWeight} lb`} />
        <Stat label="Now" value={`${s.currentWeight} lb`} />
        <Stat
          label={lost >= 0 ? "Lost" : "Gained"}
          value={`${Math.abs(lost)} lb`}
          color={lost > 0 ? "success.main" : lost < 0 ? "warning.main" : undefined}
        />
        <Stat label="Change" value={`${lost >= 0 ? "−" : "+"}${Math.abs(s.totalChangePct)}%`} />
        <Stat label="Weigh-ins" value={String(s.weighIns)} />
      </Stack>
      {vsLast != null ? (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
          This time last year you were <b>{s.lastYearAtNow} lb</b> —{" "}
          {vsLast > 0
            ? `you're ${vsLast} lb lighter now 🎉`
            : vsLast < 0
              ? `you're ${Math.abs(vsLast)} lb heavier now`
              : "same as now"}
          .
        </Typography>
      ) : null}
    </Paper>
  );
}
