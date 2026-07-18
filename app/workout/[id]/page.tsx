import Link from "next/link";
import { notFound } from "next/navigation";
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
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
import ExerciseInfoButton from "@/components/workout/ExerciseInfoButton";
import SavedToast from "@/components/shared/SavedToast";
import Chip from "@mui/material/Chip";

function ItemRow({ index, it }: { index: number; it: ResolvedItem }) {
  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
        <Typography
          variant="subtitle1"
          fontWeight={700}
          color="text.secondary"
          sx={{ minWidth: 22, textAlign: "center" }}
        >
          {index}
        </Typography>
        <Typography variant="subtitle1" fontWeight={600}>
          {it.name}
        </Typography>
        <ExerciseInfoButton name={it.name} description={it.description} />
        <Chip
          icon={
            it.mode === "timed" ? <TimerOutlinedIcon /> : <RepeatOutlinedIcon />
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
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ pl: "30px", mt: 0.5 }}
        >
          {it.note}
        </Typography>
      ) : null}
    </Paper>
  );
}

export default async function WorkoutDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const { id } = await params;
  const { saved } = await searchParams;
  const [data, editor] = await Promise.all([
    getWorkoutWithItems(Number(id)),
    isEditor(),
  ]);
  if (!data) notFound();

  const { workout, creatorName, items } = data;
  const bySection = groupBySection(items);

  return (
    <Container maxWidth="md" sx={{ py: { xs: 4, md: 6 } }}>
      {saved ? <SavedToast message="Workout saved" /> : null}
      <Button
        component={Link}
        href="/workout"
        startIcon={<ArrowBackIcon />}
        sx={{ mb: 2 }}
      >
        All workouts
      </Button>

      {/* Title + Edit on one line */}
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        spacing={2}
        sx={{ mb: 1 }}
      >
        <Typography variant="h3" component="h1">
          {workout.name}
        </Typography>
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

      {/* Count + "saved by" on one line */}
      <Stack
        direction="row"
        spacing={1}
        alignItems="center"
        flexWrap="wrap"
        sx={{ mb: 4 }}
      >
        <Typography variant="body2" color="text.secondary">
          {items.length} exercise{items.length === 1 ? "" : "s"}
        </Typography>
        {creatorName ? (
          <Chip label={`saved by ${creatorName}`} color="primary" />
        ) : null}
      </Stack>

      {items.length > 0 ? (
        <Button
          component={Link}
          href={`/workout/${workout.id}/run`}
          variant="contained"
          size="large"
          fullWidth
          startIcon={<PlayArrowIcon />}
          sx={{ py: 1.5, fontSize: "1.05rem", mb: 4 }}
        >
          Start workout
        </Button>
      ) : null}

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
                sx={{ mb: isCircuit ? 0.5 : 1.5 }}
              >
                <Typography variant="h5" component="h2">
                  {s.label}
                </Typography>
                {isCircuit ? (
                  <Chip
                    color="primary"
                    variant="filled"
                    icon={<LoopIcon />}
                    label={`${workout.rounds} rounds`}
                  />
                ) : null}
              </Stack>

              {isCircuit ? (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 1.5 }}
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
