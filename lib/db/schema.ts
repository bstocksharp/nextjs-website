// ─────────────────────────────────────────────────────────────────────────────
// DATABASE SCHEMA (Drizzle / Postgres on Neon)
//
// One source of truth for every table. Change here, then `npm run db:push`
// syncs it to the live database. Status/category/priority fields are plain
// text (documented inline) rather than PG enums — deliberately flexible so the
// app can evolve without painful enum migrations.
// ─────────────────────────────────────────────────────────────────────────────

import {
  pgTable,
  serial,
  varchar,
  text,
  integer,
  numeric,
  boolean,
  date,
  timestamp,
  jsonb,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

const createdAt = () =>
  timestamp("created_at", { withTimezone: true }).defaultNow().notNull();

// ── Vehicles ────────────────────────────────────────────────────────────────
// Owned cars, sold cars, and the future dream Miata (status = 'dream').
export const vehicles = pgTable("vehicles", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").notNull().references(() => groups.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 120 }).notNull(),
  status: varchar("status", { length: 20 }).notNull().default("owned"), // owned | prospect | dream | sold
  make: varchar("make", { length: 80 }),
  model: varchar("model", { length: 80 }),
  year: integer("year"),
  trim: varchar("trim", { length: 80 }),
  vin: varchar("vin", { length: 40 }),
  licensePlate: varchar("license_plate", { length: 20 }),
  color: varchar("color", { length: 60 }),
  interiorColor: varchar("interior_color", { length: 60 }),
  transmission: varchar("transmission", { length: 40 }),
  purchaseDate: date("purchase_date"),
  purchasePrice: numeric("purchase_price", { precision: 10, scale: 2 }),
  purchaseMileage: integer("purchase_mileage"),
  currentMileage: integer("current_mileage"),
  heroPhotoUrl: text("hero_photo_url"),
  notes: text("notes"),
  // Owner + visibility — see ARCHITECTURE "Profiles, visibility & access". Profiles
  // aren't a security boundary; visibility is organization, not permission. A
  // `shared` car shows in everyone's garage, a `private` one only in its owner's.
  profileId: integer("profile_id").references(() => profiles.id, {
    onDelete: "set null",
  }),
  visibility: varchar("visibility", { length: 20 }).notNull().default("shared"), // shared | private
  createdAt: createdAt(),
});

// ── Maintenance records ───────────────────────────────────────────────────────
export const maintenanceRecords = pgTable(
  "maintenance_records",
  {
    id: serial("id").primaryKey(),
    vehicleId: integer("vehicle_id")
      .notNull()
      .references(() => vehicles.id, { onDelete: "cascade" }),
    serviceType: varchar("service_type", { length: 120 }).notNull(),
    category: varchar("category", { length: 40 }), // maintenance | repair | upgrade | cosmetic | safety
    serviceDate: date("service_date").notNull(),
    mileage: integer("mileage"),
    cost: numeric("cost", { precision: 10, scale: 2 }),
    vendor: varchar("vendor", { length: 120 }),
    notes: text("notes"),
    nextDueDate: date("next_due_date"), // reminders
    nextDueMileage: integer("next_due_mileage"),
    createdAt: createdAt(),
  },
  (t) => [index("idx_records_vehicle").on(t.vehicleId)],
);

// ── Fuel logs (MPG computed in queries) ───────────────────────────────────────
export const fuelLogs = pgTable(
  "fuel_logs",
  {
    id: serial("id").primaryKey(),
    vehicleId: integer("vehicle_id")
      .notNull()
      .references(() => vehicles.id, { onDelete: "cascade" }),
    fillDate: date("fill_date").notNull(),
    odometer: integer("odometer"),
    gallons: numeric("gallons", { precision: 7, scale: 3 }),
    pricePerGallon: numeric("price_per_gallon", { precision: 6, scale: 3 }),
    totalCost: numeric("total_cost", { precision: 10, scale: 2 }),
    isFullTank: boolean("is_full_tank").notNull().default(true),
    notes: text("notes"),
    createdAt: createdAt(),
  },
  (t) => [index("idx_fuel_vehicle").on(t.vehicleId)],
);

// ── Parts inventory ───────────────────────────────────────────────────────────
export const parts = pgTable("parts", {
  id: serial("id").primaryKey(),
  vehicleId: integer("vehicle_id").references(() => vehicles.id, {
    onDelete: "cascade",
  }),
  name: varchar("name", { length: 160 }).notNull(),
  brand: varchar("brand", { length: 120 }),
  partNumber: varchar("part_number", { length: 80 }),
  category: varchar("category", { length: 40 }),
  link: text("link"),
  cost: numeric("cost", { precision: 10, scale: 2 }),
  installedDate: date("installed_date"),
  maintenanceRecordId: integer("maintenance_record_id").references(
    () => maintenanceRecords.id,
    { onDelete: "set null" },
  ),
  notes: text("notes"),
  createdAt: createdAt(),
});

// ── Build tasks (phased plan + goals + immediate-maintenance list) ────────────
export const buildTasks = pgTable("build_tasks", {
  id: serial("id").primaryKey(),
  vehicleId: integer("vehicle_id")
    .notNull()
    .references(() => vehicles.id, { onDelete: "cascade" }),
  phase: integer("phase"), // 1..6 (Reliability→Power); null = general goal
  title: varchar("title", { length: 160 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 40 }),
  priority: varchar("priority", { length: 20 }).default("medium"), // high | medium | low
  status: varchar("status", { length: 20 }).notNull().default("planned"), // planned | in_progress | done
  costEstimate: numeric("cost_estimate", { precision: 10, scale: 2 }),
  actualCost: numeric("actual_cost", { precision: 10, scale: 2 }),
  completedDate: date("completed_date"),
  sortOrder: integer("sort_order").default(0),
  createdAt: createdAt(),
});

// ── Wishlist / dream parts (with budget tracking) ─────────────────────────────
export const wishlistItems = pgTable("wishlist_items", {
  id: serial("id").primaryKey(),
  vehicleId: integer("vehicle_id").references(() => vehicles.id, {
    onDelete: "cascade",
  }),
  item: varchar("item", { length: 160 }).notNull(),
  brand: varchar("brand", { length: 120 }),
  price: numeric("price", { precision: 10, scale: 2 }),
  rating: integer("rating"), // 1..5
  priority: varchar("priority", { length: 20 }).default("medium"),
  link: text("link"),
  purchased: boolean("purchased").notNull().default(false),
  purchasedDate: date("purchased_date"),
  notes: text("notes"),
  createdAt: createdAt(),
});

// ── Build journal ─────────────────────────────────────────────────────────────
export const journalEntries = pgTable("journal_entries", {
  id: serial("id").primaryKey(),
  vehicleId: integer("vehicle_id")
    .notNull()
    .references(() => vehicles.id, { onDelete: "cascade" }),
  entryDate: date("entry_date").notNull(),
  title: varchar("title", { length: 200 }),
  body: text("body").notNull(),
  mileage: integer("mileage"),
  createdAt: createdAt(),
});

// ── Inspection checklists (one per candidate car you go look at) ───────────────
export const checklists = pgTable("checklists", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").notNull().references(() => groups.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 200 }).notNull(),
  vehicleId: integer("vehicle_id").references(() => vehicles.id, {
    onDelete: "set null",
  }),
  year: integer("year"),
  price: numeric("price", { precision: 10, scale: 2 }),
  location: varchar("location", { length: 160 }),
  seller: varchar("seller", { length: 160 }),
  mileage: integer("mileage"),
  link: text("link"),
  verdict: varchar("verdict", { length: 40 }), // undecided | pass | notes | walk-away
  inspectedDate: date("inspected_date"),
  overallNotes: text("overall_notes"),
  createdAt: createdAt(),
});

export const checklistItems = pgTable(
  "checklist_items",
  {
    id: serial("id").primaryKey(),
    checklistId: integer("checklist_id")
      .notNull()
      .references(() => checklists.id, { onDelete: "cascade" }),
    category: varchar("category", { length: 60 }),
    label: varchar("label", { length: 240 }).notNull(),
    status: varchar("status", { length: 20 }).default("unchecked"), // ok | concern | fail | unchecked
    checked: boolean("checked").notNull().default(false),
    notes: text("notes"),
    sortOrder: integer("sort_order").default(0),
  },
  (t) => [index("idx_checklist_items_checklist").on(t.checklistId)],
);

// ── Attachments (photos / receipts) — polymorphic owner ───────────────────────
// No group_id ON PURPOSE: the polymorphic (ownerType, ownerId) parent is always
// a group-scoped row, and attachments are only ever fetched through an already-
// authorized owner. Revisit if attachments ever get a standalone listing.
export const attachments = pgTable(
  "attachments",
  {
    id: serial("id").primaryKey(),
    ownerType: varchar("owner_type", { length: 40 }).notNull(), // vehicle | maintenance | journal | wishlist
    ownerId: integer("owner_id").notNull(),
    url: text("url").notNull(),
    pathname: text("pathname"),
    contentType: varchar("content_type", { length: 80 }),
    caption: varchar("caption", { length: 240 }),
    uploadedAt: timestamp("uploaded_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [index("idx_attachments_owner").on(t.ownerType, t.ownerId)],
);

// ── Resources (links / specs you collect over time) ───────────────────────────
export const resources = pgTable("resources", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").notNull().references(() => groups.id, { onDelete: "cascade" }),
  category: varchar("category", { length: 60 }),
  title: varchar("title", { length: 200 }).notNull(),
  url: text("url"),
  notes: text("notes"),
  sortOrder: integer("sort_order").default(0),
  createdAt: createdAt(),
});

// ─────────────────────────────────────────────────────────────────────────────
// GROUPS — the tenancy boundary (Phase C of the auth roadmap). A group is a
// household: it owns ACCOUNTS (logins), PROFILES (people), and all data. The
// mental model: accounts authenticate, profiles identify, groups own. Tables
// carry group_id either directly (profiles, vehicles, exercises, resources,
// checklists) or by inheritance through an owning row (everything hanging off
// a vehicle/profile/workout/account). Every query in lib/queries scopes to the
// session's group — the session token carries groupId (lib/session).
// ─────────────────────────────────────────────────────────────────────────────
export const groups = pgTable("groups", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  // Demo groups are wiped + reseeded on every demo login (lib/demo.ts) so each
  // visitor gets a pristine tour no matter what the last one deleted.
  isDemo: boolean("is_demo").notNull().default(false),
  createdAt: createdAt(),
});

// ─────────────────────────────────────────────────────────────────────────────
// ACCOUNTS — the global login (Phase A of the auth roadmap). An account is a
// LOGIN IDENTITY for the whole hub, distinct from profiles (the household's
// people/data — a kid can have a profile with no login). A group can hold
// several accounts (Bryce + Lauren each get a key). No signup UI by design —
// accounts are created with `node scripts/create-account.mjs <username>`.
// ─────────────────────────────────────────────────────────────────────────────
export const accounts = pgTable("accounts", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").notNull().references(() => groups.id, { onDelete: "cascade" }),
  username: varchar("username", { length: 80 }).notNull().unique(), // stored lowercase
  passwordHash: text("password_hash").notNull(), // scrypt "scrypt$salt$hash" (lib/auth)
  // THE CLAIM (Phase D): this login IS this person. Signing in auto-switches to
  // the claimed profile, and a claimed profile's stuff is editable ONLY by its
  // claiming account — "claim is the lock", replacing the old per-profile edit
  // passwords. Unclaimed profiles (a kid) stay open to the whole group. unique:
  // one account per profile; nullable: an account may claim nothing. Managed at
  // /group; set null when the profile is deleted.
  profileId: integer("profile_id")
    .unique()
    .references(() => profiles.id, { onDelete: "set null" }),
  createdAt: createdAt(),
});

// ── Passkeys (Phase B: WebAuthn / Face ID) ────────────────────────────────────
// One row per registered authenticator; an account can have several (one per
// device, or one synced iCloud/Google passkey shared across devices). The
// password stays as the fallback — a passkey is an ADDITIONAL door key, and
// deleting the last one must never lock anyone out. Registered at /passkeys
// (signed in); usernameless login via the discoverable credential ("resident
// key") that Face ID picks for you. Sign/verify flows: app/actions/passkeys.ts.
export const passkeys = pgTable(
  "passkeys",
  {
    // The credential's own WebAuthn ID (base64url) — globally unique by spec,
    // and what the authenticator sends at login, so it's the natural PK.
    id: text("id").primaryKey(),
    accountId: integer("account_id")
      .notNull()
      .references(() => accounts.id, { onDelete: "cascade" }),
    publicKey: text("public_key").notNull(), // base64url COSE public key bytes
    // Signature counter — SimpleWebAuthn compares it to catch cloned
    // authenticators. Apple platform authenticators always report 0; store it anyway.
    counter: integer("counter").notNull().default(0),
    transports: jsonb("transports").$type<string[]>().notNull().default([]), // e.g. ["internal","hybrid"]
    deviceType: varchar("device_type", { length: 20 }), // singleDevice | multiDevice (synced)
    backedUp: boolean("backed_up").notNull().default(false), // synced to iCloud/Google
    label: varchar("label", { length: 120 }), // human name shown at /passkeys
    createdAt: createdAt(),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
  },
  (t) => [index("idx_passkeys_account").on(t.accountId)],
);

// ─────────────────────────────────────────────────────────────────────────────
// PROFILES — the hub-wide people (Bryce, Lauren). Data, not accounts. NOT a
// security boundary (no passwords, free switching) — see ARCHITECTURE. First used
// by the workout app; now hub-wide (vehicles.profile_id, active_profile cookie).
// ─────────────────────────────────────────────────────────────────────────────
export const profiles = pgTable("profiles", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").notNull().references(() => groups.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 80 }).notNull(),
  color: varchar("color", { length: 20 }), // tile accent / avatar color
  sortOrder: integer("sort_order").default(0),
  // Apps this person has hidden from their hub (by slug, see lib/apps). A
  // personal declutter preference, NOT a permission — the hub has no roles.
  // Default [] = every app visible; new apps show up automatically.
  hiddenApps: jsonb("hidden_apps").$type<string[]>().notNull().default([]),
  // Workout gear this person OWNS (slugs from lib/workout EQUIPMENT). The workout
  // catalog greys out / warns on exercises whose required gear isn't here. Default
  // [] = "not set up yet" → nothing is filtered (show everything). Editor-gated to
  // change, so the read-only showcase stays read-only — see auth notes.
  equipment: jsonb("equipment").$type<string[]>().notNull().default([]),
  // (Phase D removed the per-profile edit passwords — a profile is protected by
  // being CLAIMED by an account instead; see accounts.profileId.)
  // Soft-delete: "Deactivate" sets this (hidden from the switcher, can't be
  // active) but keeps all their data. "Delete forever" removes the row after
  // reassigning shared cars/workouts. null = active.
  archivedAt: timestamp("archived_at", { withTimezone: true }),
  createdAt: createdAt(),
});

// ─────────────────────────────────────────────────────────────────────────────
// WORKOUT APP — nightly exercise companion (catalog, routines, items, schedule)
// ─────────────────────────────────────────────────────────────────────────────

// ── Exercise catalog (shared across profiles; carries recommended defaults) ───
// mode: 'reps' (manual "Done → Next") | 'timed' (countdown). reps/weight are text
// on purpose — real workouts say "10-12", "8 each leg", "15s", "5 or 8s".
export const exercises = pgTable("exercises", {
  id: serial("id").primaryKey(),
  // Each group has its own catalog ("shared" means shared within the household).
  groupId: integer("group_id").notNull().references(() => groups.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 120 }).notNull(),
  category: varchar("category", { length: 40 }), // warmup|legs|push|pull|core|cardio|carry|mobility
  // Recommended defaults; a workout item can override reps/time/weight. Mode is
  // derived (reps present → rep-based; else timed). reps/weight are text on
  // purpose — real workouts say "10-12", "8 each leg", "15s", "5 or 8s".
  defaultReps: varchar("default_reps", { length: 40 }), // "10-12", "8 each leg"
  defaultDuration: integer("default_duration"), // seconds; per-rep when reps set, else total hold
  defaultWeight: varchar("default_weight", { length: 40 }), // "25 lb", "15s", "bodyweight"
  holdLast: boolean("hold_last").notNull().default(false), // hold the final rep (needs per-rep time)
  // 1 = normal; 2 = performed per side (e.g. Bulgarian split squats, planks each
  // side) — the runner runs the set once per side with a short "switch" between.
  sides: integer("sides").notNull().default(1),
  // Gear this exercise REQUIRES, as slugs from lib/workout EQUIPMENT (e.g.
  // ["dumbbells"], ["pullup-bar"]). Intrinsic to the exercise (a pull-up always
  // needs a bar), so it's catalog-only — NO per-item override, same as `sides`.
  // Empty [] = bodyweight, needs nothing. A profile only sees exercises whose
  // required gear it owns (profiles.equipment); [] always shows.
  equipment: jsonb("equipment").$type<string[]>().notNull().default([]),
  description: text("description"),
  tips: text("tips"),
  createdAt: createdAt(),
});

// ── Workouts (a saved routine / "day") — a SHARED library ─────────────────────
// Every profile can see every workout; `createdByProfileId` is just "saved by"
// (which profile authored it). A workout has three sections (warmup / main /
// cooldown). MAIN is a circuit: `rounds` = how many times to rotate the main
// items; warmup + cooldown run once. Scheduling is separate — see
// `workout_assignments` (a workout can be assigned to many days/profiles).
export const workouts = pgTable(
  "workouts",
  {
    id: serial("id").primaryKey(),
    // Column stays `profile_id`; semantics are "saved by" (creator), not owner.
    // RESTRICT (not cascade): workouts are a SHARED library, so a profile can't be
    // deleted while it still authors any — deleteProfileForever() reassigns them to
    // an heir first. Prevents a profile delete from nuking others' shared routines.
    createdByProfileId: integer("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "restrict" }),
    name: varchar("name", { length: 120 }).notNull(),
    rounds: integer("rounds").notNull().default(1), // times to rotate the MAIN circuit
    restBetweenRounds: integer("rest_between_rounds").notNull().default(60), // seconds
    notes: text("notes"),
    sortOrder: integer("sort_order").default(0),
    createdAt: createdAt(),
  },
  (t) => [index("idx_workouts_profile").on(t.createdByProfileId)],
);

// ── Workout assignments — each profile maps their own week ─────────────────────
// (profileId, weekday) → workoutId. Unique per profile+weekday, so a profile has
// at most one workout per day; the same workout can be reused across days/profiles.
export const workoutAssignments = pgTable(
  "workout_assignments",
  {
    id: serial("id").primaryKey(),
    profileId: integer("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    weekday: integer("weekday").notNull(), // 0..6 (Sun..Sat)
    workoutId: integer("workout_id")
      .notNull()
      .references(() => workouts.id, { onDelete: "cascade" }),
  },
  (t) => [
    uniqueIndex("uniq_assignment_profile_weekday").on(t.profileId, t.weekday),
  ],
);

// ── Workout items (ordered exercises in a workout; null override = use default) ─
// `section` places the item in warmup | main | cooldown. Reps/duration/weight are
// per-item overrides (null = inherit the exercise). "How many times" is the
// workout's `rounds` (main only), not a per-item value.
export const workoutItems = pgTable(
  "workout_items",
  {
    id: serial("id").primaryKey(),
    workoutId: integer("workout_id")
      .notNull()
      .references(() => workouts.id, { onDelete: "cascade" }),
    exerciseId: integer("exercise_id")
      .notNull()
      .references(() => exercises.id, { onDelete: "restrict" }),
    section: varchar("section", { length: 20 }).notNull().default("main"), // warmup | main | cooldown
    reps: varchar("reps", { length: 40 }),
    duration: integer("duration"), // seconds; per-rep when reps set, else total hold
    weight: varchar("weight", { length: 40 }),
    holdLast: boolean("hold_last"), // override; null = inherit the exercise's default
    // NOTE: per-side is intentionally catalog-only (see exercises.sides) — it's an
    // intrinsic property of the exercise, not a per-workout dial, so no override here.
    note: text("note"),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [index("idx_workout_items_workout").on(t.workoutId)],
);

// ─────────────────────────────────────────────────────────────────────────────
// WEIGHT TRACKER — weekly weigh-ins per profile + a goal/pace plan. Everything
// derived (WoW, total lost, the target line, pace buffer, trend, projected goal
// date) is COMPUTED in lib/queries/weight.ts, never stored — same spirit as MPG
// living in the fuel queries. Owned by a profile (Bryce's data ≠ Lauren's),
// gated for writes via requireEditorFor(profileId) like the rest of the hub.
// ─────────────────────────────────────────────────────────────────────────────

// ── Weigh-ins (one row per profile per day; re-logging a day UPDATES it) ───────
// weight is text-free numeric(5,1): scales are 0.2-lb granularity in practice,
// one decimal is plenty (e.g. 224.6). The unique (profile, day) index is what
// makes "log today" idempotent — a second entry for a date overwrites the first.
export const weighIns = pgTable(
  "weigh_ins",
  {
    id: serial("id").primaryKey(),
    profileId: integer("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    measuredOn: date("measured_on").notNull(),
    weight: numeric("weight", { precision: 5, scale: 1 }).notNull(), // lbs, e.g. 224.6
    note: text("note"),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("uniq_weigh_in_profile_date").on(t.profileId, t.measuredOn)],
);

// ── Weight goal / plan (ONE per profile; "re-plan" overwrites this row) ────────
// The target line is startWeight declining by perWeekPace lbs/week from startDate,
// flattening once it reaches goalWeight. Pace is numeric(5,3) so the seeded line
// reproduces the spreadsheet exactly ((start − goal) / 52 weeks, e.g. 0.577).
export const weightGoals = pgTable("weight_goals", {
  id: serial("id").primaryKey(),
  profileId: integer("profile_id")
    .notNull()
    .unique()
    .references(() => profiles.id, { onDelete: "cascade" }),
  startWeight: numeric("start_weight", { precision: 5, scale: 1 }).notNull(),
  startDate: date("start_date").notNull(),
  goalWeight: numeric("goal_weight", { precision: 5, scale: 1 }).notNull(),
  perWeekPace: numeric("per_week_pace", { precision: 5, scale: 3 }).notNull(), // lbs/week
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  createdAt: createdAt(),
});

// ── Weight plans (Phase 2b: many per profile, dated, with a mode) ─────────────
// Supersedes weight_goals (one-per-profile). A plan is a dated segment you chain:
// lose → maintain → lose, switched any time. `mode` picks the target shape —
// 'lose' = a declining line to goalWeight at perWeekPace; 'maintain' = a flat
// band at goalWeight ± rangeLb. `endDate` null = the active plan; set it (past OR
// a future deadline like "lose 5 by the wedding") and the next plan takes over.
export const weightPlans = pgTable(
  "weight_plans",
  {
    id: serial("id").primaryKey(),
    profileId: integer("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    mode: varchar("mode", { length: 20 }).notNull().default("lose"), // lose | maintain
    startWeight: numeric("start_weight", { precision: 5, scale: 1 }).notNull(),
    startDate: date("start_date").notNull(),
    goalWeight: numeric("goal_weight", { precision: 5, scale: 1 }).notNull(),
    perWeekPace: numeric("per_week_pace", { precision: 5, scale: 3 }).notNull().default("0"), // lose
    rangeLb: numeric("range_lb", { precision: 4, scale: 1 }), // maintain: ± band around goalWeight
    endDate: date("end_date"), // null = active plan; else the segment's last day
    createdAt: createdAt(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("idx_weight_plans_profile").on(t.profileId, t.startDate)],
);

// ── Inferred types for use across the app ─────────────────────────────────────
export type Group = typeof groups.$inferSelect;
export type NewGroup = typeof groups.$inferInsert;
export type Account = typeof accounts.$inferSelect;
export type NewAccount = typeof accounts.$inferInsert;
export type Passkey = typeof passkeys.$inferSelect;
export type NewPasskey = typeof passkeys.$inferInsert;
export type Vehicle = typeof vehicles.$inferSelect;
export type NewVehicle = typeof vehicles.$inferInsert;
export type MaintenanceRecord = typeof maintenanceRecords.$inferSelect;
export type NewMaintenanceRecord = typeof maintenanceRecords.$inferInsert;
export type FuelLog = typeof fuelLogs.$inferSelect;
export type NewFuelLog = typeof fuelLogs.$inferInsert;
export type Part = typeof parts.$inferSelect;
export type NewPart = typeof parts.$inferInsert;
export type BuildTask = typeof buildTasks.$inferSelect;
export type NewBuildTask = typeof buildTasks.$inferInsert;
export type WishlistItem = typeof wishlistItems.$inferSelect;
export type NewWishlistItem = typeof wishlistItems.$inferInsert;
export type JournalEntry = typeof journalEntries.$inferSelect;
export type NewJournalEntry = typeof journalEntries.$inferInsert;
export type Checklist = typeof checklists.$inferSelect;
export type NewChecklist = typeof checklists.$inferInsert;
export type ChecklistItem = typeof checklistItems.$inferSelect;
export type NewChecklistItem = typeof checklistItems.$inferInsert;
export type Attachment = typeof attachments.$inferSelect;
export type NewAttachment = typeof attachments.$inferInsert;
export type Resource = typeof resources.$inferSelect;
export type NewResource = typeof resources.$inferInsert;
export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;
export type Exercise = typeof exercises.$inferSelect;
export type NewExercise = typeof exercises.$inferInsert;
export type Workout = typeof workouts.$inferSelect;
export type NewWorkout = typeof workouts.$inferInsert;
export type WorkoutItem = typeof workoutItems.$inferSelect;
export type NewWorkoutItem = typeof workoutItems.$inferInsert;
export type WorkoutAssignment = typeof workoutAssignments.$inferSelect;
export type NewWorkoutAssignment = typeof workoutAssignments.$inferInsert;
export type WeighIn = typeof weighIns.$inferSelect;
export type NewWeighIn = typeof weighIns.$inferInsert;
export type WeightGoal = typeof weightGoals.$inferSelect;
export type NewWeightGoal = typeof weightGoals.$inferInsert;
export type WeightPlan = typeof weightPlans.$inferSelect;
export type NewWeightPlan = typeof weightPlans.$inferInsert;
