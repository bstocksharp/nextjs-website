// Single source of truth for exercise tips (name → list of tips).
//
// The runner stores tips one-per-line and shows a random one live, rotating
// every few seconds (see RUN_TIMING.tipRotateSeconds). More good tips = a more
// helpful, less repetitive runner — Lauren's favorite part.
//
// Ordering convention per exercise: genuine form/technique cues first (the most
// important), then a fun fact or a general workout tip to round it out. Aim for
// 5-6 each. Keep them short — one glanceable line.
//
// Consumed by:
//   • seed-workout.mjs        (fresh seed / --reset)
//   • backfill-equipment.mjs  (pull-up progression insert)
//   • backfill-tips.mjs       (push updated tips onto the LIVE db)
export const TIPS_BY_NAME = {
  // ── Warmup / cardio ─────────────────────────────────────────────────────────
  "Warmup Walk": [
    "Keep it light — you're warming up, not working out.",
    "Get the blood moving; a light sweat is perfect.",
    "Roll the shoulders and swing the arms as you go.",
    "Start slow and build the pace over the five minutes.",
    "Add a few hip circles or leg swings if a joint feels stiff.",
    "A real warmup makes every set after it feel easier — it's not wasted time.",
  ],
  "Treadmill Cooldown": [
    "Bring the heart rate down slowly.",
    "Easy pace — you should be able to hold a conversation.",
    "Finish with a little stretching while you're warm.",
    "Let your breathing fully settle before you step off.",
    "Nose-breathing is a good sign you've hit a true recovery pace.",
    "Cooling down gradually is why you feel less wrecked tomorrow.",
  ],
  Treadmill: [
    "Pick a pace you can hold for the whole time.",
    "Steady beats starting out too hot.",
    "Good time to put on a podcast or playlist.",
    "Stand tall and let your arms swing — don't grip the rails.",
    "A 1-2% incline makes it feel more like walking on real ground.",
    "Easy, can-still-talk cardio is the quiet hero of getting fit.",
  ],

  // ── Legs ────────────────────────────────────────────────────────────────────
  "Goblet Squats": [
    "Chest up, drive through the heels.",
    "Elbows stay inside the knees at the bottom.",
    "Go for full depth — thighs at least parallel.",
    "Push your knees out over your toes as you descend.",
    "Brace your core like someone's about to poke your stomach.",
    "Holding the weight up front keeps you upright — a great way to learn to squat.",
  ],
  "Bulgarian Split Squats": [
    "One foot on a couch/chair. Holy crap these work.",
    "Keep most of your weight on the front leg.",
    "Drop straight down — don't lunge forward.",
    "Front foot far enough out that the knee stays over the ankle.",
    "The back foot is just for balance — don't push off it.",
    "Brutal, but the single-leg strength carries over to everything.",
  ],
  "Reverse Lunges": [
    "Controlled — don't let the front knee cave in.",
    "Step back far enough that the front shin stays vertical.",
    "Easier on the knees than forward lunges.",
    "Lower the back knee toward the floor — don't slam it down.",
    "Push through the front heel to stand back up.",
    "Stay tall through the torso; resist leaning forward.",
  ],
  "Romanian Deadlift": [
    "Slow. Stretch the hamstrings.",
    "Soft knees, push the hips back — it's a hinge, not a squat.",
    "Flat back; feel it in the hamstrings, not the low back.",
    "Keep the dumbbells close, almost dragging down your legs.",
    "Only go as low as you can without your back rounding.",
    "Squeeze the glutes to drive back up to standing.",
  ],
  "Glute Bridge": [
    "Easy. Awesome. Protects your back.",
    "Squeeze the glutes hard at the top and pause.",
    "Drive through the heels, not the toes.",
    "Keep your ribs down — don't arch your back to get higher.",
    "Heels close enough that your fingertips just graze them.",
    "One of the best moves for undoing a day of sitting.",
  ],

  // ── Push ────────────────────────────────────────────────────────────────────
  "Dumbbell Floor Press": [
    "The floor limits the range — great and shoulder-friendly.",
    "Let the elbows rest a beat on the floor between reps.",
    "Keep the wrists stacked over the elbows.",
    "Press the dumbbells up and slightly together over your chest.",
    "Elbows at about 45°, not flared straight out to the sides.",
    "That pause on the floor kills momentum, so every rep is honest.",
  ],
  "Shoulder Press": [
    "Don't arch the lower back — brace your core.",
    "Press up and slightly back, not straight forward.",
    "Control the weights down; don't just drop them.",
    "Start at ear height with the wrists stacked over the elbows.",
    "Squeeze your glutes to keep your ribs from flaring open.",
    "Stop just short of locking out to keep tension on the shoulders.",
  ],
  Pushups: [
    "Stop 1-2 reps before failure.",
    "Body in one straight line — no sagging hips.",
    "Elbows about 45° from the body, not flared out.",
    "Squeeze the glutes and brace the abs — it's a moving plank.",
    "Lower until your chest is about a fist's height off the floor.",
    "Too hard? Drop to your knees. Too easy? Slow the lowering to three counts.",
  ],
  "Arnold Press": [
    "Smooth rotation — hits all three delt heads.",
    "Start with palms facing you, finish facing forward.",
    "Go lighter than a normal press; the rotation is the point.",
    "Rotate as you press, not before — one fluid motion.",
    "Keep the core braced so you don't lean back.",
    "Arnold Schwarzenegger himself dreamed this one up for fuller shoulders.",
  ],
  "Lateral Raises": [
    "These absolutely torch shoulders. Go light.",
    "Lead with the elbows, slight bend in the arm.",
    "Stop at shoulder height — no higher.",
    "Pour it out like emptying a jug — pinkies tilt slightly up at the top.",
    "Slow on the way down; that's where the growth hides.",
    "If you're swinging to get them up, the weight's too heavy.",
  ],
  "Tricep Overhead Extension": [
    "Both hands. Keep the elbows tucked in.",
    "Only the forearms move; upper arms stay still.",
    "Get a full stretch at the bottom.",
    "Point your elbows at the ceiling, not out to the sides.",
    "Lower slow behind your head, then squeeze to extend.",
    "The overhead angle stretches the long head — the biggest part of the triceps.",
  ],

  // ── Pull ────────────────────────────────────────────────────────────────────
  "One Arm Row": [
    "Pull with the back, not the arm. Squeeze the shoulder blade.",
    "Row the dumbbell to your hip, not your chest.",
    "Keep a flat back and don't twist.",
    "Lead with the elbow, driving it up toward the ceiling.",
    "Let the weight stretch the lat fully at the bottom of each rep.",
    "Bracing on a bench takes your low back out of it — so you can row heavy and safe.",
  ],
  "Bicep Curls": [
    "You're gonna love these. No swinging.",
    "Keep the elbows pinned to your sides.",
    "Control the way down — that's half the work.",
    "Squeeze hard at the top before you lower.",
    "If your torso is rocking to move the weight, go lighter.",
    "Turn your pinky slightly up at the top for an extra squeeze.",
  ],
  "Hammer Curls": [
    "Builds forearms too.",
    "Palms face each other the whole time.",
    "No swinging — let the arms do the work.",
    "Keep your elbows glued to your sides.",
    "The neutral grip is easier on cranky wrists and elbows.",
    "Hits the brachialis — a muscle under the bicep that pushes it up and out.",
  ],
  "Bent Over Reverse Fly": [
    "Rear shoulders + posture. Light weight, slow.",
    "Squeeze the shoulder blades together at the top.",
    "Slight bend in the elbows, lead with the pinkies.",
    "Hinge at the hips with a flat back and let the arms hang.",
    "Think 'wide,' not 'up' — arc the weights out to the sides.",
    "The perfect antidote to a day hunched over a desk.",
  ],

  // ── Pull-up bar ─────────────────────────────────────────────────────────────
  "Dead Hang": [
    "Relax the shoulders and let them stretch — it decompresses the spine.",
    "Full grip, thumbs wrapped around the bar.",
    "Build the time up slowly; grip strength comes fast.",
    "Breathe easy and let gravity do the stretching.",
    "Keep a little tension so you're not dead weight on the joints.",
    "A daily hang is one of the best things you can do for shoulder health.",
  ],
  "Scapular Pulls": [
    "Think 'put your shoulder blades in your back pockets.'",
    "Arms stay straight the whole time — only the shoulders move.",
    "Small range, huge payoff for building toward pull-ups.",
    "Pull your chest up toward the bar a couple inches, then relax down.",
    "Pause at the top and feel your lats switch on.",
    "This teaches the shoulders to fire first — the secret to clean pull-ups.",
  ],
  "Flexed-Arm Hang": [
    "Squeeze everything — this builds the top of the pull-up.",
    "Step or jump to the top; you don't have to pull up to start.",
    "Lower under control when you're done — don't just drop.",
    "Keep your chin above the bar, not resting on it.",
    "Pull the elbows down and keep the chest up.",
    "Holding the hardest position is how you earn the full movement.",
  ],
  "Negative Pull-ups": [
    "The slow lower is the whole point — aim for 3-5 seconds down.",
    "This is the fastest way to earn your first real pull-up.",
    "Use a chair to get back to the top between reps.",
    "Fight gravity the whole way — don't let it turn into a drop.",
    "Keep the shoulders pulled down, not shrugged up to your ears.",
    "You're stronger lowering than lifting — that's exactly why negatives work.",
  ],
  "Hanging Knee Raises": [
    "Don't swing — control the way down.",
    "Curl the pelvis up slightly at the top for more abs, less hip flexor.",
    "Too easy? Straighten the legs for full hanging leg raises.",
    "Exhale and crunch as your knees come up.",
    "Pause a beat at the top instead of using momentum.",
    "Bonus: hanging from the bar builds serious grip strength too.",
  ],
  "Chin-ups": [
    "Palms toward you brings in the biceps — easier than a pull-up.",
    "Pull your elbows down toward your ribs.",
    "One clean rep beats three sloppy ones.",
    "Start from a full dead hang and pull your chest to the bar.",
    "Squeeze the shoulder blades down before you pull.",
    "One of the best bicep builders there is — no curls required.",
  ],
  "Pull-ups": [
    "Start from a dead hang; pull the elbows down and back.",
    "Keep the core tight so you don't swing.",
    "You'll get here — the hangs and negatives are the on-ramp.",
    "Drive your chest toward the bar, not just your chin.",
    "Squeeze the shoulder blades down to start every rep.",
    "The king of upper-body moves — worth every rep it takes to get one.",
  ],

  // ── Core ────────────────────────────────────────────────────────────────────
  Plank: [
    "Squeeze glutes and core; don't let the hips sag.",
    "Stack the elbows under the shoulders.",
    "Breathe — don't hold your breath.",
    "Tuck the pelvis slightly and pull your belly button in.",
    "Look at the floor to keep your neck in line with your spine.",
    "Quality over time — a rock-solid 30s beats a shaky two minutes.",
  ],
  "Superman Holds": [
    "Fantastic for your lower back.",
    "Lift chest and legs together and hold.",
    "Look down to keep your neck neutral.",
    "Reach your arms and legs long, like you're being stretched apart.",
    "Squeeze the glutes — they do a lot of the lifting.",
    "Strengthens the whole backside that sitting all day lets go soft.",
  ],
  "Bird Dogs": [
    "Boring — but one of the best core stability moves there is.",
    "Extend opposite arm and leg; keep the hips level.",
    "Move slow and don't let your back rotate.",
    "Imagine balancing a cup of water on your lower back.",
    "Reach long instead of high — flat is the goal.",
    "Touch elbow to knee under you between reps for an extra challenge.",
  ],
  "Dead Bug": [
    "Better than endless crunches — it teaches core control.",
    "Press your low back flat into the floor the whole time.",
    "Move the opposite arm and leg slowly.",
    "Exhale as you extend — it helps lock the ribs down.",
    "If your back arches off the floor, use a smaller range.",
    "Silly name, but it's a physical-therapist favorite for good reason.",
  ],
  Situps: [
    "Slow and controlled beats fast and sloppy.",
    "Don't yank on your neck — hands light behind the ears.",
    "Exhale on the way up.",
    "Curl up one vertebra at a time instead of jerking up.",
    "Keep your feet down and lead with your chest, not your chin.",
    "Fun fact: the U.S. Army retired timed situps in 2022 for safer core tests.",
  ],

  // ── Carries ─────────────────────────────────────────────────────────────────
  "Farmer Carry": [
    "Secretly one of the best core exercises ever.",
    "Stand tall — shoulders back, don't hunch.",
    "Grip hard and brace the core the whole walk.",
    "Short, controlled steps — no waddling.",
    "Pack the shoulders down and back, away from your ears.",
    "Carries straight over to hauling groceries and luggage.",
  ],
  "Suitcase Carry": [
    "Amazing for core, obliques, and lower back.",
    "Don't lean toward the weight — stay perfectly upright.",
    "Match the time on each side.",
    "Pull the loaded shoulder down and back; don't let it dip.",
    "Squeeze the opposite oblique hard to stay level.",
    "Named for how you'd carry an actual suitcase — one loaded side.",
  ],
};
