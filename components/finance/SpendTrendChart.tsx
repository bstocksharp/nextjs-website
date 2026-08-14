"use client";

import * as React from "react";
import { LineChart } from "@mui/x-charts/LineChart";
import { useTheme, alpha } from "@mui/material/styles";
import Box from "@mui/material/Box";
import { formatMoney, formatMoneyCompact } from "@/lib/format";

// Hydration-safe "are we on the client yet?" — same idiom as WeightChart, so the
// chart never renders on the server (x-charts measures the DOM).
const noopSubscribe = () => () => {};
function useMounted() {
  return React.useSyncExternalStore(noopSubscribe, () => true, () => false);
}

// The pace picture: cumulative discretionary spend this month (solid, the active
// profile's hue) with last month ghosted behind it, aligned by day-of-month —
// Chase's "how am I doing vs last month" glance. The current line stops at today
// (nulls after), so you read the gap against last month at the same day.
export default function SpendTrendChart({
  days,
  thisMonth,
  lastMonth,
  thisLabel,
  lastLabel,
}: {
  days: number[];
  thisMonth: (number | null)[];
  lastMonth: (number | null)[];
  thisLabel: string;
  lastLabel: string;
}) {
  const theme = useTheme();
  const mounted = useMounted();
  const color = theme.palette.primary.main; // follows the active profile
  const ghost = alpha(theme.palette.text.secondary, 0.55);

  const fmt = (v: number | null) => (v == null ? "" : formatMoney(v));
  const series = [
    {
      id: "lastMonth",
      label: lastLabel,
      data: lastMonth,
      color: ghost,
      showMark: false,
      curve: "linear" as const,
      connectNulls: true,
      valueFormatter: fmt,
    },
    {
      id: "thisMonth",
      label: thisLabel,
      data: thisMonth,
      color,
      showMark: false,
      area: true,
      curve: "linear" as const,
      connectNulls: false,
      valueFormatter: fmt,
    },
  ];

  if (!mounted) return <Box sx={{ height: 220 }} aria-hidden />;

  return (
    <LineChart
      height={220}
      series={series}
      xAxis={[
        {
          data: days,
          scaleType: "point",
          valueFormatter: (v: number, ctx: { location: string }) =>
            ctx.location === "tick" ? `${v}` : `Day ${v}`,
          tickInterval: days.filter((day) => day === 1 || day % 5 === 0),
        },
      ]}
      yAxis={[{ valueFormatter: (v: number) => formatMoneyCompact(v), width: 48 }]}
      margin={{ top: 10, right: 12, bottom: 4, left: 4 }}
      slotProps={{ tooltip: { trigger: "axis" } }}
      sx={{
        "& .MuiLineElement-series-lastMonth": { strokeDasharray: "5 4", strokeWidth: 1.5 },
        "& .MuiLineElement-series-thisMonth": { strokeWidth: 2.5 },
        "& .MuiAreaElement-series-thisMonth": { fillOpacity: 0.12 },
      }}
    />
  );
}
