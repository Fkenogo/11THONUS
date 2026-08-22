/**
 * Read/Terms-acceptance caller-authority re-derivation (`ENG-P3-002A`,
 * design §21/§25/§37.8).
 *
 * Design §21's disposed Engineering Decision: reading one's own Business
 * (§9) and accepting Terms for one's own Business (§37.8) are not
 * "permission-catalogue" operations — the catalogues govern *mutating*
 * within-Business authority tied to a role, not general read-eligibility
 * or the single, narrowly-scoped, Owner-only onboarding act of accepting
 * Terms. Both are instead re-derived here, directly, from the same
 * authoritative source `ENG-P2-004`'s evaluator itself uses to resolve
 * role — the caller's own `businessMembership` document for
 * `(userId, businessId)` — never a client-supplied claim, and never a
 * second, parallel ownership model (`Business.ownerUserId` is read-only
 * historical provenance on the aggregate; the live, authoritative
 * "who may act as Owner for this Business today" answer is the
 * membership's own `role`/`status`, exactly as `evaluatePermission.ts`
 * already treats it).
 *
 * Every function here fails closed identically for "no such Business",
 * "Business exists but caller has no membership", and "membership exists
 * but is not active/not the required role" — a caller must never be able
 * to distinguish these cases from the client-facing error alone
 * (enumeration resistance, §25).
 */

import type { Firestore, Transaction } from "firebase-admin/firestore";
import { getBusinessMembershipByUserAndBusiness } from "../../permissions/repositories/businessMembershipRepository";
import { readBusinessById } from "../repositories/businessRepository";
import { businessReadNotAuthorizedError } from "../models/businessErrors";
import type { Business } from "../models/business";

export type AuthorizedBusinessContext = {
  business: Business;
  role: "owner" | "manager" | "staff";
};

/**
 * Any active membership (Owner, Manager, or Staff) grants read authority
 * over a Business — mirrors §21's "any authenticated actor may read data
 * about a Business they own or are a member of." Used by the read
 * transport (§9) — `getOwnedBusinesses`/`getBusinessContext`.
 */
export async function resolveAuthorizedBusinessForRead(
  db: Firestore,
  userId: string,
  businessId: string,
  transaction?: Transaction,
): Promise<AuthorizedBusinessContext> {
  const business = transaction
    ? await readBusinessById(transaction, db, businessId)
    : await readBusinessByIdNonTransactional(db, businessId);
  if (!business) {
    throw businessReadNotAuthorizedError(businessId);
  }

  const membership = await getBusinessMembershipByUserAndBusiness(
    db,
    userId,
    businessId,
    transaction,
  );
  if (membership.kind !== "found" || membership.membership.status !== "active") {
    throw businessReadNotAuthorizedError(businessId);
  }

  return { business, role: membership.membership.role };
}

/**
 * Owner-only authority — mirrors `business.submitForVerification`'s own
 * `OWNER_ONLY_DEFAULT` (§21/§37.8) without adding a new permission-catalogue
 * entry. Used by `acceptBusinessTerms` (§37.8): only the Business's active
 * Owner membership may accept Terms on that Business's behalf — a Manager
 * or Staff member, even with `staff.manage`, cannot.
 */
export async function resolveAuthorizedBusinessForOwnerAction(
  db: Firestore,
  userId: string,
  businessId: string,
  transaction?: Transaction,
): Promise<Business> {
  const { business, role } = await resolveAuthorizedBusinessForRead(
    db,
    userId,
    businessId,
    transaction,
  );
  if (role !== "owner") {
    throw businessReadNotAuthorizedError(businessId);
  }
  return business;
}

async function readBusinessByIdNonTransactional(
  db: Firestore,
  businessId: string,
): Promise<Business | null> {
  return db.runTransaction((transaction) => readBusinessById(transaction, db, businessId));
}
