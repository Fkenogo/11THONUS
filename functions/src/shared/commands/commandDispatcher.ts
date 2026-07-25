/**
 * Command dispatcher (ENG-P1-002, corrected under ENG-P1-002-CR1).
 *
 * The shared `authenticate → validate → log → respond` orchestrator
 * every future domain command handler wraps itself in — the central
 * deliverable of this work package (Engineering Implementation Programme
 * objective: "Every domain service can reuse one authenticate→validate→
 * log→respond command shape"; TRD22 §22.11 exit criterion: "shared
 * server command can authenticate, validate, log and return a standard
 * response").
 *
 * Idempotency ownership is acquired via a single atomic
 * `checkAndReserveIdempotencyKey` call (ENG-P1-002-CR1 Correction A) —
 * only one concurrent caller can ever observe "acquired" for a given key;
 * every other concurrent caller observes "in_progress"/"duplicate"/
 * "conflict" instead and never invokes the handler. "in_progress" and a
 * "duplicate" record with no cached response both return a retryable
 * `TEMPORARY_UNAVAILABLE` error rather than a fabricated success.
 *
 * Business logic itself is domain-specific and out of this work
 * package's scope — the caller supplies a `handler`. A handler signals
 * an expected business failure by throwing `DomainCommandError`; any
 * other thrown value is treated as an unexpected bug and rethrown after
 * logging and marking the idempotency key `failed` — it is never
 * swallowed (no event/error disappears silently, matching the outbox
 * processor's own discipline).
 */

import { createHash } from "node:crypto";
import type { Firestore } from "firebase-admin/firestore";
import type { CommandActor, CommandEnvelope } from "./commandEnvelope";
import { resolveCorrelationId } from "../correlation/correlationId";
import type { PlatformErrorResponse, PlatformFieldError } from "../errors/platformError";
import { createPlatformError } from "../errors/platformError";
import type { ErrorCategory } from "../errors/errorCategories";
import { log } from "../logging/logger";
import {
  checkAndReserveIdempotencyKey,
  completeIdempotencyKey,
  failIdempotencyKey,
} from "../idempotency/idempotencyService";
import { resolveTrustedActor } from "../validation/actorValidation";
import type { TrustedAuthContext } from "../validation/actorValidation";
import { isValidCommandEnvelopeShape } from "../validation/requestValidation";

export class DomainCommandError extends Error {
  readonly category: ErrorCategory;
  readonly fieldErrors?: PlatformFieldError[];

  constructor(category: ErrorCategory, message: string, fieldErrors?: PlatformFieldError[]) {
    super(message);
    this.category = category;
    this.fieldErrors = fieldErrors;
  }
}

export type CommandHandler<TPayload, TResult> = (
  payload: TPayload,
  actor: CommandActor,
  correlationId: string,
) => Promise<TResult>;

export type DispatchCommandParams<TPayload, TResult> = {
  db: Firestore;
  rawEnvelope: unknown;
  auth: TrustedAuthContext;
  domain: string;
  service: string;
  operation: string;
  handler: CommandHandler<TPayload, TResult>;
};

export type DispatchCommandResult<TResult> =
  | { outcome: "success"; result: TResult; fromCache: boolean }
  | { outcome: "error"; error: PlatformErrorResponse };

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(canonicalize);
  }
  if (value !== null && typeof value === "object") {
    const sorted: Record<string, unknown> = {};
    for (const key of Object.keys(value as Record<string, unknown>).sort()) {
      sorted[key] = canonicalize((value as Record<string, unknown>)[key]);
    }
    return sorted;
  }
  return value;
}

function hashPayload(payload: unknown): string {
  return createHash("sha256")
    .update(JSON.stringify(canonicalize(payload)))
    .digest("hex");
}

export async function dispatchCommand<TPayload, TResult>(
  params: DispatchCommandParams<TPayload, TResult>,
): Promise<DispatchCommandResult<TResult>> {
  const startedAt = Date.now();
  const environment = process.env["ENVIRONMENT"] ?? "unknown";

  if (!isValidCommandEnvelopeShape(params.rawEnvelope)) {
    const correlationId = resolveCorrelationId(undefined);
    const error = createPlatformError(
      "VALIDATION_FAILED",
      "errors.commandEnvelopeShapeInvalid",
      correlationId,
    );
    log({
      timestamp: new Date().toISOString(),
      environment,
      severity: "warning",
      domain: params.domain,
      service: params.service,
      operation: params.operation,
      correlationId,
      result: "validation_failed",
      durationMs: Date.now() - startedAt,
      errorCode: error.code,
    });
    return { outcome: "error", error };
  }

  const envelope = params.rawEnvelope as CommandEnvelope<TPayload>;
  const correlationId = resolveCorrelationId(envelope.correlationId);
  const actor = resolveTrustedActor(params.auth);

  const logBase = {
    timestamp: new Date().toISOString(),
    environment,
    domain: params.domain,
    service: params.service,
    operation: params.operation,
    correlationId,
    commandId: envelope.commandId,
    actorId: actor.userId,
    ...(actor.businessId ? { businessId: actor.businessId } : {}),
  };

  const requestHash = hashPayload(envelope.payload);
  const reservation = await checkAndReserveIdempotencyKey(params.db, {
    idempotencyKey: envelope.idempotencyKey,
    operationType: envelope.commandType,
    actorId: actor.userId,
    requestHash,
    correlationId,
    ...(actor.businessId ? { businessId: actor.businessId } : {}),
  });

  if (reservation.outcome === "conflict") {
    log({
      ...logBase,
      severity: "warning",
      result: "idempotency_conflict",
      errorCode: reservation.error.code,
    });
    return { outcome: "error", error: reservation.error };
  }

  if (reservation.outcome === "in_progress") {
    const error = createPlatformError(
      "TEMPORARY_UNAVAILABLE",
      "errors.idempotencyInProgress",
      correlationId,
      { retryable: true },
    );
    log({ ...logBase, severity: "info", result: "in_progress", errorCode: error.code });
    return { outcome: "error", error };
  }

  if (reservation.outcome === "duplicate") {
    if (reservation.record.responseSnapshot === undefined) {
      // A "completed" idempotency record with no cached response is an
      // anomalous state under this dispatcher's own write path (it always
      // supplies a responseSnapshot to completeIdempotencyKey on success) —
      // never fabricate a success from an absent body.
      const error = createPlatformError(
        "TEMPORARY_UNAVAILABLE",
        "errors.idempotencyResponseUnavailable",
        correlationId,
        { retryable: true },
      );
      log({
        ...logBase,
        severity: "critical",
        result: "idempotency_response_missing",
        errorCode: error.code,
      });
      return { outcome: "error", error };
    }

    log({ ...logBase, severity: "info", result: "duplicate" });
    return {
      outcome: "success",
      result: reservation.record.responseSnapshot as TResult,
      fromCache: true,
    };
  }

  try {
    const result = await params.handler(envelope.payload, actor, correlationId);
    await completeIdempotencyKey(params.db, envelope.idempotencyKey, undefined, result);
    log({ ...logBase, severity: "info", result: "success", durationMs: Date.now() - startedAt });
    return { outcome: "success", result, fromCache: false };
  } catch (thrown) {
    await failIdempotencyKey(params.db, envelope.idempotencyKey);

    if (thrown instanceof DomainCommandError) {
      const error = createPlatformError(thrown.category, thrown.message, correlationId, {
        ...(thrown.fieldErrors ? { fieldErrors: thrown.fieldErrors } : {}),
      });
      log({
        ...logBase,
        severity: "warning",
        result: "domain_error",
        durationMs: Date.now() - startedAt,
        errorCode: error.code,
      });
      return { outcome: "error", error };
    }

    log({
      ...logBase,
      severity: "critical",
      result: "unexpected_error",
      durationMs: Date.now() - startedAt,
    });
    throw thrown;
  }
}
