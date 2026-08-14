"use client";

import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import { formatMoney, formatDate } from "@/lib/format";

export type TxnFund = { id: number; name: string };
export type TxnBill = { id: number; name: string; paymentsPerYear: number };
export type TxnRowData = {
  id: number;
  postedOn: string;
  merchant: string | null;
  amount: number;
  originalAmount: number;
  category: string;
  spendCategory: string | null;
  fundId: number | null;
  recurringExpenseId: number | null;
  needsReview: boolean;
  note: string | null;
  source: string;
};

export const CATEGORY_OPTIONS: { value: string; label: string }[] = [
  { value: "discretionary", label: "Discretionary" },
  { value: "fixed", label: "Fixed bill" },
  { value: "amortized", label: "Amortized" },
  { value: "savings", label: "Savings" },
  { value: "reimbursement", label: "Reimbursement" },
  { value: "fund", label: "Fund" },
  { value: "income", label: "Income" },
];
// "ignored" still renders if any legacy row has it, but it's no longer offered.
const CATEGORY_LABEL: Record<string, string> = {
  ...Object.fromEntries(CATEGORY_OPTIONS.map((c) => [c.value, c.label])),
  ignored: "Excluded",
};

// Money IN (raises what you can spend) vs OUT vs neutral transfers.
const INFLOW = new Set(["income", "reimbursement"]);
const NEUTRAL = new Set(["ignored"]);
// Direction of the row by MEANING, not raw sign: money into your pocket OR into
// a fund reads green "+", money out reads red — magnitude always positive, so a
// fund deposit (stored negative) never shows as a baffling red "-$100".
function direction(category: string, amount: number): "in" | "out" | "neutral" {
  if (NEUTRAL.has(category)) return "neutral";
  if (INFLOW.has(category)) return "in";
  if (category === "fund") return amount < 0 ? "in" : "out"; // deposit vs draw
  return amount < 0 ? "in" : "out"; // a refund on a spend row is money back
}
function amountColor(dir: "in" | "out" | "neutral"): string {
  if (dir === "in") return "success.main";
  if (dir === "neutral") return "text.secondary";
  return "error.main";
}
function chipColor(category: string): "primary" | "success" | "warning" | "default" {
  if (category === "discretionary") return "primary";
  if (INFLOW.has(category)) return "success";
  if (NEUTRAL.has(category)) return "default";
  return "warning";
}

// A display-only transaction row. All editing happens behind the ⋮ menu (its
// dialog), so the table reads cleanly: date · merchant · formatted amount
// (green in / red out) · category chip. `onMenu` present ⇒ editable.
export default function TransactionRow({
  txn,
  funds,
  onMenu,
}: {
  txn: TxnRowData;
  funds: TxnFund[];
  onMenu?: (txn: TxnRowData, anchor: HTMLElement) => void;
}) {
  const adjusted = txn.amount !== txn.originalAmount;
  const fundName = txn.fundId ? funds.find((f) => f.id === txn.fundId)?.name : null;
  const dir = direction(txn.category, txn.amount);

  return (
    <TableRow hover sx={{ bgcolor: txn.needsReview ? "action.hover" : undefined }}>
      <TableCell sx={{ whiteSpace: "nowrap", color: "text.secondary" }}>
        {formatDate(txn.postedOn)}
      </TableCell>

      <TableCell sx={{ maxWidth: 240 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
          {txn.needsReview ? (
            <Tooltip title="Couldn't read this one — open the ⋮ menu to set its details">
              <WarningAmberIcon fontSize="small" color="warning" />
            </Tooltip>
          ) : null}
          <Box sx={{ minWidth: 0 }}>
            <Box sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {txn.merchant ?? (txn.needsReview ? "Unreadable alert" : "—")}
            </Box>
            {fundName || txn.note ? (
              <Box
                sx={{
                  fontSize: 12,
                  color: "text.secondary",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {fundName ? `→ ${fundName}` : ""}
                {fundName && txn.note ? " · " : ""}
                {txn.note ?? ""}
              </Box>
            ) : null}
          </Box>
        </Box>
      </TableCell>

      <TableCell align="right" sx={{ whiteSpace: "nowrap", color: amountColor(dir), fontWeight: 600 }}>
        {dir === "in" ? "+" : ""}
        {formatMoney(Math.abs(txn.amount))}
        {adjusted ? (
          <Tooltip title={`Adjusted from ${formatMoney(txn.originalAmount)}`}>
            <Box component="span" sx={{ color: "text.disabled", ml: 0.25 }}>
              *
            </Box>
          </Tooltip>
        ) : null}
      </TableCell>

      <TableCell>
        <Stack direction="row" spacing={0.5} sx={{ flexWrap: "wrap", rowGap: 0.5 }}>
          <Chip
            size="small"
            variant="outlined"
            color={chipColor(txn.category)}
            label={CATEGORY_LABEL[txn.category] ?? txn.category}
          />
          {txn.spendCategory ? (
            <Chip size="small" label={txn.spendCategory} sx={{ bgcolor: "action.selected" }} />
          ) : null}
        </Stack>
      </TableCell>

      {onMenu ? (
        <TableCell align="right">
          <IconButton
            size="small"
            onClick={(e) => onMenu(txn, e.currentTarget)}
            aria-label="Transaction actions"
          >
            <MoreVertIcon fontSize="small" />
          </IconButton>
        </TableCell>
      ) : null}
    </TableRow>
  );
}
