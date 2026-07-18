"use client";

import * as React from "react";
import TextField from "@mui/material/TextField";

type Opt = { id: number; name: string };

// A per-day workout picker that submits its server action on change (assign or,
// when "Rest" is chosen, clear). No save button needed.
export default function AssignSelect({
  action,
  workouts,
  current,
}: {
  action: (formData: FormData) => void | Promise<void>;
  workouts: Opt[];
  current: number | null;
}) {
  const formRef = React.useRef<HTMLFormElement>(null);

  return (
    <form action={action} ref={formRef}>
      <TextField
        name="workoutId"
        select
        size="small"
        defaultValue={current != null ? String(current) : ""}
        onChange={() => formRef.current?.requestSubmit()}
        slotProps={{ select: { native: true } }}
        sx={{ minWidth: 160 }}
        aria-label="Workout for this day"
      >
        <option value="">Rest</option>
        {workouts.map((w) => (
          <option key={w.id} value={String(w.id)}>
            {w.name}
          </option>
        ))}
      </TextField>
    </form>
  );
}
