/**
 * Cross-stage integration boundaries for the Sentry adapter
 * (ENG-P1-003-IMP-03): proves the Stage 2 pieces this stage did not
 * touch — the correlation lifecycle and the React error boundary —
 * still compose correctly once a real (SDK-mocked) Sentry provider is
 * wired in, not only with the no-op provider.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import { createElement } from "react";
import { createObservabilityService } from "./observabilityService";
import { createSentryProvider } from "./sentryProvider";
import { beginWorkflow, clearCorrelationId, getCurrentCorrelationId } from "./correlationContext";
import { ObservabilityErrorBoundary } from "./ErrorBoundary";

const sentryMock = vi.hoisted(() => ({
  init: vi.fn(),
  captureException: vi.fn(),
  captureMessage: vi.fn(),
  addBreadcrumb: vi.fn(),
  setContext: vi.fn(),
  setUser: vi.fn(),
  flush: vi.fn(async () => true),
}));

vi.mock("@sentry/react", () => sentryMock);

function buildEndToEndService() {
  const provider = createSentryProvider({ dsn: "https://example.test/1", environment: "test" });
  return createObservabilityService({
    config: { enabled: true, provider: "sentry", environment: "test" },
    provider,
    getCorrelationId: getCurrentCorrelationId,
  });
}

function Bomb(): never {
  throw new Error("render failure");
}

describe("Sentry adapter cross-stage integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearCorrelationId();
  });

  it("carries the Stage 2 correlation-lifecycle ID through to the Sentry SDK mock's captured event", () => {
    const service = buildEndToEndService();
    const workflowId = beginWorkflow();

    service.captureMessage("checkout started");

    const [, context] = sentryMock.captureMessage.mock.calls[0];
    expect(context.extra.correlationId).toBe(workflowId);
  });

  it("does not attach a correlation id once the workflow has ended (endWorkflow/clearCorrelationId)", () => {
    const service = buildEndToEndService();
    const workflowId = beginWorkflow();
    clearCorrelationId();

    service.captureMessage("after workflow ended");

    const [, context] = sentryMock.captureMessage.mock.calls[0];
    expect(context.extra?.correlationId).toBeUndefined();
    expect(context.extra?.correlationId).not.toBe(workflowId);
  });

  it("Stage 2's ObservabilityErrorBoundary still reports through the provider-neutral service when backed by the Sentry adapter", () => {
    const originalConsoleError = console.error;
    console.error = vi.fn();

    const service = buildEndToEndService();
    render(createElement(ObservabilityErrorBoundary, { service, children: createElement(Bomb) }));

    console.error = originalConsoleError;

    expect(sentryMock.captureException).toHaveBeenCalledTimes(1);
    const [reportableError] = sentryMock.captureException.mock.calls[0];
    expect(reportableError.message).toBe("render failure");
  });
});
