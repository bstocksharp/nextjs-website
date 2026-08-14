"use client";

import * as React from "react";
import { useRouter, usePathname } from "next/navigation";
import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import MenuItem from "@mui/material/MenuItem";
import Button from "@mui/material/Button";
import SearchIcon from "@mui/icons-material/Search";

export type RawFilters = {
  q: string;
  min: string;
  max: string;
  range: string;
  from: string;
  to: string;
};

const RANGES = [
  { value: "all", label: "All time" },
  { value: "year", label: "This year" },
  { value: "12mo", label: "Past 12 months" },
  { value: "custom", label: "Custom range" },
];

// Builds the URL from a full set of values — the URL is the source of truth
// (bookmarkable/shareable), and the server re-renders the first page on change.
function buildUrl(pathname: string, v: RawFilters): string {
  const p = new URLSearchParams();
  if (v.q) p.set("q", v.q);
  if (v.min) p.set("min", v.min);
  if (v.max) p.set("max", v.max);
  if (v.range && v.range !== "all") p.set("range", v.range);
  if (v.range === "custom") {
    if (v.from) p.set("from", v.from);
    if (v.to) p.set("to", v.to);
  }
  const qs = p.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}

export default function TxnFilterBar({ raw }: { raw: RawFilters }) {
  const router = useRouter();
  const pathname = usePathname();

  const [q, setQ] = React.useState(raw.q);
  const [min, setMin] = React.useState(raw.min);
  const [max, setMax] = React.useState(raw.max);
  const [range, setRange] = React.useState(raw.range || "all");
  const [from, setFrom] = React.useState(raw.from);
  const [to, setTo] = React.useState(raw.to);

  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // `immediate` for discrete controls (range/date/clear); debounced for the
  // free-text and amount fields so we don't navigate on every keystroke.
  const commit = React.useCallback(
    (v: RawFilters, immediate = false) => {
      if (timer.current) clearTimeout(timer.current);
      const run = () => router.push(buildUrl(pathname, v));
      if (immediate) run();
      else timer.current = setTimeout(run, 450);
    },
    [router, pathname],
  );

  const vals = (over: Partial<RawFilters>): RawFilters => ({
    q,
    min,
    max,
    range,
    from,
    to,
    ...over,
  });

  const clearAll = () => {
    setQ("");
    setMin("");
    setMax("");
    setRange("all");
    setFrom("");
    setTo("");
    if (timer.current) clearTimeout(timer.current);
    router.push(pathname);
  };

  const hasAny = q || min || max || (range && range !== "all");

  return (
    <Paper variant="outlined" sx={{ p: { xs: 1.5, sm: 2 }, mb: 2 }}>
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: 1.5,
          alignItems: "center",
        }}
      >
        <TextField
          size="small"
          label="Search merchant"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            commit(vals({ q: e.target.value }));
          }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
          sx={{ flex: "1 1 200px", minWidth: 180 }}
        />

        <TextField
          size="small"
          label="Min"
          value={min}
          onChange={(e) => {
            setMin(e.target.value);
            commit(vals({ min: e.target.value }));
          }}
          inputMode="decimal"
          slotProps={{
            input: {
              startAdornment: <InputAdornment position="start">$</InputAdornment>,
            },
          }}
          sx={{ width: 110 }}
        />
        <TextField
          size="small"
          label="Max"
          value={max}
          onChange={(e) => {
            setMax(e.target.value);
            commit(vals({ max: e.target.value }));
          }}
          inputMode="decimal"
          slotProps={{
            input: {
              startAdornment: <InputAdornment position="start">$</InputAdornment>,
            },
          }}
          sx={{ width: 110 }}
        />

        <TextField
          size="small"
          select
          label="When"
          value={range}
          onChange={(e) => {
            setRange(e.target.value);
            commit(vals({ range: e.target.value }), true);
          }}
          sx={{ width: 160 }}
        >
          {RANGES.map((r) => (
            <MenuItem key={r.value} value={r.value}>
              {r.label}
            </MenuItem>
          ))}
        </TextField>

        {range === "custom" ? (
          <>
            <TextField
              size="small"
              type="date"
              label="From"
              value={from}
              onChange={(e) => {
                setFrom(e.target.value);
                commit(vals({ from: e.target.value }), true);
              }}
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{ width: 160 }}
            />
            <TextField
              size="small"
              type="date"
              label="To"
              value={to}
              onChange={(e) => {
                setTo(e.target.value);
                commit(vals({ to: e.target.value }), true);
              }}
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{ width: 160 }}
            />
          </>
        ) : null}

        {hasAny ? (
          <Button size="small" color="inherit" onClick={clearAll}>
            Clear
          </Button>
        ) : null}
      </Box>
    </Paper>
  );
}
