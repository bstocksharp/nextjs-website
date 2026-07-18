import Link from "next/link";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import SubmitButton from "./SubmitButton";
import type { Workout, WorkoutProfile } from "@/lib/db/schema";

export default function WorkoutMetaForm({
  action,
  workout,
  profiles,
  defaultProfileId,
  submitLabel,
  cancelHref,
}: {
  action: (formData: FormData) => void | Promise<void>;
  workout?: Workout | null;
  profiles: WorkoutProfile[];
  defaultProfileId?: number;
  submitLabel: string;
  cancelHref: string;
}) {
  const w = workout ?? null;

  return (
    <form action={action}>
      <Stack spacing={2.5}>
        <TextField
          name="name"
          label="Workout name"
          required
          fullWidth
          defaultValue={w?.name ?? ""}
          placeholder="e.g. Push + Legs"
        />

        <Box
          sx={{
            display: "grid",
            gap: 2,
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
          }}
        >
          <TextField
            name="createdByProfileId"
            label="Saved by"
            select
            fullWidth
            defaultValue={String(w?.createdByProfileId ?? defaultProfileId ?? "")}
            slotProps={{ select: { native: true }, inputLabel: { shrink: true } }}
          >
            {profiles.map((p) => (
              <option key={p.id} value={String(p.id)}>
                {p.name}
              </option>
            ))}
          </TextField>
          <TextField
            name="rounds"
            label="Main rounds"
            type="number"
            fullWidth
            defaultValue={w?.rounds ?? 3}
            slotProps={{ htmlInput: { min: 1, step: 1 } }}
            helperText="Times to rotate the Main circuit"
          />
        </Box>

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
