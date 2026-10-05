import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
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

vi.mock("./hooks/experienceQueries", () => ({
  useCustomerIdentityPresentationQuery: () => ({
    data: {
      displayName: "Amina N.",
      loyaltyNumber: "LN-123456",
      qrReference: "qr-ref-1",
      status: "ready",
    },
    isPending: false,
    isError: false,
    refetch: vi.fn(),
  }),
  useCustomerExperienceOverviewQuery: () => ({
    data: { circles: [], activity: [], availableRewards: [] },
    isPending: false,
    isError: false,
    refetch: vi.fn(),
  }),
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
  it("renders prototype customer destinations, member identity and the production empty state in English", () => {
    renderCustomer();
    const nav = screen.getByRole("navigation", { name: "Customer navigation" });
    expect(within(nav).getByRole("link", { name: "Home" })).toBeInTheDocument();
    expect(within(nav).getByRole("link", { name: "Circles" })).toBeInTheDocument();
    expect(within(nav).getByRole("link", { name: "Activity" })).toBeInTheDocument();
    expect(within(nav).getByRole("link", { name: "Profile" })).toBeInTheDocument();
    expect(screen.getByText("Amina N.")).toBeInTheDocument();
    expect(screen.getByText("Start Your First Loyalty Circle")).toBeInTheDocument();
    expect(screen.queryByText("not available in the app yet")).toBeNull();
  });

  it("renders the nav and destinations in French", async () => {
    await i18n.changeLanguage("fr");
    renderCustomer();
    const nav = screen.getByRole("navigation", { name: "Navigation client" });
    expect(within(nav).getByRole("link", { name: "Accueil" })).toBeInTheDocument();
    expect(within(nav).getByRole("link", { name: "Cercles" })).toBeInTheDocument();
    expect(within(nav).getByRole("link", { name: "Activité" })).toBeInTheDocument();
    expect(within(nav).getByRole("link", { name: "Profil" })).toBeInTheDocument();
  });

  it("opens the real canonical identity QR from the persistent member action", () => {
    renderCustomer();
    fireEvent.click(screen.getByRole("button", { name: "My 11thONUS code" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("LN-123456")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Loyalty QR code" })).toBeInTheDocument();
  });

  it("renders the real Circle surface on the prototype Circles route", () => {
    renderCustomer("/customer/circles");
    expect(screen.getByText("My Loyalty Circles")).toBeInTheDocument();
  });

  it("keeps the legacy Rewards route on the real Circle surface", () => {
    renderCustomer("/customer/rewards");
    expect(screen.getByText("My Loyalty Circles")).toBeInTheDocument();
  });

  it("renders the real Activity surface (waiting list, PLATFORM-BASELINE-006A)", () => {
    renderCustomer("/customer/activity");
    expect(screen.getByText("Waiting for you")).toBeInTheDocument();
    expect(screen.getByText("Nothing is waiting for your review right now.")).toBeInTheDocument();
  });

  it("routes the legacy Account path to the real profile", () => {
    renderCustomer("/customer/account");
    expect(screen.getByText("Your Profile")).toBeInTheDocument();
  });
});
