/**
 * Shared error contract (ENG-P1-002).
 *
 * `PlatformErrorResponse`, exactly as TRD11 §11.34 defines it. Every
 * callable/HTTP API returns this shape on failure. Raw internal errors
 * are never returned to users; customer-facing applications translate
 * `messageKey`, never `code` directly.
 *
 * `retryable` defaults to `false` when not specified — a request-shape
 * choice, not a TRD rule, and the safer default: TRD11 §11.29 lists most
 * of the categories this contract carries (invalid permissions,
 * unsupported state transition, an already-completed idempotency
 * conflict) as *non-retryable* failures, so treating retryability as an
 * explicit opt-in matches that classification rather than the reverse.
 */

import type { ErrorCategory } from "./errorCategories";

export type PlatformFieldError = {
  field: string;
  code: string;
  messageKey: string;
};

export type PlatformErrorResponse = {
  code: ErrorCategory;
  messageKey: string;
  correlationId: string;
  retryable: boolean;
  fieldErrors?: PlatformFieldError[];
};

export type CreatePlatformErrorOptions = {
  retryable?: boolean;
  fieldErrors?: PlatformFieldError[];
};

export function createPlatformError(
  category: ErrorCategory,
  messageKey: string,
  correlationId: string,
  options?: CreatePlatformErrorOptions,
): PlatformErrorResponse {
  return {
    code: category,
    messageKey,
    correlationId,
    retryable: options?.retryable ?? false,
    ...(options?.fieldErrors ? { fieldErrors: options.fieldErrors } : {}),
  };
}
