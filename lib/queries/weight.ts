import "server-only";
import { and, asc, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { weighIns, weightGoals } from "@/lib/db/schema";
import type { WeighIn, WeightGoal } from "@/lib/db/schema";

// ─────────────────────────────────────────────────────────────────────────────
// WEIGHT — reads + all DERIVED metrics (nothing here is stored; same spirit as
// MPG in the fuel queries). Postgres `numeric` comes back as a string, so every
// weight/goal number is Number()-parsed the moment it leaves the DB.
//
// The math, once:
//   • target line = startWeight − perWeekPace · weeksElapsed, floored at goal.
//   • trend       = least-squares line through the actual weigh-ins IN A WINDOW,
//                   extended forward so it can PROJECT the goal date. Computed for
//                   several windows (all / 6mo / 3mo / 6wk) so the client can
//                   re-contextualise the trajectory without a round-trip.
//   • moving avg  = trailing 4-week mean of actuals (the noise-dampened truth).
//   • pace buffer = target − actual at the latest weigh-in (+ = ahead of plan).
// ─────────────────────────────────────────────────────────────────────────────

const MS_DAY = 86_400_000;
const PLAN_HORIZON_WEEKS = 52; // one year of target line, like the sheet
const MIN_TREND_POINTS = 3; // fewer than this in a window → no meaningful trend

// The selectable trend windows. `weeks: null` = all history.
export const TREND_WINDOWS = [
  { key: "all", label: "All", weeks: null },
  { key: "6mo", label: "6 mo", weeks: 26 },
  { key: "3mo", label: "3 mo", weeks: 13 },
  { key: "6wk", label: "6 wk", weeks: 6 },
] as const;
export type WindowKey = (typeof TREND_WINDOWS)[number]["key"];

// `date` columns are "YYYY-MM-DD"; anchor at noon UTC so day math never rolls.
function parseDate(iso: string): Date {
  return new Date(`${iso}T12:00:00Z`);
}
function toISO(d: Date): string {
  return d.toISOString().slice(0, 10);
}
function addWeeks(startISO: string, weeks: number): string {
  const d = parseDate(startISO);
  d.setUTCDate(d.getUTCDate() + Math.round(weeks * 7));
  return toISO(d);
}
function weeksBetween(startISO: string, iso: string): number {
  return Math.round((parseDate(iso).getTime() - parseDate(startISO).getTime()) / (7 * MS_DAY));
}
const round1 = (n: number) => Math.round(n * 10) / 10;

// ── Raw reads ─────────────────────────────────────────────────────────────────
/** All weigh-ins for a profile, oldest first (chart + series order). */
export function listWeighIns(profileId: number): Promise<WeighIn[]> {
  return db
    .select()
    .from(weighIns)
    .where(eq(weighIns.profileId, profileId))
    .orderBy(asc(weighIns.measuredOn), asc(weighIns.id));
}

/** The one goal/plan row for a profile, or null. */
export async function getWeightGoal(profileId: number): Promise<WeightGoal | null> {
  const rows = await db
    .select()
    .from(weightGoals)
    .where(eq(weightGoals.profileId, profileId))
    .limit(1);
  return rows[0] ?? null;
}

/** A single weigh-in by (id, profile) — scoped so one person can't edit another's. */
export async function getWeighIn(id: number, profileId: number): Promise<WeighIn | null> {
  const rows = await db
    .select()
    .from(weighIns)
    .where(and(eq(weighIns.id, id), eq(weighIns.profileId, profileId)))
    .limit(1);
  return rows[0] ?? null;
}

/** History rows (newest first) with week-over-week delta vs the prior weigh-in. */
export async function getWeighInsWithDelta(profileId: number): Promise<
  { id: number; measuredOn: string; weight: number; note: string | null; delta: number | null }[]
> {
  const rows = await listWeighIns(profileId); // ascending
  const out = rows.map((r, i) => {
    const weight = Number(r.weight);
    const prev = i > 0 ? Number(rows[i - 1].weight) : null;
    return {
      id: r.id,
      measuredOn: r.measuredOn,
      weight,
      note: r.note,
      delta: prev != null ? round1(weight - prev) : null,
    };
  });
  return out.reverse(); // newest first for the table
}

// ── Derived dashboard ───────────────────────────────────────────────────────
export type ChartBase = {
  dates: string[]; // weekly tick dates (YYYY-MM-DD) from the plan start
  weeks: number[];
  actual: (number | null)[];
  target: (number | null)[];
  movingAvg: (number | null)[];
};

export type WeightStats = {
  current: number;
  currentDate: string;
  wowAbs: number | null;
  wowPct: number | null;
  totalLost: number;
  totalLostPct: number;
  paceBuffer: number | null; // target − actual at latest; + = ahead, − = behind
  percentToGoal: number | null; // 0–100 (can exceed past goal); null if no goal
};

export type Projection = {
  onTrack: boolean; // is the windowed trend actually heading to the goal?
  date: string | null; // when the trend crosses the goal (null if off-track)
  weeks: number | null;
  vsPlanDays: number | null; // + = ahead of planned finish, − = behind
  paceLbPerWeek: number | null; // the window's actual pace (lbs lost / week)
  enoughData: boolean; // false when the window has < MIN_TREND_POINTS points
};

export type WeightDashboard = {
  goal: WeightGoal | null;
  weighIns: WeighIn[];
  stats: WeightStats | null;
  chart: ChartBase;
  trends: Record<WindowKey, (number | null)[]>;
  projections: Record<WindowKey, Projection>;
  planPaceLbPerWeek: number | null;
};

/** Least-squares slope+intercept of y over x; null if fewer than 2 points. */
function linearFit(pts: { x: number; y: number }[]): { m: number; b: number } | null {
  const n = pts.length;
  if (n < 2) return null;
  const sx = pts.reduce((s, p) => s + p.x, 0);
  const sy = pts.reduce((s, p) => s + p.y, 0);
  const sxx = pts.reduce((s, p) => s + p.x * p.x, 0);
  const sxy = pts.reduce((s, p) => s + p.x * p.y, 0);
  const denom = n * sxx - sx * sx;
  if (denom === 0) return null;
  const m = (n * sxy - sx * sy) / denom;
  const b = (sy - m * sx) / n;
  return { m, b };
}

const emptyProjection = (enoughData: boolean): Projection => ({
  onTrack: false,
  date: null,
  weeks: null,
  vsPlanDays: null,
  paceLbPerWeek: null,
  enoughData,
});

/** Everything the dashboard page needs for one profile, in a single call. */
export async function getWeightDashboard(profileId: number): Promise<WeightDashboard> {
  const [rows, goal] = await Promise.all([listWeighIns(profileId), getWeightGoal(profileId)]);

  const series = rows.map((r) => ({ date: r.measuredOn, weight: Number(r.weight) }));

  const startDate = goal?.startDate ?? series[0]?.date ?? null;
  const startWeight = goal ? Number(goal.startWeight) : (series[0]?.weight ?? null);
  const goalWeight = goal ? Number(goal.goalWeight) : null;
  const pace = goal ? Number(goal.perWeekPace) : null;

  const emptyTrends = {
    all: [] as (number | null)[],
    "6mo": [] as (number | null)[],
    "3mo": [] as (number | null)[],
    "6wk": [] as (number | null)[],
  };
  const emptyProjections = {
    all: emptyProjection(false),
    "6mo": emptyProjection(false),
    "3mo": emptyProjection(false),
    "6wk": emptyProjection(false),
  };

  if (!startDate || startWeight == null) {
    return {
      goal,
      weighIns: rows,
      stats: null,
      chart: { dates: [], weeks: [], actual: [], target: [], movingAvg: [] },
      trends: emptyTrends,
      projections: emptyProjections,
      planPaceLbPerWeek: pace,
    };
  }

  // Place each weigh-in at its week index off the start date.
  const actualByWeek = new Map<number, number>();
  for (const s of series) actualByWeek.set(weeksBetween(startDate, s.date), s.weight);
  const lastWeek = series.length ? weeksBetween(startDate, series[series.length - 1].date) : 0;

  const planEndWeek =
    goalWeight != null && pace && pace > 0
      ? Math.ceil((startWeight - goalWeight) / pace)
      : PLAN_HORIZON_WEEKS;
  const axisEnd = Math.max(planEndWeek, lastWeek, PLAN_HORIZON_WEEKS);

  // Trailing 4-week moving average over the actual points.
  const maByWeek = new Map<number, number>();
  const ordered = [...actualByWeek.entries()].sort((a, b) => a[0] - b[0]);
  for (let i = 0; i < ordered.length; i++) {
    const win = ordered.slice(Math.max(0, i - 3), i + 1);
    maByWeek.set(ordered[i][0], round1(win.reduce((s, [, w]) => s + w, 0) / win.length));
  }

  // Window-independent chart base.
  const dates: string[] = [];
  const weeks: number[] = [];
  const actual: (number | null)[] = [];
  const target: (number | null)[] = [];
  const movingAvg: (number | null)[] = [];
  for (let w = 0; w <= axisEnd; w++) {
    weeks.push(w);
    dates.push(addWeeks(startDate, w));
    actual.push(actualByWeek.has(w) ? actualByWeek.get(w)! : null);
    movingAvg.push(maByWeek.has(w) ? maByWeek.get(w)! : null);
    target.push(
      goalWeight != null && pace != null ? round1(Math.max(goalWeight, startWeight - pace * w)) : null,
    );
  }

  // Per-window trend line + projection.
  const trends = { ...emptyTrends } as Record<WindowKey, (number | null)[]>;
  const projections = { ...emptyProjections } as Record<WindowKey, Projection>;
  const planEndDate = pace && pace > 0 ? addWeeks(startDate, planEndWeek) : null;

  for (const win of TREND_WINDOWS) {
    const cutoffWeek = win.weeks == null ? 0 : Math.max(0, lastWeek - (win.weeks - 1));
    const winPoints = ordered.filter(([w]) => w >= cutoffWeek);
    const enough = winPoints.length >= MIN_TREND_POINTS;
    const fit = enough ? linearFit(winPoints.map(([w, y]) => ({ x: w, y }))) : null;

    // Trend line: drawn from the window's first point forward across the axis.
    const line: (number | null)[] = [];
    for (let w = 0; w <= axisEnd; w++) {
      line.push(fit && w >= cutoffWeek ? round1(fit.m * w + fit.b) : null);
    }
    trends[win.key] = line;

    if (!fit || goalWeight == null) {
      projections[win.key] = emptyProjection(enough);
      continue;
    }
    const onTrack = fit.m < -0.01;
    if (!onTrack) {
      projections[win.key] = { ...emptyProjection(true), paceLbPerWeek: round1(-fit.m) };
      continue;
    }
    const crossWeek = (goalWeight - fit.b) / fit.m;
    const date = addWeeks(startDate, crossWeek);
    const vsPlanDays = planEndDate
      ? Math.round((parseDate(planEndDate).getTime() - parseDate(date).getTime()) / MS_DAY)
      : null;
    projections[win.key] = {
      onTrack: true,
      date,
      weeks: Math.round(crossWeek),
      vsPlanDays,
      paceLbPerWeek: round1(-fit.m),
      enoughData: true,
    };
  }

  // Window-independent stats (from the plan + latest actual).
  const first = series[0].weight;
  const last = series[series.length - 1];
  const prev = series.length >= 2 ? series[series.length - 2].weight : null;
  const targetAtLast =
    goalWeight != null && pace != null ? Math.max(goalWeight, startWeight - pace * lastWeek) : null;

  const stats: WeightStats = {
    current: last.weight,
    currentDate: last.date,
    wowAbs: prev != null ? round1(last.weight - prev) : null,
    wowPct: prev ? round1(((last.weight - prev) / prev) * 100) : null,
    totalLost: round1(first - last.weight),
    totalLostPct: first ? round1(((first - last.weight) / first) * 100) : 0,
    paceBuffer: targetAtLast != null ? round1(targetAtLast - last.weight) : null,
    percentToGoal:
      goalWeight != null && startWeight !== goalWeight
        ? round1(((startWeight - last.weight) / (startWeight - goalWeight)) * 100)
        : null,
  };

  return {
    goal,
    weighIns: rows,
    stats,
    chart: { dates, weeks, actual, target, movingAvg },
    trends,
    projections,
    planPaceLbPerWeek: pace,
  };
}
