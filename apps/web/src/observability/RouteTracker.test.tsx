import { useEffect } from "react";
import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useNavigate } from "react-router-dom";
import { RouteTracker } from "./RouteTracker";

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

function Page({ label }: { label: string }) {
  return <p>{label}</p>;
}

function NavigateOnMount({ to }: { to: string }) {
  const navigate = useNavigate();
  useEffect(() => {
    navigate(to);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}

describe("RouteTracker", () => {
  it("adds a navigation breadcrumb for the initial route on mount", () => {
    const service = createServiceSpy();

    render(
      <MemoryRouter initialEntries={["/"]}>
        <RouteTracker service={service} />
        <Routes>
          <Route path="/" element={<Page label="home" />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(service.addBreadcrumb).toHaveBeenCalledTimes(1);
    expect(service.addBreadcrumb.mock.calls[0][0]).toMatchObject({
      category: "navigation",
      message: "/",
    });
  });

  it("adds a new navigation breadcrumb when the route changes", () => {
    const service = createServiceSpy();

    render(
      <MemoryRouter initialEntries={["/"]}>
        <RouteTracker service={service} />
        <Routes>
          <Route path="/" element={<NavigateOnMount to="/next" />} />
          <Route path="/next" element={<Page label="next" />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(service.addBreadcrumb).toHaveBeenCalledTimes(2);
    expect(service.addBreadcrumb.mock.calls[0][0]).toMatchObject({ message: "/" });
    expect(service.addBreadcrumb.mock.calls[1][0]).toMatchObject({ message: "/next" });
  });

  it("renders nothing", () => {
    const service = createServiceSpy();

    const { container } = render(
      <MemoryRouter initialEntries={["/"]}>
        <RouteTracker service={service} />
      </MemoryRouter>,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
