import Link from "next/link";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import SubmitButton from "@/components/shared/SubmitButton";
import NumberField from "@/components/shared/NumberField";
import type { Part } from "@/lib/db/schema";

export default function PartForm({
  action,
  part,
  submitLabel,
  cancelHref,
}: {
  action: (formData: FormData) => void | Promise<void>;
  part?: Part | null;
  submitLabel: string;
  cancelHref: string;
}) {
  const p = part ?? null;

  return (
    <form action={action}>
      <Stack spacing={2.5}>
        <TextField
          name="name"
          label="Part"
          required
          fullWidth
          defaultValue={p?.name ?? ""}
          placeholder="e.g. Oil filter, Front rotors"
        />

        <Box
          sx={{
            display: "grid",
            gap: 2,
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
          }}
        >
          <TextField name="brand" label="Brand" fullWidth defaultValue={p?.brand ?? ""} />
          <TextField
            name="partNumber"
            label="Part number"
            fullWidth
            defaultValue={p?.partNumber ?? ""}
          />
          <TextField
            name="category"
            label="Category"
            fullWidth
            defaultValue={p?.category ?? ""}
            placeholder="e.g. Engine, Suspension"
          />
          <NumberField
            name="cost"
            label="Cost"
            prefix="$"
            decimalScale={2}
            defaultValue={p?.cost}
          />
          <TextField
            name="installedDate"
            label="Installed date"
            type="date"
            fullWidth
            defaultValue={p?.installedDate ?? ""}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField
            name="link"
            label="Link"
            fullWidth
            defaultValue={p?.link ?? ""}
            placeholder="https://…"
          />
        </Box>

        <TextField
          name="notes"
          label="Notes"
          multiline
          minRows={2}
          fullWidth
          defaultValue={p?.notes ?? ""}
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
