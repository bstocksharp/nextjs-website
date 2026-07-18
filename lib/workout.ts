// Workout app constants + small pure helpers (mirrors lib/build.ts).
// Safe to import from both Server and Client Components — no server-only deps.

import type { Exercise, WorkoutItem } from "@/lib/db/schema";

// ── Categories (used to group the catalog + tag exercises) ────────────────────
export const CATEGORIES = [
  { value: "warmup", label: "Warmup" },
  { value: "legs", label: "Legs" },
  { value: "push", label: "Push" },
  { value: "pull", label: "Pull" },
  { value: "core", label: "Core" },
  { value: "carry", label: "Carry" },
  { value: "cardio", label: "Cardio" },
  { value: "mobility", label: "Mobility" },
] as const;

export function categoryLabel(value: string | null): string {
  return CATEGORIES.find((c) => c.value === value)?.label ?? "Other";
}

// ── Mode: reps = manual "Done → Next"; timed = countdown ──────────────────────
export const MODES = [
  { value: "reps", label: "Reps (tap when done)" },
  { value: "timed", label: "Timed (countdown)" },
] as const;

// ── Sections: warmup + cooldown run once; MAIN is a circuit (workout.rounds) ───
export type Section = "warmup" | "main" | "cooldown";
export const SECTIONS: { value: Section; label: string }[] = [
  { value: "warmup", label: "Warmup" },
  { value: "main", label: "Main" },
  { value: "cooldown", label: "Cooldown" },
];

// ── Weekdays — index 0..6 = Sun..Sat, matching JS Date.getDay() ───────────────
export const WEEKDAYS = [
  { value: 0, label: "Sunday", short: "Sun" },
  { value: 1, label: "Monday", short: "Mon" },
  { value: 2, label: "Tuesday", short: "Tue" },
  { value: 3, label: "Wednesday", short: "Wed" },
  { value: 4, label: "Thursday", short: "Thu" },
  { value: 5, label: "Friday", short: "Fri" },
  { value: 6, label: "Saturday", short: "Sat" },
] as const;

export function weekdayLabel(value: number | null | undefined): string {
  if (value == null) return "Unscheduled";
  return WEEKDAYS.find((d) => d.value === value)?.label ?? "Unscheduled";
}

// ── Resolved item: a workout item merged with its exercise's defaults ─────────
// A workout_item's override columns are null unless the user changed them, so the
// effective value falls back to the catalog exercise. Both the builder and the
// runner consume this shape so "what you'll actually do" lives in one place.
export type ResolvedItem = {
  itemId: number;
  exerciseId: number;
  name: string;
  category: string | null;
  section: Section; // warmup | main | cooldown
  mode: string; // "reps" | "timed"
  reps: string | null; // reps mode, e.g. "10-12", "8 each leg"
  duration: number | null; // seconds, timed mode
  weight: string | null; // e.g. "25 lb", "15s", "bodyweight"
  rest: number | null; // seconds of rest after this item
  description: string | null;
  tips: string | null;
  note: string | null; // per-item note (overrides nothing; extra context)
  sortOrder: number;
};

export function resolveItem(item: WorkoutItem, exercise: Exercise): ResolvedItem {
  const section = (item.section as Section) ?? "main";
  return {
    itemId: item.id,
    exerciseId: exercise.id,
    name: exercise.name,
    category: exercise.category,
    section: SECTIONS.some((s) => s.value === section) ? section : "main",
    mode: item.mode ?? exercise.defaultMode,
    reps: item.reps ?? exercise.defaultReps ?? null,
    duration: item.duration ?? exercise.defaultDuration ?? null,
    weight: item.weight ?? exercise.defaultWeight ?? null,
    rest: item.rest ?? exercise.defaultRest ?? null,
    description: exercise.description,
    tips: exercise.tips,
    note: item.note,
    sortOrder: item.sortOrder,
  };
}

/** Split resolved items into their sections, preserving order within each. */
export function groupBySection(
  items: ResolvedItem[],
): Record<Section, ResolvedItem[]> {
  const groups: Record<Section, ResolvedItem[]> = {
    warmup: [],
    main: [],
    cooldown: [],
  };
  for (const it of items) groups[it.section].push(it);
  return groups;
}

// ── Formatting ────────────────────────────────────────────────────────────────

/** A human duration: "5 min", "1:30", "45s". */
export function formatDuration(seconds: number): string {
  if (seconds >= 60 && seconds % 60 === 0) return `${seconds / 60} min`;
  if (seconds >= 60) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  }
  return `${seconds}s`;
}

/** The per-item target: "10-12", "8 each leg", "45s", "5 min". No sets/rounds. */
export function formatTarget(
  r: Pick<ResolvedItem, "mode" | "reps" | "duration">,
): string {
  if (r.mode === "timed") {
    return r.duration != null ? formatDuration(r.duration) : "";
  }
  return r.reps ?? "";
}

/** Tips are stored one per line; split into a clean list. */
export function parseTips(tips: string | null): string[] {
  if (!tips) return [];
  return tips
    .split("\n")
    .map((t) => t.trim())
    .filter(Boolean);
}

/** MM:SS for the live countdown clock. */
export function clock(seconds: number): string {
  const s = Math.max(0, Math.ceil(seconds));
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, "0")}`;
}
