"use client";

import * as React from "react";
import ExercisePicker from "@/components/workout/ExercisePicker";
import type { Exercise } from "@/lib/db/schema";

// The edit builder's "add to this section" control: a thin server-action form
// around the shared ExercisePicker — picking an exercise submits it immediately
// (no Add button), using the catalog defaults (tweak afterward via the item
// editor). The create flow uses ExercisePicker directly against draft state.
export default function AddExerciseControl({
  action,
  section,
  exercises,
  ownedEquipment,
}: {
  action: (formData: FormData) => void | Promise<void>;
  section: string;
  exercises: Exercise[];
  ownedEquipment: string[];
}) {
  const formRef = React.useRef<HTMLFormElement>(null);
  const idRef = React.useRef<HTMLInputElement>(null);

  return (
    <form action={action} ref={formRef}>
      <input type="hidden" name="section" value={section} />
      <input type="hidden" name="exerciseId" ref={idRef} />
      <ExercisePicker
        exercises={exercises}
        ownedEquipment={ownedEquipment}
        onPick={(e) => {
          if (idRef.current) idRef.current.value = String(e.id);
          formRef.current?.requestSubmit();
        }}
      />
    </form>
  );
}
