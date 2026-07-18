import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import Divider from "@mui/material/Divider";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import TimerOutlinedIcon from "@mui/icons-material/TimerOutlined";
import RepeatOutlinedIcon from "@mui/icons-material/RepeatOutlined";
import LoopIcon from "@mui/icons-material/Loop";
import { isEditor } from "@/lib/auth";
import {
  getWorkoutWithItems,
  listProfiles,
  listExercises,
} from "@/lib/queries/workout";
import {
  updateWorkout,
  deleteWorkout,
  addWorkoutItem,
  removeWorkoutItem,
  moveWorkoutItem,
} from "@/app/actions/workout";
import { formatTarget, groupBySection, SECTIONS } from "@/lib/workout";
import WorkoutMetaForm from "@/components/WorkoutMetaForm";
import AddExerciseControl from "@/components/AddExerciseControl";
import DeleteIconButton from "@/components/DeleteIconButton";

export const metadata = { title: "Edit workout — Workout" };

export default async function WorkoutBuilderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!(await isEditor())) redirect("/unlock");

  const { id } = await params;
  const workoutId = Number(id);
  if (!Number.isInteger(workoutId)) notFound();

  const [data, profiles, catalog] = await Promise.all([
    getWorkoutWithItems(workoutId),
    listProfiles(),
    listExercises(),
  ]);
  if (!data) notFound();

  const { workout, items } = data;
  const bySection = groupBySection(items);

  return (
    <Container maxWidth="md" sx={{ py: { xs: 4, md: 6 } }}>
      <Button
        component={Link}
        href={`/workout/${workoutId}`}
        startIcon={<ArrowBackIcon />}
        sx={{ mb: 2 }}
      >
        View workout
      </Button>

      <Typography variant="h4" component="h1" sx={{ mb: 3 }}>
        Edit workout
      </Typography>

      <Paper variant="outlined" sx={{ p: { xs: 2.5, md: 3 }, mb: 4 }}>
        <WorkoutMetaForm
          action={updateWorkout.bind(null, workoutId)}
          workout={workout}
          profiles={profiles}
          submitLabel="Save details"
          cancelHref={`/workout/${workoutId}`}
        />
      </Paper>

      <Stack spacing={4}>
        {SECTIONS.map((s) => {
          const sectionItems = bySection[s.value];
          const isCircuit = s.value === "main" && workout.rounds > 1;
          return (
            <Box key={s.value}>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
                <Typography variant="h5" component="h2">
                  {s.label}
                </Typography>
                {isCircuit ? (
                  <Chip
                    color="primary"
                    size="small"
                    icon={<LoopIcon />}
                    label={`${workout.rounds} rounds`}
                  />
                ) : null}
              </Stack>

              <Stack spacing={1} sx={{ mb: 1.5 }}>
                {sectionItems.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    Nothing here yet.
                  </Typography>
                ) : (
                  sectionItems.map((it, i) => (
                    <Paper key={it.itemId} variant="outlined" sx={{ p: 1.5 }}>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        {/* Reorder within section */}
                        <Stack sx={{ flexShrink: 0 }}>
                          <form action={moveWorkoutItem.bind(null, it.itemId, workoutId, "up")}>
                            <IconButton
                              type="submit"
                              size="small"
                              aria-label="Move up"
                              disabled={i === 0}
                              sx={{ p: 0.25 }}
                            >
                              <ArrowUpwardIcon fontSize="small" />
                            </IconButton>
                          </form>
                          <form action={moveWorkoutItem.bind(null, it.itemId, workoutId, "down")}>
                            <IconButton
                              type="submit"
                              size="small"
                              aria-label="Move down"
                              disabled={i === sectionItems.length - 1}
                              sx={{ p: 0.25 }}
                            >
                              <ArrowDownwardIcon fontSize="small" />
                            </IconButton>
                          </form>
                        </Stack>

                        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                            <Typography variant="body1" fontWeight={600}>
                              {it.name}
                            </Typography>
                            <Chip
                              size="small"
                              variant="outlined"
                              icon={
                                it.mode === "timed" ? (
                                  <TimerOutlinedIcon />
                                ) : (
                                  <RepeatOutlinedIcon />
                                )
                              }
                              label={formatTarget(it)}
                            />
                            {it.weight ? (
                              <Typography variant="body2" color="text.secondary">
                                {it.weight}
                              </Typography>
                            ) : null}
                          </Stack>
                          {it.note ? (
                            <Typography variant="body2" color="text.secondary">
                              {it.note}
                            </Typography>
                          ) : null}
                        </Box>

                        <IconButton
                          component={Link}
                          href={`/workout/${workoutId}/items/${it.itemId}/edit`}
                          size="small"
                          aria-label={`Edit ${it.name}`}
                          sx={{ flexShrink: 0 }}
                        >
                          <EditOutlinedIcon fontSize="small" />
                        </IconButton>
                        <DeleteIconButton
                          action={removeWorkoutItem.bind(null, it.itemId, workoutId)}
                          confirmMessage={`Remove ${it.name} from this workout?`}
                          label={`Remove ${it.name}`}
                        />
                      </Stack>
                    </Paper>
                  ))
                )}
              </Stack>

              <AddExerciseControl
                action={addWorkoutItem.bind(null, workoutId)}
                section={s.value}
                exercises={catalog}
              />
            </Box>
          );
        })}
      </Stack>

      <Divider sx={{ my: 4 }} />

      <Stack direction="row" alignItems="center" spacing={1}>
        <DeleteIconButton
          action={deleteWorkout.bind(null, workoutId)}
          confirmMessage={`Delete the workout "${workout.name}"? This can't be undone.`}
          label="Delete workout"
        />
        <Typography variant="body2" color="text.secondary">
          Delete this workout (also removes it from any day it&apos;s assigned to).
        </Typography>
      </Stack>
    </Container>
  );
}
