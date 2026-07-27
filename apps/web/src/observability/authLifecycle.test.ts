import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Auth, User } from "firebase/auth";
import { registerAuthLifecycle } from "./authLifecycle";
import {
  clearCorrelationId,
  getCurrentCorrelationId,
  setCorrelationId,
} from "./correlationContext";

type Callback = (user: User | null) => void;
const callbacks: Callback[] = [];

vi.mock("firebase/auth", () => ({
  onAuthStateChanged: vi.fn((_auth: Auth, callback: Callback) => {
    callbacks.push(callback);
    return () => {
      const index = callbacks.indexOf(callback);
      if (index >= 0) callbacks.splice(index, 1);
    };
  }),
}));

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

describe("registerAuthLifecycle", () => {
  beforeEach(() => {
    callbacks.length = 0;
    clearCorrelationId();
  });

  it("clears the correlation id when the auth state transitions to signed-out", () => {
    setCorrelationId("some-workflow-id");
    const service = createServiceSpy();
    registerAuthLifecycle({} as Auth, service);

    callbacks[0](null);

    expect(getCurrentCorrelationId()).toBeUndefined();
  });

  it("clears observability user context when the auth state transitions to signed-out", () => {
    const service = createServiceSpy();
    registerAuthLifecycle({} as Auth, service);

    callbacks[0](null);

    expect(service.setUserContext).toHaveBeenCalledWith(undefined);
  });

  it("does not clear correlation or user context when a user is signed in", () => {
    setCorrelationId("active-workflow-id");
    const service = createServiceSpy();
    registerAuthLifecycle({} as Auth, service);

    callbacks[0]({ uid: "user-1" } as User);

    expect(getCurrentCorrelationId()).toBe("active-workflow-id");
    expect(service.setUserContext).not.toHaveBeenCalled();
  });

  it("returns the unsubscribe function Firebase provides", () => {
    const service = createServiceSpy();
    const unsubscribe = registerAuthLifecycle({} as Auth, service);

    expect(typeof unsubscribe).toBe("function");
    unsubscribe();
    expect(callbacks.length).toBe(0);
  });
});
