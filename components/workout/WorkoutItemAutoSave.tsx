"use client";

import * as React from "react";
import { useFormStatus } from "react-dom";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import CircularProgress from "@mui/material/CircularProgress";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import { SECTIONS } from "@/lib/workout";
import type { WorkoutItem, Exercise } from "@/lib/db/schema";

// Inline item editor for the builder — auto-saves like the rest of the builder.
// Text/number fields save on blur; selects/checkbox on change. No Save button.
// Fields are prefilled with the EFFECTIVE value (item override ?? catalog default).
function SaveStatus() {
  const { pending } = useFormStatus();
  return (
    <Stack direction="row" spacing={0.5} alignItems="center" sx={{ minHeight: 20 }}>
      {pending ? (
        <>
          <CircularProgress size={14} />
          <Typography variant="caption" color="text.secondary">
            Saving…
          </Typography>
        </>
      ) : (
        <>
          <CheckCircleOutlineIcon sx={{ fontSize: 16 }} color="success" />
          <Typography variant="caption" color="text.secondary">
            Saved automatically
          </Typography>
        </>
      )}
    </Stack>
  );
}

export default function WorkoutItemAutoSave({
  action,
  item,
  exercise,
}: {
  action: (formData: FormData) => void | Promise<void>;
  item: WorkoutItem;
  exercise: Exercise;
}) {
  const formRef = React.useRef<HTMLFormElement>(null);
  const save = () => formRef.current?.requestSubmit();

  const reps = item.reps ?? exercise.defaultReps ?? "";
  const duration = item.duration ?? exercise.defaultDuration ?? "";
  const weight = item.weight ?? exercise.defaultWeight ?? "";
  const holdLast = item.holdLast ?? exercise.holdLast ?? false;

  return (
    <form action={action} ref={formRef}>
      <Stack spacing={2}>
        <TextField
          name="section"
          label="Section"
          select
          fullWidth
          defaultValue={item.section ?? "main"}
          onChange={save}
          slotProps={{ select: { native: true }, inputLabel: { shrink: true } }}
        >
          {SECTIONS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </TextField>

        <Box
          sx={{
            display: "grid",
            gap: 2,
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
          }}
        >
          <TextField
            name="reps"
            label="Reps"
            fullWidth
            defaultValue={reps}
            onBlur={save}
            placeholder="e.g. 10-12, 8 each leg"
            helperText="Blank = pure timer"
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField
            name="duration"
            label="Time (seconds)"
            type="number"
            fullWidth
            defaultValue={duration}
            onBlur={save}
            helperText="Per rep if reps set, else total hold"
            slotProps={{
              htmlInput: { min: 0, step: 1 },
              inputLabel: { shrink: true },
            }}
          />
          <TextField
            name="weight"
            label="Weight"
            fullWidth
            defaultValue={weight}
            onBlur={save}
            placeholder="e.g. 25 lb, 15s, bodyweight"
            slotProps={{ inputLabel: { shrink: true } }}
          />
        </Box>

        <Box>
          <FormControlLabel
            control={
              <Checkbox
                name="holdLast"
                value="1"
                defaultChecked={holdLast}
                onChange={save}
              />
            }
            label="Hold the last rep"
          />
          <Typography variant="caption" color="text.secondary" display="block">
            Only kicks in when both Reps and a per-rep Time are set above.
          </Typography>
        </Box>

        <TextField
          name="note"
          label="Note (optional)"
          multiline
          minRows={2}
          fullWidth
          defaultValue={item.note ?? ""}
          onBlur={save}
          helperText="Extra context just for this workout (e.g. 'go heavier today')."
        />

        <SaveStatus />
      </Stack>
    </form>
  );
}
