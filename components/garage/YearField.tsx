"use client";

import * as React from "react";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";

// Years from next year back to 1950 (newest first). Non-freeSolo, so you can
// type to filter or pick from the list, but letters can never be submitted.
const MAX_YEAR = new Date().getFullYear() + 1;
const YEARS = Array.from({ length: MAX_YEAR - 1950 + 1 }, (_, i) =>
  String(MAX_YEAR - i),
);

export default function YearField({
  defaultValue,
}: {
  defaultValue?: number | null;
}) {
  const [value, setValue] = React.useState<string | null>(
    defaultValue != null ? String(defaultValue) : null,
  );

  return (
    <>
      <Autocomplete
        options={YEARS}
        value={value}
        onChange={(_, next) => setValue(next)}
        autoHighlight
        fullWidth
        renderInput={(params) => (
          <TextField {...params} label="Year" placeholder="Select or type…" />
        )}
      />
      {/* The real value the form submits. */}
      <input type="hidden" name="year" value={value ?? ""} readOnly />
    </>
  );
}
