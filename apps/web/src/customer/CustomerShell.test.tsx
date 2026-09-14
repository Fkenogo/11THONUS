import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { i18n } from "../i18n";
import { CustomerRoutes } from "./CustomerRoutes";

vi.mock("./hooks/purchaseQueries", () => ({
  useWaitingPurchasesQuery: () => ({ data: { purchases: [] }, isPending: false, isError: false }),
  useCustomerPurchaseQuery: () => ({ data: undefined, isPending: false, isError: false }),
  useAvailableRewardsQuery: () => ({ data: { rewards: [] }, isPending: false, isError: false }),
}));

vi.mock("./hooks/purchaseMutations", () => ({
  useVerifyPurchaseMutation: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useRejectPurchaseMutation: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useDisputePurchaseMutation: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

function renderCustomer(initialPath = "/customer") {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route
          path="/customer/*"
          element={<CustomerRoutes auth={{} as never} functions={{} as never} />}
        />
      </Routes>
    </MemoryRouter>,
  );
}

afterEach(async () => {
  await i18n.changeLanguage("en");
});

describe("CustomerShell / CustomerRoutes", () => {
  it("renders every nav destination and the routed Home content in English", () => {
    renderCustomer();
    const nav = screen.getByRole("navigation", { name: "Customer navigation" });
    expect(within(nav).getByRole("link", { name: "Home" })).toBeInTheDocument();
    expect(within(nav).getByRole("link", { name: "Scan" })).toBeInTheDocument();
    expect(within(nav).getByRole("link", { name: "Rewards" })).toBeInTheDocument();
    expect(within(nav).getByRole("link", { name: "Activity" })).toBeInTheDocument();
    expect(within(nav).getByRole("link", { name: "Account" })).toBeInTheDocument();
    expect(screen.getByText("You don't have a loyalty number yet.")).toBeInTheDocument();
    expect(screen.getByText("Your loyalty QR code isn't available yet.")).toBeInTheDocument();
  });

  it("renders the nav and destinations in French", async () => {
    await i18n.changeLanguage("fr");
    renderCustomer();
    const nav = screen.getByRole("navigation", { name: "Navigation client" });
    expect(within(nav).getByRole("link", { name: "Accueil" })).toBeInTheDocument();
    expect(within(nav).getByRole("link", { name: "Scanner" })).toBeInTheDocument();
    expect(within(nav).getByRole("link", { name: "Récompenses" })).toBeInTheDocument();
    expect(within(nav).getByRole("link", { name: "Activité" })).toBeInTheDocument();
    expect(within(nav).getByRole("link", { name: "Compte" })).toBeInTheDocument();
  });

  it("shows an honest not-yet-available stub for Scan, never fabricated activity", () => {
    renderCustomer("/customer/scan");
    expect(screen.getByText("Scanning isn't available yet.")).toBeInTheDocument();
  });

  it("renders the real Rewards surface (empty state, PLATFORM-BASELINE-006A)", () => {
    renderCustomer("/customer/rewards");
    expect(screen.getByText("Available rewards")).toBeInTheDocument();
    expect(screen.getByText("You don't have any rewards yet.")).toBeInTheDocument();
  });

  it("renders the real Activity surface (waiting list, PLATFORM-BASELINE-006A)", () => {
    renderCustomer("/customer/activity");
    expect(screen.getByText("Waiting for you")).toBeInTheDocument();
    expect(screen.getByText("Nothing is waiting for your review right now.")).toBeInTheDocument();
  });

  it("shows an honest not-yet-available stub for Account", () => {
    renderCustomer("/customer/account");
    expect(screen.getByText("Account settings aren't available yet.")).toBeInTheDocument();
  });
});
