# ADR 0003: Fiscal emission provider

**Status:** OPEN. On the critical path.
**Date:** 2026-09-12

**This is the open decision that matters most.** It sets unit cost per trip and
therefore the pricing floor, and the PRD flags it as gating the build timeline.

## Context

The product issues CT-e, MDF-e, CIOT and vale-pedagio. We will not integrate with
SEFAZ or ANTT directly: their web services need certificates, per-state quirks and
a compliance burden that is not a realistic use of a three-person team's first six
months. We integrate a licensed provider.

Candidates named in the PRD: Focus NFe, Tecnospeed, e-Notas, ArquivoFacil.

## What must be answered

| Question | Why it decides things |
|---|---|
| Price per document, and per month | Unit cost per trip, therefore the pricing floor |
| CT-e, MDF-e, CIOT and vale-pedagio all covered? | A gap means a second provider and twice the adapter |
| Sandbox without a signed contract? | Whether we can build against reality before committing |
| Webhooks, or polling only? | Polling changes the job design |
| Who holds the A1 certificate? | Security and onboarding friction for the carrier |
| Rejection errors: structured, or SEFAZ text passed through? | P0 requirement 5 is clear, specific errors, not raw API text |
| Rate limits, and the real reliability story | Retry and idempotency design |

## Decision

Not yet made.

**Read the API documentation of at least two providers before designing the adapter
interface.** An interface designed against one vendor encodes that vendor's
assumptions and defeats its own purpose, which would leave us with the cost of an
abstraction and none of the benefit.

## What this does not block

Everything except the real adapter implementation.

`packages/fiscal` defines the interface and ships `FakeProvider`. The trip flow, the
alert job, settlement and the entire UI are built and tested against the fake. That
is the point of building the fake first, and it is why this decision being open is
not a reason to stop.

## Revisit

Immediately. Day 6 in `SETUP.md`.
