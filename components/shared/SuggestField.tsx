"use client";

import * as React from "react";
import Autocomplete, { createFilterOptions } from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";

// Only ever surface a handful of matches for what's typed, so a long history
// (hundreds of past merchants) never becomes a giant scrolling menu.
const filter = createFilterOptions<string>({ trim: true, limit: 8 });

/**
 * A free-text field with type-ahead suggestions drawn from values used before
 * (past merchants, income sources). freeSolo → you can always type a brand-new
 * one; the dropdown only shows up to 8 matches for what you've typed. The raw
 * text is submitted via a hidden input, so it drops into a normal <form>.
 */
export default function SuggestField({
  name,
  label,
  options,
  defaultValue = "",
  placeholder,
  autoFocus = false,
}: {
  name: string;
  label: string;
  options: string[];
  defaultValue?: string;
  placeholder?: string;
  autoFocus?: boolean;
}) {
  const [value, setValue] = React.useState(defaultValue);
  return (
    <>
      <Autocomplete
        freeSolo
        selectOnFocus
        handleHomeEndKeys
        options={options}
        inputValue={value}
        onInputChange={(_, v) => setValue(v)}
        filterOptions={filter}
        renderInput={(params) => (
          <TextField {...params} label={label} placeholder={placeholder} autoFocus={autoFocus} />
        )}
      />
      <input type="hidden" name={name} value={value} readOnly />
    </>
  );
}
