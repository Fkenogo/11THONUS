import { FieldValue } from "firebase-admin/firestore";
import { describe, expect, it } from "vitest";
import { serverTimestamp } from "./serverTimestamp";

describe("serverTimestamp", () => {
  it("returns a Firestore server-timestamp sentinel", () => {
    const result = serverTimestamp();

    expect(result).toBeInstanceOf(FieldValue);
  });
});
