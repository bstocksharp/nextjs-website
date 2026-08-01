"use client";

import * as React from "react";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import AddIcon from "@mui/icons-material/Add";
import FlagOutlinedIcon from "@mui/icons-material/FlagOutlined";
import { logWeight, setGoal } from "@/app/actions/weight";
import LogWeightDialog from "./LogWeightDialog";
import GoalDialog from "./GoalDialog";

// The dashboard's two header actions: "Log weigh-in" (primary) and "Re-plan"
// (or "Set goal" if there's no plan yet). Both open modals. Editor-gated by the
// caller — this only renders when the viewer can edit this profile.
export default function WeightActions({
  profileId,
  defaultDate,
  hasGoal,
  startWeight,
  startDate,
  goalWeight,
  perWeekPace,
}: {
  profileId: number;
  defaultDate: string;
  hasGoal: boolean;
  startWeight?: number | null;
  startDate?: string | null;
  goalWeight?: number | null;
  perWeekPace?: number | null;
}) {
  const [logOpen, setLogOpen] = React.useState(false);
  const [goalOpen, setGoalOpen] = React.useState(false);

  return (
    <>
      <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
        <Button
          variant="outlined"
          startIcon={<FlagOutlinedIcon />}
          onClick={() => setGoalOpen(true)}
        >
          {hasGoal ? "Re-plan" : "Set goal"}
        </Button>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setLogOpen(true)}
        >
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

      <GoalDialog
        open={goalOpen}
        onClose={() => setGoalOpen(false)}
        action={setGoal.bind(null, profileId)}
        hasGoal={hasGoal}
        startWeight={startWeight}
        startDate={startDate}
        goalWeight={goalWeight}
        perWeekPace={perWeekPace}
      />
    </>
  );
}
