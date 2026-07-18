import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Divider from "@mui/material/Divider";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import LoopIcon from "@mui/icons-material/Loop";
import DoneIcon from "@mui/icons-material/Done";
import { isEditor } from "@/lib/auth";
import {
  getWorkout,
  getWorkoutItemsWithExercises,
  listProfiles,
  listExercises,
} from "@/lib/queries/workout";
import {
  updateWorkout,
  deleteWorkout,
  addWorkoutItem,
} from "@/app/actions/workout";
import { resolveItem, SECTIONS, type Section } from "@/lib/workout";
import WorkoutMetaAutoSave from "@/components/workout/WorkoutMetaAutoSave";
import AddExerciseControl from "@/components/workout/AddExerciseControl";
import BuilderItemRow from "@/components/workout/BuilderItemRow";
import DeleteIconButton from "@/components/shared/DeleteIconButton";
import Pill from "@/components/shared/Pill";

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

  const [workout, rows, profiles, catalog] = await Promise.all([
    getWorkout(workoutId),
    getWorkoutItemsWithExercises(workoutId),
    listProfiles(),
    listExercises(),
  ]);
  if (!workout) notFound();

  // Group each row (raw item + exercise + resolved display) by section.
  const bySection: Record<Section, (typeof rows)[number][]> = {
    warmup: [],
    main: [],
    cooldown: [],
  };
  for (const row of rows) {
    const section = resolveItem(row.item, row.exercise).section;
    bySection[section].push(row);
  }

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

      <Typography variant="h4" component="h1" sx={{ mb: 0.5 }}>
        Edit workout
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Everything here saves automatically.
      </Typography>

      <Paper variant="outlined" sx={{ p: { xs: 2.5, md: 3 }, mb: 4 }}>
        <WorkoutMetaAutoSave
          action={updateWorkout.bind(null, workoutId)}
          workout={workout}
          profiles={profiles}
        />
      </Paper>

      <Stack spacing={4}>
        {SECTIONS.map((s) => {
          const sectionRows = bySection[s.value];
          const isCircuit = s.value === "main" && workout.rounds > 1;
          return (
            <Box key={s.value}>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
                <Typography variant="h5" component="h2">
                  {s.label}
                </Typography>
                {isCircuit ? (
                  <Pill
                    color="primary"
                    variant="filled"
                    icon={<LoopIcon />}
                    label={`${workout.rounds} rounds`}
                  />
                ) : null}
              </Stack>

              <Stack spacing={1} sx={{ mb: 1.5 }}>
                {sectionRows.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    Nothing here yet.
                  </Typography>
                ) : (
                  sectionRows.map((row, i) => (
                    <BuilderItemRow
                      key={row.item.id}
                      resolved={resolveItem(row.item, row.exercise)}
                      item={row.item}
                      exercise={row.exercise}
                      workoutId={workoutId}
                      itemId={row.item.id}
                      isFirst={i === 0}
                      isLast={i === sectionRows.length - 1}
                    />
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

      <Button
        component={Link}
        href={`/workout/${workoutId}`}
        variant="contained"
        size="large"
        startIcon={<DoneIcon />}
        sx={{ mt: 4 }}
      >
        Done
      </Button>

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
