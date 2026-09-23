// Cash-flow chart roles, mapped onto the validated --chart-N hues (app/tokens).
// Income/spending take slots 3/2; tags skip those two so no slice borrows a
// money-in or money-out color.
export const CASHFLOW_COLORS = {
  income: "var(--chart-3)",
  spending: "var(--chart-2)",
  tags: ["var(--chart-1)", "var(--chart-4)", "var(--chart-5)", "var(--chart-6)", "var(--chart-7)"],
  other: "var(--chart-other)",
} as const;

/** A CSS color at reduced strength (unselected bars), keeping var() colors. */
export const dimmed = (c: string) => `color-mix(in srgb, ${c} 35%, transparent)`;
