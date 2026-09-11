import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BusinessResolverPage } from "./BusinessResolverPage";

const mockUseAccessibleBusinessesQuery = vi.fn();
vi.mock("../hooks/businessQueries", () => ({
  useAccessibleBusinessesQuery: () => mockUseAccessibleBusinessesQuery(),
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
          <Route
            path="/business/:businessId/dashboard"
            element={<div>business dashboard screen</div>}
          />
          <Route path="/customer" element={<div>customer shell screen</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("BusinessResolverPage", () => {
  it("shows a loading state while the owned-businesses query is pending", () => {
    mockUseAccessibleBusinessesQuery.mockReturnValue({ status: "pending", data: undefined });
    renderResolver();
    expect(screen.queryByText("new business screen")).not.toBeInTheDocument();
  });

  it("routes to /business/new when the owner has zero businesses", async () => {
    mockUseAccessibleBusinessesQuery.mockReturnValue({ status: "success", data: [] });
    renderResolver();
    expect(await screen.findByText("new business screen")).toBeInTheDocument();
  });

  it("offers Personal beside a single Business instead of choosing Business first", async () => {
    mockUseAccessibleBusinessesQuery.mockReturnValue({
      status: "success",
      data: [
        {
          businessId: "b-1",
          displayName: "Acme",
          status: "draft",
          role: "owner",
        },
      ],
    });
    renderResolver();
    expect(await screen.findByRole("link", { name: "Personal" })).toHaveAttribute(
      "href",
      "/customer",
    );
    expect(screen.getByRole("link", { name: /Acme/ })).toHaveAttribute("href", "/business/b-1");
  });

  it("shows a bounded selection list when the owner has multiple businesses", async () => {
    mockUseAccessibleBusinessesQuery.mockReturnValue({
      status: "success",
      data: [
        {
          businessId: "b-1",
          displayName: "Acme",
          status: "draft",
          role: "owner",
        },
        {
          businessId: "b-2",
          displayName: "Beta",
          status: "active",
          role: "manager",
        },
      ],
    });
    renderResolver();
    expect(await screen.findByRole("link", { name: "Personal" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Acme/ })).toHaveAttribute("href", "/business/b-1");
    expect(screen.getByRole("link", { name: /Beta/ })).toHaveAttribute(
      "href",
      "/business/b-2/dashboard",
    );
  });
});
