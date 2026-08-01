"use client";

import * as React from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import Typography from "@mui/material/Typography";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import SubmitButton from "@/components/shared/SubmitButton";
import NumberField from "@/components/shared/NumberField";

// Set or edit the active (lose) plan. Two ways to define the target: a weekly
// PACE (open-ended) or a target DATE (a deadline — "lose 5 by the wedding";
// the pace is derived and the plan ends on that date). Maintain mode arrives in
// 2b-2. Closes itself on success.
export default function PlanDialog({
  open,
  onClose,
  action,
  hasPlan,
  startWeight,
  startDate,
  goalWeight,
  perWeekPace,
  endDate,
}: {
  open: boolean;
  onClose: () => void;
  action: (formData: FormData) => Promise<void>;
  hasPlan: boolean;
  startWeight?: number | null;
  startDate?: string | null;
  goalWeight?: number | null;
  perWeekPace?: number | null;
  endDate?: string | null;
}) {
  const [error, setError] = React.useState<string | null>(null);
  const [paceMode, setPaceMode] = React.useState<"pace" | "date">(endDate ? "date" : "pace");
  // Enable Save only once something actually changes (viewing ≠ editing).
  const [dirty, setDirty] = React.useState(false);

  async function handle(formData: FormData) {
    const required = ["startWeight", "goalWeight", "startDate"].some(
      (k) => !String(formData.get(k) ?? "").trim(),
    );
    const paceMissing =
      paceMode === "pace"
        ? !String(formData.get("perWeekPace") ?? "").trim()
        : !String(formData.get("targetDate") ?? "").trim();
    if (required || paceMissing) {
      setError("Fill in start, goal, date, and the pace (or target date).");
      return;
    }
    setError(null);
    try {
      await action(formData);
      onClose();
    } catch {
      setError("Couldn't save the plan. Try again.");
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>{hasPlan ? "Edit plan" : "Set a plan"}</DialogTitle>
      <form action={handle} onChange={() => setDirty(true)}>
        <input type="hidden" name="mode" value="lose" />
        <input type="hidden" name="paceMode" value={paceMode} />
        <DialogContent sx={{ pt: 1 }}>
          <Stack spacing={2.5}>
            {error ? <Alert severity="error">{error}</Alert> : null}
            <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: "1fr 1fr" }}>
              <NumberField
                name="startWeight"
                label="Start weight (lb)"
                decimalScale={1}
                defaultValue={startWeight}
              />
              <TextField
                name="startDate"
                label="Start date"
                type="date"
                required
                fullWidth
                defaultValue={startDate ?? ""}
                slotProps={{ inputLabel: { shrink: true } }}
              />
              <NumberField
                name="goalWeight"
                label="Goal weight (lb)"
                decimalScale={1}
                defaultValue={goalWeight}
              />
            </Box>

            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
                Define the target by…
              </Typography>
              <ToggleButtonGroup
                size="small"
                exclusive
                value={paceMode}
                onChange={(_, v) => {
                  if (v) {
                    setPaceMode(v);
                    setDirty(true);
                  }
                }}
                fullWidth
              >
                <ToggleButton value="date">Target date</ToggleButton>
                <ToggleButton value="pace">Weekly pace</ToggleButton>
              </ToggleButtonGroup>
            </Box>

            {paceMode === "pace" ? (
              <NumberField
                name="perWeekPace"
                label="Pace (lb / week)"
                decimalScale={3}
                defaultValue={perWeekPace}
              />
            ) : (
              <TextField
                name="targetDate"
                label="Hit goal by"
                type="date"
                fullWidth
                defaultValue={endDate ?? ""}
                helperText="Pace is figured out for you."
                slotProps={{ inputLabel: { shrink: true } }}
              />
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose} color="inherit">
            Cancel
          </Button>
          <SubmitButton variant="contained" pendingLabel="Saving…" disabled={!dirty}>
            {hasPlan ? "Save plan" : "Create plan"}
          </SubmitButton>
        </DialogActions>
      </form>
    </Dialog>
  );
}
