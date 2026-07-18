import { redirect } from "next/navigation";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import { isEditor } from "@/lib/auth";
import { listProfiles } from "@/lib/queries/workout";
import { addWorkout } from "@/app/actions/workout";
import WorkoutMetaForm from "@/components/WorkoutMetaForm";

export const metadata = { title: "New workout — Workout" };

export default async function NewWorkoutPage({
  searchParams,
}: {
  searchParams: Promise<{ profile?: string }>;
}) {
  if (!(await isEditor())) redirect("/unlock");

  const { profile } = await searchParams;
  const profiles = await listProfiles();
  const defaultProfileId =
    profiles.find((p) => String(p.id) === profile)?.id ?? profiles[0]?.id;

  return (
    <Container maxWidth="md" sx={{ py: { xs: 4, md: 6 } }}>
      <Typography variant="h4" component="h1" sx={{ mb: 1 }}>
        New workout
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Name it and set the rounds — you&apos;ll add exercises next.
      </Typography>
      <Paper variant="outlined" sx={{ p: { xs: 2.5, md: 4 } }}>
        <WorkoutMetaForm
          action={addWorkout}
          profiles={profiles}
          defaultProfileId={defaultProfileId}
          submitLabel="Create & add exercises"
          cancelHref="/workout"
        />
      </Paper>
    </Container>
  );
}
