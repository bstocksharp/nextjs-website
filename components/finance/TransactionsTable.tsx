"use client";

import * as React from "react";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import Chip from "@mui/material/Chip";
import AddIcon from "@mui/icons-material/Add";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import TransactionRow, {
  type TxnRowData,
  type TxnFund,
  type TxnBill,
} from "./TransactionRow";
import TransactionDetailDialog from "./TransactionDetailDialog";
import AddTransactionDialog from "./AddTransactionDialog";
import { deleteTransactionAction } from "@/app/actions/finance-budget";

export type TxnAccount = { id: number; name: string };

// The transaction ledger — the app's center of gravity. SMS-seeded and manual
// rows together, newest first; recategorize/adjust inline (TransactionRow), or
// open the ⋮ for the rarer edits + delete. Review rows float to a callout so
// they don't hide in the list.
export default function TransactionsTable({
  txns,
  funds,
  bills,
  accounts,
  merchants,
  sources,
  editable,
}: {
  txns: TxnRowData[];
  funds: TxnFund[];
  bills: TxnBill[];
  accounts: TxnAccount[];
  merchants: string[];
  sources: string[];
  editable: boolean;
}) {
  const [menu, setMenu] = React.useState<{ txn: TxnRowData; anchor: HTMLElement } | null>(null);
  const [detail, setDetail] = React.useState<TxnRowData | null>(null);
  const [addOpen, setAddOpen] = React.useState(false);
  const [, startTransition] = React.useTransition();

  const reviewCount = txns.filter((t) => t.needsReview).length;

  function openMenu(txn: TxnRowData, anchor: HTMLElement) {
    setMenu({ txn, anchor });
  }
  function del(txn: TxnRowData) {
    setMenu(null);
    if (window.confirm(`Delete this ${txn.merchant ?? "transaction"}?`)) {
      startTransition(() => deleteTransactionAction(txn.id, new FormData()));
    }
  }

  return (
    <Paper variant="outlined" sx={{ p: { xs: 1.5, sm: 2 } }}>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 1, px: 0.5, flexWrap: "wrap", rowGap: 1 }}
      >
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="h6">Transactions</Typography>
          {reviewCount > 0 ? (
            <Chip size="small" color="warning" label={`${reviewCount} to review`} />
          ) : null}
        </Stack>
        {editable ? (
          <Button size="small" variant="contained" startIcon={<AddIcon />} onClick={() => setAddOpen(true)}>
            Add
          </Button>
        ) : null}
      </Stack>

      {txns.length === 0 ? (
        <Typography color="text.secondary" sx={{ p: 3, textAlign: "center" }}>
          No transactions yet this month.
          {editable ? " Add one, or let your card alerts flow in." : ""}
        </Typography>
      ) : (
        <TableContainer sx={{ overflowX: "auto" }}>
          <Table size="small" sx={{ minWidth: 520 }}>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Merchant</TableCell>
                <TableCell align="right">Amount</TableCell>
                <TableCell>Category</TableCell>
                {editable ? <TableCell align="right" /> : null}
              </TableRow>
            </TableHead>
            <TableBody>
              {txns.map((t) => (
                <TransactionRow
                  key={t.id}
                  txn={t}
                  funds={funds}
                  onMenu={editable ? openMenu : undefined}
                />
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Menu anchorEl={menu?.anchor} open={Boolean(menu)} onClose={() => setMenu(null)}>
        <MenuItem
          onClick={() => {
            if (menu) setDetail(menu.txn);
            setMenu(null);
          }}
        >
          <ListItemIcon>
            <EditOutlinedIcon fontSize="small" />
          </ListItemIcon>
          Edit details
        </MenuItem>
        <MenuItem onClick={() => menu && del(menu.txn)} sx={{ color: "error.main" }}>
          <ListItemIcon>
            <DeleteOutlineIcon fontSize="small" color="error" />
          </ListItemIcon>
          Delete
        </MenuItem>
      </Menu>

      {detail ? (
        <TransactionDetailDialog
          txn={detail}
          funds={funds}
          bills={bills}
          accounts={accounts}
          merchants={merchants}
          sources={sources}
          onClose={() => setDetail(null)}
        />
      ) : null}
      {addOpen ? (
        <AddTransactionDialog
          funds={funds}
          bills={bills}
          accounts={accounts}
          merchants={merchants}
          sources={sources}
          onClose={() => setAddOpen(false)}
        />
      ) : null}
    </Paper>
  );
}
