"use client";

import * as React from "react";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import AddIcon from "@mui/icons-material/Add";
import FlagOutlinedIcon from "@mui/icons-material/FlagOutlined";
import { logWeight, savePlan } from "@/app/actions/weight";
import LogWeightDialog from "./LogWeightDialog";
import PlanDialog from "./PlanDialog";

// The dashboard's two header actions: "Log weigh-in" (primary) and "Re-plan"
// (or "Set plan" if there's none yet). Both open modals. Editor-gated by the
// caller — this only renders when the viewer can edit this profile.
export default function WeightActions({
  profileId,
  defaultDate,
  hasPlan,
  startWeight,
  startDate,
  goalWeight,
  perWeekPace,
  endDate,
}: {
  profileId: number;
  defaultDate: string;
  hasPlan: boolean;
  startWeight?: number | null;
  startDate?: string | null;
  goalWeight?: number | null;
  perWeekPace?: number | null;
  endDate?: string | null;
}) {
  const [logOpen, setLogOpen] = React.useState(false);
  const [planOpen, setPlanOpen] = React.useState(false);

  return (
    <>
      <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
        <Button
          variant="outlined"
          startIcon={<FlagOutlinedIcon />}
          onClick={() => setPlanOpen(true)}
        >
          {hasPlan ? "Re-plan" : "Set plan"}
        </Button>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setLogOpen(true)}>
          Log
        </Button>
      </Stack>

      <LogWeightDialog
        open={logOpen}
        onClose={() => setLogOpen(false)}
        action={logWeight.bind(null, profileId)}
        title="Log a weigh-in"
        submitLabel="Log weigh-in"
        defaultDate={defaultDate}
      />

      <PlanDialog
        open={planOpen}
        onClose={() => setPlanOpen(false)}
        action={savePlan.bind(null, profileId)}
        hasPlan={hasPlan}
        startWeight={startWeight}
        startDate={startDate}
        goalWeight={goalWeight}
        perWeekPace={perWeekPace}
        endDate={endDate}
      />
    </>
  );
}
