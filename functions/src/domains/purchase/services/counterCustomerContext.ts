/**
 * Transaction-scoped Staff Customer context (`FD-UX-1`, B1A).
 *
 * This is not a Customer lookup or directory. It first authorizes the current
 * actor for `purchase.record`, validates one presented artifact, resolves it
 * through the existing merchant-transaction identity resolver, and only then
 * reads the minimum context for that Customer at the requested Business.
 */

import type { Firestore } from "firebase-admin/firestore";
import { randomUUID } from "node:crypto";
import type { PlatformPostgresPool } from "../../../infrastructure/postgres/postgresPool";
import { readDisplayName } from "../../identity/repositories/displayNameRepository";
import {
  lookupCustomerIdentityByLoyaltyNumber,
  lookupCustomerIdentityByQrReference,
} from "../../identity/repositories/identityLookupRepository";
import { IdentityDomainError } from "../../identity/models/identityErrors";
import { createLoyaltyNumber } from "../../loyaltyNumber/models/loyaltyNumber";
import { createQrReference } from "../../qrIdentity/models/qrReference";
import { authorizePurchaseRecord } from "./purchaseAuthorization";
import {
  hasActiveLoyaltyNumberProgramme,
  listCounterCustomerProgrammes,
} from "../repositories/counterCustomerContextRepository";
import { purchaseArtifactError, purchaseValidationError } from "../models/purchaseErrors";

export type CounterCustomerContext = {
  readonly customer: { readonly displayName: string | null };
  readonly programmes: Awaited<ReturnType<typeof listCounterCustomerProgrammes>>;
};

export type CounterCustomerContextParams = {
  readonly userId: string;
  readonly correlationId: string;
  readonly businessId: string;
  readonly loyaltyNumberValue?: string | null;
  readonly qrReference?: string | null;
};

export async function getCounterCustomerContext(
  db: Firestore,
  pool: PlatformPostgresPool,
  params: CounterCustomerContextParams,
): Promise<CounterCustomerContext> {
  const { role } = await authorizePurchaseRecord(db, params.userId, params.businessId);
  const hasLn =
    typeof params.loyaltyNumberValue === "string" && params.loyaltyNumberValue.trim().length > 0;
  const hasQr = typeof params.qrReference === "string" && params.qrReference.trim().length > 0;
  if (hasLn === hasQr) {
    throw purchaseValidationError(
      "Exactly one Customer artifact is required: either a Loyalty Number or a QR Identity reference.",
    );
  }

  const neutral = () =>
    purchaseArtifactError("The presented Customer artifact did not resolve to a Customer.");
  let loyaltyNumber: string | null = null;
  let qrReference: string | null = null;
  try {
    if (hasLn) loyaltyNumber = createLoyaltyNumber(params.loyaltyNumberValue as string);
    else qrReference = createQrReference(params.qrReference as string);
  } catch {
    throw neutral();
  }
  if (loyaltyNumber !== null && !(await hasActiveLoyaltyNumberProgramme(pool, params.businessId))) {
    throw neutral();
  }

  const envelope = {
    eventId: randomUUID(),
    correlationId: params.correlationId,
    actor: { actorType: "user" as const, actorId: params.userId, role },
    occurredAt: new Date().toISOString(),
  };
  let customerIdentityId: string;
  try {
    const lookup =
      loyaltyNumber !== null
        ? await lookupCustomerIdentityByLoyaltyNumber(db, {
            ...envelope,
            loyaltyNumber,
            purpose: "merchant_transaction",
          })
        : await lookupCustomerIdentityByQrReference(db, {
            ...envelope,
            qrReference: qrReference as string,
            purpose: "merchant_transaction",
          });
    customerIdentityId = lookup.customerIdentityId;
  } catch (error) {
    if (
      error instanceof IdentityDomainError &&
      (error.category === "RESOURCE_NOT_FOUND" || error.category === "VALIDATION_FAILED")
    ) {
      throw neutral();
    }
    throw error;
  }

  // Identity and programme data are not read until the artifact resolves.
  const [identity, programmes] = await Promise.all([
    readDisplayName(db, customerIdentityId),
    listCounterCustomerProgrammes(pool, {
      businessId: params.businessId,
      customerIdentityId,
    }),
  ]);
  return {
    customer: { displayName: identity.displayName ?? null },
    programmes,
  };
}
