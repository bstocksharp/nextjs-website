// ─────────────────────────────────────────────────────────────────────────────
// Budget — Scriptable widget for the Finance hub.
// A THIN SHELL: the app does all the budgeting; this just fetches
// /api/finance/widget and renders it in the look you already had — the
// background-gradient spend bar with the pace tick, REMAINING / SPENT / pace,
// and a tap-to-open detail view (Scriptable presents it large when you tap).
//
// SETUP (once):
//   1. App → Finance → Connections → New token → "Read the budget widget".
//      Copy the fin_… secret (shown once).
//   2. Paste it into TOKEN below (BASE is already your domain).
//   3. Scriptable → + → paste this whole file → name it "Budget".
//   4. Home screen → add a Scriptable widget (Small = the bar view) → Edit
//      Widget → Script: Budget. Tap the widget any time for the full breakdown.
// ─────────────────────────────────────────────────────────────────────────────

const BASE = "https://bryce-sharp.vercel.app";
const TOKEN = "fin_PASTE_YOUR_WIDGET_TOKEN";

const COLORS = {
  underBudget: "#3E9841",
  overBudget: "#ae0000ff",
  background: "#000000",
  indicator: "#FFFFFF",
  textPrimary: "#FFFFFF",
  textSecondary: "#D3D3D3",
  textGray: "#808080",
  warning: "#FFA500",
  danger: "#FF0000",
  widgetBackground: "#1C1C1E",
};

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const C = (hex) => new Color(hex);
const money = (n) => `$${Number(n).toFixed(2)}`;
const safePct = (num, denom) => (denom ? Math.round((num / denom) * 100) : 0);

function formatMonthLabel(key) {
  const [y, mo] = key.split("-");
  return `${MONTH_NAMES[parseInt(mo, 10) - 1]} ${y}`;
}

function addLine(widget, text, opts = {}) {
  const node = widget.addText(text);
  if (opts.font) node.font = opts.font;
  if (opts.color) node.textColor = opts.color instanceof Color ? opts.color : new Color(opts.color);
  return node;
}

async function loadData() {
  const req = new Request(`${BASE}/api/finance/widget`);
  req.headers = { Authorization: `Bearer ${TOKEN}` };
  req.timeoutInterval = 15;
  const json = await req.loadJSON();
  if (!json || json.ok !== true) throw new Error("Bad response — check the token.");
  return json;
}

// The signature background bar: green fill up to actual spend, a white pace tick
// at "where you should be today", red styling once you cross the tick.
function buildGradient(actualSpendRatio, plannedThresholdRatio) {
  const tickWidth = 0.005;
  const g = new LinearGradient();
  const tickEnd = Math.min(plannedThresholdRatio + tickWidth, 1);
  const tickStart = tickEnd - tickWidth;

  if (actualSpendRatio < plannedThresholdRatio) {
    const safeTickStart = Math.max(tickStart, actualSpendRatio);
    g.locations = [0, actualSpendRatio, actualSpendRatio, safeTickStart, safeTickStart, tickEnd, tickEnd, 1];
    g.colors = [
      C(COLORS.underBudget), C(COLORS.underBudget),
      C(COLORS.background), C(COLORS.background),
      C(COLORS.indicator), C(COLORS.indicator),
      C(COLORS.background), C(COLORS.background),
    ];
  } else {
    const overEnd = Math.max(actualSpendRatio, tickEnd);
    g.locations = [0, tickStart, tickStart, tickEnd, tickEnd, overEnd, overEnd, 1];
    g.colors = [
      C(COLORS.overBudget), C(COLORS.overBudget),
      C(COLORS.indicator), C(COLORS.indicator),
      C(COLORS.overBudget), C(COLORS.overBudget),
      C(COLORS.background), C(COLORS.background),
    ];
  }
  g.startPoint = new Point(0, 0);
  g.endPoint = new Point(1, 0);
  return g;
}

// ── Compact (home/lock screen) ────────────────────────────────────────────────
function buildCompact(d) {
  const disc = d.discretionary;
  // The bar is DISCRETIONARY: spent vs your spending budget, with the tick at
  // where you should be by today. Fixed/amortized never touch it (they're in
  // the tap-detail) — the bar is only the money you actually steer.
  const actualSpendRatio = disc.budget > 0 ? Math.min(Math.max(disc.spent / disc.budget, 0), 1) : 0;
  const plannedThresholdRatio = d.daysInMonth > 0 ? Math.min(d.day / d.daysInMonth, 1) : 0;

  const widget = new ListWidget();
  widget.backgroundColor = C(COLORS.background);
  widget.backgroundGradient = buildGradient(actualSpendRatio, plannedThresholdRatio);
  // No widget.url on purpose: tapping runs the script in-app (config.runsInApp),
  // which presents the detail view — your beloved tap-to-details behavior.
  widget.addSpacer(12);

  addLine(widget, "REMAINING", { font: Font.semiboldSystemFont(14), color: COLORS.textSecondary });
  addLine(widget, money(disc.remaining), {
    font: Font.boldSystemFont(28),
    color: disc.remaining < 0 ? COLORS.danger : COLORS.textPrimary,
  });

  widget.addSpacer(12);

  addLine(widget, "SPENT", { font: Font.semiboldSystemFont(9), color: COLORS.textSecondary });
  addLine(widget, money(disc.spent), {
    font: Font.systemFont(13),
    color: disc.spent > disc.budget ? COLORS.danger : COLORS.textPrimary,
  });

  widget.addSpacer(5);

  const behind = disc.paceDelta < 0;
  addLine(widget, behind ? "OVER PACE BY" : "CAN SPEND TODAY", {
    font: Font.semiboldSystemFont(9),
    color: COLORS.textSecondary,
  });
  addLine(widget, money(Math.abs(disc.paceDelta)), {
    font: Font.systemFont(13),
    color: COLORS.textPrimary,
  });

  widget.addSpacer(8);
  return widget;
}

// ── Detail (tap → presentLarge) ───────────────────────────────────────────────
// Leads with the discretionary spend (same story as the compact bar), then the
// committed bills / funds / history as "everything else" context.
function buildDetail(d) {
  const disc = d.discretionary;
  const w = new ListWidget();
  w.backgroundColor = C(COLORS.widgetBackground);

  const fontHeadline = Font.boldSystemFont(18);
  const fontPace = Font.boldSystemFont(16);
  const fontBody = Font.systemFont(12);
  const yellow = Color.yellow();

  addLine(w, `Spend: ${money(disc.spent)} / ${money(disc.budget)} (${safePct(disc.spent, disc.budget)}%)`, {
    font: fontHeadline,
    color: disc.spent > disc.budget ? COLORS.danger : COLORS.textPrimary,
  });
  addLine(w, `Left to spend: ${money(disc.remaining)}`, {
    font: fontPace,
    color: disc.remaining < 0 ? COLORS.danger : COLORS.underBudget,
  });

  if (disc.paceDelta >= 0) {
    addLine(w, `Under pace by: ${money(disc.paceDelta)}`, { font: fontBody, color: COLORS.underBudget });
  } else {
    addLine(w, `Over pace by: ${money(-disc.paceDelta)}`, { font: fontBody, color: COLORS.danger });
    if (disc.daysToCatchUp > 0 && disc.daysToCatchUp <= d.daysLeft) {
      addLine(w, `Days till back in the green: ${disc.daysToCatchUp}`, { font: fontBody, color: COLORS.textSecondary });
    } else if (disc.daysToCatchUp > d.daysLeft) {
      addLine(w, `No way to catch up this month!`, { font: fontBody, color: COLORS.danger });
    }
  }

  w.addSpacer(10);
  const todayOverDaily = d.analytics.today > disc.perDay;
  addLine(w, `Today: ${money(d.analytics.today)} / ${money(disc.perDay)} daily`, {
    font: fontBody,
    color: todayOverDaily ? COLORS.danger : COLORS.underBudget,
  });
  addLine(w, `Yesterday: ${money(d.analytics.yesterday)}`, { font: fontBody, color: COLORS.textSecondary });
  addLine(w, `This week: ${money(d.analytics.last7)}`, { font: fontBody, color: COLORS.textSecondary });
  addLine(w, d.daysLeft > 0 ? `Days left: ${d.daysLeft}` : `Last day of the month!`, { font: fontBody, color: COLORS.textSecondary });

  // Committed bills that posted this month — context, NOT part of the spend bar.
  if (d.billed && (d.billed.fixed > 0 || d.billed.amortized > 0)) {
    w.addSpacer(8);
    addLine(w, `Also billed — Fixed ${money(d.billed.fixed)} · Amortized ${money(d.billed.amortized)}`, {
      font: fontBody,
      color: COLORS.textSecondary,
    });
  }

  w.addSpacer(10);
  for (const f of d.funds || []) {
    const spentThisMonth = f.drawnThisMonth;
    const leftAfter = f.balance;
    const leftToSpend = f.balance + f.drawnThisMonth;
    if (leftAfter < 10 && spentThisMonth === 0) continue; // hide spent-out, idle funds
    if (leftToSpend > 0) {
      addLine(w, `${f.name}: ${money(spentThisMonth)} / ${money(leftToSpend)} left: ${money(leftAfter)}`, { font: fontBody, color: yellow });
    } else {
      addLine(w, `${f.name}: OVERDRAWN by ${money(-leftAfter)}`, { font: fontBody, color: COLORS.danger });
    }
  }

  if (d.reimbursed > 0) addLine(w, `Reimbursed back this month: ${money(d.reimbursed)}`, { font: fontBody, color: yellow });
  if (d.savings > 0) addLine(w, `Paid from savings: ${money(d.savings)}`, { font: fontBody, color: yellow });
  if (d.estimateAdjustment !== 0) addLine(w, `Fixed budget adjustments: ${money(d.estimateAdjustment)}`, { font: fontBody, color: yellow });

  // Recent months — discretionary spent vs budget (same lens as the bar).
  if (d.recentMonths && d.recentMonths.length) {
    w.addSpacer(8);
    addLine(w, `Recent months (spend):`, { font: fontBody, color: COLORS.textSecondary });
    for (const entry of d.recentMonths) {
      const pct = safePct(entry.spent, entry.budget);
      const delta = entry.spent - entry.budget;
      const arrow = delta <= 0 ? "▼" : "▲";
      addLine(w, `  ${formatMonthLabel(entry.month)}: ${money(entry.spent)} (${pct}%) ${arrow}${money(Math.abs(delta))}`, {
        font: fontBody,
        color: delta <= 0 ? COLORS.underBudget : COLORS.danger,
      });
    }
  }

  if (d.needsReview > 0) {
    w.addSpacer(8);
    addLine(w, `⚠ ${d.needsReview} transaction(s) need review`, { font: fontBody, color: COLORS.warning });
  }
  return w;
}

function errorWidget(msg) {
  const w = new ListWidget();
  w.backgroundColor = C(COLORS.background);
  w.addSpacer();
  addLine(w, "⚠ Budget", { font: Font.semiboldSystemFont(15), color: COLORS.textPrimary });
  addLine(w, msg, { font: Font.systemFont(11), color: COLORS.textSecondary });
  w.addSpacer();
  return w;
}

// ── Main ──────────────────────────────────────────────────────────────────────
let data = null;
let err = null;
try {
  data = await loadData();
} catch (e) {
  err = String((e && e.message) || e);
}

if (config.runsInApp) {
  await (data ? buildDetail(data) : errorWidget(err)).presentLarge();
} else {
  Script.setWidget(data ? buildCompact(data) : errorWidget(err));
}
Script.complete();
