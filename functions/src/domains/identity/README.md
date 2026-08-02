# Identity Domain

Owns the Customer Identity concern separated under `DEC-IDENTITY-001` — the
permanent Internal Customer ID, identity lifecycle/status, authentication
references (pointers only), and trust references (pointers only). Does not
own Authentication provider implementation or Identity Trust Management
(ITM) — see `docs/05-implementation/roadmap/ENG-P2-ARCH-001-customer-identity-architecture.md`
for the full architecture and the Authentication/ITM interface boundaries.

## Current scope: `ENG-P2-001-01` — Identity Domain Foundation

Domain-foundation layer only. **No persistence, no API, no UI, no
authentication-provider implementation, no ITM implementation.** The
domain layer is framework-independent — no Firebase SDK import is
permitted here (machine-enforced by the repo-root `eslint.config.js`
`no-restricted-imports` rule scoped to this directory).

## `models/`

- `customerIdentityId.ts` — the permanent, immutable Internal Customer ID.
- `identityStatus.ts` — the Identity Lifecycle status model and its
  transition table (`registered → active → dormant/suspended/locked/closed → archived`).
  `recovered` is deliberately not a persistent status — see
  `docs/05-implementation/roadmap/ENG-P2-GATE-001-dec-prod-012-scope-determination.md`
  §8 for the classification.
- `authenticationReference.ts` — the identity-side pointer to a linked
  Authentication credential (provider-independent id/type only — never a
  token, OTP detail, or OAuth credential).
- `trustReference.ts` — the identity-side pointer to the ITM trust record
  (an opaque id only — never verification state or trust level).
- `customerIdentity.ts` — the `CustomerIdentity` aggregate root:
  registration, status transitions, authentication-reference
  linking/unlinking, and trust-reference assignment.
- `identityErrors.ts` — domain-local errors (`IdentityDomainError`),
  structurally compatible with the shared `DomainCommandError`
  (`functions/src/shared/commands/commandDispatcher.ts`) but defined
  independently to avoid that file's transitive Firebase dependency.

## `events/`

- `identityEvents.ts` — the 9 domain events this scope defines, built on
  the existing shared `DomainEvent<T>`/`buildEventType` contract
  (`functions/src/shared/events/*`). No event transport, persistence, or
  Cloud Function wiring — events remain plain domain objects.

## Deferred to future child work packages

Per `docs/05-implementation/roadmap/ENG-P2-001-PLAN-001-customer-identity-decomposition-plan.md`:

- `models/repositories/` (Firestore persistence, Rules) — `ENG-P2-001-05`.
- Customer Profile — `ENG-P2-001-02`.
- Loyalty Number / QR generation — `ENG-P2-001-03`/`-04`.
- Lifecycle/status orchestration at the service level, recovery, linking
  workflows, lookup interfaces, audit sink — `ENG-P2-001-06` through `-10`.
