"use client";

import * as React from "react";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import StarBorderRoundedIcon from "@mui/icons-material/StarBorderRounded";
import { formatMoney, formatMoneySigned, formatMonth } from "@/lib/format";
import DeleteIconButton from "@/components/shared/DeleteIconButton";
import { deleteMonthSnapshotsAction } from "@/app/actions/finance-networth";
import SnapshotDialog, { type SnapshotAccount } from "./SnapshotDialog";

// The sheet, as a table: months (newest first) × accounts, with Total and MoM.
// The pencil re-opens the snapshot dialog prefilled for that month — fixing a
// forgotten November recomputes every derived number instantly (nothing is
// cached; see lib/queries/finance-networth).
export default function SnapshotHistoryTable({
  months,
  windowStart,
  accounts,
  balances,
  totals,
  mom,
  balancesByMonth,
  yearOptions,
  editor,
}: {
  months: string[]; // ascending, baseline first when present
  windowStart: number;
  accounts: SnapshotAccount[];
  balances: Record<number, (number | null)[]>;
  totals: number[];
  mom: (number | null)[];
  balancesByMonth: Record<string, Record<number, number | null>>;
  yearOptions: number[];
  editor: boolean;
}) {
  const [editing, setEditing] = React.useState<number | null>(null); // months index

  const rows = months.map((_, i) => i).reverse(); // newest first

  return (
    <>
      <TableContainer component={Paper} variant="outlined" sx={{ overflowX: "auto" }}>
        <Table size="small" sx={{ minWidth: 640 }}>
          <TableHead>
            <TableRow>
              <TableCell>Month</TableCell>
              {accounts.map((a) => (
                <TableCell key={a.id} align="right">
                  {a.name}
                </TableCell>
              ))}
              <TableCell align="right" sx={{ fontWeight: 700 }}>
                Total
              </TableCell>
              <TableCell align="right">MoM</TableCell>
              {editor ? <TableCell align="right" /> : null}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((i) => (
              <TableRow key={months[i]} hover>
                <TableCell sx={{ whiteSpace: "nowrap" }}>
                  <Box
                    component="span"
                    sx={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 0.5,
                      color: i < windowStart ? "text.secondary" : undefined,
                    }}
                  >
                    {formatMonth(months[i])}
                    {i < windowStart ? (
                      <Tooltip title="Baseline — the starting point growth is measured from">
                        <StarBorderRoundedIcon
                          sx={{ fontSize: 16, color: "warning.main" }}
                        />
                      </Tooltip>
                    ) : null}
                  </Box>
                </TableCell>
                {accounts.map((a) => {
                  const v = balances[a.id]?.[i] ?? null;
                  return (
                    <TableCell
                      key={a.id}
                      align="right"
                      sx={{ color: v == null ? "text.disabled" : undefined }}
                    >
                      {v == null ? "—" : formatMoney(v)}
                    </TableCell>
                  );
                })}
                <TableCell align="right" sx={{ fontWeight: 700 }}>
                  {formatMoney(totals[i])}
                </TableCell>
                <TableCell
                  align="right"
                  sx={{
                    whiteSpace: "nowrap",
                    color:
                      mom[i] == null || mom[i] === 0
                        ? "text.disabled"
                        : mom[i]! > 0
                          ? "success.main"
                          : "warning.main",
                  }}
                >
                  {mom[i] == null ? "—" : formatMoneySigned(mom[i]!)}
                </TableCell>
                {editor ? (
                  <TableCell align="right">
                    <Stack direction="row" justifyContent="flex-end">
                      <Tooltip title={`Edit ${formatMonth(months[i])}`}>
                        <IconButton
                          size="small"
                          onClick={() => setEditing(i)}
                          aria-label={`Edit ${formatMonth(months[i])}`}
                        >
                          <EditOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <DeleteIconButton
                        action={deleteMonthSnapshotsAction.bind(null, months[i])}
                        confirmMessage={`Delete the entire ${formatMonth(months[i])} row (every account's balance for that month)?`}
                        label={`Delete ${formatMonth(months[i])}`}
                      />
                    </Stack>
                  </TableCell>
                ) : null}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {editing !== null ? (
        <SnapshotDialog
          open
          onClose={() => setEditing(null)}
          accounts={accounts}
          month={months[editing].slice(0, 7)}
          balancesByMonth={balancesByMonth}
          yearOptions={yearOptions}
          title={`Edit ${formatMonth(months[editing])}`}
        />
      ) : null}
    </>
  );
}
