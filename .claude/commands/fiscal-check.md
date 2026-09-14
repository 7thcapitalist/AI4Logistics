---
description: Flag every fiscal claim in the diff that has no source
---

Review the current diff for any assertion about Brazilian fiscal or regulatory rules:

- deadlines and time windows
- fine and penalty values
- CFOP codes
- validation rules and required fields
- document state transitions

For each one found, report:

1. File and line
2. The claim
3. Whether a source link is present in the code, the PR body, or
   `docs/domain/glossary.md`

**Anything without a source is a blocker.** Say so plainly.

Do not attempt to verify a claim from your own knowledge, and do not supply a value
you believe to be correct. Confident invention of these numbers is the specific
failure this command exists to catch, and a wrong value produces a fine for a real
carrier. "This is unsourced and I cannot verify it" is the correct output.
