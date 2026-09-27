# FD-REDEMPTION-AUTHORITY-001 — Founder Direction: Capability 6 Redemption Authority (Authority vs Title)

> **Date:** 2026-09-27 · **Task:** `CAPABILITY-6-REDEMPTION-DECISION-001`
> **Status:** Founder direction recorded; implemented as `DEC-LOY-018` in the Decision Register
> **Classification:** Working (governance record — decision evidence)

## 1. Authority-vs-title principle (Founder)

11thONUS must distinguish **organisational role/title** from **operational permissions/capabilities**.
Owner, Manager, Staff, administrator, supervisor, cashier, branch lead or similar labels must not
unnecessarily become hard-coded proxies for every operational permission.

For redemption specifically:

> Redemption confirmation must ultimately be based on explicit Business authority held by the
> authenticated user, not merely on their organisational title.

The Business must remain able to delegate redemption authority to trusted users without promoting
them to Manager. Reward fulfilment must not become operationally dependent on the physical
availability of the Owner or Manager.

Accountability is preserved: authority is explicitly granted through governed Business
administration; the redeeming person is authenticated; the redemption is attributable to that
individual; shared accounts remain prohibited; Platform Administrators receive no automatic
Business redemption authority.

## 2. Supersession

The prior proposed D-2 position of `Owner + Manager only at initial launch` (assessment-only,
never recorded in the register) is **NOT approved and is NOT recorded**. It is superseded by
the permission-based model below.

## 3. Direction

- **D-1 interaction:** adopt the existing PRD07/TRD model — present Loyalty Number or current QR;
  server-side identity resolution; platform validates the available Reward; Business honours it;
  an authenticated Business user holding redemption-confirmation authority confirms; platform
  redeems atomically and idempotently; customer receives the "This one's on us" / On-Us
  confirmation; cycle progression follows existing authority. No customer confirmation tap, no PIN,
  no one-time code/token, no offline redemption.
- **D-2 authority:** a redemption may be confirmed by an authenticated Business user who holds the
  explicit governed capability to confirm redemption for that Business. Default holders: Owner
  (Owner floor; not ordinary-override revocable) and Manager (revocable and re-grantable) —
  preserved from the PRD01 permissions matrix, not assumed from titles. [Clarified by
  `CAPABILITY-6-REDEMPTION-DECISION-001-CORR-001`: the Owner-floor invariant is unchanged.] Delegation: a
  holder of the existing `staff.assignPermissions` capability (Owner by default; Manager only if
  explicitly granted it) may grant/revoke redemption-confirmation authority on individual
  memberships, including Staff, without any role promotion. Revocation takes effect at the next
  redemption attempt (live server-side resolution; no cached authority). Attribution is always the
  actual confirmer, never the granter. Platform Administrators receive nothing by default.
  Customers cannot grant or exercise it.
- **D-2C shared-device slice:** sequential individual sign-in on a shared device (TRD16 §16.60),
  no shared accounts (DEC-ID-002), live permission re-resolution at confirm time, prominent
  sign-out plus inactivity timeout on the redemption surface, revocation effective immediately.
  The full quick-switch mechanism question stays with `DEC-SEC-003` (OPEN).
- **D-3 reversal:** excluded from initial redemption. `DEC-LOY-004` remains authoritative.
  Initial redemption protects against duplicate, concurrent, replay, wrong-Business,
  wrong-Customer, unauthorised-actor, and already-redeemed cases.
- **Suspension:** `DEC-LOY-011` (commercial suspension: default-redeemable) and PRD06 §5
  (retired programmes: outstanding rewards remain redeemable) are preserved unchanged and are
  orthogonal axes. No new rule is created for paused programmes; that edge stays with
  `DEC-LOY-013(a)`.

## 4. Implementation boundary

This direction records Product Truth and architecture authority only. It does not implement the
redemption command, schema, migration, Trust Event, or permission-catalogue code. The next
implementation package must mint the governed redemption-confirmation permission (distinct module
per the `DEC-LOY-017` precedent; must NOT reuse `reward.override`) and the redemption store from
this authority. Full register entry: `DEC-LOY-018`.
