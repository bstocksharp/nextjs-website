"use client";

import * as React from "react";
import { LineChart } from "@mui/x-charts/LineChart";
import Box from "@mui/material/Box";
import { formatMoney, formatMoneyCompact } from "@/lib/format";

// Hydration-safe mount flag (same trick as WeightChart) — the chart skips SSR.
const noopSubscribe = () => () => {};
function useMounted() {
  return React.useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}

// Stable account palette — assigned by row order, readable in both themes.
const PALETTE = [
  "#4f86e0",
  "#4caf7d",
  "#e0864f",
  "#9c6bd4",
  "#d45d7a",
  "#3fa796",
  "#c9a227",
  "#7a8699",
];

export type NetWorthChartAccount = { id: number; name: string };

// The sheet's stacked-area chart: one band per account, the stack's top edge IS
// the net-worth total. Missing balances render as 0 in the stack (an account
// that didn't exist yet contributes nothing) — the history table still shows
// "—" for those months, so nothing is silently invented where it matters.
export default function NetWorthChart({
  months,
  accounts,
  balances,
}: {
  months: string[]; // YYYY-MM-01, ascending (baseline included)
  accounts: NetWorthChartAccount[];
  balances: Record<number, (number | null)[]>;
}) {
  const mounted = useMounted();

  const x = React.useMemo(
    () => months.map((m) => new Date(`${m.slice(0, 7)}-01T12:00:00`)),
    [months],
  );

  const series = accounts.map((a, i) => ({
    id: `acct-${a.id}`,
    label: a.name,
    data: (balances[a.id] ?? []).map((v) => v ?? 0),
    color: PALETTE[i % PALETTE.length],
    area: true,
    stack: "networth",
    showMark: false,
    curve: "monotoneX" as const,
    valueFormatter: (v: number | null) => (v == null || v === 0 ? "—" : formatMoney(v)),
  }));

  return (
    <Box>
      {mounted ? (
        <LineChart
          height={360}
          series={series}
          xAxis={[
            {
              data: x,
              scaleType: "time",
              valueFormatter: (value: Date, ctx: { location: string }) =>
                ctx.location === "tick"
                  ? value.toLocaleDateString("en-US", { month: "short" })
                  : value.toLocaleDateString("en-US", {
                      month: "long",
                      year: "numeric",
                    }),
            },
          ]}
          yAxis={[
            {
              min: 0,
              valueFormatter: (v: number) => formatMoneyCompact(v),
              width: 56,
            },
          ]}
          margin={{ top: 8, right: 12, bottom: 4, left: 4 }}
          sx={{ "& .MuiAreaElement-root": { opacity: 0.55 } }}
        />
      ) : (
        <Box sx={{ height: 360 }} aria-hidden />
      )}
    </Box>
  );
}
