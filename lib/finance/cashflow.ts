// Which engine categories are money OUT vs money IN — the one list shared by
// the cash-flow SQL (lib/queries/finance-cashflow), the tag pickers, and the
// merchant-rule matcher. Pure and dependency-free so client code can use it.

export type Flow = "out" | "in";

/** The URL/filter key for "no tag" (a slice of its own in the breakdowns). */
export const UNTAGGED = "__none__";

/** Spend lanes that count at face value (refunds net against them). */
export const SPEND_CATEGORIES = ["discretionary", "fixed", "amortized", "savings"] as const;
/** Every money-out lane: the spend lanes plus fund purchases (deposits excluded). */
export const OUT_CATEGORIES = [...SPEND_CATEGORIES, "fund"] as const;
export const IN_CATEGORIES = ["income", "reimbursement"] as const;

/** Lanes whose tags come from the Categories-tab rules (bills inherit theirs). */
export const RULE_CATEGORIES: Record<Flow, readonly string[]> = {
  out: ["discretionary", "savings", "fund"],
  in: IN_CATEGORIES,
};

/** A row's flow by its engine category; null = Excluded (never counted or tagged). */
export function flowOf(category: string): Flow | null {
  if ((OUT_CATEGORIES as readonly string[]).includes(category)) return "out";
  if ((IN_CATEGORIES as readonly string[]).includes(category)) return "in";
  return null;
}

/** Does this row count toward money out? Fund deposits and unreadable rows don't. */
export function isMoneyOut(category: string, amount: number, needsReview: boolean): boolean {
  if (needsReview) return false;
  if (category === "fund") return amount > 0;
  return (SPEND_CATEGORIES as readonly string[]).includes(category);
}

/** Does this row count toward money in? */
export function isMoneyIn(category: string, needsReview: boolean): boolean {
  return !needsReview && (IN_CATEGORIES as readonly string[]).includes(category);
}
