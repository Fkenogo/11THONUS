import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { i18n } from "../../i18n";
import { PurchaseRecordsPage } from "./PurchaseRecordsPage";
import type { BusinessContext } from "../api/businessContext";
import type { PurchaseRecordWire } from "../api/purchaseMutations";

let purchasesResult: { data: { purchases: PurchaseRecordWire[] } | undefined };
let detailResult: {
  data:
    | {
        purchase: PurchaseRecordWire;
        events: { id: string; fromStatus: string | null; toStatus: string; actorType: string }[];
      }
    | undefined;
};
let programsResult: {
  data:
    | {
        program: {
          id: string;
          displayName: string;
          status: string;
          currentVersionId: string | null;
        };
      }[]
    | undefined;
};

vi.mock("../hooks/purchaseQueries", () => ({
  usePurchasesQuery: () => purchasesResult,
  useBusinessPurchaseQuery: () => detailResult,
}));

vi.mock("../hooks/rewardProgramQueries", () => ({
  useRewardProgramsQuery: () => programsResult,
}));

const mockRecord = vi.fn();

vi.mock("../hooks/purchaseMutations", () => ({
  useRecordPurchaseMutation: () => ({ mutateAsync: mockRecord, isPending: false, isError: false }),
}));

const context: BusinessContext = { businessId: "biz-1" } as BusinessContext;

function purchaseWire(overrides: Partial<PurchaseRecordWire> = {}): PurchaseRecordWire {
  return {
    id: "p-1",
    businessId: "biz-1",
    customerIdentityId: "cust-1",
    presentedArtifactType: "loyalty_number",
    presentedArtifactReference: "ABC234",
    canonicalLoyaltyNumberValue: "ABC234",
    rewardProgramId: "rp-1",
    rewardProgramVersionId: "v-1",
    sharedLoyaltyNumberAllowed: true,
    multipleUnitsAllowed: true,
    branchId: "branch-1",
    recordedByUserId: "staff-1",
    recordedByRole: "staff",
    quantity: 2,
    itemLabel: "Coffee",
    knowledgeNodeId: null,
    unitValueMinor: null,
    currency: null,
    purchaseDate: "2026-09-14T10:00:00.000Z",
    notes: null,
    status: "waiting_for_customer",
    verifiedAt: null,
    rejectionReason: null,
    disputeReason: null,
    correlationId: "corr-1",
    createdAt: "2026-09-14T10:00:00.000Z",
    updatedAt: "2026-09-14T10:00:00.000Z",
    schemaVersion: 1,
    ...overrides,
  };
}

function renderPage() {
  return render(
    <MemoryRouter>
      <PurchaseRecordsPage context={context} />
    </MemoryRouter>,
  );
}

afterEach(async () => {
  await i18n.changeLanguage("en");
  vi.clearAllMocks();
});

describe("PurchaseRecordsPage", () => {
  it("renders the record form and empty list in English", () => {
    purchasesResult = { data: { purchases: [] } };
    detailResult = { data: undefined };
    programsResult = {
      data: [
        {
          program: {
            id: "rp-1",
            displayName: "Coffees",
            status: "active",
            currentVersionId: "v-1",
          },
        },
      ],
    };
    renderPage();
    expect(screen.getByText("Purchases")).toBeInTheDocument();
    expect(screen.getByText("Record a purchase")).toBeInTheDocument();
    expect(screen.getByText("No purchases recorded yet.")).toBeInTheDocument();
  });

  it("renders in French with full parity", async () => {
    await i18n.changeLanguage("fr");
    purchasesResult = { data: { purchases: [] } };
    detailResult = { data: undefined };
    programsResult = { data: [] };
    renderPage();
    expect(screen.getByText("Achats")).toBeInTheDocument();
    expect(screen.getByText("Enregistrer un achat")).toBeInTheDocument();
    expect(screen.getByText("Aucun achat enregistré pour le moment.")).toBeInTheDocument();
  });

  it("submits the record form with exactly one artifact (no customer identity)", async () => {
    purchasesResult = { data: { purchases: [] } };
    detailResult = { data: undefined };
    programsResult = {
      data: [
        {
          program: {
            id: "rp-1",
            displayName: "Coffees",
            status: "active",
            currentVersionId: "v-1",
          },
        },
      ],
    };
    renderPage();
    fireEvent.change(screen.getByLabelText("Loyalty Number or QR reference"), {
      target: { value: "ABC234" },
    });
    fireEvent.change(screen.getByLabelText("Item label"), { target: { value: "Coffee" } });
    const selects = screen.getAllByRole("combobox");
    fireEvent.change(selects[0], { target: { value: "rp-1" } });
    fireEvent.click(screen.getByRole("button", { name: "Record purchase" }));
    expect(mockRecord).toHaveBeenCalledTimes(1);
    const payload = mockRecord.mock.calls[0][0] as Record<string, unknown>;
    expect(payload).toMatchObject({
      rewardProgramId: "rp-1",
      loyaltyNumberValue: "ABC234",
      quantity: 1,
      itemLabel: "Coffee",
    });
    expect(payload).not.toHaveProperty("customerIdentityId");
    expect(payload).not.toHaveProperty("rewardProgramVersionId");
  });

  it("submits the exact typed integer quantity", async () => {
    purchasesResult = { data: { purchases: [] } };
    detailResult = { data: undefined };
    programsResult = {
      data: [
        {
          program: {
            id: "rp-1",
            displayName: "Coffees",
            status: "active",
            currentVersionId: "v-1",
          },
        },
      ],
    };
    renderPage();
    fireEvent.change(screen.getByLabelText("Loyalty Number or QR reference"), {
      target: { value: "ABC234" },
    });
    fireEvent.change(screen.getByLabelText("Item label"), { target: { value: "Coffee" } });
    fireEvent.change(screen.getByLabelText("Quantity"), { target: { value: "7" } });
    const selects = screen.getAllByRole("combobox");
    fireEvent.change(selects[0], { target: { value: "rp-1" } });
    fireEvent.click(screen.getByRole("button", { name: "Record purchase" }));
    expect(mockRecord).toHaveBeenCalledTimes(1);
    expect(mockRecord.mock.calls[0][0]).toMatchObject({ quantity: 7 });
  });

  it.each([
    ["a fractional value", "1.5"],
    ["trailing garbage", "2abc"],
    ["zero", "0"],
    ["a negative value", "-1"],
  ])("rejects %s without calling the purchase mutation", (_label, rawQuantity) => {
    purchasesResult = { data: { purchases: [] } };
    detailResult = { data: undefined };
    programsResult = {
      data: [
        {
          program: {
            id: "rp-1",
            displayName: "Coffees",
            status: "active",
            currentVersionId: "v-1",
          },
        },
      ],
    };
    renderPage();
    fireEvent.change(screen.getByLabelText("Loyalty Number or QR reference"), {
      target: { value: "ABC234" },
    });
    fireEvent.change(screen.getByLabelText("Item label"), { target: { value: "Coffee" } });
    fireEvent.change(screen.getByLabelText("Quantity"), { target: { value: rawQuantity } });
    const selects = screen.getAllByRole("combobox");
    fireEvent.change(selects[0], { target: { value: "rp-1" } });
    fireEvent.click(screen.getByRole("button", { name: "Record purchase" }));
    expect(mockRecord).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent("Enter a whole number of 1 or more.");
  });

  it("clears the quantity error once the field is edited again", () => {
    purchasesResult = { data: { purchases: [] } };
    detailResult = { data: undefined };
    programsResult = {
      data: [
        {
          program: {
            id: "rp-1",
            displayName: "Coffees",
            status: "active",
            currentVersionId: "v-1",
          },
        },
      ],
    };
    renderPage();
    fireEvent.change(screen.getByLabelText("Loyalty Number or QR reference"), {
      target: { value: "ABC234" },
    });
    fireEvent.change(screen.getByLabelText("Item label"), { target: { value: "Coffee" } });
    fireEvent.change(screen.getByLabelText("Quantity"), { target: { value: "2abc" } });
    const selects = screen.getAllByRole("combobox");
    fireEvent.change(selects[0], { target: { value: "rp-1" } });
    fireEvent.click(screen.getByRole("button", { name: "Record purchase" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Enter a whole number of 1 or more.");
    fireEvent.change(screen.getByLabelText("Quantity"), { target: { value: "3" } });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("lists records and shows detail with the event timeline", () => {
    const purchase = purchaseWire();
    purchasesResult = { data: { purchases: [purchase] } };
    detailResult = {
      data: {
        purchase,
        events: [
          { id: "e-1", fromStatus: null, toStatus: "waiting_for_customer", actorType: "staff" },
        ],
      },
    };
    programsResult = { data: [] };
    renderPage();
    expect(screen.getByText("Coffee")).toBeInTheDocument();
    expect(screen.getAllByText(/Waiting for customer/).length).toBeGreaterThanOrEqual(1);
    fireEvent.click(screen.getByRole("button", { name: /Coffee/ }));
    expect(screen.getByText("Purchase detail")).toBeInTheDocument();
    expect(screen.getByText(/Recorded by staff/)).toBeInTheDocument();
  });
});

/**
 * PLATFORM-BASELINE-006A-CORR-003: reproduces the actual reported bug
 * through the real submit flow (not the date helper in isolation) — the
 * page used to construct `${date}T12:00:00.000Z` (noon UTC) for the
 * default "today" date, which the server rejects as a future instant
 * whenever the real UTC time is still before 12:00 (e.g. any time before
 * 2pm in a UTC+2 business's own timezone). These tests fake the system
 * clock and the process timezone together — `process.env.TZ` is verified
 * to genuinely change what `Date`'s local getters/constructor report on
 * this runtime — so they are deterministic regardless of the actual
 * machine's configured timezone or wall clock.
 */
describe("PurchaseRecordsPage — purchase date / timezone (CORR-003)", () => {
  const ORIGINAL_TZ = process.env.TZ;

  afterEach(() => {
    vi.useRealTimers();
    process.env.TZ = ORIGINAL_TZ;
  });

  function fillMinimalFormAndSubmit() {
    fireEvent.change(screen.getByLabelText("Loyalty Number or QR reference"), {
      target: { value: "ABC234" },
    });
    fireEvent.change(screen.getByLabelText("Item label"), { target: { value: "Coffee" } });
    const selects = screen.getAllByRole("combobox");
    fireEvent.change(selects[0], { target: { value: "rp-1" } });
    fireEvent.click(screen.getByRole("button", { name: "Record purchase" }));
  }

  function setUpPrograms() {
    purchasesResult = { data: { purchases: [] } };
    detailResult = { data: undefined };
    programsResult = {
      data: [
        {
          program: {
            id: "rp-1",
            displayName: "Coffees",
            status: "active",
            currentVersionId: "v-1",
          },
        },
      ],
    };
  }

  it("records today's default date during UTC+2 local morning without producing a future instant", () => {
    process.env.TZ = "Etc/GMT-2"; // UTC+2 — the platform's stated target market
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-16T09:00:00.000Z")); // 11:00 local — well before the old noon-UTC anchor
    setUpPrograms();
    renderPage();
    fillMinimalFormAndSubmit();
    expect(mockRecord).toHaveBeenCalledTimes(1);
    const payload = mockRecord.mock.calls[0][0] as Record<string, unknown>;
    const sentInstant = new Date(payload.purchaseDate as string).getTime();
    // The old implementation would have sent 2026-09-16T12:00:00.000Z here,
    // which is AFTER Date.now() (09:00 UTC) and would fail the server's
    // `purchaseDate > Date.now()` check.
    expect(sentInstant).toBeLessThanOrEqual(Date.now());
  });

  it("records today's default date around UTC+2 local midday without producing a future instant", () => {
    process.env.TZ = "Etc/GMT-2";
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-16T11:30:00.000Z")); // 13:30 local — straddles the old anchor
    setUpPrograms();
    renderPage();
    fillMinimalFormAndSubmit();
    const payload = mockRecord.mock.calls[0][0] as Record<string, unknown>;
    expect(new Date(payload.purchaseDate as string).getTime()).toBeLessThanOrEqual(Date.now());
  });

  it("records today's default date later in the UTC+2 day (the old anchor would already have passed)", () => {
    process.env.TZ = "Etc/GMT-2";
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-16T16:00:00.000Z")); // 18:00 local
    setUpPrograms();
    renderPage();
    fillMinimalFormAndSubmit();
    const payload = mockRecord.mock.calls[0][0] as Record<string, unknown>;
    expect(new Date(payload.purchaseDate as string).getTime()).toBeLessThanOrEqual(Date.now());
  });

  it("records today's default date in UTC (zero offset) without producing a future instant", () => {
    process.env.TZ = "UTC";
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-16T01:00:00.000Z"));
    setUpPrograms();
    renderPage();
    fillMinimalFormAndSubmit();
    const payload = mockRecord.mock.calls[0][0] as Record<string, unknown>;
    expect(new Date(payload.purchaseDate as string).getTime()).toBeLessThanOrEqual(Date.now());
  });

  it("records today's default date under a negative UTC offset (UTC-5) without producing a future instant", () => {
    process.env.TZ = "Etc/GMT+5"; // UTC-5 (POSIX sign flipped)
    vi.useFakeTimers();
    // Just after local midnight — exercises the local-date boundary crossing the UTC day boundary.
    vi.setSystemTime(new Date("2026-09-16T04:30:00.000Z"));
    setUpPrograms();
    renderPage();
    fillMinimalFormAndSubmit();
    const payload = mockRecord.mock.calls[0][0] as Record<string, unknown>;
    expect(new Date(payload.purchaseDate as string).getTime()).toBeLessThanOrEqual(Date.now());
  });

  it("still submits a historical date selection as a past instant", () => {
    process.env.TZ = "Etc/GMT-2";
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-16T09:00:00.000Z"));
    setUpPrograms();
    renderPage();
    fireEvent.change(screen.getByLabelText("Purchase date"), { target: { value: "2026-09-10" } });
    fillMinimalFormAndSubmit();
    const payload = mockRecord.mock.calls[0][0] as Record<string, unknown>;
    expect(new Date(payload.purchaseDate as string).getTime()).toBeLessThan(Date.now());
  });

  it("still resolves a genuinely future calendar date to a future instant (server rejection remains meaningful)", () => {
    process.env.TZ = "Etc/GMT-2";
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-16T09:00:00.000Z"));
    setUpPrograms();
    renderPage();
    fireEvent.change(screen.getByLabelText("Purchase date"), { target: { value: "2026-09-20" } });
    fillMinimalFormAndSubmit();
    const payload = mockRecord.mock.calls[0][0] as Record<string, unknown>;
    expect(new Date(payload.purchaseDate as string).getTime()).toBeGreaterThan(Date.now());
  });
});
