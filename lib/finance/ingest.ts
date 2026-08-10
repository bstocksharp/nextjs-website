import "server-only";
import { createHash } from "node:crypto";
import { and, desc, eq, gte, isNull, lte, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { transactions, recurringExpenses } from "@/lib/db/schema";
import { parseAlertText, categorizeMerchant, type MerchantRule } from "@/lib/finance/sms";

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
  }));
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

  const parsed = parseAlertText(body);

  if (!parsed) {
    const [row] = await db
      .insert(transactions)
      .values({
        groupId,
        accountId,
        postedOn: new Date().toISOString().slice(0, 10),
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

  const rules = await merchantRulesFor(groupId, parsed.postedOn);
  const { category, recurringExpenseId } = categorizeMerchant(parsed.merchant, rules);

  const [row] = await db
    .insert(transactions)
    .values({
      groupId,
      accountId,
      postedOn: parsed.postedOn,
      merchant: parsed.merchant,
      amount: parsed.amount,
      originalAmount: parsed.amount,
      category,
      recurringExpenseId,
      source: "sms",
      rawText: body,
      rawHash,
      needsReview: false,
    })
    .returning({ id: transactions.id });

  return { ok: true, id: row.id, deduped: false, needsReview: false, category };
}
