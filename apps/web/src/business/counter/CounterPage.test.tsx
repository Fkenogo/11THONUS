/**
 * Staff Counter behaviour (`EA-BL-001-CORR-002-B`).
 *
 * Drives the REAL page, hooks, intent holder, error classifier and transport adapters; only the
 * Firebase callable boundary (`httpsCallable`) and the authenticated actor are faked. That makes the
 * idempotency proofs end-to-end through the production code path: what the fake callable receives on a
 * retry is exactly what the real Functions endpoint would.
 */

import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { i18n } from "../../i18n";
import { en } from "../../i18n/locales/en";
import { fr } from "../../i18n/locales/fr";
import type { BusinessContext } from "../api/businessContext";
import type { QrScanHandlers, QrScanner } from "./qrScanner";
import { CounterPage } from "./CounterPage";

type Handler = (payload: Record<string, unknown>) => Promise<unknown>;
let handlers: Record<string, Handler> = {};
let calls: Record<string, Record<string, unknown>[]> = {};

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
  useBusinessApiPlatform: () => ({ auth: {}, functions: {} }),
}));
vi.mock("../hooks/useAuthenticatedActor", () => ({
  useAuthenticatedActor: () => ({
    status: "ready",
    actor: { getIdToken: async () => "id-token", referenceType: "email" },
  }),
}));

const context = { businessId: "biz-1", displayName: "Bella Salon" } as BusinessContext;

type Item = { qualifyingItemId: string; itemNameAtVersion: string };
function programme(
  id: string,
  name: string,
  items: Item[],
  options: { multipleUnitsAllowed?: boolean; extraVersion?: Record<string, unknown> } = {},
) {
  return {
    program: {
      id,
      displayName: name,
      status: "active",
      currentVersionId: `${id}-v1`,
      sharedLoyaltyNumberAllowed: true,
    },
    currentVersion: {
      multipleUnitsAllowed: options.multipleUnitsAllowed ?? true,
      bulkReviewThreshold: 9,
      qualifyingItems: items.map((i) => ({ ...i, knowledgeNodeIdAtVersion: null })),
      ...options.extraVersion,
    },
    draftVersion: null,
  };
}

const HAIRCUT = { qualifyingItemId: "item-cut", itemNameAtVersion: "Haircut" };
const BRAIDING = { qualifyingItemId: "item-braid", itemNameAtVersion: "Braiding" };

function recordResult(overrides: { required?: boolean; quantity?: number } = {}) {
  const required = overrides.required ?? false;
  return {
    purchase: {
      id: "p-1",
      itemLabel: "Haircut",
      quantity: overrides.quantity ?? 1,
      status: required ? "business_review_required" : "waiting_for_customer",
      customerIdentityId: "cust-secret",
      canonicalLoyaltyNumberValue: "ABC234",
    },
    review: {
      required,
      status: required ? "business_review_required" : "waiting_for_customer",
    },
  };
}

function setup(
  options: {
    programmes?: ReturnType<typeof programme>[];
    scanner?: QrScanner;
    record?: Handler;
    recent?: unknown[];
  } = {},
) {
  handlers = {
    listRewardPrograms: async () =>
      options.programmes ?? [programme("rp-1", "Premium Cut Circle", [HAIRCUT])],
    listMyRecentCounterPurchases: async () => ({ purchases: options.recent ?? [] }),
    recordPurchase: options.record ?? (async () => recordResult()),
  };
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { retry: false } },
  });
  const view = render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <CounterPage context={context} scanner={options.scanner} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
  return { ...view, queryClient };
}

function fakeScanner(supported = true) {
  const state: {
    handlers: QrScanHandlers | null;
    stop: Mock<() => void>;
    start: Mock<(video: HTMLVideoElement) => void>;
  } = {
    handlers: null,
    stop: vi.fn(),
    start: vi.fn(),
  };
  const scanner: QrScanner = {
    isSupported: () => supported,
    start: (video, h) => {
      state.start(video);
      state.handlers = h;
      return { stop: state.stop };
    },
  };
  return { scanner, state };
}

async function ready() {
  await screen.findByRole("button", { name: "Record purchase" });
}

const recordButton = () =>
  screen.getByRole("button", { name: /Record purchase|Retry — it won't record twice|Recording…/ });
const loyaltyInput = () => screen.getByLabelText("Loyalty Number") as HTMLInputElement;

async function typeLoyaltyNumber(user: ReturnType<typeof userEvent.setup>, value = "abc-234") {
  await user.type(loyaltyInput(), value);
}

beforeEach(async () => {
  calls = {};
  await i18n.changeLanguage("en");
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("Counter — loading, context and selections", () => {
  it("shows a loading state, then the real Business name and the identify/record controls", async () => {
    setup();
    expect(screen.getAllByRole("status")[0]).toHaveTextContent("Loading the counter…");
    await ready();
    expect(screen.getByRole("heading", { level: 1, name: "Counter" })).toBeInTheDocument();
    expect(screen.getByText(/Bella Salon/)).toBeInTheDocument();
    // D7: the Business name only — no invented station / branch label.
    expect(document.body.textContent).not.toMatch(/Front Desk|Station/i);
  });

  it("shows a retryable error when the programmes cannot be loaded", async () => {
    handlers = {
      listRewardPrograms: async () => {
        throw Object.assign(new Error("x"), { code: "functions/unavailable" });
      },
      listMyRecentCounterPurchases: async () => ({ purchases: [] }),
    };
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <CounterPage context={context} scanner={fakeScanner().scanner} />
        </MemoryRouter>
      </QueryClientProvider>,
    );
    expect(
      await screen.findByText("We couldn't load the counter. Please try again."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
  });

  it("says so (and offers no record form) when no programme is active", async () => {
    setup({ programmes: [] });
    expect(await screen.findByText(/no active reward programme/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Record purchase" })).not.toBeInTheDocument();
  });

  it("auto-selects the only programme and the only item (no picker), and shows the quantity stepper", async () => {
    setup();
    await ready();
    expect(screen.getByText("Premium Cut Circle")).toBeInTheDocument();
    expect(screen.queryByRole("radio")).not.toBeInTheDocument();
    expect(screen.getByText("Haircut")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Decrease quantity" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Increase quantity" })).toBeInTheDocument();
  });

  it("offers a choice when several programmes/items exist, and records the chosen ones", async () => {
    const user = userEvent.setup();
    setup({
      programmes: [
        programme("rp-1", "Premium Cut Circle", [HAIRCUT, BRAIDING]),
        programme("rp-2", "Family Care Circle", [
          { qualifyingItemId: "item-man", itemNameAtVersion: "Manicure" },
        ]),
      ],
    });
    await ready();
    await user.click(screen.getByRole("radio", { name: "Premium Cut Circle" }));
    await user.click(screen.getByRole("radio", { name: "Braiding" }));
    await typeLoyaltyNumber(user);
    await user.click(recordButton());
    await waitFor(() => expect(calls.recordPurchase).toHaveLength(1));
    expect(calls.recordPurchase[0]).toMatchObject({
      rewardProgramId: "rp-1",
      qualifyingItemId: "item-braid",
    });
  });

  it("hides the stepper and fixes the quantity at one when the programme does not allow multiple units", async () => {
    setup({
      programmes: [programme("rp-1", "Single", [HAIRCUT], { multipleUnitsAllowed: false })],
    });
    await ready();
    expect(screen.queryByRole("button", { name: "Increase quantity" })).not.toBeInTheDocument();
    expect(screen.getByText("One unit per purchase for this programme.")).toBeInTheDocument();
    await userEvent.setup().type(loyaltyInput(), "ABC234");
    await userEvent.setup().click(recordButton());
    await waitFor(() => expect(calls.recordPurchase).toHaveLength(1));
    expect(calls.recordPurchase[0].quantity).toBe(1);
  });

  it("the stepper never goes below one and its controls are named and at least 44px", async () => {
    const user = userEvent.setup();
    setup();
    await ready();
    const quantity = screen.getByLabelText("Quantity") as HTMLInputElement;
    expect(screen.getByRole("button", { name: "Decrease quantity" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Increase quantity" }));
    await user.click(screen.getByRole("button", { name: "Increase quantity" }));
    expect(quantity.value).toBe("3");
    await user.click(screen.getByRole("button", { name: "Decrease quantity" }));
    await user.click(screen.getByRole("button", { name: "Decrease quantity" }));
    expect(quantity.value).toBe("1");
    expect(screen.getByRole("button", { name: "Decrease quantity" })).toBeDisabled();
    for (const name of ["Decrease quantity", "Increase quantity"]) {
      expect(screen.getByRole("button", { name }).className).toMatch(/h-12 w-12/); // 48px
    }
    expect(recordButton().className).toMatch(/min-h-14/);
  });
});

describe("Counter — customer identification", () => {
  it("the Loyalty Number field is alphanumeric text: capitalising, never a numeric-only keypad", async () => {
    const user = userEvent.setup();
    setup();
    await ready();
    const input = loyaltyInput();
    expect(input).toHaveAttribute("type", "text");
    expect(input).toHaveAttribute("inputmode", "text");
    expect(input).not.toHaveAttribute("inputmode", "numeric");
    expect(input).toHaveAttribute("autocapitalize", "characters");
    expect(input).toHaveAttribute("autocorrect", "off");
    expect(input).toHaveAttribute("spellcheck", "false");
    await user.type(input, "abc-234");
    expect(input.value).toBe("ABC-234");
  });

  it("records by typed Loyalty Number with exactly one artifact field and no customer identity", async () => {
    const user = userEvent.setup();
    setup();
    await ready();
    await typeLoyaltyNumber(user);
    await user.click(recordButton());
    await waitFor(() => expect(calls.recordPurchase).toHaveLength(1));
    const payload = calls.recordPurchase[0];
    expect(payload).toMatchObject({
      businessId: "biz-1",
      rewardProgramId: "rp-1",
      qualifyingItemId: "item-cut",
      quantity: 1,
      loyaltyNumberValue: "ABC-234",
    });
    expect(payload).not.toHaveProperty("qrReference");
    expect(payload).not.toHaveProperty("customerIdentityId");
    expect(typeof payload.idempotencyKey).toBe("string");
    expect(new Date(payload.purchaseDate as string).getTime()).not.toBeNaN();
  });

  it("refuses to submit with no customer identified, naming the field, and sends nothing", async () => {
    const user = userEvent.setup();
    setup();
    await ready();
    await user.click(recordButton());
    expect(
      await screen.findByText("Scan the customer's QR or enter their Loyalty Number."),
    ).toBeInTheDocument();
    expect(calls.recordPurchase).toBeUndefined();
  });

  it("validates the quantity text and focuses the field", async () => {
    const user = userEvent.setup();
    setup();
    await ready();
    await typeLoyaltyNumber(user);
    const quantity = screen.getByLabelText("Quantity");
    await user.clear(quantity);
    await user.type(quantity, "1.5");
    await user.click(recordButton());
    expect(await screen.findByText("Enter a whole number of 1 or more.")).toBeInTheDocument();
    expect(quantity).toHaveAttribute("aria-invalid", "true");
    expect(quantity).toHaveFocus();
    expect(calls.recordPurchase).toBeUndefined();
  });
});

describe("Counter — camera QR scanning", () => {
  it("scan success: opens the camera, captures the QR, closes the camera, records by QR only", async () => {
    const user = userEvent.setup();
    const { scanner, state } = fakeScanner();
    setup({ scanner });
    await ready();
    await user.click(screen.getByRole("button", { name: "Scan customer QR" }));
    expect(state.start).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Opening the camera…")).toBeInTheDocument();
    expect(
      screen.getByLabelText("Camera view for scanning the customer's QR code"),
    ).toBeInTheDocument();
    // Focus moves into the scanner (Cancel is the first control).
    expect(screen.getByRole("button", { name: "Cancel scanning" })).toHaveFocus();

    act(() => state.handlers?.onReady());
    expect(screen.getByText("Point the camera at the customer's QR code.")).toBeInTheDocument();

    act(() => state.handlers?.onResult("qrRef_9z"));
    expect(state.stop).toHaveBeenCalled(); // camera closed after success
    expect(
      screen.queryByLabelText("Camera view for scanning the customer's QR code"),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Customer QR scanned")).toBeInTheDocument();
    expect(screen.queryByLabelText("Loyalty Number")).not.toBeInTheDocument();

    await user.click(recordButton());
    await waitFor(() => expect(calls.recordPurchase).toHaveLength(1));
    expect(calls.recordPurchase[0]).toMatchObject({ qrReference: "qrRef_9z" });
    expect(calls.recordPurchase[0]).not.toHaveProperty("loyaltyNumberValue");
  });

  it("cancel closes the camera and returns focus to the scan control", async () => {
    const user = userEvent.setup();
    const { scanner, state } = fakeScanner();
    setup({ scanner });
    await ready();
    await user.click(screen.getByRole("button", { name: "Scan customer QR" }));
    act(() => state.handlers?.onReady());
    await user.click(screen.getByRole("button", { name: "Cancel scanning" }));
    expect(state.stop).toHaveBeenCalled();
    expect(
      screen.queryByLabelText("Camera view for scanning the customer's QR code"),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Scan customer QR" })).toHaveFocus();
  });

  it("leaving the page while scanning closes the camera (no persistent camera use)", async () => {
    const user = userEvent.setup();
    const { scanner, state } = fakeScanner();
    const view = setup({ scanner });
    await ready();
    await user.click(screen.getByRole("button", { name: "Scan customer QR" }));
    act(() => state.handlers?.onReady());
    view.unmount();
    expect(state.stop).toHaveBeenCalled();
  });

  it("a foreign (non-11thONUS) QR is called out while scanning continues", async () => {
    const user = userEvent.setup();
    const { scanner, state } = fakeScanner();
    setup({ scanner });
    await ready();
    await user.click(screen.getByRole("button", { name: "Scan customer QR" }));
    act(() => state.handlers?.onReady());
    act(() => state.handlers?.onForeignCode?.());
    expect(screen.getByRole("alert")).toHaveTextContent("That isn't an 11thONUS customer code.");
    expect(screen.getByRole("button", { name: "Cancel scanning" })).toBeInTheDocument();
  });

  it("scanner unsupported: the scan control is disabled with an explanation and Loyalty Number entry works", async () => {
    const user = userEvent.setup();
    const { scanner, state } = fakeScanner(false);
    setup({ scanner });
    await ready();
    const scan = screen.getByRole("button", { name: "Scan customer QR" });
    expect(scan).toBeDisabled();
    expect(
      screen.getByText(/Camera scanning isn't available on this device or browser/),
    ).toBeInTheDocument();
    expect(state.start).not.toHaveBeenCalled();
    await typeLoyaltyNumber(user);
    await user.click(recordButton());
    await waitFor(() => expect(calls.recordPurchase).toHaveLength(1));
  });

  it("camera permission denied: explains, falls back to Loyalty Number, and can try the camera again", async () => {
    const user = userEvent.setup();
    const { scanner, state } = fakeScanner();
    setup({ scanner });
    await ready();
    await user.click(screen.getByRole("button", { name: "Scan customer QR" }));
    act(() => state.handlers?.onFailure("permission_denied"));
    expect(screen.getByRole("alert")).toHaveTextContent("Camera access is blocked.");
    expect(screen.getByLabelText("Loyalty Number")).toBeInTheDocument();
    expect(state.stop).toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Try the camera again" }));
    expect(state.start).toHaveBeenCalledTimes(2);
  });

  it.each([
    ["no_camera", "No camera was found."],
    ["failed", "The camera couldn't start."],
  ] as const)(
    "camera failure %s is explained with the Loyalty Number fallback",
    async (failure, copy) => {
      const user = userEvent.setup();
      const { scanner, state } = fakeScanner();
      setup({ scanner });
      await ready();
      await user.click(screen.getByRole("button", { name: "Scan customer QR" }));
      act(() => state.handlers?.onFailure(failure));
      expect(screen.getByRole("alert")).toHaveTextContent(copy);
      expect(screen.getByLabelText("Loyalty Number")).toBeInTheDocument();
    },
  );

  it("clearing a scan returns to Loyalty Number entry; typing a number replaces a scan", async () => {
    const user = userEvent.setup();
    const { scanner, state } = fakeScanner();
    setup({ scanner });
    await ready();
    await user.click(screen.getByRole("button", { name: "Scan customer QR" }));
    act(() => state.handlers?.onResult("qrRef_1"));
    await user.click(screen.getByRole("button", { name: "Clear" }));
    expect(screen.getByLabelText("Loyalty Number")).toBeInTheDocument();
    expect(screen.queryByText("Customer QR scanned")).not.toBeInTheDocument();
  });
});

describe("Counter — outcomes (server-truthful, never implying value)", () => {
  it("normal: 'Purchase recorded. The customer needs to confirm it. Nothing has been earned yet.' — no progress, no reward", async () => {
    const user = userEvent.setup();
    setup();
    await ready();
    await typeLoyaltyNumber(user);
    await user.click(recordButton());
    const status = await screen.findByRole("status", { name: "" }).catch(() => null);
    expect(status).not.toBeNull();
    expect(await screen.findByText("Purchase recorded.")).toBeInTheDocument();
    expect(
      screen.getByText("The customer needs to confirm it. Nothing has been earned yet."),
    ).toBeInTheDocument();
    expect(screen.getByText("1 × Haircut")).toBeInTheDocument();
    const text = document.body.textContent ?? "";
    expect(text).not.toMatch(
      /verified units|reward earned|Circle|approved|added to|\d+ of \d+|cycle/i,
    );
    // The server's full result row is not retained: no customer identity / Loyalty Number snapshot.
    expect(text).not.toContain("cust-secret");
    expect(text).not.toContain("ABC234");
    // Focus is on the outcome so it is announced.
    expect(screen.getByRole("heading", { name: "Purchase recorded." })).toHaveFocus();
    // The form is gone (no accidental second record) and the reset action is offered.
    expect(screen.queryByRole("button", { name: "Record purchase" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Serve next customer" })).toBeInTheDocument();
  });

  it("business review required: a SUCCESS ('Business review is required before customer confirmation.'), no controls, no threshold", async () => {
    const user = userEvent.setup();
    setup({
      programmes: [
        programme("rp-1", "Premium Cut Circle", [HAIRCUT], {
          extraVersion: { businessReviewQuantityThreshold: 5 },
        }),
      ],
      record: async () => recordResult({ required: true, quantity: 5 }),
    });
    await ready();
    await typeLoyaltyNumber(user);
    await user.click(recordButton());
    expect(
      await screen.findByText("Business review is required before customer confirmation."),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Purchase recorded." })).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument(); // not an error
    expect(
      screen.queryByText("The customer needs to confirm it. Nothing has been earned yet."),
    ).not.toBeInTheDocument();
    for (const forbidden of [
      /threshold/i,
      /reviewer/i,
      /approve/i,
      /reject/i,
      /verify/i,
      /reason/i,
    ]) {
      expect(document.body.textContent ?? "").not.toMatch(forbidden);
    }
    expect(
      screen.queryByRole("button", { name: /approve|reject|verify|redeem|confirm reward/i }),
    ).not.toBeInTheDocument();
  });

  it("Serve next customer: clears customer/outcome, restores a fresh form and focuses the first control", async () => {
    const user = userEvent.setup();
    setup({ scanner: fakeScanner().scanner });
    await ready();
    await typeLoyaltyNumber(user);
    await user.click(screen.getByRole("button", { name: "Increase quantity" }));
    await user.click(recordButton());
    await user.click(await screen.findByRole("button", { name: "Serve next customer" }));
    await screen.findByRole("button", { name: "Record purchase" });
    expect(loyaltyInput().value).toBe("");
    expect((screen.getByLabelText("Quantity") as HTMLInputElement).value).toBe("1");
    expect(screen.queryByText("Purchase recorded.")).not.toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Scan customer QR" })).toHaveFocus(),
    );
  });

  it("never offers customer progress, redemption, review or customer-profile controls", async () => {
    setup();
    await ready();
    const text = document.body.textContent ?? "";
    expect(text).not.toMatch(
      /Loyalty Circle|progress|redeem|confirm reward|approve|reject|review queue/i,
    );
    expect(screen.queryByPlaceholderText(/search/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/name|phone/i)).not.toBeInTheDocument();
  });
});

describe("Counter — error copy (safe public discriminator only)", () => {
  async function failWith(error: Record<string, unknown>) {
    const user = userEvent.setup();
    setup({
      record: async () => {
        throw Object.assign(new Error("raw server detail"), error);
      },
    });
    await ready();
    await typeLoyaltyNumber(user);
    await user.click(recordButton());
    return user;
  }
  const invalid = (reason: string) => ({ code: "functions/invalid-argument", details: { reason } });

  it("customer code: tells Staff to check it or ask the customer to open their code, and associates the error with the field", async () => {
    await failWith(invalid("customer_artifact_invalid_or_not_found"));
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(
      "We couldn't find that customer code. Check it or ask the customer to open their code.",
    );
    const input = loyaltyInput();
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input.getAttribute("aria-describedby")).toContain(alert.id);
  });

  it.each([
    ["programme_unavailable", "This programme isn't available. Refresh and try again."],
    ["qualifying_item_invalid", "That item isn't part of this programme."],
    ["quantity_invalid", "This programme doesn't allow that quantity."],
    [
      "generic_validation_failed",
      "We couldn't record this purchase. Check the details and try again.",
    ],
  ])("%s → its own copy", async (reason, copy) => {
    await failWith(invalid(reason));
    expect(await screen.findByRole("alert")).toHaveTextContent(copy);
  });

  it("an unknown/absent reason is the generic copy — never a raw code or server message", async () => {
    await failWith({ code: "functions/invalid-argument", details: { reason: "brand_new_token" } });
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(
      "We couldn't record this purchase. Check the details and try again.",
    );
    expect(document.body.textContent).not.toMatch(
      /brand_new_token|raw server detail|purchase_command_failed|functions\//,
    );
  });

  it("a programme failure offers a refresh that reloads the programmes", async () => {
    const user = await failWith(invalid("programme_unavailable"));
    await screen.findByRole("alert");
    const before = calls.listRewardPrograms.length;
    await user.click(screen.getByRole("button", { name: "Refresh programmes" }));
    await waitFor(() => expect(calls.listRewardPrograms.length).toBeGreaterThan(before));
  });

  it("session expiry: asks to sign in again and keeps the entered form", async () => {
    await failWith({ code: "functions/unauthenticated" });
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Your session has ended. Sign in again to continue.",
    );
    expect(screen.getByRole("link", { name: "Sign in again" })).toHaveAttribute("href", "/");
    expect(loyaltyInput().value).toBe("ABC-234");
  });

  it("authorisation failure (revoked/suspended): 'You can't record purchases right now. Ask a manager.'", async () => {
    await failWith({ code: "functions/permission-denied" });
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "You can't record purchases right now. Ask a manager.",
    );
  });
});

describe("Counter — double-tap prevention", () => {
  it("two rapid taps submit once; the button is disabled while recording", async () => {
    let release: (value: unknown) => void = () => undefined;
    const user = userEvent.setup();
    setup({
      record: () =>
        new Promise((resolve) => {
          release = resolve;
        }),
    });
    await ready();
    await typeLoyaltyNumber(user);
    const button = recordButton();
    fireEvent.click(button);
    fireEvent.click(button);
    fireEvent.submit(button.closest("form") as HTMLFormElement);
    await waitFor(() => expect(button).toBeDisabled());
    expect(button).toHaveTextContent("Recording…");
    expect(calls.recordPurchase).toHaveLength(1);
    await act(async () => release(recordResult()));
    expect(await screen.findByText("Purchase recorded.")).toBeInTheDocument();
    expect(calls.recordPurchase).toHaveLength(1);
  });
});

describe("Counter — one intentional submission = one Purchase (purchaseDate + payload + key)", () => {
  function lostThenCommitted() {
    let attempt = 0;
    return async () => {
      attempt += 1;
      if (attempt === 1) {
        // The Firebase SDK reports a dropped connection / lost response as `functions/internal`.
        throw Object.assign(new Error("Failed to fetch"), { code: "functions/internal" });
      }
      return recordResult();
    };
  }

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-10-07T10:00:00.000Z"));
  });

  it("uncertain failure → retry reuses the SAME idempotency key, purchaseDate and payload, and recovers", async () => {
    const user = userEvent.setup({ advanceTimers: () => undefined });
    setup({ record: lostThenCommitted() });
    await ready();
    await typeLoyaltyNumber(user);
    await user.click(recordButton());

    // Not a failure to record: an honest "we couldn't confirm", with a retry that won't double-record.
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "We couldn't confirm the result. Retry — it won't record twice.",
    );
    const retry = screen.getByRole("button", { name: "Retry — it won't record twice" });
    expect(retry).toBeEnabled();
    expect(loyaltyInput().value).toBe("ABC-234"); // nothing was cleared

    // Time passes before the retry: a recomputed purchaseDate would now differ.
    vi.setSystemTime(new Date("2026-10-07T10:00:07.500Z"));
    await user.click(retry);

    expect(await screen.findByText("Purchase recorded.")).toBeInTheDocument();
    expect(calls.recordPurchase).toHaveLength(2);
    const [first, second] = calls.recordPurchase;
    expect(second.idempotencyKey).toBe(first.idempotencyKey);
    expect(second.purchaseDate).toBe(first.purchaseDate);
    expect(first.purchaseDate).toBe("2026-10-07T10:00:00.000Z");
    expect(second).toEqual(first);
    expect(
      screen.getByText("We confirmed your earlier attempt. This purchase was recorded once."),
    ).toBeInTheDocument();
  });

  it("repeated uncertain failures keep reusing the same key and date until one is acknowledged", async () => {
    const user = userEvent.setup({ advanceTimers: () => undefined });
    let attempt = 0;
    setup({
      record: async () => {
        attempt += 1;
        if (attempt <= 2) throw Object.assign(new Error("net"), { code: "functions/unavailable" });
        return recordResult();
      },
    });
    await ready();
    await typeLoyaltyNumber(user);
    await user.click(recordButton());
    await screen.findByRole("alert");
    vi.setSystemTime(new Date("2026-10-07T10:01:00.000Z"));
    await user.click(screen.getByRole("button", { name: "Retry — it won't record twice" }));
    await waitFor(() => expect(calls.recordPurchase).toHaveLength(2));
    await screen.findByRole("button", { name: "Retry — it won't record twice" });
    vi.setSystemTime(new Date("2026-10-07T10:02:00.000Z"));
    await user.click(screen.getByRole("button", { name: "Retry — it won't record twice" }));
    await screen.findByText("Purchase recorded.");
    const keys = new Set(calls.recordPurchase.map((c) => c.idempotencyKey));
    const dates = new Set(calls.recordPurchase.map((c) => c.purchaseDate));
    expect(calls.recordPurchase).toHaveLength(3);
    expect(keys.size).toBe(1);
    expect(dates.size).toBe(1);
  });

  it("an intentional change of a transaction-defining input starts a fresh intent (new key AND new date)", async () => {
    const user = userEvent.setup({ advanceTimers: () => undefined });
    setup({ record: lostThenCommitted() });
    await ready();
    await typeLoyaltyNumber(user);
    await user.click(recordButton());
    await screen.findByRole("alert");
    vi.setSystemTime(new Date("2026-10-07T10:05:00.000Z"));
    await user.click(screen.getByRole("button", { name: "Increase quantity" })); // intentional change
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    await user.click(recordButton());
    await screen.findByText("Purchase recorded.");
    const [first, second] = calls.recordPurchase;
    expect(second.idempotencyKey).not.toBe(first.idempotencyKey);
    expect(second.purchaseDate).toBe("2026-10-07T10:05:00.000Z");
    expect(second.quantity).toBe(2);
  });

  it("a DEFINITIVE failure discards the intent: the next attempt has a new key and date (never a stale one)", async () => {
    const user = userEvent.setup({ advanceTimers: () => undefined });
    let attempt = 0;
    setup({
      record: async () => {
        attempt += 1;
        if (attempt === 1) {
          throw Object.assign(new Error("x"), {
            code: "functions/invalid-argument",
            details: { reason: "customer_artifact_invalid_or_not_found" },
          });
        }
        return recordResult();
      },
    });
    await ready();
    await typeLoyaltyNumber(user);
    await user.click(recordButton());
    await screen.findByRole("alert");
    vi.setSystemTime(new Date("2026-10-07T10:03:00.000Z"));
    await user.click(screen.getByRole("button", { name: "Record purchase" })); // same input, resubmitted
    await screen.findByText("Purchase recorded.");
    const [first, second] = calls.recordPurchase;
    expect(second.idempotencyKey).not.toBe(first.idempotencyKey);
    expect(second.purchaseDate).toBe("2026-10-07T10:03:00.000Z");
  });

  it("Serve next customer begins a new lifecycle: the next purchase has its own key and its own (fresh) date", async () => {
    const user = userEvent.setup({ advanceTimers: () => undefined });
    setup();
    await ready();
    await typeLoyaltyNumber(user);
    await user.click(recordButton());
    await user.click(await screen.findByRole("button", { name: "Serve next customer" }));
    await screen.findByRole("button", { name: "Record purchase" });
    vi.setSystemTime(new Date("2026-10-07T10:09:00.000Z"));
    await typeLoyaltyNumber(user); // the SAME customer code again — a genuinely new purchase
    await user.click(recordButton());
    await screen.findByText("Purchase recorded.");
    const [first, second] = calls.recordPurchase;
    expect(second.idempotencyKey).not.toBe(first.idempotencyKey);
    expect(second.purchaseDate).toBe("2026-10-07T10:09:00.000Z");
    // The date is captured at submission, not when the form was reset.
    expect(first.purchaseDate).toBe("2026-10-07T10:00:00.000Z");
  });
});

describe("Counter — own recent activity", () => {
  const rows = [
    {
      id: "r-1",
      recordedAt: "2026-10-07T09:30:00.000Z",
      itemLabel: "Haircut",
      quantity: 2,
      status: "waiting_for_customer",
      presentedVia: "loyalty_number",
      customerCodeHint: "234",
    },
    {
      id: "r-2",
      recordedAt: "2026-10-07T09:10:00.000Z",
      itemLabel: "Braiding",
      quantity: 5,
      status: "business_review_required",
      presentedVia: "qr_identity",
      customerCodeHint: null,
    },
  ];

  it("lists only the server's own-submissions feed, asks for it by Business only, and shows neutral status", async () => {
    setup({ recent: rows });
    await ready();
    const section = await screen.findByRole("region", { name: "Your recent submissions" });
    expect(within(section).getByText("2 × Haircut")).toBeInTheDocument();
    expect(within(section).getByText("5 × Braiding")).toBeInTheDocument();
    expect(within(section).getByText("Loyalty Number ending 234")).toBeInTheDocument();
    expect(within(section).getByText("Scanned QR code")).toBeInTheDocument();
    expect(within(section).getByText("Waiting for customer")).toBeInTheDocument();
    expect(within(section).getByText("Awaiting business review")).toBeInTheDocument();
    expect(calls.listMyRecentCounterPurchases[0]).toEqual({
      businessId: "biz-1",
      rawToken: "id-token",
      referenceType: "email",
    });
    // No colleague, reviewer, reason, threshold or customer profile data.
    expect(section.textContent).not.toMatch(/reviewer|threshold|reason|recorded by|colleague/i);
  });

  it("a malformed timestamp (e.g. a Date that crossed the wire as {}) never crashes the Counter", async () => {
    setup({
      recent: [
        { ...rows[0], recordedAt: {} },
        { ...rows[1], recordedAt: "not-a-date" },
      ],
    });
    await ready();
    const section = await screen.findByRole("region", { name: "Your recent submissions" });
    expect(within(section).getByText("2 × Haircut")).toBeInTheDocument();
    expect(within(section).getByText("5 × Braiding")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Record purchase" })).toBeInTheDocument();
  });

  it("says so when nothing has been recorded yet", async () => {
    setup({ recent: [] });
    await ready();
    expect(await screen.findByText("You haven't recorded any purchases yet.")).toBeInTheDocument();
  });

  it("refreshes after a successful record", async () => {
    const user = userEvent.setup();
    setup({ recent: rows });
    await ready();
    await screen.findByText("2 × Haircut");
    const before = calls.listMyRecentCounterPurchases.length;
    await typeLoyaltyNumber(user);
    await user.click(recordButton());
    await screen.findByText("Purchase recorded.");
    await waitFor(() => expect(calls.listMyRecentCounterPurchases.length).toBeGreaterThan(before));
  });

  it("a load failure is explained and retryable without hiding the Counter", async () => {
    handlers = {
      listRewardPrograms: async () => [programme("rp-1", "Premium Cut Circle", [HAIRCUT])],
      listMyRecentCounterPurchases: async () => {
        throw Object.assign(new Error("x"), { code: "functions/unavailable" });
      },
    };
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <CounterPage context={context} scanner={fakeScanner().scanner} />
        </MemoryRouter>
      </QueryClientProvider>,
    );
    expect(
      await screen.findByText("We couldn't load your recent submissions."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Record purchase" })).toBeInTheDocument();
  });
});

describe("Counter — Business Review confidentiality in the browser", () => {
  const withThreshold = [
    programme("rp-1", "Premium Cut Circle", [HAIRCUT], {
      extraVersion: { businessReviewQuantityThreshold: 7 },
    }),
  ];

  it("even when the server response carries the threshold (Owner/Manager), it never reaches the DOM, the cache, or the request", async () => {
    const user = userEvent.setup();
    const { queryClient } = setup({ programmes: withThreshold });
    await ready();
    await typeLoyaltyNumber(user);
    await user.click(recordButton());
    await screen.findByText("Purchase recorded.");

    expect(document.body.innerHTML).not.toMatch(/threshold|businessReview/i);
    const cached = JSON.stringify(
      queryClient
        .getQueryCache()
        .getAll()
        .map((q) => q.state.data),
    );
    expect(cached).not.toMatch(/businessReviewQuantityThreshold|bulkReviewThreshold/);
    expect(JSON.stringify(calls.recordPurchase)).not.toMatch(/hreshold/);
  });

  it("an absent threshold key behaves identically to a present one: the page never reads it ('unknown / not Staff data', never 'disabled')", async () => {
    const user = userEvent.setup();
    setup({ programmes: [programme("rp-1", "Premium Cut Circle", [HAIRCUT])] });
    await ready();
    await typeLoyaltyNumber(user);
    // Quantity far above any plausible threshold: still no client-side warning, hold or hint.
    const quantity = screen.getByLabelText("Quantity");
    await user.clear(quantity);
    await user.type(quantity, "50");
    expect(screen.queryByText(/approval|held|manager|review/i)).not.toBeInTheDocument();
    await user.click(recordButton());
    await screen.findByText("Purchase recorded.");
    expect(calls.recordPurchase[0].quantity).toBe(50);
  });
});

describe("Counter — new customer assistance (tokenless two-device registration)", () => {
  it("shows the static public sign-up address as text and as a QR, with concise steps", async () => {
    const user = userEvent.setup();
    setup();
    await ready();
    const toggle = screen.getByRole("button", { name: /New customer\?/ });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText(`${window.location.origin}/`)).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: "QR code that opens the 11thONUS sign-up page" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Ask the customer to scan this code with their phone/),
    ).toBeInTheDocument();
    expect(screen.getByText(/They show you their QR code or Loyalty Number/)).toBeInTheDocument();
  });

  it("tells a customer who also uses 11thONUS for a business to choose “Personal” after signing in", async () => {
    const user = userEvent.setup();
    setup();
    await ready();
    await user.click(screen.getByRole("button", { name: /New customer\?/ }));
    expect(
      screen.getByText(
        "If they also use 11thONUS for a business, they should choose “Personal” after signing in to see their customer QR and Loyalty Number.",
      ),
    ).toBeInTheDocument();
  });

  it("the address carries no token, identity, Business or customer data — and there is no Staff-side account creation", async () => {
    const user = userEvent.setup();
    setup();
    await ready();
    await user.click(screen.getByRole("button", { name: /New customer\?/ }));
    const address = screen.getByText(`${window.location.origin}/`).textContent ?? "";
    expect(address).toBe(`${window.location.origin}/`);
    expect(address).not.toMatch(/[?#=]|biz-1|token/i);
    // No registration form, name/phone fields or "create account" action exists on the Counter.
    expect(
      screen.queryByRole("button", { name: /create|register walk-in|add customer/i }),
    ).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/name|phone|password|email/i)).not.toBeInTheDocument();
  });
});

describe("Counter — French", () => {
  it("renders the Counter in French (no embedded English production strings)", async () => {
    await i18n.changeLanguage("fr");
    setup();
    await screen.findByRole("button", { name: "Enregistrer l'achat" });
    expect(screen.getByRole("heading", { level: 1, name: "Caisse" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Scanner le QR du client" })).toBeInTheDocument();
    expect(screen.getByLabelText("Numéro de fidélité")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Nouveau client/ })).toBeInTheDocument();
    expect(
      screen.queryByText(/Record purchase|Scan customer QR|Loyalty Number/),
    ).not.toBeInTheDocument();
  });

  it("French outcome and error copy", async () => {
    await i18n.changeLanguage("fr");
    const user = userEvent.setup();
    setup({ record: async () => recordResult({ required: true, quantity: 5 }) });
    await screen.findByRole("button", { name: "Enregistrer l'achat" });
    await user.type(screen.getByLabelText("Numéro de fidélité"), "abc234");
    await user.click(screen.getByRole("button", { name: "Enregistrer l'achat" }));
    expect(await screen.findByText("Achat enregistré.")).toBeInTheDocument();
    expect(screen.getByText(/vérification par le commerce est nécessaire/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Client suivant" })).toBeInTheDocument();
  });
});

describe("Counter — EN/FR catalogue parity", () => {
  const leaves = (obj: unknown, prefix = ""): [string, string][] =>
    obj && typeof obj === "object"
      ? Object.entries(obj as Record<string, unknown>).flatMap(([k, v]) =>
          typeof v === "string"
            ? [[`${prefix}${k}`, v] as [string, string]]
            : leaves(v, `${prefix}${k}.`),
        )
      : [];
  const placeholders = (text: string) => (text.match(/{{\s*\w+\s*}}/g) ?? []).sort();

  it("every counter.* key exists in both languages, is non-empty, and uses the same placeholders", () => {
    const enLeaves = Object.fromEntries(leaves(en.business.counter));
    const frLeaves = Object.fromEntries(leaves(fr.business.counter));
    expect(Object.keys(frLeaves).sort()).toEqual(Object.keys(enLeaves).sort());
    expect(Object.keys(enLeaves).length).toBeGreaterThan(60);
    for (const [key, value] of Object.entries(enLeaves)) {
      expect(value.trim().length, key).toBeGreaterThan(0);
      expect(frLeaves[key].trim().length, key).toBeGreaterThan(0);
      expect(placeholders(frLeaves[key]), key).toEqual(placeholders(value));
    }
  });

  it("the French copy is actually translated (not an English copy) for user-facing sentences", () => {
    const enLeaves = Object.fromEntries(leaves(en.business.counter));
    const frLeaves = Object.fromEntries(leaves(fr.business.counter));
    const sentences = Object.keys(enLeaves).filter((k) => enLeaves[k].split(" ").length > 3);
    for (const key of sentences) expect(frLeaves[key], key).not.toBe(enLeaves[key]);
  });
});

describe("Counter — accessibility basics", () => {
  it("fields are labelled, errors are alerts tied to fields, outcomes are status regions, order is logical", async () => {
    const user = userEvent.setup();
    setup({ scanner: fakeScanner().scanner });
    await ready();
    expect(screen.getByLabelText("Loyalty Number")).toBeInTheDocument();
    expect(screen.getByLabelText("Quantity")).toBeInTheDocument();
    // Logical focus order: scan control → Loyalty Number → … → Record.
    await user.tab();
    expect(screen.getByRole("button", { name: "Scan customer QR" })).toHaveFocus();
    await user.tab();
    expect(loyaltyInput()).toHaveFocus();
    // Validation error is an alert referenced by the field it concerns.
    await user.click(recordButton());
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Scan the customer's QR or enter their Loyalty Number.");
    expect(loyaltyInput().getAttribute("aria-describedby")).toContain(alert.id);
    expect(loyaltyInput()).toHaveAttribute("aria-invalid", "true");
    // Describing hint is present.
    expect(loyaltyInput().getAttribute("aria-describedby")).toContain("-ln");
  });

  it("the primary controls meet the 44px touch-target floor", async () => {
    setup({ scanner: fakeScanner().scanner });
    await ready();
    for (const name of ["Scan customer QR", "Record purchase"]) {
      expect(screen.getByRole("button", { name }).className).toMatch(/min-h-1[2-9]/);
    }
    expect(loyaltyInput().className).toMatch(/min-h-14/);
  });
});
