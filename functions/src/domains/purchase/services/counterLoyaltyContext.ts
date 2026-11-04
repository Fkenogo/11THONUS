/**
 * Staff Counter — limited, transaction-scoped loyalty context (`EA-BL-001-CORR-002-B`, Founder
 * Preview Pass 3; supersedes Slice B D4; PRD01 §8.2 "view limited customer progress needed to
 * complete the transaction", §12.2 "view limited customer progress").
 *
 * PURPOSE-SPECIFIC, NOT A CUSTOMER READ. The input is exactly the transaction the Staff member is
 * about to record — Business, ONE presented Customer artifact, ONE Reward Program — and the Customer is
 * resolved server-side by the SAME resolver and the SAME eligibility rules as `recordPurchase`
 * (live `purchase.record` authority, the artifact's own lookup, the locked-version shared-number
 * gate). The output is four values about that one Customer in that one Program. There is no Customer
 * id in or out, no name/contact/history, no other Business or Program, and no review information.
 *
 * Failure is deliberately uniform: a malformed, unknown or inactive artifact, a Loyalty Number
 * presented to a QR-only Program, and an unusable Program all end the same way for the caller (one of
 * two neutral validation failures decided BEFORE any Customer is looked up), so the endpoint cannot be
 * used to enumerate Customers or to probe policy. It reads only — never creates or repairs a Cycle.
 *
 * Verified progress is authoritative and comes only from the Customer's current Cycle
 * (`allocated_units`). Purchases that are merely recorded and awaiting the Customer's confirmation
 * are reported SEPARATELY and never added to the verified count.
 */

import type { Firestore } from "firebase-admin/firestore";
import { randomUUID } from "node:crypto";
import type { PlatformPostgresPool } from "../../../infrastructure/postgres/postgresPool";
import {
  lookupCustomerIdentityByLoyaltyNumber,
  lookupCustomerIdentityByQrReference,
} from "../../identity/repositories/identityLookupRepository";
import { IdentityDomainError } from "../../identity/models/identityErrors";
import { createLoyaltyNumber } from "../../loyaltyNumber/models/loyaltyNumber";
import { createQrReference } from "../../qrIdentity/models/qrReference";
import { authorizePurchaseRecord } from "./purchaseAuthorization";
import {
  readActiveProgramLoyaltyTerms,
  readCurrentCycleProgress,
  sumUnitsAwaitingCustomerConfirmation,
} from "../repositories/counterLoyaltyContextRepository";
import {
  purchaseArtifactError,
  purchaseProgramError,
  purchaseValidationError,
} from "../models/purchaseErrors";

/** The whole result. Four values; nothing identifies the Customer. */
export type CounterLoyaltyContext = {
  /** Authoritative verified units in the Customer's current Cycle (0 when no Cycle has started). */
  readonly verifiedUnits: number;
  readonly requiredVerifiedUnits: number;
  readonly rewardStatus: "none" | "available";
  /** Recorded units still waiting for the Customer's own confirmation — never part of `verifiedUnits`. */
  readonly awaitingCustomerConfirmationUnits: number;
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function getCounterLoyaltyContext(
  db: Firestore,
  pool: PlatformPostgresPool,
  params: {
    readonly userId: string;
    readonly correlationId: string;
    readonly businessId: string;
    readonly rewardProgramId: string;
    readonly loyaltyNumberValue?: string | null;
    readonly qrReference?: string | null;
  },
): Promise<CounterLoyaltyContext> {
  // 1. The Counter's one authority (same live evaluation as `recordPurchase`).
  const { role } = await authorizePurchaseRecord(db, params.userId, params.businessId);

  // 2. Exactly one presented artifact (shape only; never echoed back).
  const hasLn =
    typeof params.loyaltyNumberValue === "string" && params.loyaltyNumberValue.trim().length > 0;
  const hasQr = typeof params.qrReference === "string" && params.qrReference.trim().length > 0;
  if (hasLn === hasQr) {
    throw purchaseValidationError(
      "Exactly one Customer artifact is required: either a Loyalty Number or a QR Identity reference.",
    );
  }

  // 3. The Program must be an active one of THIS Business — decided before any Customer is touched.
  if (!UUID_PATTERN.test(params.rewardProgramId)) {
    throw purchaseProgramError("The Reward Program is not available.");
  }
  const terms = await readActiveProgramLoyaltyTerms(pool, {
    businessId: params.businessId,
    rewardProgramId: params.rewardProgramId,
  });
  if (!terms) {
    throw purchaseProgramError("The Reward Program is not available.");
  }

  // 4. Resolve the Customer server-side, exactly as the Record path does. Every artifact failure —
  //    including a Loyalty Number on a QR-only Program — is the one neutral artifact error.
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
  if (loyaltyNumber !== null && !terms.sharedLoyaltyNumberAllowed) {
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

  // 5. The limited progress itself.
  const scope = {
    businessId: params.businessId,
    customerIdentityId,
    rewardProgramId: params.rewardProgramId,
  };
  const [cycle, awaiting] = await Promise.all([
    readCurrentCycleProgress(pool, scope),
    sumUnitsAwaitingCustomerConfirmation(pool, scope),
  ]);
  return {
    verifiedUnits: cycle?.verifiedUnits ?? 0,
    requiredVerifiedUnits: cycle?.requiredVerifiedUnits ?? terms.requiredVerifiedUnits,
    rewardStatus: cycle?.rewardAvailable ? "available" : "none",
    awaitingCustomerConfirmationUnits: awaiting,
  };
}
