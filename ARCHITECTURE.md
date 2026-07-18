# Architecture

A personal **hub of small apps** — one Next.js site whose root is a launcher, with
each app living under `app/<slug>`. Today: **Garage** (cars / the Miata build) and
**Workout** (a phone-first exercise companion). Everything is *public to view,
password to edit*.

## Stack

- **Next.js 15** (App Router — React Server Components + Server Actions)
- **React 19**, **TypeScript** (strict)
- **MUI v7** with Emotion and a CSS-variable theme (no Tailwind)
- **Drizzle ORM** on **Neon Postgres** (serverless HTTP driver)
- Deployed on **Vercel**
- No client state library — server state is the DB (RSC reads + Server Actions);
  local UI state is plain React hooks.

## Directory map

```
app/
  layout.tsx            root shell (fonts, color-scheme, PWA metadata) — app-agnostic
  providers.tsx         MUI ThemeProvider + emotion cache (the one root client boundary)
  theme.ts, tokens.ts   design system (tokens → theme; colors/fonts/radius)
  page.tsx              THE HUB launcher (maps over lib/apps.tsx)
  manifest.ts           web app manifest (installable / standalone)
  apple-icon.tsx        iOS home-screen icon (generated via next/og)
  error.tsx, loading.tsx
  unlock/               shared editor password screen
  actions/*.ts          "use server" mutations, one file per domain (auth, vehicles, …, workout)
  garage/**             the Garage app (its own layout/error + CRUD routes)
  workout/**            the Workout app

components/
  shared/    app shell + generic primitives — AppHeader, AppSwitcher, ColorModeToggle,
             EditControl, SubmitButton, DeleteIconButton, NumberField, Pill, SavedToast
  garage/    car-specific (Vehicle*, Build*, Maintenance*, Fuel*, Parts*, Wishlist*, Journal*)
  workout/   workout-specific (WorkoutRunner, WeekSchedule, CatalogList, builder forms, …)

lib/
  apps.tsx              the app registry (drives the hub grid + header switcher)
  auth.ts               password-to-edit (HMAC cookie)
  db/index.ts           Drizzle client (Neon HTTP, server-only)
  db/schema.ts          ONE file, every table
  queries/*.ts          server-only reads, one file per domain
  build.ts, workout.ts  domain constants + pure helpers (safe for client)
  format.ts             Intl money/date/miles formatters

scripts/                node utilities (seed-workout.mjs, inspect-db.mjs) — raw SQL via Neon
```

## Adding a new app (the recipe)

1. **Register it:** add one `AppDef` to [`lib/apps.tsx`](lib/apps.tsx) — this alone
   lights it up in the hub grid ([`app/page.tsx`](app/page.tsx)) and the header
   `AppSwitcher`.
2. **Create the route folder** `app/<slug>/`: `layout.tsx` (renders `<AppHeader
   current="<slug>" nav={…} editControl={<EditControl/>} />`), `error.tsx` (copy
   garage's), `page.tsx`.
3. **If it needs data:** add tables to `lib/db/schema.ts` → `npm run db:push`; write
   reads in `lib/queries/<domain>.ts` (`import "server-only"`) and writes in
   `app/actions/<domain>.ts` (`"use server"`, each guarded by `requireEditor()`).
4. **Components** go in `components/<slug>/`; only cross-app/generic ones go in
   `components/shared/`.

## Auth — public to view, password to edit

[`lib/auth.ts`](lib/auth.ts): there are no user accounts. A single shared
`EDIT_PASSWORD` unlocks editing for everyone; the cookie value is an HMAC of
`"editor"` keyed by `COOKIE_SECRET` (unforgeable). `isEditor()` gates UI; every
mutating action calls `requireEditor()`. Missing secrets degrade to read-only
(never crash). Unlock at `/unlock`.

## Data layer

- **Client:** [`lib/db/index.ts`](lib/db/index.ts) — one Drizzle instance over the
  Neon HTTP driver, server-only.
- **Schema:** [`lib/db/schema.ts`](lib/db/schema.ts) — one file, `serial` PKs,
  `varchar` status/category/section fields documented inline (not PG enums — kept
  flexible), `$inferSelect`/`$inferInsert` types exported per table.
- **Reads:** `lib/queries/*.ts`, called directly inside Server Components (no HTTP
  round-trip).
- **Writes:** `app/actions/*.ts` — `requireEditor()` → parse `FormData` → Drizzle
  write → `revalidatePath(...)` (→ `redirect(...)` for one-shot forms). **Auto-save
  editors** (workout builder, schedule) submit on blur/change and *revalidate in
  place* (no redirect, no scroll jump).
- **Migrations:** `npm run db:push` (drizzle-kit push — no versioned migration
  files). `npm run db:studio` to browse. Seed with `node scripts/seed-workout.mjs`
  (`--reset` wipes and reseeds).

## The Workout app

**Tables** (all in `schema.ts`):

- `workout_profiles` — the people (Bryce, Lauren). Profiles are *data*, not accounts.
- `exercises` — the **shared catalog** with recommended defaults (`defaultReps`,
  `defaultDuration`, `defaultWeight`, `holdLast`, `description`, `tips`).
- `workouts` — a **shared library** of routines. `createdByProfileId` is just
  "saved by" (any unlocked editor can edit any workout). A workout has three
  sections; **MAIN is a circuit** rotated `rounds` times; `restBetweenRounds`
  controls the rest between rounds.
- `workout_items` — ordered exercises in a workout, tagged with `section`
  (warmup | main | cooldown). Per-item overrides (`reps`, `duration`, `weight`,
  `holdLast`) fall back to the exercise when null.
- `workout_assignments` — **per-profile scheduling**: `(profileId, weekday) →
  workoutId`, unique per profile+weekday. A workout can be reused across days and
  profiles.

**Derived model** ([`lib/workout.ts`](lib/workout.ts)): an item's *mode* isn't
stored — **reps present → rep-based; otherwise timed**. `duration` means *per-rep
seconds* when reps are set (auto mode times each rep), else *total hold*.
`resolveItem()` merges an item with its exercise into a `ResolvedItem` that both the
builder and the runner consume.

**Key screens:**

- **Dashboard** (`app/workout/page.tsx`) — profile switcher, today's workout + this
  profile's week ([`WeekSchedule`](components/workout/WeekSchedule.tsx), uses the
  phone's clock), and the shared library.
- **Builder** (`app/workout/[id]/edit`) — **fully auto-save** (no Save buttons):
  meta saves on blur, items add-on-select and edit inline (accordion), reorder/remove
  are instant.
- **Schedule** (`app/workout/schedule`) — per-profile weekday → workout, auto-saved.
- **Day view** (`app/workout/day/[weekday]`) — see/setup any day (incl. rest days).
- **The runner** (`app/workout/[id]/run` + [`WorkoutRunner`](components/workout/WorkoutRunner.tsx)):
  `buildSteps()` expands **warmup (once) → main (× rounds) → cooldown (once)** with a
  10-second "Get ready" prep between exercises and a rest between rounds. The dial:
  *timed* = a depleting clock ring; *reps with a per-rep time* = a **breathing inner
  disc** that peaks at the midpoint with the rep count; *manual reps* = big target +
  "Done → Next". **Hold-last-rep** doubles the final rep (build → HOLD at the top →
  fall). Auto-advance toggle, WebAudio beep + colour flash + vibrate at zero, screen
  wake-lock, random rotating tip + ⓘ description.

## Conventions

- **One [`Pill`](components/shared/Pill.tsx)** for every chip (targets, rounds,
  "saved by", categories, profile labels) — never a raw MUI `Chip` for those.
- RSC by default; `"use client"` only where there's interactivity.
- Auto-save editors submit on change (no Save/Cancel); one-shot create forms keep an
  explicit submit.

## Dev & deploy

- `npm run dev` · `npm run db:push` · `npm run db:studio` · `node scripts/seed-workout.mjs`
- **Env** (`.env.local`, gitignored): `POSTGRES_URL` / `POSTGRES_URL_NON_POOLING`
  (Neon, auto from the Vercel integration), `COOKIE_SECRET` + `EDIT_PASSWORD`
  (editor auth). ⚠️ The auth vars are **local-only today** — add them in Vercel →
  Environment Variables for editing to work on the deployed site (viewing/running
  works without).
- **PWA:** the hub is installable ("Add to Home Screen") and runs standalone via
  `app/manifest.ts` + `public/icon.svg` + `app/apple-icon.tsx`.
