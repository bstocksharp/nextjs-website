"use client";

import * as React from "react";
import Link from "next/link";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import SearchIcon from "@mui/icons-material/Search";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import TimerOutlinedIcon from "@mui/icons-material/TimerOutlined";
import RepeatOutlinedIcon from "@mui/icons-material/RepeatOutlined";
import { CATEGORIES, categoryLabel, formatDuration } from "@/lib/workout";
import { deleteExercise } from "@/app/actions/workout";
import DeleteIconButton from "@/components/shared/DeleteIconButton";
import Pill from "@/components/shared/Pill";
import type { Exercise } from "@/lib/db/schema";

// Reps only → "10-12". Reps + per-rep time → "10 × 5s". Time only → "45s".
function summary(e: Exercise): string {
  if (e.defaultReps) {
    return e.defaultDuration != null
      ? `${e.defaultReps} × ${formatDuration(e.defaultDuration)}`
      : e.defaultReps;
  }
  return e.defaultDuration != null ? formatDuration(e.defaultDuration) : "";
}

export default function CatalogList({
  exercises,
  editor,
}: {
  exercises: Exercise[];
  editor: boolean;
}) {
  const [q, setQ] = React.useState("");
  const query = q.trim().toLowerCase();
  const filtered = query
    ? exercises.filter(
        (e) =>
          e.name.toLowerCase().includes(query) ||
          categoryLabel(e.category).toLowerCase().includes(query) ||
          (e.description ?? "").toLowerCase().includes(query),
      )
    : exercises;

  // Group by category in canonical order (unknowns last).
  const order = new Map<string, number>(CATEGORIES.map((c, i) => [c.value, i]));
  const groups = filtered.reduce<Record<string, Exercise[]>>((acc, e) => {
    (acc[e.category ?? "other"] ??= []).push(e);
    return acc;
  }, {});
  const keys = Object.keys(groups).sort(
    (a, b) => (order.get(a) ?? 99) - (order.get(b) ?? 99),
  );

  return (
    <>
      <TextField
        placeholder="Search exercises…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        fullWidth
        size="small"
        sx={{ mb: 3 }}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          },
        }}
      />

      {filtered.length === 0 ? (
        <Typography color="text.secondary">
          No exercises match “{q}”.
        </Typography>
      ) : (
        <Stack spacing={4}>
          {keys.map((k) => (
            <Box key={k}>
              <Typography variant="h5" component="h2" sx={{ mb: 1.5 }}>
                {categoryLabel(k)}
              </Typography>
              <Stack spacing={1.5}>
                {groups[k].map((e) => (
                  <Paper key={e.id} variant="outlined" sx={{ p: 2 }}>
                    <Stack direction="row" spacing={1} alignItems="flex-start">
                      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                        <Stack
                          direction="row"
                          spacing={1}
                          alignItems="center"
                          flexWrap="wrap"
                          sx={{ mb: e.description ? 0.5 : 0 }}
                        >
                          <Typography variant="subtitle1" fontWeight={600}>
                            {e.name}
                          </Typography>
                          <Pill
                            icon={
                              e.defaultReps ? (
                                <RepeatOutlinedIcon />
                              ) : (
                                <TimerOutlinedIcon />
                              )
                            }
                            label={summary(e)}
                          />
                          {e.defaultWeight ? (
                            <Typography variant="body2" color="text.secondary">
                              {e.defaultWeight}
                            </Typography>
                          ) : null}
                        </Stack>
                        {e.description ? (
                          <Typography variant="body2">
                            {e.description}
                          </Typography>
                        ) : null}
                      </Box>

                      {editor ? (
                        <Stack direction="row" spacing={0.25} sx={{ flexShrink: 0 }}>
                          <Tooltip title="Edit">
                            <IconButton
                              component={Link}
                              href={`/workout/catalog/${e.id}/edit`}
                              size="small"
                              aria-label={`Edit ${e.name}`}
                            >
                              <EditOutlinedIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <DeleteIconButton
                            action={deleteExercise.bind(null, e.id)}
                            confirmMessage={`Delete "${e.name}" from the catalog?`}
                            label={`Delete ${e.name}`}
                          />
                        </Stack>
                      ) : null}
                    </Stack>
                  </Paper>
                ))}
              </Stack>
            </Box>
          ))}
        </Stack>
      )}
    </>
  );
}
