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
