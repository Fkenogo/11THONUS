import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { Auth } from "firebase/auth";
import type { Functions } from "firebase/functions";
import { RootEntry } from "./RootEntry";
import { BusinessApiProvider } from "./business/BusinessApiContext";

const mockUseOwnedBusinessesQuery = vi.fn();
vi.mock("./business/hooks/businessQueries", () => ({
  useOwnedBusinessesQuery: () => mockUseOwnedBusinessesQuery(),
}));

const fakeFunctions = {} as Functions;

function neverResolvesAuth(): Auth {
  return { onAuthStateChanged: () => () => {} } as unknown as Auth;
}

function signedOutAuth(): Auth {
  return {
    onAuthStateChanged: (callback: (user: null) => void) => {
      callback(null);
      return () => {};
    },
  } as unknown as Auth;
}

function signedInAuth(): Auth {
  const user = {
    providerData: [{ providerId: "google.com" }],
    getIdToken: () => Promise.resolve("fake-token"),
  };
  return {
    onAuthStateChanged: (callback: (user: unknown) => void) => {
      callback(user);
      return () => {};
    },
  } as unknown as Auth;
}

function renderRoot(auth: Auth) {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <BusinessApiProvider platform={{ auth, functions: fakeFunctions }}>
        <MemoryRouter initialEntries={["/"]}>
          <Routes>
            <Route path="/" element={<RootEntry auth={auth} functions={fakeFunctions} />} />
            <Route path="/business" element={<div>business resolver screen</div>} />
            <Route path="/customer" element={<div>customer shell screen</div>} />
          </Routes>
        </MemoryRouter>
      </BusinessApiProvider>
    </QueryClientProvider>,
  );
}

describe("RootEntry", () => {
  it("never renders blank while auth state is resolving", () => {
    renderRoot(neverResolvesAuth());
    expect(screen.getByRole("status")).toHaveTextContent("Loading…");
  });

  it("renders the sign-in surface for an unauthenticated visitor", async () => {
    renderRoot(signedOutAuth());
    expect(await screen.findByRole("heading", { name: "Sign in" })).toBeInTheDocument();
  });

  it("redirects an authenticated user who owns a business to /business", async () => {
    mockUseOwnedBusinessesQuery.mockReturnValue({
      status: "success",
      data: [{ businessId: "b-1", displayName: "Acme" }],
    });
    renderRoot(signedInAuth());
    expect(await screen.findByText("business resolver screen")).toBeInTheDocument();
  });

  it("routes an authenticated user with no business access to the customer shell", async () => {
    mockUseOwnedBusinessesQuery.mockReturnValue({ status: "success", data: [] });
    renderRoot(signedInAuth());
    expect(await screen.findByText("customer shell screen")).toBeInTheDocument();
  });

  it("shows actionable recovery text when business-access resolution fails", async () => {
    mockUseOwnedBusinessesQuery.mockReturnValue({
      status: "error",
      error: new Error("boom"),
      refetch: vi.fn(),
    });
    renderRoot(signedInAuth());
    expect(await screen.findByText("Something went wrong. Please try again.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
  });

  it("shows a loading state (never blank) while business-access resolution is pending", () => {
    mockUseOwnedBusinessesQuery.mockReturnValue({ status: "pending", data: undefined });
    renderRoot(signedInAuth());
    expect(screen.getByRole("status")).toHaveTextContent("Loading…");
  });
});
