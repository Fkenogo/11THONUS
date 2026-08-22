/**
 * Sensitive Permission Catalogue (`ENG-P2-004A`).
 *
 * The closed, governed set of "sensitive" permissions defined by
 * `ENG-P2-004-DESIGN-001` §3.2, verbatim — Founder-authorized design,
 * approved v1.1 (`ENG-P2-004-DESIGN-001` §17, AD-1–AD-5). This module does
 * not invent, remove, or reclassify any entry; it is a direct, typed
 * transcription of the design's own catalogue table.
 *
 * A permission qualifies as sensitive only if it satisfies the design's
 * closed test (§3.1): it can (a) change who has authority over a business,
 * (b) expose or alter another identity's protected data, (c) move or
 * misstate financial/reward value, or (d) weaken the platform's own
 * security or audit posture.
 *
 * This module is contract/configuration only — it does not evaluate
 * whether a given actor *holds* a sensitive permission (that is
 * `ENG-P2-004B`'s runtime evaluator) and it does not emit or persist
 * anything (that is `ENG-P2-004C`'s audit integration).
 */

import type { PermissionId } from "./permissionId";
import type { Role } from "./role";
import type { BusinessLifecycleStatus } from "../evaluator/types";
import { unrecognisedSensitivePermissionError } from "./permissionErrors";

/**
 * Whether a permission's default state is Owner-only, or Owner+Manager by
 * default (design §3.2 "Default state" column). This is deliberately not a
 * boolean per role — it names exactly the two default-state shapes the
 * design's catalogue table uses, no more.
 */
export const SENSITIVE_PERMISSION_DEFAULT_STATES = [
  "owner_only",
  "owner_and_manager_default",
] as const;

export type SensitivePermissionDefaultState = (typeof SENSITIVE_PERMISSION_DEFAULT_STATES)[number];

/** Design §3.1's closed sensitivity test — the rationale letter(s) a catalogue entry satisfies. */
export const SENSITIVE_PERMISSION_RATIONALE_CODES = ["a", "b", "c", "d"] as const;

export type SensitivePermissionRationaleCode =
  (typeof SENSITIVE_PERMISSION_RATIONALE_CODES)[number];

export type SensitivePermissionCatalogueEntry = {
  readonly id: PermissionId;
  readonly meaning: string;
  readonly owningDomain: string;
  readonly defaultState: SensitivePermissionDefaultState;
  /** Design §3.2 "Inherit?" column — may this permission ever be granted by role/template default? */
  readonly inheritAllowed: boolean;
  /** Design §3.2 "Explicit grant required?" column. */
  readonly explicitGrantRequired: boolean;
  /**
   * Design §3.2's "Explicit grant required?" column names, in
   * parentheses, exactly which role may receive the grant — e.g. "Yes
   * (for Manager)" for rows 1/2/4/5/6, "Yes for Staff" for rows 7/8 (a
   * different role than their `owner_and_manager_default` state, since
   * Owner/Manager already hold those by default — an explicit grant
   * would only ever be needed to extend them to Staff). `null` when
   * `explicitGrantRequired` is `false` (row 3, no grant path at all).
   * This is not a design invention — it is the literal role qualifier
   * the design's own table already specifies, captured as structured
   * data instead of being collapsed into a bare boolean.
   */
  readonly explicitGrantEligibleRole: Role | null;
  /** Design §3.2 "Explicit revoke supported?" column. */
  readonly explicitRevocationSupported: boolean;
  /** Design §3.2 "Audit req." column — every entry is "Mandatory" per the approved catalogue. */
  readonly auditRequirement: "mandatory";
  readonly rationale: readonly SensitivePermissionRationaleCode[];
  /**
   * `ENG-P2-004-CORR-003` per-permission Sensitive lifecycle-eligibility
   * override (Founder disposition). Mirrors
   * `ordinaryPermissionCatalogue.ts`'s existing `eligibleBusinessStatuses`
   * precedent (`ENG-P2-004-CORR-001`) rather than inventing a new shape.
   *
   * Optional and deliberately absent from every entry except
   * `staff.manage`: absence MUST mean the legacy, unchanged Sensitive
   * eligibility set — `{trial, active}`
   * (`evaluatePermission.ts`'s `LEGACY_OPERATIONAL_SENSITIVE_STATUSES`).
   * This keeps every other Sensitive permission's lifecycle behaviour
   * byte-for-byte identical to before this correction (Phase G
   * backward-compatibility proof).
   */
  readonly eligibleBusinessStatuses?: readonly BusinessLifecycleStatus[];
};

/**
 * The eight catalogue entries, in the design's own table order
 * (`ENG-P2-004-DESIGN-001` §3.2, rows 1–8).
 */
export const SENSITIVE_PERMISSION_CATALOGUE: readonly SensitivePermissionCatalogueEntry[] = [
  {
    id: "staff.manage",
    meaning: "Invite, suspend, remove staff/manager memberships",
    owningDomain: "Business membership",
    defaultState: "owner_only",
    inheritAllowed: false,
    explicitGrantRequired: true,
    explicitGrantEligibleRole: "manager",
    explicitRevocationSupported: true,
    auditRequirement: "mandatory",
    rationale: ["a"],
    // `ENG-P2-004-CORR-003` (Founder disposition, 2026-08-22): staff.manage
    // is eligible pre-operationally too, so Staff/Manager invitation is not
    // blocked while the Business is draft/pending_verification — the
    // approved onboarding journey offers Staff invitation at that stage.
    // Deliberately does NOT include suspended/expired/closed/archived
    // (unchanged — still ineligible in every terminal/restricted state).
    // No other catalogue entry receives this override (Phase G proof).
    eligibleBusinessStatuses: ["draft", "pending_verification", "trial", "active"],
  },
  {
    id: "staff.assignPermissions",
    meaning: "Grant/revoke another membership's permission overrides",
    owningDomain: "Business membership",
    defaultState: "owner_only",
    inheritAllowed: false,
    explicitGrantRequired: true,
    explicitGrantEligibleRole: "manager",
    explicitRevocationSupported: true,
    auditRequirement: "mandatory",
    rationale: ["a", "d"],
  },
  {
    id: "staff.assignRole",
    meaning: "Change a Business membership role between Staff and Manager",
    owningDomain: "Business membership",
    defaultState: "owner_only",
    inheritAllowed: false,
    // ENG-P2-004-CORR-002 (Founder policy): Owner-only, non-delegable to
    // Manager or Staff at MVP — no grant path exists, modeled identically
    // to `business.transferOwnership` (row 3) rather than the
    // "Yes (Manager)" shape rows 1/2/4/5/6 use. `explicitGrantRequired:
    // true` here would wrongly imply a Manager grant path exists.
    explicitGrantRequired: false,
    explicitGrantEligibleRole: null,
    explicitRevocationSupported: false,
    auditRequirement: "mandatory",
    rationale: ["a"],
  },
  {
    id: "business.transferOwnership",
    meaning: "Reassign the Owner role",
    owningDomain: "Business membership",
    defaultState: "owner_only",
    inheritAllowed: false,
    // Design §3.2 row 3: "N/A (owner-only, not grantable)" — modeled as
    // `false` here (no membership other than the Owner floor itself may
    // ever hold this permission) rather than `true`, since "explicit
    // grant required" would wrongly imply a Manager/Staff grant path
    // exists. `permissionOverride.ts` separately refuses any override
    // targeting an Owner membership, and no non-owner grant path is
    // modeled anywhere in this catalogue for this entry.
    explicitGrantRequired: false,
    explicitGrantEligibleRole: null,
    explicitRevocationSupported: false,
    auditRequirement: "mandatory",
    rationale: ["a"],
  },
  {
    id: "business.configureFraudRules",
    meaning: "Set/alter fraud-control parameters",
    owningDomain: "Business admin",
    defaultState: "owner_only",
    inheritAllowed: false,
    explicitGrantRequired: true,
    explicitGrantEligibleRole: "manager",
    explicitRevocationSupported: true,
    auditRequirement: "mandatory",
    rationale: ["d"],
  },
  {
    id: "transaction.reverse",
    meaning: "Reverse a completed transaction/redemption",
    owningDomain: "Transaction domain",
    defaultState: "owner_only",
    inheritAllowed: false,
    explicitGrantRequired: true,
    explicitGrantEligibleRole: "manager",
    explicitRevocationSupported: true,
    auditRequirement: "mandatory",
    rationale: ["c"],
  },
  {
    id: "reward.override",
    meaning: "Grant a reward outside normal redemption rules",
    owningDomain: "Reward domain",
    defaultState: "owner_only",
    inheritAllowed: false,
    explicitGrantRequired: true,
    explicitGrantEligibleRole: "manager",
    explicitRevocationSupported: true,
    auditRequirement: "mandatory",
    rationale: ["c"],
  },
  {
    id: "customer.viewProtectedProfile",
    meaning:
      "View a customer's protected personal data beyond the transaction-necessary minimum (TRD21 Class 3/4)",
    owningDomain: "Customer domain",
    defaultState: "owner_and_manager_default",
    inheritAllowed: true,
    explicitGrantRequired: true,
    // Design §3.2 row 7: "No (role-default), Yes for Staff" — Owner and
    // Manager already hold this by default (defaultState above); an
    // explicit grant only ever makes sense to extend it to Staff.
    explicitGrantEligibleRole: "staff",
    explicitRevocationSupported: true,
    auditRequirement: "mandatory",
    rationale: ["b"],
  },
  {
    id: "report.exportFinancial",
    meaning: "Export financial/aggregate business reports",
    owningDomain: "Reporting",
    defaultState: "owner_and_manager_default",
    inheritAllowed: true,
    explicitGrantRequired: true,
    // Design §3.2 row 8: same "Yes for Staff" pattern as row 7 above.
    explicitGrantEligibleRole: "staff",
    explicitRevocationSupported: true,
    auditRequirement: "mandatory",
    rationale: ["c"],
  },
] as const;

export const SENSITIVE_PERMISSION_IDS: readonly PermissionId[] = SENSITIVE_PERMISSION_CATALOGUE.map(
  (entry) => entry.id,
);

const CATALOGUE_BY_ID: ReadonlyMap<PermissionId, SensitivePermissionCatalogueEntry> = new Map(
  SENSITIVE_PERMISSION_CATALOGUE.map((entry) => [entry.id, entry]),
);

export function isSensitivePermission(permissionId: PermissionId): boolean {
  return CATALOGUE_BY_ID.has(permissionId);
}

export function getSensitivePermissionEntry(
  permissionId: PermissionId,
): SensitivePermissionCatalogueEntry {
  const entry = CATALOGUE_BY_ID.get(permissionId);
  if (!entry) {
    throw unrecognisedSensitivePermissionError(permissionId);
  }
  return entry;
}

/**
 * Sensitive permissions whose default state allows role/template
 * inheritance (design §3.2 rows 7–8 only). Every other catalogue entry
 * (rows 1–6) may never appear in any role template's default permissions
 * — see `roleTemplate.ts`'s invariant enforcement.
 */
export function getInheritableSensitivePermissionEntries(): readonly SensitivePermissionCatalogueEntry[] {
  return SENSITIVE_PERMISSION_CATALOGUE.filter((entry) => entry.inheritAllowed);
}
