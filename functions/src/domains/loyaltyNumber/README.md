# Loyalty Number Domain

Owns the Loyalty Number concern per `DEC-DATA-007` — the permanent,
public, customer-facing loyalty identifier associated with an existing
Customer Identity. References the Identity domain's `CustomerIdentityId`
by value only; never modifies it, and does not own or import Identity's
aggregate, status, or lifecycle logic.

## Current scope: `ENG-P2-001-03` — Loyalty Number Service Foundation

Domain-foundation layer only. **No Firestore persistence, no unique
indexing, no transactions, no distributed collision handling, no
registration orchestration, no QR payload generation/rendering, no
merchant-facing lookup, no customer-facing display, no migration, no
exceptional replacement, no administrative override, no recovery
orchestration.** The domain layer is framework-independent — no Firebase
SDK import is permitted here (machine-enforced by the repo-root
`eslint.config.js` `no-restricted-imports` rule scoped to this
directory).

## `models/`

- `loyaltyNumber.ts` — the `LoyaltyNumber` value object. Confirmed
  baseline format only (`ABC-234`; 3 letters excluding `I`/`O`, 3 digits
  excluding `0`/`1`). The deferred checksum-enhanced `ABC-234-X` variant
  is deliberately rejected. Canonical stored form is unformatted
  uppercase; the hyphen separator is presentation-only, applied by
  `formatLoyaltyNumberForDisplay` at render time.
- `loyaltyNumberErrors.ts` — domain-local errors
  (`LoyaltyNumberDomainError`), structurally compatible with the shared
  `DomainCommandError` but defined independently to avoid its transitive
  Firebase dependency (same pattern as the identity domain's
  `IdentityDomainError`).

## `services/`

- `loyaltyNumberGenerator.ts` — `LoyaltyNumberCandidateGenerator`, a
  provider-neutral candidate-generation port. No concrete
  Firebase/`crypto`/browser-backed implementation is provided here —
  callers inject one.
- `loyaltyNumberUniquenessPort.ts` — `LoyaltyNumberUniquenessPort`, the
  interface a future persistence service implements to answer "is this
  candidate already assigned?" No Firestore lookup is implemented here.
- `loyaltyNumberIssuanceService.ts` — `issueLoyaltyNumber`, the pure
  issuance algorithm: idempotent short-circuit on an existing assignment,
  bounded collision-retry (`MAX_ISSUANCE_ATTEMPTS = 5`, see the module's
  own doc comment for the collision-rate rationale), deterministic
  failure on exhaustion. Does not persist anything — the caller is
  responsible for storing the returned assignment.

## `events/`

- `loyaltyNumberEvents.ts` — `LoyaltyNumberIssued`,
  `LoyaltyNumberIssuanceCollisionDetected`, `LoyaltyNumberIssuanceFailed`.
  Plain domain objects only — no transport, persistence, queue, or Cloud
  Function wiring. Event payloads never carry a rejected/colliding
  candidate value, per `DEC-DATA-007`'s non-revealing constraint.
  `LoyaltyNumberIssuanceFailed` is not emitted internally by
  `issueLoyaltyNumber` (which throws a domain error on exhaustion
  instead) — it is provided, tested, and available for a future
  orchestration/outbox layer to construct when it catches that error.

## Deferred to future packages

Firestore persistence and unique indexing, transactions, distributed
collision handling, registration orchestration, QR payload
generation/rendering (`ENG-P2-001-04`), merchant-facing lookup,
customer-facing display, migration/backfill, exceptional replacement,
administrative override, recovery orchestration, and monitoring/
production-rate analysis — see
`docs/05-implementation/roadmap/ENG-P2-001-PLAN-001-customer-identity-decomposition-plan.md`
and `docs/00-governance/decisions/decision-register.md` (`DEC-DATA-007`).
