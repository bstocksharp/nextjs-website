"use client";

import { useState } from "react";
import Link from "next/link";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import SubmitButton from "./SubmitButton";
import { CATEGORIES, MODES } from "@/lib/workout";
import type { Exercise } from "@/lib/db/schema";

export default function ExerciseForm({
  action,
  exercise,
  submitLabel,
  cancelHref,
}: {
  action: (formData: FormData) => void | Promise<void>;
  exercise?: Exercise | null;
  submitLabel: string;
  cancelHref: string;
}) {
  const e = exercise ?? null;

  // Reps vs. Duration are mutually exclusive — one per mode. Track the selected
  // type so we only show (and submit) the field that applies. The hidden field
  // isn't in the form, so switching modes clears the other value on save.
  const [mode, setMode] = useState<string>(e?.defaultMode ?? "reps");
  const timed = mode === "timed";

  return (
    <form action={action}>
      <Stack spacing={2.5}>
        <TextField
          name="name"
          label="Exercise name"
          required
          fullWidth
          defaultValue={e?.name ?? ""}
          placeholder="e.g. Goblet Squats"
        />

        <Box
          sx={{
            display: "grid",
            gap: 2,
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
          }}
        >
          <TextField
            name="category"
            label="Category"
            select
            fullWidth
            defaultValue={e?.category ?? ""}
            slotProps={{ select: { native: true }, inputLabel: { shrink: true } }}
          >
            <option value="">Uncategorized</option>
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </TextField>
          <TextField
            name="defaultMode"
            label="Type"
            select
            fullWidth
            value={mode}
            onChange={(ev) => setMode(ev.target.value)}
            slotProps={{ select: { native: true }, inputLabel: { shrink: true } }}
            helperText="Reps = tap when done · Timed = countdown"
          >
            {MODES.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </TextField>
        </Box>

        <Box
          sx={{
            display: "grid",
            gap: 2,
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
          }}
        >
          {timed ? (
            <TextField
              name="defaultDuration"
              label="Duration"
              type="number"
              fullWidth
              defaultValue={e?.defaultDuration ?? ""}
              slotProps={{ htmlInput: { min: 0, step: 5 } }}
              helperText="Seconds — e.g. 60 = 1 min, 300 = 5 min"
            />
          ) : (
            <TextField
              name="defaultReps"
              label="Reps"
              fullWidth
              defaultValue={e?.defaultReps ?? ""}
              placeholder="e.g. 10-12, 8 each leg"
            />
          )}
          <TextField
            name="defaultWeight"
            label="Weight"
            fullWidth
            defaultValue={e?.defaultWeight ?? ""}
            placeholder="e.g. 25 lb, 15s, bodyweight"
          />
          <TextField
            name="defaultRest"
            label="Rest after"
            type="number"
            fullWidth
            defaultValue={e?.defaultRest ?? ""}
            slotProps={{ htmlInput: { min: 0, step: 5 } }}
            helperText="Seconds of rest after this exercise"
          />
        </Box>

        <TextField
          name="description"
          label="Description (how to do it)"
          multiline
          minRows={2}
          fullWidth
          defaultValue={e?.description ?? ""}
          helperText="Shown behind the ⓘ during a workout."
        />

        <TextField
          name="tips"
          label="Tips (one per line)"
          multiline
          minRows={3}
          fullWidth
          defaultValue={e?.tips ?? ""}
          helperText="One tip per line — the live workout shows a random one."
        />

        <Stack direction="row" spacing={1.5}>
          <SubmitButton variant="contained" size="large" pendingLabel="Saving…">
            {submitLabel}
          </SubmitButton>
          <Button
            component={Link}
            href={cancelHref}
            variant="text"
            size="large"
            color="inherit"
          >
            Cancel
          </Button>
        </Stack>
      </Stack>
    </form>
  );
}
