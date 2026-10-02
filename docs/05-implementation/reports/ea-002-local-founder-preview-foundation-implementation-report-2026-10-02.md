> **Title:** EA-002 — Local Founder Preview Foundation — Implementation Report  
> **Version:** 1.0 · **Status:** Implemented — pending Founder review · **Classification:** Working (implementation record)  
> **Governing documents:** `11THONUS-EA-001` (accepted assessment); Founder Development & Preview Workflow Alignment (2026-09-11); `FD-PREVIEW-TERMS-001`; `DEC-SUB-014`  
> **Source-of-truth path:** `docs/05-implementation/reports/ea-002-local-founder-preview-foundation-implementation-report-2026-10-02.md`  
> **Runbook:** [`docs/runbooks/founder-preview-runbook.md`](../../runbooks/founder-preview-runbook.md)

# EA-002 — Local Founder Preview Foundation

## 1. What was built

A deterministic local environment — **no new product screens, no new product APIs, no production-code change**:
`pnpm preview:start` brings up PostgreSQL → canonical migrations → Firebase emulators → Functions → seeded Founder
dataset → web app; `pnpm preview:reset` returns it to the same logical state; preview identities exist for Owner,
Manager, Staff, Customers and Operator. All of it lives in a new `tests/preview/` tree, a Playwright preview project, CI
steps, and a runbook.

## 2. Inspection and strategy (reuse, not a parallel architecture)

| Existing mechanism found                                                               | Reused how                                                                                     |
| -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `docker-compose.postgres.yml` (`eleventhonus_platform_local`/`_test`, port 54329)       | The preview's PostgreSQL; only `_local` is ever used                                           |
| `functions/…/migrationRunner.migrateUp` + `postgresConfig`/`postgresPool`               | The migration step (previously only tests applied migrations — no CLI existed)                 |
| `firebase.json` emulators, `emulators:clean` model, `demo-11thonus`                     | Same emulators/project/ports; started with `firebase emulators:start --only auth,functions,firestore,ui` |
| `tests/e2e/emulator/seedCommerceKnowledge.mjs`, `seedTestOnlyTermsFixture.mjs`          | Run unchanged as the reference-data step (the latter is the Founder-authorised `FD-PREVIEW-TERMS-001` fixture) |
| `PLATFORM_ENV` fail-closed config; `loadPostgresConfig`                                 | Forced to `local`; no new config surface                                                       |
| `bootstrapPlatformAdministrator`, Commercial command services, `reconcileCommercialConsumption` | Operator record and Commercial states (no endpoint exists; none is faked)               |
| Web `VITE_AUTH_ENABLE_EMAIL_PASSWORD` + `VITE_USE_FIREBASE_EMULATOR`                    | The web server's only preview configuration; the production sign-in screen is used             |
| Playwright config + `@axe-core`/emulator-project conventions                            | New `chromium-preview` / `chromium-preview-mobile` projects                                    |

## 3. Preview architecture

```
Browser ──► Vite dev server :5173 (Email/Password flag, emulator mode)
                 │  Firebase client SDK (Auth :9099, Functions :5001)
Firebase emulators (loopback): Auth 9099 · Functions 5001 · Firestore 8080 · UI 4000
                 │  Functions env: PLATFORM_ENV=local, PLATFORM_POSTGRES_URL
Local PostgreSQL 16 (docker compose) :54329  db eleventhonus_platform_local
Seed (tests/preview) ──► real callables over HTTP + in-process services where no callable exists
```

### Files (all new unless stated)

`tests/preview/cli.mjs` (entry) · `lib/{config,guards,emulatorClient,postgres,processes,runtime}.mjs` ·
`seed/{session,adminServices,scenario,fingerprint}.mjs` · `identities.json` · `expected-fingerprint.json` ·
`guards.test.mjs` · `tests/e2e/preview/preview-identities.spec.ts` · `docs/runbooks/founder-preview-runbook.md`.
Modified: `package.json` (scripts), `playwright.config.ts` (2 projects; `chromium` ignores `preview/`), `eslint.config.js`
(Node globals for `tests/preview/**/*.mjs`), `.gitignore` (`.preview/`), `.prettierignore` (generated fingerprint),
`.github/workflows/ci.yml` (preview steps), `README.md` (pointer).

## 4. Workflow, ports, migration behaviour

`pnpm preview:start`: prerequisites check (Node ≥20, pnpm, Java ≥21, Docker or `PREVIEW_POSTGRES_URL`) → PostgreSQL
(compose `up -d --wait`, or the supplied loopback URL) → `functions` build → **`migrateUp` of all 27 canonical
migrations** (idempotent; validates history/checksums; fails closed) → emulators (health-waited) → reference data →
seed **if no consistent seed exists** (state file + non-empty programmes + operator can sign in; otherwise automatic
reset) → web server → summary. Warm start ≈ 15 s; cold ≈ 1.5 min (+ first-time emulator download).
Ports: web 5173 · Auth 9099 · Functions 5001 · Firestore 8080 · Emulator UI 4000 · PostgreSQL 54329.

Migration behaviour: the preview applies exactly the repository's own migrations, in order, each in its own
transaction; **reset** drops and recreates the `public` schema of `eleventhonus_platform_local` then re-applies them.

## 5. Complete seed inventory and how each state was created

See the runbook §5–§6 for the table form. Summary (creation path in brackets; **R** real callable, **S** real domain
service in-process, **E** emulator REST that the web SDK itself uses):

* **17 identities** [E sign-up + R `authenticate` + R `setDisplayName`]; Loyalty Number + QR issued by the platform at registration; read back, never fabricated.
* **Operator** `founder.operator` [S `bootstrapPlatformAdministrator`; R `discoverPlatformAdministrator` read-back].
* **5 Businesses** (Bella Salon, Sparkle Car Wash, Mutima Mini-Mart, Tembo Fitness, Ubuntu Books) [R `createBusiness`, R `acceptBusinessTerms` against the test-only fixture, R `submitBusinessForVerification`, S activation command for four; Ubuntu Books left pending verification].
* **Team**: Bella Manager + Staff; Diane also Sparkle Staff [R `createStaffInvitation`/`acceptStaffInvitation`; E real email-verification flow].
* **Programmes**: Premium Cut Circle (published), Family Care Circle (draft), Wash 10+1, Mini-Mart Regulars, Gym Visits; 7 qualifying items [R `createQualifyingItem`, `createRewardProgram`, `publishRewardProgramVersion`].
* **Loyalty activity** (66 purchases): Circles at 3, 7, 9, 10 (Reward available), redeemed + 2; waiting-for-customer; disputed (`under_review`); Sparkle 5/2/10; Mutima two completed; Tembo 4 [R `recordPurchase` as staff/manager/owner → R `verifyPurchase` as the customer; R `raisePurchaseDispute`; R `confirmRedemption` as the Manager].
* **Commercial**: price schedules BI/RW (**preview-only illustrative local prices**, USD 2 equivalent); accounts for four Businesses; Bella trial 4 (2 consumed), Mutima trial 3 (2 consumed → 1 left), Sparkle paid with settlements confirmed / recorded / cancelled / voided, Tembo paid then **−2 credit** and **restricted new starts** [S Commercial commands via their real runner; S `reconcileCommercialConsumption`].
* **Not seeded**: held/`pending_admission` Purchases (the gate is OFF and the tooling refuses to run otherwise); consumption failures/stuck processor (need fault injection).

Determinism: a **fingerprint** of logical state (businesses, programmes, team, cycles by customer, available rewards,
purchase/reward/redemption/settlement/consumption/account aggregates) is committed
(`tests/preview/expected-fingerprint.json`); `preview:verify` byte-compares the live state. Reset → verify was proven
repeatedly and in the CI-style sequence. IDs and server timestamps are platform-generated and differ per run (the Auth
emulator rejects caller-supplied UIDs); they are recorded in `.preview/state.json` for tools.

## 6. Preview identities and roles

See runbook §4. One shared preview-only password; every account is a real emulator Firebase Auth account used through the
real sign-in screen. Roles: Owner ×5 (+1 onboarding), Manager, Staff, Customers ×8, Operator. **Operator: limited by
missing seams** — the record exists and discovery works, but there is no Operator UI, endpoint or read model, and none
was faked.

## 7. Production-safety guards

`lib/guards.mjs` (24 unit tests): refuses unless `PLATFORM_ENV=local`; project exactly `demo-11thonus`; Firestore and
Auth emulator hosts loopback; PostgreSQL host loopback **and** database exactly `eleventhonus_platform_local`
(`…_test` and anything else refused); no `GOOGLE_APPLICATION_CREDENTIALS`/`FIREBASE_TOKEN`; the admission gate unset/`off`.
`buildPreviewEnv` forces these onto every child and strips an inherited gate or credentials. The destructive reset calls
the guard before it clears anything. No fixture is imported by `apps/` or `functions/src/`; the seed's only direct
service calls are isolated in `seed/adminServices.mjs`.

## 8. Founder-decision handling (EA-001 §24)

Resolved by the instruction: D-1 (Product Truth wins), D-2 (hamburger; no navigation change made), D-3, D-4 (excluded),
D-7 (gate **off**), pricing (USD 2 / 3–5 supersede prototype values). **Not explicitly resolved — handled as follows:**

* **D-5** (_"Terms/verification in the preview (UI cannot complete it)"_; recommendation _"Seed-driven via real callables… do not flip the production constant"_). Handled exactly so: Terms are accepted through the real `acceptBusinessTerms` callable against the existing test-only fixture; nothing is bypassed and the constant is untouched. **Seam reported (not invented):** a Business created *by hand* in the UI cannot accept Terms/submit (`TERMS_READABLE_CONTENT_AVAILABLE = false`, `DEC-LEGAL-002` open).
* **D-6** (_"May the local preview use the existing publish path while `PB-013B P3-3` is open?"_; recommendation _"Yes, local preview only; P3-3 stays open"_). Materially affects EA-002 — programmes, Circles and Rewards cannot exist without publication — and the instruction requires those. Proceeded on the EA-001 recommendation, local-only, `PB-013B P3-3` untouched and **still OPEN**. **Flagged for explicit Founder confirmation.**
* **D-9** (_"Operator MFA in preview: real TOTP spike → else seed-mode only → else guarded emulator attestation"_). The TOTP spike was **not** performed; the middle option was applied: activation and Commercial commands run in-process with seed-supplied second-factor evidence, no emulator attestation was added anywhere in `functions/src`. Real TOTP in the Auth emulator remains **unverified**.
* **D-11** (Preview Launcher): **not implemented** (it is a screen/route); preview identities and the real sign-in screen are used instead.
* D-8, D-10, D-12, D-13, D-14: not material to EA-002.

## 9. Findings (seams and facts discovered; none "fixed" by inventing behaviour)

1. **Business Terms screen unavailable** → live onboarding cannot complete from the UI (see D-5).
2. **`listAvailableRewardsForBusiness` carries no Reward id**; a redemption UI cannot call `confirmRedemption` from the Business read alone (the seed used the customer's own read). Adds to EA-001 B4.
3. **Programmes with `sharedLoyaltyNumberAllowed=false` reject a Loyalty Number** — counters must present the QR reference; the preview uses QR for those and the number for the shared programme.
4. **Staff-invitation acceptance requires a verified email** — the seed completes the emulator's real verification flow.
5. Qualifying items/programmes require an **activated** Business; activation requires admin + second factor (D-9).
6. **Price schedules cannot be back-dated and settlements cannot be future-dated**, so settlement history is "received now".
7. Commercial `reasonCode` is a closed set (`correction`, `settlement_reconciliation`, `dispute_resolution`, `error_reversal`).
8. The Auth emulator rejects client-supplied `localId` (UIDs not fixable).
9. Sandbox/corporate proxies can intercept the emulators' own loopback calls — documented escape hatch `PREVIEW_STRIP_PROXY=1`.

## 10. Requirements recorded for the later Cloudflare phone-access spike

Runbook §12: configurable emulator origin (hard-coded `127.0.0.1` in `auth.ts`/`functions.ts`); never proxy Auth-emulator
`/emulator/v1/*` admin endpoints; callables are plain HTTPS POSTs (allow-list proxy feasible); custom-domain Functions mode
for HTTPS; Vite host allow-list; invitation links use `window.location.origin`; Email/Password only for remote use.

## 11. Validation (this branch, clean runs)

| Check                                                   | Result                                          |
| ------------------------------------------------------- | ----------------------------------------------- |
| `pnpm build` · `pnpm typecheck` · `pnpm lint` (0 errors; 1 pre-existing warning) · `pnpm format:check` | pass |
| Unit/component: functions / web                         | 1971 / 926 pass                                 |
| Preview guard tests (`pnpm test:preview-tooling`)       | 24 / 24 pass                                    |
| PostgreSQL integration suite under Firestore emulator (`_test` DB) | 19 files, 678 tests pass            |
| Emulator suite (`pnpm emulators:validate`)              | 67 files, 877 pass, 3 skipped (pre-existing)    |
| Default Playwright (`chromium`, `chromium-dashboard-harness`) | 41 pass                                   |
| Emulator Playwright (`chromium-emulator-e2e`)           | 18 pass                                         |
| Preview acceptance from a cleaned state: `preview:start` → `verify` → `reset` → `verify` → browser journeys | pass; **18/18** Playwright (desktop + Pixel 7) |

Local environment note: Docker was unavailable in the authoring sandbox, so a local PostgreSQL 16 on port 54329 stood in via
`PREVIEW_POSTGRES_URL`; the Docker path is the unchanged repository compose file and is exercised by CI's service container
variant of the same flow. Playwright used the installed Chromium via a temporary, uncommitted config (browser build mismatch in the sandbox).
No existing test was modified or weakened.

## 12. Risks

| #   | Risk                                                                                                    | Control                                                                 |
| --- | ------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| R-1 | D-6 assumed (local publish while `P3-3` open)                                                           | Local-only; flagged for confirmation                                    |
| R-2 | Seed supplies second-factor evidence in-process (D-9)                                                   | Confined to `seed/adminServices.mjs`; nothing in `functions/src`        |
| R-3 | Reset is destructive                                                                                    | Guards; only the `_local` database; emulators only                      |
| R-4 | Seed is coupled to current callable contracts; a contract change breaks the seed (by design, loudly)    | Runs in CI on every PR                                                  |
| R-5 | In-memory emulator data: restart loses Firestore/Auth while PostgreSQL persists                         | `start` detects and resets automatically                                |
| R-6 | CI step adds ~3–4 minutes                                                                               | One job, reuses existing service container                              |
| R-7 | Illustrative BIF/RWF prices could be mistaken for launch prices                                          | Labelled preview-only in code, rate note, runbook                       |

## 13. Rollback

Revert the commit (`git revert`). No schema, migration, dependency, `functions/src` or `apps/web/src` change exists.
Local state: `pnpm preview:stop`, delete `.preview/`; optionally `docker compose -f docker-compose.postgres.yml down -v`.
