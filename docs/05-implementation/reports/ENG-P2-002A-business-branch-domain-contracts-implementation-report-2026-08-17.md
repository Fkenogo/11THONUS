> **Title:** ENG-P2-002A — Business & Branch Domain Contracts and Lifecycle Foundation — Implementation Report
> **Status:** Implemented, test-first — pending Founder-authorized review/merge
> **Source-of-truth path:** `docs/05-implementation/reports/ENG-P2-002A-business-branch-domain-contracts-implementation-report-2026-08-17.md`
> **Governing document:** [`ENG-P2-002-DESIGN-001` v1.1](../roadmap/ENG-P2-002-DESIGN-001-business-identity-architecture-delivery-design.md) §20, §24 (FD-1/FD-2/FD-3)

# ENG-P2-002A — Business & Branch Domain Contracts and Lifecycle Foundation

## 1. Entry state

- **Entry `origin/main` SHA:** `82ae587fa54e555918a6bb0d500b2d26a0a28e6c` — verified before any work began; matched the task's expected SHA exactly.
- PR #120 (`ENG-P2-002-DESIGN-001`) and PR #121 (closure sync) both confirmed `MERGED`; post-merge CI green on `main`.
- No `ENG-P2-002A` work existed anywhere in the repository (branches/PRs) before this task.
- Worktree: `docs/eng-p2-002a` → renamed `feat/eng-p2-002a-business-domain-contracts`, branched cleanly from the verified SHA. Primary worktree (`/Users/theo/11THONUS`) never touched this session.

## 2. Scope authorization

This task authorizes **domain contracts / models / validation only** — no Firestore writes, no business-creation persistence, no callable endpoints, no bootstrap execution, no `businessCode` Firestore reservation, no idempotency execution, no outbox emission. Explicitly excludes `ENG-P2-002B`, `ENG-P2-002C`, `ENG-P2-003`, frontend, and Firebase deployment.

## 3. Codebase analysis (Phase B)

Inspected before writing any code:
- `ENG-P2-002-DESIGN-001` v1.1 in full (all 24 sections).
- TRD10 §10.6.3 (`businesses`), §10.6.4 (`businessMemberships`), §10.5 (Required Standards — ISO 3166-1/4217 country/currency code shapes, opaque/non-sequential IDs).
- `functions/src/domains/permissions/models/businessDocument.ts`/`businessMembershipDocument.ts` — confirmed these are `ENG-P2-004B`'s narrow, frozen readers; not modified.
- `functions/src/domains/identity/models/{customerIdentity,identityStatus,identityErrors,customerIdentityId}.ts` — the aggregate/status-table/domain-error/id-validator conventions this package mirrors.
- `functions/src/domains/trust/models/` — confirmed the same framework-independence discipline pattern.
- `functions/src/shared/errors/{errorCategories,platformError}.ts` — the closed 14-category taxonomy this package maps onto.
- `eslint.config.js` — the per-domain `no-restricted-imports` framework-independence boundary pattern (Identity/Loyalty Number/QR Identity/Authentication/Permissions/Trust blocks).
- `functions/src/shared/metadata/{serverTimestamp,baseMetadata}.ts` — confirmed these are persistence-layer (`firebase-admin`-dependent), out of `002A`'s scope; domain models use plain `Date` instead.
- `functions/src/domains/loyaltyNumber/{models/loyaltyNumber.ts,services/loyaltyNumberGenerator.ts,services/randomLoyaltyNumberCandidateGenerator.ts,services/loyaltyNumberIssuanceService.ts}` — the `DEC-DATA-007` identifier-generation precedent, and the port/concrete-generator split.
- `functions/src/domains/authentication/services/authenticationEndpointService.ts` — the AUTH-03 endpoint-service pattern the design's FD-2 disposition names as precedent (referenced, not implemented — that's `002B`'s callable).

## 4. Implementation strategy (stated before coding)

A new framework-independent domain, `functions/src/domains/business/`, mirroring the `identity`/`loyaltyNumber` domain-foundation pattern: pure `models/` (value types, fail-closed readers/writers, structural lifecycle, domain errors) plus a pure `services/` port for the `businessCode` candidate generator. No `firebase-admin`/`firebase-functions` import anywhere, machine-enforced via a new `eslint.config.js` block. TDD throughout: every file's test was written first and run to confirm RED before implementation.

## 5. Exact `002A` scope reconstructed (Phase C)

Owns (per design §20's `002A` responsibility text, re-verified against the merged v1.1 document, not assumed): `Business`/`BusinessBranch` value types + readers/writers (full shape); the structural lifecycle-state machine (§6-governed transitions only); `businessCode` policy/format contract + validator + pure candidate-generator port; bootstrap request/context/result contracts; domain errors on the closed taxonomy; tests proving every boundary. Explicitly does not own (and this diff contains none of): Firestore repositories/writers, `createBusiness` command execution, transactions, idempotency-service calls, outbox, callable transport, Owner-membership writes, branch writes, lifecycle command handlers, permission evaluation. No difference found between the task's stated scope and the merged design — both agree.

## 6. Business contract

`functions/src/domains/business/models/business.ts` — the full TRD10 §10.6.3 shape (`id`, `businessCode`, `legalName?`, `displayName`, `ownerUserId`, `primaryCategoryId`, `businessTypeId?`, `countryCode`, `currencyCode`, `timezone`, `city`, `address?`, `contactPhone`, `contactEmail?`, `logoUrl?`, `supportedLanguages: string[]`, `status`, `subscriptionId?`, `createdAt`, `updatedAt`, `schemaVersion`). No field invented or broadened beyond §4.1's verbatim block. `createBusiness`'s own params type carries no `status` field — a status other than `draft` cannot be supplied even structurally.

## 7. Lifecycle contract

`businessStatus.ts` — the closed 8-value `BUSINESS_STATUSES` set plus a structural `PERMITTED_TRANSITIONS` table expressing exactly §6's governed edges (draft→pending_verification→trial→active, active⇄suspended, trial/active→expired, any-non-terminal→closed, closed→archived), mirroring `identityStatus.ts`'s own precedent. `pending_verification`→`trial`'s verification mechanism, the owner-self-suspend variant, ownership transfer, and `expired` re-activation are **not** implemented — only the structural edges that already exist in the table (or, for self-suspend/transfer, deliberately absent — see §12/§13 below).

## 8. Branch contract

`businessBranch.ts` — the Founder-approved MVP shape exactly (§24 FD-1): `id`, `businessId`, `displayName`, `countryCode`, `city`, `address?`, `createdAt`, `updatedAt`, `schemaVersion`. Tests explicitly assert `isPrimary`/`status`/`timezone`/`branchCode` are **not** present on the returned shape (`businessBranch.test.ts`, three dedicated negative-shape tests).

## 9. `businessCode` Engineering format decision (Phase G)

**Format:** `BIZ` (constant, non-variable prefix) + 6 characters drawn from a 32-symbol alphabet (`ABCDEFGHJKLMNPQRSTUVWXYZ23456789` — 24 letters excluding I/O, 8 digits excluding 0/1). Canonical stored form: uppercase, unformatted, no hyphen (`BIZABCDEF`, 9 characters). Display form: `BIZ-ABCDEF` (hyphen inserted only for display, mirroring `loyaltyNumber.ts`'s own canonical-vs-display split).

**Reasoning:** reuses the Loyalty Number's *ambiguity-avoidance principle* (exclude I/O/0/1) without copying its *shape* — Loyalty Number is a segmented `AAA999` (3 letters then 3 digits); Business Code is a flat 32-symbol draw behind a constant prefix, making the two formats structurally disjoint by construction (no valid Loyalty Number can ever match `^BIZ[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$` and vice versa — verified by a dedicated test). The `BIZ` prefix encodes no country/category/date/owner/sequence information (FD-3's explicit prohibition) — it is identical on every code.

## 10. `businessCode` namespace analysis (Phase S)

- Alphabet size: 32. Random-segment length: 6. Total combinations: 32⁶ = **1,073,741,824** (≈1.07 billion).
- Reference comparison: the Loyalty Number's own space is 24³ × 8³ = 13,824 × 512 = 7,077,888 (≈7.08M) — Business Code's space is **≈152× larger**.
- Collision-rate calculation, using the same reference population `DEC-DATA-007`'s own issuance-service comment used (1,000,000 records, for direct comparability, not because that many businesses are actually expected): single-draw collision probability `p ≈ n/M = 1,000,000 / 1,073,741,824 ≈ 0.000931` (0.093%). Five consecutive collisions (the chosen `MAX_BUSINESS_CODE_GENERATION_ATTEMPTS`, mirroring `DEC-DATA-007`'s own "small maximum-retry count" principle): `p⁵ ≈ 7.4×10⁻¹⁶` — many orders of magnitude below the Loyalty Number's own already-negligible bound (≈1.7×10⁻⁷ at the same reference population, per `loyaltyNumberIssuanceService.ts`'s own comment). Not over-engineered for impossible global scale — 6 characters keeps the code short and human-readable; the actual expected business population is far smaller than the 1M reference figure used only for a direct, conservative comparison.

## 11. `businessCode` validator/generator contract

`businessCode.ts`: `createBusinessCode(raw)` (validates + canonicalizes, case-insensitive input, accepts both hyphenated and unhyphenated input), `isWellFormedBusinessCode(value)` (non-throwing predicate), `formatBusinessCodeForDisplay(code)`. `services/businessCodeGenerator.ts`: `BusinessCodeCandidateGenerator` port interface (candidates only, no uniqueness concept). `services/randomBusinessCodeCandidateGenerator.ts`: concrete `crypto.randomInt`-backed implementation — pure, no Firestore, no uniqueness check. `MAX_BUSINESS_CODE_GENERATION_ATTEMPTS = 5` is defined as a **policy constant only**; the retry-loop execution itself is `002B`'s (Phase G's explicit boundary, followed literally rather than copying the Loyalty Number precedent's own `002A`-equivalent package, which *did* include the issuance loop — this task's text explicitly assigns that execution to `002B` instead).

## 12. `businessCode` security boundary

Mechanically verified: no file in this diff treats `businessCode` as an authentication credential, authorization token, customer identifier, Loyalty Number, public URL slug, QR identity, or commerce key. No authorization code anywhere consumes `businessCode` as authority — it participates in exactly one place outside its own model file (`business.ts`'s `createBusiness`, where it is stored as a plain reference field) and one contract file (`businessBootstrap.ts`, where `BootstrapContext.businessCode` is documented as server-reserved, never client-supplied).

## 13. Owner contract

`business.ts`'s `ownerUserId: readonly string` field — one current owner per business, taken as an already-resolved value (mirrors `CustomerIdentityId`'s own "this module validates shape, not generation/resolution" precedent). No Customer Identity code was created. No ownership-transfer contract exists anywhere in this diff — explicitly deferred (§9/§24 item 2 of the design).

## 14. Owner-membership handoff

**Not implemented in `002A`** — re-verified against the design: §15's Owner-membership handoff contract is a *persistence-transaction* concern (`002B` creates the membership atomically alongside the business, §13.1), not a domain-contract-layer concern. `002A` does not duplicate or redefine `businessMembershipDocument.ts`'s existing TRD10 §10.6.4 shape (owned by `ENG-P2-004D`, frozen) — `002B` will reuse it directly when it writes the initial Owner membership. No `ENG-P2-004` `Role` type is duplicated anywhere in this diff.

## 15. Bootstrap request/result contracts

`businessBootstrap.ts`: `CreateBusinessRequest` (client-supplied registration fields, PRD3 §6 — **no `ownerUserId` key exists in this type**, a compile-time guarantee verified by a `@ts-expect-error` test, not just a runtime check), `BootstrapContext` (everything `002B` must derive server-side: `ownerUserId`, `businessId`, `branchId`, `businessCode`, `now` — documented as never client-supplied), `buildBootstrapBusinessInput(request, context)` (pure construction of a valid `Business`+`BusinessBranch` pair, branch defaulting `displayName`/`countryCode`/`city` from the business per §5.3), `CreateBusinessResult`/`toCreateBusinessResult`. A dedicated test (`businessBootstrap.test.ts`, "ownerUserId can only come from context") proves a smuggled `ownerUserId` on the request object is never read.

## 16. Validation behavior

Fail-closed for: blank/malformed `id`, `businessCode` (regex-validated), `ownerUserId`, `displayName`, `primaryCategoryId`, `city`, `contactPhone` (non-blank); `countryCode` (ISO 3166-1 alpha-2 shape, TRD10 §10.5 Required Standard); `currencyCode` (ISO 4217 shape, same standard); `supportedLanguages` (non-empty array, no blank entries); branch `countryCode`/`city`/`displayName`/`businessId`/`id`. Not over-validated: `timezone` (non-empty only — no IANA-format regex invented, since TRD10 does not literally specify one), `contactPhone` (non-empty only, no E.164 regex invented), `address`/`legalName`/etc. (optional, no extra format rule invented).

## 17. Error-taxonomy treatment

`businessErrors.ts` maps every condition onto the existing closed 14-category taxonomy exactly per design §18 (`VALIDATION_FAILED`, `INVALID_STATE_TRANSITION`, `IDEMPOTENCY_CONFLICT`, `TEMPORARY_UNAVAILABLE`, `AUTH_REQUIRED`). No new category introduced. No network/transport error type exists in this diff.

## 18. Firebase/framework independence

Verified twice: (a) `grep` across every non-test file in `functions/src/domains/business/` for any `^import` line mentioning `firebase` — zero matches; (b) a new `eslint.config.js` block scoping `functions/src/domains/business/**/*.ts` under the same `no-restricted-imports` rule the Identity/Loyalty Number/QR Identity/Authentication/Permissions/Trust domain-foundation blocks already use, with no `ignores` (nothing here needs Firebase yet — a future `002B` persistence task should add its own `ignores` entry when it adds a `repositories/` folder, not before).

## 19. `002B` leakage audit (Phase O)

Mechanically grepped the full diff for: `runTransaction`, `.set(`, `.update(`, `.create(`, `firebase-admin`, `firebase-functions`, `onCall`, `writeOutboxEntry`, `checkAndReserveIdempotencyKey`, `isAlreadyAssigned` — zero matches (one incidental doc-comment mention of "firebase-admin" in prose, not an import). No `createBusiness` *service*/callable exists — only the pure `createBusiness` *constructor* function, which is Phase D/domain-contract territory per the design, not a command handler.

## 20. `002C` leakage audit (Phase P)

Grepped for: lifecycle command execution, profile-update service, branch-update service, verification service, owner self-suspension, transfer-ownership — zero matches. Only the structural `transitionBusinessStatus` function exists (pure state-table application, no authority/precondition logic, no persistence).

## 21. `ENG-P2-003`/staff leakage audit (Phase Q)

Grepped for: invite tokens, staff invitation, membership acceptance, staff removal/suspension, shared-device authentication, permission-management UI — zero matches.

## 22. RED→GREEN evidence

Every file's test was written first and run to confirm failure before the implementation file existed (`Cannot find module` errors, one per file — 9 RED confirmations total, one per test file: `businessStatus`, `businessErrors`, `businessCode`, `randomBusinessCodeCandidateGenerator`, `businessBranch`, `businessBranchDocument`, `business`, `businessDocument`, `businessBootstrap`), then GREEN immediately after the corresponding implementation.

## 23. Tests added

81 new tests across 9 test files (see §6 file list). Coverage highlights: every required Business field individually enforced; all 8 statuses accepted by the reader; every governed transition allowed, every ungoverned one rejected (including the explicit `pending_verification`→`trial`/`suspended`→`expired`/`expired`→`active` non-cases); the exact branch shape asserted with dedicated negative tests for `isPrimary`/`status`/`timezone`/`branchCode`; `businessCode` format/canonicalization/rejection (including a dedicated "rejects the exact Loyalty Number shape" test); the generator's structural well-formedness across 200 draws and a genuine-variety check across 50; the bootstrap contract's structural (compile-time) and runtime `ownerUserId`-injection resistance.

## 24. Full validation

- Focused `002A` tests: 9 files, **81/81** passed.
- Full `functions` unit suite: **1024/1024** passed (943 pre-existing + 81 new).
- Firebase Emulator Suite validation (`emulators:validate`): **339/339** passed, unchanged from pre-task baseline (002A adds no emulator tests — pure domain layer).
- Web unit suite: **397/397** passed, unaffected.
- `tsc --noEmit` (functions): clean.
- Full monorepo build (`pnpm -r run build`): clean (functions + web).
- Full repo lint (`eslint .`): clean.
- Full repo format check (`prettier --check .`): clean (after one `prettier --write` pass on the new files/config, all content unchanged, whitespace only).
- Secret scan: clean (one false-positive prose match, "businessCode is not a secret").

## 25. Files modified

- **Added (19 files):** `functions/src/domains/business/models/{business,businessStatus,businessErrors,businessCode,businessBranch,businessBranchDocument,businessDocument,businessBootstrap}.ts` + matching `.test.ts` (8 pairs = 16 files); `functions/src/domains/business/services/{businessCodeGenerator,randomBusinessCodeCandidateGenerator}.ts` + `randomBusinessCodeCandidateGenerator.test.ts` (3 files).
- **Modified (1 file):** `eslint.config.js` — one new domain-boundary block, no existing block changed.
- **No other file touched.**

## 26. Code diff summary

961 lines of implementation code, 774 lines of test code, 36 lines of ESLint configuration. Zero lines changed in any existing file besides the ESLint addition.

## 27. Dependencies added

None. `node:crypto` (Node built-in, already used by `loyaltyNumber`'s own generator) is the only import beyond this package's own files and `vitest`/shared error types.

## 28. Config changes

One `eslint.config.js` block (§18/§25 above). No `package.json`, `tsconfig.json`, or `vitest.config.ts` change.

## 29. Firebase/Rules changes

**None.**

## 30. Deployment changes

**None.**

## 31. Review findings/dispositions

Independent self-review (no automated Codex reviewer configured on this repository, disclosed) conducted before PR creation: re-read every file against the design's §20/§24 text a second time; re-ran the full leakage greps; confirmed the `eslint.config.js` addition follows the established per-domain block convention exactly (comment style, `ignores` reasoning, rule shape). No finding required a fix.

## 32. Remaining material findings

None.

## Acceptance boundary (design §20, `002A`)

"Contracts exist, are versioned, independently reviewable; no live business can yet be created." — satisfied: every type/function in this diff is pure, synchronous or trivially async-free, and no Firestore write path exists anywhere in `functions/src/domains/business/`.
