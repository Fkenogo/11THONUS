import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { i18n } from "../../i18n";
import { NewBusinessPage } from "./NewBusinessPage";

const mockMutate = vi.fn();
vi.mock("../hooks/businessMutations", () => ({
  useCreateBusinessMutation: () => ({ mutate: mockMutate, isPending: false, error: undefined }),
}));
vi.mock("../hooks/businessQueries", () => ({
  useBusinessCategoriesQuery: () => ({
    data: [{ id: "cat-1", displayLabel: "Salon", nodeType: "business_category" }],
  }),
  useBusinessTypesQuery: () => ({ data: [], status: "pending" }),
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

async function completeEst01(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText("Business name"), "Acme Salon");
  await user.selectOptions(screen.getByLabelText("Business category"), "cat-1");
  await user.type(screen.getByLabelText("Phone number"), "+25761234567");
  await user.click(screen.getByRole("button", { name: "Continue" }));
}

async function completeEst02(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText("Country"), "BI");
  await user.type(screen.getByLabelText("City"), "Bujumbura");
  await user.type(screen.getByLabelText("Location name"), "Main Branch");
  await user.type(screen.getByLabelText("Currency"), "BIF");
  await user.type(screen.getByLabelText("Timezone"), "Africa/Bujumbura");
}

describe("NewBusinessPage", () => {
  afterEach(() => {
    mockMutate.mockClear();
  });

  it("opens on EST-01 (identity/category/phone) with Continue disabled until valid", () => {
    renderPage();
    expect(screen.getByText("Tell us about your business")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();
  });

  it("shows a Step 1 of 3 progress indicator on EST-01 (ENG-P3-002-UI-IMP-A-CORR-001 Finding 3)", () => {
    renderPage();
    expect(screen.getByText("Step 1 of 3")).toBeInTheDocument();
  });

  it("advances to EST-02 (location/operating details) after EST-01 is completed, without creating a Business yet", async () => {
    const user = userEvent.setup();
    renderPage();
    await completeEst01(user);

    expect(screen.getByText("Your main location")).toBeInTheDocument();
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it("shows a Step 2 of 3 progress indicator on EST-02", async () => {
    const user = userEvent.setup();
    renderPage();
    await completeEst01(user);

    expect(screen.getByText("Step 2 of 3")).toBeInTheDocument();
  });

  it("fires createBusiness with the combined EST-01+EST-02 payload exactly once, at EST-02's Continue — the governed creation boundary", async () => {
    const user = userEvent.setup();
    renderPage();
    await completeEst01(user);
    await completeEst02(user);
    await user.click(screen.getByRole("button", { name: "Continue" }));

    expect(mockMutate).toHaveBeenCalledTimes(1);
    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        displayName: "Acme Salon",
        primaryCategoryId: "cat-1",
        contactPhone: "+25761234567",
        countryCode: "BI",
        city: "Bujumbura",
        currencyCode: "BIF",
        timezone: "Africa/Bujumbura",
        supportedLanguages: [],
      }),
      expect.anything(),
    );
  });

  it("navigates to /business/:businessId only after createBusiness actually succeeds", async () => {
    mockMutate.mockImplementation((_payload, { onSuccess }) => {
      onSuccess({ businessId: "biz-123", businessCode: "BIZ1", branchId: "br-1", status: "draft" });
    });
    const user = userEvent.setup();
    renderPage();
    await completeEst01(user);
    await completeEst02(user);
    await user.click(screen.getByRole("button", { name: "Continue" }));

    expect(await screen.findByText("business context screen")).toBeInTheDocument();
  });

  it("Back from EST-02 returns to EST-01 with the entered values preserved (bounded, in-memory state — not persisted)", async () => {
    const user = userEvent.setup();
    renderPage();
    await completeEst01(user);
    await user.type(screen.getByLabelText("Country"), "BI");
    await user.click(screen.getByRole("button", { name: "Back" }));

    expect(screen.getByText("Tell us about your business")).toBeInTheDocument();
    expect(screen.getByLabelText("Business name")).toHaveValue("Acme Salon");
    expect(screen.getByLabelText("Phone number")).toHaveValue("+25761234567");
  });

  describe("language accessibility (ENG-P3-002-CORR-LANGSWITCH-001)", () => {
    afterEach(async () => {
      await i18n.changeLanguage("en");
    });

    it("exposes a reachable control that switches EST-01 copy to French and back, without losing entered data", async () => {
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
