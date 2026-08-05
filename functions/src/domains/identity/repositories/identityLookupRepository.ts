/**
 * Identity Query and Lookup Interfaces (ENG-P2-001-09).
 *
 * Bounded, exact-match-only resolution of an already-existing Customer
 * Identity via one of four permanent identifiers — Customer Identity ID,
 * Loyalty Number, QR reference, Authentication Reference. A lookup never
 * creates, updates, merges, or recovers an identity; it only resolves a
 * reference to a bounded result (`IdentityLookupResult`), or fails
 * closed. No fuzzy/partial/wildcard/prefix search exists anywhere in this
 * module — every lookup is a single doc-ID `.get()` against an already
 * doc-ID-keyed collection (`users`, `loyaltyNumbers`, `qrIdentityRecords`,
 * `authenticationReferences`), reusing the existing repositories those
 * collections already belong to (`getCustomerIdentityById`,
 * `getLoyaltyNumberAssignmentByValue`, `getActiveQrIdentityByReference`,
 * `getActiveAuthenticationReferenceOwner`) rather than duplicating their
 * persistence.
 *
 * Every lookup function accepts a caller-declared `IdentityLookupPurpose`
 * and checks it against a small, hardcoded per-function allow-list — not
 * a generic role/permission system (explicitly out of this package's
 * scope). An unlisted purpose fails closed with
 * `identityLookupPurposeNotPermittedError`. **The declared purpose is
 * never itself verified authority** — this package has no notion of caller
 * identity, credential, role, or session; any caller may declare any
 * listed purpose. A future trusted application boundary (a callable
 * Cloud Function or internal service-auth layer, not built here) must
 * authenticate the actual caller, map that caller to the set of purposes
 * their verified role permits, and reject any request whose declared
 * purpose the caller isn't actually authorised to use — entirely
 * separate from, and prior to, this package's own allow-list check.
 *
 * Per Founder-reviewed policy (2026-08-05, `PR #64` correction):
 *   - Customer Identity ID:      trusted internal, support, governed recovery.
 *   - Loyalty Number:            trusted internal, governed recovery, support,
 *                                 authenticated participating-business transaction.
 *   - QR reference:              trusted internal, authenticated participating-
 *                                 business transaction, governed recovery
 *                                 (explicitly governed by `-07`'s own already-
 *                                 merged `RecoveryLookupReference` route) —
 *                                 `support` is deliberately NOT listed; no
 *                                 governing evidence names it for this identifier.
 *   - Authentication Reference:  authentication, governed recovery (a Founder-
 *                                 approved capability grant — `-07`'s own
 *                                 recovery orchestration remains unmodified and
 *                                 is not wired to this route; a future
 *                                 integration task connects them), support,
 *                                 trusted internal.
 * "Authenticated participating-business" and "governed recovery/support" are
 * requirements on the FUTURE authority layer above — this package cannot and
 * does not enforce them; it only accepts the declared purpose value.
 *
 * "Unknown identifier" and "identifier exists but is not currently
 * active" (invalidated QR, unlinked Authentication Reference) are
 * deliberately collapsed into the same `identityLookupNotFoundError` at
 * this boundary — a caller of these functions cannot distinguish "never
 * existed" from "existed but is no longer active," hardening against
 * enumeration/probing beyond what the underlying `-04`/`-08` repositories
 * (whose own, more specific errors remain unchanged) provide on their own.
 *
 * Every lookup runs inside a Firestore transaction so audit-worthy
 * attempts (support/recovery/authentication purposes, and any failed QR
 * lookup regardless of purpose — the "likely candidates" this task's own
 * brief names) can emit a privacy-safe `IdentityLookupAttempted` event
 * atomically with the read that produced it. Ordinary internal-service and
 * merchant-transaction successes are not audited, to avoid emitting on
 * every routine scan.
 */

import type { Firestore } from "firebase-admin/firestore";
import type { EventActor } from "../../../shared/events/domainEvent";
import { writeOutboxEntry } from "../../../shared/outbox/outboxWriter";
import {
  buildIdentityLookupAttemptedEvent,
  type IdentityLookupType,
  type IdentityLookupOutcome,
} from "../events/identityEvents";
import type { IdentityLookupPurpose } from "../models/identityLookupPurpose";
import type { AuthenticationReference } from "../models/authenticationReference";
import type { AuthenticationReferenceType } from "../models/authenticationReference";
import type { IdentityStatus } from "../models/identityStatus";
import {
  IdentityDomainError,
  malformedIdentityLookupError,
  identityLookupNotFoundError,
  identityLookupPurposeNotPermittedError,
} from "../models/identityErrors";
import { fromUserDocument } from "./userDocument";
import { getActiveAuthenticationReferenceOwner } from "./authenticationReferenceRepository";
import { createLoyaltyNumber } from "../../loyaltyNumber/models/loyaltyNumber";
import { LoyaltyNumberDomainError } from "../../loyaltyNumber/models/loyaltyNumberErrors";
import { getLoyaltyNumberAssignmentByValue } from "../../loyaltyNumber/repositories/loyaltyNumberRepository";
import { createQrReference } from "../../qrIdentity/models/qrReference";
import { QrIdentityDomainError } from "../../qrIdentity/models/qrIdentityErrors";
import { getActiveQrIdentityByReference } from "../../qrIdentity/repositories/qrIdentityRepository";

const USERS_COLLECTION = "users";

export type IdentityLookupResult = {
  customerIdentityId: string;
  status: IdentityStatus;
  /**
   * Populated only when `purpose === "authentication"` — the one case
   * structurally requiring visibility into linked references (checking
   * for an existing reference before Authentication completes a
   * sign-in). Every other purpose gets the base result only; a merchant
   * or generic internal-service caller has no need to see which
   * providers a customer has linked, and that visibility is itself
   * sensitive linked-provider metadata worth withholding by default.
   */
  authenticationReferences?: AuthenticationReference[];
};

type IdentityLookupEnvelopeParams = {
  eventId: string;
  correlationId: string;
  actor: EventActor;
  occurredAt: string;
};

const LOOKUP_PURPOSE_ALLOW_LISTS: Record<IdentityLookupType, readonly IdentityLookupPurpose[]> = {
  customer_identity_id: ["recovery", "internal_service", "support"],
  loyalty_number: ["recovery", "internal_service", "merchant_transaction", "support"],
  qr_reference: ["recovery", "internal_service", "merchant_transaction"],
  authentication_reference: ["authentication", "recovery", "internal_service", "support"],
};

const AUDIT_ALWAYS_PURPOSES: readonly IdentityLookupPurpose[] = [
  "support",
  "recovery",
  "authentication",
];

function assertPurposePermitted(
  lookupType: IdentityLookupType,
  purpose: IdentityLookupPurpose,
): void {
  if (!LOOKUP_PURPOSE_ALLOW_LISTS[lookupType].includes(purpose)) {
    throw identityLookupPurposeNotPermittedError(purpose, lookupType);
  }
}

function shouldAudit(
  lookupType: IdentityLookupType,
  purpose: IdentityLookupPurpose,
  outcome: IdentityLookupOutcome,
): boolean {
  if (outcome === "purpose_not_permitted") {
    return true;
  }
  if (AUDIT_ALWAYS_PURPOSES.includes(purpose)) {
    return true;
  }
  if (lookupType === "qr_reference" && outcome === "not_found") {
    return true;
  }
  return false;
}

function toLookupResult(raw: unknown, purpose: IdentityLookupPurpose): IdentityLookupResult {
  const identity = fromUserDocument(raw);
  const base: IdentityLookupResult = {
    customerIdentityId: identity.id,
    status: identity.status,
  };
  if (purpose !== "authentication") {
    return base;
  }
  return { ...base, authenticationReferences: identity.authenticationReferences };
}

async function runLookup(
  db: Firestore,
  params: IdentityLookupEnvelopeParams,
  lookupType: IdentityLookupType,
  purpose: IdentityLookupPurpose,
  resolve: () => Promise<IdentityLookupResult>,
): Promise<IdentityLookupResult> {
  let outcome: IdentityLookupOutcome = "resolved";
  let thrown: unknown;

  try {
    assertPurposePermitted(lookupType, purpose);
  } catch (error) {
    outcome = "purpose_not_permitted";
    thrown = error;
  }

  if (!thrown) {
    try {
      const result = await resolve();
      if (shouldAudit(lookupType, purpose, "resolved")) {
        await emitAuditEvent(
          db,
          params,
          lookupType,
          purpose,
          "resolved",
          result.customerIdentityId,
        );
      }
      return result;
    } catch (error) {
      if (!(error instanceof IdentityDomainError && error.category === "RESOURCE_NOT_FOUND")) {
        // Malformed input is validated before `resolve()` ever runs, so
        // the only expected failure here is "not found" — anything else
        // is a genuine, unexpected error and is never audited or swallowed.
        throw error;
      }
      outcome = "not_found";
      thrown = error;
    }
  }

  if (shouldAudit(lookupType, purpose, outcome)) {
    await emitAuditEvent(db, params, lookupType, purpose, outcome, null);
  }
  throw thrown;
}

async function emitAuditEvent(
  db: Firestore,
  params: IdentityLookupEnvelopeParams,
  lookupType: IdentityLookupType,
  purpose: IdentityLookupPurpose,
  outcome: IdentityLookupOutcome,
  customerIdentityId: string | null,
): Promise<void> {
  await db.runTransaction(async (transaction) => {
    const event = buildIdentityLookupAttemptedEvent({
      ...params,
      customerIdentityId,
      lookupType,
      purpose,
      outcome,
    });
    writeOutboxEntry(transaction, db, event);
  });
}

export type LookupCustomerIdentityByIdParams = IdentityLookupEnvelopeParams & {
  customerIdentityId: string;
  purpose: IdentityLookupPurpose;
};

export async function lookupCustomerIdentityById(
  db: Firestore,
  params: LookupCustomerIdentityByIdParams,
): Promise<IdentityLookupResult> {
  if (params.customerIdentityId.trim().length === 0) {
    throw malformedIdentityLookupError("customer_identity_id", params.customerIdentityId);
  }

  return runLookup(db, params, "customer_identity_id", params.purpose, async () => {
    const snapshot = await db.collection(USERS_COLLECTION).doc(params.customerIdentityId).get();
    if (!snapshot.exists) {
      throw identityLookupNotFoundError("customer_identity_id");
    }
    return toLookupResult(snapshot.data(), params.purpose);
  });
}

export type LookupCustomerIdentityByLoyaltyNumberParams = IdentityLookupEnvelopeParams & {
  loyaltyNumber: string;
  purpose: IdentityLookupPurpose;
};

export async function lookupCustomerIdentityByLoyaltyNumber(
  db: Firestore,
  params: LookupCustomerIdentityByLoyaltyNumberParams,
): Promise<IdentityLookupResult> {
  let canonical: string;
  try {
    canonical = createLoyaltyNumber(params.loyaltyNumber);
  } catch (error) {
    if (error instanceof LoyaltyNumberDomainError) {
      throw malformedIdentityLookupError("loyalty_number", params.loyaltyNumber);
    }
    throw error;
  }

  return runLookup(db, params, "loyalty_number", params.purpose, async () => {
    const assignment = await getLoyaltyNumberAssignmentByValue(db, canonical);
    if (!assignment) {
      throw identityLookupNotFoundError("loyalty_number");
    }
    const snapshot = await db.collection(USERS_COLLECTION).doc(assignment.customerIdentityId).get();
    if (!snapshot.exists) {
      throw identityLookupNotFoundError("loyalty_number");
    }
    return toLookupResult(snapshot.data(), params.purpose);
  });
}

export type LookupCustomerIdentityByQrReferenceParams = IdentityLookupEnvelopeParams & {
  qrReference: string;
  purpose: IdentityLookupPurpose;
};

export async function lookupCustomerIdentityByQrReference(
  db: Firestore,
  params: LookupCustomerIdentityByQrReferenceParams,
): Promise<IdentityLookupResult> {
  let canonical: string;
  try {
    canonical = createQrReference(params.qrReference);
  } catch (error) {
    if (error instanceof QrIdentityDomainError) {
      throw malformedIdentityLookupError("qr_reference", params.qrReference);
    }
    throw error;
  }

  return runLookup(db, params, "qr_reference", params.purpose, async () => {
    let association;
    try {
      association = await getActiveQrIdentityByReference(db, canonical);
    } catch (error) {
      if (error instanceof QrIdentityDomainError) {
        throw identityLookupNotFoundError("qr_reference");
      }
      throw error;
    }
    const snapshot = await db
      .collection(USERS_COLLECTION)
      .doc(association.customerIdentityId)
      .get();
    if (!snapshot.exists) {
      throw identityLookupNotFoundError("qr_reference");
    }
    return toLookupResult(snapshot.data(), params.purpose);
  });
}

export type LookupCustomerIdentityByAuthenticationReferenceParams = IdentityLookupEnvelopeParams & {
  referenceType: AuthenticationReferenceType;
  referenceId: string;
  purpose: IdentityLookupPurpose;
};

export async function lookupCustomerIdentityByAuthenticationReference(
  db: Firestore,
  params: LookupCustomerIdentityByAuthenticationReferenceParams,
): Promise<IdentityLookupResult> {
  if (params.referenceId.trim().length === 0) {
    throw malformedIdentityLookupError("authentication_reference", params.referenceId);
  }

  return runLookup(db, params, "authentication_reference", params.purpose, async () => {
    const owner = await getActiveAuthenticationReferenceOwner(
      db,
      params.referenceType,
      params.referenceId,
    );
    if (!owner) {
      throw identityLookupNotFoundError("authentication_reference");
    }
    const snapshot = await db.collection(USERS_COLLECTION).doc(owner.customerIdentityId).get();
    if (!snapshot.exists) {
      throw identityLookupNotFoundError("authentication_reference");
    }
    return toLookupResult(snapshot.data(), params.purpose);
  });
}
