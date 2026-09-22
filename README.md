# DecisionHub

An open-source hosted Jev workspace: save immutable DecisionPacks, evaluate your own JSON states, inspect original decisions and share revocable aggregate reports. Alpha, independent of TypeSafe.

## Use

Open the hosted deployment with your authorized ChatGPT account. The initial deployment is **owner-private**. Each signed-in visitor has a separate personal workspace; sharing a Site audience never grants access to another user's policies or full reports.

Open the synthetic demo without a Jev key. Paste/edit a Choice DecisionPack, save a version, upload up to ten JSON states and evaluate. For live inference, provide your Jev key for that request. It is sent over HTTPS to this Worker and to TypeSafe, never persisted in D1, browser storage, reports or application logs. The input clears after evaluation. Actual Site access remains controlled by the owner; this release is not a public signup SaaS.

Reports preserve the exact policy, original input and DecisionPack-compatible model judgments. Download a complete private report or explicitly create a seven-day aggregate link. Aggregate links omit inputs and answers and can be revoked. Site-level access restrictions still apply to links; a private deployment's link does not bypass platform access.

## Local development without a build

Node 24: `npm ci --ignore-scripts`, `npm start`. Open `http://127.0.0.1:58767`. The preview uses a fixed **synthetic local identity**, binds loopback only, and persists to `.local/hub.sqlite`. It does not implement production login. `PORT` and `HUB_DATABASE` can override preview settings.

Source is authored directly as deployment-ready Worker ESM in `dist/server/` and browser assets in `dist/client/`; these directories are tracked source, not generated bundles. No local or remote build is required. Drizzle generates schema migrations with `npm run db:generate`; Sites applies the committed SQL migrations before deployment. Do not edit an already-applied migration.

## Auth and persistence

Production identity comes exclusively from Sites' authenticated `oai-authenticated-user-id` header. Every policy/report query is keyed by that owner; client body fields cannot set ownership. The platform must strip/replace incoming identity headers. **Do not expose this Worker on a direct untrusted origin or recreate this trusted-header boundary with arbitrary forwarded headers.** Self-hosting requires a verified identity gateway.

Policies are immutable by owner/name/version. Writes require a same-origin browser request. The database enforces policy limits and atomically reserves up to 30 evaluations per user/minute. Each request accepts at most ten states, five Choice questions and 150 KB. Provider calls have 30-second timeouts inside an 80-second overall evaluation deadline; errors remain failed rows, never automatic review outcomes. Keys are supplied per request; there is no shared server billing key.

The hosted application is a focused deployment of Workbench's policy/evidence workflow; it does not expose Workbench's trusted local plugin executor or its whole Node/SQLite server. Authentication is platform-owned; teams, invitations, SSO configuration, retention automation and administrator email alerts are not implemented. Runtime errors are visible and logged without provider bodies or credentials.

## Validation

`npm run release:check` checks authored JavaScript syntax and runs five tests covering exact production SQL, two-user isolation, immutable versions, quotas, secret redaction, scoped reports, revocation and a real Chromium policy → evaluation → share → revoke journey. The browser test includes mobile overflow checks. Deployment itself is verified through the hosting platform; a local identity fixture is not a production authentication audit.

The page exposes a feature-detected read-only WebMCP workspace tool. Browser support was unavailable in the local QA browser; that optional extension is not claimed as validated.

See [CONTRIBUTING.md](CONTRIBUTING.md) for the development contract and
[SECURITY.md](SECURITY.md) for private reporting instructions and the trusted
identity-header boundary.

The `esbuild` override in `package.json` keeps Drizzle Kit's deprecated loader
chain on a patched release. Retain it until Drizzle Kit removes
`@esbuild-kit/esm-loader`; `npm audit` and `npm run db:generate` must stay green
when changing the database toolchain.

## Reuse and license

Uses the existing DecisionPacks contract and the Workbench support example. See [THIRD_PARTY.md](THIRD_PARTY.md) for pinned source attribution. Exports remain compatible with Decision Workbench review traces after wrapping successful report rows as `{schemaVersion:1,pack,rows}`. MIT.
