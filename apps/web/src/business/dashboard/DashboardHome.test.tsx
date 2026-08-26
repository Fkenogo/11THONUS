import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { DashboardHome } from "./DashboardHome";
import type { BusinessContext } from "../api/businessContext";

vi.mock("../hooks/businessQueries", () => ({
  useBusinessCategoriesQuery: () => ({
    data: [{ id: "cat-1", displayLabel: "Hair salon" }],
  }),
}));

const draftContext: BusinessContext = {
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

function renderHome(context: BusinessContext) {
  return render(
    <MemoryRouter>
      <DashboardHome context={context} />
    </MemoryRouter>,
  );
}

describe("DashboardHome (DASH-01)", () => {
  it("shows Business identity: name and category", () => {
    renderHome(draftContext);
    expect(screen.getByText("Acme Salon", { exact: false })).toBeInTheDocument();
    expect(screen.getByText("Hair salon", { exact: false })).toBeInTheDocument();
  });

  it("shows Terms as unavailable (not outstanding) when the platform-wide readable-content flag is off — today's actual governed state (DEC-LEGAL-002 open)", () => {
    renderHome(draftContext);
    expect(screen.getByText("Business Terms aren't available yet")).toBeInTheDocument();
    expect(screen.queryByText("One step left")).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Review Business Terms" })).not.toBeInTheDocument();
  });

  it("never offers a functional Terms-review action while Terms content is unavailable", () => {
    renderHome(draftContext);
    expect(screen.queryByRole("button", { name: /terms/i })).not.toBeInTheDocument();
  });

  it("shows the everything-in-order state once Terms are accepted, and does not also claim they're unavailable or outstanding", () => {
    renderHome({ ...draftContext, termsAcceptance: { accepted: true, version: "v1" } });
    expect(screen.queryByText("One step left")).not.toBeInTheDocument();
    expect(screen.queryByText("Business Terms aren't available yet")).not.toBeInTheDocument();
    expect(
      screen.getByText("Your business is set up. Use the sections below to manage it."),
    ).toBeInTheDocument();
  });

  it("never presents a draft Business as Active even once Terms are accepted (establishment != activation)", () => {
    renderHome({ ...draftContext, termsAcceptance: { accepted: true, version: "v1" } });
    expect(screen.queryByText(/\bActive\b/)).not.toBeInTheDocument();
  });

  it("never claims establishment completion equals activation — the ready state is scoped to Terms only, no activation/verification language", () => {
    renderHome({ ...draftContext, termsAcceptance: { accepted: true, version: "v1" } });
    expect(screen.queryByText(/activated?/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/verified/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/\d+%/)).not.toBeInTheDocument();
  });

  it("provides the four governed management entry points", () => {
    renderHome(draftContext);
    expect(screen.getByRole("link", { name: "Business Profile" })).toHaveAttribute(
      "href",
      "/business/biz-123/dashboard/profile",
    );
    expect(screen.getByRole("link", { name: "Locations" })).toHaveAttribute(
      "href",
      "/business/biz-123/dashboard/locations",
    );
    expect(screen.getByRole("link", { name: "Team" })).toHaveAttribute(
      "href",
      "/business/biz-123/dashboard/team",
    );
    expect(screen.getByRole("link", { name: "Business Terms" })).toHaveAttribute(
      "href",
      "/business/biz-123/dashboard/terms",
    );
  });

  it("never presents a draft Business as Active", () => {
    renderHome(draftContext);
    expect(screen.queryByText(/^Active$/)).not.toBeInTheDocument();
    expect(screen.queryByText(/\bActive\b/)).not.toBeInTheDocument();
  });

  it("never fabricates revenue, sales, transaction, customer, loyalty, or conversion metrics", () => {
    renderHome(draftContext);
    for (const forbidden of [
      /revenue/i,
      /sales/i,
      /transactions?/i,
      /customers?/i,
      /loyalty/i,
      /redemptions?/i,
      /conversion/i,
      /appointments?/i,
    ]) {
      expect(screen.queryByText(forbidden)).not.toBeInTheDocument();
    }
  });

  it("never presents a Tier or Subscription treatment", () => {
    renderHome(draftContext);
    expect(screen.queryByText(/tier/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/subscription/i)).not.toBeInTheDocument();
  });

  it("does not surface Business Code on the Dashboard Home (not part of the governed minimum)", () => {
    renderHome(draftContext);
    expect(screen.queryByText(/business code/i)).not.toBeInTheDocument();
    expect(screen.queryByText(draftContext.businessCode)).not.toBeInTheDocument();
  });

  it("never invents merchant-account or integrations copy", () => {
    renderHome(draftContext);
    expect(screen.queryByText(/merchant account/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/integrations?/i)).not.toBeInTheDocument();
  });
});
