import Link from "@/components/shared/AppLink";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import SubmitButton from "@/components/shared/SubmitButton";
import NumberField from "@/components/shared/NumberField";
import { PHASES, PRIORITIES, STATUSES } from "@/lib/build";
import type { BuildTask } from "@/lib/db/schema";

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export default function BuildTaskForm({
  action,
  task,
  submitLabel,
  cancelHref,
}: {
  action: (formData: FormData) => void | Promise<void>;
  task?: BuildTask | null;
  submitLabel: string;
  cancelHref: string;
}) {
  const t = task ?? null;

  return (
    <form action={action}>
      <Stack spacing={2.5}>
        <TextField
          name="title"
          label="Task"
          required
          fullWidth
          defaultValue={t?.title ?? ""}
          placeholder="e.g. Aluminum radiator, Roll bar, Coilovers"
        />

        <Box
          sx={{
            display: "grid",
            gap: 2,
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
          }}
        >
          <TextField
            name="phase"
            label="Phase"
            select
            fullWidth
            defaultValue={t?.phase != null ? String(t.phase) : ""}
            slotProps={{ select: { native: true }, inputLabel: { shrink: true } }}
          >
            <option value="">General</option>
            {PHASES.map((p) => (
              <option key={p.num} value={String(p.num)}>
                {p.num}. {p.name}
              </option>
            ))}
          </TextField>
          <TextField
            name="priority"
            label="Priority"
            select
            fullWidth
            defaultValue={t?.priority ?? "medium"}
            slotProps={{ select: { native: true }, inputLabel: { shrink: true } }}
          >
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {cap(p)}
              </option>
            ))}
          </TextField>
          <TextField
            name="status"
            label="Status"
            select
            fullWidth
            defaultValue={t?.status ?? "planned"}
            slotProps={{ select: { native: true }, inputLabel: { shrink: true } }}
          >
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </TextField>
          <NumberField
            name="costEstimate"
            label="Est. cost"
            prefix="$"
            decimalScale={2}
            defaultValue={t?.costEstimate}
          />
        </Box>

        <TextField
          name="description"
          label="Description"
          multiline
          minRows={3}
          fullWidth
          defaultValue={t?.description ?? ""}
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
