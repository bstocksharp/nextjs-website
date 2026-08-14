import "server-only";
import { createHash } from "node:crypto";
import { and, desc, eq, gte, isNull, lte, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { transactions, recurringExpenses } from "@/lib/db/schema";
import { parseAlertText, categorizeMerchant, type MerchantRule } from "@/lib/finance/sms";
import { spendCategoryFor } from "@/lib/finance/categorize";
import { spendRulesFor } from "@/lib/queries/finance-categories";
import { todayISO, dateInTz } from "@/lib/finance/parse";
import { getGroupTimezone } from "@/lib/queries/group";

// ─────────────────────────────────────────────────────────────────────────────
// INGEST — the shared "an alert text becomes a transaction row" pipeline, used
// by the API route today and (same code) a future bulk import of the old
// iCloud transactions.txt. Text seeds a row; the row is the truth thereafter.
// Server-side because it writes; the pure parsing/categorizing lives in sms.ts.
// ─────────────────────────────────────────────────────────────────────────────

export type IngestResult =
  | { ok: true; id: number; deduped: false; needsReview: boolean; category: string }
  | { ok: true; id: number; deduped: true }
  | { ok: false; reason: "empty" };

const DEDUPE_WINDOW_MS = 10 * 60 * 1000; // Shortcuts double-fires within seconds

// A card alert is a couple hundred characters. Cap the body so a runaway (or
// hostile) POST can't become a multi-megabyte rawText row. Truncating rather
// than rejecting keeps the "never silently dropped" promise — an oversized body
// still lands as a needs-review row you can see.
const MAX_ALERT_CHARS = 2000;

/** Recurring-bill matching rules effective on a given date, for this group.
 *  Exported so manual "Auto-detect" add can categorize like the SMS path. */
export async function merchantRulesFor(groupId: number, onDate: string): Promise<MerchantRule[]> {
  const rows = await db
    .select({
      id: recurringExpenses.id,
      paymentsPerYear: recurringExpenses.paymentsPerYear,
      merchantPatterns: recurringExpenses.merchantPatterns,
      category: recurringExpenses.category,
    })
    .from(recurringExpenses)
    .where(
      and(
        eq(recurringExpenses.groupId, groupId),
        lte(recurringExpenses.startDate, onDate),
        or(isNull(recurringExpenses.endDate), gte(recurringExpenses.endDate, onDate)),
      ),
    );
  return rows.map((r) => ({
    recurringExpenseId: r.id,
    paymentsPerYear: r.paymentsPerYear,
    patterns: r.merchantPatterns ?? [],
    category: r.category,
  }));
}

/** The spend-category a matched bill contributes (for fixed/amortized inherit). */
function billCategoryOf(
  recurringExpenseId: number | null,
  rules: MerchantRule[],
): string | null {
  if (recurringExpenseId == null) return null;
  return rules.find((r) => r.recurringExpenseId === recurringExpenseId)?.category ?? null;
}

/**
 * Turn one raw alert into a stored transaction.
 *  - Parseable → categorized against the effective recurring rules.
 *  - Unparseable → a needs-review row (amount 0, rawText kept) — NEVER dropped.
 *  - A byte-identical text already stored in the last 10 min → skipped (dedupe;
 *    NOT a unique constraint, so two real identical same-day purchases both land).
 */
export async function ingestAlert(
  groupId: number,
  text: string,
  accountId: number | null,
): Promise<IngestResult> {
  const body = text.trim().slice(0, MAX_ALERT_CHARS);
  if (!body) return { ok: false, reason: "empty" };

  const rawHash = createHash("sha256").update(body).digest("hex");
  const since = new Date(Date.now() - DEDUPE_WINDOW_MS);
  const [dupe] = await db
    .select({ id: transactions.id })
    .from(transactions)
    .where(
      and(
        eq(transactions.groupId, groupId),
        eq(transactions.rawHash, rawHash),
        gte(transactions.createdAt, since),
      ),
    )
    .orderBy(desc(transactions.id))
    .limit(1);
  if (dupe) return { ok: true, id: dupe.id, deduped: true };

  const tz = await getGroupTimezone(groupId);
  const parsed = parseAlertText(body);

  if (!parsed) {
    const [row] = await db
      .insert(transactions)
      .values({
        groupId,
        accountId,
        postedOn: todayISO(tz),
        merchant: null,
        amount: "0.00",
        originalAmount: "0.00",
        category: "discretionary",
        source: "sms",
        rawText: body,
        rawHash,
        needsReview: true,
      })
      .returning({ id: transactions.id });
    return { ok: true, id: row.id, deduped: false, needsReview: true, category: "review" };
  }

  // Chase clocks its alerts in Eastern; when the alert carried a time we know the
  // exact instant, so date it in the HOUSEHOLD zone (12:52 AM ET → the day before
  // out in Central). No time/zone in the text → the written date stands.
  const postedOn =
    parsed.instant != null ? dateInTz(parsed.instant, tz) : parsed.postedOn;

  const rules = await merchantRulesFor(groupId, postedOn);
  const { category, recurringExpenseId } = categorizeMerchant(parsed.merchant, rules);
  const spendCategory = spendCategoryFor(
    category,
    parsed.merchant,
    billCategoryOf(recurringExpenseId, rules),
    await spendRulesFor(groupId),
  );

  const [row] = await db
    .insert(transactions)
    .values({
      groupId,
      accountId,
      postedOn,
      merchant: parsed.merchant,
      amount: parsed.amount,
      originalAmount: parsed.amount,
      category,
      recurringExpenseId,
      spendCategory,
      source: "sms",
      rawText: body,
      rawHash,
      needsReview: false,
    })
    .returning({ id: transactions.id });

  return { ok: true, id: row.id, deduped: false, needsReview: false, category };
}

// ─────────────────────────────────────────────────────────────────────────────
// STRUCTURED INGEST — the generic shape for anyone NOT sending a raw Chase text:
// POST { amount, merchant?, date?, note? }. Only `amount` is required; a missing
// date defaults to the household's today, and a missing merchant lands the row in
// review so it's never lost. Same dedupe + merchant categorization as the SMS
// path, so a structured feed behaves identically once the fields are known.
// ─────────────────────────────────────────────────────────────────────────────

export type StructuredInput = {
  amount?: unknown;
  merchant?: unknown;
  date?: unknown;
  note?: unknown;
  /** Optional explicit spend-category (Groceries/Dining…) — wins over the
   *  merchant-rule guess when a sender knows it. */
  category?: unknown;
};

export type StructuredResult =
  | { ok: true; id: number; deduped: false; needsReview: boolean; category: string }
  | { ok: true; id: number; deduped: true }
  | { ok: false; reason: "bad_amount" };

/** "$1,234.5" | "1234.5" | 1234.5 → "1234.50"; null unless a finite, nonzero
 *  number. Sign is preserved so a caller CAN send a credit as a negative. */
function parseAmountLoose(raw: unknown): string | null {
  if (raw == null) return null;
  const s = String(raw).replace(/[$,\s]/g, "");
  if (s === "") return null;
  const n = Number(s);
  if (!Number.isFinite(n) || n === 0) return null;
  return n.toFixed(2);
}

/** Trimmed + length-capped, or null for empty/absent. */
function cleanStr(raw: unknown, max: number): string | null {
  if (raw == null) return null;
  const s = String(raw).trim().slice(0, max);
  return s === "" ? null : s;
}

/** Accept "YYYY-MM-DD" (or the date half of an ISO datetime); null otherwise. */
function normalizeDateLoose(raw: unknown): string | null {
  if (raw == null) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(raw).trim());
  if (!m) return null;
  const mm = Number(m[2]);
  const dd = Number(m[3]);
  if (mm < 1 || mm > 12 || dd < 1 || dd > 31) return null;
  return `${m[1]}-${m[2]}-${m[3]}`;
}

export async function ingestStructured(
  groupId: number,
  input: StructuredInput,
  accountId: number | null,
): Promise<StructuredResult> {
  const amount = parseAmountLoose(input.amount);
  if (amount === null) return { ok: false, reason: "bad_amount" };

  const merchant = cleanStr(input.merchant, 200);
  const note = cleanStr(input.note, 500);
  const tz = await getGroupTimezone(groupId);
  const postedOn = normalizeDateLoose(input.date) ?? todayISO(tz);

  // Dedupe on the canonical (amount|merchant|date), same 10-min window as SMS —
  // Shortcuts double-fires here too. Versioned prefix so a structured hash can
  // never collide with a raw-text one.
  const rawText = JSON.stringify({ amount, merchant, date: postedOn, note });
  const rawHash = createHash("sha256").update(`v2|${rawText}`).digest("hex");
  const since = new Date(Date.now() - DEDUPE_WINDOW_MS);
  const [dupe] = await db
    .select({ id: transactions.id })
    .from(transactions)
    .where(
      and(
        eq(transactions.groupId, groupId),
        eq(transactions.rawHash, rawHash),
        gte(transactions.createdAt, since),
      ),
    )
    .orderBy(desc(transactions.id))
    .limit(1);
  if (dupe) return { ok: true, id: dupe.id, deduped: true };

  // A merchant lets us categorize (same rules as SMS); without one the row is
  // valid but uncategorizable, so it surfaces for review rather than hiding.
  let category = "discretionary";
  let recurringExpenseId: number | null = null;
  let rules: MerchantRule[] = [];
  if (merchant) {
    rules = await merchantRulesFor(groupId, postedOn);
    ({ category, recurringExpenseId } = categorizeMerchant(merchant, rules));
  }
  const needsReview = merchant === null;

  // An explicit API category wins; otherwise derive it (bill inherit / rules).
  let spendCategory = cleanStr(input.category, 40);
  if (spendCategory == null) {
    spendCategory = spendCategoryFor(
      category,
      merchant,
      billCategoryOf(recurringExpenseId, rules),
      await spendRulesFor(groupId),
    );
  }

  const [row] = await db
    .insert(transactions)
    .values({
      groupId,
      accountId,
      postedOn,
      merchant,
      amount,
      originalAmount: amount,
      category,
      recurringExpenseId,
      spendCategory,
      source: "api",
      rawText,
      rawHash,
      needsReview,
      note,
    })
    .returning({ id: transactions.id });

  return { ok: true, id: row.id, deduped: false, needsReview, category };
}
