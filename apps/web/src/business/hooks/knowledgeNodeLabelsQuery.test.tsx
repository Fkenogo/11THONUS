import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useKnowledgeNodeLabelsQuery } from "./businessQueries";

const { resolveLabels } = vi.hoisted(() => ({ resolveLabels: vi.fn() }));

vi.mock("../BusinessApiContext", () => ({
  useBusinessApiPlatform: () => ({ auth: {}, functions: {} }),
}));

vi.mock("./useAuthenticatedActor", () => ({
  useAuthenticatedActor: () => ({ status: "ready", actor: { userId: "user-1" } }),
}));

vi.mock("../api/commerceKnowledge", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../api/commerceKnowledge")>();
  return { ...actual, makeCallResolveKnowledgeNodeLabels: () => resolveLabels };
});

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe("useKnowledgeNodeLabelsQuery bounded page resolution", () => {
  beforeEach(() => {
    resolveLabels.mockReset();
  });

  it("sequentially chunks more than 100 ids and retains successful results when one chunk fails", async () => {
    resolveLabels.mockImplementation(async (_actor, payload: { nodeIds: string[] }) => {
      if (payload.nodeIds.includes("node-150")) throw new Error("temporarily unavailable");
      return payload.nodeIds.map((id) => ({
        id,
        displayLabel: `Label ${id}`,
        status: "active",
      }));
    });
    const nodeIds = [
      ...Array.from({ length: 205 }, (_, index) => `node-${String(index).padStart(3, "0")}`),
      "node-000",
    ];
    const { result } = renderHook(() => useKnowledgeNodeLabelsQuery(nodeIds, "en"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(resolveLabels).toHaveBeenCalledTimes(3);
    const payloads = resolveLabels.mock.calls.map((call) => call[1] as { nodeIds: string[] });
    expect(payloads.map(({ nodeIds: batch }) => batch.length)).toEqual([100, 100, 5]);
    expect(payloads.every(({ nodeIds: batch }) => batch.length <= 100)).toBe(true);
    expect(payloads.flatMap(({ nodeIds: batch }) => batch)).toHaveLength(205);
    expect(result.current.data).toHaveLength(105);
    expect(result.current.data?.find((label) => label.id === "node-099")?.displayLabel).toBe(
      "Label node-099",
    );
    expect(result.current.data?.some((label) => label.id === "node-200")).toBe(true);
    expect(result.current.data?.some((label) => label.id === "node-150")).toBe(false);
  });

  it("uses separate cached label results for English and French", async () => {
    resolveLabels.mockImplementation(
      async (_actor, payload: { nodeIds: string[]; languageCode: string }) =>
        payload.nodeIds.map((id) => ({
          id,
          displayLabel: `${payload.languageCode}:${id}`,
          status: "active",
        })),
    );
    const nodeIds = ["resolved-node"];
    const { result, rerender } = renderHook(
      ({ languageCode }: { languageCode: string }) =>
        useKnowledgeNodeLabelsQuery(nodeIds, languageCode),
      { initialProps: { languageCode: "en" }, wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.data?.[0]?.displayLabel).toBe("en:resolved-node"));
    rerender({ languageCode: "fr" });
    await waitFor(() => expect(result.current.data?.[0]?.displayLabel).toBe("fr:resolved-node"));

    expect(resolveLabels).toHaveBeenCalledTimes(2);
    expect(
      resolveLabels.mock.calls.map((call) => (call[1] as { languageCode: string }).languageCode),
    ).toEqual(["en", "fr"]);
  });
});
