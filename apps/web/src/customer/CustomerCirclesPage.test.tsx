import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { i18n } from "../i18n";
import { CustomerCirclesPage } from "./CustomerCirclesPage";

vi.mock("./hooks/experienceQueries", () => ({
  useCustomerExperienceOverviewQuery: () => ({
    data: {
      circles: [
        {
          id: "cycle-1",
          businessId: "biz-1",
          businessName: "Café Lumière",
          rewardProgramId: "program-1",
          programmeName: "Coffee Circle",
          qualifyingItemName: "Coffee",
          cycleId: "cycle-1",
          cycleNumber: 2,
          cycleState: "active",
          verifiedUnits: 7,
          pendingUnits: 2,
          rewardAvailable: false,
          rewardDescription: "A coffee",
        },
        {
          id: "cycle-2",
          businessId: "biz-2",
          businessName: "Salon A",
          rewardProgramId: "program-2",
          programmeName: "Style Circle",
          qualifyingItemName: "Style",
          cycleId: "cycle-2",
          cycleNumber: 1,
          cycleState: "active",
          verifiedUnits: 10,
          pendingUnits: 0,
          rewardAvailable: true,
          rewardDescription: "A free style",
        },
      ],
      activity: [],
      availableRewards: [],
    },
    isPending: false,
    isError: false,
    refetch: vi.fn(),
  }),
}));

afterEach(async () => {
  await i18n.changeLanguage("en");
});

describe("Customer circle detail routing", () => {
  it("opens the specifically addressed Circle with verified and awaiting values separate", () => {
    render(
      <MemoryRouter initialEntries={["/customer/circles/program-1"]}>
        <Routes>
          <Route
            path="/customer/circles/:rewardProgramId"
            element={<CustomerCirclesPage auth={{} as never} functions={{} as never} />}
          />
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.getByRole("heading", { name: "Coffee Circle" })).toBeInTheDocument();
    expect(screen.getByText("7 of 10 verified")).toBeInTheDocument();
    expect(screen.getByText(/2 purchase\(s\) are waiting/)).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Style Circle" })).toBeNull();
  });

  it("fails neutrally when the customer does not participate in the addressed Circle", () => {
    render(
      <MemoryRouter initialEntries={["/customer/circles/unrelated"]}>
        <Routes>
          <Route
            path="/customer/circles/:rewardProgramId"
            element={<CustomerCirclesPage auth={{} as never} functions={{} as never} />}
          />
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.getByRole("status")).toHaveTextContent(
      "This Circle isn't available for your account.",
    );
  });

  it("shows authoritative available reward state and description", () => {
    render(
      <MemoryRouter initialEntries={["/customer/circles/program-2"]}>
        <Routes>
          <Route
            path="/customer/circles/:rewardProgramId"
            element={<CustomerCirclesPage auth={{} as never} functions={{} as never} />}
          />
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.getByText("11th available: A free style")).toBeInTheDocument();
  });
});
