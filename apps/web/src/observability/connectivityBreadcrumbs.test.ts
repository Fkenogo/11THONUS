import { afterEach, describe, expect, it, vi } from "vitest";
import { registerConnectivityBreadcrumbs } from "./connectivityBreadcrumbs";

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

describe("registerConnectivityBreadcrumbs", () => {
  it("adds a breadcrumb when the browser goes offline", () => {
    const service = createServiceSpy();
    unregister = registerConnectivityBreadcrumbs(service);

    window.dispatchEvent(new Event("offline"));

    expect(service.addBreadcrumb).toHaveBeenCalledTimes(1);
    expect(service.addBreadcrumb.mock.calls[0][0]).toMatchObject({
      category: "connectivity",
      message: "offline",
    });
  });

  it("adds a breadcrumb when the browser comes back online", () => {
    const service = createServiceSpy();
    unregister = registerConnectivityBreadcrumbs(service);

    window.dispatchEvent(new Event("online"));

    expect(service.addBreadcrumb).toHaveBeenCalledTimes(1);
    expect(service.addBreadcrumb.mock.calls[0][0]).toMatchObject({
      category: "connectivity",
      message: "online",
    });
  });

  it("does not register the same listeners twice when called again without unregistering", () => {
    const service = createServiceSpy();
    unregister = registerConnectivityBreadcrumbs(service);
    const secondUnregister = registerConnectivityBreadcrumbs(service);

    window.dispatchEvent(new Event("offline"));

    expect(service.addBreadcrumb).toHaveBeenCalledTimes(1);
    secondUnregister();
  });

  it("stops reporting after the returned unregister function is called", () => {
    const service = createServiceSpy();
    const stop = registerConnectivityBreadcrumbs(service);
    stop();

    window.dispatchEvent(new Event("offline"));
    window.dispatchEvent(new Event("online"));

    expect(service.addBreadcrumb).not.toHaveBeenCalled();
  });

  it("never throws even if the observability service itself throws", () => {
    const service = createServiceSpy();
    service.addBreadcrumb.mockImplementation(() => {
      throw new Error("observability down");
    });
    unregister = registerConnectivityBreadcrumbs(service);

    expect(() => window.dispatchEvent(new Event("offline"))).not.toThrow();
  });
});
