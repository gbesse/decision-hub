# Assets and migrations

Purpose: Identify generated and binary artifacts in this repository.

`workspace.png` is a Chromium screenshot of synthetic example data, showing the policy editor, evaluation and report interface. No user data or credentials are present.

`drizzle/meta/0000_snapshot.json` and `_journal.json` are Drizzle migration metadata. `0000_decision_workspace.sql` creates owner-scoped tables, quota reservations and share links; the migration contains schema only. Do not change this migration once applied in production.
