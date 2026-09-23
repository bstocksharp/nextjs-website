"use client";

import type * as React from "react";
import Box from "@mui/material/Box";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import { formatMoney } from "@/lib/format";
import type { MonthReport as Report, ReportLine } from "@/lib/finance/month-report";

// How a line's difference reads: money in is "more/less", spending lines are
// "under/over", unplanned spending just shows what it took.
function differenceText(l: ReportLine): string {
  const x = formatMoney(Math.abs(l.effect));
  if (l.planned === null && Math.abs(l.actual) < 0.005) return "—";
  if (Math.abs(l.effect) < 0.005) return "on plan";
  if (l.key === "in") return l.effect > 0 ? `+${x} more` : `${x} less`;
  if (l.planned === null) return `−${x}`;
  return l.effect > 0 ? `${x} under` : `${x} over`;
}

const num = { whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" } as const;
// Phones drop the Planned column and tuck the plan under Actual instead.
const plannedCol = { display: { xs: "none", sm: "table-cell" } } as const;

function PhonePlan({ children }: { children: React.ReactNode }) {
  return (
    <Box component="span" sx={{ display: { xs: "block", sm: "none" }, fontSize: 11, fontWeight: 400, color: "text.secondary" }}>
      {children}
    </Box>
  );
}

// The month's budget report: planned vs actual per line, the differences
// summing to kept vs the savings goal, and a one-line "why".
export default function MonthReport({ report, inProgress }: { report: Report; inProgress?: boolean }) {
  const { kept } = report;
  return (
    <Box>
      <Box sx={{ overflowX: "auto" }}>
        <Table size="small" sx={{ "& td, & th": { px: { xs: 0.75, sm: 1.5 } } }}>
          <TableHead>
            <TableRow>
              <TableCell />
              <TableCell align="right" sx={plannedCol}>
                Planned
              </TableCell>
              <TableCell align="right">Actual</TableCell>
              <TableCell align="right">Difference</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {report.lines.map((l) => (
              <TableRow key={l.key}>
                <TableCell>
                  <Typography variant="body2">{l.label}</Typography>
                  {l.note ? (
                    <Typography variant="caption" color="text.secondary">
                      {l.note}
                    </Typography>
                  ) : null}
                </TableCell>
                <TableCell align="right" sx={{ ...num, ...plannedCol }}>
                  {l.planned === null ? "—" : formatMoney(l.planned)}
                </TableCell>
                <TableCell align="right" sx={num}>
                  {formatMoney(l.actual)}
                  {l.planned !== null ? <PhonePlan>of {formatMoney(l.planned)}</PhonePlan> : null}
                </TableCell>
                <TableCell
                  align="right"
                  sx={{ ...num, fontWeight: 600, color: l.effect < -0.005 ? "warning.main" : undefined }}
                >
                  {differenceText(l)}
                </TableCell>
              </TableRow>
            ))}
            <TableRow sx={{ "& td": { borderBottom: 0, fontWeight: 700 } }}>
              <TableCell>{kept.goal > 0 ? "Kept vs savings goal" : "Kept"}</TableCell>
              <TableCell align="right" sx={{ ...num, ...plannedCol }}>
                {kept.goal > 0 ? formatMoney(kept.goal) : "—"}
              </TableCell>
              <TableCell align="right" sx={num}>
                {formatMoney(kept.actual)}
                {kept.goal > 0 ? <PhonePlan>goal {formatMoney(kept.goal)}</PhonePlan> : null}
              </TableCell>
              <TableCell align="right" sx={{ ...num, color: kept.diff < -0.005 ? "warning.main" : undefined }}>
                {kept.goal > 0
                  ? `${formatMoney(Math.abs(kept.diff))} ${kept.diff < 0 ? "short" : "ahead"}`
                  : ""}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Box>
      <Typography variant="body2" sx={{ mt: 1.5, px: 1.5, py: 1, bgcolor: "action.hover", borderRadius: 1 }}>
        {report.verdict}
      </Typography>
      {inProgress ? (
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
          Month in progress: bills and paychecks still to come show as under plan until they post.
        </Typography>
      ) : null}
    </Box>
  );
}
