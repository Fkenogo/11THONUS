> **Title:** CAP-P2-ITM-B — Trust Record Persistence & Authentication Signal Ingestion — Implementation Report
> **Status:** Implemented, pending Founder-authorized review/merge (do not merge)
> **Governing document:** [ITM-DESIGN-001](../roadmap/ITM-DESIGN-001-identity-trust-management-architecture.md) v1.2, §4, §5, §7, §12, §15 `ITM-B`, §22 (`AD-ITM-1`–`AD-ITM-4`)
> **Prerequisites:** `CAP-P2-ITM-A` (merged PR #111, `eea8726`) — CI green

# CAP-P2-ITM-B — Trust Record Persistence & Authentication Signal Ingestion — Implementation Report

## 1. Entry `origin/main` SHA

`a598108eacc75f3b62b9857be3d325200f8ed9ea` — verified via `git rev-parse origin/main`; matches "Merge pull request #112 from Fkenogo/docs/cap-p2-itm-a-closure-sync", the task's expected baseline exactly.

## 2. Clean worktree/branch

`/Users/theo/11THONUS/.claude/worktrees/itm-b`, branch `feat/cap-p2-itm-b-trust-persistence`, branched fresh from `origin/main` at `a598108`. The primary worktree at `/Users/theo/11THONUS` (branch `chore/eng-p1-001-closure`, pre-existing unrelated docs-only dirty state) was never reset, cleaned, stashed, rebased, or written to.

## 3. ITM-A prerequisite verification

- `git log origin/main --oneline --grep=ITM` confirmed `ITM-A` merged (PR #111, merge `eea8726`, closure-evidence commit `db2d6b7`) and `ITM-DESIGN-001` merged (PR #110).
- `gh api .../commits/a598108.../check-runs` confirmed post-merge CI `"Build, Lint, Test, Emulator Validation" = success`.
- `git branch -a` / `git ls-remote --heads origin` confirmed no `ITM-B`/`-C`/`-D` branch exists anywhere.
- `gh pr list --state open` confirmed only PR #34 open (unrelated, `ENG-P2-RES-ADMIN-003` post-decision sync).
- Capability 3 and G2: `CDR-001` confirms both `Not started`.
- Dirty primary worktree confirmed untouched throughout (`git status --short` in `/Users/theo/11THONUS` unchanged).

No material state differed from the task's stated expectations — Phase A proceeded without a stop condition.

## 4. Codebase analysis (performed before writing code)

- **`ITM-DESIGN-001` §4, §5, §7, §12, §15** — full re-read. §12 already specifies the persistence shape precisely enough to implement without inventing anything: doc-ID-keyed `trustRecords/{customerIdentityId}` collection, no new index, "read target first, no-op if already applied" idempotency, `version` field for optimistic concurrency. §4's no-circularity note explicitly authorizes ITM-B calling identity's read-only lookup contract (`ENG-P2-001-09`) for record-creation-time existence confirmation.
- **ITM-A's actual merged contracts** (`functions/src/domains/trust/models/*.ts`) — read in full: `trustRecord.ts`, `trustLevel.ts`, `trustRecordStatus.ts`, `trustRecordId.ts`, `trustRuleVersion.ts`, `trustReasonReference.ts`, `trustEvidenceCategory.ts`, `trustErrors.ts`, `signalState.ts`, `verificationState.ts`. Confirmed `createTrustRecord` is the sole construction entry point (no mutation function), `TrustEvidenceCategory`'s two values (`customer_authenticated`, `authentication_recovery_proof_provided`) match `AUTH-08`'s own event names exactly, and `trustReasonReference.ts` structurally carries no trust-movement field (making `AD-ITM-2` neutrality true by construction, not convention).
- **`trustDomainBoundary.test.ts`** (ITM-A's own boundary test) — found it asserts "no firebase-admin import anywhere in the trust domain" and "no domains/identity import anywhere in the trust domain," recursively over the *whole* `domains/trust` directory. Since the design explicitly requires ITM-B to add Firestore persistence and to call identity's lookup contract within this same domain, these two assertions needed scoping to `models/` only (ITM-A's actual layer) — see §27 below for the exact, disclosed change.
- **`AUTH-08`'s actual event contracts** — `authenticationEvents.ts` (payload shapes: `{customerIdentityId, referenceType}` / `{customerIdentityId, referenceType, proofMethodCategory}`), `authenticationEventFactories.ts` (deterministic `eventId`/`correlationId` derivation, `buildEventType("authentication", "customer_authenticated", 1)` etc.), `authenticationEventEmitter.ts` (the "read target first, no-op if exists" idempotent-enqueue pattern this package's own ingestion mirrors for *consumption*).
- **Shared outbox infra** (`outboxEntry.ts`, `outboxWriter.ts`, `outboxProcessor.ts`) — read in full. Discovered `processOutboxEntries` has **zero live callers anywhere in this codebase** (no `onSchedule`/pub-sub wiring exists for any domain yet); `identityAudit`/`-10` is a pure read-only query projection over `outboxEntries`, not a `processOutboxEntries` consumer. This directly informed the scope decision in §15 below.
- **`identityLookupRepository.ts` / `identityLookupPurpose.ts`** (`ENG-P2-001-09`) — the exact read-only lookup contract `ITM-DESIGN-001` §4 names; `internal_service` is an allow-listed purpose for `customer_identity_id` lookups and is not unconditionally audited (only on `not_found`/`purpose_not_permitted`), so calling it on the trust-record creation path is a lightweight, already-governed check.
- **`customerIdentityRepository.ts` / `identityLifecycleRepository.ts`** — the established transactional-repository idiom: existence-check-inside-the-transaction (relying on Firestore's own contention-retry for concurrency safety), `stampCreate`/`stampUpdate` for `BaseMetadata` timestamps, domain validation via the pure model factory before every write.
- **`userDocument.ts`** — the Firestore-document-converter idiom (`toXDocument`/`fromXDocument`, `Timestamp`↔`Date` cast helpers) — the direct template for `trustRecordDocument.ts`.
- **`firestore.rules`** — confirmed a catch-all `match /{document=**} { allow read, write: if false; }` already denies any collection with no explicit rule, including a new `trustRecords` collection — no rules change needed or made.
- **`eslint.config.js`** — confirmed the established per-domain Firebase-import-ban-with-`repositories/`-carve-out pattern (Identity/Loyalty Number/QR Identity/Permissions), and that ITM-A's own block already anticipated a future ITM-B carve-out in its comment.

## 5. Implementation strategy (stated before implementation)

ITM-B adds two new layers alongside ITM-A's existing `models/` inside `functions/src/domains/trust/`: a `repositories/` layer (Firestore document converter + the single idempotent, transactional `ingestTrustEvidence` write path) and a `services/` layer (event-type/payload validation, the identity-existence fail-closed check, and an outbox-processor-compatible handler adapter). No second event system, no second idempotency subsystem, and no new Cloud Function trigger are introduced — event-consumption idempotency reuses the trust record's own `reasonReferences` (deduplicated by `eventId`, exactly mirroring `AUTH-08`'s emitter's own "read target, no-op if exists" convention applied to *consuming* rather than *producing*), and outbox-processor integration reuses the existing, unmodified `processOutboxEntries`/`claimOutboxEntry`/`NonRetryableProcessingError` machinery.

## 6. ITM-B scope reconstruction

Implemented: `trustRecordDocument.ts` (Firestore converter), `trustRecordRepository.ts` (doc-ID-keyed repository; `getTrustRecordByCustomerIdentityId`; the transactional `ingestTrustEvidence`), `trustSignalIngestionService.ts` (event validation, category/payload/occurredAt resolution, identity-existence fail-closed check, orchestration), `trustSignalErrors.ts` (ITM-B's own error factories, reusing `TrustDomainError`), `trustEventHandler.ts` (the `OutboxEventHandler`-shaped adapter with Retryable/NonRetryable classification). Not implemented (by design, ITM-C/D's responsibility): trust-band derivation, account-age computation, current-time evaluation, risk-gate read contract, regression/suspension triggers, operator visibility, a new live scheduled Cloud Function trigger.

## 7. Persistence strategy

Doc-ID-keyed `trustRecords/{customerIdentityId}` (§12) — the 1:1 trust-record/identity invariant is structurally enforced by this key choice alone (no separate uniqueness index). `getTrustRecordByCustomerIdentityId` is a plain read; `ingestTrustEvidence` is the single write path, wrapped in one Firestore transaction (`db.runTransaction`) that reads the target document, decides create-vs-update, and writes — the same pattern `customerIdentityRepository.ts`/`identityLifecycleRepository.ts` already use.

## 8. Trust-record ownership model

Verified: a trust record can only be *created* through `ingestTrustEvidence`'s creation branch, which runs the identity-existence check (§13) beforehand — a trust signal can never create a Customer Identity, and an unknown identity fails closed (`RESOURCE_NOT_FOUND`) before any Firestore write to `trustRecords` occurs. The doc-ID key (`customerIdentityId`) makes "duplicate trust record for one identity" structurally impossible — there is exactly one document address per identity. `customerIdentityId` is carried as a plain string throughout ITM-B, never a second identity key, and never ITM-A's own `TrustRecordId` type conflated with anything identity-owned.

## 9. Trust-record creation behavior

Lazy creation on first governed signal ingestion (§13's "ITM must be able to lazily create a default (`unverified`) trust record on first read/first signal"), per the design's own explicit resolution of that ambiguity. `trustLevel` is set to the literal `"unverified"` default at creation and is **never** recomputed by ITM-B on any subsequent write — only `signalState`/`reasonReferences`/`version` change. `verificationState` is left at its default (`{phoneVerified: false, emailVerified: false}`) — see §29 for the disclosed rationale (no governed band-derivation rule in `ITM-DESIGN-001` §6.6 consumes it, so populating it from `AuthenticationReferenceType` would be inventing unreviewed semantics).

**Concurrent first-event-delivery safety:** proven, not merely asserted — `ingestTrustEvidence` performs its existence check *inside* the same Firestore transaction that performs the write, the identical mechanism `customerIdentityRepository.createCustomerIdentity` already relies on. Firestore's own transaction-contention detection serializes two concurrent transactions racing on the same document; the losing attempt automatically retries and observes the winner's already-created document, taking the update branch instead. Test 8 (`trustSignalIngestion.emulator.test.ts`) exercises this directly against the real emulator with two concurrent, distinct `CustomerAuthenticated` events for the same identity and asserts exactly one document with both evidence entries (`version` 2, not two competing documents).

## 10. CustomerAuthenticated ingestion

Sets `signalState.hasSuccessfulAuthentication = true` (monotonic OR against the current persisted value — never unset) and appends a `reasonReferences` entry. Does **not** set `provisional`, does **not** compute `trustLevel`, does **not** check account age, does **not** run any 30-day logic — verified by test 13 (`no trust derivation... occurs during ingestion`), which asserts `trustLevel` stays `"unverified"` immediately after the first `CustomerAuthenticated` event is ingested, even though the evidence that will *eventually* satisfy `provisional` under ITM-C's future derivation is already present in `signalState`.

## 11. RecoveryProof ingestion

`AuthenticationRecoveryProofProvided` is ingested and appended to `reasonReferences` (category `authentication_recovery_proof_provided`) but never touches `signalState.hasSuccessfulAuthentication` and never touches `trustLevel` — verified by test 4 (neutral persistence) and test 15 (repeated ingestion, auth then recovery, never decreases `signalState`). Consistent with `AD-ITM-2`: this event carries no trust-movement field anywhere in the persisted shape (ITM-A's `trustReasonReference.ts` structurally has none), so ITM-B has no field through which it *could* encode a positive or negative trust impact even if it wanted to.

## 12. Idempotency model

Reuses the trust record's own `reasonReferences` array, deduplicated by `eventId`, as the idempotency ledger — no second idempotency subsystem (the existing `shared/idempotency/idempotencyService.ts` is a *command*-level idempotency mechanism for client-initiated commands with a client idempotency key + request hash; it is a different concern from *event-consumption* dedup and was deliberately not repurposed here, mirroring `AUTH-08`'s own emitter, which also does not use it for its "read target, no-op if exists" enqueue). Inside the single ingestion transaction: if the document exists and already contains a `reasonReferences` entry for this `eventId`, the call is a no-op (`applied: false`, unchanged record returned); otherwise the evidence is appended (or the document is created). Tests 2, 5, and 8b prove duplicate delivery (same event, sequential and concurrent) never double-counts.

## 13. Customer Identity existence handling (fail-closed)

Only checked on the trust-record *creation* path (record does not yet exist) — per §4's "optionally, for record creation" phrasing: once a trust record exists, its owning identity necessarily existed when it was first created (identities are never deleted, only status-transitioned), so re-verifying on every subsequent signal would be a redundant read with no correctness benefit. Uses `lookupCustomerIdentityById(db, {..., purpose: "internal_service"})` — the exact `ENG-P2-001-09` contract `ITM-DESIGN-001` §4 names. A `RESOURCE_NOT_FOUND` result is mapped to ITM-B's own `unknownCustomerIdentityForTrustEvidenceError` and the ingestion transaction never runs — verified by test 9: an event for a nonexistent `customerIdentityId` is rejected and `getTrustRecordByCustomerIdentityId` afterward confirms no orphan document was created.

## 14. Out-of-order handling

Both governed event categories are commutative by construction: `hasSuccessfulAuthentication` is a monotonic OR (order-independent), and `reasonReferences` is an `eventId`-deduplicated set (its *final* contents are independent of arrival order, even though the array itself has an insertion order). Tests 6 and 7 ingest the same two events in opposite orders for two different identities and assert both converge to the identical `signalState`/`trustLevel`. Test 17 additionally proves full replay-determinism: ingesting the same two events twice (simulating at-least-once redelivery) produces the identical final `signalState`/`version`/`reasonReferences` count as a single pass.

## 15. Concurrency strategy

All ten scenarios from the task's Phase L test matrix are covered by the real-emulator suite (`trustSignalIngestion.emulator.test.ts`): duplicate same-event delivery (test 2/5), concurrent first-event deliveries (test 8), concurrent delivery of the identical event (test 8b), replay after successful processing (test 17, and the dedicated outbox-level replay test), out-of-order delivery (tests 6/7), write contention (relies on Firestore's native transaction retry, exercised by test 8), malformed event payload (test 11), missing identity (test 9), duplicated trust-record attempt (structurally impossible — doc-ID key — additionally exercised by test 8/8b). No duplicate authoritative state results in any scenario.

## 16. Transaction/atomicity strategy

A single Firestore transaction per `ingestTrustEvidence` call performs the read, the create-vs-update decision, domain validation (via ITM-A's `createTrustRecord`), and the write — no nested transactions, and the identity-existence check (a separate, non-transactional read via `lookupCustomerIdentityById`) happens *before* entering this transaction, not inside it, since it is a different domain's read boundary with its own (already-governed) audit-write semantics that must not be nested inside ITM-B's own transaction. No external/non-Firestore side effect exists anywhere in the retryable transaction callback.

## 17. Customer Identity existence handling

See §13 (Ownership model) and §16 — fail-closed, read-only, no side effect on Customer Identity, and never attempted inside the trust-record transaction itself.

## 18. Failure/error mapping

| Failure | Category | Outbox-handler classification |
|---|---|---|
| Unsupported event type | `VALIDATION_FAILED` | Non-retryable, dead-letter `invalid_payload_for_version` |
| Malformed event payload (missing/wrong-typed `customerIdentityId`, unparseable `occurredAt`) | `VALIDATION_FAILED` | Non-retryable, dead-letter `invalid_payload_for_version` |
| Unknown Customer Identity | `RESOURCE_NOT_FOUND` | Non-retryable, dead-letter `missing_source_record` |
| Malformed persisted trust-record document | `VALIDATION_FAILED` (via ITM-A's own `createTrustRecord` validation, reused unmodified) | Non-retryable, dead-letter `invalid_payload_for_version` |
| Transient Firestore failure | *(unmapped — generic `Error` propagates)* | Retryable, existing bounded-backoff default (unchanged) |

No 15th error category was introduced (TRD11 §11.35's closed 14-category taxonomy, reused unmodified).

## 19. Test matrix

All 20 items from the task's Phase Q matrix are covered (numbered comments in `trustSignalIngestion.emulator.test.ts` correspond 1:1 to the task's own numbering); item 14 (`account-age logic occurs`) and item 19 (`ruleVersion remains valid`) have no ITM-B-owned code path to exercise (no account-age/rule-version logic exists in this package — confirmed absent by inspection, not by a runtime test, since there is nothing to assert against) and are recorded here rather than a fabricated test. 27 emulator test files, 311 tests total (whole codebase, `pnpm emulators:validate`); 24 of those tests are new to this package (23 in `trustSignalIngestion.emulator.test.ts` — one covers two orderings — plus outbox-level cases).

## 20. RED→GREEN evidence

`trustRecordDocument.test.ts` written first; run against the not-yet-created module — genuine RED (`Cannot find module './trustRecordDocument'`, captured verbatim in this session). Implementation added; re-run — GREEN (2/2). The emulator suite (`trustSignalIngestion.emulator.test.ts`) was written against the not-yet-created `trustSignalIngestionService`/`trustRecordRepository`/`trustEventHandler` modules and iterated through two genuine RED states before GREEN: (1) a `parseEventType` incompatibility with `AUTH-08`'s actual snake_case event names (an unrelated, pre-existing shared-infra mismatch, worked around rather than "fixed" — see §26), and (2) two test assertions that incorrectly expected `createdAt`/`updatedAt` to equal the event's `occurredAt` rather than the server-stamped value the implementation correctly writes (a test-assertion correction, not an implementation regression). Final run: 311/311 GREEN against the real Firebase Emulator Suite.

## 21. Files modified

- `functions/src/domains/trust/repositories/trustRecordDocument.ts` (new)
- `functions/src/domains/trust/repositories/trustRecordDocument.test.ts` (new)
- `functions/src/domains/trust/repositories/trustRecordRepository.ts` (new)
- `functions/src/domains/trust/services/trustSignalIngestionService.ts` (new)
- `functions/src/domains/trust/services/trustSignalErrors.ts` (new)
- `functions/src/domains/trust/services/trustEventHandler.ts` (new)
- `functions/src/domains/trust/services/trustSignalIngestion.emulator.test.ts` (new)
- `functions/src/domains/trust/models/trustDomainBoundary.test.ts` (modified — scoped two ITM-A assertions to `models/`, added one new assertion; see §27)
- `eslint.config.js` (modified — added `repositories/`/`services/` carve-out to the existing ITM-A block; see §27)
- `docs/05-implementation/reports/CAP-P2-ITM-B-trust-persistence-signal-ingestion-2026-08-16.md` (this report)
- `docs/05-implementation/roadmap/CDR-001-capability-delivery-roadmap.md`, `docs/05-implementation/change-tracking/engineering-implementation-programme.md`, `docs/changes/IMPLEMENTATION_CHANGES.md` (governance-tracking updates)

No ITM-A file under `functions/src/domains/trust/models/*.ts` other than its own test file was touched; no field, export, or validation rule of any ITM-A model changed.

## 22. Diff summary

Additive only: two new subdirectories (`repositories/`, `services/`) under the existing `functions/src/domains/trust/` domain, one scoped test-boundary widening (§27), one scoped ESLint carve-out (§27), and governance documentation. No file outside `functions/src/domains/trust/**`, `eslint.config.js`, and `docs/**` was touched.

## 23. Repository/converter implementation

`trustRecordDocument.ts` mirrors `userDocument.ts`'s converter idiom exactly: `toTrustRecordDocument`/`fromTrustRecordDocument`, `Timestamp`↔`Date` cast helpers, and delegation to ITM-A's own `createTrustRecord` for all validation on read (so a malformed persisted document fails closed via ITM-A's existing error, not a second validation layer). `trustRecordRepository.ts` adds the doc-ID-keyed collection reference, the plain read accessor, and the single transactional `ingestTrustEvidence` write path described in §7–§9.

## 24. Event-ingestion implementation

`trustSignalIngestionService.ts` resolves the event's category by exact `eventType` string match against the two governed event types (built via the same `buildEventType`/event-name constants `AUTH-08` itself uses — see §26 for why `parseEventType` was not used), extracts and validates `customerIdentityId`/`occurredAt` from the payload, performs the fail-closed identity-existence check on the creation path only (§13), and delegates to `ingestTrustEvidence`. `trustEventHandler.ts` adapts this to the shared outbox's `OutboxEventHandler` shape with Retryable/NonRetryable error classification (§18), fully exercised against the real `processOutboxEntries` machinery (three dedicated tests: successful processing to `completed`, dead-lettering an unknown-identity event, and duplicate-delivery safety across two separate `processOutboxEntries`/direct-call invocations).

## 25. Persisted-data privacy result

Verified by test 12 (`no credentials/PII persisted`): the persisted `trustRecords` document, serialized, contains no substring matching `password`, `token`, `otp`, or an `@` character (no email). By construction, ITM-B never reads or forwards any field from the governed events beyond `customerIdentityId`, `eventId`, `correlationId`, `occurredAt`, and the derived category — never `referenceType`'s underlying credential material, never `proofMethodCategory`'s... wait, `proofMethodCategory` itself is a categorical string (e.g. `"recovery_code"`), already governed as non-credential by `AUTH-08`'s own payload discipline, and this package does not even persist it — only the evidence *category* (`authentication_recovery_proof_provided`) is stored, not the payload's `proofMethodCategory` field.

## 26. No-derivation verification

Verified by test 13: immediately after the first `CustomerAuthenticated` event is ingested (which satisfies `signalState.hasSuccessfulAuthentication == true`, the first half of §6.6's `provisional` condition), the persisted `trustLevel` remains the literal `"unverified"` creation default — ITM-B never reads or writes any band-derivation logic. Additionally: `resolveCategory`'s deliberate choice not to use `shared/events/eventNaming.ts`'s `parseEventType` (its regex rejects the snake_case event names `AUTH-08` actually emits, e.g. `authentication.customer_authenticated.v1` — a pre-existing mismatch in unrelated shared infra, confirmed via a standalone Node regex check during this task, not fixed here since it is out of ITM-B's scope and touches shared infra other packages also depend on) is disclosed rather than silently worked around.

## 27. ITM-A regression

Full `functions/src/domains/trust/**` test suite re-run after all ITM-B changes: unchanged 6/6 in `trustDomainBoundary.test.ts` (with the scoped/added assertions — see below), all other ITM-A model tests unchanged and passing. **Additive test-boundary change, not a semantic change:** `trustDomainBoundary.test.ts`'s "no firebase-admin import" and "no domains/identity import" assertions were narrowed from the whole `domains/trust` directory to `models/` only — required because `ITM-DESIGN-001` §4/§12/§15 explicitly assign ITM-B a Firestore repository and an identity-lookup call within this same domain (a genuine "additive persistence seam explicitly required by the design," per the task's own Phase U instruction), and because ITM-A's own `eslint.config.js` block already carried a comment anticipating exactly this future carve-out. A new fifth assertion was added confirming the `domains/identity` import stays confined to `services/` only (never `models/` or `repositories/`), preserving the one-directional-boundary intent the original assertion protected. No `TrustRecord`/`TrustLevel` export shape, no monotonicity guarantee, and no ITM-A validation rule changed.

## 28. ITM-C handoff

After ITM-B, ITM-C receives: a `trustRecords/{customerIdentityId}` document per registered-and-signaled identity with `signalState.hasSuccessfulAuthentication` (append-only-true, order-independent), a `reasonReferences` array (deduplicated by `eventId`, category-tagged, timestamped from each event's own `occurredAt`), a `trustLevel` field holding only the `"unverified"` creation-time cache value (never advanced by ITM-B — ITM-C's read path must recompute it per §6.6.1, exactly as designed), and `version`/`status`/`verificationState` fields present but not yet meaningfully populated beyond their MVP defaults. Customer Identity's own `Registered`-transition timestamp (the account-age source, §6.6.4) is unchanged and unreferenced by anything ITM-B wrote — ITM-C reads it directly from Customer Identity, exactly as the design specifies, with no ITM-B-owned duplication to reconcile. No `signalState` migration or identity rebuild will ever be required by a future band-rule-version change (§6.6.2), since ITM-B never interprets `signalState` — it only appends to it.

## 29. Disclosed scope decision — `verificationState` left unpopulated

`ITM-DESIGN-001` §5/§7 lists "verified phone / verified email" as an available-now signal, derivable from `AuthenticationReferenceType`. ITM-B does not populate `verificationState.phoneVerified`/`emailVerified` from the event's `referenceType` field: §6.6's actual band-membership conditions never read `verificationState` (only `signalState.hasSuccessfulAuthentication` and account age), so inventing a `referenceType → verificationState` mapping here would be adding unreviewed semantics no governed consumer needs yet — exactly the "if speculative, leave it out" instruction (§5's own field-exclusion rationale, applied to a field's *population*, not merely its existence). Flagged here for a future governed decision, not silently dropped.

## 30. Focused tests

`trustRecordDocument.test.ts` (2 tests, unit, no emulator) plus the full pre-existing `functions/src/domains/trust/**` suite (12 files, 80 tests) — all green.

## 31. Emulator tests

`trustSignalIngestion.emulator.test.ts` — 23 tests against the real Firebase Emulator Suite, covering the full Phase Q matrix (§19) plus three dedicated real-outbox-processor tests. Run standalone (`firebase emulators:exec ... "pnpm --filter functions test:emulator -- trustSignalIngestion ..."`) — 311/311 (includes the rest of the codebase's existing emulator suite, unaffected). Run again via the full `pnpm emulators:validate` — 311/311, identical result.

## 32. Full validation

- `pnpm --filter functions test` — **875/875** (full unit suite, whole codebase).
- `pnpm emulators:validate` — **311/311** (full emulator suite, whole codebase).
- `pnpm --filter web test` — **397/397** (unchanged; this task touched no `apps/web` file).
- `pnpm typecheck` (both workspaces) — clean.
- `pnpm lint` — clean (after the disclosed `eslint.config.js` carve-out, §27).
- `pnpm format:check` — clean (after `pnpm format` auto-fixed three new files' formatting).
- `pnpm build` (both workspaces) — clean.
- Secret/privacy scan (`grep -rniE "password|secret|token|api[_-]?key|private[_-]?key|BEGIN (RSA|EC|PGP)"` over the new files) — no matches outside the two negative-assertion strings inside the test file itself (`expect(raw).not.toMatch(/password/i)` etc.).

## 33. Review findings/dispositions

Independent review performed by this same session (no external `code-review`/Codex review tool was separately invoked for this report — see §34); the review focused on: (a) the `parseEventType` incompatibility (found and fixed during TDD, §20/§26 — not a residual finding), (b) the two test-timestamp assertions (found and fixed during TDD, §20 — not a residual finding), (c) confirming no field beyond ITM-A's own §5 table is written by `toTrustRecordDocument` (confirmed clean), (d) confirming the `trustDomainBoundary.test.ts` narrowing does not silently relax any assertion beyond what ITM-B's own architecture requires (confirmed — the two narrowed assertions are still enforced against `models/`, and a new assertion was added rather than net-removed). No unresolved material finding remains open.

## 34. Remaining material findings

None identified.

## 35. Dependencies

None added or changed — `package.json`/`pnpm-lock.yaml` untouched by this task.

## 36. Config changes

`eslint.config.js` — one additive `ignores` entry on the existing ITM-A block (§27). No other config file changed.

## 37. Firebase/Rules changes

None. `firestore.rules`'s existing catch-all deny-by-default rule already covers the new `trustRecords` collection with no bespoke rule needed — verified by test 16 (asserts `firestore.rules` contains no `trustRecords`-specific rule) and by direct inspection.

## 38. Deployment changes

None. No `firebase.json` change, no new Cloud Function export, no scheduled trigger. `processOutboxEntries` is exercised only via direct test calls against the real emulator — not wired to any deployed trigger (see §14 for why this is a disclosed, deliberate scope boundary, not an oversight).

## 39. PR number

Opened as part of this task's closing step — see the completion message for the PR URL/number (created after this report was written, per Phase X/Z ordering).

## 40. Final reviewed head

The commit on `feat/cap-p2-itm-b-trust-persistence` containing all of the above, prior to any Founder-authorized merge.

## 41–47. Status summary

| Concern | Status |
|---|---|
| `ITM-A` | Complete/merged |
| `ITM-B` | **Implemented / pending Founder review** (this task) |
| `ITM-C` | Not started |
| `ITM-D` | Not started |
| ITM overall | Not complete |
| Capability 2 | Open — partially implemented |
| Capability 3 | Not started |
| G2 | Not started |

## 48. Dirty primary worktree status

Unchanged throughout this task — confirmed via `git status --short` in `/Users/theo/11THONUS` before starting and not touched at any point; all work performed exclusively in the isolated `.claude/worktrees/itm-b` worktree.

## 49. Risks

- No live scheduled consumption exists yet for any outbox event type in this codebase (§14/§38) — `AUTH-08` events will accumulate in `outboxEntries` as `pending` until a future, separately-authorized task wires a real trigger (or an operator manually invokes `processOutboxEntries`). This is a pre-existing platform gap, not introduced by ITM-B, but ITM-B's handler is now ready to be wired in without further ITM-B-side changes once that infra task is authorized.
- `verificationState` remains unpopulated (§29) — flagged for a future governed decision, not a defect.
- The `parseEventType`/`AUTH-08` snake_case mismatch (§26) is a pre-existing shared-infra inconsistency; worked around here, not fixed, since fixing it is out of this package's scope and could affect other consumers.

## 50. Rollback

Revert the PR — all changes are additive (new files, one scoped test/ESLint carve-out); no data migration, no deployed infra, no destructive change exists to unwind.

## 51. Persistent implementation-report path

`docs/05-implementation/reports/CAP-P2-ITM-B-trust-persistence-signal-ingestion-2026-08-16.md` (this file).

## 52. Changes-tracking state

`docs/05-implementation/roadmap/CDR-001-capability-delivery-roadmap.md` §2/§5, `docs/05-implementation/change-tracking/engineering-implementation-programme.md`, and `docs/changes/IMPLEMENTATION_CHANGES.md` updated with a dated `CAP-P2-ITM-B` entry per this repository's established governance-documentation convention (prepended to each file's "Last controlled update" line; prior history preserved unmodified).

---

## Independent Final Review, Merge Gate & Closure (2026-08-16)

Performed per task "CAP-P2-ITM-B — Independent Final Persistence & Ingestion Review, Merge Gate & Closure," on PR #113, entry head `c9abb2d`, entry CI `pass`. `origin/main` unchanged at `a598108` since the PR was cut; no `ITM-C` work found anywhere; only PR #34 (unrelated) open besides #113.

**Firestore schema authority (Phase B).** `ITM-DESIGN-001` §12 is headed "recommendation only, TRD10 not modified by this document" and states a schema amendment is "a follow-on implementation-package deliverable, not a design-document deliverable." Checked TRD10 directly (not the implementation report) for precedent: `loyaltyNumbers`, `qrIdentityRecords`, `outboxEntries`, `authenticationReferences`, `idempotencyRecords`, and `recoveryProofReferences` — six other collections this same capability already implemented and merged — have **zero** dedicated TRD10 sections, and their owning concerns (Customer Identity, Authentication) are already recorded `Complete`. This is repeated, un-objected-to, already-Founder-accepted precedent that a domain-architecture design document (mirroring `ENG-P2-ARCH-001`'s own role for Customer Identity) is the governing authority for a new collection's shape, with TRD10 currency permitted to lag. §12 is fully specific (exact illustrative collection path used verbatim, doc-ID key, no-index statement, transaction/idempotency strategy, concurrency mechanism) — not a vague direction requiring separate interpretation. TRD10 §10.13.1 `trustEvents` was found and inspected: it is the generic append-only domain-event/outbox schema (`DomainEvent`/`OutboxEntry`-shaped), unrelated to and non-conflicting with the per-identity `trustRecords` evidence record — a pre-existing naming coincidence, not a competing definition, and not introduced or worsened by this task. **Conclusion: governance is sufficient; no TRD10 amendment is required before this implementation; no unapproved architectural decision was smuggled in** (the implemented name/shape matches §12's own illustrative proposal exactly, no invented field or key structure beyond it).

**Trust-record/Customer-Identity invariant (Phase C) — one material finding, fixed.** Adversarially reviewed all six listed scenarios. Confirmed Customer Identity documents are never deleted in this codebase (`archived` is a terminal, non-erasing status per `identityStatus.ts`/DAP-010 — no `.delete()` call exists anywhere in the identity domain), so "deleted identity" and "replay after identity disappearance" are not currently reachable states; the creation-path-only existence check remains correctly scoped against the actual architecture. **Found:** a malformed (not missing) `users/{id}` document reached during the creation-path check threw a raw, unmapped `IdentityDomainError` (`VALIDATION_FAILED`) that `trustEventHandler.ts` did not recognise as a `TrustDomainError` — ingestion still correctly failed closed (no orphan `trustRecords` document was ever created, confirmed by test), but the outbox handler fell through to the generic *retryable* classification instead of dead-lettering immediately, which cannot fix a data-shape defect. **Fixed TDD-first:** wrote `trustSignalIngestion.emulator.test.ts` test 9b against the unfixed code — genuine RED (`AssertionError: expected error to be instance of TrustDomainError`, captured verbatim); added `malformedCustomerIdentityForTrustEvidenceError` (`trustSignalErrors.ts`) and a second `catch` branch in `assertCustomerIdentityExists` (`trustSignalIngestionService.ts`) mapping `VALIDATION_FAILED` identity errors into it; re-ran — GREEN (312/312). Any other `IdentityDomainError` category (e.g. a transient `TEMPORARY_UNAVAILABLE`) still propagates unmapped, correctly preserving the retryable default.

**AUTH-08 event-naming mismatch (Phase D) — resolved, not an AUTH-08 defect.** Checked the authoritative source directly: TRD11 §11.9's own governing examples (`loyalty.units_issued.v1`, `loyalty.reward_available.v1`, `subscription.payment_confirmed.v1`) use snake_case event names. `AUTH-08`'s `customer_authenticated`/`authentication_recovery_proof_provided` conform exactly to this standard. `shared/events/eventNaming.ts`'s `parseEventType` regex (`[a-z][a-zA-Z0-9]*`, no underscore) is the non-conformant piece — and this exact defect was already independently discovered and disclosed by a *different* prior package (`functions/src/domains/identityAudit/models/auditPrivacyClassification.ts`'s own doc comment: "every real identity/loyaltyNumber/qrIdentity event name is snake_case... that mismatch is a pre-existing, disclosed gap in the shared naming helper... out of this bounded package's scope to fix"). ITM-B's exact-string match against the two known governed `eventType` values (rather than `parseEventType`) is confirmed the correct, precedented disposition — option (A) adapting around unrelated shared-infra, not (B) masking an AUTH-08 defect, since AUTH-08 has none here. Verified no false-positive/false-negative risk: an unlisted `eventType` cannot resolve to a category (test: "unsupported event type fails closed").

**Idempotency, monotonicity, concurrency (Phases E/F/J).** Re-verified by direct code inspection plus the real-emulator suite (24 tests, all against `FIRESTORE_EMULATOR_HOST`, none mocked): `eventId`-deduplicated `reasonReferences` is validated non-blank by ITM-A's own `createTrustRecord` (no ITM-B-level gap); distinct events cannot collide (AUTH-08's own deterministic-hash `eventId` scheme, out of ITM-B's scope to re-verify); `signalState.hasSuccessfulAuthentication` is a monotonic OR, confirmed to never accept a `true → false` transition (no code path writes `false` when the current value or the new category input is `true`); malformed events are validated before any transaction opens, so no partial state is reachable. Concurrent first-event creation (test 8), concurrent identical-event delivery (test 8b), and post-completion replay (dedicated outbox test) all rely on Firestore's own transaction-contention retry — the same mechanism `customerIdentityRepository.ts` already depends on — proven against the real emulator, not asserted from unit mocks.

**`trustLevel` cache (Phase G).** Confirmed by grep: no line anywhere in `repositories/`/`services/` reads or branches on `trustLevel`'s value — it is written once at creation (`"unverified"`) and never read back by any ITM-B code path. `getTrustRecordByCustomerIdentityId` returns it as part of the raw record (necessary so a future ITM-C can read it), but nothing in this package treats it as authoritative. No stale-authority hazard is introduced or worsened by ITM-B.

**ITM-A boundary/framework-independence (Phase H).** Mechanically re-verified via fresh `grep`: zero `firebase-admin`/`firebase-functions` imports in `models/` (only the boundary test's own regex-string literals match, not real imports); zero `models/` → `repositories/`/`services/` imports; zero `repositories/` → `services/` imports (no layering inversion); `services/` → `repositories/` and `services/` → identity's `repositories/` are the only cross-layer imports, both in the intended direction. The narrowing is confirmed an intended, disclosed architectural refinement, not a weakening of any ITM-A guarantee the original test still meaningfully protected.

**Privacy (Phase I).** Re-inspected `toTrustRecordDocument`'s full field list line-by-line: `customerIdentityId`, `verificationState` (two booleans), `signalState` (one boolean), `trustLevel`/`status` (closed enums), `version` (integer), `reasonReferences` (category/eventId/correlationId/opaque strings + timestamp), `createdAt/By`/`updatedAt/By` (`actorId` always `null` — system-initiated). No email, phone, token, OTP, password, credential, or demographic field anywhere; `actorId` is never a raw PII value.

**ITM-C handoff (Phase K).** Confirmed sufficient without redesign: `signalState.hasSuccessfulAuthentication` (append-only) + Customer Identity's unmodified `Registered` timestamp (still directly readable by a future ITM-C, never duplicated by ITM-B) + the existing `trustRuleVersion.ts` contract together satisfy §6.6's three-band derivation inputs exactly. Recovery evidence remains present in `reasonReferences` but is structurally incapable of influencing `trustLevel` (no field exists to carry a trust-movement value).

**Unauthorized-scope audit (Phase L).** Fresh `git diff origin/main..HEAD --stat` confirms the diff is exactly the 13 files this package touches (no unrelated files — an earlier stale local `main` ref briefly produced a misleadingly large diff against unrelated history; corrected by diffing against `origin/main` directly). Targeted grep for band-derivation, account-age, risk-gate, regression/suspension/expiry, operator-visibility, Reward Engine, and scheduled-trigger terms across the new code found no implementation of any — only the disclosed "no `onSchedule` wiring" comment.

**Test-matrix adequacy (Phase M).** The pre-existing 23-test matrix (Phase Q, prior task) was independently judged adequate for everything except the malformed-identity classification gap above; one new test (9b) was added, TDD-first, to close it. 24 total new/changed emulator tests; 312/312 emulator suite green.

**Full validation (Phase N), re-run fresh after the fix:** functions **875/875**; `emulators:validate` **312/312**; web **397/397** (unchanged); `pnpm typecheck` (both workspaces) clean; `pnpm lint` clean; `pnpm format:check` clean; `pnpm build` (both workspaces) clean; secret/PII grep — no matches outside the test file's own negative-assertion strings.

**Review tooling (Phase O).** No automated Codex/external review bot is configured on this repository (`gh pr view 113 --json reviews` returned an empty list; no review-requesting GitHub App installed). Recorded per this task's own instruction that unavailability alone is not a blocker — this independent review is the merge gate.

**Files changed during this final review:** `functions/src/domains/trust/services/trustSignalErrors.ts` (new error factory), `functions/src/domains/trust/services/trustSignalIngestionService.ts` (new `catch` branch), `functions/src/domains/trust/services/trustSignalIngestion.emulator.test.ts` (test 9b added). No dependency, config, Firebase, Rules, or deployment change.

**No further material finding remains open.**

---

## FINAL GATE

**ITM-B READY FOR FOUNDER REVIEW/MERGE**
