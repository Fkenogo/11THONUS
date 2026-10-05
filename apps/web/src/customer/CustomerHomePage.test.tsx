import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Outlet, Route, Routes } from "react-router-dom";
import { i18n } from "../i18n";
import type {
  CustomerCircleWire,
  CustomerExperienceOverviewWire,
} from "./api/customerExperienceClient";
import { CustomerHomePage } from "./CustomerHomePage";

const { state, openIdentity } = vi.hoisted(() => ({
  state: {
    current: { circles: [], activity: [], availableRewards: [] } as CustomerExperienceOverviewWire,
  },
  openIdentity: vi.fn(),
}));

vi.mock("./hooks/experienceQueries", () => ({
  useCustomerExperienceOverviewQuery: () => ({
    data: state.current,
    isPending: false,
    isError: false,
    refetch: vi.fn(),
  }),
}));

const identity = {
  displayName: "Amina N.",
  loyaltyNumber: "LN-123456",
  qrReference: "qr-reference-1",
  status: "ready" as const,
};

function circle(overrides: Partial<CustomerCircleWire> = {}): CustomerCircleWire {
  return {
    id: "cycle-1",
    businessId: "biz-1",
    businessName: "Café Lumière",
    rewardProgramId: "program-1",
    programmeName: "Coffee Circle",
    qualifyingItemName: "Coffee",
    cycleId: "cycle-1",
    cycleNumber: 1,
    cycleState: "active",
    verifiedUnits: 8,
    pendingUnits: 1,
    rewardAvailable: false,
    rewardDescription: null,
    ...overrides,
  };
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/customer"]}>
      <Routes>
        <Route element={<Outlet context={{ identity, openIdentity }} />}>
          <Route
            path="/customer"
            element={<CustomerHomePage auth={{} as never} functions={{} as never} />}
          />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(async () => {
  await i18n.changeLanguage("en");
  state.current = { circles: [], activity: [], availableRewards: [] };
  vi.clearAllMocks();
});

describe("CustomerHomePage prototype states", () => {
  it("shows real mixed verified and waiting progress without counting waiting units as verified", () => {
    state.current = { circles: [circle()], activity: [], availableRewards: [] };
    renderPage();

    expect(
      screen.getByRole("img", { name: "8 verified units, 1 waiting for confirmation" }),
    ).toBeInTheDocument();
    expect(screen.getByText("8 verified")).toBeInTheDocument();
    expect(screen.getByText("1 waiting for confirmation")).toBeInTheDocument();
    expect(screen.getByText("8/10")).toBeInTheDocument();
    expect(screen.queryByText("Reward unlocked")).toBeNull();
  });

  it("gives a server-available reward the primary card and routes its action to the canonical identity", () => {
    state.current = {
      circles: [
        circle({
          cycleState: "reward_available",
          verifiedUnits: 10,
          pendingUnits: 0,
          rewardAvailable: true,
        }),
      ],
      activity: [],
      availableRewards: [
        {
          id: "reward-1",
          businessId: "biz-1",
          businessName: "Café Lumière",
          rewardProgramId: "program-1",
          rewardDescription: "One coffee",
          rewardQuantity: 1,
          availableAt: "2026-10-01T10:00:00.000Z",
        },
      ],
    };
    renderPage();

    expect(screen.getByText("Circle completed")).toBeInTheDocument();
    expect(screen.getByText("Your 11th Coffee is on Café Lumière!")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Show my code" }));
    expect(openIdentity).toHaveBeenCalledOnce();
    expect(
      screen.getByRole("img", { name: "10 verified units, 0 waiting for confirmation" }),
    ).toBeInTheDocument();
  });

  it("preserves redemption acknowledgement and next Circle without showing confirmer identity", () => {
    state.current = {
      circles: [circle({ cycleNumber: 2, verifiedUnits: 0, pendingUnits: 0 })],
      activity: [
        {
          id: "redemption-1",
          businessId: "biz-1",
          businessName: "Café Lumière",
          rewardProgramId: "program-1",
          programmeName: "Coffee Circle",
          itemLabel: null,
          quantity: null,
          eventKind: "reward_redeemed",
          status: "redeemed",
          rewardDescription: "A coffee",
          occurredAt: "2026-10-01T10:00:00.000Z",
          confirmedByUserId: "staff-private",
        } as CustomerExperienceOverviewWire["activity"][number],
      ],
      availableRewards: [],
    };
    renderPage();

    expect(screen.getAllByText("Reward redeemed").length).toBeGreaterThan(0);
    expect(screen.getByText(/Your A coffee was redeemed at Café Lumière/)).toBeInTheDocument();
    expect(screen.getByText("Cycle 2")).toBeInTheDocument();
    expect(screen.queryByText("staff-private")).toBeNull();
  });

  it("retains French copy for customer progress and reward states", async () => {
    await i18n.changeLanguage("fr");
    state.current = {
      circles: [
        circle({
          cycleState: "reward_available",
          verifiedUnits: 10,
          pendingUnits: 0,
          rewardAvailable: true,
        }),
      ],
      activity: [],
      availableRewards: [
        {
          id: "reward-1",
          businessId: "biz-1",
          businessName: "Café Lumière",
          rewardProgramId: "program-1",
          rewardDescription: "Un café",
          rewardQuantity: 1,
          availableAt: "2026-10-01T10:00:00.000Z",
        },
      ],
    };
    renderPage();

    expect(screen.getByText("Cercle terminé")).toBeInTheDocument();
    expect(
      screen.getByText("Votre Coffee supplémentaire est offert chez Café Lumière !"),
    ).toBeInTheDocument();
  });
});
