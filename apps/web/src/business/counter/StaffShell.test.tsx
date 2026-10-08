import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

  it("shows the Business name and ONE Staff navigation — the bottom bar — with nothing administrative", () => {
    renderAt("/business/biz-1/dashboard/counter");
    expect(screen.getByText("Bella Salon", { selector: "p" })).toBeInTheDocument();
    const navs = screen.getAllByRole("navigation");
    expect(navs).toHaveLength(1);
    const labels = within(navs[0])
      .getAllByRole("button")
      .map((button) => button.textContent?.trim());
    expect(labels).toEqual(["Counter", "New customer", "Activity", "More"]);
    expect(within(navs[0]).getByRole("button", { name: "Counter" })).toHaveAttribute(
      "aria-current",
      "true",
    );
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

  it("is one phone-oriented shell: a fixed bottom bar, no top-bar variant, centred at a bounded width", () => {
    renderAt("/business/biz-1/dashboard/counter");
    const nav = screen.getByTestId("staff-bottom-nav");
    expect(nav.className).toMatch(/fixed/);
    expect(nav.className).toMatch(/max-w-lg/);
    expect(screen.queryByRole("link", { name: "Counter" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Français" })).not.toBeInTheDocument();
    const app = screen.getByTestId("staff-app");
    expect(app.className).toMatch(/mx-auto/);
    expect(app.className).toMatch(/max-w-lg/);
    // No breakpoint-specific layout branch anywhere in the Staff shell.
    expect(document.body.innerHTML).not.toMatch(/\bmd:|\blg:|\bxl:/);
  });

  it("the context switch (in More) leads to the Business/Personal chooser (where a dual-role person picks Personal)", async () => {
    const user = userEvent.setup();
    renderAt("/business/biz-1/dashboard/counter");
    await user.click(screen.getByRole("button", { name: "More" }));
    expect(screen.getByRole("link", { name: "Switch business or Personal" })).toHaveAttribute(
      "href",
      "/business",
    );
  });

  it("renders its chrome in French", async () => {
    await i18n.changeLanguage("fr");
    renderAt("/business/biz-1/dashboard/counter");
    const nav = screen.getByRole("navigation", { name: "Navigation de la caisse" });
    expect(
      within(nav)
        .getAllByRole("button")
        .map((button) => button.textContent?.trim()),
    ).toEqual(["Caisse", "Nouveau client", "Activité", "Plus"]);
  });
});
