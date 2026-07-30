> **Title:** DEC-ID-003 Decision Package — Permission Inheritance Semantics
> **Version:** 1.0 · **Status:** Prepared for Founder consideration — NOT recorded, NOT approved
> **Task:** `RES-004` (Capability 2 Resolution Sprint, `ENG-P2-RES-000`)
> **Source-of-truth path:** `docs/00-governance/decisions/evidence/DEC-ID-003-decision-package-2026-07-30.md`
> **Prepared:** 2026-07-30

---

## 1. Executive Summary

This package prepares — it does **not** record or approve — `DEC-ID-003` ("Permission inheritance semantics"), using the now-`CONFIRMED` `DEC-PROV-004` and `DEC-SEC-001` as mandatory, non-revisited inputs. It defines the problem, states the current (empty) repository position, evaluates the Register's own three candidate options plus the original audit's recommendation, and recommends Option (a) — inheritance as default template, explicit override, sensitive permissions never implicit. `DEC-ID-003` remains a **Founder decision** per the Register's own `Founder decision required: Yes` field; this package prepares that decision, consistent with the same "prepare, don't record" discipline `RES-001`–`RES-003` applied. **Decision readiness: Ready with Conditions** — see §8.

## 2. How the Confirmed Constitutional Decisions Constrain This Package

*(Required pre-edit analysis, reproduced here for the permanent record.)*

**Already decided — not revisited by this package:**
- **Identity uniqueness.** AIR-001 ("one Firebase Authentication UID shall map to one active platform user") and `DEC-PROV-004`'s canonical-phone-identity principle mean `DEC-ID-003` operates on one already-resolved platform user. PRD1 §3.1 ("one person, one platform identity... may hold multiple role contexts") is pre-existing and unaffected — this package does not redesign identity resolution, only permission resolution within and across a user's role contexts.
- **Identity authority is exclusively platform-owned.** `DEC-SEC-001`'s Merchant Assistance principle draws a hard line between *identity verification* (never delegable, platform-only) and *permission delegation* (this decision's actual subject). Any inheritance/override model this package proposes delegates operational business permissions only — never identity-verification authority.
- **Trust-level gating and role-based gating are separate axes.** `DEC-SEC-001`'s Progressive Trust Model (Anonymous/Authenticated/Verified) gates customer-facing identity-protected actions; `DEC-ID-003` gates business-role actions (Owner/Manager/Staff). Both compose in one eventual authorization check, but this package addresses only the role-based axis.

**Genuinely still open, and this package's actual subject:** reconciling PRD10 §13's role-inheritance statement with PRD1 AP-008's explicit-grant requirement into one permission-resolution algorithm — the conflict the original documentation audit (`DOC-P1-007`) identified and `DEC-ID-003` exists to close.

## 3. Problem Statement

`DEC-ID-003` exists to answer: **when a business user holds a role (Owner, Manager, or Staff), which permissions does that role grant automatically by inheritance, and which must be explicitly configured per membership — and how do these two mechanisms combine into one deterministic algorithm a shared authorization service can evaluate?**

Two currently-approved product documents give different answers:
- **PRD10 §13 ("Role Inheritance"):** *"Permissions should inherit logically... Business Owner inherits all Manager permissions... Manager inherits all Staff permissions... Staff does not inherit Manager permissions. This minimises duplication and simplifies maintenance."* — a blanket-inheritance model.
- **PRD1 AP-008 ("Role Names Do Not Automatically Grant Unlimited Power"):** *"The platform shall use role-based permissions, but sensitive permissions must be explicitly defined. For example, a manager may be allowed to view reports but not manage staff."* — an explicit-grant model, with PRD1 §7 additionally requiring manager permissions to be configurable per membership.

Read literally and independently, these give an implementer two different algorithms, exactly as the original audit finding `DOC-P1-007` identified. Note the modal-verb asymmetry: PRD10 §13 uses "should" (a default, softer normative), while PRD1 AP-008 uses "shall"/"must" (a binding constraint) — this is itself evidence toward a reconciliation rather than a true contradiction (§5).

**Why it matters now:** per the Engineering Implementation Programme and `CDR-001`, `DEC-ID-003` is one of two remaining open D1 decisions (alongside `DEC-DATA-007`) blocking `ENG-P2-001`/`ENG-P2-004` and Phase 2 entry. Its own Register entry states it also blocks the documentation freeze itself ("PRD internal conflict").

## 4. Current Repository Position

A repository-wide search (`grep -rln "permission\|Permission\|authoriz" apps/web/src functions/src`) found no permission-resolution or role-inheritance implementation anywhere — every match was incidental (HTTP `Authorization`-header sanitization, generic error-category names, task-authorization comments). **No code exists yet for this decision to conflict with or constrain.** This is a pure design/product decision, not a code migration.

What *does* already exist and bears directly on the resolution:
- **TRD12 §12.11 ("Permission Resolution")** already lists the inputs a permission decision must derive from: active platform user, active business, active business membership, assigned role, **assigned custom permission set**, business status, subscription constraints, action-specific domain rules. The presence of "assigned custom permission set" alongside "assigned role" in this already-approved list is architectural evidence that a role-plus-override model (not pure inheritance, not pure explicit-grants-only) is what the rest of the TRD already assumes.
- **TRD12 §12.12 ("Permission Evaluation Contract")** already specifies an `AuthorizationDecision` type carrying a `permissionSource` field — a data point that only makes sense if a permission's origin (inherited-by-role vs. custom-granted) needs to be distinguishable at evaluation time, which is exactly what Option (a) below requires and Options (b)/(c) do not.
- **PRD1 AP-007** ("All Sensitive Actions Are Audited") requires role assignment and permission changes to be recorded in the audit trail — relevant to whatever "sensitive permissions never implicit" enforcement mechanism is eventually designed (§6).

## 5. Engineering Options

Only the Register's own three candidate options are presented, plus the original audit's own recommendation (which the Register's Option (a) already restates) — no new option is invented.

### Option (a) — Inheritance as default template, explicit override, sensitive permissions never implicit *(Register's own recommended direction; matches `DOC-P1-007`'s original audit recommendation)*

- **Mechanism:** a role (Owner/Manager/Staff) grants a *default* permission template via inheritance (satisfying PRD10 §13's "should"); explicit per-membership grants or revocations can override that default in either direction; a defined set of sensitive permissions (e.g., staff management, financial configuration) can never be granted by inheritance alone — they require an explicit grant regardless of role (satisfying PRD1 AP-008's "must").
- **Fit with existing architecture:** directly matches TRD12 §12.11's "assigned role" + "assigned custom permission set" input pair, and §12.12's `permissionSource` field (which would resolve to `"role-default"` or `"explicit-grant"`).
- **Open design gap:** the "sensitive permissions" set itself is not yet enumerated anywhere in the repository — this package does not design that list (§6, Implementation Prerequisite 1).

### Option (b) — Strict inheritance, no override

- **Mechanism:** Owner unconditionally inherits all Manager permissions; Manager unconditionally inherits all Staff permissions; no per-membership customization exists.
- **Fit with existing architecture:** directly contradicts TRD12 §12.11's "assigned custom permission set" input and PRD1 §7's explicit requirement that manager permissions be configurable — would require either changing TRD12 or treating that input as always-empty, effectively deleting an already-approved capability.
- **Fit with PRD1 AP-008:** does not satisfy it — AP-008 explicitly requires that role names not automatically grant unlimited power, and strict inheritance is precisely "the role name grants everything beneath it automatically."

### Option (c) — No inheritance, explicit grants only

- **Mechanism:** every permission for every membership must be explicitly granted; role names carry no default permission set at all.
- **Fit with existing architecture:** satisfies PRD1 AP-008 fully but contradicts PRD10 §13's inheritance statement entirely, and does not "minimise duplication and simplify maintenance" as PRD10 §13 requires — every new business membership would need every permission configured from scratch, including baseline permissions no one has ever disputed (e.g., a Manager viewing their own business's reports).

## 6. Trade-off Analysis

| Criterion | Option (a) — Default + override | Option (b) — Strict inheritance | Option (c) — Explicit only |
|---|---|---|---|
| Reconciles both PRD texts | Yes — inheritance satisfies §13's "should," override satisfies AP-008's "must" | No — ignores AP-008 entirely | No — ignores §13 entirely |
| Fit with TRD12 §12.11/§12.12 (already approved) | Direct match (both inputs used; `permissionSource` meaningful) | Contradicts §12.11's custom-permission-set input | Technically compatible, but §12.11's "assigned role" input becomes vestigial |
| Onboarding friction (new membership setup) | Low — sensible defaults via role, override only when needed | Lowest — nothing to configure | Highest — every permission configured manually every time |
| Risk of over-permissioning | Low — sensitive permissions carved out explicitly | Highest — a Manager automatically gets every Staff permission plus manager defaults, no override to narrow it | None — nothing is granted unless explicit |
| Engineering complexity | Moderate — needs a defined sensitive-permission set and an override-resolution rule | Lowest — pure lookup table | Moderate-to-high — no defaults means every business-onboarding flow must set every permission explicitly |
| Audit clarity (PRD1 AP-007) | High — `permissionSource` distinguishes role-default from explicit-grant in the audit trail | Low — no way to distinguish "inherited" from "should have been restricted" | High, but at the cost of onboarding friction above |

**Reading the table:** Option (a) is the only option that satisfies both source PRD texts simultaneously and requires no change to already-approved TRD12 architecture. Options (b) and (c) each resolve the conflict by silently discarding one of the two authoritative PRD sections — neither is a reconciliation, both are a unilateral pick, which is precisely what the Register's own "Founder decision required: Yes" field signals should not be done by engineering alone.

## 7. Recommended Engineering Direction

**Recommended option: (a) — inheritance as default template, explicit per-membership override, sensitive permissions never implicit.**

**Support from evidence:** this is not merely the Register's own stated recommendation — it is the same reconciliation the original documentation audit (`DOC-P1-007`) proposed before the Register entry was ever created, independently arrived at by a source-text read of both PRD1 and PRD10. It requires no change to TRD12 §12.11/§12.12, both of which already assume a role-plus-override permission model. Options (b) and (c) each require either contradicting an already-approved TRD chapter or discarding one of the two conflicting PRD sections outright, which this task's own constraints (do not revisit `DEC-PROV-004`/`DEC-SEC-001`, do not introduce new governance) counsel against extending to PRD1/PRD10 either.

## 8. Implementation Prerequisites

None of these are performed by this package (constraint: no implementation code) — they are the concrete items `ENG-P2-004` (role context and permission resolution) would need once `DEC-ID-003` is recorded:

1. **A defined, enumerated "sensitive permissions" set** — not designed by this package. TRD12 §12.11 does not currently enumerate which permissions qualify as sensitive; PRD1 AP-008's own example ("manage staff") is illustrative, not exhaustive.
2. **An override-resolution rule for conflicting explicit grants and revocations** — e.g., does an explicit revocation always beat an explicit grant at the same membership, or is the more specific/most-recent one authoritative? Not specified by PRD1, PRD10, or TRD12 today.
3. **Cross-business role-context isolation** — PRD1 §3.1 already allows one platform user to hold multiple role contexts (e.g., Staff at Business A, Owner at Business B); TRD12 §12.11 already lists "active business"/"active business membership" as resolution inputs, but the actual isolation guarantee (a permission decision for Business A must never leak into a decision for Business B) is not yet implemented anywhere.

## 9. Operational Conditions

- **Document corrections required (per the Register's own field):** PRD1 and PRD10 both need a clarifying cross-reference once `DEC-ID-003` is recorded, so neither document continues to read as a standalone, complete algorithm — this is a Document Corrections action, not an engineering prerequisite, and is not performed by this package.
- **No production-readiness gate is introduced by this package** — unlike `DEC-PROV-004`/`DEC-SEC-001`, `DEC-ID-003` has no external evidence gap (no `EXT-*` dependency); its own Register entry shows `Dependencies: —`. Nothing here is deferred to a later verification step.

## 10. Decision Readiness

**Ready with Conditions.** The evidence in §3–§7 is sufficient for Founder review and a decision on Option (a) — it directly reconciles both source PRD texts, requires no change to already-approved TRD architecture, and matches the original audit's own independent recommendation. What is **not** ready: the sensitive-permissions enumeration and the override-resolution rule (§8, items 1–2) are genuine, undesigned engineering follow-on items — disclosed here, not resolved, consistent with how `DEC-PROV-004`/`DEC-SEC-001` each disclosed their own undesigned prerequisites rather than treating them as solved. Neither gap blocks a Founder decision on the reconciliation *principle* itself.

## 11. Files Created or Modified

**Created:** `docs/00-governance/decisions/evidence/DEC-ID-003-decision-package-2026-07-30.md` (this document). **Modified:** `docs/changes/IMPLEMENTATION_CHANGES.md` (append). **Not modified:** the Decision Register; `DEC-PROV-004`'s or `DEC-SEC-001`'s decision packages or Register entries; PRD1; PRD10; TRD12; any application code; any other document.

## 12. Commands Executed

Live re-read of `DEC-ID-003`, `DEC-PROV-004`, and `DEC-SEC-001`'s current Decision Register entries; re-read of the Resolution Plan's `RES-004` scope; re-read of TRD12 §12.11–12.12; re-read of PRD1 §2–3 (AP-007, AP-008, §3.1) and PRD10 §13; re-read of AIR-001 (TRD12 §12.6); re-read of the original audit finding `DOC-P1-007` (`11thONUS_DOCUMENTATION_AUDIT_FINDINGS_REGISTER_2026-07-16.md`); repository-wide `grep -rln` search confirming zero permission-resolution/role-inheritance implementation code exists.

## 13. Dependencies Added

None.

## 14. Configuration Changes

None.

## 15. Rollback Instructions

`git revert` of this task's own commit — a single new decision-package document plus one changes-log append.

## 16. Markdown Decision Package

This document: [`docs/00-governance/decisions/evidence/DEC-ID-003-decision-package-2026-07-30.md`](DEC-ID-003-decision-package-2026-07-30.md).

## 17. Changes Log

Updated: [`docs/changes/IMPLEMENTATION_CHANGES.md`](../../../changes/IMPLEMENTATION_CHANGES.md).
