"use client";

import * as React from "react";
import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import TransactionRow, { type TxnRowData, type TxnFund } from "./TransactionRow";
import { loadMoreTransactionsAction } from "@/app/actions/finance-transactions";
import type { TxnFilters } from "@/lib/queries/finance-transactions";

// The read-only, infinite-scroll results list. The parent keys this by the
// active filters, so a filter change REMOUNTS it fresh with the server's first
// page; from there an IntersectionObserver pulls older pages via a server action.
export default function TransactionsExplorer({
  filters,
  initialRows,
  initialCursor,
  funds,
}: {
  filters: TxnFilters;
  initialRows: TxnRowData[];
  initialCursor: string | null;
  funds: TxnFund[];
}) {
  const [rows, setRows] = React.useState(initialRows);
  const [cursor, setCursor] = React.useState(initialCursor);
  const [loading, setLoading] = React.useState(false);
  const sentinel = React.useRef<HTMLDivElement | null>(null);
  const loadingRef = React.useRef(false); // guards overlapping fetches

  const loadMore = React.useCallback(async () => {
    if (loadingRef.current || cursor == null) return;
    loadingRef.current = true;
    setLoading(true);
    try {
      const page = await loadMoreTransactionsAction(filters, cursor);
      setRows((prev) => [...prev, ...page.rows]);
      setCursor(page.nextCursor);
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [filters, cursor]);

  React.useEffect(() => {
    const el = sentinel.current;
    if (!el || cursor == null) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore();
      },
      { rootMargin: "400px" }, // prefetch before the sentinel is on screen
    );
    io.observe(el);
    return () => io.disconnect();
  }, [loadMore, cursor]);

  if (rows.length === 0) {
    return (
      <Paper variant="outlined" sx={{ p: 4, textAlign: "center" }}>
        <Typography color="text.secondary">
          No transactions match these filters.
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper variant="outlined" sx={{ p: { xs: 1, sm: 1.5 } }}>
      <TableContainer sx={{ overflowX: "auto" }}>
        <Table size="small" sx={{ minWidth: 520 }}>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Merchant</TableCell>
              <TableCell align="right">Amount</TableCell>
              <TableCell>Category</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((t) => (
              <TransactionRow key={t.id} txn={t} funds={funds} />
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Box ref={sentinel} sx={{ display: "flex", justifyContent: "center", py: 2 }}>
        {loading ? (
          <CircularProgress size={22} />
        ) : cursor == null ? (
          <Typography variant="caption" color="text.secondary">
            End of results
          </Typography>
        ) : null}
      </Box>
    </Paper>
  );
}
