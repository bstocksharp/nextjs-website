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
  index,
} from "drizzle-orm/pg-core";

const createdAt = () =>
  timestamp("created_at", { withTimezone: true }).defaultNow().notNull();

// ── Vehicles ────────────────────────────────────────────────────────────────
// Owned cars, sold cars, and the future dream Miata (status = 'dream').
export const vehicles = pgTable("vehicles", {
  id: serial("id").primaryKey(),
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
  category: varchar("category", { length: 60 }),
  title: varchar("title", { length: 200 }).notNull(),
  url: text("url"),
  notes: text("notes"),
  sortOrder: integer("sort_order").default(0),
  createdAt: createdAt(),
});

// ── Inferred types for use across the app ─────────────────────────────────────
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
