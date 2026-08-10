import Link from "@/components/shared/AppLink";
import Stack from "@mui/material/Stack";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { formatMonth } from "@/lib/format";

/** "YYYY-MM-01" ± n months. */
function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return d.toISOString().slice(0, 10);
}

// Time travel for ATLAS: step through months to see the config AS IT WAS THEN
// (each ?month= is a full server render against that month's effective rows).
// Bounded by the earliest config and the current month; editing is only
// offered on "now" — the past is a read-only exhibit.
export default function AtlasMonthSwitcher({
  month,
  earliestMonth,
  currentMonth,
}: {
  month: string; // YYYY-MM-01 being viewed
  earliestMonth: string | null;
  currentMonth: string; // YYYY-MM-01
}) {
  if (!earliestMonth || earliestMonth === currentMonth) return null;

  const prev = shiftMonth(month, -1);
  const next = shiftMonth(month, 1);
  const isCurrent = month === currentMonth;

  return (
    <Stack direction="row" spacing={0.5} alignItems="center">
      <IconButton
        size="small"
        component={Link}
        href={`/finance/atlas?month=${prev.slice(0, 7)}`}
        disabled={prev < earliestMonth}
        aria-label="Previous month"
      >
        <ChevronLeftIcon fontSize="small" />
      </IconButton>
      <Typography variant="body2" fontWeight={600} sx={{ minWidth: 76, textAlign: "center" }}>
        {formatMonth(month)}
      </Typography>
      <IconButton
        size="small"
        component={Link}
        href={`/finance/atlas?month=${next.slice(0, 7)}`}
        disabled={isCurrent}
        aria-label="Next month"
      >
        <ChevronRightIcon fontSize="small" />
      </IconButton>
      {!isCurrent ? (
        <Chip
          size="small"
          color="primary"
          variant="outlined"
          label="back to now"
          component={Link}
          href="/finance/atlas"
          clickable
        />
      ) : null}
    </Stack>
  );
}
