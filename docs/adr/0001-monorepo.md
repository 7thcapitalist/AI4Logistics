# ADR 0001: One monorepo

**Status:** Accepted
**Date:** 2026-09-12

## Context

Three founders, all shipping agent-written code, building a Next.js app plus shared
domain logic, a database layer and a fiscal adapter. We had to choose between one
repository and several.

## Decision

One monorepo, pnpm workspaces plus Turborepo.

```
apps/web/                Next.js: owner dashboard + driver PWA + API + cron
packages/db/             Drizzle schema, migrations, tenant-scoped client
packages/core/           Pure domain logic
packages/fiscal/         Provider-agnostic emission interface
packages/notifications/  WhatsApp, push
packages/ui/             Shared components
```

## Consequences

### What this gives us

A change that spans the schema, the domain logic and the UI is one atomic PR, one
review, one deploy. In the first six months almost every change spans at least two
of those.

One CI pipeline and one set of rules to enforce, which matters because the rules are
the main defence against agent-written volume.

An agent can see the whole system. Cross-repository context is exactly what agents
are worst at holding, and splitting the repo would mean an agent changing the schema
cannot see who consumes it.

### What this costs us

CI runs more than strictly necessary on small changes. Turborepo's caching makes
this mostly theoretical at our size.

Everyone can touch everything. That is a real risk with three agents running, and it
is what CODEOWNERS exists to address later.

### What we do about the cost

`packages/core` holds pure functions with no I/O, so the boundary that matters most,
between business maths and everything else, is enforced by the absence of imports
rather than by repository walls.

## Alternatives considered

### Separate repositories per service

Rejected. There are no services yet, and the coordination cost of a cross-repository
schema change lands on a three-person team every week.

### A single Next.js app with no packages

Simpler, and tempting. Rejected because settlement arithmetic would then live next
to React components, and a silent money bug in a component is the specific outcome
`packages/core` exists to prevent.

## Revisit when

A part of the system needs to deploy on a different cadence or scale independently,
for example if document processing becomes a long-running worker.
