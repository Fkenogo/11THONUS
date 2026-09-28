/**
 * Purchase / Verification transactional-spine row types
 * (`PLATFORM-BASELINE-006A`, design §§8/13-16/20).
 *
 * PostgreSQL is authoritative for the Purchase Record domain, Purchase
 * Verification lifecycle state, Verified Units, minimum Loyalty Cycle
 * allocation state, allocation positions/history, minimum Reward
 * entitlements, Purchase-domain Trust Events, Notification Intents, and the
 * Purchase-domain outbox (FD-PVL-001). Firestore-owned entities (Business,
 * Customer Identity, Branch, Commerce Knowledge, actor memberships) appear
 * here only as opaque stable `TEXT` references, validated server-side at
 * write time — never as PostgreSQL foreign keys.
 */

export type PurchaseStatus =
  | "waiting_for_customer"
  | "verified"
  | "rejected"
  | "under_review"
  | "corrected"
  | "cancelled"
  | "expired"
  | "archived";

export type PresentedArtifactType = "loyalty_number" | "qr_identity";

export type RecorderRole = "staff" | "manager" | "owner";

export type PurchaseActorType = "staff" | "manager" | "owner" | "customer" | "system";

/** Bounded reject vocabulary ("should not count at all" — design §15). */
export type PurchaseRejectReason =
  "did_not_happen" | "duplicate" | "wrong_customer" | "wrong_program" | "wholly_invalid";

export const PURCHASE_REJECT_REASONS: readonly PurchaseRejectReason[] = [
  "did_not_happen",
  "duplicate",
  "wrong_customer",
  "wrong_program",
  "wholly_invalid",
] as const;

/** Bounded dispute vocabulary ("occurred, but details wrong" — design §15). */
export type PurchaseDisputeReason = "wrong_quantity" | "wrong_item" | "partially_inaccurate";

export const PURCHASE_DISPUTE_REASONS: readonly PurchaseDisputeReason[] = [
  "wrong_quantity",
  "wrong_item",
  "partially_inaccurate",
] as const;

export type PurchaseRecordRow = {
  readonly id: string;
  readonly businessId: string;
  readonly customerIdentityId: string;
  readonly presentedArtifactType: PresentedArtifactType;
  readonly presentedArtifactReference: string;
  readonly canonicalLoyaltyNumberValue: string;
  readonly rewardProgramId: string;
  readonly rewardProgramVersionId: string;
  readonly sharedLoyaltyNumberAllowed: boolean;
  readonly multipleUnitsAllowed: boolean;
  readonly branchId: string;
  readonly recordedByUserId: string;
  readonly recordedByRole: RecorderRole;
  readonly quantity: number;
  /**
   * Structural Business-owned purchase-item identity (`PLATFORM-BASELINE-
   * 013C`, `DEC-LOY-016`): the stable `qualifying_items.id` the operator
   * selected, proven server-side to be on the locked version's frozen
   * qualification set. `null` only for legacy rows recorded before
   * migration `0018`; every new Purchase supplies it. Never client-supplied
   * by name/classification, never a Commerce Knowledge id.
   */
  readonly qualifyingItemId: string | null;
  /**
   * Frozen, server-derived human-readable item snapshot at transaction time
   * (from the locked version's `item_name_at_version`). Display/evidence
   * only -- never qualification authority, never client-supplied.
   */
  readonly itemLabel: string;
  /**
   * Retained, no longer written (`PLATFORM-BASELINE-013C`, PB-012 §17A
   * CF-1). Never promoted to QualifyingItem authority; `null` on every new
   * Purchase.
   */
  readonly knowledgeNodeId: string | null;
  readonly unitValueMinor: number | null;
  readonly currency: string | null;
  readonly purchaseDate: Date;
  readonly notes: string | null;
  readonly status: PurchaseStatus;
  readonly verifiedAt: Date | null;
  readonly rejectionReason: PurchaseRejectReason | null;
  readonly disputeReason: PurchaseDisputeReason | null;
  readonly replacesPurchaseRecordId: string | null;
  readonly correlationId: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly schemaVersion: number;
};

export type PurchaseRecordEventRow = {
  readonly id: string;
  readonly purchaseRecordId: string;
  readonly fromStatus: PurchaseStatus | null;
  readonly toStatus: PurchaseStatus;
  readonly actorType: PurchaseActorType;
  readonly actorId: string;
  readonly reason: string | null;
  readonly eventPayload: Record<string, unknown> | null;
  readonly correlationId: string;
  readonly occurredAt: Date;
  readonly schemaVersion: number;
};

export type VerifiedUnitEntryType = "credit" | "reversal";

export type VerifiedUnitRow = {
  readonly id: string;
  readonly purchaseRecordId: string;
  readonly businessId: string;
  readonly customerIdentityId: string;
  readonly rewardProgramId: string;
  readonly rewardProgramVersionId: string;
  readonly quantity: number;
  readonly entryType: VerifiedUnitEntryType;
  readonly reversesVerifiedUnitId: string | null;
  readonly correctionPurchaseRecordId: string | null;
  readonly reasonCode: string;
  readonly correlationId: string;
  readonly createdAt: Date;
  readonly createdBy: string;
  readonly schemaVersion: number;
};

export type LoyaltyCycleStreamRow = {
  readonly businessId: string;
  readonly customerIdentityId: string;
  readonly rewardProgramId: string;
  readonly nextCycleSequence: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
};

export type LoyaltyCycleState = "active" | "reward_available" | "reward_redeemed" | "closed";

export type LoyaltyCycleRow = {
  readonly id: string;
  readonly businessId: string;
  readonly customerIdentityId: string;
  readonly rewardProgramId: string;
  readonly openedUnderVersionId: string;
  readonly sequenceNumber: number;
  readonly state: LoyaltyCycleState;
  readonly allocatedUnits: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly correlationId: string;
  readonly schemaVersion: number;
};

export type AllocationPositionState = "allocated" | "pending";

export type AllocationPositionRow = {
  readonly id: string;
  readonly verifiedUnitId: string;
  readonly loyaltyCycleId: string | null;
  readonly businessId: string;
  readonly customerIdentityId: string;
  readonly rewardProgramId: string;
  readonly rewardProgramVersionId: string;
  readonly allocatedQuantity: number;
  readonly allocationOrder: number;
  readonly state: AllocationPositionState;
  readonly createdAt: Date;
  readonly updatedAt: Date;
};

export type AllocationEventRow = {
  readonly id: string;
  readonly allocationPositionId: string;
  readonly verifiedUnitId: string;
  readonly fromState: "none" | "pending" | "allocated";
  readonly toState: "pending" | "allocated" | "reversed";
  readonly fromCycleId: string | null;
  readonly toCycleId: string | null;
  readonly quantity: number;
  readonly reason: "initial_placement" | "pending_to_allocated" | "correction_adjustment";
  readonly correlationId: string;
  readonly occurredAt: Date;
  readonly schemaVersion: number;
};

export type RewardState = "available" | "redeemed" | "cancelled" | "expired";

export type RewardRow = {
  readonly id: string;
  readonly loyaltyCycleId: string;
  readonly businessId: string;
  readonly customerIdentityId: string;
  readonly rewardProgramId: string;
  readonly rewardProgramVersionId: string;
  readonly rewardDescription: string;
  readonly rewardQuantity: number;
  readonly state: RewardState;
  readonly availableAt: Date;
  readonly createdAt: Date;
  readonly correlationId: string;
  readonly schemaVersion: number;
};

/**
 * Redemption evidence row (`CAPABILITY-6-REDEMPTION-ENGINE-001`,
 * `DEC-LOY-018` — the redemption store: redemption facts + `redeemed_at`).
 *
 * One row per redeemed Reward (`UNIQUE(reward_id)`). Individual
 * attribution (`DEC-ID-002`): the actual authenticated Business member who
 * confirmed — user id, membership id, and the role the evaluator resolved
 * at confirm time. No cancellation/reversal fields (`DEC-LOY-004`
 * boundary — reversal is a separate package, never retrofitted here).
 */
export type RedemptionRow = {
  readonly id: string;
  readonly rewardId: string;
  readonly loyaltyCycleId: string;
  readonly businessId: string;
  readonly customerIdentityId: string;
  readonly rewardProgramId: string;
  readonly rewardProgramVersionId: string;
  readonly confirmedByUserId: string;
  readonly confirmedByMembershipId: string;
  readonly confirmedByRole: string;
  readonly idempotencyKey: string;
  readonly redeemedAt: Date;
  readonly correlationId: string;
  readonly schemaVersion: number;
};

export type TrustEventType =
  | "purchase.recorded"
  | "purchase.verified"
  | "purchase.rejected"
  | "purchase.disputed"
  | "verified_units.issued"
  | "loyalty_cycle.allocated"
  | "loyalty_cycle.reward_available"
  | "reward.available"
  | "reward.redeemed"
  | "loyalty_cycle.reward_redeemed";

export type TrustSubjectType = "purchase_record" | "verified_unit" | "loyalty_cycle" | "reward";

export type TrustEventRow = {
  readonly id: string;
  readonly eventType: TrustEventType;
  readonly eventVersion: number;
  readonly sourceDomain: string;
  /**
   * Causal Purchase root. Present for every purchase-caused event;
   * `null` for redemption-caused events (`reward.redeemed`,
   * `loyalty_cycle.reward_redeemed`), which are caused by a Business
   * confirmation rather than a Purchase lifecycle transition
   * (`0020_redemption_store.sql`'s shape CHECK enforces exactly this
   * split at the database layer).
   */
  readonly causalPurchaseRecordId: string | null;
  readonly sourcePurchaseRecordEventId: string | null;
  readonly subjectType: TrustSubjectType;
  readonly subjectId: string;
  readonly subjectVerifiedUnitId: string | null;
  readonly subjectLoyaltyCycleId: string | null;
  readonly subjectRewardId: string | null;
  readonly businessId: string;
  readonly customerIdentityId: string;
  readonly actorType: PurchaseActorType;
  readonly actorId: string;
  readonly actorRole: string | null;
  readonly correlationId: string;
  readonly causationId: string | null;
  readonly payload: Record<string, unknown>;
  readonly occurredAt: Date;
  readonly recordedAt: Date;
  readonly schemaVersion: number;
};

export type NotificationIntentType =
  | "purchase_recorded_customer"
  | "purchase_verified_business"
  | "purchase_rejected_business"
  | "purchase_disputed_business"
  | "reward_available_customer"
  | "reward_redeemed_customer"
  | "reward_redeemed_business";

export type NotificationIntentRow = {
  readonly id: string;
  readonly intentType: NotificationIntentType;
  /** `null` for redemption-caused intents (anchored on the redemption instead). */
  readonly purchaseRecordId: string | null;
  /** `null` for redemption-caused intents (anchored on the redemption instead). */
  readonly sourcePurchaseRecordEventId: string | null;
  /** Set only for redemption-caused intents (`0020` shape CHECK). */
  readonly sourceRedemptionId: string | null;
  readonly recipientType: "customer" | "business";
  readonly recipientId: string;
  readonly payload: Record<string, unknown>;
  readonly status: "pending";
  readonly correlationId: string;
  readonly createdAt: Date;
  readonly schemaVersion: number;
};

export type PurchaseOutboxEventType =
  | "purchase_recorded"
  | "purchase_verified"
  | "purchase_rejected"
  | "purchase_disputed"
  | "verified_units_issued"
  | "loyalty_cycle_allocated"
  | "loyalty_cycle_reward_available"
  | "reward_available";

/** Generic PG idempotency operation types for this domain (design §17). */
export type PurchaseIdempotencyOperation =
  | "purchase.create"
  | "purchase.verify"
  | "purchase.reject"
  | "purchase.dispute"
  | "redemption.confirm";
