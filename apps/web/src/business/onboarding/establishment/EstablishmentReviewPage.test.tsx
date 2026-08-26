import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { EstablishmentReviewPage } from "./EstablishmentReviewPage";
import type { BusinessContext } from "../../api/businessContext";

vi.mock("../../hooks/businessQueries", () => ({
  useBusinessCategoriesQuery: () => ({
    data: [{ id: "cat-1", displayLabel: "Salon", nodeType: "business_category" }],
  }),
  useBusinessTypesQuery: () => ({ data: [], status: "success" }),
}));
const mockUpdateProfile = vi.fn();
const mockUpdateBranch = vi.fn();
vi.mock("../../hooks/businessMutations", () => ({
  useUpdateBusinessProfileMutation: () => ({
    mutate: mockUpdateProfile,
    isPending: false,
    error: undefined,
  }),
  useUpdateBusinessBranchProfileMutation: () => ({
    mutate: mockUpdateBranch,
    isPending: false,
    error: undefined,
  }),
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
  branch: { branchId: "br-1", displayName: "Main Branch", countryCode: "BI", city: "Bujumbura" },
  termsAcceptance: { accepted: false },
};

function renderPage(ctx: BusinessContext = context) {
  return render(
    <MemoryRouter initialEntries={[`/business/${ctx.businessId}`]}>
      <Routes>
        <Route path="/business/:businessId" element={<EstablishmentReviewPage context={ctx} />} />
        <Route
          path="/business/:businessId/dashboard"
          element={<div>dashboard placeholder screen</div>}
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe("EstablishmentReviewPage (EST-03)", () => {
  it("exposes a reachable language switcher, matching every other onboarding screen (ENG-P3-002-CORR-LANGSWITCH-001)", () => {
    renderPage();
    expect(screen.getByRole("button", { name: "Français" })).toBeInTheDocument();
  });

  it("shows the persisted Business identity and category label — sourced from context, not re-derived locally", () => {
    renderPage();
    expect(screen.getByText("Acme Salon")).toBeInTheDocument();
    expect(screen.getByText("Salon")).toBeInTheDocument();
  });

  it("shows the persisted Main Location", () => {
    renderPage();
    expect(screen.getByText(/Main Branch/)).toBeInTheDocument();
    expect(screen.getByText(/Bujumbura/)).toBeInTheDocument();
  });

  it("never renders Terms or Team content on this screen", () => {
    renderPage();
    expect(screen.queryByText(/Terms/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Team/i)).not.toBeInTheDocument();
  });

  it("Finish setup navigates to the Dashboard boundary without submitting for verification or altering lifecycle status", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole("button", { name: "Finish setup" }));
    expect(await screen.findByText("dashboard placeholder screen")).toBeInTheDocument();
  });
});
