"use client";

import * as React from "react";
import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import { useTheme, alpha } from "@mui/material/styles";
import InsightsIcon from "@mui/icons-material/Insights";
import SpendTrendChart from "./SpendTrendChart";
import BudgetAnalytics, { type BudgetAnalyticsData } from "./BudgetAnalytics";
import { formatMoney, formatDate } from "@/lib/format";

export type BudgetInsightsData = {
  trend: {
    days: number[];
    thisMonth: (number | null)[];
    lastMonth: (number | null)[];
    thisLabel: string;
    lastLabel: string;
  };
  topPurchases: { merchant: string; amount: number; date: string }[];
  topMerchants: { merchant: string; total: number; count: number }[];
  details: BudgetAnalyticsData;
};

// A uniform full-width pill — same length for every row (Bryce: proportional
// bars read as noise here; the amount on the right already carries the size).
function PillRow({
  label,
  sub,
  value,
  tint,
}: {
  label: string;
  sub?: string;
  value: string;
  tint: string;
}) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 1,
        borderRadius: 1,
        bgcolor: tint,
        px: 1.25,
        py: 0.75,
        minHeight: 36,
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="body2" noWrap fontWeight={600}>
          {label}
        </Typography>
        {sub ? (
          <Typography
            variant="caption"
            color="text.secondary"
            noWrap
            component="div"
          >
            {sub}
          </Typography>
        ) : null}
      </Box>
      <Typography
        variant="body2"
        fontWeight={700}
        sx={{ whiteSpace: "nowrap" }}
      >
        {value}
      </Typography>
    </Box>
  );
}

function Column({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Box>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          fontWeight: 600,
        }}
      >
        {title}
      </Typography>
      <Stack spacing={0.75} sx={{ mt: 0.75 }}>
        {children}
      </Stack>
    </Box>
  );
}

// The at-a-glance insights: spend-vs-last-month curve, money in vs out (plain
// text), the discretionary top-3s (uniform pills), and the granular numbers
// tucked into an inline "More details" expander — one card, not three.
export default function BudgetInsights({ d }: { d: BudgetInsightsData }) {
  const theme = useTheme();
  const tint = alpha(theme.palette.primary.main, 0.1);

  const hasTop = d.topPurchases.length > 0 || d.topMerchants.length > 0;

  return (
    <Paper variant="outlined" sx={{ p: { xs: 1.5, sm: 2.5 }, mb: 3 }}>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
        <InsightsIcon fontSize="small" color="action" />
        <Typography variant="h6">Insights</Typography>
      </Stack>

      {/* Spend vs last month */}
      <Box sx={{ mt: 1 }}>
        <Typography variant="caption" color="text.secondary">
          Spending so far — {d.trend.thisLabel} vs {d.trend.lastLabel}
        </Typography>
        <SpendTrendChart
          days={d.trend.days}
          thisMonth={d.trend.thisMonth}
          lastMonth={d.trend.lastMonth}
          thisLabel={d.trend.thisLabel}
          lastLabel={d.trend.lastLabel}
        />
      </Box>

      {/* Discretionary top-3s — controllable spend (bills live in the Summary) */}
      {hasTop ? (
        <>
          <Divider sx={{ my: 2 }} />
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
              gap: 2,
            }}
          >
            {d.topPurchases.length > 0 ? (
              <Column title="Top purchases">
                {d.topPurchases.map((p, i) => (
                  <PillRow
                    key={`${p.merchant}-${i}`}
                    label={p.merchant}
                    sub={formatDate(p.date)}
                    value={formatMoney(p.amount)}
                    tint={tint}
                  />
                ))}
              </Column>
            ) : null}
            {d.topMerchants.length > 0 ? (
              <Column title="Top spots">
                {d.topMerchants.map((m, i) => (
                  <PillRow
                    key={`${m.merchant}-${i}`}
                    label={m.merchant}
                    sub={`${m.count} ${m.count === 1 ? "purchase" : "purchases"}`}
                    value={formatMoney(m.total)}
                    tint={tint}
                  />
                ))}
              </Column>
            ) : null}
          </Box>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: "block", mt: 1.5 }}
          >
            Discretionary only
          </Typography>
        </>
      ) : null}

      {/* The granular numbers, inline — not a third card */}
      <Divider sx={{ my: 1.5 }} />
      <BudgetAnalytics d={d.details} />
    </Paper>
  );
}
