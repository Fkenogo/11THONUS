> **Title:** Logging Conventions
> **Version:** 1.0 · **Status:** Active standard (Pass 1) · **Classification:** Supporting Standard
> **Governing document:** [Engineering Standards index](README.md); TRD20 §20.23–20.26; TRD11 §11.36
> **Source-of-truth path:** `docs/03-standards/engineering-standards/logging-conventions.md`
> **Last controlled update:** 2026-07-17 (Engineering Transition Phase 0B — created)

# Logging Conventions

## 1. Scope

This standard operationalizes the already-approved logging architecture in TRD20 §20.22–20.26 (Observability Architecture, Structured Logging, Log Severity, Log Retention, Correlation IDs) and TRD11 §11.36 (Logging) at the code level: one shared logging call every domain uses, so the approved log shape is actually produced consistently rather than reinvented per domain. It does not change the approved shape.

## 2. The Log Schema — Already Approved, Not Reinvented

Every trusted server service uses the exact structured log shape TRD20 §20.23 already defines:

```
type OperationalLog = {
  timestamp: string;
  environment: string;
  severity: "debug" | "info" | "warning" | "error" | "critical";
  domain: string;
  service: string;
  operation: string;
  correlationId: string;
  commandId?: string;
  eventId?: string;
  actorId?: string;
  businessId?: string;
  customerId?: string;
  aggregateType?: string;
  aggregateId?: string;
  result?: string;
  durationMs?: number;
  errorCode?: string;
};
```

Engineering Standards do not add, rename, or remove fields from this shape — a change here is a TRD20 change, not a Pass 1/Pass 2 standards change.

## 3. One Shared Logger

A single shared logging utility, in `src/shared/` (per [Repository and Folder Standards](repository-and-folder-standards.md) §3), is the only supported way to write an `OperationalLog` entry. No domain hand-builds this object inline or uses `console.log`/`console.error` directly in server code — this guarantees every log entry is well-formed and makes the field list in §2 impossible to drift from accidentally. The specific logging transport (Cloud Logging, or an equivalent) is a Phase 1 (ENG-P1-002) implementation choice within this shared utility, not a per-domain choice.

## 4. Severity Usage (TRD20 §20.24)

`debug` — development-only detail, disabled or heavily limited in production. `info` — normal operational activity (the default for successful operations). `warning` — an unexpected condition that did not cause failure (e.g. a retried idempotency conflict that resolved). `error` — the operation failed or needs intervention. `critical` — a severe security, integrity, or availability event. A domain never invents a sixth severity or repurposes one of these five for a different meaning than TRD20 §20.24 defines.

## 5. Correlation IDs (TRD20 §20.26)

Every significant workflow (e.g. Purchase verification → Verified Unit issuance → Loyalty Cycle update → Reward creation → Notification → Reporting projection) carries one correlation ID through every log entry and event it produces, generated at the workflow's entry point and passed explicitly through function calls and event payloads — never regenerated mid-workflow. The correlation-ID service is a Phase 1 shared-foundation deliverable (TRD22 §22.11); every domain consumes it, none reimplements it.

## 6. What Must Never Be Logged (TRD11 §11.36, TRD20 §20.23)

Passwords, OTP values, access tokens, full payment credentials, and unnecessary private profile data are never logged, at any severity. This is enforced at Technical Review as a security finding, not treated as a style preference.

## 7. Log Retention

Retention policy itself (durations, storage tier per log category) is TRD20 §20.25's domain, not this standard's — Engineering Standards ensure logs are *produced* in the shape that lets retention policy be applied; the policy values are an operational configuration set during Phase 1/ deployment setup, not a coding convention.

## 8. What This Standard Does Not Cover

- Error codes and the client-facing error contract — see [Error Handling Conventions](error-handling-conventions.md).
- Monitoring dashboards, alerting thresholds, on-call — TRD20 §20.32–20.36 remain authoritative and are operational, not code-level, concerns.
