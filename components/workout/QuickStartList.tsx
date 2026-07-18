import Link from "next/link";
import Stack from "@mui/material/Stack";
import Paper from "@mui/material/Paper";
import Chip from "@mui/material/Chip";
import MuiLink from "@mui/material/Link";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import LoopIcon from "@mui/icons-material/Loop";
import type { WorkoutListRow } from "@/lib/queries/workout";

// A compact, playable list of saved workouts. Tapping the name opens the
// workout; tapping Start runs it right now (ad-hoc — no schedule change).
export default function QuickStartList({
  workouts,
}: {
  workouts: WorkoutListRow[];
}) {
  if (workouts.length === 0) return null;

  return (
    <Stack spacing={1}>
      {workouts.map((w) => (
        <Paper
          key={w.id}
          variant="outlined"
          sx={{ p: 1.5, display: "flex", alignItems: "center", gap: 1.5 }}
        >
          <MuiLink
            component={Link}
            href={`/workout/${w.id}`}
            underline="hover"
            color="inherit"
            sx={{ flexGrow: 1, minWidth: 0, fontWeight: 500 }}
          >
            {w.name}
          </MuiLink>
          {w.rounds > 1 ? (
            <Chip
              size="small"
              icon={<LoopIcon />}
              label={w.rounds}
              variant="outlined"
            />
          ) : null}
          <Chip
            size="small"
            icon={<PlayArrowIcon />}
            label="Start"
            clickable
            component={Link}
            href={`/workout/${w.id}/run`}
            color="primary"
            variant="outlined"
          />
        </Paper>
      ))}
    </Stack>
  );
}
