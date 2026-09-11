import { describe, expect, it } from "vitest";
import {
  toCallGetAccessibleBusinesses,
  type AccessibleBusinessSummary,
} from "./accessibleBusinesses";

describe("toCallGetAccessibleBusinesses", () => {
  it("sends no identity selector and returns server-authoritative contexts", async () => {
    const contexts: AccessibleBusinessSummary[] = [
      { businessId: "b-1", displayName: "Acme", status: "active", role: "manager" },
    ];
    let payload: Record<string, unknown> | undefined;
    const call = toCallGetAccessibleBusinesses(async (value) => {
      payload = value;
      return { data: contexts };
    });

    await expect(call({ getIdToken: async () => "t", referenceType: "email" })).resolves.toEqual(
      contexts,
    );
    expect(payload).toEqual({ rawToken: "t", referenceType: "email" });
  });
});
