# ENG-P2-002B — Business Creation, Persistence & Atomic Bootstrap — Implementation Report

**Date:** 2026-08-19
**Status:** Complete/merged — see ADDENDUM below (independent review, PR #124 merged as `755a666`, 2026-08-19)
**Scope authorization:** ENG-P2-002B only (governed Business bootstrap path + supporting persistence/infrastructure). Does NOT include ENG-P2-002C, ENG-P2-003, subscription enforcement, Commerce Knowledge, frontend onboarding, or deployment.

---

## 1. Entry origin/main SHA

`50dc5bed15450e188f36668d83af9d1b50ac0ae4` — verified via `git fetch origin && git rev-parse origin/main`, matched exactly against the Founder-supplied baseline.

## 2. Worktree/branch

New, clean, isolated worktree at `/Users/theo/11THONUS/.claude/worktrees/eng-p2-002b`, branch `feat/eng-p2-002b-business-bootstrap`, checked out directly from `origin/main` (HEAD `50dc5be`). The protected primary worktree (`/Users/theo/11THONUS`) was never entered or modified.

## 3. Prerequisite verification (Phase A)

- PR #122 (`ENG-P2-002A — Business & Branch Domain Contracts and Lifecycle Foundation`): `MERGED`, merge commit `8ff5eed`.
- PR #123 (`docs(tracking): ENG-P2-002A closure sync`): `MERGED`, merge commit `50dc5bed…` — identical to `origin/main` HEAD, confirming no commits exist past this closure sync.
- Post-merge CI on `main` (`workflow_dispatch`, run `32043309208`): `success`.
- Only one other open PR exists (`#34`, unrelated docs/governance branch) — no ENG-P2-002B work exists anywhere, and no ENG-P2-002B branch/worktree existed before this session.
- Both authoritative documents confirmed present on `origin/main`: the design (`docs/05-implementation/roadmap/ENG-P2-002-DESIGN-001-…md`) and the 002A implementation report.

No material state difference from the Founder's expected baseline — proceeded without stopping.

## 4. Codebase analysis (Phase B)

Delegated to a research pass across 15 areas before writing any code: the design doc, the 002A report, the actual merged 002A domain code, Customer Identity resolution, the AUTH-03 endpoint-service pattern, the shared idempotency service, the shared outbox writer, Firestore transaction patterns, the Loyalty Number uniqueness precedent, the businessMembership/Role contract, the ENG-P2-004 `authorizeAndExecute` boundary, converter/repository conventions, emulator-test conventions, the closed error taxonomy, and Firestore security rules. Full findings are in the session record; the load-bearing ones are reflected in sections 7–12 below.

## 5. Pre-change implementation strategy

Presented to the Founder before any file was written (see conversation): mirror the AUTH-03 layering exactly (`onCall` transport → endpoint/service owner resolution → domain bootstrap orchestration → one Firestore transaction → bounded result/error mapping), reuse every existing seam (idempotency service, outbox writer, AUTH-02 credential resolution, the Loyalty Number doc-ID-as-value uniqueness pattern) with no new subsystem, and never route through `authorizeAndExecute` (structurally impossible — no membership exists pre-bootstrap).

## 6. Exact 002B scope

Implemented exactly the eleven responsibilities Phase C names: Business persistence, BusinessBranch persistence, initial Owner membership persistence, businessCode candidate generation + transactional uniqueness reservation, Customer Identity authoritative owner resolution, a dedicated bootstrap command/service, idempotency, one atomic Firestore bootstrap consistency boundary, `BusinessCreated` outbox evidence, a bounded result/error contract, and emulator/integration validation. None of the explicitly-out-of-scope items (profile/branch editing, additional branches, lifecycle beyond initial creation, `pending_verification`, self-suspension, ownership transfer, staff invite/accept/remove/suspend, permission overrides, frontend UI) were touched — verified mechanically in section 28/29.

## 7. Owner-resolution architecture (Phase D)

`ownerUserId` is derived exclusively via: `firebaseAdminTokenVerifier()` (the identical AUTH-02 verifier `authenticate` uses) → `resolveAuthenticatedCredential` (AUTH-02, unchanged) → `AuthResult`. An `"unregistered"` outcome, or a resolved Customer Identity whose status is not `active`/`dormant` (i.e. `suspended`/`locked`/`closed`/`archived`), fails closed with `invalidCustomerIdentityForOwnerError` (`AUTH_REQUIRED`) **before** the bootstrap transaction is ever invoked. No second Customer Identity is created; no client-supplied id is ever consulted (`CreateBusinessRequest` has no such field, enforced at the TypeScript level by 002A plus a whitelist parser at the transport boundary — section 9).

## 8. Bootstrap service architecture (Phase E)

```
onCall("createBusiness")  [functions/src/index.ts]
  → parseCreateBusinessCommand (whitelist parser)
  → businessBootstrapEndpointService.handleCreateBusiness  [transport-independent, unit-tested without Firestore]
      → verify token → resolveAuthenticatedCredential → eligibility gate
      → businessRepository.bootstrapBusiness  [idempotency + one Firestore transaction]
```
Kept as a plain dependency-injected function (not the `onCall` wrapper itself), exactly mirroring `authenticationEndpointService.ts`. `createBusiness` is never routed through `ENG-P2-004`'s `authorizeAndExecute` — structurally impossible pre-bootstrap, confirmed by inspection (section 26).

## 9. Input-authority classification (Phase F)

| Field | Classification | Enforcement |
|---|---|---|
| `displayName`, `primaryCategoryId`, `countryCode`, `currencyCode`, `timezone`, `city`, `contactPhone`, `supportedLanguages`, and optional `legalName`/`businessTypeId`/`address`/`contactEmail`/`logoUrl`/`subscriptionId` | CLIENT INPUT | Whitelist-parsed field-by-field in `index.ts`; any other key on the payload (`ownerUserId`, `role`, `membershipId`, `businessCode`, `branchId`, …) is silently dropped — never reaches `CreateBusinessRequest` |
| `rawToken`, `referenceType` | AUTHENTICATED CONTEXT | Verified via `TokenVerifierPort` before anything else runs |
| `idempotencyKey` | CLIENT INPUT (opaque) | Passed through unchanged to the idempotency service |
| `ownerUserId` | SERVER-DERIVED | From the verified credential → `resolveAuthenticatedCredential`, never from `request` |
| `businessId`, `branchId`, `membershipId` | SERVER-GENERATED | `db.collection(...).doc()` (client-side id mint, no I/O) before the transaction opens |
| `businessCode` | SERVER-GENERATED | Transactional reservation, section 10 |
| `now` | SERVER-DERIVED | Injected clock seam, defaults to `new Date()` |

`CreateBusinessRequest`'s own TypeScript shape has no `ownerUserId` key (002A's compile-time guarantee, re-verified with a `@ts-expect-error` unit test in this package too).

## 10. businessCode uniqueness strategy (Phase G)

Reused 002A's `businessCode.ts` format/alphabet (`BIZ` + 6 symbols, 32-char ambiguity-free alphabet, `MAX_BUSINESS_CODE_GENERATION_ATTEMPTS = 5`) and `businessCodeGenerator.ts` port unchanged. Added `businessCodeReservationService.ts` (pure, mirrors `loyaltyNumberIssuanceService.ts` exactly): bounded retry loop over an injected `BusinessCodeUniquenessPort`, defense-in-depth `createBusinessCode` validation on every candidate (a malformed candidate fails `VALIDATION_FAILED` even if literally unreserved), exhaustion → `businessCodeGenerationExhaustedError` (`TEMPORARY_UNAVAILABLE`, customer-invisible per the `DEC-DATA-007` precedent).

## 11. Uniqueness-storage design (Phase H)

New `businessCodeReservations/{businessCode}` collection — the document id **is** the code value, checked via `transaction.get()` inside the bootstrap transaction, identical mechanism to `loyaltyNumbers/{value}`. `businesses/{id}` stays keyed by an opaque Firestore id (unlike Loyalty Number, a Business has other lookups a code-as-primary-key would complicate) — the reservation doc is the uniqueness index, not a second identifier subsystem. No probabilistic/"low collision" reliance: uniqueness is enforced transactionally, every time.

## 12. Collision-retry treatment (Phase S)

Tested with a deterministic `SequenceGenerator` test double — never real randomness: (a) first-attempt success, (b) exactly one collision then success, (c) exhaustion after `MAX_BUSINESS_CODE_GENERATION_ATTEMPTS` consecutive collisions with the generator called exactly that many times (asserted), (d) a forced collision in the emulator against a pre-seeded reservation doc, retried and resolved. See section 30/31.

## 13. Atomic transaction composition (Phase I/P)

One `db.runTransaction`: **reads only** first — the businessCode candidate-collision loop (bounded, ≤5 `transaction.get()` calls) — then **writes only**: `businesses/{id}`, `businessBranches/{id}`, `businessMemberships/{id}` (initial Owner), `businessCodeReservations/{code}`, and the `BusinessCreated` outbox entry via the shared `writeOutboxEntry`. All five writes are issued inside the same transaction callback; Firestore's transaction protocol guarantees all-or-nothing commit. Idempotency-key reservation happens in its own transaction *before* this one opens (matching `checkAndReserveIdempotencyKey`'s own design), and `completeIdempotencyKey`/`failIdempotencyKey` run *after* the bootstrap transaction settles, outside it — the standard shape this codebase already uses everywhere idempotency wraps a transaction (e.g. `loyaltyNumberRepository.ts`).

## 14. Business persistence result

Exact merged 002A contract, verbatim, via `toBusinessDocumentFields` — no field reinterpreted. One correction found during emulator testing (section 30): the Admin SDK rejects `undefined` document values outright, so the 002B persistence layer strips absent-optional fields before `.set()` (`stripUndefined`) rather than persisting a spurious explicit `null` — a persistence-layer concern 002A's framework-independent domain layer correctly left undecided.

## 15. Owner membership result

`businessMemberships/{id}`: `userId` = server-derived owner, `businessId`, `role: "owner"`, `status: "active"`, `permissions: []` (Owner authority is the evaluator's structural floor invariant, never an explicit override), `createdAt`/`updatedAt` = server time. Confirmed round-trip-parseable by the frozen `fromBusinessMembershipDocument` reader in a read-only emulator test (section 26).

## 16. Default branch result

Exactly one `businessBranches/{id}` per bootstrap, exact Founder-approved MVP schema (`id`, `businessId`, `displayName`, `countryCode`, `city`, `address?`, `createdAt`, `updatedAt`, `schemaVersion` — no `isPrimary`/`status`/`timezone`/`branchCode`), `displayName`/`countryCode`/`city` defaulted from the Business itself per 002A's `buildBootstrapBusinessInput` (unchanged).

## 17. Idempotency result

Same key + same request (bound to the *resolved* `ownerUserId`, not just the request body) → replays the original `CreateBusinessResult` from the completed record's `responseSnapshot`, creates nothing new. Same key + a materially different request (including a different resolved owner) → `IDEMPOTENCY_CONFLICT`, verified against real Firestore. Concurrent identical calls → exactly one Business persists, the loser observes `in_progress`/fails closed. All proven against the emulator (section 30), not mocks.

## 18. Multi-business-owner behavior (Phase N)

Explicitly *not* enforced as "one owner = one Business" — TRD10 permits multi-business ownership. Idempotency keys scope replay-prevention to a single *request*; a Customer Identity creating two Businesses under two different idempotency keys succeeds and produces two independent Businesses with distinct ids/codes — proven in the emulator suite.

## 19. BusinessCreated event contract (Phase O)

`business.business_created.v1`, payload: `businessId`, `ownerUserId`, `branchId`, `businessCode`. Deliberately excludes `contactEmail`/`contactPhone`/`address`/`legalName` — no governed necessity for them in this event; they remain available on the `businesses/{id}` document for any consumer needing the full record. Verified privacy-minimal in the emulator test (asserts the excluded fields are `undefined` on the persisted event payload).

## 20. Outbox consistency result

`writeOutboxEntry` called inside the same bootstrap transaction as every other write — no second event bus/outbox, no possibility of a Business existing without its `BusinessCreated` evidence or vice versa (proven by the atomicity test: all five artifacts exist together after success, none exist after a forced failure — section 22).

## 21. Transaction ordering (Phase P)

Verified against the real Emulator (not just mocks): the businessCode collision-retry loop performs only `transaction.get()` calls; every `transaction.set()` is issued after that loop resolves. This satisfies Firestore's actual "all reads before any writes" transaction constraint, which the emulator enforces identically to production.

## 22. Partial-failure result (Phase Q)

Emulator test: pre-seeding all 5 candidate reservation docs so the retry loop exhausts inside the transaction. Result: zero `businesses`/`businessBranches`/`businessMemberships` documents for the attempted owner, and the idempotency record is left `"failed"` (retryable), never stuck `"processing"` forever. No persistent intermediate state was observed in any test.

## 23. Concurrency result (Phase R)

All five required scenarios exercised against the real Emulator: (1) same key/same request concurrent calls → one Business, no duplicates; (2) same key/different request → `IDEMPOTENCY_CONFLICT`; (3) forced businessCode collision via a pre-seeded reservation doc → retried and resolved; (4) two different Customer Identities bootstrapping concurrently → two distinct, non-colliding businessCodes; (5) one Customer Identity, two different idempotency keys → two independent Businesses, never blocked.

## 24. Error taxonomy

Every 002B failure maps onto the existing closed 14-category taxonomy via `BusinessDomainError`, extending 002A's `businessErrors.ts` (no new module, no new category): `AUTH_REQUIRED` (unauthenticated/ineligible owner), `VALIDATION_FAILED` (malformed request field, malformed businessCode candidate), `IDEMPOTENCY_CONFLICT` (in-progress collision, conflicting replay, duplicate businessCode), `TEMPORARY_UNAVAILABLE` (collision-retry exhaustion, uniqueness-check backend failure). No raw Firestore/Firebase error ever escapes to the client — `index.ts`'s `toHttpsError` maps every `BusinessDomainError` category to a stable Callable code with a single generic message (`business_creation_failed`), the same enumeration-resistant posture the Authentication domain already uses.

## 25. Security/privacy review (Phase U)

- Client cannot select `ownerUserId`, role, membership, or `businessCode` — structurally (whitelist parser + 002A's typed contract), not by convention.
- No credential/token/OTP is ever persisted or logged by 002B — the raw token is consumed only by the existing verifier, never retained.
- No sensitive Auth material enters any Business document or event.
- No permission bypass exists post-bootstrap: the Owner membership is ordinary, evaluator-readable data: it grants nothing 002B doesn't also grant every other Owner via the same evaluator path.
- `businessCode` is never treated as an authority/lookup-by-secret mechanism anywhere in 002B.
- Secret scan of every new/modified file: clean (no credentials, keys, or tokens found).

## 26. ENG-P2-004 compatibility (Phase V)

Read-only emulator test: after bootstrap, `getBusinessMembershipByUserAndBusiness` resolves `{kind: "found", role: "owner", status: "active", overrides: []}` — the frozen reader parses the 002B-written document with no `"malformed"`/`"not_found"` outcome. A full `evaluatePermission` call against the freshly-bootstrapped (necessarily `draft`) Business correctly denies with `BUSINESS_NOT_ACTIVE`/`BUSINESS_INACTIVE` — proving the evaluator reads 002B's data cleanly and applies its own, unmodified business-status gate; this is the designed boundary (§10.1), not a defect — 002B does not special-case a newly-created Business, and `ENG-P2-004` itself was never touched.

## 27. Firestore Rules assessment (Phase W)

`createBusiness` is an Admin-SDK-only `onCall`; no client Firestore write path was opened. `businesses`/`businessBranches`/`businessMemberships`/`businessCodeReservations` all fall under `firestore.rules`'s existing catch-all `allow read, write: if false` — unchanged, no Rules file modification made or required.

## 28. 002C leakage audit (Phase X)

Mechanically verified absent from this change: `updateBusinessProfile`, `updateBranch`, `suspendBusiness`, `closeBusiness`, `archiveBusiness`, any verification-transition handler, any ownership-transfer handler. `createBusiness` is the only new exported Cloud Function.

## 29. ENG-P2-003 leakage audit (Phase Y)

Mechanically verified absent: staff invite/accept/remove/suspend/reactivate, shared-device auth, role-change command, permission-override command. The only membership write in this change is the single initial Owner membership required for bootstrap consistency.

## 30. RED→GREEN evidence

- `businessCodeReservationService.test.ts`: written first; run against a non-existent module → `Cannot find module './businessCodeReservationService'` (genuine RED). Implemented; reran → 6/6 pass, then 2 initially failed on malformed test fixture data (candidates using disallowed alphabet characters, e.g. `0`) which was a test bug, not a source bug — corrected, reran → 6/6 pass.
- `businessBootstrapEndpointService.test.ts`: written first; run against a non-existent module → `Cannot find module './businessBootstrapEndpointService'` (genuine RED). Implemented; reran → 8/8 pass.
- Emulator suite: on first run against the real Firebase Emulator, 8 of 9 new tests failed with a genuine defect — `Cannot use "undefined" as a Firestore value (found in field "legalName")` — the Admin SDK rejecting the `undefined` optional fields 002A's framework-independent serializers legitimately produce. Fixed with `stripUndefined` in the persistence layer (section 14); reran → 9/9 new tests pass, 348/348 total emulator tests pass.

## 31. Tests added

- 6 unit tests: `businessCodeReservationService.test.ts`
- 8 unit tests: `businessBootstrapEndpointService.test.ts`
- 9 emulator/integration tests: `businessRepository.emulator.test.ts` (atomicity, replay, conflict, concurrency, multi-business, collision retry, concurrent-unique-codes, partial-failure-leaves-nothing, evaluator compatibility)
- **23 new tests total**, all passing.

## 32. Full validation

| Check | Result |
|---|---|
| Focused 002B unit tests | 14/14 pass |
| Focused business-domain emulator tests | 9/9 pass (new) |
| Full `functions` unit suite (`pnpm --filter functions test`, via `vitest run`) | 1043/1043 pass (113 files) |
| Full emulator suite (`pnpm emulators:validate`) | 348/348 pass (32 files) |
| `apps/web` test suite | 397/397 pass (unaffected — no frontend files touched) |
| `pnpm run typecheck` (functions + web) | clean |
| `pnpm run lint` (root eslint, whole repo) | clean |
| `pnpm run format:check` | clean (after one `prettier --write` pass on the 5 new/modified files) |
| `pnpm run build` (functions + web) | clean |
| Secret scan of changed files | clean |

## 33. Files modified

- `eslint.config.js` — extended the existing Business-domain boundary block with an `ignores` entry for `domains/business/repositories/**` and the one Firebase-touching `services/businessBootstrapEndpointService.ts` file (the pure `businessCode*` services remain covered by the framework-independence rule).
- `functions/src/index.ts` — added the `createBusiness` `onCall`, its whitelist request parser, and a `BusinessDomainError` branch on the existing `toHttpsError` mapper.

## 34. Code diff summary (new files)

- `functions/src/domains/business/services/businessCodeUniquenessPort.ts` — port interface (13 lines)
- `functions/src/domains/business/services/businessCodeReservationService.ts` + `.test.ts` — collision-retry domain service (66 + 120 lines)
- `functions/src/domains/business/services/businessBootstrapEndpointService.ts` + `.test.ts` — owner-resolution endpoint composition (120 + 160 lines)
- `functions/src/domains/business/events/businessEvents.ts` — `BusinessCreated` event builder
- `functions/src/domains/business/repositories/businessRepository.ts` — the atomic bootstrap transaction
- `functions/src/domains/business/repositories/businessRepository.emulator.test.ts` — 9 emulator/integration tests

## 35. Dependencies added

None. `pnpm install` in the fresh worktree resolved the existing lockfile only.

## 36. Config changes

`eslint.config.js` only (section 33) — no `firebase.json`, `firestore.indexes.json`, or environment/config file changed.

## 37. Firebase/Rules changes

None. `firestore.rules` untouched (section 27) — no new Rules block was needed or added.

## 38. Deployment changes

None — out of this task's authorized scope; no deploy was performed or attempted.

## 39. Review findings/dispositions

Independent self-review conducted (no automated review tool invoked in this session — disclosed per Phase AB) covering: authoritative owner binding, transaction atomicity, businessCode uniqueness, idempotency, outbox atomicity, concurrency, and 002C/003 boundaries. One finding surfaced and fixed during this review pass: the `undefined`-field Firestore rejection (section 14/30) — caught by the emulator suite, not a static-review finding, but recorded here as the one substantive defect found and corrected before this report was written.

## 40. Remaining material findings

None outstanding. All emulator/unit/build/lint/typecheck/format checks are green at the time of this report.

## 41. PR number

[PR #124](https://github.com/Fkenogo/11THONUS/pull/124).

## 42. Final reviewed head

`7ee862b5a32e57a925d1badaa9292f21b6cb6839`.

## 43. CI result

Green — `Build, Lint, Test, Emulator Validation` (run `32045753513`) passed in full: Build, Lint, Format check, Typecheck, Unit/component tests, Playwright e2e, and the Firebase Emulator Suite validation all succeeded.

## 44. ENG-P2-002B status

**Implemented / pending Founder review.**

## 45. ENG-P2-002C status

Not started.

## 46. ENG-P2-003 status

Not started.

## 47. Capability 3 status

Not started / implementation foundations underway only, per repository status convention (unchanged by this task).

## 48. Dirty primary worktree

Not touched. `/Users/theo/11THONUS` (branch `chore/eng-p1-001-closure`, with its own pre-existing untracked Founder files under `WORKING_WITH_THE_FOUNDER/` and `docs/`) was never entered during this session.

## 49. Risks

- The `businessCodeReservations` collection is a new uniqueness-index collection with no automatic cleanup path — this mirrors the Loyalty Number precedent exactly (codes are never recycled, by design) and is not a defect, but is worth the Founder's awareness: reservation docs are permanent by design (§24 FD-3 "never recycle codes").
- `ELIGIBLE_OWNER_IDENTITY_STATUSES = {"active", "dormant"}` is this task's own disclosed judgment call (Phase D says "authoritative Customer Identity" without naming exact eligible statuses) — `dormant` was included on the basis that dormancy is not a suspension/lock/closure; the Founder may wish to confirm or narrow this.

## 50. Rollback

Revert the PR's merge commit; no data migration, no Firestore Rules change, no deployed state exists to roll back beyond the code itself. The new `businessCodeReservations`/`businesses`/`businessBranches`/`businessMemberships` collections would only contain data from real bootstrap calls made through `createBusiness`, none of which exist before this PR merges.

## 51. Persistent implementation-report path

`docs/05-implementation/reports/ENG-P2-002B-business-creation-persistence-atomic-bootstrap-implementation-report-2026-08-17.md` (this file).

## 52. Changes-tracking state

Updated in the established programme-tracking location (`docs/05-implementation/change-tracking/engineering-implementation-programme.md`), dated supersession, in the closure-sync commit accompanying this update — no historical report rewritten.

## 53. Exact next Founder action

Superseded by the addendum below — PR #124 has been independently reviewed and merged under Founder authorization for that specific action.

---

## FINAL GATE (superseded — see addendum)

~~**ENG-P2-002B BLOCKED — FOUNDER DECISION REQUIRED**~~

~~(Blocked on PR review/merge, not on any unresolved technical defect — all validation is green. Do NOT begin ENG-P2-002C.)~~

---

## ADDENDUM — Independent Final Review, Merge & Closure (2026-08-19)

Performed under a separate Founder authorization scoped exactly to: independent final review of PR #124, correction of genuine defects only, merge if all gates pass, and closure. Did not begin ENG-P2-002C.

**Reviewer availability:** the `codex` CLI is present on the host but this session is non-interactive; its own subcommands fail with "stdin is not a terminal" — not usably available. Independent manual review was performed instead (below), per this task's own explicit fallback.

**New findings and dispositions:**

1. **Runtime mass-assignment proof (Phase E).** The original implementation relied on `CreateBusinessRequest`'s TypeScript shape lacking an `ownerUserId` key — a compile-time guarantee only. Added `parseCreateBusinessCommand` mass-assignment regression tests (`functions/src/index.test.ts`) that pass a malicious raw payload attaching `ownerUserId`/`membershipId`/`role`/`businessCode`/`branchId`/`businessId`/`status`/`createdAt`/`updatedAt`/`schemaVersion`/`permissions` and assert none of them survive into the parsed command at runtime, plus an exact-whitelist assertion on the resulting key set. **Fixed** (test added; no source defect found — the whitelist parser was already correct, now proven at runtime rather than merely by type).
2. **Same-candidate concurrency proof (Phase Q.3).** The original concurrency tests used two *different* generators drawing two *different* candidate codes — proving no cross-request collision, but not proving the transaction actually detects an *occupied* code under real contention. Added a test where two concurrent bootstraps both offer the identical first-choice candidate; verified exactly one claims it and the other is forced onto its own fallback, with the reservation doc correctly attributed to the winner. **Fixed** (test added; no source defect found — the `transaction.get()`-before-claim design was already correct, now proven under genuine contention).
3. **`businessCodeReservations` governance (Phase F/G).** Independently researched whether this new collection needs a TRD10 schema amendment. Found direct precedent: `ENG-P2-001-05`'s implementation report shows `loyaltyNumbers`/`qrIdentityRecords` were introduced as new doc-ID-as-value uniqueness collections with no TRD10 amendment (disclosed only in the roadmap doc). TRD10 itself (`docs/99-archive/source-backups/phase-1-2026-07-16/TRD/TRD10_Firestore Data Architecture.md`) does not enumerate `loyaltyNumbers`, `idempotencyRecords`, `outboxEntries`, or `authenticationReferences` either — these are accepted engineering-owned implementation-infrastructure collections beneath the TRD10-governed domain schema. **Disposition: Category A — legitimate reuse of established architecture. No escalation required, no code change made.**
4. **Owner authority chain (Phase D).** Independently re-traced (not re-asserted from the prior report) through `authenticationReferences/{type}:{id}` → `getActiveAuthenticationReferenceOwner` → `owner.customerIdentityId` → `users/{customerIdentityId}`. Confirmed the raw email/phone/provider reference is never itself ownership authority — only the resolved, opaque internal Customer ID is, via the identical trusted lookup every other authenticated command in this codebase already uses. **No defect found.**

**Remaining material findings:** none.

**Validation (fresh re-run on the final reviewed head):** `functions` unit 1045/1045 (+2 mass-assignment tests), `emulators:validate` 349/349 (+1 concurrency test), `web` 397/397 unchanged, typecheck/lint/format/build all clean, secret scan clean.

**Final reviewed head:** `644b96ac3540ef379d754ef427ed66aa3ab7fef8` — CI green (run `32047009016`).

**Merge:** PR #124 squash-merged as `755a66663810ddb2d64bc98bc815660f2c421ec8`. `git diff 644b96a origin/main` is empty — the merged tree is byte-identical to the reviewed head (squash preserved content exactly, only the commit graph was flattened). Post-merge CI on `main` green (run `32047320443`).

## FINAL GATE

**ENG-P2-002B MERGED AND CLOSED — ENG-P2-002C AWAITS FRESH FOUNDER AUTHORIZATION**
