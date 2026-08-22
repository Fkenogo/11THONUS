/**
 * Owner-authorized Business lifecycle transitions (`ENG-P2-002C`, Phase H/I/J/K).
 *
 * Only the two governed, mechanism-resolved, Owner-authorized transitions
 * `ENG-P2-002-DESIGN-001` §6 actually supports right now:
 *
 *   - `draft → pending_verification` (`submitBusinessForVerificationCommand`)
 *   - any non-terminal status → `closed` (`closeBusinessCommand`)
 *
 * Every other §6 transition is deliberately absent from this file:
 *
 *   - `pending_verification → trial`: the verification mechanism is
 *     ungoverned (§6, §24 item 3) — no seam, executable or otherwise, is
 *     added here for it. Implementing even a placeholder would risk being
 *     mistaken for the real mechanism later.
 *   - `trial → active`, `active`/`trial → expired`: System-initiated,
 *     gated on subscription validity/lapse — subscription/billing
 *     enforcement is explicitly out of this task's authorization.
 *   - `active → suspended`, `suspended → active`: administrator-initiated
 *     (TRD18 §18.12) — no administrator authority/RBAC mechanism exists
 *     anywhere in this codebase yet (confirmed absent by direct
 *     inspection); inventing one is out of scope. The owner-self-suspend
 *     variant is separately, explicitly excluded — `DEC-ID-005` remains
 *     `OPEN_FOUNDER`.
 *   - `closed → archived`: system/retention-elapse-initiated, not an
 *     owner-callable action.
 *
 * Each command uses a distinct permission id (`business.submitForVerification`,
 * `business.close`) rather than one generic "transition" permission with a
 * client-supplied target status — the target status is fixed per command,
 * server-side, never client input, so a caller cannot request an
 * unauthorized transition merely by naming it (Phase M). Both permissions
 * are governed, non-sensitive entries in `ENG-P2-004-CORR-001`'s
 * `ORDINARY_PERMISSION_CATALOGUE` (absent from the Sensitive Permission
 * Catalogue). `business.submitForVerification`'s own catalogue entry
 * further restricts it to `draft`-only lifecycle eligibility — the
 * evaluator itself denies this command on every other Business status, so
 * this file relies on that governed narrowness rather than re-implementing
 * it (Phase F/H/J: 002C must not duplicate the evaluator's own lifecycle
 * matrix in conflicting local configuration).
 *
 * Renamed from an earlier `business.advanceLifecycle` working name (used
 * while this package was paused) to the Founder-approved
 * `business.submitForVerification` (FD-CORR-3, `ENG-P2-004-CORR-001`) —
 * the earlier name was explicitly rejected because it read as generic
 * lifecycle authority; the approved name and its `draft`-only eligibility
 * set make clear it authorizes exactly one narrow transition, never any
 * other (Phase J/N of the controlled-resume task).
 *
 * `isValidBusinessStatusTransition`/`transitionBusinessStatus` (`ENG-P2-002A`,
 * unchanged) still gate the *structural* legality of the transition from
 * whatever the Business's current status actually is — Owner authorization
 * alone does not bypass the structural state machine.
 */

import type { Firestore, Transaction } from "firebase-admin/firestore";
import {
  authorizeAndExecute,
  type AuthorizeAndExecuteResult,
} from "../../permissions/service/authorizeAndExecute";
import { writeOutboxEntry } from "../../../shared/outbox/outboxWriter";
import type { EventActor } from "../../../shared/events/domainEvent";
import type { Business } from "../models/business";
import { transitionBusinessStatus } from "../models/business";
import type { BusinessStatus } from "../models/businessStatus";
import {
  businessNotFoundError,
  businessTermsConfigurationUnavailableError,
  currentBusinessTermsNotAcceptedError,
} from "../models/businessErrors";
import { buildBusinessLifecycleChangedEvent } from "../events/businessEvents";
import { readBusinessById, writeBusinessUpdate } from "../repositories/businessRepository";
import { readBusinessTermsAcceptanceInTransaction } from "../repositories/businessTermsAcceptanceRepository";
import { getCurrentlyRequiredBusinessTermsVersionInTransaction } from "../repositories/businessTermsConfigRepository";

/**
 * `ENG-P3-002A` (design §37.4/§37.9/§40/§Phase U): the additive
 * `submitBusinessForVerification`-only precondition — "has this Business's
 * current owner accepted the currently-required Terms version." Runs
 * inside `mutation.prepare`, strictly *after* `authorizeAndExecute`'s own
 * permission evaluation (so a caller lacking `business.submitForVerification`
 * entirely is still denied first, never leaking Terms-acceptance state to
 * an unauthorized caller) and strictly *before* `mutation.apply`'s write —
 * both the current-Terms-version read and the acceptance-record read
 * participate in the exact same Firestore transaction as the lifecycle
 * write itself (§Phase V TOCTOU: a concurrent Terms-version change cannot
 * race between "checked acceptance" and "wrote pending_verification" —
 * both commit or abort together, or neither does).
 *
 * Fails closed (`businessTermsConfigurationUnavailableError`) if no
 * current Terms version is configured at all — this task does not invent
 * one (`DEC-LEGAL-002` remains open, Phase Q) — and
 * (`currentBusinessTermsNotAcceptedError`) if the Business's owner has
 * never accepted the current version, or only accepted an older one.
 */
async function assertCurrentBusinessTermsAccepted(
  transaction: Transaction,
  db: Firestore,
  business: Business,
  testOnlyAfterTermsVersionReadHook?: () => Promise<void>,
): Promise<void> {
  const currentTermsVersion = await getCurrentlyRequiredBusinessTermsVersionInTransaction(
    transaction,
    db,
    testOnlyAfterTermsVersionReadHook,
  );
  if (!currentTermsVersion) {
    throw businessTermsConfigurationUnavailableError();
  }
  const acceptance = await readBusinessTermsAcceptanceInTransaction(
    transaction,
    db,
    business.id,
    business.ownerUserId,
    currentTermsVersion,
  );
  if (!acceptance) {
    throw currentBusinessTermsNotAcceptedError();
  }
}

export type TransitionBusinessLifecycleCommandParams = {
  userId: string;
  businessId: string;
  idempotencyKey: string;
  requestHash: string;
  correlationId: string;
  now: Date;
  newId: () => string;
  /**
   * Test-only interleaving hook for the real TOCTOU proof — never supplied
   * by `index.ts`'s transport layer. See `businessTermsConfigRepository.ts`.
   */
  testOnlyAfterTermsVersionReadHook?: () => Promise<void>;
};

export type TransitionBusinessLifecycleResult = {
  businessId: string;
  status: BusinessStatus;
  updatedAt: string;
};

async function transitionBusinessLifecycle(
  db: Firestore,
  permission: string,
  targetStatus: BusinessStatus,
  params: TransitionBusinessLifecycleCommandParams,
  options?: { requireCurrentBusinessTermsAccepted?: boolean },
): Promise<AuthorizeAndExecuteResult<TransitionBusinessLifecycleResult>> {
  const actor: EventActor = { actorType: "user", actorId: params.userId };

  return authorizeAndExecute(db, {
    request: { userId: params.userId, businessId: params.businessId, permission },
    idempotencyKey: params.idempotencyKey,
    requestHash: params.requestHash,
    correlationId: params.correlationId,
    actorId: params.userId,
    mutation: {
      prepare: async (transaction) => {
        const business = await readBusinessById(transaction, db, params.businessId);
        if (!business) {
          throw businessNotFoundError(params.businessId);
        }
        if (options?.requireCurrentBusinessTermsAccepted) {
          await assertCurrentBusinessTermsAccepted(
            transaction,
            db,
            business,
            params.testOnlyAfterTermsVersionReadHook,
          );
        }
        return business;
      },
      apply: (writer, business) => {
        const fromStatus = business.status;
        const { business: updated } = transitionBusinessStatus(business, targetStatus, {
          updatedAt: params.now,
        });
        writeBusinessUpdate(writer, db, updated);

        const event = buildBusinessLifecycleChangedEvent({
          eventId: params.newId(),
          correlationId: params.correlationId,
          actor,
          occurredAt: params.now.toISOString(),
          businessId: params.businessId,
          fromStatus,
          toStatus: updated.status,
        });
        writeOutboxEntry(writer, db, event);

        return {
          businessId: updated.id,
          status: updated.status,
          updatedAt: updated.updatedAt.toISOString(),
        };
      },
    },
  });
}

/** `draft → pending_verification` — Owner-initiated, §6's second lifecycle row. */
export async function submitBusinessForVerificationCommand(
  db: Firestore,
  params: TransitionBusinessLifecycleCommandParams,
): Promise<AuthorizeAndExecuteResult<TransitionBusinessLifecycleResult>> {
  return transitionBusinessLifecycle(
    db,
    "business.submitForVerification",
    "pending_verification",
    params,
    { requireCurrentBusinessTermsAccepted: true },
  );
}

/** Any non-terminal status → `closed` — Owner-initiated half of §6's "any → closed" row. */
export async function closeBusinessCommand(
  db: Firestore,
  params: TransitionBusinessLifecycleCommandParams,
): Promise<AuthorizeAndExecuteResult<TransitionBusinessLifecycleResult>> {
  return transitionBusinessLifecycle(db, "business.close", "closed", params);
}
