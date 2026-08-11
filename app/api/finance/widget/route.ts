import { NextRequest, NextResponse } from "next/server";
import { looksLikeApiToken } from "@/lib/finance/tokens";
import { resolveApiToken, touchApiToken } from "@/lib/queries/finance-tokens";
import {
  getBudgetMonthForGroup,
  listRecentMonthsForGroup,
} from "@/lib/queries/finance-budget";
import { currentMonthISO, todayISO } from "@/lib/finance/parse";

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/finance/widget — the data source for the Scriptable lock-screen
// widget (replacing its iCloud-file read). Bearer token (scope=widget) resolves
// the group; returns the current month's engine output as compact JSON. Dollars
// (not cents) on the wire so the widget renders them directly. no-store — a
// widget must never show a cached number.
// ─────────────────────────────────────────────────────────────────────────────

function bearer(req: NextRequest): string | null {
  const h = req.headers.get("authorization") ?? "";
  return h.startsWith("Bearer ") ? h.slice(7).trim() : null;
}

const d = (c: number) => Math.round(c) / 100;

export async function GET(req: NextRequest) {
  const token = bearer(req);
  if (!looksLikeApiToken(token)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const auth = await resolveApiToken(token, "widget");
  if (!auth) return NextResponse.json({ ok: false }, { status: 401 });
  void touchApiToken(auth.id);

  const month = currentMonthISO();
  const today = todayISO();
  const { computation: c } = await getBudgetMonthForGroup(auth.groupId, month, today);
  const disc = c.discretionary;
  const recentMonths = await listRecentMonthsForGroup(auth.groupId, 3, today);

  // "Total spend" the widget headlines = fixed + amortized + net discretionary
  // (NOT savings/fund draws — those aren't budget spend). fullBudget is the
  // whole monthly envelope. Dollars on the wire so the widget renders directly.
  const fullBudget = d(disc.budgetC + c.fixed.expectedC + c.amortized.reservedMonthlyC);
  const spent = d(c.fixed.actualC + c.amortized.paidThisMonthC + disc.netSpentC);

  // v2 — the full contract the Scriptable widget (compact + tap-to-detail) reads.
  return NextResponse.json(
    {
      ok: true,
      version: 2,
      month: month.slice(0, 7),
      day: c.dayOfMonth,
      daysInMonth: c.daysInMonth,
      daysLeft: Math.max(0, c.daysInMonth - c.dayOfMonth),
      fullBudget,
      spent,
      plannedTick: d(c.plannedTickC), // spend "you should be at" today (for the bar tick)
      discretionary: {
        budget: d(disc.budgetC),
        spent: d(disc.netSpentC),
        remaining: d(disc.remainingC),
        perDay: d(disc.perDayC),
        // + = under pace ("can spend"), − = over pace ("catch up").
        paceDelta: d(disc.paceDeltaC),
        daysToCatchUp: c.analytics.daysToCatchUp,
      },
      fixed: { budget: d(c.fixed.expectedC), actual: d(c.fixed.actualC) },
      amortized: { budget: d(c.amortized.reservedMonthlyC), actual: d(c.amortized.paidThisMonthC) },
      analytics: {
        today: d(c.analytics.todayC),
        yesterday: d(c.analytics.yesterdayC),
        last7: d(c.analytics.last7C),
      },
      reimbursed: d(disc.reimbursedC),
      savings: d(c.savingsC),
      estimateAdjustment: d(disc.estimateAdjustmentC),
      funds: c.funds.map((f) => ({
        name: f.name,
        balance: d(f.balanceC),
        drawnThisMonth: d(f.drawnThisMonthC),
      })),
      recentMonths, // [{ month: "YYYY-MM-01", total, fullBudget }] newest first
      needsReview: c.needsReviewCount,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
