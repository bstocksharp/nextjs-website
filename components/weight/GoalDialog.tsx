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
import SubmitButton from "@/components/shared/SubmitButton";
import NumberField from "@/components/shared/NumberField";

// Set or re-plan the goal in a modal. The target line falls from the start
// weight by the weekly pace until it reaches the goal. "Re-plan" just overwrites
// the one goal row — the target line and projections recompute from these four
// numbers. Closes itself on success.
export default function GoalDialog({
  open,
  onClose,
  action,
  hasGoal,
  startWeight,
  startDate,
  goalWeight,
  perWeekPace,
}: {
  open: boolean;
  onClose: () => void;
  action: (formData: FormData) => Promise<void>;
  hasGoal: boolean;
  startWeight?: number | null;
  startDate?: string | null;
  goalWeight?: number | null;
  perWeekPace?: number | null;
}) {
  const [error, setError] = React.useState<string | null>(null);

  async function handle(formData: FormData) {
    const missing = ["startWeight", "goalWeight", "perWeekPace"].some(
      (k) => !String(formData.get(k) ?? "").trim(),
    );
    if (missing || !String(formData.get("startDate") ?? "").trim()) {
      setError("All four fields are required.");
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
      <DialogTitle>{hasGoal ? "Re-plan goal" : "Set a goal"}</DialogTitle>
      <form action={handle}>
        <DialogContent sx={{ pt: 1 }}>
          <Stack spacing={2.5}>
            {error ? <Alert severity="error">{error}</Alert> : null}
            <Typography variant="body2" color="text.secondary">
              The target line falls from your start weight by the weekly pace
              until it reaches the goal.
            </Typography>
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
              <NumberField
                name="perWeekPace"
                label="Pace (lb / week)"
                decimalScale={3}
                defaultValue={perWeekPace}
              />
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose} color="inherit">
            Cancel
          </Button>
          <SubmitButton variant="contained" pendingLabel="Saving…">
            {hasGoal ? "Save plan" : "Create plan"}
          </SubmitButton>
        </DialogActions>
      </form>
    </Dialog>
  );
}
