/**
 * Proves the "Terms available but not accepted" branch of DashboardHome's readiness state
 * (Phase D correction, `ENG-P3-002-UI-IMP-B-REVIEW`): today `TERMS_READABLE_CONTENT_AVAILABLE`
 * is hard-pinned `false` (see DashboardHome.test.tsx for that governed-current-state coverage),
 * but the outstanding-Terms path must still be correct and tested for the day that flag is
 * deliberately flipped by a future package — a conditional that is never exercised is a
 * conditional nobody has actually verified.
 */
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
vi.mock("../termsAvailability", () => ({ TERMS_READABLE_CONTENT_AVAILABLE: true }));

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

describe("DashboardHome (DASH-01) — Terms available but not yet accepted", () => {
  it("surfaces outstanding Terms as the readiness state once real content becomes available and the current version isn't accepted", () => {
    render(
      <MemoryRouter>
        <DashboardHome context={draftContext} />
      </MemoryRouter>,
    );
    expect(screen.getByText("One step left")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Review Business Terms" })).toHaveAttribute(
      "href",
      "/business/biz-123/dashboard/terms",
    );
    expect(screen.queryByText("Business Terms aren't available yet")).not.toBeInTheDocument();
  });
});
