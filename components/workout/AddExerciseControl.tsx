"use client";

import * as React from "react";
import TextField from "@mui/material/TextField";
import { CATEGORIES, categoryLabel } from "@/lib/workout";
import type { Exercise } from "@/lib/db/schema";

// Pick an exercise from the catalog to append to this section — selecting it
// adds it immediately (no Add button), using the catalog defaults (tweak
// afterward via the item editor). React resets the select after each add.
export default function AddExerciseControl({
  action,
  section,
  exercises,
}: {
  action: (formData: FormData) => void | Promise<void>;
  section: string;
  exercises: Exercise[];
}) {
  const formRef = React.useRef<HTMLFormElement>(null);

  // Group by category in the canonical order for a tidy dropdown.
  const order = new Map<string, number>(CATEGORIES.map((c, i) => [c.value, i]));
  const groups = exercises.reduce<Record<string, Exercise[]>>((acc, e) => {
    (acc[e.category ?? "other"] ??= []).push(e);
    return acc;
  }, {});
  const keys = Object.keys(groups).sort(
    (a, b) => (order.get(a) ?? 99) - (order.get(b) ?? 99),
  );

  return (
    <form action={action} ref={formRef}>
      <input type="hidden" name="section" value={section} />
      <TextField
        name="exerciseId"
        label="Add exercise"
        select
        size="small"
        defaultValue=""
        fullWidth
        onChange={(e) => {
          if (e.target.value) formRef.current?.requestSubmit();
        }}
        slotProps={{ select: { native: true }, inputLabel: { shrink: true } }}
      >
        <option value="">Choose an exercise to add…</option>
        {keys.map((k) => (
          <optgroup key={k} label={categoryLabel(k)}>
            {groups[k].map((e) => (
              <option key={e.id} value={String(e.id)}>
                {e.name}
              </option>
            ))}
          </optgroup>
        ))}
      </TextField>
    </form>
  );
}
