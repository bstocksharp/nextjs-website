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

/** Today as YYYY-MM-DD (UTC-shifted to local calendar day). */
export function todayISO(): string {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 10);
}

/** First-of-current-month as YYYY-MM-01. */
export function currentMonthISO(): string {
  return `${todayISO().slice(0, 7)}-01`;
}
