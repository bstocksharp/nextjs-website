import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import SubmitButton from "./SubmitButton";
import AddIcon from "@mui/icons-material/Add";
import { CATEGORIES, categoryLabel } from "@/lib/workout";
import type { Exercise } from "@/lib/db/schema";

// A per-section "add an exercise from the catalog" form. The chosen exercise is
// appended to this section with the catalog's default reps/time (overridable
// afterwards via the item editor).
export default function AddExerciseControl({
  action,
  section,
  exercises,
}: {
  action: (formData: FormData) => void | Promise<void>;
  section: string;
  exercises: Exercise[];
}) {
  // Group by category in the canonical order for a tidy dropdown.
  const order = new Map<string, number>(CATEGORIES.map((c, i) => [c.value, i]));
  const groups = exercises.reduce<Record<string, Exercise[]>>((acc, e) => {
    (acc[e.category ?? "other"] ??= []).push(e);
    return acc;
  }, {});
  const keys = Object.keys(groups).sort(
    (a, b) => (order.get(a) ?? 99) - (order.get(b) ?? 99),
  );

  return (
    <form action={action}>
      <input type="hidden" name="section" value={section} />
      <Stack direction="row" spacing={1} alignItems="center">
        <TextField
          name="exerciseId"
          label="Add exercise"
          select
          size="small"
          defaultValue=""
          sx={{ flexGrow: 1, minWidth: 0 }}
          slotProps={{ select: { native: true }, inputLabel: { shrink: true } }}
        >
          <option value="" disabled>
            Choose…
          </option>
          {keys.map((k) => (
            <optgroup key={k} label={categoryLabel(k)}>
              {groups[k].map((e) => (
                <option key={e.id} value={String(e.id)}>
                  {e.name}
                </option>
              ))}
            </optgroup>
          ))}
        </TextField>
        <SubmitButton variant="outlined" startIcon={<AddIcon />} pendingLabel="Adding…">
          Add
        </SubmitButton>
      </Stack>
    </form>
  );
}
