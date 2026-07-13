"use client";

import * as React from "react";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";

// Common services as presets. Merged with the services you've already logged
// (passed in via `options`) so the dropdown grows as you use it. freeSolo, so
// you can also just type a brand-new one.
const COMMON_SERVICES = [
  "Oil change",
  "Tire rotation",
  "Tires (replace)",
  "Brake pads",
  "Brake fluid flush",
  "Coolant flush",
  "Air filter",
  "Cabin air filter",
  "Spark plugs",
  "Transmission fluid",
  "Differential fluid",
  "Battery",
  "Alignment",
  "Timing belt",
  "Water pump",
  "Clutch",
  "Serpentine belt",
  "Wiper blades",
  "State inspection",
  "Detail / wash",
];

export default function ServiceField({
  defaultValue,
  options = [],
}: {
  defaultValue?: string | null;
  options?: string[];
}) {
  const [value, setValue] = React.useState<string>(defaultValue ?? "");

  // Your logged services first, then the presets, de-duplicated.
  const merged = React.useMemo(
    () => Array.from(new Set([...options, ...COMMON_SERVICES])),
    [options],
  );

  return (
    <>
      <Autocomplete
        freeSolo
        options={merged}
        inputValue={value}
        onInputChange={(_, next) => setValue(next)}
        fullWidth
        renderInput={(params) => (
          <TextField
            {...params}
            label="Service"
            required
            placeholder="e.g. Oil change"
          />
        )}
      />
      <input type="hidden" name="serviceType" value={value} readOnly />
    </>
  );
}
