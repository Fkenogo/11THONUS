> **Title:** Error Handling Conventions
> **Version:** 1.0 · **Status:** Active standard (Pass 1) · **Classification:** Supporting Standard
> **Governing document:** [Engineering Standards index](README.md); TRD11 §11.34–11.35
> **Source-of-truth path:** `docs/03-standards/engineering-standards/error-handling-conventions.md`
> **Last controlled update:** 2026-07-17 (Engineering Transition Phase 0B — created)

# Error Handling Conventions

## 1. Scope

This standard operationalizes TRD11 §11.34 (Error Contract) and §11.35 (Error Categories) — already-approved, code-level content — into a consistent implementation pattern every domain follows. It does not add new error categories beyond what TRD11 §11.35 lists; new categories are proposed through the normal document-correction path against TRD11, not invented ad hoc inside a work package.

## 2. The Error Response Shape — Already Approved, Not Reinvented

Every callable and HTTP API returns errors in the exact shape TRD11 §11.34 already defines:

```
type PlatformErrorResponse = {
  code: string;
  messageKey: string;
  correlationId: string;
  retryable: boolean;
  fieldErrors?: Array<{
    field: string;
    code: string;
    messageKey: string;
  }>;
};
```

`messageKey`, never a raw English string, is what the client translates — this is the code-level mechanism that makes TRD13's localization requirements (English/French MVP) actually work for error states, not just for content copy.

## 3. Standard Error Categories (TRD11 §11.35)

`AUTH_REQUIRED`, `AUTH_FORBIDDEN`, `ACCOUNT_SUSPENDED`, `BUSINESS_INACTIVE`, `SUBSCRIPTION_LIMIT_REACHED`, `INVALID_STATE_TRANSITION`, `PURCHASE_ALREADY_RESPONDED`, `REWARD_NOT_AVAILABLE`, `REWARD_ALREADY_REDEEMED`, `IDEMPOTENCY_CONFLICT`, `VALIDATION_FAILED`, `RESOURCE_NOT_FOUND`, `TEMPORARY_UNAVAILABLE`, `INTEGRATION_FAILED`. A domain-specific error uses one of these categories as its `code` where it fits; where none fits, the gap is raised as a documentation-correction item against TRD11 §11.35 rather than silently inventing a new top-level category.

## 4. One Shared Error-Construction Utility

Exactly as with logging ([Logging Conventions](logging-conventions.md) §3), a single shared utility in `src/shared/` constructs `PlatformErrorResponse` objects. Domain code never hand-assembles this object inline. This is the Phase 1 "shared error contract" deliverable named in TRD22 §22.11.

## 5. Raw Errors Never Reach the Client

Per TRD11 §11.34: "Raw internal errors shall never be returned to users." Every Cloud Function catches unexpected exceptions at its boundary, logs the full internal error (per [Logging Conventions](logging-conventions.md), at `error` or `critical` severity, including the underlying error detail), and returns a `PlatformErrorResponse` with a generic `messageKey` (e.g. `TEMPORARY_UNAVAILABLE`) and the log's `correlationId` — so support can trace the incident from the correlation ID without the raw error ever leaving the server boundary.

## 6. Retryable vs. Non-Retryable

`retryable: true` is set only where a client retry with the same idempotency key is safe and potentially productive (e.g. `TEMPORARY_UNAVAILABLE`, `INTEGRATION_FAILED`). Validation and state-transition errors (`VALIDATION_FAILED`, `INVALID_STATE_TRANSITION`, `PURCHASE_ALREADY_RESPONDED`, `REWARD_ALREADY_REDEEMED`) are always `retryable: false` — retrying them cannot change the outcome and the client should not offer a retry action for these.

## 7. Field-Level Errors

`fieldErrors` is populated only for `VALIDATION_FAILED` responses tied to specific input fields (e.g. a form submission). It is never used to smuggle a different error category's detail into a validation-shaped response.

## 8. What This Standard Does Not Cover

- Log content and severity — see [Logging Conventions](logging-conventions.md).
- Client-side error *display* (empty/error state UI patterns) — governed by TRD16 §16.46 (Error Handling) and §16.47 (Correlation and Support References), which already specify the frontend experience this standard's `correlationId`/`messageKey` feed into.
