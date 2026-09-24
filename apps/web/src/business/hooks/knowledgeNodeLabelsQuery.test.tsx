import { focusManager, QueryClient, QueryClientProvider } from "@tanstack/react-query";
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

function createQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
}

function createWrapper(queryClient: QueryClient) {
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe("useKnowledgeNodeLabelsQuery bounded page resolution", () => {
  beforeEach(() => {
    resolveLabels.mockReset();
  });

  it("sequentially chunks 205 unique ids plus a duplicate into bounded requests", async () => {
    let inFlight = 0;
    let maxInFlight = 0;
    resolveLabels.mockImplementation(async (_actor, payload: { nodeIds: string[] }) => {
      inFlight += 1;
      maxInFlight = Math.max(maxInFlight, inFlight);
      await new Promise((resolve) => setTimeout(resolve, 0));
      inFlight -= 1;
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
    const queryClient = createQueryClient();
    const { result } = renderHook(() => useKnowledgeNodeLabelsQuery(nodeIds, "en"), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(resolveLabels).toHaveBeenCalledTimes(3);
    const payloads = resolveLabels.mock.calls.map((call) => call[1] as { nodeIds: string[] });
    expect(payloads.map(({ nodeIds: batch }) => batch.length)).toEqual([100, 100, 5]);
    expect(payloads.every(({ nodeIds: batch }) => batch.length <= 100)).toBe(true);
    expect(payloads.flatMap(({ nodeIds: batch }) => batch)).toHaveLength(205);
    expect(maxInFlight).toBe(1);
    expect(result.current.data).toHaveLength(205);
    expect(result.current.data?.find((label) => label.id === "node-099")?.displayLabel).toBe(
      "Label node-099",
    );
    expect(result.current.data?.some((label) => label.id === "node-200")).toBe(true);
  });

  it("keeps successful chunks visible and retries only a transiently failed chunk on focus", async () => {
    const middleBatchCalls = new Map<string, number>();
    resolveLabels.mockImplementation(async (_actor, payload: { nodeIds: string[] }) => {
      if (payload.nodeIds.includes("node-150")) {
        const firstId = payload.nodeIds[0];
        const calls = (middleBatchCalls.get(firstId) ?? 0) + 1;
        middleBatchCalls.set(firstId, calls);
        if (calls === 1) throw new Error("temporarily unavailable");
      }
      return payload.nodeIds.map((id) => ({ id, displayLabel: `Label ${id}`, status: "active" }));
    });
    const nodeIds = Array.from(
      { length: 205 },
      (_, index) => `node-${String(index).padStart(3, "0")}`,
    );
    const queryClient = createQueryClient();
    const { result } = renderHook(() => useKnowledgeNodeLabelsQuery(nodeIds, "en"), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.data).toHaveLength(105);
    expect(result.current.data?.some((label) => label.id === "node-099")).toBe(true);
    expect(result.current.data?.some((label) => label.id === "node-200")).toBe(true);
    expect(result.current.data?.some((label) => label.id === "node-150")).toBe(false);

    focusManager.setFocused(false);
    focusManager.setFocused(true);
    await waitFor(() => expect(result.current.data).toHaveLength(205));

    const payloads = resolveLabels.mock.calls.map((call) => call[1] as { nodeIds: string[] });
    expect(payloads.map(({ nodeIds: batch }) => batch.length)).toEqual([100, 100, 5, 100]);
    expect(payloads.slice(0, 3).every(({ nodeIds: batch }) => batch.length <= 100)).toBe(true);
    expect(result.current.data?.some((label) => label.id === "node-099")).toBe(true);
    expect(result.current.data?.some((label) => label.id === "node-200")).toBe(true);
    focusManager.setFocused(undefined);
  });

  it("bounds persistent failures and keeps successful chunks usable without polling", async () => {
    resolveLabels.mockImplementation(async (_actor, payload: { nodeIds: string[] }) => {
      if (payload.nodeIds.includes("node-150")) throw new Error("persistently unavailable");
      return payload.nodeIds.map((id) => ({ id, displayLabel: `Label ${id}`, status: "active" }));
    });
    const nodeIds = Array.from(
      { length: 205 },
      (_, index) => `node-${String(index).padStart(3, "0")}`,
    );
    const queryClient = createQueryClient();
    const { result } = renderHook(() => useKnowledgeNodeLabelsQuery(nodeIds, "en"), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.data).toHaveLength(105);
    expect(resolveLabels).toHaveBeenCalledTimes(3);
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(resolveLabels).toHaveBeenCalledTimes(3);
  });

  it("keeps failed-batch retries isolated between English and French caches", async () => {
    const enAttempts = new Map<string, number>();
    resolveLabels.mockImplementation(
      async (_actor, payload: { nodeIds: string[]; languageCode: string }) => {
        if (payload.languageCode === "en") {
          const id = payload.nodeIds[0];
          const attempts = (enAttempts.get(id) ?? 0) + 1;
          enAttempts.set(id, attempts);
          if (attempts === 1) throw new Error("English temporarily unavailable");
        }
        return payload.nodeIds.map((id) => ({
          id,
          displayLabel: `${payload.languageCode}:${id}`,
          status: "active",
        }));
      },
    );
    const queryClient = createQueryClient();
    const { result, rerender } = renderHook(
      ({ languageCode }: { languageCode: string }) =>
        useKnowledgeNodeLabelsQuery(["shared-node"], languageCode),
      { initialProps: { languageCode: "en" }, wrapper: createWrapper(queryClient) },
    );

    await waitFor(() => expect(result.current.isError).toBe(true));
    rerender({ languageCode: "fr" });
    await waitFor(() => expect(result.current.data?.[0]?.displayLabel).toBe("fr:shared-node"));

    rerender({ languageCode: "en" });
    focusManager.setFocused(false);
    focusManager.setFocused(true);
    await waitFor(() => expect(result.current.data?.[0]?.displayLabel).toBe("en:shared-node"));
    expect(
      resolveLabels.mock.calls.map((call) => (call[1] as { languageCode: string }).languageCode),
    ).toEqual(["en", "fr", "en"]);
    focusManager.setFocused(undefined);
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
    const queryClient = createQueryClient();
    const { result, rerender } = renderHook(
      ({ languageCode }: { languageCode: string }) =>
        useKnowledgeNodeLabelsQuery(nodeIds, languageCode),
      { initialProps: { languageCode: "en" }, wrapper: createWrapper(queryClient) },
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
