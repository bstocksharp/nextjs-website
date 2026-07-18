import Link from "next/link";
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Paper from "@mui/material/Paper";
import Alert from "@mui/material/Alert";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AddIcon from "@mui/icons-material/Add";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import TimerOutlinedIcon from "@mui/icons-material/TimerOutlined";
import RepeatOutlinedIcon from "@mui/icons-material/RepeatOutlined";
import { isEditor } from "@/lib/auth";
import { listExercises } from "@/lib/queries/workout";
import { deleteExercise } from "@/app/actions/workout";
import { CATEGORIES, categoryLabel, formatDuration } from "@/lib/workout";
import type { Exercise } from "@/lib/db/schema";
import DeleteIconButton from "@/components/DeleteIconButton";

export const metadata = { title: "Catalog — Workout" };

function summary(e: Exercise): string {
  if (e.defaultMode === "timed") {
    return e.defaultDuration != null ? formatDuration(e.defaultDuration) : "";
  }
  return e.defaultReps ?? "";
}

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ blocked?: string; uses?: string }>;
}) {
  const [exercises, editor, sp] = await Promise.all([
    listExercises(),
    isEditor(),
    searchParams,
  ]);

  // Group by category, in the canonical CATEGORIES order (unknowns last).
  const order = new Map<string, number>(CATEGORIES.map((c, i) => [c.value, i]));
  const groups = [...exercises].reduce<Record<string, Exercise[]>>((acc, e) => {
    const key = e.category ?? "other";
    (acc[key] ??= []).push(e);
    return acc;
  }, {});
  const groupKeys = Object.keys(groups).sort(
    (a, b) => (order.get(a) ?? 99) - (order.get(b) ?? 99),
  );

  const blocked = sp.blocked
    ? exercises.find((e) => String(e.id) === sp.blocked)
    : null;

  return (
    <Container maxWidth="md" sx={{ py: { xs: 4, md: 6 } }}>
      <Button
        component={Link}
        href="/workout"
        startIcon={<ArrowBackIcon />}
        sx={{ mb: 2 }}
      >
        Back
      </Button>

      <Stack
        direction="row"
        alignItems="flex-start"
        justifyContent="space-between"
        spacing={2}
        sx={{ mb: 4 }}
      >
        <Stack spacing={1}>
          <Typography variant="h3" component="h1">
            Exercise catalog
          </Typography>
          <Typography variant="h6" component="p" color="text.secondary" fontWeight={400}>
            The building blocks for your workouts — {exercises.length} exercises.
          </Typography>
        </Stack>
        {editor ? (
          <Button
            component={Link}
            href="/workout/catalog/new"
            variant="contained"
            startIcon={<AddIcon />}
            sx={{ flexShrink: 0 }}
          >
            Add
          </Button>
        ) : null}
      </Stack>

      {blocked ? (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Couldn&apos;t delete <strong>{blocked.name}</strong> — it&apos;s used in{" "}
          {sp.uses} workout{sp.uses === "1" ? "" : "s"}. Remove it from those
          first.
        </Alert>
      ) : null}

      <Stack spacing={4}>
        {groupKeys.map((key) => (
          <Box key={key}>
            <Typography variant="h5" component="h2" sx={{ mb: 1.5 }}>
              {categoryLabel(key)}
            </Typography>
            <Stack spacing={1.5}>
              {groups[key].map((e) => (
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
                        <Chip
                          size="small"
                          variant="outlined"
                          icon={
                            e.defaultMode === "timed" ? (
                              <TimerOutlinedIcon />
                            ) : (
                              <RepeatOutlinedIcon />
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
                        <Typography variant="body2">{e.description}</Typography>
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
    </Container>
  );
}
