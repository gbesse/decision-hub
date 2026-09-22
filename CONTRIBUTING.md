# Contributing

DecisionHub handles tenant-scoped records and per-request provider credentials.
Changes to authentication, persistence, reports or logging require focused
regression coverage.

## Local validation

Requires Node.js 24 and Chromium for Playwright.

```bash
npm ci --ignore-scripts
npx playwright install chromium
npm run release:check
```

The local preview uses a fixed synthetic identity and is not a production
authentication test.

## Pull requests

- Preserve owner scoping in every policy, report and quota query.
- Derive production identity only from the hosting platform's trusted header;
  never accept an owner identifier from a request body.
- Never persist or log Jev keys, authorization headers, raw provider bodies or
  full unexpected errors.
- Keep aggregate share links free of source inputs and model answers.
- Add a regression test for schema, migration, authentication, quota, secret
  handling or browser-flow changes.
- Do not edit an applied migration; add a new migration instead.

Report suspected tenant isolation or credential disclosure bugs privately as
described in [SECURITY.md](SECURITY.md).
