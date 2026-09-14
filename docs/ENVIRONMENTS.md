# Environments

Three environments, three databases, one rule: **production data is only ever
touched by code that is already on `main`.**

---

## The map

| Vercel environment | Deployed from | Turso database | URL |
|---|---|---|---|
| **Production** | `main` only | `ai4logistics-prod` | the real domain |
| **Preview** | every other branch, one per PR | `ai4logistics-preview` | a per-deployment URL |
| **Development** | nothing; runs on your laptop | `ai4logistics-dev` | `localhost:3000` |

Vercel builds a Preview deployment for every push to a non-production branch, and
a Production deployment for every push to `main`. You do not configure that, it is
the default behaviour once the repo is linked.

### Why three databases and not one

Preview gets its own database because a PR is exactly where a broken migration
lives. If Preview pointed at production, a single bad `db:migrate` in a branch
would corrupt customer fiscal documents, and per ADR 0002 those documents are the
evidence a carrier uses to dispute a fine.

Development is shared by all three of us. That is a deliberate trade: it is one
fewer thing to set up, at the cost of occasionally stepping on each other's schema.
If that starts hurting, split it per person. Turso Free allows 100 databases, so
the only cost is setup.

### Region, and why it is currently wrong

Turso Free allows exactly **one group**, and a group's primary location is chosen
when it is created. Ours is in the US; the carriers are in Brazil.

This matters less than it looks today. The latency that actually hurts is the
Vercel function talking to the database, not the browser talking to the database,
and Vercel Hobby runs functions in a US region too. Same continent, short hops.

It matters a lot later. The target is both the Vercel function region and the Turso
group in `gru` (Sao Paulo). Getting there means recreating the databases inside a
new group, which requires a paid Turso plan and is painless **only while there is
no production data**. Do it in the same step as the Vercel Pro upgrade, before the
first pilot carrier.

**Separate account before production.** These databases currently live in a
personal Turso organisation alongside unrelated side projects. Once real carriers'
fiscal documents are in `ai4logistics-prod`, that data should sit in an
organisation owned by the company, not by one founder's personal account. Doing it
early is a migration of empty databases; doing it late is a migration of five-year
retained tax records.

### Why there is no local SQLite file

`packages/db` uses `@libsql/client/web`, the HTTP-only client, because the default
entrypoint pulls in native bindings that webpack cannot bundle and that break
`next build`. The web client cannot open `file:` URLs.

So local development talks to `ai4logistics-dev` over the network. You need connectivity to
run the app locally. If that ever becomes intolerable, the fix is a second client
instance behind an environment check, not switching the shared one back.

---

## Environment variables

Set these in Vercel under **Settings, Environment Variables**, and tick the
environments each value belongs to. Vercel lets one variable hold a different
value per environment, which is the whole mechanism here.

| Variable | Production | Preview | Development |
|---|---|---|---|
| `TURSO_DATABASE_URL` | `ai4logistics-prod` | `ai4logistics-preview` | `ai4logistics-dev` |
| `TURSO_AUTH_TOKEN` | prod token | preview token | dev token |
| `BLOB_READ_WRITE_TOKEN` | prod store | preview store | dev store |
| `CRON_SECRET` | unique | unique | unique |
| `FISCAL_PROVIDER` | `fake` for now | `fake` | `fake` |
| `MDFE_CLOSURE_ALERT_HOURS` | `24` | `24` | `24` |

Locally, the same values live in `.env.local`, pointed at `ai4logistics-dev`. That file is
gitignored and must stay that way. `gitleaks` runs on every PR, but a secret is
only truly safe if it never reaches a commit in the first place.

**Never put the production token in `.env.local`.** There is no reason to have
production credentials on a laptop, and the one place a production migration
legitimately runs is the workflow described below.

---

## Migrations

The rule from `CONTRIBUTING.md` is that a migration merges and deploys **before**
the code that depends on it. Mechanically:

1. Migration-only PR. Merge it.
2. Run the production migration workflow (below) and confirm it succeeded.
3. Then merge the PR containing the code that uses the new column.

### Production

`.github/workflows/migrate-production.yml`, triggered manually from the Actions
tab. It is deliberately **not** automatic on push to `main`.

Two reasons. First, nobody needs the production database token on their laptop:
it lives in GitHub Secrets and is used only inside that workflow. Second, applying
a migration should be a decision someone makes after reading the SQL, not a side
effect of a merge. Turso Free keeps only 1 day of point-in-time restore, so a bad
migration discovered on Tuesday about Monday's data is unrecoverable.

To run it: Actions tab, "Migrate production database", Run workflow, type
`MIGRATE` to confirm.

### Preview and development

```bash
pnpm db:migrate     # uses whatever TURSO_DATABASE_URL is in your .env.local
```

Preview databases drift. When a preview branch's schema gets confusing, reset it
rather than debugging it:

```bash
turso db destroy ai4logistics-preview --yes
turso db create ai4logistics-preview --group default
# update the Preview env var in Vercel with the new URL and token
```

---

## Cron jobs, and the thing that will bite you

The MDF-e closure alert is a Vercel Cron job. Two constraints:

**Cron runs only on Production deployments.** It will never fire on a preview. To
exercise it from a branch, call the route directly with the `CRON_SECRET` bearer
token.

**On the Hobby plan, cron jobs can run once per day, maximum.** An expression like
`0 * * * *` does not merely run less often, it **fails the deployment** with
"Hobby accounts are limited to daily cron jobs". `vercel.json` is therefore set to
`0 9 * * *` (daily, and Hobby timing is approximate anyway, so expect it anywhere
in the 09:00 hour).

This matters more than it looks. The product's core promise is catching an open
MDF-e before it becomes a fine. Checking once a day, at an imprecise time, is not
that product. **Vercel Pro is required before the first pilot carrier**, not as a
nice-to-have but because the feature does not work otherwise. Once on Pro, change
the schedule to `0 * * * *`.

---

## Deployment protection

Preview deployments are protected by Vercel Authentication by default, so only
logged-in team members can open them. Leave that on. A preview of this product
shows fiscal documents, and previews have guessable-adjacent URLs.

---

## Checklist when adding a new environment variable

1. Add it to `.env.example` with a comment explaining what it is
2. Add it to `turbo.json` under `globalEnv`, or Turborepo's cache will not
   invalidate when it changes and you will chase a ghost
3. Set it in Vercel for all three environments
4. Tell the other two, because their `.env.local` will not have it
