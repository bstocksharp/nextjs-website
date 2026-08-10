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

/** "23%" / "0.4%" — one decimal under 10% so small accounts don't read as zero. */
const share = (pct: number) => `${pct < 10 ? pct.toFixed(1) : Math.round(pct)}%`;

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

  // The stack total per month — same number as the band's top edge. The tooltip
  // header shows it and every account row shows its share of it, which is the
  // "what's actually carrying the growth" read the sheet never gave.
  const totals = React.useMemo(
    () =>
      months.map((_, i) =>
        accounts.reduce((sum, a) => sum + (balances[a.id]?.[i] ?? 0), 0),
      ),
    [months, accounts, balances],
  );
  // The axis formatter gets a Date, not an index — look the total back up by time.
  const totalByTime = React.useMemo(
    () => new Map(x.map((d, i) => [d.getTime(), totals[i]])),
    [x, totals],
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
    valueFormatter: (v: number | null, ctx: { dataIndex: number }) => {
      if (v == null || v === 0) return "—";
      const total = totals[ctx.dataIndex] ?? 0;
      return total > 0 ? `${formatMoney(v)} · ${share((v / total) * 100)}` : formatMoney(v);
    },
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
              valueFormatter: (value: Date, ctx: { location: string }) => {
                if (ctx.location === "tick") {
                  return value.toLocaleDateString("en-US", { month: "short" });
                }
                const label = value.toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                });
                const total = totalByTime.get(value.getTime());
                return total ? `${label} · ${formatMoney(total)}` : label;
              },
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
