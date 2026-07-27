/**
 * End-to-end privacy verification for the Sentry adapter
 * (ENG-P1-003-IMP-03): exercises the *real* `createObservabilityService`
 * wired to the *real* `createSentryProvider`, with only the `@sentry/react`
 * SDK module itself mocked — proving the full pipeline (service
 * sanitization boundary → adapter mapping) never lets raw PII reach the
 * SDK, not merely that each layer is individually sanitized.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createObservabilityService } from "./observabilityService";
import { createSentryProvider } from "./sentryProvider";
import { sanitizeException } from "./sanitizeException";

// `vi.hoisted` (not a plain top-level `const`) is required here — unlike
// `sentryProvider.test.ts`, this file statically imports `./sentryProvider`
// (rather than a dynamic `import()` inside a function), and vitest hoists
// `vi.mock` calls above all imports, including static ones later in the
// file; a plain `const` would still be in its temporal dead zone when the
// hoisted mock factory runs.
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
  });
}

describe("Sentry adapter privacy (end to end through the real service)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("never forwards a raw phone number reaching captureMessage's context to the SDK mock", () => {
    const service = buildEndToEndService();
    service.captureMessage("checkout failed", { phoneNumber: "+257-79-000-0000" });

    const [, sdkContext] = sentryMock.captureMessage.mock.calls[0];
    expect(JSON.stringify(sdkContext)).not.toContain("79-000-0000");
  });

  it("never forwards a raw email address to the SDK mock", () => {
    const service = buildEndToEndService();
    service.captureMessage("checkout failed", { email: "person@example.com" });

    const [, sdkContext] = sentryMock.captureMessage.mock.calls[0];
    expect(JSON.stringify(sdkContext)).not.toContain("person@example.com");
  });

  it("never forwards a raw loyalty number to the SDK mock", () => {
    const service = buildEndToEndService();
    service.captureMessage("redemption failed", { loyaltyNumber: "9999888877776666" });

    const [, sdkContext] = sentryMock.captureMessage.mock.calls[0];
    expect(JSON.stringify(sdkContext)).not.toContain("9999888877776666");
  });

  it("never forwards an authorization header or bearer token embedded in a query string to the SDK mock", () => {
    const service = buildEndToEndService();
    service.captureMessage(
      "request failed: https://api.example.test/callback?token=abcDEF123456789012345XYZ",
      undefined,
    );

    const [message] = sentryMock.captureMessage.mock.calls[0];
    expect(message).not.toContain("abcDEF123456789012345XYZ");
  });

  it("never forwards raw exception custom properties containing a secret to the SDK mock", () => {
    const service = buildEndToEndService();
    const error = new Error("boom") as Error & { sessionCookie?: string };
    error.sessionCookie = "sid=abcdef1234567890abcdef";
    service.captureException(error);

    const [reportableError, context] = sentryMock.captureException.mock.calls[0];
    expect(reportableError.message).toBe("boom");
    expect(JSON.stringify(context)).not.toContain("abcdef1234567890abcdef");
  });

  it("keeps a bounded, sanitized breadcrumb payload — no raw sensitive field survives to the SDK mock", () => {
    const service = buildEndToEndService();
    service.addBreadcrumb({
      category: "navigation",
      message: "user updated profile",
      data: { customerQrCode: "QR-SECRET-CODE-001", to: "/profile" },
    });

    const [sdkBreadcrumb] = sentryMock.addBreadcrumb.mock.calls[0];
    expect(sdkBreadcrumb.data.customerQrCode).toBe("[REDACTED]");
    expect(sdkBreadcrumb.data.to).toBe("/profile");
  });

  it("excludes any identity field not on the approved allow-list from the SDK mock's setUser call", () => {
    const service = buildEndToEndService();
    // Bypasses compile-time typing the way a real caller could at runtime
    // (matches the precedent in observabilityService.test.ts's CR1 tests).
    const overBroad = { actorId: "actor-1", customerName: "Alice Example" } as never;
    service.setUserContext(overBroad);

    const [sdkUser] = sentryMock.setUser.mock.calls[0];
    expect(sdkUser).not.toHaveProperty("customerName");
    expect(sdkUser.actorId).toBe("actor-1");
  });

  it("confirms sanitizeException already redacts an embedded secret before the adapter ever sees it (defense at the correct layer, not duplicated in the adapter)", () => {
    const error = new Error("token=abcDEF123456789012345XYZ leaked in message");
    const sanitized = sanitizeException(error);
    expect(sanitized.message).not.toContain("abcDEF123456789012345XYZ");
  });
});
