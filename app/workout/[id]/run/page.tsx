import { notFound } from "next/navigation";
import { getWorkoutWithItems } from "@/lib/queries/workout";
import WorkoutRunner from "@/components/workout/WorkoutRunner";

export const metadata = { title: "Workout in progress" };

export default async function RunPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getWorkoutWithItems(Number(id));
  if (!data) notFound();

  // The runner builds its own step sequence — it depends on the client-side
  // auto-advance toggle (manual mode drops the "Get ready" / "Switch" lead-ins).
  return (
    <WorkoutRunner
      workoutId={data.workout.id}
      workoutName={data.workout.name}
      items={data.items}
      rounds={data.workout.rounds}
      restBetweenRounds={data.workout.restBetweenRounds}
    />
  );
}
