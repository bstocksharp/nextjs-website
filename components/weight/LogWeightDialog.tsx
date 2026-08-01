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
import SubmitButton from "@/components/shared/SubmitButton";
import NumberField from "@/components/shared/NumberField";

// Reusable modal for logging a NEW weigh-in or EDITING an existing one. The
// caller passes a bound server action (logWeight for new, updateWeighIn for
// edit) and controls open/close. On success it closes itself; on failure (e.g.
// a duplicate date) it keeps open and shows why. Re-logging a date overwrites,
// so "new" doubles as an edit-by-date too.
export default function LogWeightDialog({
  open,
  onClose,
  action,
  title,
  submitLabel = "Save",
  defaultDate,
  initialWeight,
  initialNote,
}: {
  open: boolean;
  onClose: () => void;
  action: (formData: FormData) => Promise<void>;
  title: string;
  submitLabel?: string;
  defaultDate: string;
  initialWeight?: number | null;
  initialNote?: string | null;
}) {
  const [error, setError] = React.useState<string | null>(null);

  async function handle(formData: FormData) {
    if (!String(formData.get("weight") ?? "").trim()) {
      setError("Weight is required.");
      return;
    }
    setError(null);
    try {
      await action(formData);
      onClose();
    } catch {
      setError("Couldn't save — is there already a weigh-in on that date?");
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>{title}</DialogTitle>
      {/* key remounts the fields when switching which row we're editing */}
      <form action={handle} key={`${defaultDate}-${initialWeight ?? ""}`}>
        <DialogContent sx={{ pt: 1 }}>
          <Stack spacing={2.5}>
            {error ? <Alert severity="error">{error}</Alert> : null}
            <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: "1fr 1fr" }}>
              <TextField
                name="measuredOn"
                label="Date"
                type="date"
                required
                fullWidth
                defaultValue={defaultDate}
                slotProps={{ inputLabel: { shrink: true } }}
              />
              <NumberField
                name="weight"
                label="Weight (lb)"
                decimalScale={1}
                defaultValue={initialWeight}
              />
            </Box>
            <TextField
              name="note"
              label="Note (optional)"
              fullWidth
              multiline
              minRows={1}
              defaultValue={initialNote ?? ""}
              placeholder="vacation, sick, …"
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose} color="inherit">
            Cancel
          </Button>
          <SubmitButton variant="contained" pendingLabel="Saving…">
            {submitLabel}
          </SubmitButton>
        </DialogActions>
      </form>
    </Dialog>
  );
}
