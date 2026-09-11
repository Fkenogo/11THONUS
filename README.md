# 11thONUS — Engineering Monorepo

**Customer-Verified Loyalty Platform** — "Every 11th. On Us."

This is the permanent engineering repository for 11thONUS. It follows the governed documentation
suite migrated into [`docs/`](docs/README.md) — the Platform Constitution, PRD, TRD, and the
approved Engineering Standards. **All implementation must follow that governed documentation.**

> **Status:** Phase 0 (Repository and Delivery Foundation, TRD22 §22.10) — infrastructure scaffold
> only. No product-domain code exists yet.

## Start here

- 📚 **Documentation index:** [`docs/README.md`](docs/README.md)
- 🏛️ **Platform Constitution** (highest authority): [`docs/00-governance/platform-constitution.md`](docs/00-governance/platform-constitution.md)
- 🧾 **Persistent implementation change log:** [`docs/changes/IMPLEMENTATION_CHANGES.md`](docs/changes/IMPLEMENTATION_CHANGES.md)

## Repository layout

```
apps/web/      — React + TypeScript + Vite frontend workspace
functions/     — Cloud Functions workspace (TypeScript, pnpm)
docs/          — governed documentation baseline (migrated verbatim; do not hand-edit casually)
tests/e2e/     — cross-cutting Playwright smoke tests
```

## Requirements

- Node.js 20+
- pnpm 9 (`corepack enable` or `npm install -g pnpm`)

## Common commands

```bash
pnpm install         # install all workspace dependencies
pnpm build            # build every workspace
pnpm lint              # ESLint across the repo
pnpm format:check    # Prettier check (no writes)
pnpm typecheck        # TypeScript strict-mode check, every workspace
pnpm test              # unit/component tests (Vitest), every workspace
pnpm test:e2e         # Playwright end-to-end smoke test
pnpm emulators         # start the Firebase Emulator Suite (demo project, no live resources)
pnpm emulators:clean   # build functions first, then start the Emulator Suite (clean-checkout safe)
```

The Firebase Emulator Suite runs against the fake `demo-11thonus` project ID — no live Firebase
project, credentials, or `.firebaserc` are required or used at this phase. See
[Phase 0 Authorization](docs/05-implementation/phase-0-authorization.md) for what is and is not in
scope.

### Local emulator startup (clean checkout)

`pnpm emulators` alone does **not** rebuild `functions/` first — on a clean checkout (or after
pulling `functions/src` changes) the emulator will otherwise serve stale compiled output. Use the
one-step, always-fresh script instead:

```bash
pnpm install                 # 1. install workspace dependencies
pnpm emulators:clean         # 2. builds functions, then starts the Emulator Suite (demo project)
pnpm seed:test-only-terms-fixture   # 3. optional — see below
pnpm --filter web dev        # 4. start the web dev server against the running emulators
```

`emulators:clean` is exactly `pnpm --filter functions run build && firebase emulators:start
--project demo-11thonus` — the same emulator, just guaranteed to reflect the current source.

**`pnpm seed:test-only-terms-fixture`** (`FD-PREVIEW-TERMS-001`) seeds an explicitly test-only
`TEST_ONLY_FIXTURE_BUSINESS_TERMS_v0` value into `platformConfig/businessTerms` in the running
Firestore Emulator, so a local/emulator Founder-preview flow can exercise Business Terms
acceptance end-to-end. It refuses to run unless it detects an emulator environment
(`FIRESTORE_EMULATOR_HOST` and the `demo-11thonus` project id) and never touches a real project.
This does **not** authorize any production/staging Terms content and does **not** change
`assertCurrentBusinessTermsAccepted` or any other production Terms path — see
[`decision-register.md`](docs/00-governance/decisions/decision-register.md)'s `DEC-LEGAL-002`
entry for the governing Founder directive.

## Rules

1. Documents under `docs/99-archive/` are **superseded or backup material and must never be implemented**.
2. Unresolved decisions live in the [Decision Register](docs/00-governance/decisions/decision-register.md) — **no one, human or AI, may silently resolve an OPEN decision**.
3. Coding agents must read the relevant PRD sections, TRD chapters and standards before changing any code, and must stop and report rather than guess when behavior is ambiguous (TRD22 §22.40).
4. Any change to a governed document under `docs/` requires an entry in [`docs/00-governance/documentation-changes-log.md`](docs/00-governance/documentation-changes-log.md).
