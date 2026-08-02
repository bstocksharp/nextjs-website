"use client";

import * as React from "react";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import { alpha } from "@mui/material/styles";
import type { YearSummary } from "@/lib/queries/weight";
import WrappedModal from "./WrappedModal";

// The Wrapped entry points — kept OFF the dashboard normally to stay sleek:
//   • "button"    → a small "✨ Wrapped" button on a completed past-year view.
//   • "celebrate" → a year-turn banner that also auto-pops the modal ONCE
//                   (localStorage-gated), shown only during the turn window.
export default function Wrapped({
  summary,
  accent,
  mode,
}: {
  summary: YearSummary;
  accent: string;
  mode: "button" | "celebrate";
}) {
  const [open, setOpen] = React.useState(false);
  const auto = React.useRef(false);

  React.useEffect(() => {
    if (mode !== "celebrate" || auto.current) return;
    auto.current = true;
    const key = `weight-wrapped-seen-${summary.year}`;
    try {
      if (!localStorage.getItem(key)) {
        localStorage.setItem(key, "1");
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setOpen(true); // one-time auto-popup at year turn (needs localStorage → effect)
      }
    } catch {
      /* localStorage unavailable — skip the auto-popup */
    }
  }, [mode, summary.year]);

  return (
    <>
      {mode === "button" ? (
        <Button
          size="small"
          variant="outlined"
          startIcon={<AutoAwesomeIcon />}
          onClick={() => setOpen(true)}
          sx={{ flexShrink: 0, borderColor: alpha(accent, 0.5), color: accent }}
        >
          {summary.year} Wrapped
        </Button>
      ) : (
        <Paper
          variant="outlined"
          onClick={() => setOpen(true)}
          sx={{
            display: "block",
            p: 1.5,
            mb: 3,
            cursor: "pointer",
            borderColor: alpha(accent, 0.5),
            backgroundColor: "background.paper",
            backgroundImage: `linear-gradient(135deg, ${alpha(accent, 0.12)}, transparent 60%)`,
          }}
        >
          <Typography variant="body2" sx={{ color: accent, fontWeight: 700 }}>
            🎉 Your {summary.year} Wrapped is here — tap to celebrate →
          </Typography>
        </Paper>
      )}
      <WrappedModal open={open} onClose={() => setOpen(false)} summary={summary} accent={accent} />
    </>
  );
}
