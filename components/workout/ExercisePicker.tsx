"use client";

import * as React from "react";
import TextField from "@mui/material/TextField";
import { CATEGORIES, categoryLabel, equipmentLabel } from "@/lib/workout";
import type { Exercise } from "@/lib/db/schema";

// The catalog dropdown shared by the builders: exercises grouped by category,
// picking one fires onPick and resets back to the placeholder.
//
// Equipment: nothing is hidden. An exercise needing gear the active person
// hasn't marked as owned is labeled "… — needs X" and, when picked, asks for a
// quick confirm before it's added (so you can still plan ahead / build for
// someone with different gear). Filtering is off until equipment is set.
export default function ExercisePicker({
  exercises,
  ownedEquipment,
  onPick,
  label = "Add exercise",
}: {
  exercises: Exercise[];
  ownedEquipment: string[];
  onPick: (exercise: Exercise) => void;
  label?: string;
}) {
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

  // Controlled with a constant "" so the select snaps back to the placeholder
  // after every pick.
  function handleChange(value: string) {
    const e = byId.get(value);
    if (!e) return;
    const missing = missingFor(e);
    if (missing.length) {
      const ok = window.confirm(
        `${e.name} needs ${missing
          .map(equipmentLabel)
          .join(", ")}, which isn't in your equipment. Add it anyway?`,
      );
      if (!ok) return;
    }
    onPick(e);
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
    <TextField
      label={label}
      select
      size="small"
      value=""
      fullWidth
      onChange={(e) => handleChange(e.target.value)}
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
  );
}
