import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { MemoryRouter, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { i18n } from "../../i18n";
import type { BusinessContext } from "../api/businessContext";
import { StaffRoutes } from "./StaffShell";
import { useStaffActionRequest } from "./staffActions";

// The Counter, Activity and Profile are mocked: this file proves the shell's ROUTING and keep-alive
// behaviour only (the real pages are exercised in StaffMobileShell.test.tsx).
vi.mock("./CounterPage", () => ({
  CounterPage: function MockCounter({
    context,
    active = true,
  }: {
    context: { displayName: string };
    active?: boolean;
  }) {
    const [draft, setDraft] = useState("");
    const [scans, setScans] = useState(0);
    useStaffActionRequest("scan", () => setScans((count) => count + 1));
    return (
      <section>
        <h1 tabIndex={-1} data-staff-view-heading>
          Counter page for {context.displayName}
        </h1>
        <input
          aria-label="draft"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
        />
        <output data-testid="counter-active">{String(active)}</output>
        <output data-testid="scan-requests">{scans}</output>
      </section>
    );
  },
}));
vi.mock("./StaffActivityPage", () => ({
  StaffActivityPage: () => (
    <h1 tabIndex={-1} data-staff-view-heading>
      Activity page
    </h1>
  ),
}));
vi.mock("./StaffProfilePage", () => ({
  StaffProfilePage: () => (
    <h1 tabIndex={-1} data-staff-view-heading>
      Profile page
    </h1>
  ),
}));

const context = { businessId: "biz-1", displayName: "Bella Salon" } as BusinessContext;

function Where() {
  const navigate = useNavigate();
  return (
    <>
      <output data-testid="where">{useLocation().pathname}</output>
      <button type="button" onClick={() => navigate(-1)}>
        history back
      </button>
    </>
  );
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

const bar = () => screen.getByRole("navigation", { name: "Counter navigation" });

beforeEach(async () => {
  await i18n.changeLanguage("en");
});
afterEach(cleanup);

describe("Staff shell (EA-BL-001-CORR-002-B — UX routing only)", () => {
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
    "profile-admin",
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

  it("offers exactly three PLACES (Counter, Activity, Profile) plus one quick-ACTION button — nothing administrative", () => {
    renderAt("/business/biz-1/dashboard/counter");
    const navs = screen.getAllByRole("navigation");
    expect(navs).toHaveLength(1);
    expect(
      within(bar())
        .getAllByRole("link")
        .map((link) => link.textContent?.trim()),
    ).toEqual(["Counter", "Activity", "Profile"]);
    expect(within(bar()).getAllByRole("button")).toHaveLength(1);
    expect(within(bar()).getByRole("button", { name: "Quick actions" })).toHaveAttribute(
      "aria-haspopup",
      "dialog",
    );
    // New customer is an ACTION, not a destination.
    expect(within(bar()).queryByRole("link", { name: /new customer/i })).not.toBeInTheDocument();
    expect(within(bar()).getByRole("link", { name: "Counter" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    for (const adminLabel of ["Team", "Business Terms", "Reward Programs", "Customer Rewards"]) {
      expect(screen.queryByRole("link", { name: adminLabel })).not.toBeInTheDocument();
    }
  });

  it("each place is a real route: Activity and Profile open, aria-current moves, Back returns", async () => {
    const user = userEvent.setup();
    renderAt("/business/biz-1/dashboard/counter");
    await user.click(within(bar()).getByRole("link", { name: "Activity" }));
    expect(screen.getByTestId("where")).toHaveTextContent("/business/biz-1/dashboard/activity");
    expect(await screen.findByRole("heading", { name: "Activity page" })).toHaveFocus();
    expect(within(bar()).getByRole("link", { name: "Activity" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(within(bar()).getByRole("link", { name: "Counter" })).not.toHaveAttribute(
      "aria-current",
    );

    await user.click(within(bar()).getByRole("link", { name: "Profile" }));
    expect(screen.getByTestId("where")).toHaveTextContent("/business/biz-1/dashboard/profile");
    expect(await screen.findByRole("heading", { name: "Profile page" })).toHaveFocus();

    // Normal browser navigation semantics: Back walks the places in order.
    await user.click(screen.getByRole("button", { name: "history back" }));
    expect(screen.getByTestId("where")).toHaveTextContent("/business/biz-1/dashboard/activity");
    await user.click(screen.getByRole("button", { name: "history back" }));
    expect(screen.getByTestId("where")).toHaveTextContent("/business/biz-1/dashboard/counter");
  });

  it("the Counter stays mounted (hidden) while another place is open: a transaction in progress is not lost, and the Counter knows it is not visible", async () => {
    const user = userEvent.setup();
    renderAt("/business/biz-1/dashboard/counter");
    await user.type(screen.getByLabelText("draft"), "ABC234");
    expect(screen.getByTestId("counter-active")).toHaveTextContent("true");

    await user.click(within(bar()).getByRole("link", { name: "Activity" }));
    expect(screen.getByTestId("counter-active")).toHaveTextContent("false");
    expect(screen.queryByRole("textbox", { name: "draft" })).not.toBeInTheDocument(); // hidden from the a11y tree

    await user.click(within(bar()).getByRole("link", { name: "Counter" }));
    expect(screen.getByLabelText("draft")).toHaveValue("ABC234");
    expect(screen.getByTestId("counter-active")).toHaveTextContent("true");
    expect(await screen.findByRole("heading", { name: /Counter page/ })).toHaveFocus();
  });

  it("the Scan quick action from another place returns to the Counter and asks it to scan, once", async () => {
    const user = userEvent.setup();
    renderAt("/business/biz-1/dashboard/profile");
    await user.click(within(bar()).getByRole("button", { name: "Quick actions" }));
    const dialog = screen.getByRole("dialog", { name: "Quick actions" });
    await user.click(within(dialog).getByRole("button", { name: /Scan customer QR/ }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByTestId("where")).toHaveTextContent("/business/biz-1/dashboard/counter");
    expect(screen.getByTestId("scan-requests")).toHaveTextContent("1");
  });

  it("is ONE shell at every width: no top-bar variant, a centred bounded app, no breakpoint branches", () => {
    renderAt("/business/biz-1/dashboard/counter");
    expect(screen.getByText("Bella Salon", { selector: "p" })).toBeInTheDocument();
    expect(screen.getByText("Staff counter")).toBeInTheDocument();
    const app = screen.getByTestId("staff-app");
    expect(app.className).toMatch(/mx-auto/);
    expect(app.className).toMatch(/max-w-lg/);
    expect(screen.getByTestId("staff-bottom-nav").className).toMatch(/fixed/);
    expect(screen.getByTestId("staff-bottom-nav").className).toMatch(/max-w-lg/);
    expect(screen.queryByRole("button", { name: "Français" })).not.toBeInTheDocument();
    expect(document.body.innerHTML).not.toMatch(/\bmd:|\blg:|\bxl:/);
  });

  it("renders its chrome in French", async () => {
    await i18n.changeLanguage("fr");
    renderAt("/business/biz-1/dashboard/counter");
    const nav = screen.getByRole("navigation", { name: "Navigation de la caisse" });
    expect(
      within(nav)
        .getAllByRole("link")
        .map((link) => link.textContent?.trim()),
    ).toEqual(["Caisse", "Activité", "Profil"]);
    expect(within(nav).getByRole("button", { name: "Actions rapides" })).toBeInTheDocument();
  });
});
