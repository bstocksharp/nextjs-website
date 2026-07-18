import { notFound } from "next/navigation";
import { getWorkoutWithItems } from "@/lib/queries/workout";
import { buildSteps } from "@/lib/workout";
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

  const steps = buildSteps(
    data.items,
    data.workout.rounds,
    data.workout.restBetweenRounds,
  );

  return (
    <WorkoutRunner
      workoutId={data.workout.id}
      workoutName={data.workout.name}
      steps={steps}
    />
  );
}
