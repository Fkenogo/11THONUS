/**
 * Staff mobile shell (Founder Preview Pass 1 correction): the Staff-only bottom bar, its in-page
 * section navigation and the More sheet, driven through the REAL StaffShell + CounterPage. Only the
 * Firebase callable boundary and the authenticated actor are faked (same approach as CounterPage tests).
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { i18n } from "../../i18n";
import { en } from "../../i18n/locales/en";
import { fr } from "../../i18n/locales/fr";
import type { BusinessContext } from "../api/businessContext";
import { StaffRoutes } from "./StaffShell";

vi.mock("firebase/functions", () => ({
  httpsCallable: (_functions: unknown, name: string) => async () => {
    if (name === "listRewardPrograms") {
      return {
        data: [
          {
            program: {
              id: "rp-1",
              displayName: "Premium Cut Circle",
              status: "active",
              currentVersionId: "rp-1-v1",
              sharedLoyaltyNumberAllowed: true,
            },
            currentVersion: {
              multipleUnitsAllowed: true,
              qualifyingItems: [
                {
                  qualifyingItemId: "i1",
                  itemNameAtVersion: "Haircut",
                  knowledgeNodeIdAtVersion: null,
                },
              ],
            },
            draftVersion: null,
          },
        ],
      };
    }
    if (name === "listMyRecentCounterPurchases") return { data: { purchases: [] } };
    throw Object.assign(new Error("no handler"), { code: "functions/unimplemented" });
  },
}));
vi.mock("../BusinessApiContext", () => ({
  useBusinessApiPlatform: () => ({ auth: {}, functions: {} }),
}));
vi.mock("../hooks/useAuthenticatedActor", () => ({
  useAuthenticatedActor: () => ({
    status: "ready",
    actor: { getIdToken: async () => "id-token", referenceType: "email" },
  }),
}));

const context = { businessId: "biz-1", displayName: "Bella Salon" } as BusinessContext;

function renderShell() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/business/biz-1/dashboard/counter"]}>
        <Routes>
          <Route
            path="/business/:businessId/dashboard/*"
            element={<StaffRoutes context={context} />}
          />
          <Route path="/business" element={<h1>Business chooser</h1>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const scrollIntoView = vi.fn();

beforeEach(async () => {
  scrollIntoView.mockClear();
  Element.prototype.scrollIntoView = scrollIntoView;
  await i18n.changeLanguage("en");
});
afterEach(() => {
  cleanup();
});

const bar = () => screen.getByRole("navigation", { name: "Counter navigation" });
const recordButton = () => screen.findByRole("button", { name: "Record purchase" });

describe("Staff mobile shell", () => {
  it("shows the Business name and exactly four labelled bottom-bar actions, with no duplicated top controls", async () => {
    renderShell();
    await recordButton();
    expect(screen.getByText("Bella Salon", { selector: "p" })).toBeInTheDocument();
    const labels = within(bar())
      .getAllByRole("button")
      .map((button) => button.textContent?.trim());
    expect(labels).toEqual(["Counter", "New customer", "Activity", "More"]);
    // Language and Switch Business / Personal live in More, not in the header.
    expect(screen.queryByRole("button", { name: "Français" })).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Switch business or Personal" }),
    ).not.toBeInTheDocument();
    expect(screen.getAllByRole("navigation")).toHaveLength(1);
  });

  it("marks the current destination with aria-current (not by colour alone)", async () => {
    const user = userEvent.setup();
    renderShell();
    await recordButton();
    expect(within(bar()).getByRole("button", { name: "Counter" })).toHaveAttribute(
      "aria-current",
      "true",
    );
    await user.click(within(bar()).getByRole("button", { name: "Activity" }));
    expect(within(bar()).getByRole("button", { name: "Activity" })).toHaveAttribute(
      "aria-current",
      "true",
    );
    expect(within(bar()).getByRole("button", { name: "Counter" })).not.toHaveAttribute(
      "aria-current",
    );
  });

  it("Counter returns to the Counter start without wiping a transaction in progress", async () => {
    const user = userEvent.setup();
    renderShell();
    await recordButton();
    await user.type(screen.getByLabelText("Loyalty Number"), "abc234");
    await user.click(within(bar()).getByRole("button", { name: "Activity" }));
    scrollIntoView.mockClear();
    await user.click(within(bar()).getByRole("button", { name: "Counter" }));
    await waitFor(() =>
      expect(screen.getByRole("heading", { level: 1, name: "Counter" })).toHaveFocus(),
    );
    expect(scrollIntoView).toHaveBeenCalled();
    expect((screen.getByLabelText("Loyalty Number") as HTMLInputElement).value).toBe("ABC234");
    // Tapping Counter again while already there is harmless.
    await user.click(within(bar()).getByRole("button", { name: "Counter" }));
    expect((screen.getByLabelText("Loyalty Number") as HTMLInputElement).value).toBe("ABC234");
  });

  it("New customer opens the existing panel, brings it into view and focuses it — keeping the transaction", async () => {
    const user = userEvent.setup();
    renderShell();
    await recordButton();
    await user.type(screen.getByLabelText("Loyalty Number"), "abc234");
    const toggle = screen.getByRole("button", { name: /New customer\?/ });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    await user.click(within(bar()).getByRole("button", { name: "New customer" }));
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "New customer" })).toHaveFocus(),
    );
    expect(scrollIntoView).toHaveBeenCalled();
    expect((screen.getByLabelText("Loyalty Number") as HTMLInputElement).value).toBe("ABC234");
    // The panel is still the tokenless two-device flow: no staff-side account creation.
    expect(
      screen.queryByRole("button", { name: /create|register walk-in|add customer/i }),
    ).not.toBeInTheDocument();
  });

  it("Activity focuses the Staff's own recent submissions section", async () => {
    const user = userEvent.setup();
    renderShell();
    await recordButton();
    await user.click(within(bar()).getByRole("button", { name: "Activity" }));
    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "Your recent submissions" })).toHaveFocus(),
    );
    expect(scrollIntoView).toHaveBeenCalled();
  });

  it("More opens a modal sheet with only language and Switch Business / Personal; Escape closes and returns focus", async () => {
    const user = userEvent.setup();
    renderShell();
    await recordButton();
    const more = within(bar()).getByRole("button", { name: "More" });
    await user.click(more);
    const dialog = screen.getByRole("dialog", { name: "More options" });
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(within(dialog).getByRole("button", { name: "Français" })).toBeInTheDocument();
    expect(
      within(dialog).getByRole("link", { name: "Switch business or Personal" }),
    ).toHaveAttribute("href", "/business");
    expect(within(dialog).getAllByRole("link")).toHaveLength(1);
    expect(within(dialog).getByRole("button", { name: "Close" })).toHaveFocus();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(more).toHaveFocus();
  });

  it("More keeps focus inside the sheet while open (Tab wraps) and the close button returns focus to More", async () => {
    const user = userEvent.setup();
    renderShell();
    await recordButton();
    const more = within(bar()).getByRole("button", { name: "More" });
    await user.click(more);
    const dialog = screen.getByRole("dialog");
    for (let step = 0; step < 6; step += 1) {
      await user.tab();
      expect(dialog.contains(document.activeElement)).toBe(true);
    }
    await user.click(within(dialog).getByRole("button", { name: "Close" }));
    expect(more).toHaveFocus();
  });

  it("the language switch inside More changes the shell to French, with the bar labels translated", async () => {
    const user = userEvent.setup();
    renderShell();
    await recordButton();
    await user.click(within(bar()).getByRole("button", { name: "More" }));
    await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Français" }));
    const frBar = screen.getByRole("navigation", { name: "Navigation de la caisse" });
    expect(
      within(frBar)
        .getAllByRole("button")
        .map((button) => button.textContent?.trim()),
    ).toEqual(["Caisse", "Nouveau client", "Activité", "Plus"]);
  });

  it("keeps the sticky Record bar above the bottom bar and reserves room for the bar", async () => {
    renderShell();
    const record = await recordButton();
    const stickyBar = record.parentElement as HTMLElement;
    expect(stickyBar.className).toContain("bottom-[var(--staff-nav-offset,0px)]");
    const main = document.querySelector("main") as HTMLElement;
    expect(main.className).toContain("pb-[calc(var(--staff-nav-offset,0px)+1rem)]");
    const shell = screen.getByTestId("staff-app").parentElement as HTMLElement;
    expect(shell.style.getPropertyValue("--staff-nav-offset")).toContain(
      "env(safe-area-inset-bottom)",
    );
  });
});

describe("Staff mobile shell — EN/FR parity", () => {
  it("every new shell key exists in both languages and is non-empty", () => {
    const keys = [
      "staffLabel",
      "newCustomer",
      "activity",
      "more",
      "moreTitle",
      "moreClose",
    ] as const;
    for (const key of keys) {
      expect(en.business.counter.shell[key]).toBeTruthy();
      expect(fr.business.counter.shell[key]).toBeTruthy();
      expect(fr.business.counter.shell[key]).not.toBe(en.business.counter.shell[key]);
    }
  });
});
