import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { BusinessDashboardBoundaryPage } from "./BusinessDashboardBoundaryPage";

const mockUseBusinessContextQuery = vi.fn();
vi.mock("../hooks/businessQueries", () => ({
  useBusinessContextQuery: (businessId: string) => mockUseBusinessContextQuery(businessId),
}));
vi.mock("./BusinessDashboardRoutes", () => ({
  BusinessDashboardRoutes: ({ context }: { context: { displayName: string } }) => (
    <div>dashboard shell for {context.displayName}</div>
  ),
}));

function renderPage(initialPath = "/business/b-1/dashboard") {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route
          path="/business/:businessId/dashboard/*"
          element={<BusinessDashboardBoundaryPage />}
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe("BusinessDashboardBoundaryPage", () => {
  it("fetches real BusinessContext and renders the Dashboard shell from it — reads backend truth, not route params alone", async () => {
    mockUseBusinessContextQuery.mockReturnValue({
      status: "success",
      data: { businessId: "b-1", displayName: "Acme Salon", status: "draft" },
    });
    renderPage();
    expect(await screen.findByText("dashboard shell for Acme Salon")).toBeInTheDocument();
  });

  it("shows a loading state while the context is being fetched", () => {
    mockUseBusinessContextQuery.mockReturnValue({ status: "pending" });
    renderPage();
    expect(screen.getByText("Loading your business…")).toBeInTheDocument();
  });

  it("denies access with the existing integrity-error treatment for a wrong/non-owned Business, matching the server-side permission-denied guard", () => {
    mockUseBusinessContextQuery.mockReturnValue({ status: "error" });
    renderPage();
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(screen.queryByText(/dashboard shell/)).not.toBeInTheDocument();
  });

  it("resolves the Business context from the URL businessId on direct navigation to a nested Dashboard route (refresh-safe)", async () => {
    mockUseBusinessContextQuery.mockReturnValue({
      status: "success",
      data: { businessId: "b-1", displayName: "Acme Salon", status: "draft" },
    });
    renderPage("/business/b-1/dashboard/team");
    expect(await screen.findByText("dashboard shell for Acme Salon")).toBeInTheDocument();
    expect(mockUseBusinessContextQuery).toHaveBeenCalledWith("b-1");
  });
});
