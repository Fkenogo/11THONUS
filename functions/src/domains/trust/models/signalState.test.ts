import { describe, expect, it } from "vitest";
import { createSignalState } from "./signalState";
import { TrustDomainError } from "./trustErrors";

describe("createSignalState", () => {
  it("accepts hasSuccessfulAuthentication = false (default/unverified state)", () => {
    const state = createSignalState({ hasSuccessfulAuthentication: false });
    expect(state).toEqual({ hasSuccessfulAuthentication: false });
  });

  it("accepts hasSuccessfulAuthentication = true", () => {
    const state = createSignalState({ hasSuccessfulAuthentication: true });
    expect(state).toEqual({ hasSuccessfulAuthentication: true });
  });

  it("rejects a non-boolean hasSuccessfulAuthentication value", () => {
    expect(() =>
      createSignalState({ hasSuccessfulAuthentication: "true" as unknown as boolean }),
    ).toThrow(TrustDomainError);
  });

  it("does not accept an accountAgeDays field (derived at read time, never stored per §6.6.4)", () => {
    const state = createSignalState({ hasSuccessfulAuthentication: true });
    expect((state as unknown as Record<string, unknown>).accountAgeDays).toBeUndefined();
  });
});
