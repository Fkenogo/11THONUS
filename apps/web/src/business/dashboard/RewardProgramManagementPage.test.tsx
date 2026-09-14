import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { RewardProgramManagementPage } from "./RewardProgramManagementPage";
import type { BusinessContext } from "../api/businessContext";
import type {
  RewardProgramVersionWire,
  RewardProgramWithVersionsWire,
} from "../api/rewardProgramMutations";

let rewardProgramsResult: {
  data: RewardProgramWithVersionsWire[] | undefined;
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
    mutate: (payload: unknown, options?: { onSuccess?: () => void }) => {
      mockUpdateDraft(payload, options);
      // Mirror react-query's success settlement so the page's own
      // onSuccess (closing the edit form) runs, like the real hook does.
      options?.onSuccess?.();
    },
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

function versionWire(overrides: Partial<RewardProgramVersionWire> = {}): RewardProgramVersionWire {
  return {
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
    ...overrides,
  };
}

const programWire = {
  id: "rp-1",
  businessId: "biz-1",
  displayName: "Buy 10 Coffees",
  rewardProgramCategoryId: "cat-1",
  sharedLoyaltyNumberAllowed: false,
  status: "draft" as const,
  currentVersionId: null,
  createdAt: "2026-09-13T00:00:00.000Z",
  createdBy: "user-1",
  updatedAt: "2026-09-13T00:00:00.000Z",
  updatedBy: "user-1",
  schemaVersion: 1,
};

/**
 * Corrected read model (`PLATFORM-BASELINE-005A-CORR-001` Finding 1): a
 * freshly created, never-published program reads back with
 * `currentVersion: null` and its v1 draft in `draftVersion` — exactly the
 * shape the old `{program, currentVersion}` model lost after refetch.
 */
const draftProgram: RewardProgramWithVersionsWire = {
  program: programWire,
  currentVersion: null,
  draftVersion: versionWire({ id: "v-1", status: "draft" }),
};

/**
 * Published program with an N+1 draft: the published v1 stays in
 * `currentVersion` (pointer unchanged) while the editable v2 draft is
 * `draftVersion`.
 */
const publishedProgramWithDraft: RewardProgramWithVersionsWire = {
  program: { ...programWire, status: "active", currentVersionId: "v-1" },
  currentVersion: versionWire({
    id: "v-1",
    version: 1,
    status: "active",
    approvedAt: "2026-09-13T01:00:00.000Z",
  }),
  draftVersion: versionWire({
    id: "v-2",
    version: 2,
    status: "draft",
    rewardDescription: "Version 2 draft",
  }),
};

/** Published program with no draft: only the published version exists. */
const publishedProgramNoDraft: RewardProgramWithVersionsWire = {
  program: { ...programWire, status: "active", currentVersionId: "v-1" },
  currentVersion: versionWire({
    id: "v-1",
    version: 1,
    status: "active",
    approvedAt: "2026-09-13T01:00:00.000Z",
  }),
  draftVersion: null,
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

  /**
   * `PLATFORM-BASELINE-005A-CORR-001` Finding 1, flow A: a freshly created
   * program refetches as `currentVersion: null` + v1 in `draftVersion`; the
   * UI must still offer edit/publish and act on the DRAFT.
   */
  it("Finding 1 flow A: a refetched unpublished program keeps edit/publish available and acts on draftVersion", async () => {
    rewardProgramsResult = { data: [draftProgram], isLoading: false, isError: false };
    accessibleResult = { data: [{ businessId: "biz-1", role: "owner" }] };
    const user = userEvent.setup();
    renderPage();
    expect(screen.getByRole("button", { name: /edit draft/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^publish$/i })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /edit draft/i }));
    expect(screen.getByLabelText(/reward description/i)).toHaveValue("One free coffee");
    await user.type(screen.getByLabelText(/reward description/i), " two");
    await user.click(screen.getByRole("button", { name: /save draft/i }));
    expect(mockUpdateDraft).toHaveBeenCalledWith(
      expect.objectContaining({
        rewardProgramId: "rp-1",
        versionId: "v-1",
        expectedRowVersion: 1,
        rewardDescription: "One free coffee two",
      }),
      expect.anything(),
    );
  });

  /**
   * Finding 1, flow B: a published program with an N+1 draft must show the
   * published v1 as current display, keep edit/publish targeting the v2
   * DRAFT, and NOT offer "create next version" while a draft exists.
   */
  it("Finding 1 flow B: a published program with an N+1 draft edits/publishes the draft and hides create-next-version", async () => {
    rewardProgramsResult = { data: [publishedProgramWithDraft], isLoading: false, isError: false };
    accessibleResult = { data: [{ businessId: "biz-1", role: "owner" }] };
    const user = userEvent.setup();
    renderPage();

    // Published display comes from currentVersion (v1).
    expect(screen.getByText(/One free coffee/)).toBeInTheDocument();
    // Edit/publish act on the v2 draft.
    expect(screen.getByRole("button", { name: /edit draft/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^publish$/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /create next version/i })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /edit draft/i }));
    expect(screen.getByLabelText(/reward description/i)).toHaveValue("Version 2 draft");
    await user.type(screen.getByLabelText(/reward description/i), " improved");
    await user.click(screen.getByRole("button", { name: /save draft/i }));
    expect(mockUpdateDraft).toHaveBeenCalledWith(
      expect.objectContaining({
        rewardProgramId: "rp-1",
        versionId: "v-2",
        expectedRowVersion: 1,
        rewardDescription: "Version 2 draft improved",
      }),
      expect.anything(),
    );

    await user.click(screen.getByRole("button", { name: /^publish$/i }));
    expect(mockPublish).toHaveBeenCalledWith({ rewardProgramId: "rp-1", versionId: "v-2" });
  });

  /**
   * `PLATFORM-BASELINE-005A-CORR-001` Finding 4: the form does not expose
   * `standardRewardNodeId`/`bulkReviewThreshold`/`effectiveUntil`, but the
   * save payload must round-trip them unchanged — editing an unrelated
   * field must never silently erase them.
   */
  it("Finding 4: saving an edit preserves the optional fields the form does not expose", async () => {
    const draftWithOptionals: RewardProgramWithVersionsWire = {
      program: programWire,
      currentVersion: null,
      draftVersion: versionWire({
        standardRewardNodeId: "std-node-7",
        bulkReviewThreshold: 25,
        effectiveUntil: "2027-01-31T00:00:00.000Z",
        qualifyingNodes: [
          { knowledgeNodeId: "node-1", businessDisplayName: null },
          { knowledgeNodeId: "node-2", businessDisplayName: null },
        ],
      }),
    };
    rewardProgramsResult = { data: [draftWithOptionals], isLoading: false, isError: false };
    accessibleResult = { data: [{ businessId: "biz-1", role: "owner" }] };
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole("button", { name: /edit draft/i }));
    // The user edits ONLY the reward description.
    await user.clear(screen.getByLabelText(/reward description/i));
    await user.type(screen.getByLabelText(/reward description/i), "Edited description only");
    await user.click(screen.getByRole("button", { name: /save draft/i }));

    expect(mockUpdateDraft).toHaveBeenCalledWith(
      expect.objectContaining({
        rewardDescription: "Edited description only",
        standardRewardNodeId: "std-node-7",
        bulkReviewThreshold: 25,
        effectiveUntil: "2027-01-31T00:00:00.000Z",
        qualifyingNodes: [
          { knowledgeNodeId: "node-1", businessDisplayName: null },
          { knowledgeNodeId: "node-2", businessDisplayName: null },
        ],
      }),
      expect.anything(),
    );
  });

  it("Finding 1: a published program with no draft offers create-next-version carrying the current version's optional fields, and no edit/publish", async () => {
    rewardProgramsResult = { data: [publishedProgramNoDraft], isLoading: false, isError: false };
    accessibleResult = { data: [{ businessId: "biz-1", role: "owner" }] };
    const user = userEvent.setup();
    renderPage();

    expect(screen.queryByRole("button", { name: /edit draft/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^publish$/i })).not.toBeInTheDocument();
    const createNext = screen.getByRole("button", { name: /create next version/i });
    await user.click(createNext);
    expect(mockCreateNextVersion).toHaveBeenCalledWith(
      expect.objectContaining({
        rewardProgramId: "rp-1",
        standardRewardNodeId: null,
        bulkReviewThreshold: null,
        effectiveUntil: null,
        multipleUnitsAllowed: true,
        sharedLoyaltyNumberAllowed: false,
        qualifyingNodes: [{ knowledgeNodeId: "node-1", businessDisplayName: null }],
      }),
    );
  });
});
