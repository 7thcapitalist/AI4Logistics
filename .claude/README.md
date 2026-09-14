# .claude/

Shared agent configuration, versioned with the code it operates on.

`commands/` holds slash commands that encode the rules easiest to forget:
`/new-table`, `/new-migration`, `/fiscal-check`, `/pr`.

`agents/` is where agent definitions go. Per ADR-adjacent discussion in `SETUP.md`
day 5, vendor the useful definitions from the agents headquarters repository here
rather than using a submodule, so that a rule change and the code change that
motivated it land in the same PR.

The rules an agent must respect live in `CLAUDE.md` at the repository root, not here.
