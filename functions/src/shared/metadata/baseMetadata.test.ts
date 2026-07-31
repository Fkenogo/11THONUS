import { describe, expect, it } from "vitest";
import { stampCreate, stampUpdate } from "./baseMetadata";

describe("stampCreate", () => {
  it("sets createdBy and updatedBy to the given actor", () => {
    const stamp = stampCreate("actor-1");

    expect(stamp.createdBy).toBe("actor-1");
    expect(stamp.updatedBy).toBe("actor-1");
  });

  it("accepts a null actor for system-initiated writes (TRD10 §10.5)", () => {
    const stamp = stampCreate(null);

    expect(stamp.createdBy).toBeNull();
    expect(stamp.updatedBy).toBeNull();
  });

  it("sets createdAt and updatedAt to the same server-timestamp sentinel", () => {
    const stamp = stampCreate("actor-1");

    expect(stamp.createdAt).toEqual(stamp.updatedAt);
  });
});

describe("stampUpdate", () => {
  it("sets updatedBy to the given actor", () => {
    const stamp = stampUpdate("actor-2");

    expect(stamp.updatedBy).toBe("actor-2");
  });

  it("accepts a null actor for system-initiated writes (TRD10 §10.5)", () => {
    const stamp = stampUpdate(null);

    expect(stamp.updatedBy).toBeNull();
  });

  it("does not include createdAt or createdBy", () => {
    const stamp = stampUpdate("actor-2");

    expect(stamp).not.toHaveProperty("createdAt");
    expect(stamp).not.toHaveProperty("createdBy");
  });
});
