# AI change log

Purpose: Record the independent DecisionHub implementation and verification.

## 2026-09-21 — Initial hosted alpha

Implemented platform-authenticated personal workspaces, owner-keyed D1 schema, immutable policies, bounded Choice inference, ephemeral user-supplied Jev keys and revocable aggregate sharing. Reused the existing DecisionPacks validation contract and Workbench sample. Authored direct Worker/browser ESM without a build. Five tests pass, including a Chromium workflow and actual SQLite prepared-query checks across two identities. Initial hosting remains owner-private; WebMCP support not available in the test browser. No local plugins are exposed remotely.
