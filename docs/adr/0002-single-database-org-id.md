# ADR 0002: One database, `org_id` on every row

**Status:** Accepted
**Date:** 2026-09-12

This is the most consequential decision in the repository. It is also the one most
likely to be questioned, because Turso is known for the opposite pattern.

## Context

Multi-tenant SaaS for carriers. Each carrier's data is fiscal documents, which is
about as sensitive as customer data gets: a leak is not embarrassing, it is
commercially fatal and probably legally actionable.

Turso makes database-per-tenant unusually easy and cheap, and that would give
structural isolation: one carrier physically cannot read another's rows because
there is no query that spans them.

## Decision

**One shared database. `org_id NOT NULL` on every tenant-scoped table.**

## Consequences

### What this gives us

**The product is a cross-tenant query.** The alert that justifies the subscription
is "find every authorised MDF-e, across all carriers, past its trip window and not
closed." With one database that is one indexed query. With per-carrier databases it
is a fan-out that degrades with every customer we win, which means the core feature
gets slower as the business succeeds.

**Migrations run once.** With N databases a migration runs N times and can
half-apply, leaving carriers on different schema versions. For a three-person team
changing the schema weekly for the first six months, that is a worse operational
risk than the one per-tenant isolation avoids.

Onboarding a carrier is an insert, not a provisioning step that can fail halfway.

### What this costs us

**SQLite has no row-level security.** There is no database-level backstop. One
forgotten `WHERE org_id = ?` leaks one carrier's tax documents to another.

We are accepting that the isolation boundary is application code. That is a real
cost and it is why the guardrails below are part of this decision rather than a
follow-up ticket.

### What we do about the cost

1. The raw Drizzle client lives in `packages/db/src/unsafe.ts`. ESLint
   `no-restricted-imports` blocks importing it anywhere outside `packages/db/src`.
2. The only public surface is `forOrg(orgId)`. It injects the filter on every
   select, stamps `org_id` on every insert **overwriting any caller-supplied
   value**, and refuses updates and deletes that arrive without an explicit `where`.
3. `org_id NOT NULL` on every tenant-scoped table, and every index leads with it.
   This is a correctness rule and a performance rule at once.
4. An isolation test reflects over the schema and fails if a table exists without
   `org_id` and is not explicitly listed as global. **A new table cannot merge
   without being covered.**
5. Local development always seeds two organisations, so a leak surfaces on the first
   page load rather than in production.

Guardrail 2 is the important one. The others catch mistakes; that one makes the
mistake difficult to express.

### The door stays open

Because every table carries `org_id` from day one, moving to database-per-carrier
later is a mechanical split rather than a rewrite. We are not permanently choosing
the weaker isolation model, we are deferring the stronger one until the cross-tenant
query problem is solved some other way.

## Alternatives considered

### Database per carrier

Genuinely attractive, and the reason this ADR is long. Structural isolation removes
the failure mode that can end the company.

Rejected because the alert feature is inherently cross-tenant and is the reason
customers pay, and because N migrations weekly on a three-person team is a standing
operational hazard. Revisit if we find a good answer to the fan-out, for example a
separate aggregate store the alert job reads.

### Postgres with row-level security

The textbook answer, and it makes the database enforce isolation rather than the
application.

Rejected for now on operational grounds: connection pooling in a serverless runtime
is a real problem that costs either money (a pooler) or reliability, whereas Turso
speaks HTTP and has no connection state. RLS is the strongest argument against this
ADR and it is the first thing to reconsider if the guardrails above prove leaky in
practice.

## Revisit when

- A carrier contractually requires physical data separation
- The alert fan-out is solved some other way
- An isolation bug reaches production, which would be evidence that application-level
  enforcement is not sufficient for this team
