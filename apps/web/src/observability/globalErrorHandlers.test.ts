import { afterEach, describe, expect, it, vi } from "vitest";
import { registerGlobalErrorHandlers } from "./globalErrorHandlers";

function createServiceSpy() {
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

let unregister: (() => void) | undefined;

afterEach(() => {
  unregister?.();
  unregister = undefined;
});

describe("registerGlobalErrorHandlers", () => {
  it("reports an uncaught error through the observability service", () => {
    const service = createServiceSpy();
    unregister = registerGlobalErrorHandlers(service);

    const error = new Error("uncaught boom");
    window.dispatchEvent(Object.assign(new Event("error"), { error, message: error.message }));

    expect(service.captureException).toHaveBeenCalledTimes(1);
    expect(service.captureException.mock.calls[0][0]).toBe(error);
  });

  it("reports an unhandled promise rejection through the observability service", () => {
    const service = createServiceSpy();
    unregister = registerGlobalErrorHandlers(service);

    const reason = new Error("unhandled rejection boom");
    const event = Object.assign(new Event("unhandledrejection"), {
      reason,
      promise: Promise.resolve(),
    });
    window.dispatchEvent(event);

    expect(service.captureException).toHaveBeenCalledTimes(1);
    expect(service.captureException.mock.calls[0][0]).toBe(reason);
  });

  it("does not register the same listeners twice when called again without unregistering", () => {
    const service = createServiceSpy();
    unregister = registerGlobalErrorHandlers(service);
    const secondUnregister = registerGlobalErrorHandlers(service);

    window.dispatchEvent(
      Object.assign(new Event("error"), { error: new Error("once"), message: "once" }),
    );

    expect(service.captureException).toHaveBeenCalledTimes(1);
    secondUnregister();
  });

  it("stops reporting after the returned unregister function is called", () => {
    const service = createServiceSpy();
    const stop = registerGlobalErrorHandlers(service);
    stop();

    // No listener remains registered by `registerGlobalErrorHandlers` at
    // this point (that is exactly what's under test), so nothing calls
    // `preventDefault()` on this synthetic event and jsdom's default
    // action — reporting it as an uncaught exception — would otherwise
    // fire. This unrelated, test-only listener only suppresses that
    // default action; it does not touch `service.captureException`.
    const suppressDefaultAction = (event: Event) => event.preventDefault();
    window.addEventListener("error", suppressDefaultAction);
    try {
      window.dispatchEvent(
        Object.assign(new Event("error"), { error: new Error("after teardown"), message: "x" }),
      );
    } finally {
      window.removeEventListener("error", suppressDefaultAction);
    }

    expect(service.captureException).not.toHaveBeenCalled();
  });

  it("never throws even if the observability service itself throws", () => {
    const service = createServiceSpy();
    service.captureException.mockImplementation(() => {
      throw new Error("observability down");
    });
    unregister = registerGlobalErrorHandlers(service);

    expect(() =>
      window.dispatchEvent(
        Object.assign(new Event("error"), { error: new Error("boom"), message: "boom" }),
      ),
    ).not.toThrow();
  });
});
