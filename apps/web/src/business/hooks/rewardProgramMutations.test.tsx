import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useUpdateRewardProgramDraftMutation } from "./rewardProgramMutations";
import type { UpdateRewardProgramDraftRequest } from "../api/rewardProgramMutations";

/**
 * `PLATFORM-BASELINE-005A-CORR-001` Finding 3: the Reward Program mutation
 * hooks are mounted once for the whole management page, so a key retained
 * by a retryable failure against one program must never be replayed
 * against a different program (the server binds the key to the request
 * hash, so a mismatched replay deterministically returns a false conflict
 * instead of performing the newly requested action). This exercises the
 * real hook + real `keyForRequest` rotation, capturing the idempotency
 * key each call actually sends.
 */

const capturedKeys: string[] = [];

type CallMode = { mode: "reject"; code: string } | { mode: "resolve" };
let callMode: CallMode = { mode: "resolve" };

vi.mock("../BusinessApiContext", () => ({
  useBusinessApiPlatform: () => ({ auth: {}, functions: {} }),
}));

vi.mock("./useAuthenticatedActor", () => ({
  useAuthenticatedActor: () => ({ status: "ready", actor: { userId: "user-1" } }),
}));

vi.mock("../api/rewardProgramMutations", () => ({
  makeCallUpdateRewardProgramDraft:
    () => async (_actor: unknown, payload: UpdateRewardProgramDraftRequest) => {
      capturedKeys.push(payload.idempotencyKey);
      if (callMode.mode === "reject") {
        throw Object.assign(new Error("callable error"), { code: callMode.code });
      }
      return { data: {} };
    },
}));

function payloadFor(programId: string, description: string) {
  return {
    rewardProgramId: programId,
    versionId: `${programId}-v1`,
    expectedRowVersion: 1,
    rewardDescription: description,
    multipleUnitsAllowed: true,
    sharedLoyaltyNumberAllowed: false,
    effectiveFrom: "2026-09-13T00:00:00.000Z",
    qualifyingNodes: [{ knowledgeNodeId: "node-1", businessDisplayName: null }],
  };
}

function renderMutation() {
  const queryClient = new QueryClient();
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return renderHook(() => useUpdateRewardProgramDraftMutation("biz-1"), { wrapper });
}

describe("useUpdateRewardProgramDraftMutation idempotency key rotation (PLATFORM-BASELINE-005A-CORR-001 Finding 3)", () => {
  beforeEach(() => {
    capturedKeys.length = 0;
    callMode = { mode: "resolve" };
  });

  it("a retryable failure on Program A retains its key for the exact same retry, and an action on Program B rotates to a fresh key", async () => {
    const { result } = renderMutation();

    // Program A, first attempt: fails with the retryable 'unavailable' code.
    callMode = { mode: "reject", code: "unavailable" };
    const payloadA = payloadFor("rp-A", "same content");
    await act(async () => {
      await result.current.mutateAsync(payloadA as never).catch(() => undefined);
    });
    expect(capturedKeys).toHaveLength(1);

    // Retrying the EXACT Program A action retains the key.
    callMode = { mode: "resolve" };
    await act(async () => {
      await result.current.mutateAsync(payloadA as never);
    });
    expect(capturedKeys).toHaveLength(2);
    expect(capturedKeys[1]).toBe(capturedKeys[0]);

    // The next action on Program B must use a NEW key (a fresh reservation,
    // never the retained Program A key, which would surface a false
    // server-side idempotency conflict).
    await act(async () => {
      await result.current.mutateAsync(payloadFor("rp-B", "same content") as never);
    });
    expect(capturedKeys).toHaveLength(3);
    expect(capturedKeys[2]).not.toBe(capturedKeys[0]);
  });

  it("a materially different request for the SAME program also rotates the key", async () => {
    const { result } = renderMutation();

    callMode = { mode: "reject", code: "unavailable" };
    await act(async () => {
      await result.current
        .mutateAsync(payloadFor("rp-A", "original description") as never)
        .catch(() => undefined);
    });
    callMode = { mode: "resolve" };
    await act(async () => {
      await result.current.mutateAsync(payloadFor("rp-A", "edited description") as never);
    });

    expect(capturedKeys).toHaveLength(2);
    expect(capturedKeys[1]).not.toBe(capturedKeys[0]);
  });

  it("a definitive (non-retryable) failure discards the key, so the next call gets a fresh one", async () => {
    const { result } = renderMutation();

    // A validation-failed code is definitive: the key must be discarded so
    // a corrected (or even identical) next request never replays the
    // failed reservation.
    callMode = { mode: "reject", code: "invalid_argument" };
    await act(async () => {
      await result.current
        .mutateAsync(payloadFor("rp-A", "bad request") as never)
        .catch(() => undefined);
    });
    expect(capturedKeys).toHaveLength(1);

    callMode = { mode: "resolve" };
    await act(async () => {
      await result.current.mutateAsync(payloadFor("rp-A", "bad request") as never);
    });
    expect(capturedKeys).toHaveLength(2);
    // The same request text got a FRESH key — proof the definitive failure
    // discarded the held one rather than retaining it.
    expect(capturedKeys[1]).not.toBe(capturedKeys[0]);
  });
});
