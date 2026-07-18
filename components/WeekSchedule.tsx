"use client";

import * as React from "react";
import Link from "next/link";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import Chip from "@mui/material/Chip";
import Button from "@mui/material/Button";
import MuiLink from "@mui/material/Link";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import { WEEKDAYS } from "@/lib/workout";

type Assignment = {
  weekday: number;
  workoutId: number;
  workoutName: string;
  rounds: number;
};

// Mon-first display order (JS getDay(): 0=Sun … 6=Sat).
const ORDER = [1, 2, 3, 4, 5, 6, 0];

// Client component so "today" uses the phone's clock, not the server's UTC day.
export default function WeekSchedule({
  assignments,
  profileName,
}: {
  assignments: Assignment[];
  profileName: string;
}) {
  const [today, setToday] = React.useState<number | null>(null);
  React.useEffect(() => setToday(new Date().getDay()), []);

  const byDay = new Map(assignments.map((a) => [a.weekday, a]));
  const todayA = today != null ? (byDay.get(today) ?? null) : null;

  return (
    <Box>
      {/* Today banner (only once we know the client's weekday) */}
      {today != null ? (
        <Paper
          variant="outlined"
          sx={{ p: 2.5, mb: 4, borderColor: "primary.main" }}
        >
          <Typography variant="overline" color="text.secondary">
            Today · {WEEKDAYS[today].label}
          </Typography>
          {todayA ? (
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              spacing={2}
              sx={{ mt: 0.5 }}
            >
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="h6">{todayA.workoutName}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {todayA.rounds > 1
                    ? `${todayA.rounds} rounds`
                    : "Ready when you are."}
                </Typography>
              </Box>
              <Button
                component={Link}
                href={`/workout/${todayA.workoutId}`}
                variant="contained"
                startIcon={<PlayArrowIcon />}
                sx={{ flexShrink: 0 }}
              >
                Start
              </Button>
            </Stack>
          ) : (
            <Typography color="text.secondary" sx={{ mt: 0.5 }}>
              Rest day — nothing scheduled. 💤
            </Typography>
          )}
        </Paper>
      ) : null}

      {/* The week */}
      <Typography variant="h5" component="h2" sx={{ mb: 1.5 }}>
        {profileName}&apos;s week
      </Typography>
      <Stack spacing={1}>
        {ORDER.map((d) => {
          const a = byDay.get(d);
          const isToday = d === today;
          return (
            <Paper
              key={d}
              variant="outlined"
              sx={{
                p: 1.5,
                display: "flex",
                alignItems: "center",
                gap: 2,
                ...(isToday ? { borderColor: "primary.main" } : null),
              }}
            >
              <Typography
                sx={{
                  width: 44,
                  flexShrink: 0,
                  fontWeight: isToday ? 700 : 500,
                  color: isToday ? "primary.main" : "text.secondary",
                }}
              >
                {WEEKDAYS[d].short}
              </Typography>
              {a ? (
                <MuiLink
                  component={Link}
                  href={`/workout/${a.workoutId}`}
                  underline="hover"
                  color="inherit"
                  sx={{ flexGrow: 1, minWidth: 0, fontWeight: 500 }}
                >
                  {a.workoutName}
                </MuiLink>
              ) : (
                <Typography color="text.secondary" sx={{ flexGrow: 1 }}>
                  Rest
                </Typography>
              )}
              {a ? (
                <Chip
                  size="small"
                  icon={<PlayArrowIcon />}
                  label="Start"
                  clickable
                  component={Link}
                  href={`/workout/${a.workoutId}`}
                  color={isToday ? "primary" : "default"}
                  variant={isToday ? "filled" : "outlined"}
                />
              ) : null}
            </Paper>
          );
        })}
      </Stack>
    </Box>
  );
}
