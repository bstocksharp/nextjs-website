"use client";

import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { formatCashFlow, formatMoney, formatMonth } from "@/lib/format";

// The deep numbers, now an INLINE expander inside the Insights card (not its own
// card). The spend lanes + pace moved up to the Summary; what's left is the
// granular stuff you only occasionally want: recent daily spend, income by
// source, credits/set-asides, and the last few months.
export type BudgetAnalyticsData = {
  isCurrentMonth: boolean;
  reimbursed: number;
  savings: number;
  income: { total: number; bySource: { source: string; amount: number }[] };
  today: number;
  yesterday: number;
  last7: number;
  recentMonths: { month: string; spent: number; budget: number; remaining: number }[];
};

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

function MoreDetails({ children }: { children: React.ReactNode }) {
  return (
    <Accordion
      disableGutters
      square
      elevation={0}
      sx={{
        bgcolor: "transparent",
        border: 0,
        "&:before": { display: "none" },
        "& .MuiAccordionSummary-root": { px: 0, minHeight: 0 },
        "& .MuiAccordionDetails-root": { px: 0 },
      }}
    >
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography variant="body2" color="text.secondary" fontWeight={600}>
          More details
        </Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Stack spacing={2.5}>{children}</Stack>
      </AccordionDetails>
    </Accordion>
  );
}

export type CashFlowDetailsData = {
  lanes: { category: string; moneyIn: number; moneyOut: number }[];
  sources: { source: string | null; category: string; amount: number }[];
  recent: { month: string; moneyIn: number; moneyOut: number }[];
};

const LANES: [category: string, label: string][] = [
  ["discretionary", "Discretionary"],
  ["fixed", "Fixed bills"],
  ["amortized", "Amortized bills paid"],
  ["savings", "Paid from savings"],
  ["fund", "Fund purchases"],
];

// The All-money counterpart: money out by engine lane, money in by source
// (reimbursements pooled on one line), and the last few months' in/out.
export function CashFlowDetails({ d }: { d: CashFlowDetailsData }) {
  const outByLane = new Map(d.lanes.map((l) => [l.category, l.moneyOut]));
  const income = d.sources.filter((s) => s.category === "income");
  const reimbursed = d.sources
    .filter((s) => s.category === "reimbursement")
    .reduce((sum, s) => sum + s.amount, 0);

  return (
    <MoreDetails>
      <Section title="Money out by type">
        {LANES.filter(([c]) => (outByLane.get(c) ?? 0) !== 0).map(([c, label]) => (
          <Row key={c} label={label} value={formatMoney(outByLane.get(c) ?? 0)} />
        ))}
      </Section>

      {income.length > 0 || reimbursed !== 0 ? (
        <Section title="Money in">
          {income.map((s) => (
            <Row key={s.source ?? "—"} label={s.source ?? "—"} value={formatMoney(s.amount)} />
          ))}
          {reimbursed !== 0 ? <Row label="Reimbursements" value={formatMoney(reimbursed)} /> : null}
        </Section>
      ) : null}

      {d.recent.length > 0 ? (
        <Section title="Recent months">
          {[...d.recent].reverse().map((m) => (
            <Row
              key={m.month}
              label={formatMonth(m.month)}
              value={formatCashFlow(m.moneyIn, m.moneyOut)}
              color={m.moneyIn - m.moneyOut < 0 ? "warning.main" : undefined}
            />
          ))}
        </Section>
      ) : null}
    </MoreDetails>
  );
}

export default function BudgetAnalytics({ d }: { d: BudgetAnalyticsData }) {
  return (
    <MoreDetails>
      {d.isCurrentMonth ? (
        <Section title="Spending lately">
          <Row label="Today" value={formatMoney(d.today)} />
          <Row label="Yesterday" value={formatMoney(d.yesterday)} />
          <Row label="This week" value={formatMoney(d.last7)} />
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
        <Section title="Credits & off-budget">
          {d.reimbursed > 0 ? (
            <Row label="Reimbursed back" value={formatMoney(d.reimbursed)} color="success.main" />
          ) : null}
          {d.savings > 0 ? <Row label="Paid from savings" value={formatMoney(d.savings)} /> : null}
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
    </MoreDetails>
  );
}
