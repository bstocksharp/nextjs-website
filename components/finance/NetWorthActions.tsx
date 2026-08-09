"use client";

import * as React from "react";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import AddchartIcon from "@mui/icons-material/Addchart";
import TuneIcon from "@mui/icons-material/Tune";
import FlagOutlinedIcon from "@mui/icons-material/FlagOutlined";
import SnapshotDialog, { type SnapshotAccount } from "./SnapshotDialog";
import AccountsManager, { type ManagedAccount } from "./AccountsManager";
import SavingsGoalDialog from "./SavingsGoalDialog";

// Header button cluster (weight's WeightActions role): the monthly Log ritual
// front and center, accounts + goal management tucked beside it. Hosts all
// three dialogs so the (server) page stays dialog-free.
export default function NetWorthActions({
  snapshotAccounts,
  allAccounts,
  defaultMonth,
  balancesByMonth,
  yearOptions,
  activeGoal,
}: {
  snapshotAccounts: SnapshotAccount[];
  allAccounts: ManagedAccount[];
  /** "YYYY-MM" — the current calendar month. */
  defaultMonth: string;
  /** "YYYY-MM" → { accountId: balance }, for the per-month prefill. */
  balancesByMonth: Record<string, Record<number, number | null>>;
  yearOptions: number[];
  activeGoal: { monthlyGoal: number; startMonth: string } | null;
}) {
  const [logOpen, setLogOpen] = React.useState(false);
  const [accountsOpen, setAccountsOpen] = React.useState(false);
  const [goalOpen, setGoalOpen] = React.useState(false);

  return (
    <>
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap justifyContent="flex-end">
        <Button
          variant="contained"
          startIcon={<AddchartIcon />}
          onClick={() => setLogOpen(true)}
          disabled={snapshotAccounts.length === 0}
        >
          Log balances
        </Button>
        <Button
          variant="outlined"
          startIcon={<TuneIcon />}
          onClick={() => setAccountsOpen(true)}
        >
          Accounts
        </Button>
        <Button
          variant="outlined"
          startIcon={<FlagOutlinedIcon />}
          onClick={() => setGoalOpen(true)}
        >
          Goal
        </Button>
      </Stack>

      {logOpen ? (
        <SnapshotDialog
          open
          onClose={() => setLogOpen(false)}
          accounts={snapshotAccounts}
          month={defaultMonth}
          balancesByMonth={balancesByMonth}
          yearOptions={yearOptions}
        />
      ) : null}
      {accountsOpen ? (
        <AccountsManager
          open
          onClose={() => setAccountsOpen(false)}
          accounts={allAccounts}
        />
      ) : null}
      {goalOpen ? (
        <SavingsGoalDialog
          open
          onClose={() => setGoalOpen(false)}
          activeGoal={activeGoal}
          defaultMonth={defaultMonth}
        />
      ) : null}
    </>
  );
}
