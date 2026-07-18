import { redirect } from "next/navigation";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import { isEditor } from "@/lib/auth";
import { listProfiles } from "@/lib/queries/profiles";
import { getActiveProfile } from "@/lib/profile";
import { addWorkout } from "@/app/actions/workout";
import WorkoutMetaForm from "@/components/workout/WorkoutMetaForm";

export const metadata = { title: "New workout — Workout" };

export default async function NewWorkoutPage({
  searchParams,
}: {
  searchParams: Promise<{ profile?: string; weekday?: string }>;
}) {
  if (!(await isEditor())) redirect("/unlock");

  const { profile, weekday } = await searchParams;
  const [profiles, active] = await Promise.all([
    listProfiles(),
    getActiveProfile(profile),
  ]);
  const defaultProfileId = active?.id ?? profiles[0]?.id;
  const assignWeekday =
    weekday != null && /^[0-6]$/.test(weekday) ? Number(weekday) : undefined;

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
          assignWeekday={assignWeekday}
          submitLabel="Create & add exercises"
          cancelHref="/workout"
        />
      </Paper>
    </Container>
  );
}
