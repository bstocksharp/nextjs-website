// Workout app constants + small pure helpers (mirrors lib/build.ts).
// Safe to import from both Server and Client Components — no server-only deps.

import type { Exercise, WorkoutItem } from "@/lib/db/schema";
import { RUN_TIMING } from "@/lib/workout-config";

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

// ── Equipment (what an exercise needs / what a person owns) ────────────────────
// A small controlled vocabulary, like CATEGORIES. An exercise stores the slugs it
// REQUIRES (exercises.equipment); a profile stores the slugs it OWNS
// (profiles.equipment). You can do an exercise when you own every slug it needs;
// an empty required list = bodyweight, always doable. Keep this list short and
// home-gym focused — it's the set of things that actually gate what you can do.
export const EQUIPMENT = [
  { value: "dumbbells", label: "Dumbbells" },
  { value: "pullup-bar", label: "Pull-up bar" },
  { value: "bench", label: "Bench / chair" },
  { value: "treadmill", label: "Treadmill" },
] as const;

export type EquipmentSlug = (typeof EQUIPMENT)[number]["value"];

export function equipmentLabel(value: string): string {
  return EQUIPMENT.find((eq) => eq.value === value)?.label ?? value;
}

/** Keep only real, known equipment slugs (deduped) — guards stored/parsed data. */
export function cleanEquipment(values: unknown): string[] {
  if (!Array.isArray(values)) return [];
  const known = new Set<string>(EQUIPMENT.map((eq) => eq.value));
  return [...new Set(values)].filter(
    (v): v is string => typeof v === "string" && known.has(v),
  );
}

/**
 * Can a person who owns `owned` do an exercise that needs `needed`?
 * True when they own every required slug (bodyweight exercises need nothing).
 */
export function canDoWithEquipment(
  needed: string[] | null | undefined,
  owned: string[] | null | undefined,
): boolean {
  if (!needed || needed.length === 0) return true;
  const have = new Set(owned ?? []);
  return needed.every((slug) => have.has(slug));
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
  mode: string; // derived: "reps" (has reps) | "timed" (no reps)
  reps: string | null; // e.g. "10-12", "8 each leg"
  duration: number | null; // seconds — per-rep time if reps set, else total hold
  weight: string | null; // e.g. "25 lb", "15s", "bodyweight"
  holdLast: boolean; // hold the final rep (only takes effect with a per-rep time)
  sides: number; // 1 = normal; 2 = performed per side (run the set once per side)
  description: string | null;
  tips: string | null;
  note: string | null; // per-item note (overrides nothing; extra context)
  sortOrder: number;
};

export function resolveItem(
  item: WorkoutItem,
  exercise: Exercise,
): ResolvedItem {
  const rawSection = (item.section as Section) ?? "main";
  const section = SECTIONS.some((s) => s.value === rawSection)
    ? rawSection
    : "main";
  const reps = item.reps ?? exercise.defaultReps ?? null;
  const duration = item.duration ?? exercise.defaultDuration ?? null;
  // Mode is derived from the data (not a stored field): has reps → rep-based
  // (auto mode times `duration` per rep); no reps → a plain countdown of `duration`.
  const mode = reps ? "reps" : duration != null ? "timed" : "reps";
  return {
    itemId: item.id,
    exerciseId: exercise.id,
    name: exercise.name,
    category: exercise.category,
    section,
    mode,
    reps,
    duration,
    weight: item.weight ?? exercise.defaultWeight ?? null,
    holdLast: item.holdLast ?? exercise.holdLast ?? false,
    // Per-side is intrinsic to the exercise (a split squat is always per leg), so
    // it lives on the catalog only — no per-item override.
    sides: exercise.sides ?? 1,
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

/**
 * The per-item target line. Reps only → "10-12". Reps + per-rep time →
 * "10 × 5s". Timed only → "45s" / "5 min".
 */
export function formatTarget(
  r: Pick<ResolvedItem, "reps" | "duration">,
): string {
  if (r.reps) {
    return r.duration != null
      ? `${r.reps} × ${formatDuration(r.duration)}`
      : r.reps;
  }
  return r.duration != null ? formatDuration(r.duration) : "";
}

/** First integer in a reps string ("10-12" → 10, "8 each leg" → 8, "to failure" → null). */
export function parseLeadingInt(s: string | null): number | null {
  if (!s) return null;
  const m = s.match(/\d+/);
  return m ? Number(m[0]) : null;
}

// ── Run steps: expand a workout into the ordered sequence the runner plays ─────
// Between consecutive works we may insert a rest:
//   • "Rest"      — the real rest between main circuit rounds (both modes).
//   • "Get ready" — a short reposition lead-in before an exercise (AUTO only).
//   • "Switch"    — a short lead-in between the two sides of a per-side exercise
//                   (AUTO only).
// The "Get ready" / "Switch" lead-ins only make sense when the next step will
// auto-start; in manual mode you start each exercise yourself, so they're
// omitted (see the `autoAdvance` option below). All timing lives in RUN_TIMING
// (lib/workout-config.ts).

// A per-side exercise (item.sides > 1) is played once per side; each side is its
// own work step, tagged so the runner can show "Side 1 of 2" etc.
export type WorkStep = {
  kind: "work";
  item: ResolvedItem;
  round: number | null; // main round number; null for warmup/cooldown
  totalRounds: number;
  side?: { index: number; total: number; label: string }; // only when sides > 1
};
export type RunStep =
  | WorkStep
  | { kind: "rest"; seconds: number; label: "Get ready" | "Rest" | "Switch" };

/** Expand one resolved item into its per-side work steps (just one if sides ≤ 1). */
function sideSteps(
  item: ResolvedItem,
  round: number | null,
  totalRounds: number,
): WorkStep[] {
  const sides = Math.max(1, item.sides || 1);
  if (sides <= 1) return [{ kind: "work", item, round, totalRounds }];
  return Array.from({ length: sides }, (_, i) => ({
    kind: "work",
    item,
    round,
    totalRounds,
    side: { index: i + 1, total: sides, label: `Side ${i + 1} of ${sides}` },
  }));
}

/**
 * warmup (once) → main (× rounds) → cooldown (once).
 *
 * `autoAdvance` mirrors the runner's toggle: when off (manual mode) the short
 * "Get ready" / "Switch" lead-ins are dropped, since you start each exercise
 * yourself. The real between-rounds "Rest" is kept in both modes.
 */
export function buildSteps(
  items: ResolvedItem[],
  rounds: number,
  restBetweenRounds: number,
  opts: { autoAdvance?: boolean } = {},
): RunStep[] {
  const autoAdvance = opts.autoAdvance ?? true;
  const bySection = groupBySection(items);
  const R = Math.max(1, rounds);

  const works: WorkStep[] = [];
  bySection.warmup.forEach((it) => works.push(...sideSteps(it, null, R)));
  for (let r = 1; r <= R; r++) {
    bySection.main.forEach((it) => works.push(...sideSteps(it, r, R)));
  }
  bySection.cooldown.forEach((it) => works.push(...sideSteps(it, null, R)));

  const steps: RunStep[] = [];
  works.forEach((w, i) => {
    if (i > 0) {
      const prev = works[i - 1];
      const crossRound =
        prev.round != null && w.round != null && w.round !== prev.round;
      // Consecutive sides of the same exercise (same item + round, next side).
      const sideSwitch =
        !!w.side &&
        !!prev.side &&
        prev.item.itemId === w.item.itemId &&
        prev.round === w.round &&
        w.side.index === prev.side.index + 1;

      if (crossRound && restBetweenRounds > 0) {
        steps.push({ kind: "rest", seconds: restBetweenRounds, label: "Rest" });
      } else if (sideSwitch) {
        if (autoAdvance && RUN_TIMING.switchSideSeconds > 0)
          steps.push({
            kind: "rest",
            seconds: RUN_TIMING.switchSideSeconds,
            label: "Switch",
          });
      } else if (autoAdvance && RUN_TIMING.prepSeconds > 0) {
        steps.push({
          kind: "rest",
          seconds: RUN_TIMING.prepSeconds,
          label: "Get ready",
        });
      }
    }
    steps.push(w);
  });
  return steps;
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
