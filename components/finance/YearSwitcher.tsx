import Link from "@/components/shared/AppLink";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";

// Navigate between calendar years of net-worth history (each ?year= is a full
// server render). Only shown when there's more than one year of data.
export default function YearSwitcher({
  years,
  current,
}: {
  years: number[];
  current: number;
}) {
  if (years.length <= 1) return null;

  return (
    <ToggleButtonGroup size="small" exclusive value={current} aria-label="Year">
      {years.map((y) => (
        <ToggleButton
          key={y}
          value={y}
          component={Link}
          href={`/finance?year=${y}`}
          selected={y === current}
          sx={{ px: 1.5, py: 0.4 }}
        >
          {y}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
}
