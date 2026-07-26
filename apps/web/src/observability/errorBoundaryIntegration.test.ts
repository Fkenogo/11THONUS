import { describe, expect, it, vi } from "vitest";
import { createRenderErrorHandler } from "./errorBoundaryIntegration";
import type { ObservabilityService } from "./observabilityService";

function createServiceSpy(): ObservabilityService {
  return {
    captureException: vi.fn(),
    captureMessage: vi.fn(),
    addBreadcrumb: vi.fn(),
    setContext: vi.fn(),
    clearContext: vi.fn(),
    setUserContext: vi.fn(),
    flush: vi.fn(async () => undefined),
    isEnabled: () => true,
  };
}

describe("createRenderErrorHandler", () => {
  it("reports the render error through the observability service", () => {
    const service = createServiceSpy();
    const reportRenderError = createRenderErrorHandler(service);
    const error = new Error("render failed");

    reportRenderError(error, { componentStack: "in Widget\nin App" });

    expect(service.captureException).toHaveBeenCalledTimes(1);
    const [reportedError, context] = (service.captureException as ReturnType<typeof vi.fn>).mock
      .calls[0];
    expect(reportedError).toBe(error);
    expect(context).toEqual({ componentStack: "in Widget\nin App" });
  });

  it("omits the context entirely when React supplies no component stack", () => {
    const service = createServiceSpy();
    const reportRenderError = createRenderErrorHandler(service);

    reportRenderError(new Error("render failed"), { componentStack: null });

    const [, context] = (service.captureException as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(context).toBeUndefined();
  });

  it("never throws even if the observability service itself throws", () => {
    const service = createServiceSpy();
    (service.captureException as ReturnType<typeof vi.fn>).mockImplementation(() => {
      throw new Error("service down");
    });
    const reportRenderError = createRenderErrorHandler(service);

    expect(() => reportRenderError(new Error("render failed"), {})).not.toThrow();
  });
});
