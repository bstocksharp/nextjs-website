"use client";

import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import LinearProgress from "@mui/material/LinearProgress";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import InsightsIcon from "@mui/icons-material/Insights";
import { formatMoney, formatMonth } from "@/lib/format";

export type BudgetAnalyticsData = {
  isCurrentMonth: boolean;
  totalSpent: number;
  totalPlan: number;
  discretionary: { spent: number; budget: number };
  fixed: { actual: number; expected: number };
  amortized: { paid: number; reserved: number };
  reimbursed: number;
  savings: number;
  income: { total: number; bySource: { source: string; amount: number }[] };
  paceDelta: number; // + under, − over
  daysToCatchUp: number;
  daysLeft: number;
  today: number;
  yesterday: number;
  last7: number;
  biggest: { merchant: string; amount: number } | null;
  topMerchant: { merchant: string; total: number } | null;
  recentMonths: { month: string; spent: number; budget: number; remaining: number }[];
};

const p = (a: number, b: number) => (b > 0 ? Math.round((a / b) * 100) : 0);

// A titled group of rows, gist-style.
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Box>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}
      >
        {title}
      </Typography>
      <Stack spacing={0.75} sx={{ mt: 0.75 }}>
        {children}
      </Stack>
    </Box>
  );
}

function Row({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <Stack direction="row" justifyContent="space-between" spacing={2}>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={600} color={color} sx={{ textAlign: "right" }}>
        {value}
      </Typography>
    </Stack>
  );
}

// A spend lane with a labeled bar: "$spent / $budget · z%". Amber past 100%.
function Lane({ label, spent, budget }: { label: string; spent: number; budget: number }) {
  const pc = p(spent, budget);
  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.25 }}>
        <Typography variant="body2">{label}</Typography>
        <Typography variant="body2" color="text.secondary">
          {formatMoney(spent)} / {formatMoney(budget)} · {pc}%
        </Typography>
      </Stack>
      <LinearProgress
        variant="determinate"
        value={Math.min(100, pc)}
        color={pc > 100 ? "warning" : "primary"}
        sx={{ height: 6, borderRadius: 3 }}
      />
    </Box>
  );
}

// The gist's detailed view, grouped into tidy sections behind a "Details"
// accordion. Pace/time rows show only for the live month; past months keep the
// category lanes + totals + history.
export default function BudgetAnalytics({ d }: { d: BudgetAnalyticsData }) {
  const behind = d.paceDelta < 0;

  return (
    <Accordion variant="outlined" sx={{ mt: 3, "&:before": { display: "none" } }} disableGutters>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Stack direction="row" spacing={1} alignItems="center">
          <InsightsIcon fontSize="small" color="action" />
          <Typography variant="h6">Details</Typography>
        </Stack>
      </AccordionSummary>
      <AccordionDetails>
        <Stack spacing={2.5}>
          <Section title="This month">
            <Row
              label="Total spent"
              value={`${formatMoney(d.totalSpent)} / ${formatMoney(d.totalPlan)} · ${p(d.totalSpent, d.totalPlan)}%`}
            />
            <Box sx={{ pt: 0.5 }}>
              <Stack spacing={1.25}>
                <Lane label="Discretionary" spent={d.discretionary.spent} budget={d.discretionary.budget} />
                {d.fixed.expected > 0 ? (
                  <Lane label="Fixed bills" spent={d.fixed.actual} budget={d.fixed.expected} />
                ) : null}
                {d.amortized.reserved > 0 ? (
                  <Lane label="Amortized (reserved)" spent={d.amortized.paid} budget={d.amortized.reserved} />
                ) : null}
              </Stack>
            </Box>
          </Section>

          {d.isCurrentMonth ? (
            <Section title="Pace">
              <Row
                label={behind ? "Over pace by" : "Under pace by"}
                value={formatMoney(Math.abs(d.paceDelta))}
                color={behind ? "warning.main" : "success.main"}
              />
              {d.daysToCatchUp > 0 ? (
                <Row label="Days till back in the green" value={`${d.daysToCatchUp}`} color="warning.main" />
              ) : null}
              <Row label="Days left this month" value={d.daysLeft === 0 ? "Last day!" : `${d.daysLeft}`} />
            </Section>
          ) : null}

          {d.isCurrentMonth ? (
            <Section title="Spending lately">
              <Row label="Today" value={formatMoney(d.today)} />
              <Row label="Yesterday" value={formatMoney(d.yesterday)} />
              <Row label="This week" value={formatMoney(d.last7)} />
            </Section>
          ) : null}

          {d.biggest || d.topMerchant ? (
            <Section title="Highlights">
              {d.biggest ? (
                <Row label="Biggest purchase" value={`${d.biggest.merchant} · ${formatMoney(d.biggest.amount)}`} />
              ) : null}
              {d.topMerchant ? (
                <Row label="Top spot this month" value={`${d.topMerchant.merchant} · ${formatMoney(d.topMerchant.total)}`} />
              ) : null}
            </Section>
          ) : null}

          {d.income.total > 0 ? (
            <Section title="Income">
              <Row label="Total in" value={formatMoney(d.income.total)} color="success.main" />
              {d.income.bySource.map((s) => (
                <Row key={s.source} label={s.source} value={formatMoney(s.amount)} />
              ))}
            </Section>
          ) : null}

          {d.reimbursed > 0 || d.savings > 0 ? (
            <Section title="Credits & set-asides">
              {d.reimbursed > 0 ? (
                <Row label="Reimbursed back" value={formatMoney(d.reimbursed)} color="success.main" />
              ) : null}
              {d.savings > 0 ? <Row label="To savings" value={formatMoney(d.savings)} /> : null}
            </Section>
          ) : null}

          {d.recentMonths.length > 0 ? (
            <Section title="Recent months">
              {d.recentMonths.map((m) => (
                <Row
                  key={m.month}
                  label={formatMonth(m.month)}
                  value={`${formatMoney(m.spent)} / ${formatMoney(m.budget)} · ${m.remaining >= 0 ? "left " : "over "}${formatMoney(Math.abs(m.remaining))}`}
                  color={m.remaining >= 0 ? undefined : "warning.main"}
                />
              ))}
            </Section>
          ) : null}
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
}
