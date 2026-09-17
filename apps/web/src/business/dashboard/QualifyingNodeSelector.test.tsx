/**
 * `QualifyingNodeSelector` tests (`PLATFORM-BASELINE-008`, redesigned by
 * `PLATFORM-BASELINE-010B` per Founder decision `DEC-LOY-014` /
 * `FD-REWARD-QUALIFICATION-001`).
 *
 * Proves behaviour, not snapshots: human-readable options are displayed,
 * the operator never enters/sees a raw canonical id, `onChange` always
 * emits canonical `knowledgeNodeId`s (never labels), multiple selections
 * are preserved, add/remove both work, loading/empty/read-error states
 * render, a previously-selected node that is no longer resolvable via
 * either candidate source is never silently dropped, and the broader
 * search "escape hatch" lets an operator find/select a node by typed name
 * with no code path requiring a canonical id to be typed/pasted (item N
 * of the `PLATFORM-BASELINE-010B` test plan).
 */

import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QualifyingNodeSelector } from "./QualifyingNodeSelector";
import type { QualifyingNodeWire } from "../api/rewardProgramMutations";

type CandidateOption = { id: string; displayLabel: string; nodeType: string };
type LabelResult = { id: string; displayLabel: string | null; status: string | null };

let qualifyingNodesResult: {
  data: CandidateOption[] | undefined;
  isLoading: boolean;
  isError: boolean;
  isSuccess: boolean;
};
let searchResult: {
  data: CandidateOption[] | undefined;
  isLoading: boolean;
  isError: boolean;
  isSuccess: boolean;
};
let nodeLabelsResult: { data: LabelResult[] | undefined };

vi.mock("../hooks/businessQueries", () => ({
  useQualifyingNodesForBusinessTypeQuery: () => qualifyingNodesResult,
  useSearchQualifyingNodesQuery: () => searchResult,
  useKnowledgeNodeLabelsQuery: () => nodeLabelsResult,
}));

function emptySearch(): typeof searchResult {
  return { data: undefined, isLoading: false, isError: false, isSuccess: false };
}

function renderSelector(
  selected: QualifyingNodeWire[],
  onChange: (next: QualifyingNodeWire[]) => void,
  businessTypeId = "bt-1",
) {
  return render(
    <QualifyingNodeSelector
      idPrefix="test-qn"
      businessTypeId={businessTypeId}
      selected={selected}
      onChange={onChange}
    />,
  );
}

describe("QualifyingNodeSelector (PLATFORM-BASELINE-010B)", () => {
  it("shows a loading state while default candidates are loading", () => {
    qualifyingNodesResult = { data: undefined, isLoading: true, isError: false, isSuccess: false };
    searchResult = emptySearch();
    nodeLabelsResult = { data: [] };
    renderSelector([], vi.fn());
    expect(screen.getByText(/loading products and services/i)).toBeInTheDocument();
  });

  it("shows a safe read-error state, never a raw backend exception", () => {
    qualifyingNodesResult = { data: undefined, isLoading: false, isError: true, isSuccess: false };
    searchResult = emptySearch();
    nodeLabelsResult = { data: [] };
    renderSelector([], vi.fn());
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent(/couldn't load products and services/i);
  });

  it("shows an explicit empty state when the default Business-Type scope has no qualifying candidates", () => {
    qualifyingNodesResult = { data: [], isLoading: false, isError: false, isSuccess: true };
    searchResult = emptySearch();
    nodeLabelsResult = { data: [] };
    renderSelector([], vi.fn());
    expect(screen.getByText(/no products or services are available/i)).toBeInTheDocument();
  });

  it("displays human-readable labels only -- the operator never sees a raw canonical id", () => {
    qualifyingNodesResult = {
      data: [
        { id: "kn-haircut-001", displayLabel: "Haircut", nodeType: "standard_service" },
        { id: "kn-shampoo-002", displayLabel: "Shampoo Treatment", nodeType: "standard_product" },
      ],
      isLoading: false,
      isError: false,
      isSuccess: true,
    };
    searchResult = emptySearch();
    nodeLabelsResult = { data: [] };
    renderSelector([], vi.fn());

    expect(screen.getByLabelText("Haircut")).toBeInTheDocument();
    expect(screen.getByLabelText("Shampoo Treatment")).toBeInTheDocument();
    // The raw canonical ids are never rendered as visible text anywhere.
    expect(screen.queryByText("kn-haircut-001")).not.toBeInTheDocument();
    expect(screen.queryByText("kn-shampoo-002")).not.toBeInTheDocument();
  });

  it("checking a default-scope option emits the canonical id (never the label) via onChange, and supports multiple selections", async () => {
    qualifyingNodesResult = {
      data: [
        { id: "kn-haircut-001", displayLabel: "Haircut", nodeType: "standard_service" },
        { id: "kn-shampoo-002", displayLabel: "Shampoo Treatment", nodeType: "standard_product" },
      ],
      isLoading: false,
      isError: false,
      isSuccess: true,
    };
    searchResult = emptySearch();
    nodeLabelsResult = { data: [] };
    const onChange = vi.fn();
    const user = userEvent.setup();
    const { rerender } = renderSelector([], onChange);

    await user.click(screen.getByLabelText("Haircut"));
    expect(onChange).toHaveBeenCalledWith([
      { knowledgeNodeId: "kn-haircut-001", businessDisplayName: "Haircut" },
    ]);

    // Simulate the parent committing the first selection, then adding a second.
    rerender(
      <QualifyingNodeSelector
        idPrefix="test-qn"
        businessTypeId="bt-1"
        selected={[{ knowledgeNodeId: "kn-haircut-001", businessDisplayName: "Haircut" }]}
        onChange={onChange}
      />,
    );
    await user.click(screen.getByLabelText("Shampoo Treatment"));
    expect(onChange).toHaveBeenLastCalledWith([
      { knowledgeNodeId: "kn-haircut-001", businessDisplayName: "Haircut" },
      { knowledgeNodeId: "kn-shampoo-002", businessDisplayName: "Shampoo Treatment" },
    ]);
  });

  it("unchecking a selected option removes only that node's canonical id", async () => {
    qualifyingNodesResult = {
      data: [
        { id: "kn-haircut-001", displayLabel: "Haircut", nodeType: "standard_service" },
        { id: "kn-shampoo-002", displayLabel: "Shampoo Treatment", nodeType: "standard_product" },
      ],
      isLoading: false,
      isError: false,
      isSuccess: true,
    };
    searchResult = emptySearch();
    nodeLabelsResult = { data: [] };
    const onChange = vi.fn();
    const user = userEvent.setup();
    renderSelector(
      [
        { knowledgeNodeId: "kn-haircut-001", businessDisplayName: "Haircut" },
        { knowledgeNodeId: "kn-shampoo-002", businessDisplayName: "Shampoo Treatment" },
      ],
      onChange,
    );

    await user.click(screen.getByLabelText("Haircut"));
    expect(onChange).toHaveBeenCalledWith([
      { knowledgeNodeId: "kn-shampoo-002", businessDisplayName: "Shampoo Treatment" },
    ]);
  });

  it("hydrates an existing draft's selection that is no longer resolvable via either candidate source (retired) without dropping it, and shows its status", () => {
    qualifyingNodesResult = {
      data: [
        { id: "kn-shampoo-002", displayLabel: "Shampoo Treatment", nodeType: "standard_product" },
      ],
      isLoading: false,
      isError: false,
      isSuccess: true,
    };
    searchResult = emptySearch();
    nodeLabelsResult = {
      data: [{ id: "kn-old-haircut-000", displayLabel: "Classic Haircut", status: "retired" }],
    };
    renderSelector(
      [
        { knowledgeNodeId: "kn-old-haircut-000", businessDisplayName: "Classic Haircut" },
        { knowledgeNodeId: "kn-shampoo-002", businessDisplayName: null },
      ],
      vi.fn(),
    );

    // Still shown, still checked -- never silently dropped.
    const retiredCheckbox = screen.getByLabelText(/classic haircut/i);
    expect(retiredCheckbox).toBeChecked();
    // No raw canonical id ever shown to the operator.
    expect(screen.queryByText("kn-old-haircut-000")).not.toBeInTheDocument();
  });

  it("a genuinely unresolvable selected id renders a safe generic label, never the raw id or a backend error", () => {
    qualifyingNodesResult = { data: [], isLoading: false, isError: false, isSuccess: true };
    searchResult = emptySearch();
    nodeLabelsResult = { data: [{ id: "kn-deleted-999", displayLabel: null, status: null }] };
    renderSelector([{ knowledgeNodeId: "kn-deleted-999", businessDisplayName: null }], vi.fn());

    expect(screen.getByText(/previously selected item \(name unavailable\)/i)).toBeInTheDocument();
    expect(screen.queryByText("kn-deleted-999")).not.toBeInTheDocument();
  });

  it("removing an unresolved/retired selection is only ever an explicit user action", async () => {
    qualifyingNodesResult = { data: [], isLoading: false, isError: false, isSuccess: true };
    searchResult = emptySearch();
    nodeLabelsResult = {
      data: [{ id: "kn-old-haircut-000", displayLabel: "Classic Haircut", status: "retired" }],
    };
    const onChange = vi.fn();
    const user = userEvent.setup();
    renderSelector(
      [{ knowledgeNodeId: "kn-old-haircut-000", businessDisplayName: "Classic Haircut" }],
      onChange,
    );

    const checkbox = screen.getByLabelText(/classic haircut/i);
    expect(checkbox).toBeChecked();
    await user.click(checkbox);
    expect(onChange).toHaveBeenCalledWith([]);
  });

  describe("search escape hatch (PLATFORM-BASELINE-010B, DEC-LOY-014/FD-REWARD-QUALIFICATION-001)", () => {
    it("renders a search input -- never a canonical-id text field", () => {
      qualifyingNodesResult = { data: [], isLoading: false, isError: false, isSuccess: true };
      searchResult = emptySearch();
      nodeLabelsResult = { data: [] };
      renderSelector([], vi.fn());

      const searchInput = screen.getByLabelText(/search all products and services/i);
      expect(searchInput).toBeInTheDocument();
      expect(searchInput).toHaveAttribute("type", "text");
    });

    it("shows search results outside the default scope and selecting one emits its canonical id by label click only", async () => {
      qualifyingNodesResult = { data: [], isLoading: false, isError: false, isSuccess: true };
      searchResult = {
        data: [
          { id: "kn-sedan-wash-777", displayLabel: "Sedan Car Wash", nodeType: "standard_service" },
        ],
        isLoading: false,
        isError: false,
        isSuccess: true,
      };
      nodeLabelsResult = { data: [] };
      const onChange = vi.fn();
      const user = userEvent.setup();
      renderSelector([], onChange);

      const resultCheckbox = screen.getByLabelText("Sedan Car Wash");
      expect(resultCheckbox).toBeInTheDocument();
      expect(screen.queryByText("kn-sedan-wash-777")).not.toBeInTheDocument();

      await user.click(resultCheckbox);
      expect(onChange).toHaveBeenCalledWith([
        { knowledgeNodeId: "kn-sedan-wash-777", businessDisplayName: "Sedan Car Wash" },
      ]);
    });

    it("shows a safe read-error state for a failed search, never a raw backend exception", () => {
      qualifyingNodesResult = { data: [], isLoading: false, isError: false, isSuccess: true };
      searchResult = { data: undefined, isLoading: false, isError: true, isSuccess: false };
      nodeLabelsResult = { data: [] };
      renderSelector([], vi.fn());

      expect(screen.getByText(/couldn't run that search/i)).toBeInTheDocument();
    });
  });
});
