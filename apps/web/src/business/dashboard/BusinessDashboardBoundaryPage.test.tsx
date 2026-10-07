import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { BusinessDashboardBoundaryPage } from "./BusinessDashboardBoundaryPage";

const mockUseBusinessContextQuery = vi.fn();
const mockUseAccessibleBusinessesQuery = vi.fn();
vi.mock("../hooks/businessQueries", () => ({
  useBusinessContextQuery: (businessId: string) => mockUseBusinessContextQuery(businessId),
  useAccessibleBusinessesQuery: () => mockUseAccessibleBusinessesQuery(),
}));
vi.mock("../counter/StaffShell", () => ({
  StaffRoutes: ({ context }: { context: { displayName: string } }) => (
    <div>staff counter for {context.displayName}</div>
  ),
}));

function accessibleAs(role: "owner" | "manager" | "staff", businessId = "b-1") {
  mockUseAccessibleBusinessesQuery.mockReturnValue({
    status: "success",
    data: [{ businessId, displayName: "Acme Salon", status: "active", role }],
  });
}

beforeEach(() => {
  mockUseBusinessContextQuery.mockReset();
  accessibleAs("owner");
});
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

  describe("role-aware landing (EA-BL-001-CORR-002-B, D8 — UX routing only)", () => {
    const success = {
      status: "success",
      data: { businessId: "b-1", displayName: "Acme Salon", status: "active" },
    };

    it("lands Staff on the Counter experience, not the Owner/Manager Dashboard", async () => {
      mockUseBusinessContextQuery.mockReturnValue(success);
      accessibleAs("staff");
      renderPage();
      expect(await screen.findByText("staff counter for Acme Salon")).toBeInTheDocument();
      expect(screen.queryByText(/dashboard shell/)).not.toBeInTheDocument();
    });

    it.each(["owner", "manager"] as const)(
      "keeps the existing Business Dashboard for %s — unchanged",
      async (role) => {
        mockUseBusinessContextQuery.mockReturnValue(success);
        accessibleAs(role);
        renderPage();
        expect(await screen.findByText("dashboard shell for Acme Salon")).toBeInTheDocument();
        expect(screen.queryByText(/staff counter/)).not.toBeInTheDocument();
      },
    );

    it("uses the role for THIS Business, not another Business the person also staffs", async () => {
      mockUseBusinessContextQuery.mockReturnValue(success);
      mockUseAccessibleBusinessesQuery.mockReturnValue({
        status: "success",
        data: [
          { businessId: "other", displayName: "Other", status: "active", role: "staff" },
          { businessId: "b-1", displayName: "Acme Salon", status: "active", role: "owner" },
        ],
      });
      renderPage();
      expect(await screen.findByText("dashboard shell for Acme Salon")).toBeInTheDocument();
    });

    it("waits for the role before showing any shell (a Staff member never glimpses the admin shell)", () => {
      mockUseBusinessContextQuery.mockReturnValue(success);
      mockUseAccessibleBusinessesQuery.mockReturnValue({ status: "pending" });
      renderPage();
      expect(screen.getByText("Loading your business…")).toBeInTheDocument();
      expect(screen.queryByText(/dashboard shell/)).not.toBeInTheDocument();
      expect(screen.queryByText(/staff counter/)).not.toBeInTheDocument();
    });

    it("falls back to the existing Dashboard when the role cannot be read (the server still decides every operation)", async () => {
      mockUseBusinessContextQuery.mockReturnValue(success);
      mockUseAccessibleBusinessesQuery.mockReturnValue({ status: "error" });
      renderPage();
      expect(await screen.findByText("dashboard shell for Acme Salon")).toBeInTheDocument();
    });
  });
});
