# 11THONUS — EA-BL-001-CORR-002-B Staff Counter: Implementation Report

**Status:** IMPLEMENTED — FOUNDER PREVIEW / TECHNICAL REVIEW PENDING. Not accepted, not complete, not merged.
**Entry:** `origin/main` `4bc9c49261c1db8bfdacb3d91b68d51ad59e47f9` (PR #306 merged; post-merge CI run 37642428840 verified `success`).
**Branch:** `feat/ea-bl-001-corr-002-b-staff-counter`. Authority: [assessment §22/§23](11THONUS-EA-BL-001-CORR-002-B-staff-counter-authorisation-and-design-2026-10-07.md).

## 1. Authorised scope vs. what was built
| Authorised (D1–D8, §23) | Built |
|---|---|
| D1 no name lookup | None added. Staff work from a scanned QR or typed Loyalty Number plus the server outcome. |
| D2 camera QR + Loyalty Number fallback | `qrScanner.ts` (native `BarcodeDetector`, lazy `jsqr` fallback, capability + permission handling, tracks stopped on result/cancel/submit/unmount). |
| D3 tokenless two-device registration | `NewCustomerPanel`: static public sign-up address + QR, steps, dual-role “choose Personal” copy. No account/token/session creation. |
| D4, D5 deferred | No Circle/progress, no redemption. |
| D6 Staff-own recent | New `listMyRecentCounterPurchases` (server-scoped). |
| D7 Business name only | Business name; no station. |
| D8 bounded Staff shell | `StaffShell`/`StaffRoutes`; Owner/Manager unchanged. |
| §15 safe error discriminator | `PurchaseDomainError.reason` → `HttpsError.details.reason`. |
| §22.2/§23.1 purchaseDate + key | `counterIntent.ts`; transport retry classification fixed. |

## 2. Backend enablers (the only backend changes)
- **Discriminator** (`purchaseErrors.ts`, `index.ts`, `recordPurchaseCommand.ts`): closed set `customer_artifact_invalid_or_not_found | programme_unavailable | qualifying_item_invalid | quantity_invalid | generic_validation_failed`. Message still never echoed. Shared-number refusal maps to the **neutral customer-code token** (indistinguishable from an unknown code — tested). Identity-lookup not-found/malformed is now surfaced under the artifact token (was an identity error reaching the client as `authentication_failed`; one existing test updated deliberately). Boundary parse errors carry the same tokens. Auth/state/idempotency errors carry **no** reason.
- **Staff-own read**: `listMyRecentCounterPurchases` gated by live `purchase.record` (Staff, authorised Manager, Owner); `recorded_by_user_id = <server actor>` in SQL; limit 1–20 (default 10); purpose-built projection (`id, recordedAt (ISO string), itemLabel, quantity, status, presentedVia, customerCodeHint`) — no reviewer, reason, threshold, customer identity id, recorder or commercial fields; hint = last 3 characters only for a typed Loyalty Number. Includes the member’s own review-required rows (the outcome they were told). Existing Owner/Manager `listPurchasesForBusiness` unchanged.
- No schema/migration, WP-COM, BR or Trust change. No new permission.

## 3. Web
`apps/web/src/business/counter/`: `CounterPage`, `NewCustomerPanel`, `CounterRecentActivity`, `StaffShell`, `qrScanner`, `counterIntent`, `counterErrors`, `counterProgrammes`, `counterHooks`, `signUpUrl`. Transport: `BusinessApiError.reason`, optional per-callable classifier, `classifyRecordPurchaseError`. Dev-only `/dev/counter-harness`. EN/FR under `business.counter.*`.

## 4. Key behaviours and proofs
- **Retryable mapping (§14).** Found: a lost response/dropped connection reaches the SDK as `functions/internal`, which the shared mapping called non-retryable `failed` → the key holder would **discard the key**. `recordPurchase` now classifies `internal/unknown/cancelled` (and a bare network error) as uncertain/retryable; every other callable unchanged. Tests: unit, page-level, real-stack.
- **purchaseDate/idempotency (§13).** One intent = payload + `purchaseDate` + key; `resolvePurchaseDateInstant` is called only when an intent is prepared. Retry reuses all three; intentional edit, definitive failure or Serve next discards. Proven: page test with moving clock; **real-stack test** forwards the request to the server (commit) then drops the response, retries → identical payload/key/date, one new row; DB test: same key retry returns the original, changed date under the same key → `IDEMPOTENCY_CONFLICT`, revoked actor’s retry → `AUTH_FORBIDDEN` (authorisation still runs first; replay was **not** moved before it).
- **BR confidentiality (hard condition).** Staff `listRewardPrograms` lacks the key (server); the Counter additionally projects through a whitelist so the key is dropped even for Owner/Manager responses; not in DOM, query cache, request, errors, outcome; absence is never read (no client threshold logic). Staff cannot read the queue, approve, reject or verify (DB tests + `preview:counter-checks`).
- **Outcomes.** `waiting_for_customer`: “Purchase recorded. The customer needs to confirm it. Nothing has been earned yet.” `business_review_required`: “Purchase recorded. Business review is required before customer confirmation.” (success, `role=status`, no controls). Only routing/item/quantity retained from the server result.
- **Access.** Staff land on Counter; Owner/Manager shell unchanged (`counter` route reachable, no nav item added — nav-label test locks the list). Server authority unchanged; role only picks the shell; if the role cannot be read the page **fails closed** (error state, no shell) — never treated as Owner/Manager.

## 5. QR dependency
`jsqr@1.4.0` (Apache-2.0, zero dependencies, ~130 kB / 47 kB gzip) in its **own lazy chunk**, loaded only when native `BarcodeDetector` is missing (Safari/iOS). Chosen over `qr-scanner` (also pulls camera/worker management we implement ourselves) and `@zxing/browser` (5.8 MB). Last published 2025-11-13. Lockfile updated.

## 6. Tests and validation
| Layer | Result |
|---|---|
| functions unit (`pnpm --filter functions test`) | 176 files / 2026 tests pass |
| PostgreSQL + Firestore emulator (`test:postgres`, local PG 17 + isolated emulator) | 22 files / 772 tests pass (new `staffCounter.postgres.test.ts`: 26 tests) |
| web unit (`vitest`) | 136 files / 1076 tests pass (Counter: 114) |
| Playwright harness (`chromium-dashboard-harness`) | 69 pass (29 new: 320/375/390 px, desktop, fake camera incl. track `ended`, FR, dark, axe on every state) |
| Playwright real preview stack (`chromium-preview`, `chromium-preview-mobile`) | 10 + 10 pass |
| `preview:verify` after reseed; `preview:counter-checks [--write]` | match / all PASS |
| typecheck, eslint (0 errors), prettier | clean |

Defects found by the real stack/axe and fixed: a `Date` crossed the callable as `{}` and crashed the feed (now ISO string + tolerant renderer + regression tests); white-on-`amber-600` and `slate-400` contrast (now `amber-700`, `slate-600`); a relative `Navigate` in the splat Staff route looped (absolute target).

## 7. Prototype fidelity / deviations
Kept: frontline feel, numbered steps, prominent Scan, programme/item/stepper/Record, reset, recent activity, slate/amber cards. Removed per directive: scenario strip, mock people, default Amina, `setTimeout` submit, name/phone search, all-customer pills, walk-in creation, Circle, threshold note, Staff reward confirmation, Front Desk. Deviations: AA contrast shades; **top bar** rather than a bottom nav (Business shell records a bottom bar as Founder-rejected; one destination); Staff-own feed shows the Loyalty Number ending, not a name.

## 8. Preview readiness
Seed adds Bella “Express Styling Circle” (number accepted, BR at 5) + 2 items; fingerprint updated and verified live. Runbook §13 lists the 17 acceptance scenarios. `pnpm preview:counter-checks`, `tests/e2e/preview/counter.spec.ts` (mutates data → `preview:reset`). Preview ports 28101–28109 were occupied locally by a Slice A preview from another checkout, so verification ran with ports temporarily shifted (reverted; not committed).

## 9. Risks, limitations, unresolved
- Real-phone camera needs a secure origin and reachable emulators (preview §12 spike); until then use device mode + webcam, or the Loyalty Number path.
- Pre-existing, **not changed**: `recordPurchase` returns the full Purchase row (customer identity id, Loyalty Number snapshot) to the caller; Staff can also read Business-wide purchases via `listPurchasesForBusiness` (N1). The Counter retains none of it. Owner/Manager `PurchaseRecordsPage` recomputes `purchaseDate` per submit (same latent duplicate-on-lost-response issue; now benefits from the retry classification but not the intent holder) — recommend a follow-up.
- Recent feed query has no `(business_id, recorded_by_user_id, created_at)` index (no migration authorised); fine at MVP volumes.
- A malformed (non-UUID) programme id yields a generic internal error — unreachable from the Counter.
- Owner/Manager have no nav link to the Counter (route only) — Founder to decide.
- Review queue UI and the customer’s “awaiting business” view are later slices.

## 10. Automated review (Codex, head `eee6654`) — disposition
| Finding | Disposition |
|---|---|
| P1 fail closed when the role is unreadable | **Fixed** — error state; test updated. |
| P1 partition recent-feed cache by actor | **Fixed** — key includes the signed-in uid; test added. |
| P2 programme not validated before item focus | **Fixed** — programme is its own invalid field (EN/FR copy), focus to first programme control; test added. |
| P2 index for recorder-scoped lookups | **Not applied — needs Founder decision.** It is a schema migration, outside Slice B's authorised scope (no migration). Recommended follow-up: `(business_id, recorded_by_user_id, created_at DESC, id DESC)`. |

## 11. Rollback
Revert the PR. No schema, config, secrets or data migration; the seed change is reverted by `pnpm preview:reset`.
