// Pure spend-category resolution (F4c). Mirrors the SMS merchant matcher: a
// case-insensitive substring, longest pattern wins. Dependency-free so it's
// shared by ingest, the backfill, manual "apply to all", and tests.

export type SpendRule = { pattern: string; category: string };

/** The rule that governs a merchant: longest matching pattern wins (so a
 *  specific "WM SUPERCENTER #4279" override beats a broad "WALMART"). Null if
 *  no rule matches — the merchant is "ungrouped". */
export function longestMatchingRule<T extends SpendRule>(
  merchant: string,
  rules: T[],
): T | null {
  const m = merchant.toLowerCase();
  let best: T | null = null;
  for (const r of rules) {
    if (!r.pattern) continue;
    if (m.includes(r.pattern.toLowerCase())) {
      if (!best || r.pattern.length > best.pattern.length) best = r;
    }
  }
  return best;
}

/**
 * The analytics spend-category for a transaction:
 *  - fixed / amortized → the linked bill's ATLAS category (inherited for free)
 *  - discretionary     → the longest matching merchant rule, else null
 *  - anything else (income / fund / savings / reimbursement / ignored) → null,
 *    since those aren't "spend" and would pollute the category breakdown.
 */
export function spendCategoryFor(
  engineCategory: string,
  merchant: string | null,
  billCategory: string | null,
  rules: SpendRule[],
): string | null {
  if (engineCategory === "fixed" || engineCategory === "amortized") {
    return billCategory ?? null;
  }
  if (engineCategory !== "discretionary" || !merchant) return null;
  return longestMatchingRule(merchant, rules)?.category ?? null;
}
