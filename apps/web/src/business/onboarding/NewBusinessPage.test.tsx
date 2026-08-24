import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { i18n } from "../../i18n";
import { NewBusinessPage } from "./NewBusinessPage";

const mockMutate = vi.fn();
vi.mock("../hooks/businessMutations", () => ({
  useCreateBusinessMutation: () => ({ mutate: mockMutate, isPending: false }),
}));
vi.mock("../hooks/businessQueries", () => ({
  useBusinessCategoriesQuery: () => ({
    data: [{ id: "cat-1", displayLabel: "Salon", nodeType: "business_category" }],
  }),
}));

function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/business/new"]}>
      <Routes>
        <Route path="/business/new" element={<NewBusinessPage />} />
        <Route path="/business/:businessId" element={<div>business context screen</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("NewBusinessPage", () => {
  it("keeps Continue disabled until every required field is filled", () => {
    renderPage();
    expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();
  });

  it("submits the required fields via createBusiness once the form is complete", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByLabelText("Business name"), "Acme Salon");
    await user.selectOptions(screen.getByLabelText("Business category"), "cat-1");
    await user.type(screen.getByLabelText("Country"), "BI");
    await user.type(screen.getByLabelText("City"), "Bujumbura");
    await user.type(screen.getByLabelText("Phone number"), "+25761234567");
    await user.type(screen.getByLabelText("Currency"), "BIF");
    await user.type(screen.getByLabelText("Timezone"), "Africa/Bujumbura");

    expect(screen.getByRole("button", { name: "Continue" })).toBeEnabled();
    await user.click(screen.getByRole("button", { name: "Continue" }));

    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        displayName: "Acme Salon",
        primaryCategoryId: "cat-1",
        countryCode: "BI",
        city: "Bujumbura",
        contactPhone: "+25761234567",
        currencyCode: "BIF",
        timezone: "Africa/Bujumbura",
      }),
      expect.anything(),
    );
  });

  it("sends the governed default empty supportedLanguages array createBusiness requires (ENG-P3-002B-CORR-SUPPORTEDLANGUAGES-001 — the backend's parseSupportedLanguages rejects a missing/non-array value; TRD10 §10.6.3 types the field required but ENG-P2-002A's independent review established [] as the legitimate governed value for this kind of required reference-list field, matching customerProfile.ts's own 'default empty' precedent)", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByLabelText("Business name"), "Acme Salon");
    await user.selectOptions(screen.getByLabelText("Business category"), "cat-1");
    await user.type(screen.getByLabelText("Country"), "BI");
    await user.type(screen.getByLabelText("City"), "Bujumbura");
    await user.type(screen.getByLabelText("Phone number"), "+25761234567");
    await user.type(screen.getByLabelText("Currency"), "BIF");
    await user.type(screen.getByLabelText("Timezone"), "Africa/Bujumbura");
    await user.click(screen.getByRole("button", { name: "Continue" }));

    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({ supportedLanguages: [] }),
      expect.anything(),
    );
  });

  describe("language accessibility (ENG-P3-002-CORR-LANGSWITCH-001)", () => {
    afterEach(async () => {
      await i18n.changeLanguage("en");
    });

    it("exposes a reachable control that switches onboarding copy to French and back, without losing entered data", async () => {
      const user = userEvent.setup();
      renderPage();

      await user.type(screen.getByLabelText("Business name"), "Acme Salon");
      expect(screen.getByText("Tell us about your business")).toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: "Français" }));
      expect(await screen.findByText("Parlez-nous de votre entreprise")).toBeInTheDocument();
      expect(screen.getByLabelText("Nom de l'entreprise")).toHaveValue("Acme Salon");

      await user.click(screen.getByRole("button", { name: "English" }));
      expect(await screen.findByText("Tell us about your business")).toBeInTheDocument();
      expect(screen.getByLabelText("Business name")).toHaveValue("Acme Salon");
    });
  });
});
