---
description: Fill in the PR template honestly
---

Prepare the PR body from `.github/pull_request_template.md`.

- **What this changes:** one or two sentences. Conventional Commits in the title,
  because it becomes the squashed commit.
- **What I verified myself:** leave this for the human. You cannot fill it in. Write
  `TODO: <name> to complete` and say so out loud in your response. The whole point of
  the section is that a human exercised the code, so an agent filling it in destroys
  the only signal it carries.
- **Tenant isolation:** check the boxes only if you actually confirmed each one.
  List every query added and how it is scoped.
- **Fiscal claims:** run `/fiscal-check` and report the result here.
- **Migrations:** if this PR contains a migration and anything else, stop and say the
  PR needs splitting.
