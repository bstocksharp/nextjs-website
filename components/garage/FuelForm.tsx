import Link from "next/link";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import SubmitButton from "@/components/shared/SubmitButton";
import NumberField from "@/components/shared/NumberField";
import type { FuelLog } from "@/lib/db/schema";

export default function FuelForm({
  action,
  log,
  submitLabel,
  cancelHref,
}: {
  action: (formData: FormData) => void | Promise<void>;
  log?: FuelLog | null;
  submitLabel: string;
  cancelHref: string;
}) {
  const f = log ?? null;

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
            name="fillDate"
            label="Date"
            type="date"
            required
            fullWidth
            defaultValue={f?.fillDate ?? ""}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <NumberField name="odometer" label="Odometer" defaultValue={f?.odometer} />
          <NumberField
            name="gallons"
            label="Gallons"
            decimalScale={3}
            defaultValue={f?.gallons}
          />
          <NumberField
            name="pricePerGallon"
            label="Price / gallon"
            prefix="$"
            decimalScale={3}
            defaultValue={f?.pricePerGallon}
          />
          <NumberField
            name="totalCost"
            label="Total cost"
            prefix="$"
            decimalScale={2}
            defaultValue={f?.totalCost}
          />
        </Box>

        <FormControlLabel
          control={
            <Checkbox
              name="isFullTank"
              defaultChecked={f ? f.isFullTank : true}
            />
          }
          label="Filled the tank (needed to compute MPG)"
        />

        <TextField
          name="notes"
          label="Notes"
          multiline
          minRows={2}
          fullWidth
          defaultValue={f?.notes ?? ""}
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
