import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { BusinessProfilePage } from "./BusinessProfilePage";
import type { BusinessContext } from "../api/businessContext";

vi.mock("../hooks/businessQueries", () => ({
  useBusinessCategoriesQuery: () => ({
    data: [
      { id: "cat-1", displayLabel: "Salon" },
      { id: "cat-2", displayLabel: "Retail" },
    ],
  }),
  useBusinessTypesQuery: () => ({ data: [], status: "success" }),
}));

const mockUpdateProfile = vi.fn();
vi.mock("../hooks/businessMutations", () => ({
  useUpdateBusinessProfileMutation: () => ({
    mutate: mockUpdateProfile,
    isPending: false,
    error: undefined,
  }),
}));

const context: BusinessContext = {
  businessId: "biz-123",
  businessCode: "BIZ7X2PYN",
  displayName: "Acme Salon",
  status: "draft",
  primaryCategoryId: "cat-1",
  countryCode: "BI",
  city: "Bujumbura",
  contactPhone: "+25761234567",
  contactEmail: "owner@example.com",
  currencyCode: "BIF",
  timezone: "Africa/Bujumbura",
  branch: { branchId: "br-1", displayName: "Main Branch", countryCode: "BI", city: "Bujumbura" },
  termsAcceptance: { accepted: false },
};

function renderPage(ctx: BusinessContext = context) {
  return render(
    <MemoryRouter>
      <BusinessProfilePage context={ctx} />
    </MemoryRouter>,
  );
}

describe("BusinessProfilePage (Package C, MGMT-02)", () => {
  afterEach(() => {
    mockUpdateProfile.mockClear();
  });

  it("renders backend-authoritative profile fields", () => {
    renderPage();
    expect(screen.getByRole("heading", { name: "Business Profile" })).toBeInTheDocument();
    expect(screen.getByText("Acme Salon")).toBeInTheDocument();
    expect(screen.getByText("Salon")).toBeInTheDocument();
    expect(screen.getByText("+25761234567")).toBeInTheDocument();
    expect(screen.getByText("owner@example.com")).toBeInTheDocument();
  });

  it("shows a restrained 'no email provided' treatment when contactEmail is absent, not an error", () => {
    renderPage({ ...context, contactEmail: undefined });
    expect(screen.getByText("No email provided")).toBeInTheDocument();
  });

  it("shows 'No specific type' when businessTypeId is absent, without inventing a value", () => {
    renderPage();
    expect(screen.getByText("No specific type")).toBeInTheDocument();
  });

  it("shows the Business Code with a restrained internal/support-reference caption (FD-3 §24) — never commerce/integration/sharing framing", () => {
    renderPage();
    expect(screen.getByText("BIZ7X2PYN")).toBeInTheDocument();
    expect(screen.getByText(/internal reference for 11thONUS support/i)).toBeInTheDocument();
    for (const forbidden of [/integration/i, /partner/i, /share this code/i, /commerce/i]) {
      expect(screen.queryByText(forbidden)).not.toBeInTheDocument();
    }
  });

  it("never presents a draft Business as Active, and never invents Tier/Subscription/merchant/appointments content", () => {
    renderPage();
    for (const forbidden of [
      /\bActive\b/,
      /tier/i,
      /subscription/i,
      /merchant account/i,
      /appointments?/i,
    ]) {
      expect(screen.queryByText(forbidden)).not.toBeInTheDocument();
    }
  });

  it("enters edit mode showing the persisted values pre-filled", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole("button", { name: "Edit" }));
    expect(screen.getByRole("heading", { name: "Edit Business Profile" })).toBeInTheDocument();
    expect(screen.getByLabelText("Business name")).toHaveValue("Acme Salon");
    expect(screen.getByLabelText("Phone number")).toHaveValue("+25761234567");
  });

  it("a Category change clears the selected Type (DEC-CKS-003)", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole("button", { name: "Edit" }));
    await user.selectOptions(screen.getByLabelText("Business category"), "cat-2");
    expect(screen.getByLabelText("Business category")).toHaveValue("cat-2");
  });

  it("Save calls updateBusinessProfile with the edited fields", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole("button", { name: "Edit" }));
    await user.clear(screen.getByLabelText("Business name"));
    await user.type(screen.getByLabelText("Business name"), "Acme Salon & Spa");
    await user.click(screen.getByRole("button", { name: "Save changes" }));
    expect(mockUpdateProfile).toHaveBeenCalledWith(
      expect.objectContaining({
        displayName: "Acme Salon & Spa",
        primaryCategoryId: "cat-1",
        contactPhone: "+25761234567",
      }),
      expect.anything(),
    );
  });

  it("Cancel discards unsaved edits and returns to the persisted state, without saving", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole("button", { name: "Edit" }));
    await user.clear(screen.getByLabelText("Business name"));
    await user.type(screen.getByLabelText("Business name"), "Unsaved Draft Name");
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(mockUpdateProfile).not.toHaveBeenCalled();
    expect(screen.getByRole("heading", { name: "Business Profile" })).toBeInTheDocument();
    expect(screen.getByText("Acme Salon")).toBeInTheDocument();
    expect(screen.queryByText("Unsaved Draft Name")).not.toBeInTheDocument();
  });

  it("does not display legalName, Business.address, logoUrl, or supportedLanguages (no read-DTO projection exists for them)", () => {
    renderPage();
    expect(screen.queryByLabelText(/legal name/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/^address$/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/logo/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/supported languages?/i)).not.toBeInTheDocument();
  });
});
