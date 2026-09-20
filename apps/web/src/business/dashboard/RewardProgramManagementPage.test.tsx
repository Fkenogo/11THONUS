import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { RewardProgramManagementPage } from "./RewardProgramManagementPage";
import { BusinessApiError } from "../api/businessCallableClient";
import type { BusinessContext } from "../api/businessContext";
import type { QualifyingItemWire } from "../api/qualifyingItems";
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

/**
 * `PLATFORM-BASELINE-013B` (`DEC-LOY-016`): the Business's own Qualifying
 * Item library -- the selectable set for Reward Program configuration.
 * Names are Business-authored; ids are stable UUIDs the operator never
 * sees; `knowledgeNodeId: null` (unclassified) is fully valid.
 */
let qualifyingItemsResult: {
  data: QualifyingItemWire[] | undefined;
  isLoading: boolean;
  isError: boolean;
};

vi.mock("../hooks/rewardProgramQueries", () => ({
  useRewardProgramsQuery: () => rewardProgramsResult,
  useRewardProgramQuery: () => ({ data: undefined, isLoading: false, isError: false }),
}));

vi.mock("../hooks/businessQueries", () => ({
  useAccessibleBusinessesQuery: () => accessibleResult,
}));

vi.mock("../hooks/qualifyingItemQueries", () => ({
  useQualifyingItemsQuery: () => qualifyingItemsResult,
}));

function resetItemMocks() {
  qualifyingItemsResult = { data: [], isLoading: false, isError: false };
}

const mockCreate = vi.fn();
const mockUpdateDraft = vi.fn();
const mockPublish = vi.fn();
const mockCreateNextVersion = vi.fn();
const mockCreateItem = vi.fn();
const mockUpdateItem = vi.fn();
const mockRetireItem = vi.fn();

/**
 * `PLATFORM-BASELINE-010B-CORR-001` item H: mutable so a test can simulate
 * the new server-side "publish requires >=1 qualifying item" governed
 * rejection surfacing through the page's existing `MutationError`
 * component, exactly like any other publish failure already does.
 */
let publishMutationError: unknown = null;

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
    error: publishMutationError,
  }),
  useCreateNextRewardProgramVersionMutation: () => ({
    mutate: mockCreateNextVersion,
    isPending: false,
    error: null,
  }),
}));

vi.mock("../hooks/qualifyingItemMutations", () => ({
  useCreateQualifyingItemMutation: () => ({
    mutate: (payload: unknown, options?: { onSuccess?: () => void }) => {
      mockCreateItem(payload, options);
      options?.onSuccess?.();
    },
    isPending: false,
    error: null,
  }),
  useUpdateQualifyingItemMutation: () => ({
    mutate: (payload: unknown, options?: { onSuccess?: () => void }) => {
      mockUpdateItem(payload, options);
      options?.onSuccess?.();
    },
    isPending: false,
    error: null,
  }),
  useRetireQualifyingItemMutation: () => ({
    mutate: (payload: unknown, options?: { onSuccess?: () => void }) => {
      mockRetireItem(payload, options);
      options?.onSuccess?.();
    },
    isPending: false,
    error: null,
  }),
}));

const context: BusinessContext = { businessId: "biz-1", businessTypeId: "bt-1" } as BusinessContext;

function renderPage() {
  return render(
    <MemoryRouter>
      <RewardProgramManagementPage context={context} />
    </MemoryRouter>,
  );
}

function itemWire(overrides: Partial<QualifyingItemWire> = {}): QualifyingItemWire {
  return {
    id: "item-coffee",
    businessId: "biz-1",
    name: "Black Coffee",
    knowledgeNodeId: null,
    status: "active",
    createdAt: "2026-09-18T00:00:00.000Z",
    createdBy: "user-1",
    updatedAt: "2026-09-18T00:00:00.000Z",
    updatedBy: "user-1",
    schemaVersion: 1,
    ...overrides,
  };
}

const COFFEE_ITEM = itemWire();
const PIZZA_ITEM = itemWire({ id: "item-pizza", name: "Medium Pizza" });

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
    qualifyingItems: [
      {
        qualifyingItemId: "item-coffee",
        itemNameAtVersion: "Black Coffee",
        knowledgeNodeIdAtVersion: null,
      },
    ],
    ...overrides,
  };
}

/**
 * `PLATFORM-BASELINE-010B`: `rewardProgramCategoryId` is `null` on every
 * fixture program -- proving the page renders and functions correctly for
 * a category-less program is the whole point of this package's UI change.
 */
const programWire = {
  id: "rp-1",
  businessId: "biz-1",
  displayName: "Buy 10 Coffees",
  rewardProgramCategoryId: null,
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
  beforeEach(() => {
    resetItemMocks();
    publishMutationError = null;
    vi.clearAllMocks();
  });

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

  /**
   * `PLATFORM-BASELINE-010B` (Founder decision `DEC-LOY-014` /
   * `FD-REWARD-QUALIFICATION-001`, item M of the test plan): the Reward
   * Program create form must have NO Reward Category control at all --
   * not even as an optional/hidden field.
   */
  it("has no Reward Program Category control anywhere in the create form", async () => {
    rewardProgramsResult = { data: [], isLoading: false, isError: false };
    accessibleResult = { data: [{ businessId: "biz-1", role: "owner" }] };
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole("button", { name: /create reward program/i }));

    expect(screen.queryByLabelText(/reward program category/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/reward program category/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
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

  it("submitting the create form calls the create mutation with the entered fields and no rewardProgramCategoryId", async () => {
    rewardProgramsResult = { data: [], isLoading: false, isError: false };
    accessibleResult = { data: [{ businessId: "biz-1", role: "owner" }] };
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole("button", { name: /create reward program/i }));
    await user.type(screen.getByLabelText(/program name/i), "Buy 10 Coffees");
    await user.type(screen.getByLabelText(/reward description/i), "One free coffee");
    fireEvent.change(screen.getByLabelText(/effective from/i), { target: { value: "2026-09-13" } });
    await user.click(screen.getByRole("button", { name: /^create program$/i }));
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ displayName: "Buy 10 Coffees" }),
      expect.anything(),
    );
    const [payload] = mockCreate.mock.calls[0];
    expect(payload).not.toHaveProperty("rewardProgramCategoryId");
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
   * `PLATFORM-BASELINE-010B-CORR-001` item H: the server-side "publish
   * requires >=1 qualifying item" invariant is authoritative -- the UI
   * cannot successfully publish an empty programme, and when the server
   * rejects it the operator sees the governed failure (the same
   * `MutationError` path every other publish failure already uses), not a
   * silently-succeeded publish and not a raw/blank error.
   */
  it("PLATFORM-BASELINE-010B-CORR-001 item H: a governed publish rejection (e.g. zero qualifying items) surfaces via MutationError, and the program stays a draft", async () => {
    rewardProgramsResult = { data: [draftProgram], isLoading: false, isError: false };
    accessibleResult = { data: [{ businessId: "biz-1", role: "owner" }] };
    publishMutationError = new BusinessApiError("validation_failed");
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole("button", { name: /^publish$/i }));

    expect(mockPublish).toHaveBeenCalledWith({ rewardProgramId: "rp-1", versionId: "v-1" });
    expect(screen.getByRole("alert")).toBeInTheDocument();
    // The publish action remains offered -- the program was never marked
    // published on the client's own initiative; only a real successful
    // server response (never faked here) could do that.
    expect(screen.getByRole("button", { name: /^publish$/i })).toBeInTheDocument();
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
        qualifyingItems: [
          {
            qualifyingItemId: "item-coffee",
            itemNameAtVersion: "Black Coffee",
            knowledgeNodeIdAtVersion: null,
          },
          {
            qualifyingItemId: "item-pizza",
            itemNameAtVersion: "Medium Pizza",
            knowledgeNodeIdAtVersion: null,
          },
        ],
      }),
    };
    rewardProgramsResult = { data: [draftWithOptionals], isLoading: false, isError: false };
    accessibleResult = { data: [{ businessId: "biz-1", role: "owner" }] };
    qualifyingItemsResult = { data: [COFFEE_ITEM, PIZZA_ITEM], isLoading: false, isError: false };
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
        // The draft's bound item ids round-trip unchanged (structural
        // identity, hydrated from the version's own snapshots).
        qualifyingItemIds: ["item-coffee", "item-pizza"],
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
        qualifyingItemIds: ["item-coffee"],
      }),
    );
  });

  /**
   * `PLATFORM-BASELINE-013B` (`DEC-LOY-016`): qualification binds the
   * Business's OWN Qualifying Items -- human-readable Business names are
   * shown, stable ids (never labels) are what gets submitted,
   * multi-selection works, an unclassified item needs no taxonomy
   * interaction, a previously-bound item that has since been retired is
   * preserved via its frozen snapshot name (not dropped), and the
   * selector's own loading/error/empty states render.
   */
  describe("PLATFORM-BASELINE-013B: Business-owned qualifying-item selection", () => {
    it("shows human-readable Business item options by default — never a raw id input, and no taxonomy gate", async () => {
      rewardProgramsResult = { data: [], isLoading: false, isError: false };
      accessibleResult = { data: [{ businessId: "biz-1", role: "owner" }] };
      qualifyingItemsResult = {
        data: [COFFEE_ITEM, PIZZA_ITEM],
        isLoading: false,
        isError: false,
      };
      const user = userEvent.setup();
      renderPage();
      await user.click(screen.getByRole("button", { name: /create reward program/i }));

      // Items render by Business name -- no taxonomy must be touched first.
      expect(screen.getByLabelText("Black Coffee")).toBeInTheDocument();
      expect(screen.getByLabelText("Medium Pizza")).toBeInTheDocument();
      expect(screen.queryByText("item-coffee")).not.toBeInTheDocument();
      // No taxonomy discovery UI on this path at all.
      expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/search/i)).not.toBeInTheDocument();
    });

    it("shows item checkboxes and submits stable ids, never labels", async () => {
      rewardProgramsResult = { data: [], isLoading: false, isError: false };
      accessibleResult = { data: [{ businessId: "biz-1", role: "owner" }] };
      qualifyingItemsResult = {
        data: [COFFEE_ITEM, PIZZA_ITEM],
        isLoading: false,
        isError: false,
      };
      const user = userEvent.setup();
      renderPage();
      await user.click(screen.getByRole("button", { name: /create reward program/i }));

      await user.type(screen.getByLabelText(/program name/i), "Buy 10 Coffees");
      await user.type(screen.getByLabelText(/reward description/i), "One free coffee");
      fireEvent.change(screen.getByLabelText(/effective from/i), {
        target: { value: "2026-09-13" },
      });

      // The operator sees and clicks human-readable names — never an id.
      const coffeeCheckbox = screen.getByRole("checkbox", { name: "Black Coffee" });
      const pizzaCheckbox = screen.getByRole("checkbox", { name: "Medium Pizza" });
      expect(screen.queryByText("item-coffee")).not.toBeInTheDocument();
      await user.click(coffeeCheckbox);
      await user.click(pizzaCheckbox);
      // Deselect one to prove add/remove both work before submit.
      await user.click(pizzaCheckbox);

      await user.click(screen.getByRole("button", { name: /^create program$/i }));
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({ qualifyingItemIds: ["item-coffee"] }),
        expect.anything(),
      );
      const [payload] = mockCreate.mock.calls[0];
      expect(payload).not.toHaveProperty("qualifyingNodes");
      expect(payload).not.toHaveProperty("knowledgeNodeId");
      expect(payload).not.toHaveProperty("businessDisplayName");
    });

    it("supports selecting multiple qualifying items at once", async () => {
      rewardProgramsResult = { data: [], isLoading: false, isError: false };
      accessibleResult = { data: [{ businessId: "biz-1", role: "owner" }] };
      qualifyingItemsResult = {
        data: [COFFEE_ITEM, PIZZA_ITEM],
        isLoading: false,
        isError: false,
      };
      const user = userEvent.setup();
      renderPage();
      await user.click(screen.getByRole("button", { name: /create reward program/i }));
      await user.type(screen.getByLabelText(/program name/i), "Multi");
      await user.type(screen.getByLabelText(/reward description/i), "desc");
      fireEvent.change(screen.getByLabelText(/effective from/i), {
        target: { value: "2026-09-13" },
      });
      await user.click(screen.getByRole("checkbox", { name: "Black Coffee" }));
      await user.click(screen.getByRole("checkbox", { name: "Medium Pizza" }));
      await user.click(screen.getByRole("button", { name: /^create program$/i }));
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({ qualifyingItemIds: ["item-coffee", "item-pizza"] }),
        expect.anything(),
      );
    });

    it("allows an unclassified Business item with zero taxonomy interaction", async () => {
      rewardProgramsResult = { data: [], isLoading: false, isError: false };
      accessibleResult = { data: [{ businessId: "biz-1", role: "owner" }] };
      // knowledgeNodeId: null -- no classification anywhere in this flow.
      qualifyingItemsResult = { data: [COFFEE_ITEM], isLoading: false, isError: false };
      const user = userEvent.setup();
      renderPage();
      await user.click(screen.getByRole("button", { name: /create reward program/i }));
      await user.type(screen.getByLabelText(/program name/i), "Unclassified");
      await user.type(screen.getByLabelText(/reward description/i), "desc");
      fireEvent.change(screen.getByLabelText(/effective from/i), {
        target: { value: "2026-09-13" },
      });
      await user.click(screen.getByRole("checkbox", { name: "Black Coffee" }));
      await user.click(screen.getByRole("button", { name: /^create program$/i }));
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({ qualifyingItemIds: ["item-coffee"] }),
        expect.anything(),
      );
    });

    it("hydrates an existing draft's item selections as checked when the item is still active", async () => {
      const draftWithActiveItem: RewardProgramWithVersionsWire = {
        program: programWire,
        currentVersion: null,
        draftVersion: versionWire(),
      };
      rewardProgramsResult = { data: [draftWithActiveItem], isLoading: false, isError: false };
      accessibleResult = { data: [{ businessId: "biz-1", role: "owner" }] };
      qualifyingItemsResult = { data: [COFFEE_ITEM], isLoading: false, isError: false };
      const user = userEvent.setup();
      renderPage();
      await user.click(screen.getByRole("button", { name: /edit draft/i }));
      const coffeeCheckbox = screen.getByRole("checkbox", { name: "Black Coffee" });
      expect(coffeeCheckbox).toBeChecked();
    });

    it("preserves a previously-bound item that has since been retired, flags it, and lets the operator remove it explicitly", async () => {
      const draftWithRetiredItem: RewardProgramWithVersionsWire = {
        program: programWire,
        currentVersion: null,
        draftVersion: versionWire({
          qualifyingItems: [
            {
              qualifyingItemId: "item-retired",
              itemNameAtVersion: "Old Special",
              knowledgeNodeIdAtVersion: null,
            },
          ],
        }),
      };
      rewardProgramsResult = { data: [draftWithRetiredItem], isLoading: false, isError: false };
      accessibleResult = { data: [{ businessId: "biz-1", role: "owner" }] };
      // The live active list no longer contains "item-retired".
      qualifyingItemsResult = { data: [COFFEE_ITEM], isLoading: false, isError: false };
      const user = userEvent.setup();
      renderPage();
      await user.click(screen.getByRole("button", { name: /edit draft/i }));

      // Never silently dropped: still shown, still checked, using the
      // frozen snapshot name — never the raw id.
      const retiredCheckbox = screen.getByRole("checkbox", { name: /old special/i });
      expect(retiredCheckbox).toBeChecked();
      expect(screen.queryByText("item-retired")).not.toBeInTheDocument();

      // The operator can explicitly remove it.
      await user.click(retiredCheckbox);
      await user.click(screen.getByRole("button", { name: /save draft/i }));
      expect(mockUpdateDraft).toHaveBeenCalledWith(
        expect.objectContaining({ qualifyingItemIds: [] }),
        expect.anything(),
      );
    });

    it("displays a published version's bound items by Business name (frozen snapshot), never by id", () => {
      rewardProgramsResult = { data: [publishedProgramNoDraft], isLoading: false, isError: false };
      accessibleResult = { data: [{ businessId: "biz-1", role: "owner" }] };
      renderPage();
      expect(screen.getByText("Black Coffee")).toBeInTheDocument();
      expect(screen.queryByText("item-coffee")).not.toBeInTheDocument();
    });

    it("excludes retired items from new selection (active-only list)", async () => {
      rewardProgramsResult = { data: [], isLoading: false, isError: false };
      accessibleResult = { data: [{ businessId: "biz-1", role: "owner" }] };
      // The query is active-only server-side; a retired item never arrives here.
      qualifyingItemsResult = { data: [COFFEE_ITEM], isLoading: false, isError: false };
      const user = userEvent.setup();
      renderPage();
      await user.click(screen.getByRole("button", { name: /create reward program/i }));
      expect(screen.getByLabelText("Black Coffee")).toBeInTheDocument();
      expect(screen.queryByText(/old special/i)).not.toBeInTheDocument();
    });

    it("shows a loading state while qualifying items are being fetched", async () => {
      rewardProgramsResult = { data: [], isLoading: false, isError: false };
      accessibleResult = { data: [{ businessId: "biz-1", role: "owner" }] };
      qualifyingItemsResult = { data: undefined, isLoading: true, isError: false };
      const user = userEvent.setup();
      renderPage();
      await user.click(screen.getByRole("button", { name: /create reward program/i }));
      expect(screen.getByText(/loading your qualifying items/i)).toBeInTheDocument();
    });

    it("shows a safe, translated error state (never a raw exception) when qualifying items fail to load", async () => {
      rewardProgramsResult = { data: [], isLoading: false, isError: false };
      accessibleResult = { data: [{ businessId: "biz-1", role: "owner" }] };
      qualifyingItemsResult = { data: undefined, isLoading: false, isError: true };
      const user = userEvent.setup();
      renderPage();
      await user.click(screen.getByRole("button", { name: /create reward program/i }));
      // Both the library section and the draft selector surface the same
      // translated failure (never a raw exception).
      const alerts = screen.getAllByRole("alert");
      expect(alerts.length).toBeGreaterThanOrEqual(1);
      for (const alert of alerts) {
        expect(alert).toHaveTextContent(/couldn't load/i);
      }
    });

    it("shows an explicit empty state when the Business has no qualifying items yet", async () => {
      rewardProgramsResult = { data: [], isLoading: false, isError: false };
      accessibleResult = { data: [{ businessId: "biz-1", role: "owner" }] };
      qualifyingItemsResult = { data: [], isLoading: false, isError: false };
      const user = userEvent.setup();
      renderPage();
      await user.click(screen.getByRole("button", { name: /create reward program/i }));
      // Both the library section and the draft selector explain the empty library.
      expect(screen.getAllByText(/no qualifying items yet/i).length).toBeGreaterThanOrEqual(1);
    });
  });

  /**
   * `PLATFORM-BASELINE-013B` + `DEC-LOY-017`: the Business's own
   * Qualifying Item library -- add, rename, retire -- served to Owners and
   * Managers (never Staff for management), with no taxonomy interaction.
   */
  describe("PLATFORM-BASELINE-013B: Qualifying Item library management", () => {
    it("Owner sees the items section and can add an item by name", async () => {
      rewardProgramsResult = { data: [], isLoading: false, isError: false };
      accessibleResult = { data: [{ businessId: "biz-1", role: "owner" }] };
      const user = userEvent.setup();
      renderPage();

      expect(screen.getByText("Qualifying items")).toBeInTheDocument();
      await user.type(screen.getByLabelText(/new item name/i), "Espresso");
      await user.click(screen.getByRole("button", { name: /add item/i }));
      expect(mockCreateItem).toHaveBeenCalledWith(
        expect.objectContaining({ name: "Espresso" }),
        expect.anything(),
      );
      const [payload] = mockCreateItem.mock.calls[0];
      expect(payload).not.toHaveProperty("knowledgeNodeId");
    });

    it("lists active items by name and renames one inline", async () => {
      rewardProgramsResult = { data: [], isLoading: false, isError: false };
      accessibleResult = { data: [{ businessId: "biz-1", role: "owner" }] };
      qualifyingItemsResult = {
        data: [COFFEE_ITEM, PIZZA_ITEM],
        isLoading: false,
        isError: false,
      };
      const user = userEvent.setup();
      renderPage();

      expect(screen.getByText("Black Coffee")).toBeInTheDocument();
      expect(screen.getByText("Medium Pizza")).toBeInTheDocument();

      await user.click(screen.getAllByRole("button", { name: /rename/i })[0]);
      // Exact label: the section also renders a "New item name" add field.
      await user.clear(screen.getByLabelText("Item name", { exact: true }));
      await user.type(screen.getByLabelText("Item name", { exact: true }), "Black Coffee (Large)");
      await user.click(screen.getByRole("button", { name: /^save$/i }));
      expect(mockUpdateItem).toHaveBeenCalledWith(
        expect.objectContaining({ qualifyingItemId: "item-coffee", name: "Black Coffee (Large)" }),
        expect.anything(),
      );
    });

    it("retires an item only after an explicit confirmation step", async () => {
      rewardProgramsResult = { data: [], isLoading: false, isError: false };
      accessibleResult = { data: [{ businessId: "biz-1", role: "owner" }] };
      qualifyingItemsResult = { data: [COFFEE_ITEM], isLoading: false, isError: false };
      const user = userEvent.setup();
      renderPage();

      await user.click(screen.getByRole("button", { name: /^retire$/i }));
      // First click only arms the confirmation -- nothing sent yet.
      expect(mockRetireItem).not.toHaveBeenCalled();
      await user.click(screen.getByRole("button", { name: /confirm retire/i }));
      expect(mockRetireItem).toHaveBeenCalledWith(
        expect.objectContaining({ qualifyingItemId: "item-coffee" }),
        expect.anything(),
      );
    });

    it("Manager sees the items section but no Reward Program management", () => {
      rewardProgramsResult = { data: [], isLoading: false, isError: false };
      accessibleResult = { data: [{ businessId: "biz-1", role: "manager" }] };
      renderPage();

      expect(screen.getByText("Qualifying items")).toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /create reward program/i }),
      ).not.toBeInTheDocument();
    });

    it("Staff sees neither the items section nor Reward Program management", () => {
      rewardProgramsResult = { data: [draftProgram], isLoading: false, isError: false };
      accessibleResult = { data: [{ businessId: "biz-1", role: "staff" }] };
      renderPage();

      expect(screen.queryByText("Qualifying items")).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /create reward program/i }),
      ).not.toBeInTheDocument();
    });
  });
});
