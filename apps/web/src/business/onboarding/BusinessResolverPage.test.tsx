import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BusinessResolverPage } from "./BusinessResolverPage";

const mockUseOwnedBusinessesQuery = vi.fn();
vi.mock("../hooks/businessQueries", () => ({
  useOwnedBusinessesQuery: () => mockUseOwnedBusinessesQuery(),
}));

function renderResolver() {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/business"]}>
        <Routes>
          <Route path="/business" element={<BusinessResolverPage />} />
          <Route path="/business/new" element={<div>new business screen</div>} />
          <Route path="/business/:businessId" element={<div>business context screen</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("BusinessResolverPage", () => {
  it("shows a loading state while the owned-businesses query is pending", () => {
    mockUseOwnedBusinessesQuery.mockReturnValue({ status: "pending", data: undefined });
    renderResolver();
    expect(screen.queryByText("new business screen")).not.toBeInTheDocument();
  });

  it("routes to /business/new when the owner has zero businesses", async () => {
    mockUseOwnedBusinessesQuery.mockReturnValue({ status: "success", data: [] });
    renderResolver();
    expect(await screen.findByText("new business screen")).toBeInTheDocument();
  });

  it("routes directly to the single owned business when there is exactly one", async () => {
    mockUseOwnedBusinessesQuery.mockReturnValue({
      status: "success",
      data: [
        {
          businessId: "b-1",
          businessCode: "BC-1",
          displayName: "Acme",
          status: "draft",
          primaryCategoryId: "c-1",
        },
      ],
    });
    renderResolver();
    expect(await screen.findByText("business context screen")).toBeInTheDocument();
  });

  it("shows a bounded selection list when the owner has multiple businesses", async () => {
    mockUseOwnedBusinessesQuery.mockReturnValue({
      status: "success",
      data: [
        {
          businessId: "b-1",
          businessCode: "BC-1",
          displayName: "Acme",
          status: "draft",
          primaryCategoryId: "c-1",
        },
        {
          businessId: "b-2",
          businessCode: "BC-2",
          displayName: "Beta",
          status: "pending_verification",
          primaryCategoryId: "c-1",
        },
      ],
    });
    renderResolver();
    expect(await screen.findByRole("link", { name: "Acme" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Beta" })).toBeInTheDocument();
  });
});
