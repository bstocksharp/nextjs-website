"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import LinearProgress from "@mui/material/LinearProgress";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import { formatDate } from "@/lib/format";
import type { Projection, WindowKey, WeightStats } from "@/lib/queries/weight";
import WeightChart from "./WeightChart";

const WINDOWS: { key: WindowKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "6mo", label: "6 mo" },
  { key: "3mo", label: "3 mo" },
  { key: "6wk", label: "6 wk" },
];
const WINDOW_LABEL: Record<WindowKey, string> = {
  all: "overall",
  "6mo": "6-mo",
  "3mo": "3-mo",
  "6wk": "6-wk",
};

const signed = (n: number, unit = "") => `${n > 0 ? "+" : ""}${n}${unit}`;

function Tile({
  label,
  value,
  sub,
  color,
  children,
}: {
  label: string;
  value?: string;
  sub?: string;
  color?: string;
  children?: React.ReactNode;
}) {
  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ textTransform: "uppercase", letterSpacing: "0.04em" }}
      >
        {label}
      </Typography>
      {value != null ? (
        <Typography variant="h5" component="div" sx={{ mt: 0.5, color }}>
          {value}
        </Typography>
      ) : null}
      {sub ? (
        <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
          {sub}
        </Typography>
      ) : null}
      {children}
    </Paper>
  );
}

// Diverging meter for the pace buffer: fills right & green when ahead, left &
// amber when behind. Centre = exactly on pace.
function PaceGauge({ buffer }: { buffer: number }) {
  const MAX = 10;
  const clamped = Math.max(-MAX, Math.min(MAX, buffer));
  const pct = (clamped / MAX) * 50;
  const ahead = buffer >= 0;
  return (
    <Box sx={{ mt: 1.5 }}>
      <Box sx={{ position: "relative", height: 10, borderRadius: 5, bgcolor: "action.hover" }}>
        <Box
          sx={{
            position: "absolute",
            left: "50%",
            top: -3,
            bottom: -3,
            width: "2px",
            bgcolor: "divider",
            transform: "translateX(-50%)",
          }}
        />
        <Box
          sx={{
            position: "absolute",
            top: 0,
            bottom: 0,
            borderRadius: 5,
            bgcolor: ahead ? "success.main" : "warning.main",
            left: ahead ? "50%" : `${50 + pct}%`,
            width: `${Math.abs(pct)}%`,
          }}
        />
      </Box>
    </Box>
  );
}

// Owns the timeframe window so the Projected-goal tile (top) and the chart's
// trend line (below) stay in lockstep: flip the toggle and both re-project.
export default function WeightBody({
  stats,
  hasGoal,
  planPace,
  color,
  dates,
  actual,
  target,
  movingAvg,
  trends,
  projections,
}: {
  stats: WeightStats;
  hasGoal: boolean;
  planPace: number | null;
  color: string;
  dates: string[];
  actual: (number | null)[];
  target: (number | null)[];
  movingAvg: (number | null)[];
  trends: Record<WindowKey, (number | null)[]>;
  projections: Record<WindowKey, Projection>;
}) {
  const [win, setWin] = React.useState<WindowKey>("all");
  const proj = projections[win];

  // Projected-goal tile content, driven by the selected window.
  let projValue = "—";
  let projSub: string | undefined;
  let projColor: string | undefined;
  if (hasGoal) {
    if (!proj.enoughData) {
      projValue = "—";
      projSub = "not enough data this window";
    } else if (proj.onTrack && proj.date) {
      projValue = formatDate(proj.date);
      const ahead = proj.vsPlanDays != null && proj.vsPlanDays >= 0;
      projColor = ahead ? "success.main" : "warning.main";
      const vs =
        proj.vsPlanDays != null
          ? ` · ${Math.round(Math.abs(proj.vsPlanDays) / 7)} wk ${ahead ? "ahead" : "behind"}`
          : "";
      projSub = `${WINDOW_LABEL[win]} pace ${proj.paceLbPerWeek}/wk${vs}`;
    } else {
      projValue = "Off pace";
      projColor = "warning.main";
      projSub = "trend not heading to goal";
    }
  }

  return (
    <>
      {/* Six stat boxes */}
      <Box
        sx={{
          display: "grid",
          gap: 1.5,
          gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(3, 1fr)" },
          mb: 3,
        }}
      >
        <Tile
          label="Current"
          value={`${stats.current} lb`}
          sub={`as of ${formatDate(stats.currentDate)}`}
        />
        <Tile
          label="Week over week"
          value={stats.wowAbs == null ? "—" : `${signed(stats.wowAbs)} lb`}
          color={
            stats.wowAbs == null || stats.wowAbs === 0
              ? undefined
              : stats.wowAbs < 0
                ? "success.main"
                : "warning.main"
          }
          sub={stats.wowPct != null ? signed(stats.wowPct, "%") : undefined}
        />
        <Tile
          label="Total lost"
          value={`${stats.totalLost} lb`}
          color={stats.totalLost > 0 ? "success.main" : undefined}
          sub={`${signed(-stats.totalLostPct, "%")} since start`}
        />
        {hasGoal && stats.paceBuffer != null ? (
          <Tile
            label="Pace buffer"
            value={`${Math.abs(stats.paceBuffer)} lb ${stats.paceBuffer >= 0 ? "ahead" : "behind"}`}
            color={stats.paceBuffer >= 0 ? "success.main" : "warning.main"}
          >
            <PaceGauge buffer={stats.paceBuffer} />
          </Tile>
        ) : null}
        {hasGoal && stats.percentToGoal != null ? (
          <Tile label="Progress to goal" value={`${Math.round(stats.percentToGoal)}%`}>
            <LinearProgress
              variant="determinate"
              value={Math.max(0, Math.min(100, stats.percentToGoal))}
              sx={{ mt: 1.5, height: 8, borderRadius: 4 }}
            />
          </Tile>
        ) : null}
        {hasGoal ? (
          <Tile label="Projected goal" value={projValue} sub={projSub} color={projColor} />
        ) : null}
      </Box>

      {/* Chart with the timeframe toggle that drives the projection above */}
      <Paper variant="outlined" sx={{ p: { xs: 1.5, sm: 2.5 } }}>
        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          justifyContent="space-between"
          flexWrap="wrap"
          sx={{ mb: 1.5, px: 1, rowGap: 1 }}
        >
          <Typography variant="h6">Trend</Typography>
          <ToggleButtonGroup
            size="small"
            exclusive
            value={win}
            onChange={(_, v: WindowKey | null) => v && setWin(v)}
            aria-label="Trend timeframe"
          >
            {WINDOWS.map((w) => (
              <ToggleButton key={w.key} value={w.key} sx={{ px: 1.5, py: 0.5 }}>
                {w.label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Stack>

        <WeightChart
          dates={dates}
          actual={actual}
          target={target}
          trend={trends[win]}
          movingAvg={movingAvg}
          color={color}
          hasGoal={hasGoal}
        />
        {hasGoal && planPace != null ? (
          <Typography variant="caption" color="text.secondary" sx={{ px: 1, display: "block", mt: 0.5 }}>
            Plan pace {planPace} lb/wk · trend shows the {WINDOW_LABEL[win]} window
          </Typography>
        ) : null}
      </Paper>
    </>
  );
}
