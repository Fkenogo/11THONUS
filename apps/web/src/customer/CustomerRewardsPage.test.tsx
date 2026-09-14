import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { i18n } from "../i18n";
import { CustomerRewardsPage } from "./CustomerRewardsPage";
import type { CustomerRewardWire } from "./api/purchaseClient";

let rewardsResult: { data: { rewards: CustomerRewardWire[] } | undefined };

vi.mock("./hooks/purchaseQueries", () => ({
  useWaitingPurchasesQuery: () => ({ data: { purchases: [] }, isPending: false }),
  useCustomerPurchaseQuery: () => ({ data: undefined, isPending: false }),
  useAvailableRewardsQuery: () => rewardsResult,
}));

vi.mock("./hooks/purchaseMutations", () => ({
  useVerifyPurchaseMutation: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useRejectPurchaseMutation: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useDisputePurchaseMutation: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

function renderPage() {
  return render(
    <MemoryRouter>
      <CustomerRewardsPage auth={{} as never} functions={{} as never} />
    </MemoryRouter>,
  );
}

afterEach(async () => {
  await i18n.changeLanguage("en");
});

describe("CustomerRewardsPage", () => {
  it("renders the empty state in English", () => {
    rewardsResult = { data: { rewards: [] } };
    renderPage();
    expect(screen.getByText("Available rewards")).toBeInTheDocument();
    expect(screen.getByText("You don't have any rewards yet.")).toBeInTheDocument();
  });

  it("renders available rewards with their governing terms", () => {
    rewardsResult = {
      data: {
        rewards: [
          {
            id: "r-1",
            loyaltyCycleId: "c-1",
            businessId: "biz-1",
            customerIdentityId: "cust-1",
            rewardProgramId: "rp-1",
            rewardProgramVersionId: "v-1",
            rewardDescription: "One free coffee",
            rewardQuantity: 1,
            state: "available",
            availableAt: "2026-09-14T10:00:00.000Z",
            createdAt: "2026-09-14T10:00:00.000Z",
          },
        ],
      },
    };
    renderPage();
    expect(screen.getByText("Reward available")).toBeInTheDocument();
    expect(screen.getByText("One free coffee")).toBeInTheDocument();
  });

  it("renders the rewards surface in French with full parity", async () => {
    await i18n.changeLanguage("fr");
    rewardsResult = {
      data: {
        rewards: [
          {
            id: "r-1",
            loyaltyCycleId: "c-1",
            businessId: "biz-1",
            customerIdentityId: "cust-1",
            rewardProgramId: "rp-1",
            rewardProgramVersionId: "v-1",
            rewardDescription: "One free coffee",
            rewardQuantity: 1,
            state: "available",
            availableAt: "2026-09-14T10:00:00.000Z",
            createdAt: "2026-09-14T10:00:00.000Z",
          },
        ],
      },
    };
    renderPage();
    expect(screen.getByText("Récompenses disponibles")).toBeInTheDocument();
    expect(screen.getByText("Récompense disponible")).toBeInTheDocument();
  });
});
