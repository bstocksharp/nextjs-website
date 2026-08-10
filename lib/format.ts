// Display formatters (Intl-based, no date library).

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

const dateFmt = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
});

const numFmt = new Intl.NumberFormat("en-US");

export function formatMoney(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") return "—";
  const n = typeof value === "string" ? Number(value) : value;
  return Number.isNaN(n) ? "—" : money.format(n);
}

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return "—";
  // Drizzle `date` columns come back as "YYYY-MM-DD"; anchor at noon so local
  // timezone rendering never rolls the day backward.
  const d =
    typeof value === "string"
      ? new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T12:00:00` : value)
      : value;
  return Number.isNaN(d.getTime()) ? "—" : dateFmt.format(d);
}

export function formatMiles(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return `${numFmt.format(value)} mi`;
}

/** "+$4,071.95" / "−$388.75" — money deltas that wear their sign. */
export function formatMoneySigned(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return `${value >= 0 ? "+" : "−"}${money.format(Math.abs(value))}`;
}

/** "$135k" axis labels; falls back to plain currency under $10k. */
export function formatMoneyCompact(value: number): string {
  if (Math.abs(value) >= 10_000) return `$${Math.round(value / 1000)}k`;
  return money.format(value).replace(/\.\d+$/, "");
}

/** "Aug 2026" from a YYYY-MM-01 month string. */
export function formatMonth(month: string): string {
  const d = new Date(`${month.slice(0, 7)}-01T12:00:00`);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}
