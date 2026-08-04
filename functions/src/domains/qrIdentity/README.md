# QR Identity Domain

Owns the QR Identifier concern per `DEC-DATA-007`'s QR Generation
Principles and `ENG-P2-ARCH-001` §5 — the plain opaque reference a
customer's QR code encodes, associated with an existing Customer
Identity and Loyalty Number. References `CustomerIdentityId` (from
`identity`) and `LoyaltyNumber` (from `loyaltyNumber`) by value only;
never modifies either.

## Current scope: `ENG-P2-001-04` — QR Identity Service Foundation

Domain-foundation layer only. **No QR-image rendering, no camera
scanning, no UI, no API routes, no Firestore persistence, no merchant
lookup, no registration orchestration, no Authentication, no ITM, no
Reward logic.** The domain layer is framework-independent — no Firebase
SDK import is permitted here (machine-enforced by the repo-root
`eslint.config.js` `no-restricted-imports` rule scoped to this
directory), and no QR-image-rendering library is a dependency of this
module (confirmed by an empty diff on every package manifest).

## Approved QR payload contract

Per `DEC-DATA-007`'s Final Decision and Decision Package §8 (Sub-choice
A resolved to Option A1): the QR encodes **only a plain opaque
reference** to the loyalty code — never the loyalty number itself
directly, never a signed/versioned token (that option was considered
and explicitly rejected), and never personal data.

## `models/`

- `qrReference.ts` — the `QrReference` value object: an opaque,
  safe-charset token. No exact length/entropy policy is mandated by any
  governing document (deliberately opaque) — only genuinely malformed
  input is rejected.
- `qrPayload.ts` — the `QrPayload` value object: a single-field wrapper
  around `QrReference`, structurally incapable of carrying name, phone,
  email, trust state, authentication data, reward balance, or purchase
  history.
- `qrIdentityErrors.ts` — domain-local errors (`QrIdentityDomainError`),
  same structural pattern as `IdentityDomainError`/`LoyaltyNumberDomainError`.

## `services/`

- `qrReferenceGenerator.ts` — `QrReferenceGenerator`, a provider-neutral
  generation port. No concrete implementation here.
- `qrIdentityAssociationService.ts` — three pure functions matching
  `ENG-P2-ARCH-001` §5's named lifecycle phases exactly:
  - `issueQrIdentity` — first-time issuance (Generation phase).
  - `regenerateQrIdentity` — produces a new active association and
    invalidates the prior one (Regeneration/Invalidation phases). See
    this file's own doc comment for the textual reconciliation between
    `ENG-P2-ARCH-001` §5's "relationship unchanged" wording and
    `ENG-P2-001-PLAN-001`'s explicit "new resolvable reference / prior
    reference fails to resolve" requirement.
  - `restoreQrIdentityForRecovery` — trivial passthrough proving
    recovery restores the existing association unchanged, never creates
    a new QR or identity (Recovery phase).

Two lifecycle statuses only: `active` | `invalidated`. No separate
`retired` status — `ENG-P2-ARCH-001` §3 says QR fields are "retained,
not deleted" on identity closure, without naming a distinct QR-domain
retired state; retention-without-reuse is satisfied structurally (no
operation ever frees a `qrReference` for reuse), not by a third status.

## `events/`

- `qrIdentityEvents.ts` — `QrIdentityIssued`, `QrIdentityInvalidated`,
  `QrIdentityRegenerated`. Plain domain objects only — no transport,
  persistence, queue, or Cloud Function wiring.

## Deferred to future packages

QR image rendering (SVG/PNG generation), camera scanning, scan UI,
Firestore persistence, distributed uniqueness, merchant search, online
lookup endpoint, offline verification, rate limiting, rotation
administration (as distinct from customer-initiated regeneration, which
is in scope here), migration, analytics, recovery orchestration — see
`docs/05-implementation/roadmap/ENG-P2-001-PLAN-001-customer-identity-decomposition-plan.md`
and `docs/00-governance/decisions/decision-register.md` (`DEC-DATA-007`).
