// Build-plan phase definitions (Bryce's order: reliability first, power last)
// and the option lists used by the build task form.

export const PHASES = [
  { num: 1, name: "Reliability" },
  { num: 2, name: "Safety" },
  { num: 3, name: "Handling" },
  { num: 4, name: "Interior" },
  { num: 5, name: "Cosmetic" },
  { num: 6, name: "Power" },
] as const;

export const PRIORITIES = ["high", "medium", "low"] as const;

export const STATUSES = [
  { value: "planned", label: "Planned" },
  { value: "in_progress", label: "In progress" },
  { value: "done", label: "Done" },
] as const;

export function phaseName(num: number | null): string {
  return PHASES.find((p) => p.num === num)?.name ?? "General";
}
