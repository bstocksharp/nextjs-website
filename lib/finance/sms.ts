// ─────────────────────────────────────────────────────────────────────────────
// CARD-ALERT PARSING + MERCHANT CATEGORIZATION — a faithful port of the gist's
// battle-tested logic (years of real Chase texts), pure and dependency-free so
// it can be tested directly with node and reused by the ingest route, manual
// re-parses, and demo seeding alike.
//
// Format accepted (case-insensitive) — the raw Chase alert the iOS Shortcut
// forwards verbatim:
//   "You made a $52.16 transaction with CHICK-FIL-A #01975 on Aug 9, 2026"
//
// The pipe is intentionally dumb: no manual prefixes. Everything is categorized
// automatically by MERCHANT (see categorizeMerchant); anything else the user
// adjusts in the app. Unparseable text is NOT an error here — the caller stores
// it as a needs-review row so nothing is ever silently dropped.
// ─────────────────────────────────────────────────────────────────────────────

export type ParsedAlert = {
  /** Dollars as a "1234.56" string (DB numeric-friendly). */
  amount: string;
  merchant: string;
  /** YYYY-MM-DD. */
  postedOn: string;
};

// The gist's main-alert regex, verbatim in spirit — matches anywhere in the text.
const TXN_RE = /You made a \$([\d,.]+) transaction with (.+) on (\w+ \d{1,2}, \d{4})/i;

const MONTHS: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
  january: 1, february: 2, march: 3, april: 4, june: 6, july: 7,
  august: 8, september: 9, october: 10, november: 11, december: 12,
};

/** "Aug 9, 2026" / "August 09, 2026" → "2026-08-09"; null if bogus. */
export function parseAlertDate(raw: string): string | null {
  const m = /^\s*(\w+)\s+(\d{1,2}),\s*(\d{4})\s*$/.exec(raw);
  if (!m) return null;
  const month = MONTHS[m[1].toLowerCase()];
  const day = Number(m[2]);
  const year = Number(m[3]);
  if (!month || day < 1 || day > 31) return null;
  // Round-trip through Date to reject impossible days (Feb 30…).
  const d = new Date(Date.UTC(year, month - 1, day));
  if (d.getUTCMonth() !== month - 1 || d.getUTCDate() !== day) return null;
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** "1,234.5" → "1234.50"; null for NaN/negative/zero-ish garbage. */
function parseAmount(raw: string): string | null {
  const n = Number.parseFloat(raw.replace(/,/g, ""));
  if (!Number.isFinite(n) || n <= 0) return null;
  return n.toFixed(2);
}

/** Parse one alert text. Null = unparseable (caller makes a review row). */
export function parseAlertText(text: string): ParsedAlert | null {
  const main = TXN_RE.exec(text);
  if (!main) return null;
  const amount = parseAmount(main[1]);
  const postedOn = parseAlertDate(main[3]);
  if (!amount || !postedOn) return null;
  return { amount, merchant: main[2].trim(), postedOn };
}

// ── Categorization ────────────────────────────────────────────────────────────
/** One recurring bill's matching rules, as the categorizer needs them. */
export type MerchantRule = {
  recurringExpenseId: number;
  /** 12 = a monthly bill ("fixed" lane); anything else amortizes. */
  paymentsPerYear: number;
  /** Substrings as they appear in card alerts (e.g. "PROGRESSIVE INS"). */
  patterns: string[];
};

export type Categorized = {
  category: "discretionary" | "fixed" | "amortized";
  recurringExpenseId: number | null;
};

/**
 * Categorize purely by MERCHANT: fixed merchant match → amortized match →
 * discretionary. Patterns are matched longest-first across ALL rules so
 * "SPECTRUM MOBILE" beats "SPECTRUM", case-insensitively, substring-style.
 * Anything that isn't a known recurring bill lands in discretionary; the user
 * re-files reimbursements / savings / funds in the app.
 */
export function categorizeMerchant(
  merchant: string,
  rules: MerchantRule[],
): Categorized {
  const m = merchant.toLowerCase();
  const flat = rules
    .flatMap((r) =>
      r.patterns.map((p) => ({
        pattern: p.toLowerCase(),
        recurringExpenseId: r.recurringExpenseId,
        fixed: r.paymentsPerYear === 12,
      })),
    )
    .filter((r) => r.pattern.length > 0)
    .sort((a, b) => b.pattern.length - a.pattern.length);

  // Fixed rules win over amortized at equal specificity (gist checked fixed
  // first) — implemented as: first pass fixed-only, second pass amortized.
  for (const pass of [true, false]) {
    for (const r of flat) {
      if (r.fixed === pass && m.includes(r.pattern)) {
        return {
          category: pass ? "fixed" : "amortized",
          recurringExpenseId: r.recurringExpenseId,
        };
      }
    }
  }
  return { category: "discretionary", recurringExpenseId: null };
}
