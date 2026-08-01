import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Alert from "@mui/material/Alert";
import type { Milestones as MilestonesData } from "@/lib/queries/weight";

// Earned badges + what's next, computed from the weigh-ins. Static (no window
// state), so a plain server component. Every earned badge is FILLED so it reads
// as achieved; "next" lives in the caption. Behaviour badges (logging streak,
// steady, momentum, comeback) reward the habit, not just the scale. Maintenance-
// mode milestones ("N weeks in range") arrive with the plans model.
export default function Milestones({ milestones: m }: { milestones: MilestonesData }) {
  const hasBadges =
    m.currentStreak >= 2 ||
    m.loggingStreak >= 3 ||
    m.momentum ||
    m.backOnPace ||
    m.comeback ||
    m.newLow ||
    m.steadyLoser ||
    m.decadesCrossed.length > 0 ||
    m.earnedPct.length > 0 ||
    m.earnedLoss.length > 0;

  const footnotes = [
    !m.atGoal && m.nextLossLb != null
      ? `Next: ${m.toNextLossLb} lb to ${m.nextLossLb} lb lost`
      : null,
    m.bestWeekDrop != null ? `best week −${m.bestWeekDrop} lb` : null,
    m.bestStreak >= 2 ? `best streak ${m.bestStreak} wks` : null,
  ].filter(Boolean);

  return (
    <Paper variant="outlined" sx={{ p: { xs: 2, sm: 2.5 }, mt: 3 }}>
      <Typography variant="h6" sx={{ mb: 1.5 }}>
        Milestones
      </Typography>

      {m.atGoal ? (
        <Alert severity="success" sx={{ mb: 2 }}>
          🎉 Goal reached! Ready to switch to maintenance mode?
        </Alert>
      ) : null}

      {hasBadges ? (
        <Stack direction="row" flexWrap="wrap" useFlexGap sx={{ gap: 1 }}>
          {m.currentStreak >= 2 ? (
            <Chip color="warning" variant="filled" label={`🔥 ${m.currentStreak}-week loss streak`} />
          ) : null}
          {m.loggingStreak >= 3 ? (
            <Chip color="primary" variant="filled" label={`📆 ${m.loggingStreak}-week logging streak`} />
          ) : null}
          {m.momentum ? <Chip color="info" variant="filled" label="📉 Down 3 of last 4" /> : null}
          {m.backOnPace ? <Chip color="info" variant="filled" label="Back on pace 🚀" /> : null}
          {m.comeback ? <Chip color="success" variant="filled" label="Comeback 💪" /> : null}
          {m.newLow ? <Chip color="info" variant="filled" label="New low 🎯" /> : null}
          {m.steadyLoser ? <Chip color="success" variant="filled" label="Steady loser 🐢" /> : null}
          {m.decadesCrossed.map((d) => (
            <Chip key={`dec-${d}`} color="success" variant="filled" label={`Under ${d}`} />
          ))}
          {m.earnedPct.map((p) => (
            <Chip key={`pct-${p}`} color="success" variant="filled" label={`${p}% to goal`} />
          ))}
          {m.earnedLoss.map((t) => (
            <Chip key={`loss-${t}`} color="success" variant="filled" label={`${t} lb lost`} />
          ))}
        </Stack>
      ) : (
        <Typography variant="body2" color="text.secondary">
          Keep logging — your first badge is 5 lb lost.
        </Typography>
      )}

      {footnotes.length > 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
          {footnotes.join(" · ")}
        </Typography>
      ) : null}
    </Paper>
  );
}
