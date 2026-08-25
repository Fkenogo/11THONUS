import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { BusinessDashboardBoundaryPage } from "./BusinessDashboardBoundaryPage";

const mockUseBusinessContextQuery = vi.fn();
vi.mock("../hooks/businessQueries", () => ({
  useBusinessContextQuery: (businessId: string) => mockUseBusinessContextQuery(businessId),
}));
vi.mock("./DashboardPlaceholder", () => ({
  DashboardPlaceholder: () => <div>dashboard placeholder screen</div>,
}));

function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/business/b-1/dashboard"]}>
      <Routes>
        <Route path="/business/:businessId/dashboard" element={<BusinessDashboardBoundaryPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("BusinessDashboardBoundaryPage", () => {
  it("fetches real BusinessContext and renders the Package A placeholder from it — reads backend truth, not route params alone", async () => {
    mockUseBusinessContextQuery.mockReturnValue({
      status: "success",
      data: { businessId: "b-1", displayName: "Acme Salon", status: "draft" },
    });
    renderPage();
    expect(await screen.findByText("dashboard placeholder screen")).toBeInTheDocument();
  });

  it("shows a loading state while the context is being fetched", () => {
    mockUseBusinessContextQuery.mockReturnValue({ status: "pending" });
    renderPage();
    expect(screen.getByText("Loading your business…")).toBeInTheDocument();
  });
});
