// Pure form-value parsers shared by the finance actions (no server imports —
// usable anywhere). Money arrives as raw strings from NumberField's hidden
// input; months as "YYYY-MM" from MonthYearField.

/** "2026-08" or "2026-08-15" → "2026-08-01"; null if bogus. */
export function normalizeMonth(raw: unknown): string | null {
  const s = String(raw ?? "").trim();
  const m = /^(\d{4})-(\d{2})/.exec(s);
  if (!m) return null;
  const mm = Number(m[2]);
  if (mm < 1 || mm > 12) return null;
  return `${m[1]}-${m[2]}-01`;
}

/** A clean money string ("1234.56") or null. Negatives allowed. */
export function parseMoney(raw: FormDataEntryValue | null): string | null {
  const s = String(raw ?? "").trim();
  if (s === "") return null;
  const n = Number(s);
  return Number.isFinite(n) ? n.toFixed(2) : null;
}

/** A bounded integer or null. */
export function parseInt(
  raw: FormDataEntryValue | null,
  min: number,
  max: number,
): number | null {
  const s = String(raw ?? "").trim();
  if (s === "") return null;
  const n = Number.parseInt(s, 10);
  return Number.isInteger(n) && n >= min && n <= max ? n : null;
}

/** Trimmed string or null. */
export function parseStr(raw: FormDataEntryValue | null): string | null {
  const s = String(raw ?? "").trim();
  return s === "" ? null : s;
}

/** The last calendar day of a YYYY-MM-01 month, as ISO. */
export function lastDayOfMonth(month: string): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(Date.UTC(y, m, 0)); // day 0 of next month = last of this
  return d.toISOString().slice(0, 10);
}

// Fallback timezone when the household hasn't set one. Vercel runs in UTC, so
// date math MUST be pinned to a real zone or "today" flips at ~7pm Central
// instead of midnight. Callers pass the group's timezone (getGroupTimezone).
export const DEFAULT_TZ = "America/Chicago";

/** Today as YYYY-MM-DD in the given timezone (not the server's UTC). */
export function todayISO(tz: string = DEFAULT_TZ): string {
  // en-CA formats as YYYY-MM-DD; timeZone pins it to that zone's calendar day.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/** First-of-current-month as YYYY-MM-01, in the given timezone. */
export function currentMonthISO(tz: string = DEFAULT_TZ): string {
  return `${todayISO(tz).slice(0, 7)}-01`;
}
