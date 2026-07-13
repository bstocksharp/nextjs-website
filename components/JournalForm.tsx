import Link from "next/link";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import SubmitButton from "./SubmitButton";
import NumberField from "./NumberField";
import type { JournalEntry } from "@/lib/db/schema";

export default function JournalForm({
  action,
  entry,
  submitLabel,
  cancelHref,
}: {
  action: (formData: FormData) => void | Promise<void>;
  entry?: JournalEntry | null;
  submitLabel: string;
  cancelHref: string;
}) {
  const e = entry ?? null;
  const today = new Date().toISOString().slice(0, 10);

  return (
    <form action={action}>
      <Stack spacing={2.5}>
        <TextField
          name="title"
          label="Title (optional)"
          fullWidth
          defaultValue={e?.title ?? ""}
          placeholder="e.g. Coolant hose swap"
        />

        <Box
          sx={{
            display: "grid",
            gap: 2,
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
          }}
        >
          <TextField
            name="entryDate"
            label="Date"
            type="date"
            required
            fullWidth
            defaultValue={e?.entryDate ?? today}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <NumberField name="mileage" label="Mileage" defaultValue={e?.mileage} />
        </Box>

        <TextField
          name="body"
          label="Entry"
          required
          multiline
          minRows={6}
          fullWidth
          defaultValue={e?.body ?? ""}
          placeholder="What you did, how it went, what's next…"
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
