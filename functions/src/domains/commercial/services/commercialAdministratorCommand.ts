/**
 * Shared runner for Platform-Administrator Commercial commands (`WP-COM-02`).
 *
 * Composes the WP-COM-01 primitives in the only sanctioned order and adds
 * nothing new to authority, idempotency or audit:
 *
 *   1. authority  -- `authorizeCommercialAdministrator` (active administrator
 *                    record + genuinely verified MFA; one enumeration-resistant
 *                    denial; no role, no Business-side authority);
 *   2. idempotency -- `runCommercialCommand` (key bound to command type +
 *                    actor + payload hash; reserve / mutate / complete in ONE
 *                    transaction, so any failure rolls the reservation back);
 *   3. the command body, which writes its mutation AND its audit row inside
 *      that same transaction.
 *
 * A rejected attempt (idempotency conflict, or a state/reference conflict the
 * body raised) rolls its transaction back, so it cannot audit itself there.
 * When the caller supplies a `rejectionAudit` spec, a `denied` audit row is
 * therefore written in a SEPARATE transaction, best-effort: an audit failure
 * never masks the original domain error. Authority denials are not audited
 * (the caller is not an established administrator; there is no trustworthy
 * actor to attribute).
 */

import { createHash } from "node:crypto";
import { withPlatformTransaction } from "../../../infrastructure/postgres/postgresTransaction";
import type { PlatformPostgresPool } from "../../../infrastructure/postgres/postgresPool";
import type { PlatformPostgresTransaction } from "../../../infrastructure/postgres/postgresTransaction";
import type { ErrorCategory } from "../../../shared/errors/errorCategories";
import {
  CommercialDomainError,
  commercialAuthorityDeniedError,
  commercialCommandInProgressError,
  commercialIdempotencyConflictError,
  commercialValidationError,
} from "../models/commercialErrors";
import type { CommercialActor, CommercialAuditActionType } from "../models/commercialFoundation";
import { appendCommercialAuditEvent } from "../repositories/commercialAuditRepository";
import {
  authorizeCommercialAdministrator,
  type PlatformAdministratorRecordReader,
} from "./commercialAuthority";
import { runCommercialCommand } from "./commercialIdempotency";

export type CommercialCommandDeps = {
  readonly pool: PlatformPostgresPool;
  readonly readAdministratorRecord: PlatformAdministratorRecordReader;
  /** Injectable clock for deterministic tests; defaults to the system clock. */
  readonly now?: () => Date;
};

export type CommercialCommandContext = {
  readonly adminUserId: string;
  /** Must come from `deriveVerifiedMfaSatisfied`, never from a client flag. */
  readonly verifiedMfaSatisfied: boolean;
  /** Client-supplied idempotency key. */
  readonly idempotencyKey: string;
  readonly correlationId: string;
};

/** `replayed` is true when the stored result of an earlier identical execution was returned. */
export type CommercialCommandResponse<T> = { readonly replayed: boolean; readonly result: T };

export type CommercialRejectionAuditSpec = {
  readonly actionType: CommercialAuditActionType;
  readonly businessId: string;
  readonly targetType: string;
  readonly targetId: string;
  readonly reference?: string;
  /** Domain error categories that produce a `denied` audit row. */
  readonly auditedCategories: readonly ErrorCategory[];
};

export type AdministratorCommandSpec = {
  readonly commandType: string;
  /** Everything that defines the request (excluding the key and correlation id). Hashed. */
  readonly payload: unknown;
  readonly rejectionAudit?: CommercialRejectionAuditSpec;
};

/** Deterministic hash: object keys are sorted so key order never changes the hash. */
export function hashCommercialPayload(payload: unknown): string {
  return createHash("sha256").update(canonicalJson(payload)).digest("hex");
}

function canonicalJson(value: unknown): string {
  if (value instanceof Date) {
    // An invalid Date must still hash (validation rejects it later) rather than throw here.
    return JSON.stringify(Number.isNaN(value.getTime()) ? "invalid-date" : value.toISOString());
  }
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value !== null && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, v]) => v !== undefined)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
    return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${canonicalJson(v)}`).join(",")}}`;
  }
  return JSON.stringify(value ?? null);
}

function requireText(name: string, value: unknown): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw commercialValidationError(`${name} is required.`);
  }
  return value;
}

export async function runAdministratorCommand<T>(
  deps: CommercialCommandDeps,
  context: CommercialCommandContext,
  spec: AdministratorCommandSpec,
  body: (
    tx: PlatformPostgresTransaction,
    actor: CommercialActor,
  ) => Promise<{ readonly result: T; readonly resultReference?: string }>,
): Promise<CommercialCommandResponse<T>> {
  const decision = await authorizeCommercialAdministrator(deps.readAdministratorRecord, {
    adminUserId: context.adminUserId,
    verifiedMfaSatisfied: context.verifiedMfaSatisfied,
  });
  if (!decision.authorized) throw commercialAuthorityDeniedError();
  const actor = decision.actor;

  const idempotencyKey = requireText("idempotencyKey", context.idempotencyKey);
  const correlationId = requireText("correlationId", context.correlationId);

  try {
    const outcome = await runCommercialCommand(
      deps.pool,
      {
        idempotencyKey,
        commandType: spec.commandType,
        actorId: actor.id,
        requestHash: hashCommercialPayload(spec.payload),
        correlationId,
      },
      (tx) => body(tx, actor),
    );
    switch (outcome.outcome) {
      case "executed":
        return { replayed: false, result: outcome.result };
      case "duplicate":
        return { replayed: true, result: outcome.responseSnapshot as T };
      case "in_progress":
        throw commercialCommandInProgressError();
      case "conflict":
        throw commercialIdempotencyConflictError();
    }
  } catch (error) {
    const audit = spec.rejectionAudit;
    if (
      audit !== undefined &&
      error instanceof CommercialDomainError &&
      audit.auditedCategories.includes(error.category)
    ) {
      await auditRejection(deps.pool, actor, audit, idempotencyKey, correlationId, error);
    }
    throw error;
  }
}

async function auditRejection(
  pool: PlatformPostgresPool,
  actor: CommercialActor,
  audit: CommercialRejectionAuditSpec,
  idempotencyKey: string,
  correlationId: string,
  error: CommercialDomainError,
): Promise<void> {
  try {
    await withPlatformTransaction(pool, async (tx) => {
      // No `idempotencyKey` column value: the (key, action) audit uniqueness belongs to the
      // ORIGINAL execution, and a rejected attempt must never collide with (or replace) it.
      await appendCommercialAuditEvent(tx, {
        actor,
        actionType: audit.actionType,
        targetType: audit.targetType,
        targetId: audit.targetId,
        businessId: audit.businessId,
        reasonText: `Rejected: ${error.message}`,
        reference: audit.reference,
        correlationId,
        result: "denied",
        afterSnapshot: {
          rejectedCategory: error.category,
          attemptedIdempotencyKey: idempotencyKey,
        },
      });
    });
  } catch {
    // Best-effort by design: never mask the original domain error.
  }
}
