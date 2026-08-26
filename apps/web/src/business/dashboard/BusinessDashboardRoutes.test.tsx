import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { BusinessDashboardRoutes } from "./BusinessDashboardRoutes";
import type { BusinessContext } from "../api/businessContext";

vi.mock("../hooks/businessQueries", () => ({
  useBusinessCategoriesQuery: () => ({ data: [{ id: "cat-1", displayLabel: "Hair salon" }] }),
}));

const context: BusinessContext = {
  businessId: "biz-123",
  businessCode: "BIZ1",
  displayName: "Acme Salon",
  status: "draft",
  primaryCategoryId: "cat-1",
  countryCode: "BI",
  city: "Bujumbura",
  contactPhone: "+25761234567",
  currencyCode: "BIF",
  timezone: "Africa/Bujumbura",
  branch: { branchId: "br-1", displayName: "Main Branch", countryCode: "BI", city: "Bujumbura" },
  termsAcceptance: { accepted: false },
};

function renderAt(initialPath: string) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route
          path="/business/:businessId/dashboard/*"
          element={<BusinessDashboardRoutes context={context} />}
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe("BusinessDashboardRoutes", () => {
  it("renders the shell around Dashboard Home at the index route", () => {
    renderAt("/business/biz-123/dashboard");
    expect(
      screen.getByRole("navigation", { name: "Business Dashboard navigation" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Overview" })).toBeInTheDocument();
  });

  it("resolves the correct destination on direct/refresh navigation to a nested Dashboard route", () => {
    renderAt("/business/biz-123/dashboard/team");
    expect(
      screen.getByRole("navigation", { name: "Business Dashboard navigation" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Team" })).toBeInTheDocument();
  });

  it("renders the not-yet-implemented treatment for Profile/Locations/Terms without fabricating functionality", () => {
    renderAt("/business/biz-123/dashboard/profile");
    expect(screen.getByText("This section isn't available yet.")).toBeInTheDocument();
  });
});
