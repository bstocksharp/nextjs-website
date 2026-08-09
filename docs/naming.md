# Naming & domain notes (for the someday-product)

_Brainstormed 2026-08-08. The hub today: garage/cars, workouts, weight — with
budget/finance, housekeeping/home-maintenance, and a family chore chart planned.
Goal: a name big enough to contain money + body + cars + home without being
about any one of them._

## The two metaphors that work

Only two metaphors cover everything the app does:

1. **The place that contains everything** — roof, hearth, home, port.
2. **The role that tends everything** — keeper, steward.

## Candidates

### The "keeper" family
"Keeping" is secretly the whole feature list: book**keeping**, house**keeping**,
record-**keeping**, **keeping** fit, up**keep**.

| Name | Notes |
|---|---|
| **WellKept** ⭐ | A well-kept home, a well-kept budget, a well-kept you. Brandable, warm, slightly premium. Try `wellkept.app` |
| **Hearthkeep** ⭐ | Hearth (the vibe Bryce likes) + keep (castle-keep *and* upkeep). Uncommon compound → domains plausibly free |
| **Homekeep** | Clean, obvious, does what it says |
| ~~Upkeep~~ | Taken — existing maintenance SaaS |

### The "steward" family
Pitch-deck fun fact: *steward* is Old English *stigweard* — literally "house
guardian." A thousand years of meaning "the person who tends the household."

| Name | Notes |
|---|---|
| **Homesteward** | The etymology story, spelled out |
| **Homesteady** | Pun: homestead + *steady* (steady budget, steady weight, steady routines). Maybe too cute |
| Stewardly | Weaker but checkable |

### The "roof" family
"Everything under one roof" — cars, people, money.

- **OneRoof** — conflict: NZ real-estate site
- Better as the **tagline** than the name

### The "place" family
- **Homeport** ⭐ — nautical: the port every ship returns to (covers the cars nicely)
- **Roost** — "rules the roost"; short = contested domains
- Homeroom — cozy but smells like a school app
- Den / Burrow / Warren — den is good; one-syllable domains are a bloodbath

### Rejected directions
- **housekey** — good word, but it names the *login system*, not the app
  (house/security flavor; doesn't cover budget/weight). See verdict below.
- Anything with **hub** — crowded space (Google/Insteon burned the word)
- **hearth** bare — nothing good available (checked 2026-08)
- nest (Google), homebase/basecamp (taken products), keeper (password manager),
  famly (childcare product), kin (fintech)

## Shortlist to type into Porkbun

**WellKept → Hearthkeep → Homekeep → Homeport → Homesteady**, checking `.app`
first, `.com` if flush, `.family` as the charming alternate.

## Domain guidance

- **TLDs:** `.app` = sweet spot (forces HTTPS, which we already satisfy).
  `.family` (~$20/yr) = perfect for the family-identity angle
  (`<lastname>.family`). `.com` = product credibility later. `.live` = weak
  (streamer vibes). `.io` = dated + pricey. `.home` doesn't exist as a TLD.
- **Registrars:** Porkbun or Cloudflare Registrar — at-cost, no renewal ambush.
  Squarespace/GoDaddy tease year one, then jack renewals.
- **housekey.live verdict (real quote, Aug 2026):** $10 first year but **$20/yr
  renewal** ($50 for 3 years). Wrong TLD + not-the-right-name + teaser pricing =
  pass. Put the $50 toward the real name.

## Future-proofing truths

1. **The name matters more than the domain.** Real products rename before
   launch all the time — a cheap domain today is a bookmark, not a marriage.
2. **Passkeys marry the domain** (WebAuthn rpID binds to hostname). Whatever
   domain the family enrolls Face ID on has switching friction — re-registering
   is 5 minutes at family scale, real friction at product scale. So pick the
   deploy domain *before* Lauren registers, even if the someday-product later
   launches elsewhere. A domain move needs **zero code changes** (rpID derives
   from the request Host) — only passkey re-enrollment.
3. **Free fallback that's always valid:** `hub.bstocksharp.dev` — five minutes
   to set up, résumé-friendly, a legitimate forever-home if this stays
   family + portfolio.
