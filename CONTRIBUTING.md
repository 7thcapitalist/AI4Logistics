# Contributing

Read this once, together, before the first PR. It is the process half of the
engineering setup plan; `CLAUDE.md` is the technical half.

---

## Why these rules exist

Three founders, all shipping AI-generated code, on a product where a bug is a
government fine for a customer. That combination has two failure modes, and they
are not the ones a normal team designs against.

**Volume outruns review.** Agents produce more code than three people can read
carefully. The failure is not bad code, it is code that got approved without being
read.

**Decisions get silently reversed.** An agent with no memory of week 2 will
re-derive an architecture in week 6 in whichever direction the prompt leans.

Nearly everything below is a countermeasure to one of those two.

---

## Enforcement, and why it is on you right now

We are on GitHub Free with a private repo, which means **GitHub enforces none of
the rules below.** No required review, no required green CI, no blocked push to
`main`. See `SETUP.md` for the full table of what does and does not work.

Two consequences worth stating plainly:

1. Everything here is a promise between the three of you, not a gate. The failure
   mode is not someone deciding to break a rule, it is someone forgetting one at
   11pm and nothing stopping them.
2. The `pre-push` hook (`pnpm hooks:install`) blocks a direct push to `main` on your
   own machine. It is per-machine and trivially bypassed with `--no-verify`, so it
   catches accidents, not decisions. Install it anyway.

CI still runs on every PR. Read it. Nothing will stop you merging red, so merging
red is a choice you are making rather than one the tooling prevents.

## The flow

1. **Branch off `main`.** Every feature, every fix, no exceptions including
   one-line changes. `main` is always deployable.
2. **Build the feature and its tests on that branch.** Tests ship with the code
   they cover, never in a follow-up PR that never comes.
3. **Open a PR.** CI runs typecheck, lint, tests, build, `db:check` and a secret
   scan. Vercel builds a preview.
4. **One of the other two reviews it.** Not the author.
5. **Squash merge once green and approved.** The branch auto-deletes.

### Branch names

`<initials>/<type>/<description>`, for example `jv/feat/cte-issuance`.

Types: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`.

### PR titles

The PR title becomes the squashed commit message, so it follows Conventional
Commits: `feat: unified trip issuance flow`, `fix: settlement rounding on advances`.

---

## The two rules that are not generic good practice

### "What I verified myself" is mandatory

When all three of us ship agent-written code, this is the single most useful input
a reviewer gets.

"Tests pass" is not verification. The agent wrote the tests too. If the agent
misunderstood the requirement, it wrote tests that confirm the misunderstanding and
they are green.

Write what you exercised with your own hands. If the answer is "nothing, this is a
config change I read carefully", write that. An honest empty answer is useful. A
fabricated one defeats the whole mechanism.

### Migration PRs stand alone

No feature code alongside a migration. Merged and deployed before the code that
depends on it.

Migrations are additive and forward-only. Never edit one after it has merged.

This is the one thing in the repo that is genuinely hard to undo. SQLite's
`ALTER TABLE` is limited and Drizzle will plan a full table rebuild for some
changes. Read the generated SQL yourself before committing it. CI runs `db:check`
so a schema edit without a generated migration cannot merge, but CI cannot tell you
that a rebuild is about to lock a table.

**Procedure**

```bash
# 1. edit packages/db/src/schema.ts
pnpm db:generate
# 2. READ packages/db/drizzle/<timestamp>_<name>.sql with your own eyes
# 3. commit schema + migration together, nothing else
# 4. merge, let it deploy, THEN open the PR that uses the new column
```

---

## Tenant isolation

Every database change gets the isolation checklist in the PR template.

The rule is one line: **the only way to reach the database is `forOrg(orgId)`.**

`packages/db/src/unsafe.ts` exports the unfiltered client. ESLint blocks importing
it outside `packages/db/src`. If you find yourself wanting to disable that rule,
that is the guardrail working. Ask in the PR instead.

New table checklist:

- `org_id NOT NULL`, referencing `organizations.id`
- every index leads with `org_id`
- the isolation test passes without adding the table to the exempt list

---

## Fiscal claims

Any deadline, fine value, CFOP or validation rule in a diff needs a source link in
the PR.

`docs/domain/glossary.md` is an unverified draft. It is a list of things to look up,
not a reference to code against. When you learn a real rule, add it to the glossary
with its source **in the same PR as the code that depends on it**.

The live example: the MDF-e closure alert threshold is currently 24 hours, and that
number is a guess. The alert is the core of the product. Source it before building
further on it.

---

## Documentation, three places only

| Where | What |
|---|---|
| `CLAUDE.md` | Stack, layout, invariants, rules for agents |
| `docs/adr/` | Decisions expensive to reverse. Numbered, append-only |
| `docs/domain/glossary.md` | Fiscal vocabulary |
| `docs/ENVIRONMENTS.md` | prod/preview/dev, the three databases, migrations, cron |

Weekly notes, GTM, meeting decisions and company material stay out of the repo.
**The repo documents the system, not the company.**

### When to write an ADR

When the decision would be expensive to reverse, or when someone will ask "why is it
like this" in six months. Copy `docs/adr/0000-template.md`, take the next number.

ADRs are append-only. To change a decision, write a new ADR that supersedes the old
one and update the old one's status. Never rewrite history, because the reasoning at
the time is the thing worth keeping.

---

## Review guidance

You are reviewing agent-written code, so read it differently than you would a
colleague's hand-written patch.

- **Read "what I verified myself" first.** It tells you where to spend attention.
- **Look for the invented.** A plausible fiscal constant, a helper that duplicates
  something in `packages/core`, an unrequested abstraction.
- **Check tenant scoping on every query.** Every time. It is the one mistake that
  ends the company.
- **Check the maths in centavos by hand** on at least one case.
- **Size is not quality.** A 2,000-line PR that does one thing is fine. A 40-line
  PR that quietly changes a rounding rule is not.

If you do not understand a diff, that is a valid review comment. Do not approve it.
