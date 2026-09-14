# ADR 0004: Driver surface, PWA rather than WhatsApp

**Status:** Proposed. Needs field validation before it is accepted.
**Date:** 2026-09-12

## Context

Drivers confirm pickup and delivery and capture proof of delivery: photo, timestamp,
GPS. Two options, and the PRD leaves the question open.

A WhatsApp flow needs no install, matches a channel drivers already use all day, and
matches the GTM channel in the thesis. It would cut build time significantly.

A PWA gives real offline behaviour, a controlled camera and geolocation capture, and
a queue that survives a dead zone.

## Decision (proposed)

**A PWA, installable, offline-first.** WhatsApp notifications alongside it for
things that need attention, but capture happens in the PWA.

## Reasoning

P0 requirement 6 is that POD capture must not be lost on connectivity loss, and
delivery points are exactly where signal fails. A WhatsApp flow depends on their
servers and the driver's connection at the moment of capture, and a lost POD is a
disputed delivery.

The POD is evidence. We need the photo, the timestamp and the coordinates bound
together with a trip record we control.

### What this costs

A driver has to install something, and that is real friction with this user. It is
also the assumption most likely to be wrong.

## What would change this decision

Field validation. If drivers in the pilot will not install a PWA, or installation
becomes a sales objection, WhatsApp capture with accepted POD-loss risk beats a
driver app nobody opens.

**Do not accept this ADR until at least five drivers have been asked directly.**

## Revisit when

Pilot onboarding, at the latest.
