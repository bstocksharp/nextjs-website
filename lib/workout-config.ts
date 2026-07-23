// ─────────────────────────────────────────────────────────────────────────────
// WORKOUT RUNNER TIMING — one place to retune the run experience.
//
// Change a number here and it takes effect everywhere the runner uses it. These
// are the only "how long does X take" knobs; per-workout rest is still editable
// per workout in the builder (this just seeds the default for a NEW workout).
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
} as const;
