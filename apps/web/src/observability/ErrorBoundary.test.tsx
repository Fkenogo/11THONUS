import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ObservabilityErrorBoundary } from "./ErrorBoundary";
import { createObservabilityService } from "./observabilityService";
import { createNoopProvider } from "./noopProvider";

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

function Bomb(): never {
  throw new Error("secret-key-value-should-not-render-1234567890");
}

// React logs the caught error to the console by default — suppress the
// expected noise for these tests only.
const originalConsoleError = console.error;

describe("ObservabilityErrorBoundary", () => {
  it("invokes the provider-neutral service when a child throws during render", () => {
    console.error = vi.fn();
    const service = createServiceSpy();
    render(
      <ObservabilityErrorBoundary service={service}>
        <Bomb />
      </ObservabilityErrorBoundary>,
    );
    console.error = originalConsoleError;

    expect(service.captureException).toHaveBeenCalledTimes(1);
  });

  it("attaches sanitized component-stack information as context", () => {
    console.error = vi.fn();
    const service = createServiceSpy();
    render(
      <ObservabilityErrorBoundary service={service}>
        <Bomb />
      </ObservabilityErrorBoundary>,
    );
    console.error = originalConsoleError;

    const [, context] = service.captureException.mock.calls[0];
    expect(typeof context.componentStack).toBe("string");
    expect(context.componentStack.length).toBeGreaterThan(0);
  });

  it("renders a fallback that does not display the internal exception message", () => {
    console.error = vi.fn();
    const service = createServiceSpy();
    render(
      <ObservabilityErrorBoundary service={service}>
        <Bomb />
      </ObservabilityErrorBoundary>,
    );
    console.error = originalConsoleError;

    expect(screen.queryByText(/secret-key-value-should-not-render/)).toBeNull();
    expect(screen.getByText("Something went wrong.")).toBeInTheDocument();
  });

  it("renders children normally when nothing throws", () => {
    const service = createServiceSpy();
    render(
      <ObservabilityErrorBoundary service={service}>
        <p>all good</p>
      </ObservabilityErrorBoundary>,
    );

    expect(screen.getByText("all good")).toBeInTheDocument();
    expect(service.captureException).not.toHaveBeenCalled();
  });

  it("works end to end with the real observability service backed only by the no-op provider", () => {
    console.error = vi.fn();
    const service = createObservabilityService({
      config: { enabled: false, provider: "noop", environment: "test" },
      provider: createNoopProvider(),
    });

    expect(() =>
      render(
        <ObservabilityErrorBoundary service={service}>
          <Bomb />
        </ObservabilityErrorBoundary>,
      ),
    ).not.toThrow();
    console.error = originalConsoleError;

    expect(screen.getByText("Something went wrong.")).toBeInTheDocument();
  });

  it("still renders the fallback even if the observability service itself throws", () => {
    console.error = vi.fn();
    const service = createServiceSpy();
    service.captureException.mockImplementation(() => {
      throw new Error("observability is down");
    });

    expect(() =>
      render(
        <ObservabilityErrorBoundary service={service}>
          <Bomb />
        </ObservabilityErrorBoundary>,
      ),
    ).not.toThrow();
    console.error = originalConsoleError;

    expect(screen.getByText("Something went wrong.")).toBeInTheDocument();
  });

  it("offers a reload action that does not expose internal error details", () => {
    console.error = vi.fn();
    const service = createServiceSpy();
    render(
      <ObservabilityErrorBoundary service={service}>
        <Bomb />
      </ObservabilityErrorBoundary>,
    );
    console.error = originalConsoleError;

    expect(screen.getByRole("button", { name: /reload/i })).toBeInTheDocument();
  });
});
