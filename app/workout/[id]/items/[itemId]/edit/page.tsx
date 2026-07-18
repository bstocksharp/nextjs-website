import { notFound, redirect } from "next/navigation";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import { isEditor } from "@/lib/auth";
import { getWorkoutItemWithExercise } from "@/lib/queries/workout";
import { updateWorkoutItem } from "@/app/actions/workout";
import WorkoutItemForm from "@/components/WorkoutItemForm";

export const metadata = { title: "Edit exercise — Workout" };

export default async function EditWorkoutItemPage({
  params,
}: {
  params: Promise<{ id: string; itemId: string }>;
}) {
  if (!(await isEditor())) redirect("/unlock");

  const { id, itemId } = await params;
  const workoutId = Number(id);
  const wItemId = Number(itemId);
  if (!Number.isInteger(workoutId) || !Number.isInteger(wItemId)) notFound();

  const data = await getWorkoutItemWithExercise(wItemId);
  if (!data || data.item.workoutId !== workoutId) notFound();

  return (
    <Container maxWidth="md" sx={{ py: { xs: 4, md: 6 } }}>
      <Typography variant="h4" component="h1">
        Edit exercise
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 3 }}>
        {data.exercise.name}
      </Typography>
      <Paper variant="outlined" sx={{ p: { xs: 2.5, md: 4 } }}>
        <WorkoutItemForm
          action={updateWorkoutItem.bind(null, wItemId, workoutId)}
          item={data.item}
          exercise={data.exercise}
          cancelHref={`/workout/${workoutId}/edit`}
        />
      </Paper>
    </Container>
  );
}
