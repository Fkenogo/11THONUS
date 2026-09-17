import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { RewardProgramManagementPage } from "./RewardProgramManagementPage";
import type { BusinessContext } from "../api/businessContext";
import type {
  RewardProgramVersionWire,
  RewardProgramWithVersionsWire,
} from "../api/rewardProgramMutations";

type CandidateOption = { id: string; displayLabel: string; nodeType: string };
type LabelResult = { id: string; displayLabel: string | null; status: string | null };

let rewardProgramsResult: {
  data: RewardProgramWithVersionsWire[] | undefined;
  isLoading: boolean;
  isError: boolean;
};
let accessibleResult: { data: { businessId: string; role: string }[] };

/**
 * `PLATFORM-BASELINE-010B` (Founder decision `DEC-LOY-014` /
 * `FD-REWARD-QUALIFICATION-001`): the qualifying-node selector's DEFAULT
 * discovery scope (Business-Type-pre-filtered) — replaces the old
 * category-scoped candidate list, which no longer exists in the create
 * form at all.
 */
let qualifyingNodesResult: {
  data: CandidateOption[] | undefined;
  isLoading: boolean;
  isError: boolean;
  isSuccess: boolean;
};

/** `PLATFORM-BASELINE-010B`: the qualifying-node selector's broader "escape hatch" search. */
let searchResult: {
  data: CandidateOption[] | undefined;
  isLoading: boolean;
  isError: boolean;
  isSuccess: boolean;
};

/** `PLATFORM-BASELINE-008`: display-only label hydration for selected-but-not-candidate ids. */
let nodeLabelsResult: { data: LabelResult[] | undefined };

vi.mock("../hooks/rewardProgramQueries", () => ({
  useRewardProgramsQuery: () => rewardProgramsResult,
  useRewardProgramQuery: () => ({ data: undefined, isLoading: false, isError: false }),
}));

vi.mock("../hooks/businessQueries", () => ({
  useAccessibleBusinessesQuery: () => accessibleResult,
  useQualifyingNodesForBusinessTypeQuery: () => qualifyingNodesResult,
  useSearchQualifyingNodesQuery: () => searchResult,
  useKnowledgeNodeLabelsQuery: () => nodeLabelsResult,
}));

function resetSelectorMocks() {
  qualifyingNodesResult = { data: [], isLoading: false, isError: false, isSuccess: true };
  searchResult = { data: undefined, isLoading: false, isError: false, isSuccess: false };
  nodeLabelsResult = { data: [] };
}

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

const context: BusinessContext = { businessId: "biz-1", businessTypeId: "bt-1" } as BusinessContext;

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
    resetSelectorMocks();
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

  /**
   * `PLATFORM-BASELINE-008`, redesigned by `PLATFORM-BASELINE-010B` per
   * Founder decision `DEC-LOY-014` / `FD-REWARD-QUALIFICATION-001` — the
   * qualifying-node selector replaces the old opaque comma-separated
   * Firestore-id `TextField`, and no longer requires or exposes a Reward
   * Program Category at all. These tests prove: human-readable node
   * options are shown, defaulted to the Business's own Business Type; the
   * operator never types a canonical id anywhere, including via the
   * search escape hatch (item N); canonical ids (never labels) are what
   * gets submitted; multi-selection works; a previously-selected node
   * that is no longer an available candidate is preserved, not dropped;
   * a node found ONLY via search (outside the default Business-Type
   * scope) is still accepted by the create mutation identically to a
   * default-scope node (items P/Q); and the selector's own
   * loading/error/empty states render.
   */
  describe("PLATFORM-BASELINE-010B: qualifying-node selection (no Category)", () => {
    it("shows human-readable qualifying-node options by default — never a raw id input, and no category gate", async () => {
      rewardProgramsResult = { data: [], isLoading: false, isError: false };
      accessibleResult = { data: [{ businessId: "biz-1", role: "owner" }] };
      qualifyingNodesResult = {
        data: [
          { id: "node-haircut", displayLabel: "Haircut", nodeType: "standard_service" },
          { id: "node-shampoo", displayLabel: "Shampoo", nodeType: "standard_product" },
        ],
        isLoading: false,
        isError: false,
        isSuccess: true,
      };
      const user = userEvent.setup();
      renderPage();
      await user.click(screen.getByRole("button", { name: /create reward program/i }));

      // Candidates render immediately -- no category must be chosen first.
      expect(screen.getByLabelText("Haircut")).toBeInTheDocument();
      expect(screen.getByLabelText("Shampoo")).toBeInTheDocument();
      expect(screen.queryByText("node-haircut")).not.toBeInTheDocument();
    });

    it("shows qualifying-node checkboxes from the default Business-Type scope and submits canonical ids, never labels", async () => {
      rewardProgramsResult = { data: [], isLoading: false, isError: false };
      accessibleResult = { data: [{ businessId: "biz-1", role: "owner" }] };
      qualifyingNodesResult = {
        data: [
          { id: "node-haircut", displayLabel: "Haircut", nodeType: "standard_service" },
          { id: "node-shampoo", displayLabel: "Shampoo", nodeType: "standard_product" },
        ],
        isLoading: false,
        isError: false,
        isSuccess: true,
      };
      const user = userEvent.setup();
      renderPage();
      await user.click(screen.getByRole("button", { name: /create reward program/i }));

      await user.type(screen.getByLabelText(/program name/i), "Buy 10 Haircuts");
      await user.type(screen.getByLabelText(/reward description/i), "One free haircut");
      fireEvent.change(screen.getByLabelText(/effective from/i), {
        target: { value: "2026-09-13" },
      });

      // The operator sees and clicks human-readable labels — never an id.
      const haircutCheckbox = screen.getByRole("checkbox", { name: /haircut/i });
      const shampooCheckbox = screen.getByRole("checkbox", { name: /shampoo/i });
      expect(screen.queryByText("node-haircut")).not.toBeInTheDocument();
      await user.click(haircutCheckbox);
      await user.click(shampooCheckbox);
      // Deselect one to prove add/remove both work before submit.
      await user.click(shampooCheckbox);

      await user.click(screen.getByRole("button", { name: /^create program$/i }));
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          qualifyingNodes: [{ knowledgeNodeId: "node-haircut", businessDisplayName: "Haircut" }],
        }),
        expect.anything(),
      );
    });

    it("supports selecting multiple qualifying nodes at once", async () => {
      rewardProgramsResult = { data: [], isLoading: false, isError: false };
      accessibleResult = { data: [{ businessId: "biz-1", role: "owner" }] };
      qualifyingNodesResult = {
        data: [
          { id: "node-a", displayLabel: "Item A", nodeType: "standard_product" },
          { id: "node-b", displayLabel: "Item B", nodeType: "standard_product" },
        ],
        isLoading: false,
        isError: false,
        isSuccess: true,
      };
      const user = userEvent.setup();
      renderPage();
      await user.click(screen.getByRole("button", { name: /create reward program/i }));
      await user.type(screen.getByLabelText(/program name/i), "Multi");
      await user.type(screen.getByLabelText(/reward description/i), "desc");
      fireEvent.change(screen.getByLabelText(/effective from/i), {
        target: { value: "2026-09-13" },
      });
      await user.click(screen.getByRole("checkbox", { name: /item a/i }));
      await user.click(screen.getByRole("checkbox", { name: /item b/i }));
      await user.click(screen.getByRole("button", { name: /^create program$/i }));
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          qualifyingNodes: [
            { knowledgeNodeId: "node-a", businessDisplayName: "Item A" },
            { knowledgeNodeId: "node-b", businessDisplayName: "Item B" },
          ],
        }),
        expect.anything(),
      );
    });

    /**
     * `PLATFORM-BASELINE-010B` items P/Q: a canonical node found ONLY via
     * the broader search escape hatch (i.e. NOT in the default
     * Business-Type-scoped list) must still be selectable by label and
     * accepted by the create mutation identically to a default-scope
     * node -- proving Business Type is a discovery convenience, never a
     * server-side qualification gate, all the way through this form.
     */
    it("accepts a qualifying node found only via the search escape hatch, outside the default Business-Type scope", async () => {
      rewardProgramsResult = { data: [], isLoading: false, isError: false };
      accessibleResult = { data: [{ businessId: "biz-1", role: "owner" }] };
      // Default scope has nothing relevant...
      qualifyingNodesResult = { data: [], isLoading: false, isError: false, isSuccess: true };
      // ...but the broader search finds an eligible node elsewhere.
      searchResult = {
        data: [
          { id: "node-sedan-wash", displayLabel: "Sedan Car Wash", nodeType: "standard_service" },
        ],
        isLoading: false,
        isError: false,
        isSuccess: true,
      };
      const user = userEvent.setup();
      renderPage();
      await user.click(screen.getByRole("button", { name: /create reward program/i }));
      await user.type(screen.getByLabelText(/program name/i), "Car Wash Rewards");
      await user.type(screen.getByLabelText(/reward description/i), "One free wash");
      fireEvent.change(screen.getByLabelText(/effective from/i), {
        target: { value: "2026-09-13" },
      });

      // Found and selected by typed name only, never a pasted id.
      await user.type(screen.getByLabelText(/search all products and services/i), "sedan");
      const searchCheckbox = screen.getByRole("checkbox", { name: /sedan car wash/i });
      expect(screen.queryByText("node-sedan-wash")).not.toBeInTheDocument();
      await user.click(searchCheckbox);

      await user.click(screen.getByRole("button", { name: /^create program$/i }));
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          qualifyingNodes: [
            { knowledgeNodeId: "node-sedan-wash", businessDisplayName: "Sedan Car Wash" },
          ],
        }),
        expect.anything(),
      );
    });

    it("hydrates an existing draft's qualifying-node selections as checked when the node is still an active candidate", async () => {
      const draftWithActiveNode: RewardProgramWithVersionsWire = {
        program: programWire,
        currentVersion: null,
        draftVersion: versionWire({
          qualifyingNodes: [{ knowledgeNodeId: "node-1", businessDisplayName: null }],
        }),
      };
      rewardProgramsResult = { data: [draftWithActiveNode], isLoading: false, isError: false };
      accessibleResult = { data: [{ businessId: "biz-1", role: "owner" }] };
      qualifyingNodesResult = {
        data: [{ id: "node-1", displayLabel: "Wash", nodeType: "standard_service" }],
        isLoading: false,
        isError: false,
        isSuccess: true,
      };
      const user = userEvent.setup();
      renderPage();
      await user.click(screen.getByRole("button", { name: /edit draft/i }));
      const washCheckbox = screen.getByRole("checkbox", { name: /wash/i });
      expect(washCheckbox).toBeChecked();
    });

    it("preserves a previously-selected node that is no longer an available candidate, flags it, and lets the operator remove it explicitly", async () => {
      const draftWithRetiredNode: RewardProgramWithVersionsWire = {
        program: programWire,
        currentVersion: null,
        draftVersion: versionWire({
          qualifyingNodes: [{ knowledgeNodeId: "node-retired", businessDisplayName: "Old Item" }],
        }),
      };
      rewardProgramsResult = { data: [draftWithRetiredNode], isLoading: false, isError: false };
      accessibleResult = { data: [{ businessId: "biz-1", role: "owner" }] };
      // The live candidate lists no longer contain "node-retired".
      qualifyingNodesResult = { data: [], isLoading: false, isError: false, isSuccess: true };
      nodeLabelsResult = { data: [{ id: "node-retired", displayLabel: null, status: "retired" }] };
      const user = userEvent.setup();
      renderPage();
      await user.click(screen.getByRole("button", { name: /edit draft/i }));

      // Never silently dropped: still shown, still checked, using the
      // last-known stored label — never the raw canonical id.
      const retiredCheckbox = screen.getByRole("checkbox", { name: /old item/i });
      expect(retiredCheckbox).toBeChecked();
      expect(screen.queryByText("node-retired")).not.toBeInTheDocument();

      // The operator can explicitly remove it.
      await user.click(retiredCheckbox);
      await user.click(screen.getByRole("button", { name: /save draft/i }));
      expect(mockUpdateDraft).toHaveBeenCalledWith(
        expect.objectContaining({ qualifyingNodes: [] }),
        expect.anything(),
      );
    });

    it("shows a loading state while default qualifying-node candidates are being fetched", async () => {
      rewardProgramsResult = { data: [], isLoading: false, isError: false };
      accessibleResult = { data: [{ businessId: "biz-1", role: "owner" }] };
      qualifyingNodesResult = {
        data: undefined,
        isLoading: true,
        isError: false,
        isSuccess: false,
      };
      const user = userEvent.setup();
      renderPage();
      await user.click(screen.getByRole("button", { name: /create reward program/i }));
      expect(screen.getByText(/loading products and services/i)).toBeInTheDocument();
    });

    it("shows a safe, translated error state (never a raw exception) when default qualifying-node candidates fail to load", async () => {
      rewardProgramsResult = { data: [], isLoading: false, isError: false };
      accessibleResult = { data: [{ businessId: "biz-1", role: "owner" }] };
      qualifyingNodesResult = {
        data: undefined,
        isLoading: false,
        isError: true,
        isSuccess: false,
      };
      const user = userEvent.setup();
      renderPage();
      await user.click(screen.getByRole("button", { name: /create reward program/i }));
      expect(screen.getByRole("alert")).toHaveTextContent(/couldn't load/i);
    });

    it("shows an explicit empty state when the default Business-Type scope has no eligible qualifying nodes", async () => {
      rewardProgramsResult = { data: [], isLoading: false, isError: false };
      accessibleResult = { data: [{ businessId: "biz-1", role: "owner" }] };
      qualifyingNodesResult = { data: [], isLoading: false, isError: false, isSuccess: true };
      const user = userEvent.setup();
      renderPage();
      await user.click(screen.getByRole("button", { name: /create reward program/i }));
      expect(screen.getByText(/no products or services/i)).toBeInTheDocument();
    });
  });
});
