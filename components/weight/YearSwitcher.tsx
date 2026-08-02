import Link from "@/components/shared/AppLink";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";

// Navigate between calendar years (each ?year= is a full server render of that
// year's dashboard). Only shown when there's more than one year of data.
export default function YearSwitcher({
  years,
  current,
  profile,
}: {
  years: number[];
  current: number;
  profile?: string;
}) {
  if (years.length <= 1) return null;
  const href = (y: number) => `/weight?year=${y}${profile ? `&profile=${profile}` : ""}`;

  return (
    <ToggleButtonGroup size="small" exclusive value={current} aria-label="Year">
      {years.map((y) => (
        <ToggleButton
          key={y}
          value={y}
          component={Link}
          href={href(y)}
          selected={y === current}
          sx={{ px: 1.5, py: 0.4 }}
        >
          {y}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
}
