"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import LinearProgress from "@mui/material/LinearProgress";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import CloseIcon from "@mui/icons-material/Close";
import SkipNextIcon from "@mui/icons-material/SkipNext";
import SkipPreviousIcon from "@mui/icons-material/SkipPrevious";
import ReplayIcon from "@mui/icons-material/Replay";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PauseIcon from "@mui/icons-material/Pause";
import CheckIcon from "@mui/icons-material/Check";
import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";
import {
  clock,
  parseLeadingInt,
  parseTips,
  SECTIONS,
  type RunStep,
  type ResolvedItem,
} from "@/lib/workout";
import ExerciseInfoButton from "@/components/workout/ExerciseInfoButton";

// ── Timing plan derived from a step ───────────────────────────────────────────
type Plan =
  | { type: "timer"; total: number; label: "rest" | "work" }
  | {
      type: "repsTimed";
      reps: number;
      per: number;
      repsText: string;
      holdLast: boolean;
    }
  | { type: "manual"; repsText: string | null };

function planFor(step: RunStep): Plan {
  if (step.kind === "rest")
    return { type: "timer", total: step.seconds, label: "rest" };
  const it = step.item;
  if (it.reps) {
    const n = parseLeadingInt(it.reps);
    if (it.duration && n)
      return {
        type: "repsTimed",
        reps: n,
        per: it.duration,
        repsText: it.reps,
        holdLast: it.holdLast,
      };
    return { type: "manual", repsText: it.reps };
  }
  if (it.duration != null)
    return { type: "timer", total: it.duration, label: "work" };
  return { type: "manual", repsText: null };
}

// The last rep runs 2× when "hold last" is on: first half = the rep, second
// half = the HOLD.
function repDuration(
  plan: Extract<Plan, { type: "repsTimed" }>,
  repNum: number,
): number {
  return plan.holdLast && repNum === plan.reps ? plan.per * 2 : plan.per;
}

const sectionLabel = (s: string) =>
  SECTIONS.find((x) => x.value === s)?.label ?? s;

// ── Circular dial (static ring + centered content + an inner "breath" disc) ────
function Dial({
  fraction,
  inner,
  color,
  flash,
  hold,
  children,
  onClick,
}: {
  fraction: number; // 0..1 of the outer ring filled
  inner?: number; // 0..1 filled inner "breath" disc (reps); omit for plain timers
  color: string;
  flash?: boolean;
  hold?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  const size = 260;
  const stroke = 14;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const f = Math.max(0, Math.min(1, fraction));
  const ringColor = hold
    ? "var(--mui-palette-warning-main)"
    : flash
      ? "var(--mui-palette-success-main)"
      : color;
  const innerMaxR = r - stroke * 1.4;
  const innerR =
    inner == null ? 0 : innerMaxR * Math.max(0, Math.min(1, inner));

  return (
    <Box
      onClick={onClick}
      sx={{
        // Square, but sized to fit both width and remaining height so the
        // runner never scrolls. viewBox stays 260 (just a coordinate space).
        width: "min(72vw, 42vh, 320px)",
        height: "min(72vw, 42vh, 320px)",
        position: "relative",
        cursor: onClick ? "pointer" : "default",
        userSelect: "none",
        mx: "auto",
      }}
    >
      <svg width="100%" height="100%" viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--mui-palette-divider)"
          strokeWidth={stroke}
        />
        {/* inner breathing disc — only this "breathes", the ring stays put */}
        {inner != null ? (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={innerR}
            fill={ringColor}
            fillOpacity={hold ? 0.4 : 0.16}
            style={{ transition: "r 140ms linear, fill-opacity 200ms" }}
          />
        ) : null}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={ringColor}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - f)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: "stroke-dashoffset 120ms linear" }}
        />
      </svg>
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          px: 2,
        }}
      >
        {children}
      </Box>
    </Box>
  );
}

export default function WorkoutRunner({
  workoutId,
  workoutName,
  steps,
}: {
  workoutId: number;
  workoutName: string;
  steps: RunStep[];
}) {
  const router = useRouter();

  const [started, setStarted] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const [stepIndex, setStepIndex] = React.useState(0);
  const [running, setRunning] = React.useState(false);
  const [remaining, setRemaining] = React.useState(0);
  const [rep, setRep] = React.useState(0);
  const [finished, setFinished] = React.useState(false); // timer hit 0, awaiting manual Next
  const [flash, setFlash] = React.useState(false);
  const [autoAdvance, setAutoAdvance] = React.useState(true);
  const [tipIndex, setTipIndex] = React.useState(0);

  const deadlineRef = React.useRef(0);
  const repRef = React.useRef(0);
  const holdBeepedRef = React.useRef(false);
  const audioRef = React.useRef<AudioContext | null>(null);
  const wakeRef = React.useRef<WakeLockSentinel | null>(null);

  const step = steps[stepIndex];
  const plan = step ? planFor(step) : null;

  // Load auto-advance preference.
  React.useEffect(() => {
    const v = localStorage.getItem("workout.autoAdvance");
    if (v != null) setAutoAdvance(v === "1");
  }, []);
  React.useEffect(() => {
    localStorage.setItem("workout.autoAdvance", autoAdvance ? "1" : "0");
  }, [autoAdvance]);

  // ── Cues ────────────────────────────────────────────────────────────────────
  const beep = React.useCallback((freq: number, dur: number, vol: number) => {
    const ctx = audioRef.current;
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = freq;
    osc.type = "sine";
    gain.gain.value = vol;
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + dur);
  }, []);

  const fireAlert = React.useCallback(() => {
    beep(880, 0.18, 0.25);
    setFlash(true);
    setTimeout(() => setFlash(false), 600);
    navigator.vibrate?.(200);
  }, [beep]);

  const tickBeep = React.useCallback(() => beep(1320, 0.05, 0.08), [beep]);

  // ── Wake lock ─────────────────────────────────────────────────────────────
  const acquireWake = React.useCallback(async () => {
    try {
      wakeRef.current = await navigator.wakeLock?.request("screen");
    } catch {
      /* not supported / denied — fine */
    }
  }, []);
  React.useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === "visible" && started && !done)
        acquireWake();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      wakeRef.current?.release().catch(() => {});
      wakeRef.current = null;
    };
  }, [started, done, acquireWake]);

  // ── Step init ─────────────────────────────────────────────────────────────
  const initStep = React.useCallback(
    (idx: number) => {
      const s = steps[idx];
      if (!s) return;
      const p = planFor(s);
      setFinished(false);
      holdBeepedRef.current = false;
      // Start on a random tip (then it rotates while the step runs).
      const t = s.kind === "work" ? parseTips(s.item.tips) : [];
      setTipIndex(t.length ? Math.floor(Math.random() * t.length) : 0);
      if (p.type === "manual") {
        setRunning(false);
        setRemaining(0);
        setRep(0);
        repRef.current = 0;
      } else if (p.type === "timer") {
        setRep(0);
        repRef.current = 0;
        setRemaining(p.total);
        deadlineRef.current = Date.now() + p.total * 1000;
        setRunning(true);
      } else {
        setRep(1);
        repRef.current = 1;
        const d = repDuration(p, 1);
        setRemaining(d);
        deadlineRef.current = Date.now() + d * 1000;
        setRunning(true);
      }
    },
    [steps],
  );

  React.useEffect(() => {
    if (started && !done) initStep(stepIndex);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepIndex, started]);

  // ── Advance ─────────────────────────────────────────────────────────────────
  const advance = React.useCallback(() => {
    if (stepIndex + 1 >= steps.length) {
      setDone(true);
      wakeRef.current?.release().catch(() => {});
    } else {
      setStepIndex(stepIndex + 1);
    }
  }, [stepIndex, steps.length]);

  // ── Rotating tip (change every ~6s during a work step) ───────────────────────
  const tips = step && step.kind === "work" ? parseTips(step.item.tips) : [];
  React.useEffect(() => {
    if (tips.length <= 1 || !running) return;
    const id = setInterval(
      () => setTipIndex((t) => (t + 1) % tips.length),
      6000,
    );
    return () => clearInterval(id);
  }, [tips.length, running, stepIndex]);

  // ── The clock ───────────────────────────────────────────────────────────────
  React.useEffect(() => {
    if (!started || done || !running || !plan || plan.type === "manual") return;
    const id = setInterval(() => {
      const rem = (deadlineRef.current - Date.now()) / 1000;
      // Entering the HOLD (second half of the final rep) — cue it once.
      // Cue the HOLD when the final rep reaches the top (build half done).
      if (
        plan.type === "repsTimed" &&
        plan.holdLast &&
        repRef.current === plan.reps &&
        rem <= 1.5 * plan.per &&
        rem > 0.05 &&
        !holdBeepedRef.current
      ) {
        holdBeepedRef.current = true;
        beep(660, 0.15, 0.2);
        navigator.vibrate?.(60);
      }
      if (rem > 0.05) {
        setRemaining(rem);
        return;
      }
      // phase ended
      if (plan.type === "repsTimed" && repRef.current < plan.reps) {
        repRef.current += 1;
        setRep(repRef.current);
        holdBeepedRef.current = false;
        const d = repDuration(plan, repRef.current);
        deadlineRef.current = Date.now() + d * 1000;
        setRemaining(d);
        tickBeep();
      } else {
        fireAlert();
        if (autoAdvance) advance();
        else {
          setFinished(true);
          setRunning(false);
          setRemaining(0);
        }
      }
    }, 100);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started, done, running, stepIndex, autoAdvance]);

  // ── Controls ────────────────────────────────────────────────────────────────
  async function start() {
    try {
      const Ctx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      audioRef.current = new Ctx();
      await audioRef.current.resume();
    } catch {
      /* audio not available */
    }
    acquireWake();
    setStarted(true);
  }

  function centerTap() {
    if (!plan || plan.type === "manual") return; // manual advances via button
    if (finished) {
      advance();
      return;
    }
    if (running) setRunning(false);
    else {
      deadlineRef.current = Date.now() + remaining * 1000;
      setRunning(true);
    }
  }

  function prev() {
    setStepIndex((i) => Math.max(0, i - 1));
  }
  function restart() {
    initStep(stepIndex);
  }
  const exit = () => router.push(`/workout/${workoutId}`);

  // ── Empty / completion screens ────────────────────────────────────────────
  if (steps.length === 0) {
    return (
      <Screen>
        <Typography variant="h5" sx={{ mb: 2 }}>
          This workout has no exercises yet.
        </Typography>
        <Button variant="contained" onClick={exit}>
          Back to workout
        </Button>
      </Screen>
    );
  }

  if (done) {
    return (
      <Screen>
        <FitnessCenterIcon color="primary" sx={{ fontSize: 64, mb: 1 }} />
        <Typography variant="h3" component="h1" sx={{ mb: 1 }}>
          Nice work! 💪
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 4 }}>
          {workoutName} — done.
        </Typography>
        <Stack direction="row" spacing={1.5}>
          <Button variant="contained" onClick={exit}>
            Back to workout
          </Button>
          <Button variant="outlined" onClick={() => router.push("/workout")}>
            Home
          </Button>
        </Stack>
      </Screen>
    );
  }

  if (!started) {
    const first = steps.find((s) => s.kind === "work");
    return (
      <Screen>
        <Typography variant="overline" color="text.secondary">
          {steps.length} steps
        </Typography>
        <Typography variant="h3" component="h1" sx={{ mb: 1 }}>
          {workoutName}
        </Typography>
        {first && first.kind === "work" ? (
          <Typography color="text.secondary" sx={{ mb: 4 }}>
            First up: {first.item.name}
          </Typography>
        ) : null}
        <Button
          variant="contained"
          size="large"
          startIcon={<PlayArrowIcon />}
          onClick={start}
          sx={{ px: 5, py: 1.5, fontSize: "1.1rem" }}
        >
          Start
        </Button>
        <Button variant="text" color="inherit" onClick={exit} sx={{ mt: 2 }}>
          Cancel
        </Button>
      </Screen>
    );
  }

  // ── Active step ─────────────────────────────────────────────────────────────
  const isRest = step.kind === "rest";
  const restLabel = step.kind === "rest" ? step.label : "Rest";
  const item = step.kind === "work" ? step.item : null;
  const color = isRest
    ? "var(--mui-palette-secondary-main)"
    : "var(--mui-palette-primary-main)";

  // dial fraction (outer ring) + inner breath disc + center content
  let fraction = 1;
  let inner: number | undefined = undefined;
  let hold = false;
  let center: React.ReactNode = null;
  if (plan?.type === "timer") {
    fraction = plan.total > 0 ? remaining / plan.total : 0;
    center = (
      <>
        <Typography sx={{ fontSize: "3.2rem", fontWeight: 800, lineHeight: 1 }}>
          {clock(remaining)}
        </Typography>
        {isRest ? (
          <Typography color="text.secondary">{restLabel}</Typography>
        ) : null}
      </>
    );
  } else if (plan?.type === "repsTimed") {
    const repDur = repDuration(plan, rep);
    const elapsed = Math.max(0, repDur - remaining);
    const isLastHold = plan.holdLast && rep === plan.reps;
    // Breath peaks at the MIDPOINT (the top / hardest point of the movement).
    // Normal rep: build (half) → fall (half), peaking at 50%.
    // Hold rep: build (half) → HOLD at the top (per) → fall (half).
    let intensity: number;
    if (isLastHold) {
      const half = plan.per / 2;
      if (elapsed < half) {
        intensity = Math.sin((elapsed / half) * (Math.PI / 2)); // build → peak
        hold = false;
      } else if (elapsed < half + plan.per) {
        intensity = 1; // HOLD at the top
        hold = true;
      } else {
        const fp = Math.min(1, (elapsed - half - plan.per) / half);
        intensity = Math.cos(fp * (Math.PI / 2)); // fall from the top
        hold = false;
      }
    } else {
      intensity = Math.sin((elapsed / plan.per) * Math.PI); // build → peak → fall
    }
    inner = Math.max(0, Math.min(1, intensity));
    // Outer ring = overall set progress (monotonic across reps).
    fraction = Math.min(1, (rep - 1 + elapsed / repDur) / plan.reps);
    center = hold ? (
      <Typography sx={{ fontSize: "3rem", fontWeight: 800, letterSpacing: 2 }}>
        HOLD
      </Typography>
    ) : (
      <>
        <Typography sx={{ fontSize: "4rem", fontWeight: 800, lineHeight: 1 }}>
          {rep}
        </Typography>
        <Typography color="text.secondary">of {plan.reps} reps</Typography>
      </>
    );
  } else {
    // manual
    fraction = 1;
    center = (
      <>
        <Typography
          sx={{ fontSize: "3rem", fontWeight: 800, lineHeight: 1.05 }}
        >
          {plan?.repsText ?? "Go"}
        </Typography>
        {plan?.repsText ? (
          <Typography color="text.secondary">reps</Typography>
        ) : null}
      </>
    );
  }

  // "Up next"
  const nextWork = steps.slice(stepIndex + 1).find((s) => s.kind === "work") as
    | Extract<RunStep, { kind: "work" }>
    | undefined;

  const header =
    step.kind === "work" && step.round
      ? `${sectionLabel(step.item.section)} · Round ${step.round} of ${step.totalRounds}`
      : step.kind === "work"
        ? sectionLabel(step.item.section)
        : restLabel;

  const tip = tips.length ? tips[tipIndex % tips.length] : null;
  const isPrep = step.kind === "rest" && step.label === "Get ready";
  // During a prep gap, feature the exercise you're getting ready for.
  const featured = isPrep && nextWork ? nextWork.item : item;

  return (
    // Full-viewport overlay (covers the app header) so the active workout fills
    // the screen and never scrolls.
    <Box
      sx={{
        position: "fixed",
        inset: 0,
        zIndex: 1300,
        bgcolor: "background.default",
        overflow: "hidden",
        display: "flex",
        justifyContent: "center",
      }}
    >
      <Box
        sx={{
          width: "100%",
          maxWidth: 520,
          height: "100dvh",
          display: "flex",
          flexDirection: "column",
          p: { xs: 2, sm: 3 },
        }}
      >
      {/* Top bar */}
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <FormControlLabel
          control={
            <Switch
              checked={autoAdvance}
              onChange={(e) => setAutoAdvance(e.target.checked)}
              size="small"
            />
          }
          label={<Typography variant="caption">Auto-advance</Typography>}
          sx={{ ml: 0 }}
        />
        <IconButton onClick={exit} aria-label="Exit workout">
          <CloseIcon />
        </IconButton>
      </Stack>

      <LinearProgress
        variant="determinate"
        value={((stepIndex + 1) / steps.length) * 100}
        sx={{ height: 6, borderRadius: 1, mb: 1 }}
      />
      <Typography variant="caption" color="text.secondary" sx={{ mb: 2 }}>
        {header} · step {stepIndex + 1}/{steps.length}
      </Typography>

      {/* Name + info (during a prep gap, feature what's coming up) */}
      {isPrep ? (
        <Typography
          variant="overline"
          color="primary"
          textAlign="center"
          sx={{ display: "block" }}
        >
          Get ready
        </Typography>
      ) : null}
      <Stack
        direction="row"
        spacing={0.5}
        alignItems="center"
        justifyContent="center"
        sx={{ mb: 0.5 }}
      >
        <Typography variant="h4" component="h1" textAlign="center">
          {featured ? featured.name : restLabel}
        </Typography>
        {featured ? (
          <ExerciseInfoButton
            name={featured.name}
            description={featured.description}
            size="medium"
          />
        ) : null}
      </Stack>
      {featured?.weight ? (
        <Typography color="text.secondary" textAlign="center" sx={{ mb: 1 }}>
          {featured.weight}
        </Typography>
      ) : null}

      {/* Dial */}
      <Box
        sx={{
          flexGrow: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          my: 2,
        }}
      >
        <Dial
          fraction={fraction}
          inner={inner}
          color={color}
          hold={hold}
          flash={flash}
          onClick={centerTap}
        >
          {center}
        </Dial>
      </Box>

      {/* Tip (live only) */}
      {tip ? (
        <Typography
          color="text.secondary"
          textAlign="center"
          sx={{ mb: 1, minHeight: 24 }}
        >
          💡 {tip}
        </Typography>
      ) : null}

      {/* Up next (skip during a prep gap — the name is already featured above) */}
      {nextWork && !isPrep ? (
        <Typography
          variant="body2"
          color="text.secondary"
          textAlign="center"
          sx={{ mb: 2 }}
        >
          Up next: {nextWork.item.name}
        </Typography>
      ) : null}

      {/* Primary action */}
      {plan?.type === "manual" ? (
        <Button
          variant="contained"
          size="large"
          startIcon={<CheckIcon />}
          onClick={advance}
          sx={{ py: 1.5, fontSize: "1.1rem", mb: 1 }}
        >
          Done → Next
        </Button>
      ) : finished ? (
        <Button
          variant="contained"
          size="large"
          startIcon={<SkipNextIcon />}
          onClick={advance}
          sx={{ py: 1.5, fontSize: "1.1rem", mb: 1 }}
        >
          Next
        </Button>
      ) : isRest ? (
        <Button
          variant="outlined"
          size="large"
          startIcon={<SkipNextIcon />}
          onClick={advance}
          sx={{ py: 1.5, fontSize: "1.05rem", mb: 1 }}
        >
          Skip{restLabel === "Rest" ? " rest" : ""}
        </Button>
      ) : null}

      {/* Controls */}
      <Stack direction="row" justifyContent="center" spacing={1}>
        <IconButton
          onClick={prev}
          disabled={stepIndex === 0}
          aria-label="Previous"
        >
          <SkipPreviousIcon />
        </IconButton>
        {plan?.type !== "manual" ? (
          <IconButton
            onClick={centerTap}
            aria-label={running ? "Pause" : "Resume"}
          >
            {running ? <PauseIcon /> : <PlayArrowIcon />}
          </IconButton>
        ) : null}
        <IconButton onClick={restart} aria-label="Restart step">
          <ReplayIcon />
        </IconButton>
        <IconButton onClick={advance} aria-label="Skip">
          <SkipNextIcon />
        </IconButton>
      </Stack>
      </Box>
    </Box>
  );
}

function Screen({ children }: { children: React.ReactNode }) {
  return (
    <Box
      sx={{
        position: "fixed",
        inset: 0,
        zIndex: 1300,
        bgcolor: "background.default",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        p: 3,
      }}
    >
      {children}
    </Box>
  );
}
