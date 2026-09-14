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

| Rule | Status |
|---|---|
| CI runs on every PR | **Works.** Actions runs on private repos on Free |
| A red CI run blocks the merge | **Does not work.** You can merge red |
| One approval required | **Does not work.** You can merge unreviewed |
| Direct push to `main` blocked | **Does not work.** Except locally, see below |
| Force-push to `main` blocked | **Does not work** |

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

### Turso

- [ ] Account, then a database in the `gru` (Sao Paulo) region
- [ ] Copy the database URL and an auth token into `.env.local`

Free tier is 5GB storage, 500M rows read per month, 10M written, 100 databases and
1-day point-in-time restore. That covers 15 to 20 pilot carriers comfortably.

Move to Developer (4.99 USD a month) for 10-day restore **before the first paying
customer**. One day of restore on five years of fiscal documents is thin.

### Vercel

- [ ] Account, connect the GitHub organisation
- [ ] Import the repository, set the root directory to `apps/web`
- [ ] Add the environment variables from `.env.example`

Total to start: **0 USD a month.** GitHub Free, Turso free tier, Vercel free tier.
The first real cost is Turso Developer at 4.99 USD for 10-day restore, which is due
before the first paying customer, not before the first line of code.

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

- [ ] A page that reads one row from Turso and renders it
- [ ] Through a PR, reviewed, squash merged
- [ ] Deployed to production
- [ ] Confirm the Vercel preview built on the PR too

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

- [ ] **ADR 0003, the fiscal emission provider.** This is on the critical path. It
      sets unit cost per trip and therefore the pricing floor. Read the API docs of
      **at least two** providers before designing the adapter interface, otherwise
      the interface encodes one vendor's assumptions and defeats its own purpose
- [ ] Implement `FakeProvider` fully, so the trip flow, alert job, settlement and
      the entire UI can be built and tested while the comparison happens
- [ ] **Source the MDF-e closure deadline and its penalty.** The alert threshold is
      currently a guessed 24 hours and the alert is the product

---

## What comes after

Weeks 1-3 finalise the provider and scope the issuance UX. Weeks 4-8 build the
unified issuance flow and the trip dashboard, which is already sellable on its own.
Weeks 9-12 add settlement and the driver surface. Weeks 13-16 pilot with the first
five to ten customers from the validation interviews.
