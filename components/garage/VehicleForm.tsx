import Link from "next/link";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import SubmitButton from "@/components/shared/SubmitButton";
import YearField from "@/components/garage/YearField";
import NumberField from "@/components/shared/NumberField";
import type { Vehicle } from "@/lib/db/schema";

const STATUS_OPTIONS: [string, string][] = [
  ["owned", "Owned"],
  ["prospect", "Prospect (considering)"],
  ["dream", "Dream (future build)"],
  ["sold", "Sold"],
];

export default function VehicleForm({
  action,
  vehicle,
  submitLabel,
  cancelHref,
}: {
  action: (formData: FormData) => void | Promise<void>;
  vehicle?: Vehicle | null;
  submitLabel: string;
  cancelHref: string;
}) {
  const v = vehicle ?? null;

  return (
    <form action={action}>
      <Stack spacing={2.5}>
        <TextField
          name="name"
          label="Name"
          required
          fullWidth
          defaultValue={v?.name ?? ""}
          placeholder="e.g. Project Roadster, Daily Truck"
        />

        <Box
          sx={{
            display: "grid",
            gap: 2,
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
          }}
        >
          <TextField
            name="status"
            label="Status"
            select
            fullWidth
            defaultValue={v?.status ?? "owned"}
            slotProps={{ select: { native: true } }}
          >
            {STATUS_OPTIONS.map(([val, label]) => (
              <option key={val} value={val}>
                {label}
              </option>
            ))}
          </TextField>
          <YearField defaultValue={v?.year} />
          <TextField name="make" label="Make" fullWidth defaultValue={v?.make ?? ""} />
          <TextField name="model" label="Model" fullWidth defaultValue={v?.model ?? ""} />
          <TextField name="trim" label="Trim" fullWidth defaultValue={v?.trim ?? ""} />
          <TextField
            name="transmission"
            label="Transmission"
            fullWidth
            defaultValue={v?.transmission ?? ""}
          />
          <TextField
            name="color"
            label="Exterior color"
            fullWidth
            defaultValue={v?.color ?? ""}
          />
          <TextField
            name="interiorColor"
            label="Interior color"
            fullWidth
            defaultValue={v?.interiorColor ?? ""}
          />
          <NumberField
            name="currentMileage"
            label="Current mileage"
            defaultValue={v?.currentMileage}
          />
          <TextField name="vin" label="VIN" fullWidth defaultValue={v?.vin ?? ""} />
          <TextField
            name="licensePlate"
            label="License plate"
            fullWidth
            defaultValue={v?.licensePlate ?? ""}
          />
          <TextField
            name="purchaseDate"
            label="Purchase date"
            type="date"
            fullWidth
            defaultValue={v?.purchaseDate ?? ""}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <NumberField
            name="purchasePrice"
            label="Purchase price"
            prefix="$"
            decimalScale={2}
            defaultValue={v?.purchasePrice}
          />
          <NumberField
            name="purchaseMileage"
            label="Purchase mileage"
            defaultValue={v?.purchaseMileage}
          />
        </Box>

        <TextField
          name="notes"
          label="Notes"
          multiline
          minRows={3}
          fullWidth
          defaultValue={v?.notes ?? ""}
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
