"use client";

import * as React from "react";
import TextField from "@mui/material/TextField";
import { CATEGORIES, categoryLabel, equipmentLabel } from "@/lib/workout";
import type { Exercise } from "@/lib/db/schema";

// Pick an exercise from the catalog to append to this section — selecting it
// adds it immediately (no Add button), using the catalog defaults (tweak
// afterward via the item editor). React resets the select after each add.
//
// Equipment: nothing is hidden. An exercise needing gear the active person
// hasn't marked as owned is labeled "… — needs X" and, when picked, asks for a
// quick confirm before it's added (so you can still plan ahead / build for
// someone with different gear). Filtering is off until equipment is set.
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

  const owned = React.useMemo(() => new Set(ownedEquipment), [ownedEquipment]);
  const filterActive = ownedEquipment.length > 0;
  const missingFor = React.useCallback(
    (e: Exercise) =>
      filterActive ? (e.equipment ?? []).filter((s) => !owned.has(s)) : [],
    [filterActive, owned],
  );
  const byId = React.useMemo(
    () => new Map(exercises.map((e) => [String(e.id), e])),
    [exercises],
  );

  function onPick(value: string) {
    if (!value) return;
    const e = byId.get(value);
    const missing = e ? missingFor(e) : [];
    if (missing.length) {
      const ok = window.confirm(
        `${e!.name} needs ${missing
          .map(equipmentLabel)
          .join(", ")}, which isn't in your equipment. Add it anyway?`,
      );
      if (!ok) {
        formRef.current?.reset(); // put the dropdown back to the placeholder
        return;
      }
    }
    formRef.current?.requestSubmit();
  }

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
        onChange={(e) => onPick(e.target.value)}
        slotProps={{ select: { native: true }, inputLabel: { shrink: true } }}
      >
        <option value="">Choose an exercise to add…</option>
        {keys.map((k) => (
          <optgroup key={k} label={categoryLabel(k)}>
            {groups[k].map((e) => {
              const missing = missingFor(e);
              return (
                <option key={e.id} value={String(e.id)}>
                  {e.name}
                  {missing.length
                    ? ` — needs ${missing.map(equipmentLabel).join(", ")}`
                    : ""}
                </option>
              );
            })}
          </optgroup>
        ))}
      </TextField>
    </form>
  );
}
