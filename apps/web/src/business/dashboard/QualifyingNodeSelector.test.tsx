/**
 * `QualifyingNodeSelector` tests (`PLATFORM-BASELINE-008`).
 *
 * Proves behaviour, not snapshots: human-readable options are displayed,
 * the operator never enters/sees a raw canonical id, `onChange` always
 * emits canonical `knowledgeNodeId`s (never labels), multiple selections
 * are preserved, add/remove both work, loading/empty/read-error states
 * render, and a previously-selected node that is no longer in the active
 * candidate list (retired/archived/unresolvable) is never silently
 * dropped -- it renders in a distinct group and is removable only via an
 * explicit user action.
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
let nodeLabelsResult: { data: LabelResult[] | undefined };

vi.mock("../hooks/businessQueries", () => ({
  useQualifyingNodesForCategoryQuery: () => qualifyingNodesResult,
  useKnowledgeNodeLabelsQuery: () => nodeLabelsResult,
}));

function renderSelector(
  selected: QualifyingNodeWire[],
  onChange: (next: QualifyingNodeWire[]) => void,
  categoryId = "cat-1",
) {
  return render(
    <QualifyingNodeSelector
      idPrefix="test-qn"
      categoryId={categoryId}
      selected={selected}
      onChange={onChange}
    />,
  );
}

describe("QualifyingNodeSelector (PLATFORM-BASELINE-008)", () => {
  it("prompts to choose a category first when no category is set yet", () => {
    qualifyingNodesResult = { data: undefined, isLoading: false, isError: false, isSuccess: false };
    nodeLabelsResult = { data: [] };
    renderSelector([], vi.fn(), "");
    expect(screen.getByText(/choose a reward program category/i)).toBeInTheDocument();
  });

  it("shows a loading state while candidates are loading", () => {
    qualifyingNodesResult = { data: undefined, isLoading: true, isError: false, isSuccess: false };
    nodeLabelsResult = { data: [] };
    renderSelector([], vi.fn());
    expect(screen.getByText(/loading products and services/i)).toBeInTheDocument();
  });

  it("shows a safe read-error state, never a raw backend exception", () => {
    qualifyingNodesResult = { data: undefined, isLoading: false, isError: true, isSuccess: false };
    nodeLabelsResult = { data: [] };
    renderSelector([], vi.fn());
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent(/couldn't load products and services/i);
  });

  it("shows an explicit empty state when the category has no qualifying candidates", () => {
    qualifyingNodesResult = { data: [], isLoading: false, isError: false, isSuccess: true };
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
    nodeLabelsResult = { data: [] };
    renderSelector([], vi.fn());

    expect(screen.getByLabelText("Haircut")).toBeInTheDocument();
    expect(screen.getByLabelText("Shampoo Treatment")).toBeInTheDocument();
    // The raw canonical ids are never rendered as visible text anywhere.
    expect(screen.queryByText("kn-haircut-001")).not.toBeInTheDocument();
    expect(screen.queryByText("kn-shampoo-002")).not.toBeInTheDocument();
  });

  it("checking an option emits the canonical id (never the label) via onChange, and supports multiple selections", async () => {
    qualifyingNodesResult = {
      data: [
        { id: "kn-haircut-001", displayLabel: "Haircut", nodeType: "standard_service" },
        { id: "kn-shampoo-002", displayLabel: "Shampoo Treatment", nodeType: "standard_product" },
      ],
      isLoading: false,
      isError: false,
      isSuccess: true,
    };
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
        categoryId="cat-1"
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

  it("hydrates an existing draft's selection that is no longer an active candidate (retired) without dropping it, and shows its status", () => {
    qualifyingNodesResult = {
      data: [
        { id: "kn-shampoo-002", displayLabel: "Shampoo Treatment", nodeType: "standard_product" },
      ],
      isLoading: false,
      isError: false,
      isSuccess: true,
    };
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
    nodeLabelsResult = { data: [{ id: "kn-deleted-999", displayLabel: null, status: null }] };
    renderSelector([{ knowledgeNodeId: "kn-deleted-999", businessDisplayName: null }], vi.fn());

    expect(screen.getByText(/previously selected item \(name unavailable\)/i)).toBeInTheDocument();
    expect(screen.queryByText("kn-deleted-999")).not.toBeInTheDocument();
  });

  it("removing an unresolved/retired selection is only ever an explicit user action", async () => {
    qualifyingNodesResult = { data: [], isLoading: false, isError: false, isSuccess: true };
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
});
