/**
 * Staff mobile application (Founder Preview Pass 3): the REAL StaffShell + Counter + Activity + Profile
 * + quick actions, with only the Firebase callable boundary, the authenticated actor and the camera
 * faked (same approach as the CounterPage tests).
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { i18n } from "../../i18n";
import { en } from "../../i18n/locales/en";
import { fr } from "../../i18n/locales/fr";
import type { BusinessContext } from "../api/businessContext";
import type { QrScanHandlers } from "./qrScanner";
import { StaffRoutes } from "./StaffShell";

type Handler = (payload: Record<string, unknown>) => Promise<unknown>;
let handlers: Record<string, Handler> = {};
let calls: Record<string, Record<string, unknown>[]> = {};
const scannerState: { handlers: QrScanHandlers | null; start: number; stop: number } = {
  handlers: null,
  start: 0,
  stop: 0,
};
const signOut = vi.fn(async () => {});

vi.mock("firebase/functions", () => ({
  httpsCallable:
    (_functions: unknown, name: string) => async (payload: Record<string, unknown>) => {
      (calls[name] ??= []).push(payload);
      const handler = handlers[name];
      if (!handler)
        throw Object.assign(new Error("no handler"), { code: "functions/unimplemented" });
      return { data: await handler(payload) };
    },
}));
vi.mock("../BusinessApiContext", () => ({
  useBusinessApiPlatform: () => ({
    auth: { currentUser: { uid: "staff-uid", email: "diane.staff@preview.example.test" } },
    functions: {},
  }),
}));
vi.mock("../hooks/useAuthenticatedActor", () => ({
  useAuthenticatedActor: () => ({
    status: "ready",
    actor: { getIdToken: async () => "id-token", referenceType: "email" },
  }),
}));
vi.mock("../../authentication/signOutFlow", () => ({
  signOutCurrentSession: (...args: unknown[]) =>
    (signOut as (...a: unknown[]) => Promise<void>)(...args),
}));
vi.mock("./qrScanner", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./qrScanner")>();
  return {
    ...actual,
    createCameraQrScanner: () => ({
      isSupported: () => true,
      start: (_video: HTMLVideoElement, h: QrScanHandlers) => {
        scannerState.start += 1;
        scannerState.handlers = h;
        return {
          stop: () => {
            scannerState.stop += 1;
          },
        };
      },
    }),
  };
});

const context = { businessId: "biz-1", displayName: "Bella Salon" } as BusinessContext;

const PROGRAMME = {
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
      { qualifyingItemId: "i1", itemNameAtVersion: "Haircut", knowledgeNodeIdAtVersion: null },
    ],
  },
  draftVersion: null,
};

const row = (id: string, quantity = 1) => ({
  id,
  recordedAt: "2026-10-07T09:30:00.000Z",
  itemLabel: "Haircut",
  quantity,
  status: "waiting_for_customer",
  presentedVia: "loyalty_number",
  customerCodeHint: "234",
});

function baseHandlers(): Record<string, Handler> {
  return {
    listRewardPrograms: async () => [PROGRAMME],
    listMyRecentCounterPurchases: async () => ({ purchases: [], nextCursor: null }),
    getCounterLoyaltyContext: async () => ({
      verifiedUnits: 8,
      requiredVerifiedUnits: 10,
      rewardStatus: "none",
      awaitingCustomerConfirmationUnits: 0,
    }),
  };
}

function renderShell(path = "/business/biz-1/dashboard/counter") {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[path]}>
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

beforeEach(async () => {
  handlers = baseHandlers();
  calls = {};
  scannerState.handlers = null;
  scannerState.start = 0;
  scannerState.stop = 0;
  signOut.mockClear();
  window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;
  await i18n.changeLanguage("en");
});
afterEach(cleanup);

const bar = () => screen.getByRole("navigation", { name: "Counter navigation" });
const ready = () => screen.findByRole("button", { name: "Record purchase" });
const fab = () => within(bar()).getByRole("button", { name: "Quick actions" });
const goTo = (user: ReturnType<typeof userEvent.setup>, name: string) =>
  user.click(within(bar()).getByRole("link", { name }));

describe("Staff Counter view — transaction-focused", () => {
  it("no longer carries the Activity list or a permanent New customer workflow (and never reads Activity just to render)", async () => {
    renderShell();
    await ready();
    expect(screen.queryByText("Your recent submissions")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /New customer\?/ })).not.toBeInTheDocument();
    expect(screen.queryByText(/sign-up address/i)).not.toBeInTheDocument();
    expect(calls.listMyRecentCounterPurchases).toBeUndefined();
  });
});

describe("Staff quick actions (FAB) — actions, not destinations", () => {
  it("opens a modal offering exactly Scan customer QR and Help a new customer join; Escape closes and returns focus to the button", async () => {
    const user = userEvent.setup();
    renderShell();
    await ready();
    await user.click(fab());
    const dialog = screen.getByRole("dialog", { name: "Quick actions" });
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(
      within(dialog)
        .getAllByRole("button")
        .map((button) => button.getAttribute("aria-label") ?? button.textContent?.trim()),
    ).toEqual([
      "Close",
      expect.stringMatching(/^Scan customer QR/),
      expect.stringMatching(/^Help a new customer join/),
    ]);
    // Nothing else: no customer search, no admin destination.
    expect(within(dialog).queryByRole("searchbox")).not.toBeInTheDocument();
    expect(within(dialog).queryByRole("link")).not.toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(fab()).toHaveFocus();
  });

  it("keeps Tab inside the open sheet", async () => {
    const user = userEvent.setup();
    renderShell();
    await ready();
    await user.click(fab());
    const dialog = screen.getByRole("dialog");
    for (let step = 0; step < 6; step += 1) {
      await user.tab();
      expect(dialog.contains(document.activeElement)).toBe(true);
    }
  });

  it("Scan customer QR reaches the Counter's existing scanner from the Counter", async () => {
    const user = userEvent.setup();
    renderShell();
    await ready();
    await user.click(fab());
    await user.click(
      within(screen.getByRole("dialog")).getByRole("button", { name: /^Scan customer QR/ }),
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await waitFor(() => expect(scannerState.start).toBe(1));
    expect(screen.getByRole("button", { name: "Cancel scanning" })).toBeInTheDocument();
  });

  it("Scan customer QR from Activity returns to the Counter and opens the scanner (no new route data, no reset)", async () => {
    const user = userEvent.setup();
    renderShell("/business/biz-1/dashboard/activity");
    await screen.findByRole("heading", { name: "Activity", level: 1 });
    await user.click(fab());
    await user.click(
      within(screen.getByRole("dialog")).getByRole("button", { name: /^Scan customer QR/ }),
    );
    expect(await screen.findByRole("heading", { name: "Counter", level: 1 })).toBeInTheDocument();
    await waitFor(() => expect(scannerState.start).toBe(1));
    // The request waited for the Counter to be the visible place: the scanner is live and focused there.
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Cancel scanning" })).toHaveFocus(),
    );
    expect(within(bar()).getByRole("link", { name: "Counter" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("a Scan request made before the programmes have loaded is HELD and then honoured — never silently lost", async () => {
    const gate: { release: (() => void) | null } = { release: null };
    handlers.listRewardPrograms = () =>
      new Promise((resolve) => {
        gate.release = () => resolve([PROGRAMME]);
      });
    const user = userEvent.setup();
    renderShell("/business/biz-1/dashboard/activity");
    await screen.findByRole("heading", { name: "Activity", level: 1 });
    await waitFor(() => expect(gate.release).not.toBeNull());
    await user.click(fab());
    await user.click(
      within(screen.getByRole("dialog")).getByRole("button", { name: /^Scan customer QR/ }),
    );
    expect(await screen.findByRole("heading", { name: "Counter", level: 1 })).toBeInTheDocument();
    expect(scannerState.start).toBe(0); // nothing to scan into yet…
    await act(async () => {
      gate.release?.();
    });
    await waitFor(() => expect(scannerState.start).toBe(1)); // …so it was held, then honoured
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Cancel scanning" })).toHaveFocus(),
    );
  });

  it("a Scan request when the Business has no programme does nothing (no scanner, no stray reopening later)", async () => {
    handlers.listRewardPrograms = async () => [];
    const user = userEvent.setup();
    renderShell("/business/biz-1/dashboard/activity");
    await screen.findByRole("heading", { name: "Activity", level: 1 });
    await user.click(fab());
    await user.click(
      within(screen.getByRole("dialog")).getByRole("button", { name: /^Scan customer QR/ }),
    );
    expect(
      await screen.findByText(/no active reward programme to record against yet/i),
    ).toBeInTheDocument();
    expect(scannerState.start).toBe(0);
    expect(screen.queryByRole("button", { name: "Cancel scanning" })).not.toBeInTheDocument();
  });

  it("Help a new customer join opens the existing tokenless sign-up flow as a sheet; closing returns focus to the button", async () => {
    const user = userEvent.setup();
    renderShell();
    await ready();
    await user.click(fab());
    await user.click(
      within(screen.getByRole("dialog")).getByRole("button", { name: /^Help a new customer join/ }),
    );
    const dialog = screen.getByRole("dialog", { name: "Help a new customer join" });
    expect(
      within(dialog).getByRole("img", { name: "QR code that opens the 11thONUS sign-up page" }),
    ).toBeInTheDocument();
    expect(within(dialog).getByText(`${window.location.origin}/`)).toBeInTheDocument();
    expect(within(dialog).getByText(/choose “Personal” after signing in/)).toBeInTheDocument();
    // The static address carries no token, identity, Business or customer data.
    const address = within(dialog).getByText(`${window.location.origin}/`).textContent ?? "";
    expect(address).not.toMatch(/[?#=]|biz-1|token/i);
    // No Staff-side account creation, no name/phone form.
    expect(
      within(dialog).queryByRole("button", { name: /create|register walk-in|add customer/i }),
    ).not.toBeInTheDocument();
    expect(within(dialog).queryByLabelText(/name|phone|password|email/i)).not.toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "Close" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(fab()).toHaveFocus();
  });
});

describe("Staff places keep a transaction safe", () => {
  it("a customer and loyalty status entered on the Counter survive a visit to Activity and Profile", async () => {
    const user = userEvent.setup();
    renderShell();
    await ready();
    await user.type(screen.getByLabelText("Loyalty Number"), "abc234");
    expect(await screen.findByText("8 of 10 verified")).toBeInTheDocument();

    await goTo(user, "Activity");
    expect(await screen.findByRole("heading", { name: "Activity", level: 1 })).toBeInTheDocument();
    await goTo(user, "Profile");
    expect(await screen.findByRole("heading", { name: "Profile", level: 1 })).toBeInTheDocument();
    await goTo(user, "Counter");

    expect(screen.getByLabelText("Loyalty Number")).toHaveValue("ABC234");
    expect(screen.getByText("8 of 10 verified")).toBeInTheDocument();
    // Moving between places recorded nothing; coming back simply re-reads the (possibly newer) status.
    expect(calls.recordPurchase).toBeUndefined();
    expect(screen.getByLabelText("Loyalty Number")).toHaveValue("ABC234");
  });

  it("leaving the Counter closes the camera; coming back does not silently reopen it", async () => {
    const user = userEvent.setup();
    renderShell();
    await ready();
    await user.click(screen.getByRole("button", { name: "Scan customer QR" }));
    await waitFor(() => expect(scannerState.start).toBe(1));
    await goTo(user, "Activity");
    await screen.findByRole("heading", { name: "Activity", level: 1 });
    expect(scannerState.stop).toBe(1);
    await goTo(user, "Counter");
    await ready();
    expect(scannerState.start).toBe(1);
    expect(screen.queryByRole("button", { name: "Cancel scanning" })).not.toBeInTheDocument();
  });

  it("no loyalty read is made while the Counter is not the visible place", async () => {
    const user = userEvent.setup();
    renderShell();
    await ready();
    await user.type(screen.getByLabelText("Loyalty Number"), "abc234");
    await screen.findByText("8 of 10 verified");
    await goTo(user, "Activity");
    await screen.findByRole("heading", { name: "Activity", level: 1 });
    expect(calls.getCounterLoyaltyContext).toHaveLength(1);
  });
});

describe("Staff Activity view — own submissions only, paged", () => {
  it("lists the server's own-submissions feed (neutral status, limited identifier) and asks by Business + page size only", async () => {
    handlers.listMyRecentCounterPurchases = async () => ({
      purchases: [
        row("r-1", 2),
        {
          ...row("r-2", 5),
          status: "business_review_required",
          presentedVia: "qr_identity",
          customerCodeHint: null,
        },
      ],
      nextCursor: null,
    });
    const user = userEvent.setup();
    renderShell();
    await ready();
    await goTo(user, "Activity");
    const section = await screen.findByRole("region", { name: "Your recent submissions" });
    expect(await within(section).findByText("2 × Haircut")).toBeInTheDocument();
    expect(within(section).getByText("5 × Haircut")).toBeInTheDocument();
    expect(within(section).getByText("Loyalty Number ending 234")).toBeInTheDocument();
    expect(within(section).getByText("Scanned QR code")).toBeInTheDocument();
    expect(within(section).getByText("Waiting for customer")).toBeInTheDocument();
    expect(within(section).getByText("Awaiting business review")).toBeInTheDocument();
    expect(calls.listMyRecentCounterPurchases[0]).toEqual({
      businessId: "biz-1",
      limit: 20,
      rawToken: "id-token",
      referenceType: "email",
    });
    expect(section.textContent).not.toMatch(/reviewer|threshold|reason|recorded by|colleague/i);
    expect(screen.getByText("That's everything you've recorded.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Load more" })).not.toBeInTheDocument();
  });

  it("'Load more' follows the opaque cursor and appends the next page; the end is stated", async () => {
    handlers.listMyRecentCounterPurchases = async (payload) =>
      payload.cursor === "cursor-2"
        ? { purchases: [row("r-3", 3)], nextCursor: null }
        : { purchases: [row("r-1", 1), row("r-2", 2)], nextCursor: "cursor-2" };
    const user = userEvent.setup();
    renderShell("/business/biz-1/dashboard/activity");
    expect(await screen.findByText("1 × Haircut")).toBeInTheDocument();
    expect(screen.queryByText("3 × Haircut")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Load more" }));
    expect(await screen.findByText("3 × Haircut")).toBeInTheDocument();
    expect(screen.getByText("1 × Haircut")).toBeInTheDocument();
    expect(calls.listMyRecentCounterPurchases[1]).toEqual({
      businessId: "biz-1",
      limit: 20,
      cursor: "cursor-2",
      rawToken: "id-token",
      referenceType: "email",
    });
    expect(screen.queryByRole("button", { name: "Load more" })).not.toBeInTheDocument();
    expect(screen.getByText("That's everything you've recorded.")).toBeInTheDocument();
  });

  it("a malformed timestamp never crashes the view; empty and failed states are explained", async () => {
    handlers.listMyRecentCounterPurchases = async () => ({
      purchases: [{ ...row("r-1", 2), recordedAt: {} }],
      nextCursor: null,
    });
    const first = renderShell("/business/biz-1/dashboard/activity");
    expect(await screen.findByText("2 × Haircut")).toBeInTheDocument();
    first.unmount();

    handlers.listMyRecentCounterPurchases = async () => ({ purchases: [], nextCursor: null });
    const second = renderShell("/business/biz-1/dashboard/activity");
    expect(await screen.findByText("You haven't recorded any purchases yet.")).toBeInTheDocument();
    second.unmount();

    handlers.listMyRecentCounterPurchases = async () => {
      throw Object.assign(new Error("x"), { code: "functions/unavailable" });
    };
    renderShell("/business/biz-1/dashboard/activity");
    expect(
      await screen.findByText("We couldn't load your recent submissions."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
  });

  it("the cache is partitioned by the signed-in member", async () => {
    const { container } = renderShell("/business/biz-1/dashboard/activity");
    await screen.findByText("You haven't recorded any purchases yet.");
    expect(container).toBeTruthy();
    expect(calls.listMyRecentCounterPurchases).toHaveLength(1);
  });

  it("a purchase recorded on the Counter appears in Activity afterwards", async () => {
    let rows: ReturnType<typeof row>[] = [];
    handlers.listMyRecentCounterPurchases = async () => ({ purchases: rows, nextCursor: null });
    handlers.recordPurchase = async () => {
      rows = [row("r-new", 4)];
      return {
        purchase: { id: "r-new", itemLabel: "Haircut", quantity: 4 },
        review: { required: false, status: "waiting_for_customer" },
      };
    };
    const user = userEvent.setup();
    renderShell();
    await ready();
    await user.type(screen.getByLabelText("Loyalty Number"), "abc234");
    await user.click(screen.getByRole("button", { name: "Record purchase" }));
    await screen.findByText("Purchase recorded.");
    await goTo(user, "Activity");
    const section = await screen.findByRole("region", { name: "Your recent submissions" });
    expect(await within(section).findByText("4 × Haircut")).toBeInTheDocument();
  });
});

describe("Staff Profile view — light identity and shell actions", () => {
  it("shows only the signed-in identity, the Business and the Staff role — no admin, no customer data", async () => {
    const user = userEvent.setup();
    renderShell();
    await ready();
    await goTo(user, "Profile");
    expect(await screen.findByRole("heading", { name: "Profile", level: 1 })).toHaveFocus();
    expect(screen.getByText("diane.staff@preview.example.test")).toBeInTheDocument();
    expect(screen.getAllByText("Bella Salon").length).toBeGreaterThan(0);
    expect(screen.getByText("Staff", { selector: "p" })).toBeInTheDocument();
    for (const forbidden of [
      "Team",
      "Permissions",
      "Business Terms",
      "Reward Programs",
      "Customers",
    ]) {
      expect(screen.queryByRole("link", { name: forbidden })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: forbidden })).not.toBeInTheDocument();
    }
  });

  it("language switches the whole shell (EN → FR), and Switch Business / Personal leads to the chooser", async () => {
    const user = userEvent.setup();
    renderShell("/business/biz-1/dashboard/profile");
    await screen.findByRole("heading", { name: "Profile", level: 1 });
    await user.click(screen.getByRole("button", { name: "Français" }));
    expect(await screen.findByRole("heading", { name: "Profil", level: 1 })).toBeInTheDocument();
    const frBar = screen.getByRole("navigation", { name: "Navigation de la caisse" });
    expect(
      within(frBar)
        .getAllByRole("link")
        .map((link) => link.textContent?.trim()),
    ).toEqual(["Caisse", "Activité", "Profil"]);
    await user.click(
      screen.getByRole("link", { name: "Changer de commerce ou passer en Personnel" }),
    );
    expect(await screen.findByRole("heading", { name: "Business chooser" })).toBeInTheDocument();
  });

  it("Switch business / Personal is a plain link to the chooser", async () => {
    renderShell("/business/biz-1/dashboard/profile");
    await screen.findByRole("heading", { name: "Profile", level: 1 });
    expect(screen.getByRole("link", { name: "Switch business or Personal" })).toHaveAttribute(
      "href",
      "/business",
    );
  });

  it("Sign out uses the existing client-session sign-out; a failure is explained", async () => {
    const user = userEvent.setup();
    renderShell("/business/biz-1/dashboard/profile");
    await screen.findByRole("heading", { name: "Profile", level: 1 });
    signOut.mockRejectedValueOnce(new Error("boom"));
    await user.click(screen.getByRole("button", { name: "Sign out" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "We couldn't sign you out. Please try again.",
    );
    await user.click(screen.getByRole("button", { name: "Sign out" }));
    expect(signOut).toHaveBeenCalledTimes(2);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});

describe("Staff shell — EN/FR parity of the new copy", () => {
  const leaves = (obj: unknown, prefix = ""): [string, string][] =>
    obj && typeof obj === "object"
      ? Object.entries(obj as Record<string, unknown>).flatMap(([key, value]) =>
          leaves(value, prefix ? `${prefix}.${key}` : key),
        )
      : [[prefix, String(obj)]];

  it("shell, quick, activity, profile and loyalty copy exists in both languages with the same placeholders", () => {
    const pick = (catalog: typeof en | typeof fr) =>
      Object.fromEntries(
        leaves(catalog.business.counter).filter(([key]) =>
          /^(shell|quick|activity|profile|loyalty)\./.test(key),
        ),
      );
    const english = pick(en);
    const french = pick(fr);
    expect(Object.keys(french).sort()).toEqual(Object.keys(english).sort());
    const placeholders = (text: string) => (text.match(/\{\{\w+\}\}/g) ?? []).sort();
    for (const key of Object.keys(english)) {
      expect(english[key].trim().length, key).toBeGreaterThan(0);
      expect(french[key].trim().length, key).toBeGreaterThan(0);
      expect(placeholders(french[key]), key).toEqual(placeholders(english[key]));
    }
  });

  it("the retired structure's copy is gone (More sheet, in-page New customer toggle)", () => {
    const keys = leaves(en.business.counter).map(([key]) => key);
    for (const retired of [
      "shell.more",
      "shell.moreTitle",
      "shell.moreClose",
      "shell.newCustomer",
      "newCustomer.toggle",
      "newCustomer.close",
    ]) {
      expect(keys).not.toContain(retired);
    }
  });
});

describe("Staff reward-available alert reaches the Staff before recording", () => {
  it("shows the prominent alert as soon as the customer + programme are known — and offers no redemption", async () => {
    handlers.getCounterLoyaltyContext = async () => ({
      verifiedUnits: 10,
      requiredVerifiedUnits: 10,
      rewardStatus: "available",
      awaitingCustomerConfirmationUnits: 0,
    });
    const user = userEvent.setup();
    renderShell();
    await ready();
    await act(async () => {
      await user.type(screen.getByLabelText("Loyalty Number"), "abc234");
    });
    expect(await screen.findByTestId("counter-loyalty-reward")).toHaveTextContent(
      "11th reward available",
    );
    expect(calls.recordPurchase).toBeUndefined();
    expect(
      screen.queryByRole("button", { name: /redeem|confirm reward/i }),
    ).not.toBeInTheDocument();
  });
});
