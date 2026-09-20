/**
 * `QualifyingItemSelector` tests (`PLATFORM-BASELINE-013B`, `DEC-LOY-016`):
 * the operator works with the Business's OWN Qualifying Items -- stable
 * ids are emitted, Business-authored names are rendered, internal UUIDs
 * never appear, unclassified items need no taxonomy, retired references
 * survive via their frozen snapshot names, and loading/error/empty states
 * render.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QualifyingItemSelector } from "./QualifyingItemSelector";
import type { QualifyingItemWire } from "../api/qualifyingItems";

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

const COFFEE = itemWire();
const PIZZA = itemWire({ id: "item-pizza", name: "Medium Pizza" });

let selected: string[];
let onChange: (next: string[]) => void;

function renderSelector(props: Partial<React.ComponentProps<typeof QualifyingItemSelector>> = {}) {
  return render(
    <QualifyingItemSelector
      idPrefix="test-qi"
      items={[COFFEE, PIZZA]}
      isLoading={false}
      isError={false}
      selectedIds={selected}
      onChange={onChange}
      snapshotNames={new Map()}
      {...props}
    />,
  );
}

describe("QualifyingItemSelector (PLATFORM-BASELINE-013B)", () => {
  beforeEach(() => {
    selected = [];
    onChange = vi.fn((next: string[]) => {
      selected = next;
    });
  });

  it("renders active items by Business name and never exposes internal ids", () => {
    renderSelector();
    expect(screen.getByLabelText("Black Coffee")).toBeInTheDocument();
    expect(screen.getByLabelText("Medium Pizza")).toBeInTheDocument();
    expect(screen.queryByText("item-coffee")).not.toBeInTheDocument();
    expect(screen.queryByText("item-pizza")).not.toBeInTheDocument();
  });

  it("checks the ids already bound and emits ids (never names) on toggle", async () => {
    selected = ["item-coffee"];
    const user = userEvent.setup();
    const { rerender } = render(
      <QualifyingItemSelector
        idPrefix="test-qi"
        items={[COFFEE, PIZZA]}
        isLoading={false}
        isError={false}
        selectedIds={selected}
        onChange={onChange}
        snapshotNames={new Map()}
      />,
    );
    expect(screen.getByRole("checkbox", { name: "Black Coffee" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Medium Pizza" })).not.toBeChecked();

    await user.click(screen.getByRole("checkbox", { name: "Medium Pizza" }));
    expect(onChange).toHaveBeenCalledWith(["item-coffee", "item-pizza"]);

    rerender(
      <QualifyingItemSelector
        idPrefix="test-qi"
        items={[COFFEE, PIZZA]}
        isLoading={false}
        isError={false}
        selectedIds={["item-coffee", "item-pizza"]}
        onChange={onChange}
        snapshotNames={new Map()}
      />,
    );
    await user.click(screen.getByRole("checkbox", { name: "Black Coffee" }));
    expect(onChange).toHaveBeenCalledWith(["item-pizza"]);
  });

  it("selects an unclassified item exactly like a classified one (no taxonomy UI)", () => {
    const classified = itemWire({ id: "item-tea", name: "Green Tea", knowledgeNodeId: "node-1" });
    renderSelector({ items: [COFFEE, classified] });
    expect(screen.getByLabelText("Black Coffee")).toBeInTheDocument();
    expect(screen.getByLabelText("Green Tea")).toBeInTheDocument();
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/search/i)).not.toBeInTheDocument();
  });

  it("keeps a retired reference visible via its frozen snapshot name and lets the operator remove it", async () => {
    selected = ["item-retired"];
    const user = userEvent.setup();
    renderSelector({
      items: [COFFEE],
      selectedIds: selected,
      snapshotNames: new Map([["item-retired", "Old Special"]]),
    });

    const retiredCheckbox = screen.getByRole("checkbox", { name: /old special/i });
    expect(retiredCheckbox).toBeChecked();
    expect(screen.queryByText("item-retired")).not.toBeInTheDocument();

    await user.click(retiredCheckbox);
    expect(onChange).toHaveBeenCalledWith([]);
  });

  it("falls back to the unavailable label when no snapshot name exists for a retired reference", () => {
    renderSelector({ items: [COFFEE], selectedIds: ["item-ghost"], snapshotNames: new Map() });
    expect(screen.getByRole("checkbox", { name: /name unavailable/i })).toBeChecked();
    expect(screen.queryByText("item-ghost")).not.toBeInTheDocument();
  });

  it("shows a loading state", () => {
    renderSelector({ items: undefined, isLoading: true });
    expect(screen.getByText(/loading your qualifying items/i)).toBeInTheDocument();
  });

  it("shows a translated error state", () => {
    renderSelector({ items: undefined, isError: true });
    expect(screen.getByRole("alert")).toHaveTextContent(/couldn't load/i);
  });

  it("shows an empty state when the Business has no items", () => {
    renderSelector({ items: [] });
    expect(screen.getByText(/no qualifying items yet/i)).toBeInTheDocument();
  });

  it("emits change events usable with fireEvent for environments without user-event", () => {
    renderSelector();
    fireEvent.click(screen.getByRole("checkbox", { name: "Black Coffee" }));
    expect(onChange).toHaveBeenCalledWith(["item-coffee"]);
  });
});
