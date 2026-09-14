## What this changes

<!-- One or two sentences. The PR title becomes the squashed commit, so make it
     Conventional Commits: feat:, fix:, chore:, docs:, refactor:, test: -->

## What I verified myself

<!-- MANDATORY. Not optional, not "tests pass".

     All three of us ship agent-written code. The agent also wrote the tests, so
     "CI is green" tells the reviewer almost nothing about whether this works.

     Write what YOU exercised with your own hands. Examples of the real thing:
       - "Issued a trip end to end against the fake provider, confirmed all four
          documents came back and document_events has one row per attempt."
       - "Ran the settlement on trip 41 with a negative advance and checked the
          centavos by hand against the spreadsheet."
       - "Logged in as org A and hit org B's trip URL directly. 404, as intended."

     If you verified nothing yourself, say so plainly. That is useful information
     and an honest empty answer is better than a fabricated one. -->

-

## Tenant isolation

<!-- Delete this section only if the change touches no database query at all. -->

- [ ] Every new query goes through `forOrg(orgId)`
- [ ] Any new table has `org_id NOT NULL` and an index leading with `org_id`
- [ ] The isolation test passes and any new table is covered, not exempted

## Fiscal claims

<!-- Any deadline, fine value, CFOP, or validation rule this PR encodes. -->

- [ ] No fiscal rule is asserted in this diff, OR every one has a source link
- [ ] Nothing here relies on an unsourced entry in `docs/domain/glossary.md`

## Migrations

- [ ] No migration in this PR, OR this is a migration-only PR with no feature code
- [ ] Migration is additive and forward-only
- [ ] I read the generated SQL myself and it does not rebuild a table unexpectedly
