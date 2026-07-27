/**
 * Error-boundary integration point (ENG-P1-003-IMP-01).
 *
 * Per the ENG-P1-003 Operational Observability Blueprint §6.7: prepares
 * the integration point a later React error boundary needs, without
 * building the boundary component itself (no UI, no Sentry-specific
 * React component — that is future-stage work, §14 of the blueprint).
 *
 * `CapturedRenderInfo` mirrors the shape React's own
 * `componentDidCatch`/`onCaughtError` supplies (a nullable
 * `componentStack`) without importing a React type here, keeping this
 * module usable from any future error boundary implementation.
 */

import type { DiagnosticContext } from "./types";
import type { ObservabilityService } from "./observabilityService";

export type CapturedRenderInfo = {
  componentStack?: string | null;
};

export function createRenderErrorHandler(
  service: ObservabilityService,
): (error: Error, info: CapturedRenderInfo) => void {
  return function reportRenderError(error: Error, info: CapturedRenderInfo): void {
    const context: DiagnosticContext | undefined = info.componentStack
      ? { componentStack: info.componentStack }
      : undefined;
    try {
      service.captureException(error, context);
    } catch {
      // The render-error handler itself must never throw — a failure
      // here would turn an observability concern into a second,
      // worse rendering failure.
    }
  };
}
