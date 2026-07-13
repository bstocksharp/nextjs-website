import Link from "next/link";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import SubmitButton from "./SubmitButton";
import NumberField from "./NumberField";
import { PRIORITIES } from "@/lib/build";
import type { WishlistItem } from "@/lib/db/schema";

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export default function WishlistForm({
  action,
  item,
  submitLabel,
  cancelHref,
}: {
  action: (formData: FormData) => void | Promise<void>;
  item?: WishlistItem | null;
  submitLabel: string;
  cancelHref: string;
}) {
  const w = item ?? null;

  return (
    <form action={action}>
      <Stack spacing={2.5}>
        <TextField
          name="item"
          label="Item"
          required
          fullWidth
          defaultValue={w?.item ?? ""}
          placeholder="e.g. Hard Dog roll bar, Flyin' Miata Koni kit"
        />

        <Box
          sx={{
            display: "grid",
            gap: 2,
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
          }}
        >
          <TextField name="brand" label="Brand" fullWidth defaultValue={w?.brand ?? ""} />
          <NumberField
            name="price"
            label="Price"
            prefix="$"
            decimalScale={2}
            defaultValue={w?.price}
          />
          <TextField
            name="priority"
            label="Priority"
            select
            fullWidth
            defaultValue={w?.priority ?? "medium"}
            slotProps={{ select: { native: true }, inputLabel: { shrink: true } }}
          >
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {cap(p)}
              </option>
            ))}
          </TextField>
          <TextField
            name="rating"
            label="Rating"
            select
            fullWidth
            defaultValue={w?.rating != null ? String(w.rating) : ""}
            slotProps={{ select: { native: true }, inputLabel: { shrink: true } }}
          >
            <option value="">—</option>
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={String(n)}>
                {"★".repeat(n)}
              </option>
            ))}
          </TextField>
        </Box>

        <TextField
          name="link"
          label="Link"
          fullWidth
          defaultValue={w?.link ?? ""}
          placeholder="https://…"
        />

        <FormControlLabel
          control={
            <Checkbox name="purchased" defaultChecked={w ? w.purchased : false} />
          }
          label="Already purchased"
        />

        <TextField
          name="notes"
          label="Notes"
          multiline
          minRows={2}
          fullWidth
          defaultValue={w?.notes ?? ""}
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
