# SETUP.md

Day 1 to day 6, in order. The ordering principle is that **the rules exist before
the code does.** Once three agent-written branches are in flight, retrofitting
branch protection and a tenant guardrail means rewriting work instead of shaping it.

---

## Day 1: accounts

### GitHub, starting on the Free plan

We are starting on Free. Know exactly what that costs, because it fails silently.

**GitHub does not enforce rulesets or branch protection on private repositories on
the Free plan.** Required reviews, required status checks, blocked force-push: you
can configure all of them, they will appear in the settings UI, and they will do
nothing. No warning, no error.

So on Free:

| Rule                          | Status                                           |
| ----------------------------- | ------------------------------------------------ |
| CI runs on every PR           | **Works.** Actions runs on private repos on Free |
| A red CI run blocks the merge | **Does not work.** You can merge red             |
| One approval required         | **Does not work.** You can merge unreviewed      |
| Direct push to `main` blocked | **Does not work.** Except locally, see below     |
| Force-push to `main` blocked  | **Does not work**                                |

Everything in `CONTRIBUTING.md` still applies. It is just enforced by the three of
you rather than by GitHub, and the local pre-push hook below covers the one case
that is easiest to do by accident.

`.github/rulesets/main-protection.json` stays committed. The day you upgrade, it is
a one-click import and every rule turns on at once.

- [ ] Create the repository, private
- [ ] Invite the other two
- [ ] Everyone installs the pre-push hook (day 2)

**Revisit the plan when** any of these happens, and treat it as the signal rather
than a nice-to-have:

- Something merges to `main` that nobody reviewed
- Anyone force-pushes `main`, even harmlessly
- A red PR gets merged because the red looked unrelated
- You hire or bring in a fourth person

At that point it is about 4 USD per user per month on Team, so roughly 12 USD for
three. The reason to pay is not the feature list, it is that unenforced review among
three people running agents degrades quietly, and you find out afterwards.

### Turso: three databases

Full reasoning in `docs/ENVIRONMENTS.md`. The short version: production, preview
and development are separate databases so that a broken migration in a PR cannot
reach a carrier's fiscal documents.

Do this in the dashboard at **app.turso.tech**, not the CLI. The Turso CLI has no
native Windows build (it requires WSL), and nothing in this repo needs it:
`db:migrate`, `db:generate`, `db:seed` and `db:check` all run through Node and
drizzle. The CLI is only useful later for `turso db shell`.

Create three databases and copy each one's URL and a generated auth token:

```
ai4logistics-prod
ai4logistics-preview
ai4logistics-dev
```

**On region.** Turso auto-detects the group location from where you create it, and
the Free plan allows exactly one group, which cannot be split later. Ours landed in
the US. That is survivable and arguably correct for now, because the latency that
matters is Vercel function to database, not user to database, and Vercel Hobby also
runs functions in a US region. Keep the two on the same continent and the round
trips stay short.

The target state is both in `gru` (Sao Paulo), close to the carriers. Moving there
means recreating the databases in a new group, which needs a paid Turso plan and is
trivial **only while there is no production data**. So it belongs in the same
upgrade step as Vercel Pro, before the first pilot carrier, not after.

- [ ] Three databases created
- [ ] `ai4logistics-dev` URL and token in `.env.local` **at the repository root**,
      not inside `packages/db`. `packages/db/src/env.ts` finds the root by walking
      up to `pnpm-workspace.yaml`, so the file only works in that one place
- [ ] `ai4logistics-prod` URL and token in **GitHub Secrets** as `TURSO_DATABASE_URL_PROD`
      and `TURSO_AUTH_TOKEN_PROD`, not on anyone's laptop
- [ ] `pnpm db:migrate` then `pnpm db:seed` against dev, and confirm two
      organisations exist

Free tier is 5GB storage, 500M rows read per month, 10M written, 100 databases and
1-day point-in-time restore. That covers 15 to 20 pilot carriers comfortably.

Move to Developer (4.99 USD a month) for 10-day restore **before the first paying
customer**. One day of restore on five years of fiscal documents is thin.

### Vercel

- [ ] Account, connect the GitHub org, import the repository
- [ ] **Root directory: `apps/web`**
- [ ] Environment variables per environment, per the table in
      `docs/ENVIRONMENTS.md`. Production, Preview and Development each get a
      different `TURSO_DATABASE_URL`
- [ ] Leave Vercel Authentication on for Preview deployments

**Two things about the Hobby plan you need to know before you deploy.**

_Cron jobs run once per day, maximum._ An hourly expression does not degrade
gracefully, it **fails the deployment outright**. `vercel.json` is set to
`0 9 * * *` for this reason. The MDF-e alert is the product, and a once-a-day
imprecise check is not the product, so **Vercel Pro is required before the first
pilot carrier.** Switch the schedule to `0 * * * *` the day you upgrade.

_Hobby is non-commercial use only,_ per Vercel's fair use guidelines, and it has no
team features, so your cofounders cannot be added. Fine while this is a prototype
with no users. Not fine once a carrier is relying on it. Pro is 20 USD per seat per
month.

Total to start: **0 USD a month.** GitHub Free, Turso free tier, Vercel Hobby.
The first real costs, both due before the first pilot: Vercel Pro at 20 USD, and
Turso Developer at 4.99 USD for 10-day restore.

---

## Day 2: rules, before any code

- [ ] Merge this scaffold to `main`
- [ ] Set merge settings: squash only, auto-delete branches. **These two do work on
      Free**, so turn them on now
- [ ] Every one of the three of you runs `pnpm hooks:install`. This is the only
      technical guard on `main` we have until the plan changes
- [ ] Verify the hook fires: on `main`, commit something trivial and try to push.
      It must be rejected. If it pushes, the hook is not installed.
      Note the hook deliberately allows the very first push, the one that creates
      `main` on the remote, so test this after the repo exists
- [ ] Read `CONTRIBUTING.md` together, out loud, once. Twenty minutes. On Free this
      reading is the enforcement mechanism, so do not skip it

Do **not** bother importing `.github/rulesets/main-protection.json` yet. On a Free
private repo it will look configured and do nothing, which is worse than knowing it
is off. It is committed and ready for the day you upgrade.

---

## Day 3: one trivial page in production

No features. The point is to prove the whole pipe works end to end while it is still
trivial to debug.

- [ ] `pnpm db:migrate` and `pnpm db:seed` against `ai4logistics-dev`
- [ ] `pnpm dev`, confirm the home page renders trips for organisation 1
- [ ] Open a PR, confirm the Vercel **Preview** deployment builds and that it is
      reading `ai4logistics-preview`, not dev and not prod
- [ ] Run the production migration workflow against `ai4logistics-prod`
- [ ] Merge, confirm the **Production** deployment builds and renders
- [ ] Hit `/api/cron/mdfe-closure-alerts` in production with the `CRON_SECRET`
      bearer token and confirm it returns 200 rather than 401

That last one matters: cron never fires on preview deployments, so a broken alert
route is invisible until production. Curl it by hand at least once.

If anything here is painful, fix it now. It will not get easier once there is real
code in the way.

---

## Day 4: guardrails

- [ ] ESLint `no-restricted-imports` blocking `unsafe.ts` (in this scaffold, verify
      it actually fires: import it somewhere on a branch and confirm lint fails).
      On Free this matters more than usual: CI going red does not block a merge, so
      the guardrails that run on your own machine before the push are the ones
      actually protecting tenant isolation
- [ ] CI green on a PR
- [ ] gitleaks running
- [ ] Seed script creating **two** organisations
- [ ] Isolation test passing, and confirm it fails when it should: add a table
      without `org_id` on a branch and watch it go red

A guardrail nobody has seen fail is not a guardrail yet. Test each one once.

---

## Day 5: agents

The agents repository at `github.com/7thcapitalist/Openclaw-Agents-Headquarter`
returns 404 from outside, so it is private or renamed.

**Recommended for three people: vendor the useful definitions into `.claude/`.**
The agents are then versioned alongside the code they operate on, so a rule change
and the code change that motivated it land in the same PR.

Use a git submodule at `.claude/agents-hq` only if the agents are genuinely shared
across several projects.

- [ ] Vendor or submodule the agent definitions
- [ ] Confirm the slash commands in `.claude/commands/` work for all three of you
- [ ] Everyone reads `CLAUDE.md` once, properly

---

## Day 6: close the open decisions

- [x] **ADR 0003, the fiscal emission provider.** Done: Focus NFe and Webmania BR
      were both read before the interface was designed, and the interface carries
      the marks of that (`capacidades`, asynchronous emission, our own idempotency).
      Still **Proposed**, not Accepted: no real emission has been made. The
      remaining work is a spike with homologação credentials
- [x] Implement the fake provider fully. `FakeFiscalProvider` and
      `FakeCiotProvider` in `packages/fiscal/src/fake/` are fully deterministic and
      cover the happy path plus six real rejection codes
- [ ] **ADR 0006, the CIOT provider.** New, and it exists because no fiscal API
      house issues a CIOT. Proposed: Extratta. Needs a commercial conversation,
      since no IPEF publishes prices
- [x] **Source the MDF-e closure deadline and its penalty.** Done, and the answer
      overturned the premise: **there is no deadline in hours or days.** The Ajuste
      SINIEF 21/2010 ties closure to events, not to a clock. The real, timeable
      consequences are the immediate block on the UF-pair plus vehicle and, at 30
      days, rejection 686 blocking the whole CNPJ. The guessed 24 hours is gone from
      the product. See `docs/domain/fluxos-documentais.md` §0.1 and §3.5, and
      `podeEncerrarMdfe` in `@ai4l/core`, which refuses to invent a clock
- [ ] **CIOT becomes mandatory inside the MDF-e on 23/11/2026** (rejection 684),
      per NT MDF-e 2026.001. That date comes from a vendor, not from SVRS: confirm
      it. It is item 1 of `docs/domain/fluxos-documentais.md` §8

---

## What comes after

Weeks 1-3 finalise the provider and scope the issuance UX. Weeks 4-8 build the
unified issuance flow and the trip dashboard, which is already sellable on its own.
Weeks 9-12 add settlement and the driver surface. Weeks 13-16 pilot with the first
five to ten customers from the validation interviews.
