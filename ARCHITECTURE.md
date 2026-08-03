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
  login/                the global sign-in page (the only page reachable signed out)
  unlock/               per-profile edit-password screen (behind the login)
  actions/*.ts          "use server" mutations, one file per domain (session, auth, vehicles, …)
  garage/**             the Garage app (its own layout/error + CRUD routes)
  workout/**            the Workout app

components/
  shared/    app shell + generic primitives — AppShell (per-app chrome), AppHeader,
             AppSwitcher, ProfileControl (account menu: switch/add people +
             appearance + editing lock), SubmitButton, DeleteIconButton,
             NumberField, SavedToast
  garage/    car-specific (Vehicle*, Build*, Maintenance*, Fuel*, Parts*, Wishlist*, Journal*)
  workout/   workout-specific (WorkoutRunner, WeekSchedule, CatalogList, builder forms, …)

proxy.ts                the login gate (session check + redirect, rolling renewal)

lib/
  apps.tsx              the app registry (drives the hub grid + header switcher)
  session-core.ts       session-token mint/verify (WebCrypto — shared w/ the proxy)
  session.ts            session cookie helpers + requireSession() (server-only)
  auth.ts               per-profile edit locks (password-to-edit, HMAC cookie)
  db/index.ts           Drizzle client (Neon HTTP, server-only)
  db/schema.ts          ONE file, every table
  queries/*.ts          server-only reads, one file per domain
  build.ts, workout.ts  domain constants + pure helpers (safe for client)
  format.ts             Intl money/date/miles formatters

scripts/                node utilities (seed-workout.mjs, inspect-db.mjs) — raw SQL via Neon
```

## Adding a new app (the recipe)

1. **Register it:** add one `AppDef` to [`lib/apps.tsx`](lib/apps.tsx) — including
   its in-app `nav` links. This alone lights it up in the hub grid
   ([`app/page.tsx`](app/page.tsx)) and drives the header + `AppSwitcher`.
2. **Create the route folder** `app/<slug>/`: `layout.tsx` (just
   `<AppShell current="<slug>">{children}</AppShell>` — nav, hidden-apps, the
   account menu, appearance, and the editing lock are all resolved inside
   `AppShell`, so there's nothing else to wire), `error.tsx` (copy garage's),
   `page.tsx`.
3. **If it needs data:** add tables to `lib/db/schema.ts` → `npm run db:push`; write
   reads in `lib/queries/<domain>.ts` (`import "server-only"`) and writes in
   `app/actions/<domain>.ts` (`"use server"`, each guarded by `requireEditor()`).
4. **Components** go in `components/<slug>/`; only cross-app/generic ones go in
   `components/shared/`.

## Auth — two layers: a global login, then per-profile edit locks

**Layer 1 — the login (the real security boundary).** The hub is **private**:
[`proxy.ts`](proxy.ts) (Next 16.3's rename of the `middleware` convention)
redirects signed-out visitors to `/login` (allowlisting only the manifest/icon
routes a PWA install needs). Sessions are 90-day **rolling** signed cookies
(`hub_session`, HMAC via [`lib/session-core.ts`](lib/session-core.ts) — WebCrypto
so the same code runs in the proxy and actions; server helpers in
[`lib/session.ts`](lib/session.ts)). Any visit past the half-life re-issues the
cookie, so devices in regular use never log out. Accounts (`accounts` table) are
login identities, distinct from profiles; there is **no signup UI** — create one
with `node scripts/create-account.mjs <username>` (`--reset` to change a
password). The proxy fails **closed** (no `COOKIE_SECRET` → nobody in), and the
write guards call `requireSession()` too, so a proxy bypass still can't mutate
anything.

**Layer 2 — edit locks (social, not security).** [`lib/auth.ts`](lib/auth.ts):
behind the login, viewing is open to the household; *editing* is gated per
profile by an **optional** edit password (`profiles.editPasswordHash`, scrypt).
Unlocked profile ids ride in the signed `hub_edit_unlocks` cookie. `isEditMode()`
gates UI; every mutating action calls `requireEditor()` (communal) or
`requireEditorFor(owner)` (owned) — see [`lib/authz.ts`](lib/authz.ts) for
resource-aware guards. It's a forgiving "hands off my stuff" layer for a trusted
household, not a boundary.

## Profiles, visibility & access

**Profiles are hub-wide "who's using it" identities** (the `profiles` table — Bryce,
Lauren), not accounts. The active profile is a persisted preference (`active_profile`
cookie — [`lib/profile.ts`](lib/profile.ts) `getActiveProfile()`, precedence:
`?profile` override → cookie → first profile). The header shows and switches it
([`ProfileControl`](components/shared/ProfileControl.tsx) →
[`ProfileMenu`](components/shared/ProfileMenu.tsx)); unlocked editors can add people.
It renders in every app header, so identity is consistent hub-wide.

**Profiles are NOT a security boundary (by design).** Anyone signed in may switch
profiles freely; the optional per-profile edit passwords are a courtesy lock, not
a permission system. The real gate is the global login above. Two consequences:

- **Visibility = organization, not permission.** A vehicle has an **owner**
  (`vehicles.profile_id`) and a **visibility** (`vehicles.visibility`: `shared` |
  `private`, default `shared`). The garage grid/dashboard shows
  `visibility = 'shared' OR owner = active profile`. Everything hanging off a vehicle
  (maintenance, fuel, parts, builds, wishlist, journal) inherits that scope;
  `resources` and `checklists` stay shared. A shared car (e.g. a household RAV4) shows
  for everyone and any unlocked editor can log to it; a private car shows only in its
  owner's garage.
- **Editing stays gated by the one site password**, regardless of profile — any
  unlocked person can edit any car they can see.

**Lifecycle:** editors add people (profile menu → *Add person*) and manage them at
**`/people`** (linked from the switcher). *Deactivate* soft-deletes
(`profiles.archived_at`) — hidden from the switcher, can't be active, **all data
kept**; *Reactivate* restores. *Delete forever* is irreversible: it reassigns the
person's **shared** cars + authored workouts to a chosen **heir**, then deletes their
**private** cars (cascading that history) and their weekly schedule. Guards: can't
deactivate the last active profile or delete without an heir, and
`workouts.createdByProfileId` is `ON DELETE RESTRICT` so a delete can never nuke
shared routines out from under someone.

**Future direction (auth roadmap):** the account login above is Phase A. Phase B
adds passkeys (WebAuthn/Face ID) on top of it; Phase C adds **groups** (one group
= a household holding accounts + profiles + all data) so a demo account can exist
with its own sandboxed, reseed-on-login data — that's when every query gains a
tenant filter. `visibility` can then grow a `custom` value backed by a
`vehicle_shares` join table (vehicleId, profileId, canEdit) — no rework of the
owner/visibility columns.

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

- `profiles` — the hub-wide people (Bryce, Lauren). Profiles are *data*, not accounts;
  see **Profiles, visibility & access** above.
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

- **One chip style, from the theme** — MUI `Chip` is styled globally in
  [`app/theme.ts`](app/theme.ts) (`MuiChip`) as a compact outlined pill, so every
  chip (targets, rounds, "saved by", categories, profile labels, statuses) is
  consistent. Use plain `Chip`; pass `variant="filled"` / `size="medium"` to opt out.
- RSC by default; `"use client"` only where there's interactivity.
- Auto-save editors submit on change (no Save/Cancel); one-shot create forms keep an
  explicit submit.

## Dev & deploy

- `npm run dev` · `npm run db:push` · `npm run db:studio` · `node scripts/seed-workout.mjs`
- **Env** (`.env.local`, gitignored): `POSTGRES_URL` / `POSTGRES_URL_NON_POOLING`
  (Neon, auto from the Vercel integration), `COOKIE_SECRET` (signs the session +
  edit-unlock cookies). ⚠️ `COOKIE_SECRET` must be set in Vercel → Environment
  Variables **before deploying the login gate** — the proxy fails closed
  without it, so nobody (including us) can sign in.
- **PWA:** the hub is installable ("Add to Home Screen") and runs standalone via
  `app/manifest.ts` + `app/manifest-icon/route.tsx` (generated PNG icons, profile
  color + initial) + `app/apple-icon.tsx` (iOS). `public/icon.svg` is a static
  fallback kept for reference, no longer referenced by the manifest.
