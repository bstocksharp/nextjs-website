import Link from "next/link";
import { notFound } from "next/navigation";
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import TimerOutlinedIcon from "@mui/icons-material/TimerOutlined";
import RepeatOutlinedIcon from "@mui/icons-material/RepeatOutlined";
import LoopIcon from "@mui/icons-material/Loop";
import { isEditor } from "@/lib/auth";
import { getWorkoutWithItems } from "@/lib/queries/workout";
import {
  formatTarget,
  groupBySection,
  SECTIONS,
  type ResolvedItem,
} from "@/lib/workout";
import ExerciseInfoButton from "@/components/ExerciseInfoButton";

function ItemRow({ index, it }: { index: number; it: ResolvedItem }) {
  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Stack direction="row" spacing={1.5} alignItems="flex-start">
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ minWidth: 24, textAlign: "right", fontWeight: 600 }}
        >
          {index}
        </Typography>
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
            <Typography variant="subtitle1" fontWeight={600}>
              {it.name}
            </Typography>
            <ExerciseInfoButton name={it.name} description={it.description} />
            <Chip
              size="small"
              variant="outlined"
              icon={
                it.mode === "timed" ? (
                  <TimerOutlinedIcon />
                ) : (
                  <RepeatOutlinedIcon />
                )
              }
              label={formatTarget(it)}
            />
            {it.weight ? (
              <Typography variant="body2" color="text.secondary">
                {it.weight}
              </Typography>
            ) : null}
          </Stack>
          {it.note ? (
            <Typography variant="body2" sx={{ mt: 0.5 }}>
              {it.note}
            </Typography>
          ) : null}
        </Box>
      </Stack>
    </Paper>
  );
}

export default async function WorkoutDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [data, editor] = await Promise.all([
    getWorkoutWithItems(Number(id)),
    isEditor(),
  ]);
  if (!data) notFound();

  const { workout, creatorName, items } = data;
  const bySection = groupBySection(items);

  return (
    <Container maxWidth="md" sx={{ py: { xs: 4, md: 6 } }}>
      <Button
        component={Link}
        href="/workout"
        startIcon={<ArrowBackIcon />}
        sx={{ mb: 2 }}
      >
        All workouts
      </Button>

      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="flex-start"
        spacing={2}
        sx={{ mb: 4 }}
      >
        <Stack spacing={1.5}>
          {creatorName ? (
            <Box>
              <Chip
                label={`saved by ${creatorName}`}
                color="secondary"
                variant="outlined"
                size="small"
              />
            </Box>
          ) : null}
          <Typography variant="h3" component="h1">
            {workout.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {items.length} exercise{items.length === 1 ? "" : "s"}
          </Typography>
        </Stack>
        {editor ? (
          <Button
            component={Link}
            href={`/workout/${workout.id}/edit`}
            variant="outlined"
            startIcon={<EditOutlinedIcon />}
            sx={{ flexShrink: 0 }}
          >
            Edit
          </Button>
        ) : null}
      </Stack>

      <Stack spacing={4}>
        {SECTIONS.map((s) => {
          const sectionItems = bySection[s.value];
          if (sectionItems.length === 0) return null;
          const isCircuit = s.value === "main" && workout.rounds > 1;

          return (
            <Box key={s.value}>
              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                sx={{ mb: 1.5 }}
              >
                <Typography variant="h5" component="h2">
                  {s.label}
                </Typography>
                {isCircuit ? (
                  <Chip
                    color="primary"
                    icon={<LoopIcon />}
                    label={`${workout.rounds} rounds`}
                    size="small"
                  />
                ) : null}
              </Stack>

              {isCircuit ? (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 1.5, mt: -0.5 }}
                >
                  Rotate through these {workout.rounds} times.
                </Typography>
              ) : null}

              <Stack spacing={1.5}>
                {sectionItems.map((it, i) => (
                  <ItemRow key={it.itemId} index={i + 1} it={it} />
                ))}
              </Stack>
            </Box>
          );
        })}
      </Stack>
    </Container>
  );
}
