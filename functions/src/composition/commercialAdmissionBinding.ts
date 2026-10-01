/**
 * Composition root: binds the Purchase admission port to Commercial
 * (`WP-COM-05b`; design §4.3 rule 2).
 *
 * The ONLY file outside `domains/commercial` that imports Commercial. The Purchase
 * domain defines `PurchaseAdmissionCapacityPort` and never imports Commercial;
 * Commercial never imports a Purchase/Loyalty repository. Assigning the Commercial
 * functions to the Purchase port below is what keeps the two structurally compatible
 * (a mismatch is a compile error).
 *
 * Also provides the WP-COM-04 earmark resolver: the consumption projection looks an
 * earmark up under its account lock and takes no Loyalty lock. Resolving a Reward to
 * its Circle position needs the Circle's stream and sequence, so this file does that
 * with one plain (non-locking) read of the Cycle and then asks Commercial for the
 * earmark. The projector itself is unchanged.
 */

import type { PlatformPostgresTransaction } from "../infrastructure/postgres/postgresTransaction";
import {
  evaluateCommercialAdmission,
  recordCommercialAdmission,
  recordCommercialAdmissionHold,
} from "../domains/commercial/services/commercialAdmission";
import { findAdmissionEarmark } from "../domains/commercial/repositories/commercialAdmissionRepository";
import type { ConsumptionEarmarkResolver } from "../domains/commercial/models/commercialConsumption";
import {
  computeStreamRef,
  type PurchaseAdmissionCapacityPort,
} from "../domains/purchase/services/purchaseAdmissionPort";

/** The Commercial admission implementation of the Purchase-side capacity port. */
export function createCommercialAdmissionPort(): PurchaseAdmissionCapacityPort {
  return {
    evaluate: (tx, input) => evaluateCommercialAdmission(tx, input),
    recordAdmission: (tx, input) => recordCommercialAdmission(tx, input),
    recordHold: (tx, input) => recordCommercialAdmissionHold(tx, input),
  };
}

type CycleStreamRow = {
  customer_identity_id: string;
  reward_program_id: string;
  sequence_number: number;
};

/**
 * Earmark resolver for `projectCommercialConsumption` (design §5.4 step 4, §8.5.1):
 * Circle `sequence_number k` of a stream <=> earmark `block_index k`. A plain read of the
 * Reward's Cycle (no row lock); `null` when no earmark exists (the exceptional fallback).
 */
export const admissionEarmarkResolver: ConsumptionEarmarkResolver = async (
  tx: PlatformPostgresTransaction,
  source,
) => {
  const cycle = await tx.query<CycleStreamRow>(
    `SELECT customer_identity_id, reward_program_id, sequence_number
       FROM loyalty_cycles WHERE id = $1`,
    [source.loyaltyCycleId],
  );
  if (cycle.rows.length === 0) return null;
  const row = cycle.rows[0];
  return findAdmissionEarmark(tx, {
    businessId: source.businessId,
    streamRef: computeStreamRef({
      businessId: source.businessId,
      customerIdentityId: row.customer_identity_id,
      rewardProgramId: row.reward_program_id,
    }),
    blockIndex: row.sequence_number,
  });
};
