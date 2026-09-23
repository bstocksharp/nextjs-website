"use client";

import * as React from "react";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import SavingsOutlinedIcon from "@mui/icons-material/SavingsOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import SavingsGoalDialog from "./SavingsGoalDialog";
import { formatMoney, formatMonth } from "@/lib/format";

// ATLAS's explicit savings goal: set aside before discretionary, so spending
// your whole discretionary budget still leaves this in the bank. It's the same
// goal Net Worth measures bank-saved accounts against (one setting, two uses).
export default function SavingsGoalCard({
  goal,
  since,
  editable,
  defaultMonth,
  yearOptions,
}: {
  goal: number; // monthly, dollars (0 = none)
  since: string | null; // YYYY-MM-01 the goal in effect started
  editable: boolean;
  defaultMonth: string;
  yearOptions: number[];
}) {
  const [open, setOpen] = React.useState(false);
  const has = goal > 0;

  return (
    <Paper id="savings" variant="outlined" sx={{ p: { xs: 1.5, sm: 2.5 }, mb: 3, scrollMarginTop: 88 }}>
      <Stack direction="row" spacing={1.5} alignItems="center" justifyContent="space-between" sx={{ flexWrap: "wrap", rowGap: 1 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <SavingsOutlinedIcon color="action" />
          <div>
            <Typography variant="h6" component="h2">
              Savings goal
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {has
                ? `${formatMoney(goal)} a month${since ? `, since ${formatMonth(since)}` : ""}`
                : "Not set — everything left after bills counts as discretionary."}
            </Typography>
          </div>
        </Stack>
        {editable ? (
          <Button
            size="small"
            variant={has ? "text" : "contained"}
            startIcon={has ? <EditOutlinedIcon /> : undefined}
            onClick={() => setOpen(true)}
          >
            {has ? "Edit" : "Set a goal"}
          </Button>
        ) : null}
      </Stack>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
        Taken off the top before your discretionary budget, so spending all of it
        still leaves this in the bank. It never needs a transaction; Net Worth
        tracks your bank-saved accounts against it.
      </Typography>

      {open ? (
        <SavingsGoalDialog
          open
          onClose={() => setOpen(false)}
          activeGoal={has && since ? { monthlyGoal: goal, startMonth: since } : null}
          defaultMonth={defaultMonth}
          yearOptions={yearOptions}
        />
      ) : null}
    </Paper>
  );
}
