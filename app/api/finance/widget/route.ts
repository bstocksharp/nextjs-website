import { NextRequest, NextResponse } from "next/server";
import { looksLikeApiToken } from "@/lib/finance/tokens";
import { resolveApiToken, touchApiToken } from "@/lib/queries/finance-tokens";
import { getBudgetMonthForGroup } from "@/lib/queries/finance-budget";
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
  const { computation: c } = await getBudgetMonthForGroup(
    auth.groupId,
    month,
    todayISO(),
  );
  const disc = c.discretionary;

  // Versioned, flat, dollars — the stable contract the Scriptable widget reads.
  return NextResponse.json(
    {
      ok: true,
      version: 1,
      month: month.slice(0, 7),
      day: c.dayOfMonth,
      daysInMonth: c.daysInMonth,
      discretionary: {
        budget: d(disc.budgetC),
        spent: d(disc.netSpentC),
        remaining: d(disc.remainingC),
        perDay: d(disc.perDayC),
        // + = under pace ("can spend"), − = over pace ("catch up").
        paceDelta: d(disc.paceDeltaC),
      },
      spentToDate: d(c.totalOutflowC),
      plannedTick: d(c.plannedTickC),
      fixed: { expected: d(c.fixed.expectedC), actual: d(c.fixed.actualC) },
      funds: c.funds.map((f) => ({ name: f.name, balance: d(f.balanceC) })),
      needsReview: c.needsReviewCount,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
