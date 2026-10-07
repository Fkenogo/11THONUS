import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { i18n } from "../../i18n";
import type { BusinessContext } from "../api/businessContext";
import { StaffRoutes } from "./StaffShell";

vi.mock("./CounterPage", () => ({
  CounterPage: ({ context }: { context: { displayName: string } }) => (
    <h1>Counter page for {context.displayName}</h1>
  ),
}));

const context = { businessId: "biz-1", displayName: "Bella Salon" } as BusinessContext;

function Where() {
  return <output data-testid="where">{useLocation().pathname}</output>;
}

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route
          path="/business/:businessId/dashboard/*"
          element={
            <>
              <StaffRoutes context={context} />
              <Where />
            </>
          }
        />
        <Route path="/business" element={<h1>Business chooser</h1>} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(async () => {
  await i18n.changeLanguage("en");
});
afterEach(cleanup);

describe("Staff shell (EA-BL-001-CORR-002-B, D8 — UX routing only)", () => {
  it("Staff land directly on the Counter from the dashboard entry", () => {
    renderAt("/business/biz-1/dashboard");
    expect(
      screen.getByRole("heading", { name: "Counter page for Bella Salon" }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("where")).toHaveTextContent("/business/biz-1/dashboard/counter");
  });

  it.each([
    "team",
    "terms",
    "profile",
    "reward-programs",
    "purchases",
    "customer-rewards",
    "locations",
    "nope",
  ])(
    "an Owner/Manager destination (%s) is not offered to Staff: it folds back to the Counter",
    (destination) => {
      renderAt(`/business/biz-1/dashboard/${destination}`);
      expect(
        screen.getByRole("heading", { name: "Counter page for Bella Salon" }),
      ).toBeInTheDocument();
      expect(screen.getByTestId("where")).toHaveTextContent("/business/biz-1/dashboard/counter");
    },
  );

  it("shows the Business name, a minimal navigation, a context switch and the language switcher — nothing administrative", () => {
    renderAt("/business/biz-1/dashboard/counter");
    expect(screen.getByText("Bella Salon", { selector: "p" })).toBeInTheDocument();
    const nav = screen.getByRole("navigation", { name: "Counter navigation" });
    const labels = within(nav)
      .getAllByRole("link")
      .map((link) => link.textContent?.trim());
    expect(labels).toEqual(["Counter", "Switch business or Personal"]);
    expect(within(nav).getByRole("link", { name: "Counter" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("button", { name: "Français" })).toBeInTheDocument();
    for (const adminLabel of [
      "Team",
      "Business Terms",
      "Reward Programs",
      "Customer Rewards",
      "Business Profile",
    ]) {
      expect(screen.queryByRole("link", { name: adminLabel })).not.toBeInTheDocument();
    }
  });

  it("is a top bar: no participant-style bottom navigation (rejected pattern)", () => {
    renderAt("/business/biz-1/dashboard/counter");
    const nav = screen.getByRole("navigation", { name: "Counter navigation" });
    expect(nav.className).not.toMatch(/fixed|bottom-0/);
  });

  it("the context switch leads to the Business/Personal chooser (where a dual-role person picks Personal)", async () => {
    renderAt("/business/biz-1/dashboard/counter");
    expect(screen.getByRole("link", { name: "Switch business or Personal" })).toHaveAttribute(
      "href",
      "/business",
    );
  });

  it("renders its chrome in French", async () => {
    await i18n.changeLanguage("fr");
    renderAt("/business/biz-1/dashboard/counter");
    const nav = screen.getByRole("navigation", { name: "Navigation de la caisse" });
    expect(within(nav).getByRole("link", { name: "Caisse" })).toBeInTheDocument();
    expect(
      within(nav).getByRole("link", { name: "Changer de commerce ou passer en Personnel" }),
    ).toBeInTheDocument();
  });
});
