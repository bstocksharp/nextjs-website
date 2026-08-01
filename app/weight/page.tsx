import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import MonitorWeightOutlinedIcon from "@mui/icons-material/MonitorWeightOutlined";
import { getActiveProfile } from "@/lib/profile";
import { canEditProfile } from "@/lib/auth";
import { getWeightDashboard } from "@/lib/queries/weight";
import WeightActions from "@/components/weight/WeightActions";
import WeightBody from "@/components/weight/WeightBody";
import Milestones from "@/components/weight/Milestones";

export const metadata = { title: "Weight" };

const DEFAULT_ACCENT = "#4f86e0";

export default async function WeightDashboard({
  searchParams,
}: {
  searchParams: Promise<{ profile?: string }>;
}) {
  const { profile } = await searchParams;
  const active = await getActiveProfile(profile);

  if (!active) {
    return (
      <Container maxWidth="md" sx={{ py: 6 }}>
        <Typography color="text.secondary">
          No profiles yet — add someone to start tracking weight.
        </Typography>
      </Container>
    );
  }

  const [dash, editor] = await Promise.all([
    getWeightDashboard(active.id),
    canEditProfile(active.id),
  ]);
  const { goal, weighIns, stats, chart, trends, projections, planPaceLbPerWeek, milestones } =
    dash;
  const accent = active.color ?? DEFAULT_ACCENT;

  // "Today" computed on the server so the log modal's date hydrates cleanly.
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  const todayISO = now.toISOString().slice(0, 10);

  return (
    <Container maxWidth="md" sx={{ py: { xs: 4, md: 6 } }}>
      <Stack
        direction="row"
        alignItems="flex-start"
        justifyContent="space-between"
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Stack spacing={0.5}>
          <Typography variant="h3" component="h1">
            Weight
          </Typography>
          <Typography variant="h6" component="p" color="text.secondary" fontWeight={400}>
            {active.name}
            {goal ? ` · goal ${Number(goal.goalWeight)} lb` : " · no goal set yet"}
          </Typography>
        </Stack>
        {editor ? (
          <WeightActions
            profileId={active.id}
            defaultDate={todayISO}
            hasGoal={!!goal}
            startWeight={goal ? Number(goal.startWeight) : null}
            startDate={goal?.startDate ?? null}
            goalWeight={goal ? Number(goal.goalWeight) : null}
            perWeekPace={goal ? Number(goal.perWeekPace) : null}
          />
        ) : null}
      </Stack>

      {weighIns.length === 0 || !stats ? (
        <Paper variant="outlined" sx={{ p: 5, textAlign: "center" }}>
          <MonitorWeightOutlinedIcon sx={{ fontSize: 44, color: "text.disabled", mb: 1 }} />
          <Typography color="text.secondary">
            {editor
              ? "No weigh-ins yet — hit Log to start the chart."
              : "No weigh-ins logged yet."}
          </Typography>
        </Paper>
      ) : (
        <>
          <WeightBody
            stats={stats}
            hasGoal={!!goal}
            planPace={planPaceLbPerWeek}
            color={accent}
            dates={chart.dates}
            actual={chart.actual}
            target={chart.target}
            movingAvg={chart.movingAvg}
            trends={trends}
            projections={projections}
          />
          {milestones ? <Milestones milestones={milestones} /> : null}
        </>
      )}
    </Container>
  );
}
