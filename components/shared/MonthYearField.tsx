"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/**
 * Month + Year dropdowns over a "YYYY-MM" value — no free-form text and no
 * native `type="month"` (which renders differently in every browser and hides
 * the year behind a spinner on mobile). Pass `name` to also emit the hidden
 * input that carries the value into a server action's FormData.
 */
export default function MonthYearField({
  value,
  onChange,
  years,
  name,
  monthLabel = "Month",
  yearLabel = "Year",
}: {
  /** "YYYY-MM". */
  value: string;
  onChange: (next: string) => void;
  /** Selectable years, in display order. */
  years: number[];
  /** When set, the value is also submitted as a hidden form field. */
  name?: string;
  monthLabel?: string;
  yearLabel?: string;
}) {
  const [yearStr, monthStr] = value.split("-");

  return (
    <>
      {name ? <input type="hidden" name={name} value={value} readOnly /> : null}
      <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: "1fr 1fr" }}>
        <TextField
          label={monthLabel}
          select
          value={monthStr}
          onChange={(e) => onChange(`${yearStr}-${e.target.value}`)}
        >
          {MONTHS.map((label, i) => (
            <MenuItem key={label} value={String(i + 1).padStart(2, "0")}>
              {label}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          label={yearLabel}
          select
          value={yearStr}
          onChange={(e) => onChange(`${e.target.value}-${monthStr}`)}
        >
          {years.map((y) => (
            <MenuItem key={y} value={String(y)}>
              {y}
            </MenuItem>
          ))}
        </TextField>
      </Box>
    </>
  );
}
