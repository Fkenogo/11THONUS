import type { Firestore } from "firebase-admin/firestore";
import { readDisplayName } from "../domains/identity/repositories/displayNameRepository";
import { getLoyaltyNumberAssignmentForIdentity } from "../domains/loyaltyNumber/repositories/loyaltyNumberRepository";
import { getActiveQrIdentityByCustomerIdentityId } from "../domains/qrIdentity/repositories/qrIdentityRepository";

export type CustomerIdentityPresentation = {
  readonly displayName: string | null;
  readonly loyaltyNumber: string | null;
  readonly qrReference: string | null;
  readonly status: "ready" | "pending";
};

/** Reads only the authenticated Customer Identity's existing display and identity artifacts. */
export async function readCustomerIdentityPresentation(
  db: Firestore,
  customerIdentityId: string,
): Promise<CustomerIdentityPresentation> {
  const [profile, loyaltyAssignment, qrIdentity] = await Promise.all([
    readDisplayName(db, customerIdentityId),
    getLoyaltyNumberAssignmentForIdentity(db, customerIdentityId),
    getActiveQrIdentityByCustomerIdentityId(db, customerIdentityId),
  ]);

  const loyaltyNumber = loyaltyAssignment?.loyaltyNumber ?? null;
  const qrReference = qrIdentity?.qrReference ?? null;
  return {
    displayName: profile.displayName ?? null,
    loyaltyNumber,
    qrReference,
    status: loyaltyNumber && qrReference ? "ready" : "pending",
  };
}
