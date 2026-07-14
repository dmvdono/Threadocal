# Threadocal Playwright Testing

## Install

```bash
npm ci
npx playwright install
```

## Commands

```bash
npm run test:e2e:smoke
npm run test:e2e
npm run test:e2e:headed
npm run test:e2e:ui
npm run test:e2e:report
```

`npm run test:e2e:smoke` is the fast first pass. `npm run test:e2e` runs the broader regression suite.

## Environment Variables

- `TEST_BASE_URL`: Optional. Defaults to `http://127.0.0.1:3000`. Use a preview/staging URL for remote smoke checks.
- `ALLOW_DESTRUCTIVE_E2E=true`: Required before tests create accounts or write database-backed marketplace records.
- `ALLOW_PRODUCTION_E2E_WRITES=true`: Reserved for explicit production-write runs. Do not set this for normal testing.
- `E2E_CUSTOMER_EMAIL` / `E2E_CUSTOMER_PASSWORD`: Optional existing customer test account.
- `E2E_BRAND_OWNER_EMAIL` / `E2E_BRAND_OWNER_PASSWORD`: Optional existing brand-owner test account.
- `E2E_ADMIN_EMAIL` / `E2E_ADMIN_PASSWORD`: Optional existing admin test account.
- `E2E_TEST_PASSWORD`: Optional generated signup password override.

Never put service-role credentials in browser tests. If cleanup ever needs service-role access, keep it in Node-only setup with masked CI secrets and do not print values.

## Localhost

By default Playwright starts `npm run dev` and points tests at `http://127.0.0.1:3000`.

```bash
npm run test:e2e:smoke
```

## Safe Production Smoke

Production/preview checks are read-only by default:

```bash
TEST_BASE_URL=https://threadocal.com npm run test:e2e:smoke
```

Do not enable destructive flags against production unless a specific maintenance run has been planned.

## Reports And Debugging

- HTML report: `npm run test:e2e:report`
- Failure artifacts: `test-results/`
- Captured on failure: screenshots, traces, videos, console/network diagnostics where tests attach listeners.
- Rerun one file:

```bash
npm run test:e2e -- tests/navigation/navigation.spec.ts
```

- Rerun one test by title:

```bash
npm run test:e2e -- -g "tap opens dropdowns"
```

## Test Data Safety

Tests use unique `threadocal-e2e-*` emails for account creation. Destructive database-backed flows are skipped unless `ALLOW_DESTRUCTIVE_E2E=true`. Demo/localStorage tests clear browser storage before use and do not delete production data.

## Current Blockers

Full database assertions for duplicate profiles/brands, admin moderation, and cleanup require dedicated staging credentials and safe cleanup hooks. Until those exist, the suite validates public UI, role query behavior, localStorage flows, and non-admin protection without pretending to verify production writes.
