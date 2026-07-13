# 🏁 Bryce's Garage — Master Build Plan

> Single source of truth for the rebuild. Supersedes `CAR_TRACKER_PLAN.md` (that one can be deleted).
> We build this **phase by phase**. Each phase ends at a checkpoint where Bryce reviews, tests,
> and can add his own code before we move on. One branch, one big PR at the end. No rush.

---

## 1. What we're building

**Bryce's Garage** — a personal web app that is two things at once:

1. **A garage tracker** for real vehicles (current cars + the future Miata): maintenance history,
   fuel/MPG, parts inventory, costs, reminders, photos.
2. **A "Miata Bible"** — a living digital owner's binder for the dream **NA Miata** build:
   buying checklist, phased build plan, dream-parts wishlist, build journal, and reference content.

Designed to grow into a **personal catch-all hub** later (other projects/sections can be added without a rewrite).

**Owner:** Bryce. Single editor, public to read. **Not slammed. Tasteful OEM+.** 😄
Build philosophy baked into the app: **Reliability → Safety → Handling → Power (last).**

> Bryce does **not** own the Miata yet (pre-purchase, no rush) — so the pre-purchase tools
> (buying checklist, build plan, wishlist, resources) are genuinely useful *now*, and the maintenance
> logging matters most for current cars today.

---

## 2. Stack & decisions (locked)

| Area | Choice | Notes |
|---|---|---|
| Runtime | **Node 24 LTS** | Node 18 was EOL; installed 24. See Phase 0. |
| Framework | **Next.js 15** (App Router) | React Server Components + Server Actions. |
| UI lib | **React 19** | Pairs with Next 15. |
| Components | **MUI v7** + emotion | `@mui/material-nextjs` for App Router SSR (no FOUC). No Tailwind. |
| Data | **Drizzle ORM** + drizzle-kit | Typed schema + migrations; scales as tables grow. |
| DB | **Vercel/Neon Postgres** | Already provisioned; `POSTGRES_*` in `.env.local`. Driver: `drizzle-orm/vercel-postgres`. |
| File storage | **Vercel Blob** | For photos/receipts (Phase 7). |
| Auth | **Password-to-edit** | Public read; HMAC-signed httpOnly cookie. No accounts. Generalizes to the whole hub. |
| Host | **Vercel Hobby** | Free, no card, cannot overage-bill. Custom domain free. |
| Package mgr | **npm** | `package-lock.json` present. |

---

## 3. Data model (Drizzle / Postgres)

Core tables (grow over time; all timestamps `TIMESTAMPTZ default now()`):

- **vehicles** — `id, name, status('owned'|'prospect'|'dream'|'sold'), make, model, year, trim, vin,
  license_plate, color, interior_color, transmission, purchase_date, purchase_price, purchase_mileage,
  current_mileage, hero_photo_url, notes`
- **maintenance_records** — `id, vehicle_id→vehicles, service_type, category, service_date, mileage,
  cost, vendor, notes, next_due_date, next_due_mileage` (reminders)
- **fuel_logs** — `id, vehicle_id, fill_date, odometer, gallons, price_per_gallon, total_cost,
  is_full_tank, notes` (MPG computed in queries)
- **parts** — `id, vehicle_id, name, brand, part_number, category, link, cost, installed_date,
  maintenance_record_id (nullable), notes` (parts inventory)
- **build_tasks** — `id, vehicle_id, phase, title, description, category, priority, status
  ('planned'|'in_progress'|'done'), cost_estimate, actual_cost, completed_date, sort_order`
  (unifies build-plan phases + goals + "immediate maintenance" list, with progress bars)
- **wishlist_items** — `id, vehicle_id, item, brand, price, rating(1-5), priority, link, purchased,
  purchased_date, notes` (dream parts + budget tracker)
- **journal_entries** — `id, vehicle_id, entry_date, title, body, mileage` (build journal)
- **checklists** — `id, title, vehicle_id (nullable), year, price, location, seller, mileage, link,
  verdict, inspected_date, overall_notes` (one per candidate car you go inspect)
- **checklist_items** — `id, checklist_id→checklists, category, label, status('ok'|'concern'|'fail'),
  checked, notes, sort_order` (seeded from a buying-checklist template)
- **attachments** — `id, owner_type, owner_id, url, pathname, content_type, caption` (photos/receipts, polymorphic)
- **resources** — `id, category, title, url, notes, sort_order` (links/specs you collect over time)

**Reference content** (buying-guide narrative, build philosophy, OEM+ dream spec) is authored as
**pages**, not CRUD — sourced from Bryce's own detailed writeup.

---

## 4. Architecture / folders

```
drizzle.config.ts            # drizzle-kit config (schema path, postgres, url from env)
drizzle/                     # generated migrations
lib/
  db/index.ts                # drizzle client (drizzle-orm/vercel-postgres)
  db/schema.ts               # all table definitions
  db/seed.ts                 # seed checklist template, build-plan phases, resources
  auth.ts                    # HMAC sign/verify, isEditor() (async cookies() in Next 15), set/clear cookie
  format.ts                  # money + dates via Intl (no date-fns)
  queries/*.ts               # typed read queries per domain (vehicles, maintenance, fuel, ...)
app/
  layout.tsx                 # server shell: header ("Bryce's Garage"), nav, <Providers>
  providers.tsx              # 'use client' MUI AppRouterCacheProvider + ThemeProvider
  theme.ts                   # MUI dark theme
  globals.css                # minimal base
  page.tsx                   # hub home: garage overview + Bible entry points
  garage/page.tsx            # vehicle cards
  garage/[id]/page.tsx       # vehicle dashboard (overview, maintenance, fuel, parts, build, journal)
  bible/{buying-guide,build-plan,dream-spec,resources}/page.tsx   # reference content
  checklists/page.tsx, checklists/[id]/page.tsx                   # inspection checklists
  unlock/page.tsx            # password unlock
  api/init/route.ts          # seed reference data
  api/upload/route.ts        # Vercel Blob upload (Phase 7)
app/actions/*.ts             # 'use server' mutations per domain, each guarded by isEditor()
components/                  # MUI pieces (VehicleCard, RecordTable, forms, ProgressBar, EditGate, ...)
```

Auth stays generic ("editor unlock"), so a future `/finance` or `/tools` section reuses it.

---

## 5. Phased roadmap (checkpoints in **bold**)

### Phase 0 — Environment *(Bryce's action, unblocks everything)*
Install **Node 22 LTS** (see §6). **✅ Checkpoint: `node -v` shows v22.x.**

### Phase 1 — Scaffolding
Branch `garage`; scorched earth (delete `app/` + `public/`, keep root configs); new `package.json`
(Next 15, React 19, MUI v7, `@mui/material-nextjs`, Drizzle + drizzle-kit); `npm install`; configs;
MUI providers/theme/layout shell; minimal home page.
**✅ Checkpoint: `npm run dev` shows a styled empty app on Next 15.**

### Phase 2 — Data layer + auth
Drizzle `schema.ts`; db client; `drizzle-kit push` to the live DB; drop leftover `dinner_table`;
seed reference data. Auth (`lib/auth.ts` + unlock/lock). Add `EDIT_PASSWORD` (Bryce) + `COOKIE_SECRET` (generated).
**✅ Checkpoint: tables exist; unlock/lock works.**

### Phase 3 — Garage core
Vehicles CRUD; garage list; vehicle dashboard (overview). Add the dream Miata as a `dream` vehicle.
**✅ Checkpoint: manage vehicles; edit gated by password.**

### Phase 4 — Tracking (maintenance, fuel, parts)
Maintenance log (add/edit/delete, newest first, categories, reminders); fuel log + MPG; parts inventory;
cost summaries; due-soon surfacing on home.
**✅ Checkpoint: full tracking end-to-end.**

### Phase 5 — The Build (Miata's star features)
`build_tasks` phased plan with progress bars + goals; dream-parts wishlist + budget; build journal;
vehicle dashboard shows progress + spend split (maintenance vs mods).
**✅ Checkpoint: build features usable.**

### Phase 6 — The Bible (reference content)
Author buying-guide, build-plan philosophy, dream-spec, resources pages from Bryce's writeup.
Inspection checklists (create/fill per candidate car, printable/mobile-friendly).
**✅ Checkpoint: reference + checklists live.**

### Phase 7 — Photos / receipts
Create Vercel Blob store (Bryce → `BLOB_READ_WRITE_TOKEN`); upload route; attachments on records/journal/vehicles.
**✅ Checkpoint: images upload and display.**

### Phase 8 — Polish + deploy
Dashboard charts (spend over time, maint-vs-mods), conditional highlighting (overdue / high-priority),
printable checklist, mobile pass, `npm run build`. Bryce sets Vercel env vars, merges the one big PR to
`main` → auto-deploy; point the owned domain at it.
**✅ Checkpoint: live on the domain.**

---

## 6. Phase 0 — Install Node 22 (Windows) — do this first

Pick one:

- **Simplest — installer:** download the **LTS** installer from https://nodejs.org (Node 22.x "Jod"),
  run it, then **restart the terminal**.
- **winget:** `winget install OpenJS.NodeJS.LTS`
- **Version manager (keeps Node 18 around too):** install **fnm** (`winget install Schniz.fnm`) or
  nvm-windows, then `fnm install 22 && fnm use 22`.

Verify: `node -v` → `v22.x`, `npm -v` → 10.x. Then we start Phase 1.
(Vercel side: we'll set `"engines": { "node": "22.x" }` in `package.json` and Node 22 in project settings so local = prod.)

---

## 7. Secrets / env vars (in `.env.local`, gitignored; also in Vercel dashboard for prod)

- `POSTGRES_*` — already present ✅
- `EDIT_PASSWORD` — **Bryce picks** (Phase 2). Add locally; don't paste in chat.
- `COOKIE_SECRET` — generated (Phase 2).
- `BLOB_READ_WRITE_TOKEN` — from the Vercel Blob store (Phase 7).

---

## 8. Progress log
_(We'll check off phases here as we go.)_

- [x] Phase 0 — Node 24 installed ✅
- [x] Phase 1 — Scaffolding ✅ (Next 15.5, React 19.2, MUI 7.3, Drizzle; build green, styled SSR)
- [x] Phase 2 — Data layer + auth ✅ (Neon driver + Drizzle, 11 tables live, password-to-edit)
- [x] Phase 3 — Garage core ✅ (vehicle CRUD, loading states, formatted form fields)
- [ ] Phase 4 — Tracking (4a maintenance ✅ · 4b fuel ✅ · 4c parts · 4d summaries)
- [ ] Phase 5 — The Build
- [ ] Phase 6 — The Bible
- [ ] Phase 7 — Photos
- [ ] Phase 8 — Polish + deploy
