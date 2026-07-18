import Link from "next/link";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import SubmitButton from "./SubmitButton";
import { SECTIONS } from "@/lib/workout";
import type { WorkoutItem, Exercise } from "@/lib/db/schema";

// Edit one workout item's per-instance overrides. Blank = inherit the catalog
// default (shown as the placeholder), so a workout can tweak reps/time/weight
// for its own needs without touching the shared exercise.
export default function WorkoutItemForm({
  action,
  item,
  exercise,
  cancelHref,
}: {
  action: (formData: FormData) => void | Promise<void>;
  item: WorkoutItem;
  exercise: Exercise;
  cancelHref: string;
}) {
  const ph = (v: string | number | null | undefined) =>
    v == null || v === "" ? "catalog default" : `default: ${v}`;

  return (
    <form action={action}>
      <Stack spacing={2.5}>
        <Box
          sx={{
            display: "grid",
            gap: 2,
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
          }}
        >
          <TextField
            name="section"
            label="Section"
            select
            fullWidth
            defaultValue={item.section ?? "main"}
            slotProps={{ select: { native: true }, inputLabel: { shrink: true } }}
          >
            {SECTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </TextField>
          <TextField
            name="mode"
            label="Type"
            select
            fullWidth
            defaultValue={item.mode ?? ""}
            slotProps={{ select: { native: true }, inputLabel: { shrink: true } }}
            helperText={`Blank = inherit (${exercise.defaultMode})`}
          >
            <option value="">Use exercise default</option>
            <option value="reps">Reps (tap when done)</option>
            <option value="timed">Timed (countdown)</option>
          </TextField>
        </Box>

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
            defaultValue={item.reps ?? ""}
            placeholder={ph(exercise.defaultReps)}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField
            name="duration"
            label="Duration (seconds)"
            type="number"
            fullWidth
            defaultValue={item.duration ?? ""}
            placeholder={ph(exercise.defaultDuration)}
            slotProps={{ htmlInput: { min: 0, step: 5 }, inputLabel: { shrink: true } }}
          />
          <TextField
            name="weight"
            label="Weight"
            fullWidth
            defaultValue={item.weight ?? ""}
            placeholder={ph(exercise.defaultWeight)}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField
            name="rest"
            label="Rest after (seconds)"
            type="number"
            fullWidth
            defaultValue={item.rest ?? ""}
            placeholder={ph(exercise.defaultRest)}
            slotProps={{ htmlInput: { min: 0, step: 5 }, inputLabel: { shrink: true } }}
          />
        </Box>

        <TextField
          name="note"
          label="Note (optional)"
          multiline
          minRows={2}
          fullWidth
          defaultValue={item.note ?? ""}
          helperText="Extra context just for this workout (e.g. 'go heavier today')."
        />

        <Stack direction="row" spacing={1.5}>
          <SubmitButton variant="contained" size="large" pendingLabel="Saving…">
            Save changes
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
