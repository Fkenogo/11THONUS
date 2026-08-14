# Permissions Domain

Owns the role-context and permission-resolution concern per `DEC-ID-003`
(CONFIRMED) and its implementation-level design,
[`ENG-P2-004-DESIGN-001`](../../../../../docs/05-implementation/roadmap/ENG-P2-004-DESIGN-001-role-context-permission-resolution-architecture.md)
(Approved v1.1 — Founder dispositions AD-1–AD-5 recorded). References the
Identity domain's platform user id and the (not-yet-implemented)
`businessMemberships` schema (TRD10 §10.6.4) by value only; does not modify
either.

## Current scope: `ENG-P2-004A` — Permission Contracts & Sensitive Permission Catalogue

Domain-foundation/contract layer only. **No runtime permission evaluation,
no `AuthorizationDecision` logic, no allow/deny decision table, no
evaluator caching, no sensitive-decision audit/outbox emission, no
protected-command integration or authorization middleware, no Capability-3
functionality, no ITM, no dual control.** The domain layer is
framework-independent — no Firebase SDK import is permitted here
(machine-enforced by the repo-root `eslint.config.js`
`no-restricted-imports` rule scoped to this directory).

## `models/`

- `role.ts` — the `Role` type (`"owner" | "manager" | "staff"`), exactly
  TRD10 §10.6.4's existing `businessMemberships.role` literal union,
  reused rather than redefined.
- `permissionId.ts` — `PermissionId`, a validated dot-namespaced
  identifier shape (`"domain.action"`). Deliberately not a closed
  universal enum — no governed document mints identifiers for the
  non-sensitive baseline permission space (design §3.2); only the
  Sensitive Permission Catalogue's eight entries are governed precisely.
- `sensitivePermissionCatalogue.ts` — the closed, eight-entry Sensitive
  Permission Catalogue, a direct typed transcription of
  `ENG-P2-004-DESIGN-001` §3.2. Provides `isSensitivePermission`,
  `getSensitivePermissionEntry`, `getInheritableSensitivePermissionEntries`.
- `roleTemplate.ts` — the `RoleTemplate` contract (role → default
  permissions), enforcing the structural invariant that a sensitive,
  non-inheritable permission may never appear in any role's defaults
  (`DEC-ID-003`). `DEFAULT_ROLE_TEMPLATES` is derived entirely from the
  catalogue's own `inheritAllowed` metadata — the only role-default
  content the approved design specifies precisely — not a reproduction of
  PRD1 §7–§8's full non-sensitive baseline lists.
- `permissionOverride.ts` — the explicit grant/revocation contract
  (`PermissionOverride`), business/membership-scoped, refusing any
  override that targets an Owner membership (design §3.6, §8). Input
  representation only — no override-resolution precedence.
- `permissionErrors.ts` — domain-local errors (`PermissionDomainError`),
  structurally compatible with the shared `DomainCommandError` but defined
  independently to avoid its transitive Firebase dependency (same pattern
  as the identity domain's `IdentityDomainError`). Every category is one
  of the closed 14 (TRD11 §11.35); no new category
  (`ENG-P2-004-DESIGN-001` §17 AD-4).

## Deferred to future packages

Permission evaluation and the deterministic override-resolution algorithm
(`ENG-P2-004B`), sensitive-decision audit/outbox integration (`ENG-P2-004C`),
authorization-boundary integration and closure (`ENG-P2-004D`), and
`businessMemberships` creation/mutation (`ENG-P2-002`/`ENG-P2-003`,
Capability 3) — see
[`ENG-P2-004-DESIGN-001`](../../../../../docs/05-implementation/roadmap/ENG-P2-004-DESIGN-001-role-context-permission-resolution-architecture.md)
§14 and the [Decision Register](../../../../../docs/00-governance/decisions/decision-register.md)
`DEC-ID-003`.
