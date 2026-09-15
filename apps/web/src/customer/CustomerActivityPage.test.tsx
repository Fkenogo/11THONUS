import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { i18n } from "../i18n";
import { CustomerActivityPage } from "./CustomerActivityPage";
import type { CustomerPurchaseWire } from "./api/purchaseClient";

let waitingResult: { data: { purchases: CustomerPurchaseWire[] } | undefined };
let detailResult: {
  data:
    | {
        purchase: CustomerPurchaseWire;
        events: { id: string; toStatus: string }[];
      }
    | undefined;
};

vi.mock("./hooks/purchaseQueries", () => ({
  useWaitingPurchasesQuery: () => waitingResult,
  useCustomerPurchaseQuery: () => detailResult,
  useAvailableRewardsQuery: () => ({ data: { rewards: [] }, isPending: false }),
}));

const mockVerify = vi.fn();
const mockReject = vi.fn();
const mockDispute = vi.fn();

vi.mock("./hooks/purchaseMutations", () => ({
  useVerifyPurchaseMutation: () => ({ mutateAsync: mockVerify, isPending: false }),
  useRejectPurchaseMutation: () => ({ mutateAsync: mockReject, isPending: false }),
  useDisputePurchaseMutation: () => ({ mutateAsync: mockDispute, isPending: false }),
}));

function purchaseWire(overrides: Partial<CustomerPurchaseWire> = {}): CustomerPurchaseWire {
  return {
    id: "p-1",
    businessId: "biz-1",
    customerIdentityId: "cust-1",
    presentedArtifactType: "loyalty_number",
    presentedArtifactReference: "ABC234",
    canonicalLoyaltyNumberValue: "ABC234",
    rewardProgramId: "rp-1",
    rewardProgramVersionId: "v-1",
    quantity: 2,
    itemLabel: "Coffee",
    purchaseDate: "2026-09-14T10:00:00.000Z",
    notes: "Extra hot",
    status: "waiting_for_customer",
    verifiedAt: null,
    rejectionReason: null,
    disputeReason: null,
    createdAt: "2026-09-14T10:00:00.000Z",
    ...overrides,
  };
}

const platform = { auth: {} as never, functions: {} as never };

function renderPage() {
  return render(
    <MemoryRouter>
      <CustomerActivityPage auth={platform.auth} functions={platform.functions} />
    </MemoryRouter>,
  );
}

afterEach(async () => {
  await i18n.changeLanguage("en");
  vi.clearAllMocks();
});

describe("CustomerActivityPage", () => {
  it("renders the waiting list in English", () => {
    waitingResult = { data: { purchases: [purchaseWire()] } };
    detailResult = { data: undefined };
    renderPage();
    expect(screen.getByText("Waiting for you")).toBeInTheDocument();
    expect(screen.getByText("Coffee")).toBeInTheDocument();
    expect(screen.getByText("Quantity: 2")).toBeInTheDocument();
  });

  it("renders the waiting list in French with full parity", async () => {
    await i18n.changeLanguage("fr");
    waitingResult = { data: { purchases: [purchaseWire()] } };
    detailResult = { data: undefined };
    renderPage();
    expect(screen.getByText("En attente de vous")).toBeInTheDocument();
    expect(screen.getByText("Quantité : 2")).toBeInTheDocument();
  });

  it("verifies from the detail view and shows the success notice", () => {
    waitingResult = { data: { purchases: [purchaseWire()] } };
    detailResult = { data: { purchase: purchaseWire(), events: [] } };
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: /Coffee/ }));
    fireEvent.click(screen.getByRole("button", { name: "Verify" }));
    expect(mockVerify).toHaveBeenCalledWith({ purchaseRecordId: "p-1" });
  });

  it("rejects with the chosen bounded reason", () => {
    waitingResult = { data: { purchases: [purchaseWire()] } };
    detailResult = { data: { purchase: purchaseWire(), events: [] } };
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: /Coffee/ }));
    fireEvent.click(screen.getByRole("button", { name: "Reject" }));
    const selects = screen.getAllByRole("combobox");
    fireEvent.change(selects[0], { target: { value: "wrong_customer" } });
    fireEvent.click(screen.getByRole("button", { name: "Confirm rejection" }));
    expect(mockReject).toHaveBeenCalledWith({ purchaseRecordId: "p-1", reason: "wrong_customer" });
  });

  it("disputes with the chosen reason and shows every bounded option", () => {
    waitingResult = { data: { purchases: [purchaseWire()] } };
    detailResult = { data: { purchase: purchaseWire(), events: [] } };
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: /Coffee/ }));
    fireEvent.click(screen.getByRole("button", { name: "Raise a dispute" }));
    expect(screen.getByRole("option", { name: "Wrong quantity" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Wrong item" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Partially inaccurate" })).toBeInTheDocument();
    const selects = screen.getAllByRole("combobox");
    fireEvent.change(selects[0], { target: { value: "wrong_item" } });
    fireEvent.click(screen.getByRole("button", { name: "Send dispute" }));
    expect(mockDispute).toHaveBeenCalledWith({ purchaseRecordId: "p-1", reason: "wrong_item" });
  });

  it("hides actions once the purchase leaves waiting", () => {
    const verified = purchaseWire({ status: "verified" });
    waitingResult = { data: { purchases: [verified] } };
    detailResult = { data: { purchase: verified, events: [] } };
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: /Coffee/ }));
    expect(screen.queryByRole("button", { name: "Verify" })).not.toBeInTheDocument();
    expect(screen.getByText("Verified")).toBeInTheDocument();
  });
});
