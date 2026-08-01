"use client";

import * as React from "react";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import AddIcon from "@mui/icons-material/Add";
import FlagOutlinedIcon from "@mui/icons-material/FlagOutlined";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import { logWeight, savePlan, startPlan } from "@/app/actions/weight";
import LogWeightDialog from "./LogWeightDialog";
import PlanDialog from "./PlanDialog";

// Header actions: "Log" (primary) + a "Plan" control. With a plan, Plan opens a
// menu (edit the current plan / start a fresh one — the mode-switch + new-season
// tool). With no plan yet, it jumps straight to creating one.
export default function WeightActions({
  profileId,
  defaultDate,
  hasPlan,
  mode,
  currentWeight,
  startWeight,
  startDate,
  goalWeight,
  perWeekPace,
  endDate,
  rangeLb,
}: {
  profileId: number;
  defaultDate: string;
  hasPlan: boolean;
  mode?: "lose" | "maintain";
  currentWeight?: number | null;
  startWeight?: number | null;
  startDate?: string | null;
  goalWeight?: number | null;
  perWeekPace?: number | null;
  endDate?: string | null;
  rangeLb?: number | null;
}) {
  const [logOpen, setLogOpen] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
  const [newOpen, setNewOpen] = React.useState(false);
  const [menuAnchor, setMenuAnchor] = React.useState<null | HTMLElement>(null);

  return (
    <>
      <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
        <Button
          variant="outlined"
          startIcon={<FlagOutlinedIcon />}
          endIcon={hasPlan ? <ArrowDropDownIcon /> : undefined}
          onClick={(e) => (hasPlan ? setMenuAnchor(e.currentTarget) : setNewOpen(true))}
        >
          {hasPlan ? "Plan" : "Set plan"}
        </Button>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setLogOpen(true)}>
          Log
        </Button>
      </Stack>

      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={() => setMenuAnchor(null)}>
        <MenuItem
          onClick={() => {
            setMenuAnchor(null);
            setEditOpen(true);
          }}
        >
          Edit current plan
        </MenuItem>
        <MenuItem
          onClick={() => {
            setMenuAnchor(null);
            setNewOpen(true);
          }}
        >
          Start new plan
        </MenuItem>
      </Menu>

      <LogWeightDialog
        open={logOpen}
        onClose={() => setLogOpen(false)}
        action={logWeight.bind(null, profileId)}
        title="Log a weigh-in"
        submitLabel="Log weigh-in"
        defaultDate={defaultDate}
      />

      {/* Edit the active plan in place (mode locked) */}
      <PlanDialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        action={savePlan.bind(null, profileId)}
        isNew={false}
        initialMode={mode ?? "lose"}
        startWeight={startWeight}
        startDate={startDate}
        goalWeight={goalWeight}
        perWeekPace={perWeekPace}
        endDate={endDate}
        rangeLb={rangeLb}
      />

      {/* Start a fresh plan from today (mode toggle) */}
      <PlanDialog
        open={newOpen}
        onClose={() => setNewOpen(false)}
        action={startPlan.bind(null, profileId)}
        isNew
        initialMode="lose"
        startDate={defaultDate}
        startWeight={currentWeight}
        goalWeight={currentWeight}
      />
    </>
  );
}
