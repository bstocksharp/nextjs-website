"use client";

import * as React from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import Typography from "@mui/material/Typography";
import SubmitButton from "@/components/shared/SubmitButton";
import NumberField from "@/components/shared/NumberField";
import {
  saveSavingsGoalAction,
  startSavingsGoalAction,
} from "@/app/actions/finance-networth";
import { formatMoney, formatMonth } from "@/lib/format";

// The "Bank saved" monthly goal. Two save flavors, matching the weight app's
// plan dialog: ADJUST the current goal in place (typo/tune-up — the whole goal
// line recomputes) or START a new segment from a month (raise season — history
// keeps the old goal, the line bends going forward).
export default function SavingsGoalDialog({
  open,
  onClose,
  activeGoal,
  defaultMonth,
}: {
  open: boolean;
  onClose: () => void;
  activeGoal: { monthlyGoal: number; startMonth: string } | null;
  /** "YYYY-MM" default for new segments. */
  defaultMonth: string;
}) {
  const [flavor, setFlavor] = React.useState<"adjust" | "new">(
    activeGoal ? "adjust" : "new",
  );
  const [error, setError] = React.useState<string | null>(null);

  async function handle(formData: FormData) {
    setError(null);
    try {
      if (activeGoal && flavor === "new") await startSavingsGoalAction(formData);
      else await saveSavingsGoalAction(formData);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save the goal.");
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Savings goal</DialogTitle>
      <form action={handle}>
        <DialogContent sx={{ pt: 1 }}>
          <Stack spacing={2.5}>
            {error ? <Alert severity="error">{error}</Alert> : null}
            {activeGoal ? (
              <>
                <Typography variant="body2" color="text.secondary">
                  Current: <strong>{formatMoney(activeGoal.monthlyGoal)}/mo</strong>{" "}
                  since {formatMonth(activeGoal.startMonth)}.
                </Typography>
                <RadioGroup
                  value={flavor}
                  onChange={(e) => setFlavor(e.target.value as "adjust" | "new")}
                >
                  <FormControlLabel
                    value="adjust"
                    control={<Radio size="small" />}
                    label="Adjust this goal (recalculates its whole line)"
                  />
                  <FormControlLabel
                    value="new"
                    control={<Radio size="small" />}
                    label="New goal starting a given month (history keeps the old one)"
                  />
                </RadioGroup>
              </>
            ) : (
              <Typography variant="body2" color="text.secondary">
                How much should land in your bank-saved accounts each month? The
                dashboard tracks actual growth against this line.
              </Typography>
            )}
            <NumberField
              name="monthlyGoal"
              label="Monthly goal"
              prefix="$"
              decimalScale={2}
              defaultValue={activeGoal?.monthlyGoal ?? null}
            />
            {!activeGoal || flavor === "new" ? (
              <TextField
                name="startMonth"
                label="Starting month"
                type="month"
                required
                fullWidth
                defaultValue={defaultMonth}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            ) : null}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose} color="inherit">
            Cancel
          </Button>
          <SubmitButton variant="contained" pendingLabel="Saving…">
            Save goal
          </SubmitButton>
        </DialogActions>
      </form>
    </Dialog>
  );
}
