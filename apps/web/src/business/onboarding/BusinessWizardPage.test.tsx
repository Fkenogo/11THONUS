import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { BusinessWizardPage } from "./BusinessWizardPage";

const mockUseBusinessContextQuery = vi.fn();
vi.mock("../hooks/businessQueries", () => ({
  useBusinessContextQuery: (businessId: string) => mockUseBusinessContextQuery(businessId),
}));
vi.mock("./establishment/EstablishmentReviewPage", () => ({
  EstablishmentReviewPage: () => <div>establishment review page</div>,
}));
vi.mock("./SubmittedStatusPage", () => ({
  SubmittedStatusPage: () => <div>submitted status page</div>,
}));

function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/business/b-1"]}>
      <Routes>
        <Route path="/business/:businessId" element={<BusinessWizardPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

const baseContext = {
  businessId: "b-1",
  businessCode: "BC-1",
  displayName: "Acme",
  primaryCategoryId: "cat-1",
  countryCode: "BI",
  city: "Bujumbura",
  contactPhone: "+25761234567",
  currencyCode: "BIF",
  timezone: "Africa/Bujumbura",
  branch: { branchId: "br-1", displayName: "Main", countryCode: "BI", city: "Bujumbura" },
  termsAcceptance: { accepted: false },
};

describe("BusinessWizardPage lifecycle routing", () => {
  it("renders the establishment review page when status is draft", async () => {
    mockUseBusinessContextQuery.mockReturnValue({
      status: "success",
      data: { ...baseContext, status: "draft" },
    });
    renderPage();
    expect(await screen.findByText("establishment review page")).toBeInTheDocument();
  });

  it("renders the submitted/pending state when status is pending_verification — never re-opens the wizard", async () => {
    mockUseBusinessContextQuery.mockReturnValue({
      status: "success",
      data: { ...baseContext, status: "pending_verification" },
    });
    renderPage();
    expect(await screen.findByText("submitted status page")).toBeInTheDocument();
    expect(screen.queryByText("establishment review page")).not.toBeInTheDocument();
  });

  it("renders a bounded generic safe state for any other status — never the wizard, never a dashboard", async () => {
    mockUseBusinessContextQuery.mockReturnValue({
      status: "success",
      data: { ...baseContext, status: "active" },
    });
    renderPage();
    expect(await screen.findByText("This isn't available right now.")).toBeInTheDocument();
    expect(screen.queryByText("establishment review page")).not.toBeInTheDocument();
    expect(screen.queryByText("submitted status page")).not.toBeInTheDocument();
  });

  it("renders the integrity error state, never the wizard, when the query errors", async () => {
    mockUseBusinessContextQuery.mockReturnValue({ status: "error", error: new Error("boom") });
    renderPage();
    expect(await screen.findByText(/something went wrong/i)).toBeInTheDocument();
  });
});
