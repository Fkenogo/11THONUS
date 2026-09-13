import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { RewardProgramManagementPage } from "./RewardProgramManagementPage";
import type { BusinessContext } from "../api/businessContext";
import type { RewardProgramWithCurrentVersionWire } from "../api/rewardProgramMutations";

let rewardProgramsResult: {
  data: RewardProgramWithCurrentVersionWire[] | undefined;
  isLoading: boolean;
  isError: boolean;
};
let accessibleResult: { data: { businessId: string; role: string }[] };

vi.mock("../hooks/rewardProgramQueries", () => ({
  useRewardProgramsQuery: () => rewardProgramsResult,
  useRewardProgramQuery: () => ({ data: undefined, isLoading: false, isError: false }),
}));

vi.mock("../hooks/businessQueries", () => ({
  useAccessibleBusinessesQuery: () => accessibleResult,
}));

const mockCreate = vi.fn();
const mockUpdateDraft = vi.fn();
const mockPublish = vi.fn();
const mockCreateNextVersion = vi.fn();

vi.mock("../hooks/rewardProgramMutations", () => ({
  useCreateRewardProgramMutation: () => ({ mutate: mockCreate, isPending: false, error: null }),
  useUpdateRewardProgramDraftMutation: () => ({
    mutate: mockUpdateDraft,
    isPending: false,
    error: null,
  }),
  usePublishRewardProgramVersionMutation: () => ({
    mutate: mockPublish,
    isPending: false,
    error: null,
  }),
  useCreateNextRewardProgramVersionMutation: () => ({
    mutate: mockCreateNextVersion,
    isPending: false,
    error: null,
  }),
}));

const context: BusinessContext = { businessId: "biz-1" } as BusinessContext;

function renderPage() {
  return render(
    <MemoryRouter>
      <RewardProgramManagementPage context={context} />
    </MemoryRouter>,
  );
}

const draftProgram: RewardProgramWithCurrentVersionWire = {
  program: {
    id: "rp-1",
    businessId: "biz-1",
    displayName: "Buy 10 Coffees",
    rewardProgramCategoryId: "cat-1",
    sharedLoyaltyNumberAllowed: false,
    status: "draft",
    currentVersionId: "v-1",
    createdAt: "2026-09-13T00:00:00.000Z",
    createdBy: "user-1",
    updatedAt: "2026-09-13T00:00:00.000Z",
    updatedBy: "user-1",
    schemaVersion: 1,
  },
  currentVersion: {
    id: "v-1",
    rewardProgramId: "rp-1",
    version: 1,
    requiredVerifiedUnits: 10,
    rewardQuantity: 1,
    sharedLoyaltyNumberAllowed: false,
    rewardDescription: "One free coffee",
    standardRewardNodeId: null,
    multipleUnitsAllowed: true,
    bulkReviewThreshold: null,
    effectiveFrom: "2026-09-13T00:00:00.000Z",
    effectiveUntil: null,
    status: "draft",
    createdAt: "2026-09-13T00:00:00.000Z",
    createdBy: "user-1",
    approvedAt: null,
    updatedAt: "2026-09-13T00:00:00.000Z",
    rowVersion: 1,
    schemaVersion: 1,
    qualifyingNodes: [{ knowledgeNodeId: "node-1", businessDisplayName: null }],
  },
};

describe("RewardProgramManagementPage (PLATFORM-BASELINE-005A)", () => {
  it("shows a loading state", () => {
    rewardProgramsResult = { data: undefined, isLoading: true, isError: false };
    accessibleResult = { data: [] };
    renderPage();
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it("shows an error state", () => {
    rewardProgramsResult = { data: undefined, isLoading: false, isError: true };
    accessibleResult = { data: [] };
    renderPage();
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("shows the empty state when no programs exist", () => {
    rewardProgramsResult = { data: [], isLoading: false, isError: false };
    accessibleResult = { data: [{ businessId: "biz-1", role: "owner" }] };
    renderPage();
    expect(screen.getByText(/no reward programs yet/i)).toBeInTheDocument();
  });

  it("Owner sees the create action; Staff does not", () => {
    rewardProgramsResult = { data: [], isLoading: false, isError: false };
    accessibleResult = { data: [{ businessId: "biz-1", role: "owner" }] };
    const { unmount } = renderPage();
    expect(screen.getByRole("button", { name: /create reward program/i })).toBeInTheDocument();
    unmount();

    accessibleResult = { data: [{ businessId: "biz-1", role: "staff" }] };
    renderPage();
    expect(
      screen.queryByRole("button", { name: /create reward program/i }),
    ).not.toBeInTheDocument();
  });

  it("never renders the fixed threshold/reward-quantity values as editable inputs", () => {
    rewardProgramsResult = { data: [], isLoading: false, isError: false };
    accessibleResult = { data: [{ businessId: "biz-1", role: "owner" }] };
    renderPage();
    // No input field for "required verified units" or "reward quantity" exists anywhere.
    expect(screen.queryByLabelText(/verified units/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/reward quantity/i)).not.toBeInTheDocument();
  });

  it("opens the create form and displays the fixed-invariants note as read-only text", async () => {
    rewardProgramsResult = { data: [], isLoading: false, isError: false };
    accessibleResult = { data: [{ businessId: "biz-1", role: "owner" }] };
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole("button", { name: /create reward program/i }));
    expect(screen.getByText(/verified units required: 10/i)).toBeInTheDocument();
    expect(screen.getByText(/reward quantity: 1/i)).toBeInTheDocument();
  });

  it("submitting the create form calls the create mutation with the entered fields", async () => {
    rewardProgramsResult = { data: [], isLoading: false, isError: false };
    accessibleResult = { data: [{ businessId: "biz-1", role: "owner" }] };
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole("button", { name: /create reward program/i }));
    await user.type(screen.getByLabelText(/program name/i), "Buy 10 Coffees");
    await user.type(screen.getByLabelText(/reward program category/i), "cat-1");
    await user.type(screen.getByLabelText(/reward description/i), "One free coffee");
    fireEvent.change(screen.getByLabelText(/effective from/i), { target: { value: "2026-09-13" } });
    await user.click(screen.getByRole("button", { name: /^create program$/i }));
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ displayName: "Buy 10 Coffees", rewardProgramCategoryId: "cat-1" }),
      expect.anything(),
    );
  });

  it("Owner sees edit-draft and publish actions on a draft program", () => {
    rewardProgramsResult = { data: [draftProgram], isLoading: false, isError: false };
    accessibleResult = { data: [{ businessId: "biz-1", role: "owner" }] };
    renderPage();
    expect(screen.getByRole("button", { name: /edit draft/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^publish$/i })).toBeInTheDocument();
  });

  it("Staff sees no management actions on a draft program", () => {
    rewardProgramsResult = { data: [draftProgram], isLoading: false, isError: false };
    accessibleResult = { data: [{ businessId: "biz-1", role: "staff" }] };
    renderPage();
    expect(screen.queryByRole("button", { name: /edit draft/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^publish$/i })).not.toBeInTheDocument();
  });

  it("clicking publish calls the publish mutation with the program/version ids", async () => {
    rewardProgramsResult = { data: [draftProgram], isLoading: false, isError: false };
    accessibleResult = { data: [{ businessId: "biz-1", role: "owner" }] };
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole("button", { name: /^publish$/i }));
    expect(mockPublish).toHaveBeenCalledWith({ rewardProgramId: "rp-1", versionId: "v-1" });
  });
});
