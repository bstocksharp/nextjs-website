// ─────────────────────────────────────────────────────────────────────────────
// WORKOUT RUNNER TIMING + CUES — one place to retune the run experience.
//
// Change a number here and it takes effect everywhere the runner uses it. These
// are the only "how long does X take" / "what does a cue sound like" knobs;
// per-workout rest is still editable per workout in the builder (this just seeds
// the default for a NEW workout).
//
// Pure constants — no server-only deps, safe to import from client or server.
// ─────────────────────────────────────────────────────────────────────────────

export const RUN_TIMING = {
  /**
   * "Get ready" lead-in shown before each exercise so you can reposition.
   * AUTO-advance mode only — in manual mode you start each exercise yourself,
   * so there's nothing to get ready for. Set to 0 to drop it even in auto mode.
   */
  prepSeconds: 15,

  /**
   * "Switch sides" gap between the two sides of a per-side exercise
   * (e.g. Bulgarian split squats, planks each side). AUTO mode only — in manual
   * mode you just tap Start/Done on the second side when you're ready.
   */
  switchSideSeconds: 5,

  /**
   * Default rest between circuit rounds for a NEW workout (seconds). Each
   * workout can still override this in the builder; this is only the starting
   * value. (The DB column default mirrors this number.)
   */
  defaultRestBetweenRounds: 60,

  /**
   * How often the rotating exercise hint/tip cycles during a work step
   * (seconds). Only matters for exercises with more than one tip.
   */
  tipRotateSeconds: 6,

  /**
   * "Hold the last rep" length, as a multiple of the per-rep time. Only applies
   * to rep-based exercises with a per-rep duration AND holdLast turned on.
   *
   * The final rep plays as: build (per/2) → HOLD at the top (per × holdRatio) →
   * fall (per/2). So the whole last rep lasts `per × (1 + holdRatio)`:
   *   holdRatio: 1   → last rep is 2×   the normal rep (the classic behavior)
   *   holdRatio: 1.5 → last rep is 2.5× the normal rep (a longer hold)
   */
  holdRatio: 1,
} as const;

export const RUN_CUES = {
  // Every beep is { freq: Hz, duration: seconds, volume: 0..1 }. Higher freq =
  // higher pitch. Tweak volume to taste (these are intentionally quiet). All
  // audio is silenced together by the runner's mute toggle.

  /** 50% / 25% progress blip during a timed hold. */
  markerBeep: { freq: 523, duration: 0.08, volume: 0.12 },

  /** Each of the 3-2-1 countdown ticks at the end of a timer. */
  countdownBeep: { freq: 784, duration: 0.07, volume: 0.16 },

  /** Soft tick as each rep rolls over to the next (rep-timed sets). */
  repBeep: { freq: 1320, duration: 0.05, volume: 0.08 },

  /** Fires the moment you reach the top of the final "hold" rep. */
  holdBeep: { freq: 660, duration: 0.15, volume: 0.2 },

  // "Go" — a rest / get-ready ended and work resumes (a rising two-tone).
  goBeep: { freq: 880, duration: 0.1, volume: 0.2 },
  goBeep2: { freq: 1318, duration: 0.18, volume: 0.22 },
  /** Gap before the second "go" tone (ms). */
  goBeep2DelayMs: 90,

  // "Done" — a timed set finished: a firm single tone + green flash ring.
  doneBeep: { freq: 880, duration: 0.2, volume: 0.26 },
  /** How long the success/flash ring stays lit at end-of-step (ms). */
  flashMs: 600,

  /** Haptic buzz lengths (ms; ignored where vibration is unsupported). */
  vibrateMs: { go: 100, done: 200, hold: 60 },
} as const;
