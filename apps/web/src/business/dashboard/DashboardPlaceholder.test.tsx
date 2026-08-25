import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { DashboardPlaceholder } from "./DashboardPlaceholder";
import type { BusinessContext } from "../api/businessContext";

const context: BusinessContext = {
  businessId: "biz-123",
  businessCode: "BIZ1",
  displayName: "Acme Salon",
  status: "draft",
  primaryCategoryId: "cat-1",
  countryCode: "BI",
  city: "Bujumbura",
  contactPhone: "+25761234567",
  branch: { branchId: "br-1", displayName: "Main Branch", countryCode: "BI", city: "Bujumbura" },
  termsAcceptance: { accepted: false },
};

describe("DashboardPlaceholder", () => {
  it("exposes a reachable language switcher, matching every other onboarding screen (ENG-P3-002-CORR-LANGSWITCH-001)", () => {
    render(<DashboardPlaceholder context={context} />);
    expect(screen.getByRole("button", { name: "Français" })).toBeInTheDocument();
  });

  it("renders the Business identity as the Package A establishment boundary, with no Dashboard shell content", () => {
    render(<DashboardPlaceholder context={context} />);
    expect(screen.getByText("Acme Salon")).toBeInTheDocument();
  });

  it("never renders Terms, Team, or lifecycle-status content — Package A does not build the Dashboard shell", () => {
    render(<DashboardPlaceholder context={context} />);
    expect(screen.queryByText(/Terms/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Team/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/draft/i)).not.toBeInTheDocument();
  });
});
